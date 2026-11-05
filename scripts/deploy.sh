#!/usr/bin/env bash
# Deploy Voyage AI (frontend + API) to the Hostinger VPS over SSH.
# Uploads the committed HEAD, builds on the server, switches releases
# atomically, (re)starts the API, and ensures nginx + HTTPS.
#   scripts/deploy.sh            deploy HEAD
#   scripts/deploy.sh --rollback switch back to the previous release
# Env overrides: DEPLOY_HOST, DEPLOY_USER, DEPLOY_KEY, DOMAIN
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-189.72.144.75}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/workforce_hostinger_ed25519}"
DOMAIN="${DOMAIN:-voyage.amitmarathe.com}"
SSH=(ssh -i "$DEPLOY_KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=10 "$DEPLOY_USER@$DEPLOY_HOST")
cd "$(dirname "$0")/.."

REMOTE_SCRIPT=$(cat <<'REMOTE'
set -euo pipefail
WEB=/var/www/$DOMAIN; APP=/opt/voyage-ai
if [ "$MODE" = rollback ]; then
  prev=$(ls -1 $APP/releases | sort | tail -n 2 | head -n 1)
  ln -sfn $APP/releases/$prev/frontend/dist $WEB/current
  ln -sfn $APP/releases/$prev/backend $APP/backend
  systemctl restart voyage-ai; echo "rolled back to $prev"; exit 0
fi
R=$(date +%Y%m%d%H%M%S); REL=$APP/releases/$R
mkdir -p $REL && tar -x -C $REL
echo "› Building release $R"
(cd $REL/backend && npm ci --no-audit --no-fund >/dev/null && npm run build >/dev/null && npm prune --omit=dev >/dev/null)
(cd $REL/frontend && npm ci --no-audit --no-fund >/dev/null && npm run build >/dev/null)
rm -rf $REL/frontend/node_modules

echo "› Activating"
id voyage >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin voyage
mkdir -p /etc/voyage-ai && chmod 700 /etc/voyage-ai
[ -f /etc/voyage-ai/backend.env ] || ( umask 077; echo "ANTHROPIC_API_KEY=" > /etc/voyage-ai/backend.env )  # subshell: umask must not leak
chmod -R a+rX $REL
mkdir -p $WEB && chmod 755 $WEB
ln -sfn $REL/frontend/dist $WEB/current
ln -sfn $REL/backend $APP/backend
cp $REL/deploy/voyage-ai.service /etc/systemd/system/voyage-ai.service
systemctl daemon-reload; systemctl enable voyage-ai >/dev/null 2>&1; systemctl restart voyage-ai
# keep the 5 most recent releases
ls -1d $APP/releases/* | sort | head -n -5 | xargs -r rm -rf

SITE=/etc/nginx/sites-available/$DOMAIN
if [ ! -f "$SITE" ]; then
  cp $REL/deploy/nginx-voyage.conf "$SITE"; ln -sfn "$SITE" /etc/nginx/sites-enabled/$DOMAIN
  if nginx -t 2>/dev/null; then systemctl reload nginx; echo "  nginx site installed"
  else rm -f /etc/nginx/sites-enabled/$DOMAIN "$SITE"; echo "  nginx config invalid — removed, other sites untouched"; exit 1; fi
  certbot --nginx -d $DOMAIN --non-interactive --agree-tos --redirect --register-unsafely-without-email
else
  echo "  nginx site already present (certbot-managed); not overwritten"
  nginx -t 2>/dev/null && systemctl reload nginx
fi
sleep 2; curl -sf http://127.0.0.1:4000/api/health >/dev/null && echo "  API healthy" || { echo "  API not responding"; exit 1; }
REMOTE
)

if [[ "${1:-}" == "--rollback" ]]; then
  "${SSH[@]}" "DOMAIN=$DOMAIN MODE=rollback bash -c $(printf %q "$REMOTE_SCRIPT")" </dev/null
  exit 0
fi

echo "› Uploading $(git rev-parse --short HEAD)"
git archive --format=tar HEAD | "${SSH[@]}" "DOMAIN=$DOMAIN MODE=deploy bash -c $(printf %q "$REMOTE_SCRIPT")"

echo "› Verifying"
code=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN/api/health")
echo "  https://$DOMAIN/api/health → HTTP $code"
[ "$code" = 200 ] && echo "✓ Deployed" || { echo "✗ Unexpected status $code"; exit 1; }
