const express = require('express');
const admin = require('../firebase');
const pool = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: '인증 토큰이 없습니다.',
      });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);

    const firebaseUid = firebaseUser.uid;
    const provider = firebaseUser.providerData[0]?.providerId ?? null;
    const email = firebaseUser.email ?? null;
    const displayName = firebaseUser.displayName ?? null;
    const profileImageUrl = firebaseUser.photoURL ?? null;

    const result = await pool.query(
      `
      INSERT INTO users (
        firebase_uid,
        provider,
        email,
        display_name,
        profile_image_url
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (firebase_uid)
      DO UPDATE SET
        provider = EXCLUDED.provider,
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = now()
      RETURNING *
      `,
      [firebaseUid, provider, email, displayName, profileImageUrl],
    );

    res.status(200).json({
      ok: true,
      message: '로그인 성공',
      data: result.rows[0],
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      ok: false,
      message: '로그인 처리 실패',
    });
  }
});

module.exports = router;