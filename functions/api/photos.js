// GET /api/photos
// 公开接口：作品墙用的数据，按分区+顺序返回，pics 已经转成能直接用的 /img/ 路径。

export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(
    "SELECT id, sec, cls, name, ar, month, pics FROM photos ORDER BY sec ASC, sort_order ASC"
  ).all();

  const works = rows.results.map((r) => ({
    id: r.id,
    sec: r.sec,
    cls: r.cls,
    name: r.name || "",
    ar: r.ar,
    month: r.month,
    pics: JSON.parse(r.pics).map((key) => "/img/" + key),
  }));

  return Response.json(works);
}
