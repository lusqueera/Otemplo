<p align="center">
  <img src="docs/icon.png" alt="Atelier Noir" width="120" />
</p>

<h1 align="center">O Templo · Atelier Noir</h1>

<p align="center">
  Um sistema pessoal de disciplina: estudo, hábitos, treino e finanças em um só lugar,<br/>
  com a estética de um ateliê noturno — preto, branco e silêncio.
</p>

<p align="center">
  <a href="https://otemplo.duckdns.org/api/docs/"><img alt="API" src="https://img.shields.io/badge/API-online-black?logo=django&logoColor=white" /></a>
  <img alt="Expo" src="https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white" />
  <img alt="Django" src="https://img.shields.io/badge/Django-6.1-092E20?logo=django&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres_%2B_Storage-3FCF8E?logo=supabase&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-lightgrey" />
</p>

---

## Para que serve

A maioria dos apps de produtividade cuida de **uma** coisa: um para hábitos, outro para pomodoro, outro para treino, outro para dinheiro. O Templo parte da ideia de que disciplina é um só músculo, exercitado em quatro frentes que se alimentam:

| Pilar | O que você acompanha | O que o app faz por você |
|---|---|---|
| **Estudos** | matérias, horas, cronograma, flashcards | cronômetro de foco em ciclos que registra as horas sozinho; revisão espaçada; sequência de dias estudando |
| **Hábitos** | rituais diários por período do dia | check por dia da semana, hábitos quantitativos (ex.: 3 L de água), sequência e consistência calculadas dos registros |
| **Treino** | fichas com exercícios, cargas e séries | sessão cronometrada que marca o dia, volume levantado e tonelagem semana a semana |
| **Finanças** | receitas, despesas, aportes, alocação | resumo por mês/trimestre/ano, evolução do patrimônio, teto de despesas |

A **Home** consolida a semana atual dos quatro pilares; o **Perfil** guarda as metas (horas de estudo, treinos por semana, consistência mínima, aporte mensal, teto de gastos) que alimentam todos os indicadores. Nenhum número na tela é fixo — tudo é derivado do que você registrou.

## O intuito

- **Um lugar, uma estética.** Interface escura, tipografia limpa, sem gamificação barulhenta. A ideia é abrir o app e ver o estado real da sua semana em cinco segundos.
- **Dados seus, no seu servidor.** A API roda numa VPS própria, o banco e os arquivos ficam num projeto Supabase seu. Excluir a conta apaga tudo.
- **Medir, não motivar.** Sequências, consistência, retenção de flashcards, tonelagem e patrimônio são calculados no servidor a partir dos registros — sem "índices" inventados.
- **Base para crescer.** Backend em camadas (models → services → serializers → views) com testes e OpenAPI; frontend com dados via TanStack Query e estado local mínimo. Adicionar um pilar novo é repetir o padrão.

## Como funciona

```mermaid
flowchart LR
    subgraph App["📱 app_frontend — Expo / React Native"]
        UI[Telas] --> RQ[TanStack Query<br/>src/api/*]
        RQ --> Client[lib/api.ts<br/>JWT + refresh]
    end

    Client -- HTTPS / JSON camelCase --> Nginx

    subgraph VPS["☁️ VPS — otemplo.duckdns.org"]
        Nginx[nginx + Let's Encrypt] --> Gunicorn[gunicorn]
        Gunicorn --> Django["app_backend — Django + DRF"]
        Timer[systemd timers<br/>keep-alive · DuckDNS · certbot]
    end

    subgraph Supabase["🗄️ Supabase"]
        PG[(PostgreSQL 17)]
        S3[(Storage S3<br/>avatars)]
    end

    Django --> PG
    Django --> S3
    Timer -.-> PG
    Timer -.-> S3
```

```mermaid
sequenceDiagram
    participant U as Usuário
    participant A as App
    participant API as API
    U->>A: inicia sessão de foco (50 min × 4)
    A->>A: cronômetro local (zustand)
    A->>API: POST /study/sessions/ {seconds, subject}
    API->>API: soma horas do dia + horas da matéria
    A->>API: GET /study/stats/
    API-->>A: streak, horas da semana, variação
```

## O projeto

```
Otemplo/
├── app_frontend/   # app Expo (Android · iOS · web) — leia app_frontend/README.md
├── app_backend/    # API Django + deploy da VPS   — leia app_backend/README.md
├── .github/        # CI: testes + deploy automático do backend a cada push na main
└── docs/           # imagens deste README
```

| | Frontend | Backend |
|---|---|---|
| Stack | Expo SDK 57 · React Native · TypeScript · expo-router · TanStack Query · zustand · react-native-paper | Django 6.1 · DRF · SimpleJWT · drf-spectacular · django-storages |
| Dados | JWT em SecureStore, renovação automática | PostgreSQL (Supabase) · Storage S3 (Supabase) |
| Qualidade | `tsc`, `expo lint` | ruff · 23 testes de API · `check --deploy` |
| Entrega | Expo Go / EAS | gunicorn + systemd + nginx + TLS · GitHub Actions |

Documentação da API (Swagger): **https://otemplo.duckdns.org/api/docs/**

## Rodando em 5 minutos

```bash
# backend
cd app_backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # SECRET_KEY, DB_*  (ver README do backend)
python manage.py migrate && python manage.py runserver 0.0.0.0:8000

# frontend (outro terminal)
cd app_frontend
npm install
copy .env.example .env      # EXPO_PUBLIC_API_URL
npx expo start -c
```

Ou aponte o app direto para produção: `EXPO_PUBLIC_API_URL=https://otemplo.duckdns.org`.

## Roadmap

- [ ] Snapshot mensal do patrimônio (hoje a evolução é reconstruída a partir dos fluxos)
- [ ] Notificações locais: citação diária, lembretes de hábitos e desaceleração noturna (preferências já existem no perfil)
- [ ] Recuperação de senha por e-mail
- [ ] Build de distribuição (EAS) e ícone adaptativo revisado
- [ ] Modo offline com fila de mutações

## Licença

MIT — veja [LICENSE](LICENSE).

<p align="center"><sub>"A profundidade do pensamento exige a disciplina do silêncio e repetição intencional."</sub></p>
