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

module.exports = {
  createQuizSet,
};
