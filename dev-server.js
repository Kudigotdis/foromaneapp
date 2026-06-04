// dev-server.js — simple static file server for E2E tests
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '5mb' }));

// Proxy local /sync/commit to mock server at port 3000 to simplify same-origin testing
const rateLimitCache = {};
const RATE_LIMIT_WINDOW_MS = 120000;
const MAX_ATTEMPTS = 5;

app.post('/sync/commit', async (req, res) => {
	try {
		console.log('Dev server: proxying /sync/commit to mock server, body idempotency=', req.headers['idempotency-key'] || (req.body && req.body.meta && req.body.meta.clientId));
		const upstream = 'http://localhost:3000/sync/commit';
		const headers = { 'Content-Type': 'application/json' };
		if (req.headers['idempotency-key']) headers['Idempotency-Key'] = req.headers['idempotency-key'];
		const body = JSON.stringify(req.body);
		const r = await fetch(upstream, { method: 'POST', headers, body });
		const text = await r.text();
		console.log('Dev proxy: upstream responded', r.status, text.slice(0,200));
		res.status(r.status).send(text);
	} catch (e) {
		console.error('Dev proxy error forwarding to upstream', e && e.stack || e);
		res.status(502).send('Proxy error');
	}
});

app.post('/rate-limit', (req, res) => {
	const body = req.body || {};
	const action = body.action || 'unknown';
	const identifier = String(body.details?.credential || body.details?.email || body.details?.mobile || body.details?.whatsapp || 'anonymous');
	const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
	const key = `${action}:${identifier}:${clientIp}`;
	const now = Date.now();
	const entries = rateLimitCache[key] || [];
	const recent = entries.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
	if (recent.length >= MAX_ATTEMPTS) {
		return res.status(429).json({ ok: false, blocked: true, reason: 'Too many attempts. Try again later.' });
	}
	recent.push(now);
	rateLimitCache[key] = recent;
	return res.json({ ok: true, attempts: recent.length });
});

app.use(express.static(path.resolve(__dirname)));

app.listen(PORT, () => console.log('Dev static server listening on port', PORT));

module.exports = app;
