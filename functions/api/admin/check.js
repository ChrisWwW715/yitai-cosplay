// GET /api/admin/check
// 通用口令校验，进后台（上传/改价格/作品管理/预约管理）之前先过这一关。
// 跟预约管理用的是同一个 ADMIN_KEY，改一处两边都生效。

import { checkAdminKey } from "../../_lib/admin.js";

export async function onRequestGet({ request, env }) {
  if (!(await checkAdminKey(request, env))) {
    return Response.json({ error: "口令不对" }, { status: 401 });
  }
  return Response.json({ ok: true });
}
