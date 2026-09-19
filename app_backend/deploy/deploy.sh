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
curl -fsS -w "\nHTTP %{http_code}\n" http://127.0.0.1/health/ || { sudo journalctl -u atelier -n 30 --no-pager; exit 1; }
echo "Deploy concluído."
