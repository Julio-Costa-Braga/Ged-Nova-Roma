const RENDER_HOST = 'https://ged-nova-roma-backend.onrender.com';

module.exports = async (req, res) => {
  try {
    const url = RENDER_HOST + req.url;
    const headers = { ...req.headers, host: new URL(RENDER_HOST).host };
    delete headers['x-vercel-id'];
    delete headers['x-forwarded-host'];
    delete headers['content-length'];

    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);
    const fetchRes = await fetch(url, {
      method: req.method,
      headers,
      body
    });

    res.status(fetchRes.status);
    fetchRes.headers.forEach((v, k) => res.setHeader(k, v));
    const text = await fetchRes.text();
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: 'Erro ao conectar com o backend.' });
  }
};
