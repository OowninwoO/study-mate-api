const express = require('express');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/login', verifyFirebaseToken, userController.login);

module.exports = router;
