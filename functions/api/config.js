// GET /api/config
// 公开接口：接单状态、联系方式、两个分区的价格表和接单说明。
// 结构、顺序（cats/order）还是写死在前端代码里，这里只存会通过后台改的部分。

export async function onRequestGet({ env }) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'site_config'").first();
  if (!row) return Response.json({ error: "站点配置还没初始化" }, { status: 500 });
  return new Response(row.value, { headers: { "Content-Type": "application/json" } });
}
