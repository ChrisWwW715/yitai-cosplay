// POST /api/admin/photos/reorder   { sec:"妆", order:[id1,id2,id3,...] }
// 需要口令。拖拽排序松手后调用，按数组顺序把 sort_order 重写成 0,1,2...

import { checkAdminKey } from "../../../_lib/admin.js";

export async function onRequestPost({ request, env }) {
  if (!(await checkAdminKey(request, env))) {
    return Response.json({ error: "口令不对" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sec = String(body.sec || "").trim();
  const order = Array.isArray(body.order) ? body.order : [];
  if (sec !== "妆" && sec !== "毛") return Response.json({ error: "分区不对" }, { status: 400 });

  const stmts = order.map((id, i) =>
    env.DB.prepare("UPDATE photos SET sort_order = ? WHERE id = ? AND sec = ?").bind(i, Number(id), sec)
  );
  if (stmts.length) await env.DB.batch(stmts);

  return Response.json({ ok: true });
}
