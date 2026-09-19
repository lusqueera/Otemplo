#!/usr/bin/env bash
# Atualiza o IP do subdomínio DuckDNS. Lê DUCKDNS_DOMAIN (só o nome, sem .duckdns.org) e DUCKDNS_TOKEN do .env.
set -euo pipefail
# Lê só as chaves necessárias (o .env tem valores com caracteres especiais; não dá para dar source)
envval() { grep -E "^$1=" /srv/atelier/.env | head -1 | cut -d= -f2- | tr -d ""; }
DUCKDNS_DOMAIN=$(envval DUCKDNS_DOMAIN); DUCKDNS_TOKEN=$(envval DUCKDNS_TOKEN)
[ -n "$DUCKDNS_DOMAIN" ] && [ -n "$DUCKDNS_TOKEN" ] || { echo "DUCKDNS_DOMAIN/DUCKDNS_TOKEN ausentes no .env"; exit 1; }
# ip vazio = o DuckDNS usa o IP de origem da requisição (o da VPS)
result=$(curl -fsS "https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=")
echo "$(date -Is) duckdns: $result"
[ "$result" = "OK" ]
