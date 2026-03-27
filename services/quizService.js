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
            text: '이 PDF 내용을 바탕으로 객관식 문제 10개를 만들어줘. 각 문제마다 보기 4개, 정답, 해설을 포함해줘.',
          },
        ],
      },
    ],
    store: false,
  });

  return response.output_text;
}

module.exports = {
  generateQuizFromPdf,
};