// GET /img/photos/xxx.jpg
// 公开接口：把 R2 里存的作品图片吐出来。所有作品图都走这条路径，
// 不单独挂公开 R2 域名，权限和缓存都在这一个地方控制。

export async function onRequestGet({ env, params }) {
  const key = Array.isArray(params.path) ? params.path.join("/") : params.path;
  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}
