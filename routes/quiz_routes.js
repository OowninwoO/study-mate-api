const express = require('express');
const multer = require('multer');
const quizService = require('../services/quizService');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${Date.now()}_${originalName}`);
  },
});

const upload = multer({ storage });

router.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    const result = await quizService.generateQuizFromPdf(req.file.path);
    
    console.log(result);

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
});

module.exports = router;