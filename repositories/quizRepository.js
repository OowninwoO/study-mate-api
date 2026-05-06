const pool = require('../db');

async function createQuizSetWithItems(
  dbClient,
  { userId, sourceTitle, category, quizzes },
) {
  const quizSetResult = await dbClient.query(
    `
    INSERT INTO quiz_sets (user_id, source_title, category)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, source_title, category, created_at
    `,
    [userId, sourceTitle, category],
  );

  const quizSet = quizSetResult.rows[0];
  const values = [];
  const placeholders = quizzes.map((quiz, index) => {
    const offset = index * 9;

    values.push(
      quizSet.id,
      index + 1,
      quiz.question,
      quiz.options[0],
      quiz.options[1],
      quiz.options[2],
      quiz.options[3],
      quiz.answerIndex,
      quiz.explanation,
    );

    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
  });

  const quizItemsResult = await dbClient.query(
    `
    INSERT INTO quiz_items (
      quiz_set_id,
      question_number,
      question,
      option_1,
      option_2,
      option_3,
      option_4,
      answer_index,
      explanation
    )
    VALUES ${placeholders.join(', ')}
    RETURNING *
    `,
    values,
  );

  return {
    quizSet,
    quizItems: quizItemsResult.rows,
  };
}

async function findQuizSetsByUserId(userId) {
  const result = await pool.query(
    `
    SELECT
      qs.id,
      qs.source_title AS "sourceTitle",
      qs.category,
      qs.created_at AS "createdAt",
      json_agg(
        json_build_object(
          'id', qi.id,
          'quizSetId', qi.quiz_set_id,
          'questionNumber', qi.question_number,
          'question', qi.question,
          'options', json_build_array(
            qi.option_1,
            qi.option_2,
            qi.option_3,
            qi.option_4
          ),
          'answerIndex', qi.answer_index,
          'explanation', qi.explanation
        )
        ORDER BY qi.question_number ASC
      ) AS quizzes
    FROM quiz_sets qs
    JOIN quiz_items qi ON qi.quiz_set_id = qs.id
    WHERE qs.user_id = $1
    GROUP BY qs.id
    ORDER BY qs.created_at DESC
    `,
    [userId],
  );

  return result.rows;
}

module.exports = {
  createQuizSetWithItems,
  findQuizSetsByUserId,
};
