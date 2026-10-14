// POST   /api/booking/admin/dates  { date:"2026-08-23", label:"8月23日 · 周六", start:"05:00", end:"12:00", minutes:60 }  开放一个日期
// DELETE /api/booking/admin/dates  { date:"2026-08-23" }                        关掉一个日期
// 需要口令，通过请求头 x-admin-key 传，跟后台其他管理操作用同一个口令。
// 同一天再 POST 一次就是改这一天的显示文字/时段设置。

import { checkAdminKey } from "../../../_lib/admin.js";
import { buildSlots } from "../../../_lib/booking.js";

function auth(request, env) {
  return checkAdminKey(request, env);
}

export async function onRequestPost({ request, env }) {
  if (!(await auth(request, env))) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const date = String(body.date || "").trim();
  const label = String(body.label || "").trim().slice(0, 40);
  const start = String(body.start || "").trim();
  const end = String(body.end || "").trim();
  const minutes = Number(body.minutes);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("日期格式要是 2026-08-23 这样");
  if (!label) return bad("请填显示用的文字，比如 8月23日 · 周六");
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return bad("开始/结束时间格式不对");
  if (!Number.isInteger(minutes) || minutes < 15 || minutes > 480) return bad("每段时长要在 15 到 480 分钟之间");

  const slots = buildSlots(start, end, minutes);
  if (!slots.length) return bad("开始到结束之间连一段都放不下，检查一下时间");
  if (slots.length > 48) return bad("时段太多了，把每段时长调长一点");

  // 这一天已经有人约了的话，改完时段之后旧预约的开始时间必须还在新时段里，
  // 不然页面上那一格不会显示"已约满"，别人能再约到重叠的时间。
  const valid = new Set(slots.map(s => s.time));
  const booked = await env.DB.prepare("SELECT slot FROM bookings WHERE date = ?").bind(date).all();
  const orphan = booked.results.map(r => r.slot).filter(s => !valid.has(s));
  if (orphan.length) return bad("这一天已有 " + orphan.join("、") + " 的预约，跟新时段对不上，先取消这些预约再改");

  await env.DB.prepare(
    "INSERT INTO open_dates (date, label, start_time, end_time, slot_minutes) VALUES (?,?,?,?,?) " +
    "ON CONFLICT(date) DO UPDATE SET label=excluded.label, start_time=excluded.start_time, end_time=excluded.end_time, slot_minutes=excluded.slot_minutes"
  ).bind(date, label, start, end, minutes).run();

  return Response.json({ ok: true, slots: slots.length });
}

export async function onRequestDelete({ request, env }) {
  if (!(await auth(request, env))) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const date = String(body.date || "").trim();
  if (!date) return bad("缺少日期");

  await env.DB.prepare("DELETE FROM open_dates WHERE date = ?").bind(date).run();
  return Response.json({ ok: true });
}

function bad(msg) { return Response.json({ error: msg }, { status: 400 }); }
function unauthorized() { return Response.json({ error: "口令不对" }, { status: 401 }); }
