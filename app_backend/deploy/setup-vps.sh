#!/usr/bin/env bash
# Bootstrap da VPS (Ubuntu 24.04). Idempotente: pode rodar de novo sem quebrar nada.
# Uso (na VPS): sudo bash deploy/setup-vps.sh
set -euo pipefail

APP_DIR=/srv/atelier
APP_USER=ubuntu
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Pacotes"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq python3-venv python3-dev build-essential libpq-dev nginx rsync iptables-persistent

echo "==> Diretórios"
mkdir -p "$APP_DIR" "$APP_DIR/staticfiles" "$APP_DIR/media" /var/log/atelier
chown -R "$APP_USER:$APP_USER" "$APP_DIR" /var/log/atelier

echo "==> Firewall (Oracle Cloud usa iptables com REJECT no fim; abre 80/443 antes dele)"
for port in 80 443; do
  if ! iptables -C INPUT -p tcp -m state --state NEW -m tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    iptables -I INPUT 5 -p tcp -m state --state NEW -m tcp --dport "$port" -j ACCEPT
  fi
done
netfilter-persistent save >/dev/null

# nginx (www-data) precisa ler o socket do gunicorn, que pertence ao grupo ubuntu
usermod -aG "$APP_USER" www-data

echo "==> systemd: gunicorn + keepalive"
install -m 644 "$DEPLOY_DIR/atelier.service" /etc/systemd/system/atelier.service
install -m 644 "$DEPLOY_DIR/atelier-keepalive.service" /etc/systemd/system/atelier-keepalive.service
install -m 644 "$DEPLOY_DIR/atelier-keepalive.timer" /etc/systemd/system/atelier-keepalive.timer
install -m 644 "$DEPLOY_DIR/duckdns.service" /etc/systemd/system/duckdns.service
install -m 644 "$DEPLOY_DIR/duckdns.timer" /etc/systemd/system/duckdns.timer
systemctl daemon-reload
systemctl enable atelier.service atelier-keepalive.timer >/dev/null
systemctl start atelier-keepalive.timer
# DuckDNS só liga quando o .env tiver DUCKDNS_DOMAIN/DUCKDNS_TOKEN
if grep -qE '^DUCKDNS_TOKEN=.+' "$APP_DIR/.env" 2>/dev/null; then
  systemctl enable --now duckdns.timer >/dev/null
fi

echo "==> nginx"
install -m 644 "$DEPLOY_DIR/nginx.conf" /etc/nginx/sites-available/atelier
ln -sf /etc/nginx/sites-available/atelier /etc/nginx/sites-enabled/atelier
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx >/dev/null
systemctl restart nginx

echo "==> Fuso horário (o timer do keepalive usa o horário local)"
timedatectl set-timezone America/Sao_Paulo

echo "==> Pronto. Coloque o .env em $APP_DIR/.env e rode: bash $APP_DIR/deploy/deploy.sh"
