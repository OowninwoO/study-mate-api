const quizService = require('../services/quizService');

async function createQuizSetFromPdf(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: 'PDF 파일이 필요합니다.',
      });
    }

    const sourceTitle = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    const result = await quizService.createQuizSetFromPdf(
      req.userId,
      sourceTitle,
      req.file.path,
    );

    console.log(JSON.stringify(result, null, 2));

    res.status(200).json({
      ok: true,
      message: '퀴즈 생성 성공',
      data: result,
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      ok: false,
      message: '퀴즈 생성 실패',
    });
  }
}

module.exports = {
  createQuizSetFromPdf,
};
