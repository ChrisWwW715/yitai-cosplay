// GET /api/booking/dates
// 公开接口，谁都能查：返回乙太开放的日期，以及每个日期各时段是否已被预订。
// 不需要密码，因为这里不含客户姓名/联系方式，只有"这个时段还空不空"。

import { releaseExpiredBookings } from "../../_lib/booking.js";

const SLOTS = ["05:30","06:30","07:30","08:30","09:30","10:30","11:30","12:30","13:30","14:30"];

export async function onRequestGet({ env }) {
  await releaseExpiredBookings(env);

  const dates = await env.DB.prepare(
    "SELECT date, label FROM open_dates ORDER BY date ASC"
  ).all();

  const bookedRows = await env.DB.prepare(
    "SELECT date, slot FROM bookings"
  ).all();
  const bookedSet = new Set(bookedRows.results.map(r => r.date + "|" + r.slot));

  const result = dates.results.map(d => ({
    date: d.date,
    label: d.label,
    slots: SLOTS.map(s => ({ time: s, booked: bookedSet.has(d.date + "|" + s) }))
  }));

  return Response.json(result);
}
