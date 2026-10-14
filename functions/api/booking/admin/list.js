// GET /api/booking/admin/list
// 给乙太看的：开放了哪些日期、每个预约的客户姓名和联系方式。需要口令。

import { checkAdminKey } from "../../../_lib/admin.js";
import { releaseExpiredBookings } from "../../../_lib/booking.js";

export async function onRequestGet({ request, env }) {
  if (!(await checkAdminKey(request, env))) {
    return Response.json({ error: "口令不对" }, { status: 401 });
  }

  await releaseExpiredBookings(env);

  const dates = await env.DB.prepare(
    "SELECT date, label, start_time, end_time, slot_minutes FROM open_dates ORDER BY date ASC"
  ).all();
  const bookings = await env.DB.prepare(
    "SELECT id, date, slot, name, contact, note, created_at, deposit_status, deposit_proof FROM bookings ORDER BY date ASC, slot ASC"
  ).all();
  const list = bookings.results.map((b) => ({
    ...b,
    deposit_proof: b.deposit_proof ? "/img/" + b.deposit_proof : null,
  }));

  return Response.json({ dates: dates.results, bookings: list });
}
