// GET /api/booking/admin/list
// 给乙太看的：开放了哪些日期、每个预约的客户姓名和联系方式。需要口令。

import { checkAdminKey } from "../../../_lib/admin.js";

export async function onRequestGet({ request, env }) {
  if (!(await checkAdminKey(request, env))) {
    return Response.json({ error: "口令不对" }, { status: 401 });
  }

  const dates = await env.DB.prepare(
    "SELECT date, label FROM open_dates ORDER BY date ASC"
  ).all();
  const bookings = await env.DB.prepare(
    "SELECT id, date, slot, name, contact, note, created_at FROM bookings ORDER BY date ASC, slot ASC"
  ).all();

  return Response.json({ dates: dates.results, bookings: bookings.results });
}
