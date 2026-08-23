// 口令校验共用逻辑。口令原本只来自环境变量 ADMIN_KEY，
// 现在后台可以改口令，改完存进 D1 的 settings 表，之后校验优先用表里的值，
// 表里还没有值（没改过 / 数据库还没跑 migration）就退回环境变量。

export async function getAdminKey(env) {
  try {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'admin_key'").first();
    if (row && row.value) return row.value;
  } catch (e) {}
  return env.ADMIN_KEY;
}

export async function checkAdminKey(request, env) {
  const key = request.headers.get("x-admin-key");
  const current = await getAdminKey(env);
  return !!current && key === current;
}
