-- 0001_init.sql: Pixel Wedding Quest D1 Database Schema (Guestbook, RSVP, Config, Reactions, Admin)

CREATE TABLE IF NOT EXISTS guestbook_entries (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'knight',
  side TEXT NOT NULL DEFAULT 'both',
  title_badge TEXT NOT NULL DEFAULT '🌸 봄날의 하객',
  message TEXT NOT NULL,
  attendance TEXT NOT NULL DEFAULT 'attend',
  companions INTEGER NOT NULL DEFAULT 1,
  meal TEXT NOT NULL DEFAULT 'yes',
  phone TEXT NOT NULL DEFAULT '',
  is_hidden INTEGER NOT NULL DEFAULT 0,
  edit_token_hash TEXT,
  client_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guestbook_invitation_created
  ON guestbook_entries(invitation_id, is_hidden, created_at DESC);

CREATE TABLE IF NOT EXISTS invitation_configs (
  invitation_id TEXT PRIMARY KEY,
  config_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reaction_counters (
  invitation_id TEXT PRIMARY KEY,
  blessing_count INTEGER NOT NULL DEFAULT 128,
  snap_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_settings (
  invitation_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Seed initial reaction counter and initial sample guestbook entries
INSERT OR IGNORE INTO reaction_counters (invitation_id, blessing_count, snap_count, updated_at)
VALUES ('default', 128, 12, '2026-11-08T00:00:00.000Z');

INSERT OR IGNORE INTO guestbook_entries (
  id, invitation_id, name, avatar, side, title_badge, message, attendance, companions, meal, phone, is_hidden, created_at, updated_at
) VALUES
  (
    'gb-seed-1',
    'default',
    '이지훈',
    'knight',
    'groom',
    '🌿 소중한 벗',
    '{groom|아/야} {bride}씨와 결혼 진심으로 축하한다! 두 사람 늘 봄날처럼 행복하길 바랄게.',
    'attend',
    1,
    'yes',
    '',
    0,
    '2026-11-08T01:00:00.000Z',
    '2026-11-08T01:00:00.000Z'
  ),
  (
    'gb-seed-2',
    'default',
    '박수빈',
    'mage',
    'bride',
    '🌸 봄날의 하객',
    '우리 {bride|이/} 세상에서 가장 아름다운 신부야. {date} 기쁜 마음으로 축하하러 갈게!',
    'attend',
    1,
    'yes',
    '',
    0,
    '2026-11-08T01:10:00.000Z',
    '2026-11-08T01:10:00.000Z'
  ),
  (
    'gb-seed-3',
    'default',
    '현우 · 미소 부부',
    'bard',
    'both',
    '💍 축복의 동행',
    '두 분의 새로운 출발을 온 마음으로 축복합니다! 정원 산책 청첩장이 너무 따뜻하고 예뻐요.',
    'attend',
    2,
    'yes',
    '',
    0,
    '2026-11-08T01:20:00.000Z',
    '2026-11-08T01:20:00.000Z'
  ),
  (
    'gb-seed-4',
    'default',
    '고모 · 고모부',
    'healer',
    'groom',
    '🌺 따뜻한 가족',
    '사랑하는 조카의 결혼을 진심으로 축하한다. 서로 아끼고 존중하며 화목한 가정 이루렴!',
    'attend',
    2,
    'yes',
    '',
    0,
    '2026-11-08T01:30:00.000Z',
    '2026-11-08T01:30:00.000Z'
  );
