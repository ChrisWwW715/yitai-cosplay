// 定金相关的常量和共用逻辑。
// 预约提交后先占住时段，状态是 pending，2 小时内没上传转账截图就当放弃，
// 时段要重新放出来给别人订。放出来的方式很简单：谁来查时段/谁来预约，
// 就顺手把过期的 pending 记录删掉，不需要单独跑定时任务。

export const DEPOSIT_AMOUNT = 10;
export const DEPOSIT_CURRENCY = "AUD";
export const DEPOSIT_PAYID = "+61432618022";
export const HOLD_HOURS = 2;
export const BOOKING_TZ = "Australia/Melbourne";

export async function releaseExpiredBookings(env) {
  await env.DB.prepare(
    "DELETE FROM bookings WHERE deposit_status = 'pending' AND created_at < datetime('now', ?)"
  ).bind("-" + HOLD_HOURS + " hours").run();
}

// 预约统一开放时间，存的是 UTC ISO 字符串，null 表示没设置、随时能约。
export async function getOpensAt(env) {
  const row = await env.DB.prepare(
    "SELECT value FROM settings WHERE key = 'booking_opens_at'"
  ).first();
  return row ? row.value : null;
}

// 后台填的是墨尔本本地日期+时间（比如 "2026-08-30" "21:00"），这里转成 UTC 存。
// 用两次转换算时区偏移，而不是手写 AEST/AEDT 的换季规则——Intl 自带的时区数据库
// 本来就知道墨尔本什么时候是 +10 什么时候是 +11，没必要自己再判断一遍夏令时。
export function melbourneToUTC(dateStr, timeStr) {
  const guess = new Date(dateStr + "T" + timeStr + ":00Z");
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TZ, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = fmt.formatToParts(guess).reduce((a, x) => { a[x.type] = x.value; return a; }, {});
  const readBackAsUTC = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
  const offsetMs = guess.getTime() - readBackAsUTC.getTime();
  return new Date(guess.getTime() + offsetMs).toISOString();
}
