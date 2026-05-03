const userService = require('../services/userService');

async function login(req, res) {
  try {
    const user = await userService.login(req.firebaseUid);

    res.status(200).json({
      ok: true,
      message: '로그인 성공',
      data: user,
    });
  } catch (e) {
    console.log(e);

    res.status(500).json({
      ok: false,
      message: '로그인 처리 실패',
    });
  }
}

module.exports = {
  login,
};
