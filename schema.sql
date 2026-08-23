CREATE TABLE IF NOT EXISTS open_dates (
  date TEXT PRIMARY KEY,       -- 格式 2026-08-23
  label TEXT NOT NULL          -- 显示用文字，比如 8月23日 · 周六
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL       -- 目前只存 admin_key，后台改口令后覆盖这一行
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  slot TEXT NOT NULL,          -- 格式 05:30，表示 05:30-06:30 这一小时
  name TEXT NOT NULL,
  contact TEXT NOT NULL,       -- 微信号或电话
  note TEXT,                   -- 角色/需求备注，可空
  created_at TEXT NOT NULL,
  UNIQUE(date, slot)
);
