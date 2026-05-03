const admin = require('../firebase');
const pool = require('../db');

async function verifyFirebaseToken(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: '인증 토큰이 필요합니다.',
      });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    req.firebaseUid = decodedToken.uid;
    next();
  } catch (e) {
    console.log(e);

    res.status(401).json({
      ok: false,
      message: '유효하지 않은 인증 토큰입니다.',
    });
  }
}

async function authenticateUser(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT id
      FROM users
      WHERE firebase_uid = $1
      `,
      [req.firebaseUid],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    req.userId = result.rows[0].id;
    next();
  } catch (e) {
    console.log(e);

    res.status(500).json({
      ok: false,
      message: '사용자 인증 처리 실패',
    });
  }
}

module.exports = {
  verifyFirebaseToken,
  authenticateUser,
};
