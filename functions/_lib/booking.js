// 定金相关的常量和共用逻辑。
// 预约提交后先占住时段，状态是 pending，2 小时内没上传转账截图就当放弃，
// 时段要重新放出来给别人订。放出来的方式很简单：谁来查时段/谁来预约，
// 就顺手把过期的 pending 记录删掉，不需要单独跑定时任务。

export const DEPOSIT_AMOUNT = 10;
export const DEPOSIT_CURRENCY = "AUD";
export const DEPOSIT_PAYID = "+61432618022";
export const HOLD_HOURS = 2;

export async function releaseExpiredBookings(env) {
  await env.DB.prepare(
    "DELETE FROM bookings WHERE deposit_status = 'pending' AND created_at < datetime('now', ?)"
  ).bind("-" + HOLD_HOURS + " hours").run();
}
