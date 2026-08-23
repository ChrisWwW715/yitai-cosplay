// POST /api/admin/change-key   { newKey: "新口令" }
// 需要在请求头 x-admin-key 里带上当前口令才能改。改完存进 D1 的 settings 表，
// 立刻对所有后台接口生效（上传、改价格、作品管理、预约管理用的是同一个口令）。

import { checkAdminKey } from "../../_lib/admin.js";

export async function onRequestPost({ request, env }) {
  if (!(await checkAdminKey(request, env))) {
    return Response.json({ error: "口令不对" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const newKey = String(body.newKey || "").trim();
  if (!newKey) return Response.json({ error: "请填新口令" }, { status: 400 });
  if (newKey.length < 4) return Response.json({ error: "口令太短，至少 4 位" }, { status: 400 });

  await env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES ('admin_key', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  ).bind(newKey).run();

  return Response.json({ ok: true });
}
