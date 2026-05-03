const pool = require('../db');

async function createQuizSet(dbClient, { userId, sourceTitle, category }) {
  const result = await dbClient.query(
    `
    INSERT INTO quiz_sets (user_id, source_title, category)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, source_title, category, created_at
    `,
    [userId, sourceTitle, category],
  );

  return result.rows[0];
}

async function findQuizSetsByUserId(userId) {
  const result = await pool.query(
    `
    SELECT
      qs.id AS quiz_set_id,
      qs.source_title,
      qs.category,
      qs.created_at,
      qi.id AS quiz_item_id,
      qi.question_number,
      qi.question,
      qi.option_1,
      qi.option_2,
      qi.option_3,
      qi.option_4,
      qi.answer_index,
      qi.explanation
    FROM quiz_sets qs
    LEFT JOIN quiz_items qi ON qi.quiz_set_id = qs.id
    WHERE qs.user_id = $1
    ORDER BY qs.created_at DESC, qi.question_number ASC
    `,
    [userId],
  );

  return result.rows;
}

module.exports = {
  createQuizSet,
  findQuizSetsByUserId,
};
