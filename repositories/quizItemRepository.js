async function createQuizItems(dbClient, quizSetId, quizzes) {
  const values = [];
  const placeholders = quizzes.map((quiz, index) => {
    const offset = index * 9;

    values.push(
      quizSetId,
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

  const result = await dbClient.query(
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

  return result.rows;
}

module.exports = {
  createQuizItems,
};
