const pool = require('../db');

async function upsertUser({
  firebaseUid,
  provider,
  email,
  displayName,
  profileImageUrl,
}) {
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

  return result.rows[0];
}

async function findIdByFirebaseUid(firebaseUid) {
  const result = await pool.query(
    `
    SELECT id
    FROM users
    WHERE firebase_uid = $1
    `,
    [firebaseUid],
  );

  return result.rows[0] ?? null;
}

module.exports = {
  upsertUser,
  findIdByFirebaseUid,
};
