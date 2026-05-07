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

async function getMyQuizSets(req, res) {
  try {
    const quizSets = await quizService.getQuizSetsByUserId(req.userId);

    res.status(200).json({
      ok: true,
      data: quizSets,
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      ok: false,
      message: '퀴즈 목록 조회 실패',
    });
  }
}

async function submitQuiz(req, res) {
  try {
    const { quizSetId, solvingTime, answers } = req.body;
    const result = await quizService.submitQuiz(
      req.userId,
      quizSetId,
      solvingTime,
      answers,
    );

    res.status(200).json({
      ok: true,
      message: '퀴즈 제출 성공',
      data: result,
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      ok: false,
      message: '퀴즈 제출 실패',
    });
  }
}

async function getMyQuizAttempts(req, res) {
  try {
    const quizAttempts = await quizService.getQuizAttemptsByUserId(req.userId);

    res.status(200).json({
      ok: true,
      message: '퀴즈 제출 목록 조회 성공',
      data: quizAttempts,
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      ok: false,
      message: '퀴즈 제출 목록 조회 실패',
    });
  }
}

module.exports = {
  createQuizSetFromPdf,
  getMyQuizSets,
  submitQuiz,
  getMyQuizAttempts,
};
