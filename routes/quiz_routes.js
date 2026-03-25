const express = require('express');
const multer = require('multer');

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

router.post('/pdf', upload.single('file'), (req, res) => {
  console.log(req.file.path);

  res.status(200).json({
    ok: true,
    message: 'PDF 업로드 성공',
  });
});

module.exports = router;