// POST /api/admin/photos   { sec, cls, name, ar, month, pics:["data:image/jpeg;base64,...", ...] }
// 需要口令。发布一件新作品：把每张图存进 R2，再往 D1 写一行元数据。
// 新作品排在这个分区最前面，跟以前"发布"按钮 unshift 的效果一样。

import { checkAdminKey } from "../../_lib/admin.js";

export async function onRequestPost({ request, env }) {
  if (!(await checkAdminKey(request, env))) {
    return Response.json({ error: "口令不对" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sec = String(body.sec || "").trim();
  const cls = String(body.cls || "").trim();
  const name = String(body.name || "").trim().slice(0, 60);
  const ar = Number(body.ar);
  const month = String(body.month || "").trim();
  const pics = Array.isArray(body.pics) ? body.pics : [];

  if (sec !== "妆" && sec !== "毛") return bad("分区不对");
  if (!cls) return bad("缺少分类");
  if (!ar || !isFinite(ar)) return bad("缺少画幅比例");
  if (!month) return bad("缺少完成时间");
  if (!pics.length) return bad("至少要有一张照片");

  const uid = crypto.randomUUID();
  const keys = [];
  for (let i = 0; i < pics.length; i++) {
    const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(pics[i]);
    if (!m) return bad("第 " + (i + 1) + " 张照片格式不对");
    const ext = m[1] === "jpeg" ? "jpg" : m[1];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const key = `photos/${uid}-${i}.${ext}`;
    await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: `image/${m[1]}` } });
    keys.push(key);
  }

  const min = await env.DB.prepare(
    "SELECT MIN(sort_order) AS m FROM photos WHERE sec = ?"
  ).bind(sec).first();
  const sortOrder = (min && typeof min.m === "number" ? min.m : 0) - 1;

  const result = await env.DB.prepare(
    "INSERT INTO photos (sec, cls, name, ar, month, pics, sort_order, created_at) VALUES (?,?,?,?,?,?,?,?)"
  ).bind(sec, cls, name, ar, month, JSON.stringify(keys), sortOrder, new Date().toISOString()).run();

  return Response.json({
    ok: true,
    photo: {
      id: result.meta.last_row_id,
      sec, cls, name, ar, month,
      pics: keys.map((k) => "/img/" + k),
    },
  });
}

function bad(msg) { return Response.json({ error: msg }, { status: 400 }); }
