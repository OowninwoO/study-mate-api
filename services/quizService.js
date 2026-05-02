const fs = require('fs');
const OpenAI = require('openai');
const pool = require('../db');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_QUIZ_CATEGORIES = [
  '국어',
  '영어',
  '수학',
  '사회',
  '과학',
  '역사',
  '경제',
  '경영',
  '법률',
  '의학',
  '공학',
  '컴퓨터/IT',
  '인문',
  '예술',
  '스포츠',
  '일반상식',
  '기타',
];

async function generateQuizFromPdf(sourceTitle, filePath) {
  const uploadedFile = await client.files.create({
    file: fs.createReadStream(filePath),
    purpose: 'user_data',
  });

  const response = await client.responses.create({
    model: 'gpt-5.4',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_file',
            file_id: uploadedFile.id,
          },
          {
            type: 'input_text',
            text: [
              '이 PDF 내용을 바탕으로 객관식 문제를 정확히 10개 만들어줘.',
              '반드시 한국어로 작성해.',
              'PDF 전체 내용을 보고 아래 카테고리 후보 중 가장 적절한 카테고리 하나를 선택해.',
              '후보에 정확히 맞는 카테고리가 없으면 반드시 기타를 선택해.',
              `카테고리 후보: ${JSON.stringify(DEFAULT_QUIZ_CATEGORIES)}`,
              '각 문제는 아래 구조를 따라.',
              '- question: 문제',
              '- options: 보기 4개 문자열 배열',
              '- answerIndex: 정답 보기의 0-based index',
              '- explanation: 해설',
            ].join('\n'),
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'quiz_set',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: DEFAULT_QUIZ_CATEGORIES,
            },
            quizzes: {
              type: 'array',
              minItems: 10,
              maxItems: 10,
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 4,
                    maxItems: 4,
                  },
                  answerIndex: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 3,
                  },
                  explanation: { type: 'string' },
                },
                required: ['question', 'options', 'answerIndex', 'explanation'],
                additionalProperties: false,
              },
            },
          },
          required: ['category', 'quizzes'],
          additionalProperties: false,
        },
      },
    },
    store: false,
  });

  const parsed = JSON.parse(response.output_text);

  return saveQuizSet(sourceTitle, parsed.category, parsed.quizzes);
}

async function saveQuizSet(sourceTitle, category, quizzes) {
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    const quizSetResult = await dbClient.query(
      `
      INSERT INTO quiz_sets (source_title, category)
      VALUES ($1, $2)
      RETURNING id, source_title, category, created_at
      `,
      [sourceTitle, category],
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

    await dbClient.query('COMMIT');

    return {
      id: quizSet.id,
      sourceTitle: quizSet.source_title,
      category: quizSet.category,
      quizzes: quizItemsResult.rows
        .sort((a, b) => a.question_number - b.question_number)
        .map((quizItem) => ({
          id: quizItem.id,
          quizSetId: quizItem.quiz_set_id,
          questionNumber: quizItem.question_number,
          question: quizItem.question,
          options: [
            quizItem.option_1,
            quizItem.option_2,
            quizItem.option_3,
            quizItem.option_4,
          ],
          answerIndex: quizItem.answer_index,
          explanation: quizItem.explanation,
        })),
      createdAt: quizSet.created_at,
    };
  } catch (e) {
    await dbClient.query('ROLLBACK');
    throw e;
  } finally {
    dbClient.release();
  }
}

module.exports = {
  generateQuizFromPdf,
};
