const admin = require('../firebase');
const userRepository = require('../repositories/userRepository');

async function login(firebaseUid) {
  const firebaseUser = await admin.auth().getUser(firebaseUid);

  return userRepository.upsertUser({
    firebaseUid: firebaseUser.uid,
    provider: firebaseUser.providerData[0]?.providerId ?? null,
    email: firebaseUser.email ?? null,
    displayName: firebaseUser.displayName ?? null,
    profileImageUrl: firebaseUser.photoURL ?? null,
  });
}

module.exports = {
  login,
};
