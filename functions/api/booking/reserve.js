// POST /api/booking/reserve
// 公开接口：客户提交预约。用数据库的 UNIQUE(date, slot) 约束做真正的互斥——
// 两个人同时抢同一个时段，数据库只会让先到的那个插入成功，后到的会插入失败，
// 不会出现两个人都订成功的情况。
//
// 预约成功只是"占住"时段，状态是 pending，还要客户转定金、传截图，
// 乙太在后台确认过才算真正锁定。超过 HOLD_HOURS 没传截图，这个时段自动放出去。

import { releaseExpiredBookings, DEPOSIT_AMOUNT, DEPOSIT_CURRENCY, DEPOSIT_PAYID, HOLD_HOURS } from "../../_lib/booking.js";

const SLOTS = ["05:30","06:30","07:30","08:30","09:30","10:30","11:30","12:30","13:30","14:30"];

export async function onRequestPost({ request, env, waitUntil }) {
  let body;
  try { body = await request.json(); } catch (e) { return bad("请求格式不对"); }

  const date = String(body.date || "").trim();
  const slot = String(body.slot || "").trim();
  const name = String(body.name || "").trim().slice(0, 60);
  const contact = String(body.contact || "").trim().slice(0, 60);
  const note = String(body.note || "").trim().slice(0, 200);

  if (!SLOTS.includes(slot)) return bad("时间段不对");
  if (!name) return bad("请填写姓名");
  if (!contact) return bad("请填写联系方式");

  const openDate = await env.DB.prepare(
    "SELECT date FROM open_dates WHERE date = ?"
  ).bind(date).first();
  if (!openDate) return bad("这个日期没有开放预约");

  await releaseExpiredBookings(env);

  const token = crypto.randomUUID();
  let bookingId;
  try {
    const result = await env.DB.prepare(
      "INSERT INTO bookings (date, slot, name, contact, note, created_at, deposit_status, token) VALUES (?,?,?,?,?,?,'pending',?)"
    ).bind(date, slot, name, contact, note, new Date().toISOString(), token).run();
    bookingId = result.meta.last_row_id;
  } catch (e) {
    if (String(e.message || e).includes("UNIQUE")) {
      return Response.json({ error: "手慢了，这个时间段刚被别人订走了，换一个试试" }, { status: 409 });
    }
    return Response.json({ error: "预约失败，请稍后再试" }, { status: 500 });
  }

  notifyNewBooking(env, waitUntil, { date, slot, name, contact, note });

  return Response.json({
    ok: true,
    bookingId,
    token,
    deposit: { amount: DEPOSIT_AMOUNT, currency: DEPOSIT_CURRENCY, payid: DEPOSIT_PAYID, holdHours: HOLD_HOURS },
  });
}

// 新预约用 Server酱推到管理员微信，推送失败不影响预约本身，
// 用 waitUntil 让它在响应发出去之后继续跑，不拖慢客户提交预约的速度。
function notifyNewBooking(env, waitUntil, b) {
  if (!env.SCKEY) return;
  const title = "新预约 " + b.date + " " + b.slot;
  const desp = "**姓名**：" + b.name + "\n\n**联系方式**：" + b.contact + (b.note ? "\n\n**备注**：" + b.note : "") + "\n\n**状态**：待付定金";
  const url = "https://sctapi.ftqq.com/" + env.SCKEY + ".send?title=" + encodeURIComponent(title) + "&desp=" + encodeURIComponent(desp);
  waitUntil(fetch(url).catch(() => {}));
}

function bad(msg) {
  return Response.json({ error: msg }, { status: 400 });
}
