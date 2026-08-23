// POST /api/booking/reserve
// 公开接口：客户提交预约。用数据库的 UNIQUE(date, slot) 约束做真正的互斥——
// 两个人同时抢同一个时段，数据库只会让先到的那个插入成功，后到的会插入失败，
// 不会出现两个人都订成功的情况。

const SLOTS = ["05:30","06:30","07:30","08:30","09:30","10:30","11:30","12:30","13:30","14:30"];

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return bad("请求格式不对"); }

  const date = String(body.date || "").trim();
  const slot = String(body.slot || "").trim();
  const name = String(body.name || "").trim().slice(0, 60);
  const contact = String(body.contact || "").trim().slice(0, 60);
  const note = String(body.note || "").trim().slice(0, 200);

  if (!SLOTS.includes(slot)) return bad("时间段不对");
  if (!name) return bad("请填写姓名");
  if (!contact) return bad("请填写联系方式");

  const openDate = await env.DB.prepare(
    "SELECT date FROM open_dates WHERE date = ?"
  ).bind(date).first();
  if (!openDate) return bad("这个日期没有开放预约");

  try {
    await env.DB.prepare(
      "INSERT INTO bookings (date, slot, name, contact, note, created_at) VALUES (?,?,?,?,?,?)"
    ).bind(date, slot, name, contact, note, new Date().toISOString()).run();
  } catch (e) {
    if (String(e.message || e).includes("UNIQUE")) {
      return Response.json({ error: "手慢了，这个时间段刚被别人订走了，换一个试试" }, { status: 409 });
    }
    return Response.json({ error: "预约失败，请稍后再试" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

function bad(msg) {
  return Response.json({ error: msg }, { status: 400 });
}
