# Voyage AI

A lightweight AI travel concierge starter with a React frontend and Express backend.

## Run locally

```sh
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Or run both services with Docker Compose:

```sh
docker compose up
```

The frontend runs at http://localhost:5173 and the API at http://localhost:4000.

## Live site — Hostinger VPS

Production: **https://voyage.amitmarathe.com** (Hostinger VPS `189.72.144.75`, nginx, Let's Encrypt HTTPS with auto-renewal).

```bash
scripts/deploy.sh             # upload HEAD, build on the server, switch release, restart API, verify
scripts/deploy.sh --rollback  # switch back to the previous release
```

- The API runs as the `voyage-ai` systemd service on `127.0.0.1:4000`; nginx serves the frontend and proxies `/api/`.
- The live concierge needs `ANTHROPIC_API_KEY` in `/etc/voyage-ai/backend.env` on the server (root-only), then `systemctl restart voyage-ai`.
- Browser access to the API is limited to `ALLOWED_ORIGINS` (set in `deploy/voyage-ai.service`), and nginx rate-limits `/api/concierge/converse` to 10 requests/minute per IP.
