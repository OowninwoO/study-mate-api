const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/pdf', upload.single('file'), (req, res) => {
  console.log(req.file.path);

  res.status(200).json({
    ok: true,
    message: 'PDF 업로드 성공',
  });
});

module.exports = router;