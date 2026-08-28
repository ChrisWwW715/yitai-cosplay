CREATE TABLE IF NOT EXISTS open_dates (
  date TEXT PRIMARY KEY,       -- 格式 2026-08-23
  label TEXT NOT NULL          -- 显示用文字，比如 8月23日 · 周六
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL       -- 目前只存 admin_key，后台改口令后覆盖这一行
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sec TEXT NOT NULL,        -- "妆" 或 "毛"
  cls TEXT NOT NULL,        -- 分类，跟 CFG[sec].cats 里的名字对应
  name TEXT,                -- 角色名与出处，可空
  ar REAL NOT NULL,         -- 封面图宽高比，排版用
  month TEXT NOT NULL,      -- 完成时间，比如 2026.08
  pics TEXT NOT NULL,       -- JSON 数组，存 R2 object key，第一张是封面
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  slot TEXT NOT NULL,          -- 格式 05:30，表示 05:30-06:30 这一小时
  name TEXT NOT NULL,
  contact TEXT NOT NULL,       -- 微信号或电话
  note TEXT,                   -- 角色/需求备注，可空
  created_at TEXT NOT NULL,
  deposit_status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' 待确认定金，'confirmed' 已确认
  deposit_proof TEXT,          -- 客户上传的转账截图，R2 object key，可空
  token TEXT,                  -- 预约时发给客户的随机凭证，客户用它上传截图，不用登录
  UNIQUE(date, slot)
);
