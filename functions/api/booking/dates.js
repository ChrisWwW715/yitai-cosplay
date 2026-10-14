// GET /api/booking/dates
// 公开接口，谁都能查：返回乙太开放的日期，以及每个日期各时段是否已被预订。
// 不需要密码，因为这里不含客户姓名/联系方式，只有"这个时段还空不空"。

import { releaseExpiredBookings, getOpensAt, buildSlots } from "../../_lib/booking.js";

export async function onRequestGet({ env }) {
  await releaseExpiredBookings(env);
  const opensAt = await getOpensAt(env);

  const dates = await env.DB.prepare(
    "SELECT date, label, start_time, end_time, slot_minutes FROM open_dates ORDER BY date ASC"
  ).all();

  const bookedRows = await env.DB.prepare(
    "SELECT date, slot FROM bookings"
  ).all();
  const bookedSet = new Set(bookedRows.results.map(r => r.date + "|" + r.slot));

  const result = dates.results.map(d => ({
    date: d.date,
    label: d.label,
    slots: buildSlots(d.start_time, d.end_time, d.slot_minutes).map(s => ({ ...s, booked: bookedSet.has(d.date + "|" + s.time) }))
  }));

  return Response.json({ opensAt, dates: result });
}
