# Templo — API

Backend do app Templo: Django 6.1 + Django REST Framework, autenticação JWT, PostgreSQL (Supabase) e Storage S3 (Supabase) para fotos de perfil.

- Produção: **https://otemplo.duckdns.org** — Swagger em [`/api/docs/`](https://otemplo.duckdns.org/api/docs/), health em `/health/`
- Frontend: [`../app_frontend`](../app_frontend)

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Django 6.1 · DRF 3.18 · drf-spectacular (OpenAPI 3) |
| Auth | SimpleJWT — access 1h, refresh 30d com rotação e blacklist |
| Banco | PostgreSQL 17 (Supabase, via Session pooler) · psycopg2 |
| Arquivos | django-storages → Supabase Storage (S3), bucket público `media` |
| JSON | camelCase na API (`djangorestframework-camel-case`); snake_case no Python |
| Qualidade | ruff (lint + format), testes `APITestCase` |
| Produção | gunicorn + systemd + nginx + Let's Encrypt, deploy por GitHub Actions |

## Estrutura

```
app_backend/
├── core/               # projeto: settings, urls, wsgi, health
├── brain/              # app único, em camadas
│   ├── models/         # base (UUID + timestamps), owned (FK user), user, profile, study, habits, training, finance
│   ├── services/       # regras de negócio: weeks, study, habits, training, finance, stats, avatar, account
│   ├── serializers/    # entrada/saída; `id` = external_id, `user` nunca vem do payload
│   ├── views/          # OwnedViewSet (filtra por usuário) + actions + views de stats
│   ├── management/commands/supabase_keepalive.py
│   ├── tests/          # test_api.py — fluxo completo por domínio
│   ├── urls.py · admin.py · pagination.py
├── deploy/             # scripts e units da VPS (ver "Deploy")
├── pyproject.toml      # ruff
├── requirements.txt
└── .env.example
```

Convenções:
- Todo registro de domínio herda `OwnedModel` (FK `user`) e é exposto pelo `external_id` (UUID) como `id`.
- Cálculos (semanas, streaks, resumos) ficam em `services/`; views e serializers não contêm regra de negócio.
- Semana = segunda a domingo; chave de semana é o ISO da segunda-feira (mesma regra do app).
- Imports sempre no topo do módulo (`ruff` regra `PLC0415`).

## Rodando localmente

Requisitos: Python 3.12+ e um PostgreSQL (local ou o do Supabase).

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows  |  source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
copy .env.example .env          # preencha SECRET_KEY, DB_* e (opcional) SUPABASE_*
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

- Para o celular alcançar a API, use `0.0.0.0` e inclua o IP da máquina em `ALLOWED_HOSTS`.
- Expo Web precisa de CORS: em `DEBUG=1` todas as origens são aceitas.
- Sem `SUPABASE_S3_*` no `.env`, uploads vão para `media/` local.

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `SECRET_KEY` | obrigatória (gere com `python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"`) |
| `DEBUG` | `1` em dev, `0` em produção |
| `ALLOWED_HOSTS` | lista separada por vírgula |
| `DB_NAME/USER/PASSWORD/HOST/PORT`, `DB_SSLMODE` | Postgres. Supabase: host do **Session pooler** (`aws-0-<região>.pooler.supabase.com`, user `postgres.<ref>`, `DB_SSLMODE=require`). O host direto `db.<ref>.supabase.co` é IPv6-only |
| `DB_POOLER=transaction` | só se usar a porta 6543 (desliga server-side cursors) |
| `SUPABASE_PROJECT_URL`, `SUPABASE_S3_ENDPOINT`, `SUPABASE_S3_REGION`, `SUPABASE_S3_BUCKET`, `SUPABASE_S3_ACCESS_KEY`, `SUPABASE_S3_SECRET_KEY` | Storage S3 (Project Settings → Storage → S3) |
| `BEHIND_PROXY`, `SECURE_SSL` | `1` na VPS (nginx + TLS): X-Forwarded-Proto, HSTS, cookies seguros |
| `CORS_ALLOWED_ORIGINS` | origens do Expo Web em produção |
| `EMAIL_*` | SMTP opcional; sem `EMAIL_HOST` usa console |
| `DUCKDNS_DOMAIN`, `DUCKDNS_TOKEN`, `CERTBOT_EMAIL` | DuckDNS e Let's Encrypt (VPS) |

## Qualidade

```bash
ruff check brain core && ruff format brain core   # lint + formatação
python manage.py test brain                        # testes (cria DB de teste no Postgres configurado)
python manage.py check --deploy                    # checagem de produção
python manage.py spectacular --validate --file schema.yaml   # valida o OpenAPI
```

## API

Base: `/api/`. Todos os endpoints exigem `Authorization: Bearer <access>` exceto registro, token e docs. Listas são paginadas (`?page_size=` até 500).

### Autenticação
| Método | Rota | |
|---|---|---|
| POST | `auth/register/` | `{email, password, name, title?}` → `{user, access, refresh}` |
| POST | `auth/token/` | `{email, password}` → `{access, refresh}` |
| POST | `auth/token/refresh/` | `{refresh}` → novo par (refresh antigo entra na blacklist) |
| POST | `auth/logout/` | `{refresh}` |
| GET/PATCH/DELETE | `auth/me/` | usuário; DELETE apaga a conta e todos os dados |
| PUT/DELETE | `auth/me/avatar/` | `{image: "<base64 ou data URI>"}` → grava no Storage e devolve `{avatar: url}` |
| POST | `auth/me/password/` | `{currentPassword, newPassword}` |
| GET/PATCH | `auth/me/profile/` | metas (`studyHours`, `workouts`, `habitsConsistency`, `monthlySavings`, `expenseCeiling`), citações, circadiano |

### Estudo
`study/subjects/`, `study/schedule/?week=|?date=`, `study/flashcards/?due=1&subject=` (+ `POST {id}/review/ {correct}`, `POST reset-due/`), `GET study/hours/?week=`, `POST study/sessions/ {seconds, subject?, date?}`, `GET study/stats/`

### Hábitos
`habits/?week=` (cada item traz `weekly: {"<segunda ISO>": [7 bools]}`), `POST {id}/toggle/ {date?}`, `POST {id}/increment/ {date?}`, `GET habits/consistency/?week=`, `GET habits/stats/?days=30`

### Treino
`training/workouts/` (exercícios aninhados; enviar `exercises` no PATCH substitui a lista), `POST {id}/exercises/{n}/toggle/`, `training/sessions/` (+ `POST finish/ {workout?, durationSeconds, date?}`), `GET training/week/?week=`, `GET training/tonnage/?weeks=6`, `GET training/stats/`

### Finanças
`finance/transactions/?period=month|quarter|year|overview&offset=&kind=` (+ `GET summary/`), `finance/allocation/`, `GET finance/stats/?period=&offset=`, `GET finance/evolution/?months=6`

Detalhes de payload e respostas: `/api/docs/`.

## Deploy (VPS)

Produção roda em `ubuntu@147.15.88.84` (Ubuntu 24.04, Oracle Cloud), em `/srv/atelier`.

| Componente | Detalhe |
|---|---|
| `atelier.service` | gunicorn, 2 workers, socket `/run/atelier/atelier.sock` |
| nginx | site `atelier`; TLS Let's Encrypt para `otemplo.duckdns.org`, HTTP→HTTPS |
| `atelier-keepalive.timer` | 09:00 (America/Sao_Paulo) roda `manage.py supabase_keepalive` — evita a pausa do projeto free do Supabase |
| `duckdns.timer` | a cada 5 min atualiza o IP no DuckDNS |
| `certbot.timer` | renovação automática do certificado |

Scripts em `deploy/`:
- `setup-vps.sh` — bootstrap idempotente (pacotes, firewall iptables 80/443, units, nginx, fuso). `sudo bash deploy/setup-vps.sh`
- `deploy.sh` — pip, `migrate`, `collectstatic`, `check --deploy`, restart, `/health/`
- `setup-tls.sh` — certbot para o domínio do `.env`

**Automático**: push na `main` que toque `app_backend/**` dispara [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml) — ruff + testes (Postgres 17) e depois rsync + `deploy.sh`. Secrets do repositório: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.

**Manual** (Windows, sem rsync):
```bash
git archive --format=tar HEAD app_backend | ssh -i ~/.ssh/ssh-key-2026-09-19.key ubuntu@147.15.88.84 \
  'tar -x --strip-components=1 -C /srv/atelier && bash /srv/atelier/deploy/deploy.sh'
```

Operação:
```bash
sudo systemctl status atelier            # estado
sudo journalctl -u atelier -f            # logs do gunicorn (também em /var/log/atelier/)
sudo systemctl restart atelier           # após alterar .env ou settings
systemctl list-timers                    # keepalive, duckdns, certbot
```

Ao abrir novas portas lembre-se: além do iptables (feito pelo `setup-vps.sh`), a Security List da VCN na Oracle Cloud precisa da regra de ingress.
