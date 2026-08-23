// DELETE /api/admin/photos/123
// 需要口令。删掉一件作品：先删 R2 里的图片文件，再删 D1 那一行。

import { checkAdminKey } from "../../../_lib/admin.js";

export async function onRequestDelete({ request, env, params }) {
  if (!(await checkAdminKey(request, env))) {
    return Response.json({ error: "口令不对" }, { status: 401 });
  }
  const id = Number(params.id);
  if (!id) return Response.json({ error: "缺少作品编号" }, { status: 400 });

  const row = await env.DB.prepare("SELECT pics FROM photos WHERE id = ?").bind(id).first();
  if (!row) return Response.json({ ok: true });

  const keys = JSON.parse(row.pics);
  await Promise.all(keys.map((k) => env.PHOTOS.delete(k)));
  await env.DB.prepare("DELETE FROM photos WHERE id = ?").bind(id).run();

  return Response.json({ ok: true });
}
