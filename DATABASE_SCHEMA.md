# Database Schema

## 1. users

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  firebase_uid VARCHAR(128) NOT NULL UNIQUE,
  provider VARCHAR(50),
  email VARCHAR(255),
  display_name VARCHAR(100),
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 2. quiz_sets

```sql
CREATE TABLE quiz_sets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_title TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 3. quiz_items

```sql
CREATE TABLE quiz_items (
  id BIGSERIAL PRIMARY KEY,
  quiz_set_id BIGINT NOT NULL REFERENCES quiz_sets(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  option_1 TEXT NOT NULL,
  option_2 TEXT NOT NULL,
  option_3 TEXT NOT NULL,
  option_4 TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation TEXT
);
```

## 4. quiz_attempts

```sql
CREATE TABLE quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_set_id BIGINT NOT NULL REFERENCES quiz_sets(id) ON DELETE CASCADE,
  solving_time INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 5. quiz_attempt_answers

```sql
CREATE TABLE quiz_attempt_answers (
  id BIGSERIAL PRIMARY KEY,
  attempt_id BIGINT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  quiz_item_id BIGINT NOT NULL REFERENCES quiz_items(id) ON DELETE CASCADE,
  selected_answer INTEGER
);
```
