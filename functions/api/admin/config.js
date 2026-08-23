// POST /api/admin/config   { open, contact, sections:{ "妆":{price,blocks}, "毛":{price,blocks} } }
// 需要口令。改价格说明、切换接单状态都存到这一行里，整份覆盖写入。

import { checkAdminKey } from "../../_lib/admin.js";

export async function onRequestPost({ request, env }) {
  if (!(await checkAdminKey(request, env))) {
    return Response.json({ error: "口令不对" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.sections) {
    return Response.json({ error: "配置格式不对" }, { status: 400 });
  }

  await env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES ('site_config', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  ).bind(JSON.stringify(body)).run();

  return Response.json({ ok: true });
}
