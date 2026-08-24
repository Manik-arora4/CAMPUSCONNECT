let app;

export default async function handler(req, res) {
  if (!app) {
    const mod = await import('../server/src/app.js');
    app = mod.default;
  }
  return app(req, res);
}
