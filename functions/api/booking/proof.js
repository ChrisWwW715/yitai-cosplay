// POST /api/booking/proof   { token, proof:"data:image/jpeg;base64,..." }
// 公开接口：客户转完定金后传截图。用预约成功时发的 token 认领是哪一条预约——
// token 是随机 UUID，猜不到，不需要再让客户登录。

export async function onRequestPost({ request, env, waitUntil }) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  const proof = String(body.proof || "");

  if (!token) return bad("缺少预约凭证");
  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(proof);
  if (!m) return bad("截图格式不对");

  const row = await env.DB.prepare(
    "SELECT id, date, slot, name FROM bookings WHERE token = ?"
  ).bind(token).first();
  if (!row) return bad("没找到这个预约，可能已经过期被放出去了，请重新预约");

  // atob 只给二进制字符串，逐字符转 Uint8Array 用 for 循环，
  // 比 Uint8Array.from(str, c=>c.charCodeAt(0)) 快很多，见 admin/photos.js 里同样的处理。
  const binary = atob(m[2]);
  const bytes = new Uint8Array(binary.length);
  for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const key = `deposits/${crypto.randomUUID()}.${ext}`;
  await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: `image/${m[1]}` } });

  await env.DB.prepare("UPDATE bookings SET deposit_proof = ? WHERE id = ?").bind(key, row.id).run();

  notifyProofUploaded(env, waitUntil, row);

  return Response.json({ ok: true });
}

function notifyProofUploaded(env, waitUntil, b) {
  if (!env.SCKEY) return;
  const title = "定金截图已上传 " + b.date + " " + b.slot;
  const desp = "**姓名**：" + b.name + "\n\n去后台预约管理里核对截图，确认后点一下确认。";
  const url = "https://sctapi.ftqq.com/" + env.SCKEY + ".send?title=" + encodeURIComponent(title) + "&desp=" + encodeURIComponent(desp);
  waitUntil(fetch(url).catch(() => {}));
}

function bad(msg) {
  return Response.json({ error: msg }, { status: 400 });
}
