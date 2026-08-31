// GET    /api/booking/admin/open-time                     查看当前设置的开放时间
// POST   /api/booking/admin/open-time  { date, time }      设置开放时间（墨尔本本地时间）
// DELETE /api/booking/admin/open-time                      取消定时，立即开放
// 都需要口令。

import { checkAdminKey } from "../../../_lib/admin.js";
import { melbourneToUTC } from "../../../_lib/booking.js";

export async function onRequestGet({ request, env }) {
  if (!(await checkAdminKey(request, env))) return unauthorized();
  const row = await env.DB.prepare(
    "SELECT value FROM settings WHERE key = 'booking_opens_at'"
  ).first();
  return Response.json({ opensAt: row ? row.value : null });
}

export async function onRequestPost({ request, env }) {
  if (!(await checkAdminKey(request, env))) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const date = String(body.date || "").trim();
  const time = String(body.time || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("日期格式不对");
  if (!/^\d{2}:\d{2}$/.test(time)) return bad("时间格式不对");

  const opensAt = melbourneToUTC(date, time);
  await env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES ('booking_opens_at', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  ).bind(opensAt).run();

  return Response.json({ ok: true, opensAt });
}

export async function onRequestDelete({ request, env }) {
  if (!(await checkAdminKey(request, env))) return unauthorized();
  await env.DB.prepare("DELETE FROM settings WHERE key = 'booking_opens_at'").run();
  return Response.json({ ok: true });
}

function bad(msg) { return Response.json({ error: msg }, { status: 400 }); }
function unauthorized() { return Response.json({ error: "口令不对" }, { status: 401 }); }
