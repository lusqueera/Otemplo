#!/usr/bin/env bash
# Deploy na VPS: roda depois que o código foi sincronizado em /srv/atelier (pelo GitHub Actions ou manualmente).
# Uso: bash /srv/atelier/deploy/deploy.sh
set -euo pipefail

APP_DIR=/srv/atelier
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "ERRO: $APP_DIR/.env não existe. Crie a partir de .env.example." >&2
  exit 1
fi

echo "==> venv + dependências"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

echo "==> migrate + collectstatic"
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py collectstatic --noinput -v 0

echo "==> checagem de produção"
.venv/bin/python manage.py check --deploy --fail-level ERROR

echo "==> restart"
sudo systemctl restart atelier.service
sleep 2
systemctl is-active --quiet atelier.service || { sudo journalctl -u atelier -n 30 --no-pager; exit 1; }

echo "==> health"
# Com TLS ativo o nginx só atende pelo domínio; resolve-o para 127.0.0.1 para testar a máquina local
DOMAIN="$(grep -E '^DUCKDNS_DOMAIN=' .env | cut -d= -f2- | tr -d '\r')"
if [ -n "$DOMAIN" ] && grep -qs "listen 443" /etc/nginx/sites-available/atelier; then
  HEALTH_URL="https://${DOMAIN}.duckdns.org/health/"
  RESOLVE=(--resolve "${DOMAIN}.duckdns.org:443:127.0.0.1")
else
  HEALTH_URL="http://127.0.0.1/health/"
  RESOLVE=()
fi
curl -fsS "${RESOLVE[@]}" -w "\nHTTP %{http_code}\n" "$HEALTH_URL" || { sudo journalctl -u atelier -n 30 --no-pager; exit 1; }
echo "Deploy concluído."
