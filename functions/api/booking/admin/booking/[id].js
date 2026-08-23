// DELETE /api/booking/admin/booking/123
// 客户通过微信取消了，乙太在后台手动放开这个时段。需要口令。

import { checkAdminKey } from "../../../../_lib/admin.js";

export async function onRequestDelete({ request, env, params }) {
  if (!(await checkAdminKey(request, env))) {
    return Response.json({ error: "口令不对" }, { status: 401 });
  }
  const id = Number(params.id);
  if (!id) return Response.json({ error: "缺少预约编号" }, { status: 400 });

  await env.DB.prepare("DELETE FROM bookings WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}
