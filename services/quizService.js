const fs = require('fs');
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateQuizFromPdf(filePath) {
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
          required: ['quizzes'],
          additionalProperties: false,
        },
      },
    },
    store: false,
  });

  const parsed = JSON.parse(response.output_text);

  return {
    quizzes: parsed.quizzes,
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  generateQuizFromPdf,
};