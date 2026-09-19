# Templo — App (Atelier Noir)

App mobile "Atelier Noir" (Android, iOS e web) de disciplina pessoal em quatro pilares — **Estudos, Hábitos, Treino e Finanças** — com tema escuro minimalista. Feito com Expo SDK 57 / React Native e consumindo a API Django em [`../app_backend`](../app_backend).

## Stack

| Área | Tecnologia |
|---|---|
| Base | Expo SDK 57 · React Native 0.86 · TypeScript · expo-router (rotas por arquivo, tipadas) |
| UI | react-native-paper (Text/Button), react-native-svg (logo, gráficos, anel do cronômetro), @expo/vector-icons |
| Dados do servidor | **TanStack Query v5** — hooks em `src/api/*` |
| Estado de UI | zustand — só cronômetros, semana/mês exibidos, filtros e status de sessão |
| Sessão | JWT em `expo-secure-store` (localStorage no web), renovação automática em 401 |
| Mídia | expo-image-picker → foto em base64 → API grava no Supabase Storage |

## Estrutura

```
app_frontend/
├── app/                        # rotas (expo-router)
│   ├── _layout.tsx             # providers + AnimatedSplash + AuthGate + Stack
│   ├── (tabs)/                 # Home, Estudo, Hábitos, Treino, Finanças
│   └── screens/{login,register,profile}/
├── src/
│   ├── api/                    # React Query: auth, study, habits, training, finance, stats, keys, mappers
│   ├── lib/                    # api.ts (client + sessão JWT), token-storage, week, format, confirm, query-client
│   ├── store/                  # zustand (UI): auth, study, habits, training, finance; profile = tipos/defaults
│   ├── screens/<tela>/         # index.tsx, style.ts, data.ts (tipos/constantes), components/
│   ├── components/             # Sheet, ActionSheet, Field, Stepper, KpiTile, WeekStrip, LineChart, Avatar, AuthGate…
│   └── theme/                  # colors.ts (paleta #131313) e tema do Paper
├── assets/                     # ícone, splash, logo.svg
├── scripts/generate-assets.mjs # gera ícones/splash a partir do logo.svg (sharp)
├── app.json · package.json · tsconfig.json · eslint.config.js
└── .env.example
```

### Como os dados fluem

1. **Telas** chamam hooks de `src/api/` (`useSubjects()`, `useHabits(week)`, `useCreateTransaction()`…). Leitura com `useQuery`, escrita com `useMutation` que invalida o prefixo do domínio (`keys.study.all` etc.).
2. **`src/api/*`** conversa com `src/lib/api.ts`, converte o JSON da API (decimais como string, `HH:MM:SS`) para os tipos do app (`number`, `HH:MM`) e vice-versa. A API já responde em camelCase.
3. **`src/lib/api.ts`** injeta o `Bearer`, tenta um refresh em 401 (fila única; salva o refresh rotacionado) e, se falhar, encerra a sessão — o `AuthGate` redireciona para o login.
4. **zustand** guarda o que é só do aparelho: cronômetro de foco (estudo), cronômetro do treino, semana/dia/mês selecionados, filtro de período e status de auth. Nenhum dado de domínio fica em store.

Regras que evitam bugs já vistos:
- Selectors do zustand devem devolver referência estável — derive listas com `useMemo`, nunca `filter/map` dentro do selector.
- Semana = segunda a domingo; a chave é o ISO da segunda (`weekKey(offset)` em `lib/week.ts`), igual ao backend.
- `data.ts` de cada tela guarda apenas tipos, labels e constantes visuais; nada de seed.

## Rodando

Requisitos: Node 20+, app **Expo Go** no celular (ou emulador Android / simulador iOS) e a API acessível.

```bash
npm install
copy .env.example .env    # ajuste EXPO_PUBLIC_API_URL
npx expo start -c         # -c limpa o cache do Metro (necessário após mudar .env)
```

`EXPO_PUBLIC_API_URL`:
- produção: `https://otemplo.duckdns.org` (padrão do `.env.example`)
- API local em aparelho físico: `http://<IP da máquina>:8000` (e inclua o IP em `ALLOWED_HOSTS` do backend)
- emulador Android: `http://10.0.2.2:8000`
- `localhost` **não funciona** no aparelho — aponta para o próprio celular.

Comandos:

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint (eslint 9)
npm run web            # Expo Web (o backend em DEBUG aceita CORS de qualquer origem)
node scripts/generate-assets.mjs   # regenera ícone/splash a partir de assets/logo.svg
```

> `expo-secure-store` é módulo nativo: em builds de desenvolvimento próprias (não Expo Go) é preciso rebuild (`npx expo run:android`).

## Telas

| Tela | O que faz |
|---|---|
| Login / Registro | e-mail + senha; mensagens de erro da API; sessão persistida |
| Home | resumo da semana atual dos quatro pilares, cronômetros em andamento, hábitos de hoje |
| Estudos | matérias (CRUD, progresso de horas), cronograma por dia/semana, flashcards com revisão espaçada, cronômetro de foco em ciclos (cada ciclo registra horas na API) |
| Hábitos | hábitos por grupo (manhã/foco/corpo/noite), check por dia da semana, hábitos quantitativos (ex.: água), sequência, densidade 30 dias |
| Treino | treinos com exercícios aninhados, treino do dia, sessão cronometrada (fecha e marca o dia), volume e tonelagem semanal |
| Finanças | lançamentos por período (mês/trimestre/ano/geral), resumo, alocação patrimonial, evolução do patrimônio, teto de despesas |
| Perfil | nome/título, foto (câmera/galeria), metas semanais, citações, ritmo circadiano, sair, exclusão de conta |

KPIs, variações percentuais e séries históricas vêm dos endpoints `*/stats/` da API — não há números fixos no app.

## Padrões de UI

- Paleta em `src/theme/colors.ts` (`background #131313`, `card #1B1B1B`, `tile #232323`, texto branco, `muted #A3A3A3`).
- Formulários em bottom-sheet (`Sheet` + `SheetButton`, `Field`, `OptionGroup`, `Stepper`); toque em item abre `ActionSheet` com Editar/Excluir; exclusões passam por `confirmDelete`.
- Navegação de semana/mês com `WeekStrip`/`PeriodCard`; 0 = atual, negativo = passado.

## Build e distribuição

`app.json`: nome **Atelier Noir**, slug `atelier-noir`, scheme `ateliernoir`, pacote `com.ateliernoir.app`, UI escura, splash `#131313`.

```bash
npx expo prebuild          # gera android/ e ios/ se precisar de build nativa local
npx expo run:android       # build de desenvolvimento
eas build -p android       # build de distribuição (requer conta Expo/EAS)
```

Em release, Android bloqueia HTTP em texto claro — use sempre a URL HTTPS da API.
