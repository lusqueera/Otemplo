#!/usr/bin/env bash
# Emite o certificado Let's Encrypt para o domínio DuckDNS e ativa HTTPS no nginx.
# Uso (na VPS, após o DNS apontar para o IP): sudo bash /srv/atelier/deploy/setup-tls.sh
set -euo pipefail
# Lê só as chaves necessárias (o .env tem valores com caracteres especiais; não dá para dar source)
envval() { grep -E "^$1=" /srv/atelier/.env | head -1 | cut -d= -f2- | tr -d ""; }
DOMAIN="$(envval DUCKDNS_DOMAIN).duckdns.org"
EMAIL="$(envval CERTBOT_EMAIL)"
[ -n "$EMAIL" ] || { echo "defina CERTBOT_EMAIL no .env"; exit 1; }

apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
sed -i "s/server_name _;/server_name ${DOMAIN};/" /etc/nginx/sites-available/atelier
nginx -t && systemctl reload nginx
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
systemctl list-timers certbot.timer --no-pager | head -2
echo "HTTPS ativo em https://${DOMAIN}. Agora ajuste no .env: SECURE_SSL=1 e ALLOWED_HOSTS com ${DOMAIN}, depois: sudo systemctl restart atelier"
