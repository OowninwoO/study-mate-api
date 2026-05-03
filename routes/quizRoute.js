const express = require('express');
const multer = require('multer');
const {
  verifyFirebaseToken,
  authenticateUser,
} = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

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

router.post(
  '/pdf',
  verifyFirebaseToken,
  authenticateUser,
  upload.single('file'),
  quizController.createQuizSetFromPdf,
);

module.exports = router;
