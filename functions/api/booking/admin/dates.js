// POST   /api/booking/admin/dates  { date:"2026-08-23", label:"8月23日 · 周六" }  开放一个日期
// DELETE /api/booking/admin/dates  { date:"2026-08-23" }                        关掉一个日期
// 需要口令，通过请求头 x-admin-key 传，跟后台其他管理操作用同一个口令。

import { checkAdminKey } from "../../../_lib/admin.js";

function auth(request, env) {
  return checkAdminKey(request, env);
}

export async function onRequestPost({ request, env }) {
  if (!(await auth(request, env))) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const date = String(body.date || "").trim();
  const label = String(body.label || "").trim().slice(0, 40);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("日期格式要是 2026-08-23 这样");
  if (!label) return bad("请填显示用的文字，比如 8月23日 · 周六");

  await env.DB.prepare(
    "INSERT INTO open_dates (date, label) VALUES (?,?) ON CONFLICT(date) DO UPDATE SET label=excluded.label"
  ).bind(date, label).run();

  return Response.json({ ok: true });
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
