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

async function updateStudyStreak(dbClient, userId) {
  const result = await dbClient.query(
    `
    WITH before_user AS (
      SELECT study_streak_days, last_studied_date
      FROM users
      WHERE id = $1
    ),
    updated_user AS (
      UPDATE users
      SET
        study_streak_days = CASE
          WHEN last_studied_date = now()::date
            THEN study_streak_days
          WHEN last_studied_date = now()::date - INTERVAL '1 day'
            THEN study_streak_days + 1
          ELSE 1
        END,
        last_studied_date = now()::date,
        updated_at = now()
      WHERE id = $1
      RETURNING study_streak_days
    )
    SELECT
      updated_user.study_streak_days,
      before_user.last_studied_date IS DISTINCT FROM now()::date AS changed
    FROM updated_user
    CROSS JOIN before_user
    `,
    [userId],
  );

  return result.rows[0];
}

module.exports = {
  upsertUser,
  findIdByFirebaseUid,
  updateStudyStreak,
};
