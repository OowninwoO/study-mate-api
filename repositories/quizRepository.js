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

async function createQuizAttemptWithAnswers(
  dbClient,
  { userId, quizSetId, solvingTime, answers },
) {
  const quizAttemptResult = await dbClient.query(
    `
    INSERT INTO quiz_attempts (user_id, quiz_set_id, solving_time)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, quiz_set_id, solving_time, created_at
    `,
    [userId, quizSetId, solvingTime],
  );

  const quizAttempt = quizAttemptResult.rows[0];
  const values = [];
  const placeholders = answers.map((answer, index) => {
    const offset = index * 3;

    values.push(
      quizAttempt.id,
      answer.quizItemId,
      answer.selectedAnswer,
    );

    return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
  });

  const quizAttemptAnswersResult = await dbClient.query(
    `
    INSERT INTO quiz_attempt_answers (
      attempt_id,
      quiz_item_id,
      selected_answer
    )
    VALUES ${placeholders.join(', ')}
    RETURNING id, attempt_id, quiz_item_id, selected_answer
    `,
    values,
  );

  return {
    quizAttempt,
    quizAttemptAnswers: quizAttemptAnswersResult.rows,
  };
}

async function findQuizAttemptsByUserId(userId) {
  const result = await pool.query(
    `
    SELECT
      qa.id,
      qa.quiz_set_id AS "quizSetId",
      qs.source_title AS "sourceTitle",
      qs.category,
      qa.solving_time AS "solvingTime",
      qa.created_at AS "createdAt",
      COUNT(*)::int AS "totalCount",
      COUNT(*) FILTER (
        WHERE qaa.selected_answer IS NOT NULL
          AND qaa.selected_answer = qi.answer_index
      )::int AS "correctCount",
      COUNT(*) FILTER (
        WHERE qaa.selected_answer IS NOT NULL
          AND qaa.selected_answer <> qi.answer_index
      )::int AS "wrongCount",
      COUNT(*) FILTER (
        WHERE qaa.selected_answer IS NULL
      )::int AS "unansweredCount",
      json_agg(
        json_build_object(
          'id', qaa.id,
          'quizItemId', qi.id,
          'questionNumber', qi.question_number,
          'question', qi.question,
          'options', json_build_array(
            qi.option_1,
            qi.option_2,
            qi.option_3,
            qi.option_4
          ),
          'answerIndex', qi.answer_index,
          'selectedAnswer', qaa.selected_answer,
          'explanation', qi.explanation,
          'isCorrect', (
            qaa.selected_answer IS NOT NULL
            AND qaa.selected_answer = qi.answer_index
          )
        )
        ORDER BY qi.question_number ASC
      ) AS answers
    FROM quiz_attempts qa
    JOIN quiz_sets qs ON qs.id = qa.quiz_set_id
    JOIN quiz_attempt_answers qaa ON qaa.attempt_id = qa.id
    JOIN quiz_items qi ON qi.id = qaa.quiz_item_id
    WHERE qa.user_id = $1
    GROUP BY qa.id, qs.id
    ORDER BY qa.created_at DESC
    `,
    [userId],
  );

  return result.rows;
}

async function findQuizAttemptStatsByUserId(userId) {
  const result = await pool.query(
    `
    WITH attempt_stats AS (
      SELECT
        qa.id,
        qs.category,
        qa.solving_time,
        COUNT(*)::int AS question_count,
        COUNT(*) FILTER (
          WHERE qaa.selected_answer IS NOT NULL
            AND qaa.selected_answer = qi.answer_index
        )::int AS correct_count,
        COUNT(*) FILTER (
          WHERE qaa.selected_answer IS NOT NULL
            AND qaa.selected_answer <> qi.answer_index
        )::int AS wrong_count,
        COUNT(*) FILTER (
          WHERE qaa.selected_answer IS NULL
        )::int AS unanswered_count
      FROM quiz_attempts qa
      JOIN quiz_sets qs ON qs.id = qa.quiz_set_id
      JOIN quiz_attempt_answers qaa ON qaa.attempt_id = qa.id
      JOIN quiz_items qi ON qi.id = qaa.quiz_item_id
      WHERE qa.user_id = $1
      GROUP BY qa.id, qs.category
    ),
    total_stats AS (
      SELECT
        COUNT(*)::int AS attempt_count,
        COALESCE(SUM(question_count), 0)::int AS question_count,
        COALESCE(SUM(correct_count), 0)::int AS correct_count,
        COALESCE(SUM(wrong_count), 0)::int AS wrong_count,
        COALESCE(SUM(unanswered_count), 0)::int AS unanswered_count,
        COALESCE(ROUND(AVG(solving_time)), 0)::int AS average_solving_time
      FROM attempt_stats
    ),
    category_stats AS (
      SELECT
        category,
        COUNT(*)::int AS attempt_count,
        COALESCE(SUM(question_count), 0)::int AS question_count,
        COALESCE(SUM(correct_count), 0)::int AS correct_count,
        COALESCE(SUM(wrong_count), 0)::int AS wrong_count,
        COALESCE(SUM(unanswered_count), 0)::int AS unanswered_count,
        COALESCE(ROUND(AVG(solving_time)), 0)::int AS average_solving_time
      FROM attempt_stats
      GROUP BY category
    )
    SELECT
      json_build_object(
        'total', json_build_object(
          'attemptCount', ts.attempt_count,
          'questionCount', ts.question_count,
          'correctCount', ts.correct_count,
          'wrongCount', ts.wrong_count,
          'unansweredCount', ts.unanswered_count,
          'averageSolvingTime', ts.average_solving_time
        ),
        'categories', COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'category', cs.category,
                'attemptCount', cs.attempt_count,
                'questionCount', cs.question_count,
                'correctCount', cs.correct_count,
                'wrongCount', cs.wrong_count,
                'unansweredCount', cs.unanswered_count,
                'averageSolvingTime', cs.average_solving_time
              )
              ORDER BY cs.category ASC
            )
            FROM category_stats cs
          ),
          '[]'::json
        )
      ) AS stats
    FROM total_stats ts
    `,
    [userId],
  );

  return result.rows[0].stats;
}

module.exports = {
  createQuizSetWithItems,
  findQuizSetsByUserId,
  createQuizAttemptWithAnswers,
  findQuizAttemptsByUserId,
  findQuizAttemptStatsByUserId,
};
