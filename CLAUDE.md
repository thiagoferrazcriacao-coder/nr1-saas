# SaaS — Análise de Risco Psicossocial (NR-1)

## Objetivo
SaaS multi-tenant para empresas realizarem a avaliação de risco psicossocial exigida pela NR-1 (Norma Regulamentadora nº 1 do MTE), com questionário anônimo por setor, análise por IA e relatório de conformidade.

## Dois lados do produto
1. **EMPRESA** — cria setores, gera links únicos por setor, visualiza relatórios e recomendações
2. **FUNCIONÁRIO** — acessa link do setor, responde questionário anônimo via PWA mobile-first

## Stack
- **Frontend**: Next.js 14 (App Router), TailwindCSS, Recharts
- **Backend**: Next.js API Routes, Prisma ORM, BullMQ (filas)
- **Banco**: PostgreSQL via Supabase
- **IA**: Claude API (claude-haiku-4-5-20251001)
- **Fila**: Redis via Upstash + BullMQ
- **E-mail**: Resend
- **Pagamento**: Stripe
- **Deploy**: Vercel (app) + Railway (worker)

## Estrutura de pastas
```
nr1-saas/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── app/
│   │   ├── r/[token]/          # PWA questionário (funcionário)
│   │   ├── login/              # Login empresa
│   │   ├── painel/             # Dashboard empresa
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── setor/[id]/
│   │   └── api/
│   │       ├── r/[token]/
│   │       ├── auth/
│   │       └── dashboard/
│   ├── lib/
│   │   ├── scoring.ts
│   │   ├── prisma.ts
│   │   └── auth.ts
│   ├── workers/
│   │   └── ai-risk-analysis.ts
│   └── middleware.ts
├── .env.local.example
└── README.md
```

## Regras globais de desenvolvimento
1. NUNCA armazenar IP ou User-Agent de respondentes
2. NUNCA retornar IDs internos nas APIs públicas do questionário
3. Validar TODOS os inputs com Zod
4. TypeScript strict em todos os arquivos
5. try/catch em todas as rotas, mensagens genéricas para o cliente
6. Comentar funções complexas em português
7. Arquivos em kebab-case, componentes em PascalCase

---

## FASE 1 — BANCO DE DADOS (Prisma + PostgreSQL)

```prisma
model Company {
  id               String         @id @default(uuid())
  name             String
  slug             String         @unique
  cnpj             String?
  logoUrl          String?
  stripeCustomerId String?
  plan             String         @default("starter")
  createdAt        DateTime       @default(now())
  sectors          Sector[]
  users            User[]
  subscriptions    Subscription[]
}

model User {
  id           String   @id @default(uuid())
  companyId    String
  email        String   @unique
  passwordHash String
  role         String   @default("ADMIN")
  createdAt    DateTime @default(now())
  company      Company  @relation(fields: [companyId], references: [id])
}

model Subscription {
  id                   String    @id @default(uuid())
  companyId            String
  stripeSubscriptionId String?
  status               String
  plan                 String
  currentPeriodEnd     DateTime?
  company              Company   @relation(fields: [companyId], references: [id])
}

model Sector {
  id        String     @id @default(uuid())
  companyId String
  name      String
  linkToken String     @unique @default(uuid())
  createdAt DateTime   @default(now())
  company   Company    @relation(fields: [companyId], references: [id])
  responses Response[]
}

model Response {
  id         String      @id @default(uuid())
  sectorId   String
  answers    Json        // { questionCode: string, value: number (0-4) }[]
  riskScore  Float?      // 0.0 a 4.0
  riskLevel  String?     // baixo | moderado | alto | critico
  createdAt  DateTime    @default(now())
  sector     Sector      @relation(fields: [sectorId], references: [id])
  aiAnalysis AiAnalysis?
}

model AiAnalysis {
  id             String   @id @default(uuid())
  responseId     String   @unique
  classification Json
  recommendation String
  modelUsed      String
  processedAt    DateTime @default(now())
  response       Response @relation(fields: [responseId], references: [id])
}

model Question {
  id        String  @id @default(uuid())
  code      String  @unique   // ex: "Q01", "Q15"
  topic     String            // nome do tópico
  topicNum  Int               // número do tópico (1-13)
  text      String
  hint      String?           // texto auxiliar entre parênteses
  reverse   Boolean @default(false)  // true = questão positiva (mais = melhor)
  order     Int
}
```

Índices: companyId em todas as tabelas, linkToken em Sector, createdAt em Response.

---

## FASE 2 — QUESTIONÁRIO NR-1 COMPLETO (50 questões)

**Escala**: 0=Nunca | 1=Raramente | 2=Ocasionalmente | 3=Frequentemente | 4=Sempre

**Lógica de reversão**: questões marcadas com [R] são positivas — quanto maior a resposta, MENOR o risco.
Para essas, o score de risco = 4 − valor respondido.

---

### Tópico 01 — Assédio de Qualquer Natureza (Q01–Q05)
Verifica se o colaborador vivencia ou presencia situações de assédio moral, sexual ou conduta desrespeitosa.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q01 | Você já presenciou ou sofreu comentários ofensivos, piadas ou insinuações inadequadas no ambiente de trabalho? | Não |
| Q02 | Você se sente à vontade para relatar situações de assédio moral ou sexual na empresa sem medo de represálias? | **[R]** |
| Q03 | Existe um canal seguro e sigiloso para denunciar assédio na empresa? | **[R]** |
| Q04 | Há casos conhecidos de assédio moral ou sexual que não foram devidamente investigados ou punidos? | Não |
| Q05 | O RH e os gestores demonstram comprometimento real com a prevenção do assédio? | **[R]** |

---

### Tópico 02 — Suporte e Apoio no Ambiente de Trabalho (Q06–Q10)
Verifica se o colaborador percebe apoio suficiente da liderança e dos colegas.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q06 | Você sente que pode contar com seus colegas em momentos de dificuldade? | **[R]** |
| Q07 | Existe apoio da liderança para lidar com desafios relacionados ao trabalho? | **[R]** |
| Q08 | O RH está presente e atuante quando surgem conflitos ou dificuldades no trabalho? | **[R]** |
| Q09 | Os gestores promovem um ambiente saudável e respeitoso? | **[R]** |
| Q10 | Você sente que pode expressar suas dificuldades no trabalho sem ser julgado(a)? | **[R]** |

---

### Tópico 03 — Má Gestão de Mudanças Organizacionais (Q11–Q14)
Verifica como as mudanças na empresa são comunicadas e se geram insegurança.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q11 | Mudanças organizacionais impactaram negativamente seu sentimento de segurança no trabalho? | Não |
| Q12 | Há comunicação clara sobre mudanças que afetam a empresa ou os trabalhadores? | **[R]** |
| Q13 | Você já sentiu que seu emprego estava ameaçado sem explicações claras durante períodos de mudança? | Não |
| Q14 | Existe transparência na comunicação da empresa durante processos de mudança? | **[R]** |

---

### Tópico 04 — Baixa Clareza de Papel ou Função (Q15–Q18)
Verifica se o colaborador entende claramente suas responsabilidades, metas e expectativas.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q15 | Você recebe instruções claras sobre suas responsabilidades no trabalho? | **[R]** |
| Q16 | A comunicação da empresa ajuda você a entender o que é esperado do seu trabalho? | **[R]** |
| Q17 | A comunicação entre equipes e setores contribui para a clareza das suas tarefas? | **[R]** |
| Q18 | Você se sente confortável para pedir esclarecimentos quando não entende suas funções ou prioridades? | **[R]** |

---

### Tópico 05 — Baixas Recompensas e Reconhecimento (Q19–Q21)
Verifica se o colaborador se sente valorizado e reconhecido pelo trabalho que realiza.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q19 | Você sente que seu esforço e desempenho são reconhecidos pela liderança? | **[R]** |
| Q20 | Você recebe feedback construtivo sobre o seu trabalho com regularidade? | **[R]** |
| Q21 | Com que frequência você já se sentiu desmotivado(a) por falta de reconhecimento no trabalho? | Não |

---

### Tópico 06 — Baixo Controle no Trabalho / Falta de Autonomia (Q22–Q25)
Verifica o quanto o colaborador tem autonomia para organizar suas tarefas e tomar decisões.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q22 | Você tem liberdade para tomar decisões sobre como executar suas tarefas diárias? | **[R]** |
| Q23 | A empresa confia na sua capacidade de organizar e gerenciar o próprio trabalho? | **[R]** |
| Q24 | Existe excesso de controle ou burocracia que interfere no seu desempenho? | Não |
| Q25 | Existe excesso de supervisão que impacta negativamente na sua produtividade ou bem-estar? | Não |

---

### Tópico 07 — Baixa Justiça Organizacional (Q26–Q29)
Verifica se o colaborador percebe que as decisões da empresa são justas e equilibradas.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q26 | Você acha justas e claras as formas que a empresa usa para avaliar o seu trabalho? | **[R]** |
| Q27 | Você sente que há igualdade no reconhecimento entre diferentes áreas ou equipes? | **[R]** |
| Q28 | Você sente que há transparência nas decisões de desligamento na empresa? | **[R]** |
| Q29 | Você já presenciou casos de demissões que considerasse injustas? | Não |

---

### Tópico 08 — Eventos Violentos ou Traumáticos (Q30–Q32)
Verifica se o colaborador já foi exposto a situações de violência, ameaças ou eventos marcantes.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q30 | Você já vivenciou ou presenciou alguma situação de violência grave no trabalho (agressão física, ameaça séria ou ataque verbal intenso)? | Não |
| Q31 | Você já passou por algum evento grave no trabalho (acidente sério, situação de risco extremo ou episódio muito impactante)? | Não |
| Q32 | Alguma situação vivida no trabalho já foi tão marcante que deixou medo, choque ou forte abalo emocional? | Não |

---

### Tópico 09 — Baixa Demanda no Trabalho / Subcarga (Q33–Q36)
Verifica se o colaborador percebe falta de atividades, desafios ou tarefas suficientes.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q33 | Você sente que, na maior parte do tempo, tem pouco trabalho a realizar durante sua jornada? | Não |
| Q34 | Você costuma ficar com tempo ocioso no trabalho por falta de tarefas ou demandas claras? | Não |
| Q35 | Você sente que suas habilidades ou conhecimentos são pouco utilizados no seu trabalho? | Não |
| Q36 | Seu trabalho costuma ser pouco desafiador ou repetitivo a ponto de gerar desânimo? | Não |

---

### Tópico 10 — Excesso de Demandas / Sobrecarga (Q37–Q40)
Verifica se o volume e pressão das tarefas estão acima do que o colaborador consegue realizar.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q37 | Você sente que sua carga de trabalho diária é maior do que consegue realizar dentro do horário normal? | Não |
| Q38 | Você frequentemente precisa fazer horas extras ou levar trabalho para casa? | Não |
| Q39 | Você já teve sintomas físicos ou emocionais (exaustão, ansiedade ou insônia) devido ao excesso de trabalho? | Não |
| Q40 | A equipe é dimensionada corretamente para a demanda/quantidade de trabalho existente? | **[R]** |

---

### Tópico 11 — Maus Relacionamentos no Local de Trabalho (Q41–Q43)
Verifica se existem conflitos frequentes, clima negativo ou dificuldades nos relacionamentos.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q41 | Você já evitou colegas ou superiores por causa de desentendimentos frequentes? | Não |
| Q42 | Você percebe rivalidade excessiva ou desnecessária entre colegas ou setores? | Não |
| Q43 | Conflitos no trabalho costumam ser resolvidos de forma justa? | **[R]** |

---

### Tópico 12 — Trabalho em Condições de Difícil Comunicação (Q44–Q47)
Verifica se existem barreiras que dificultam a comunicação clara entre equipe e liderança.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q44 | Você trabalha em condições (turnos diferentes, trabalho externo ou distância física) que dificultam a comunicação? | Não |
| Q45 | A distância física entre você e sua equipe ou liderança dificulta a troca de informações? | Não |
| Q46 | Você já teve dificuldade para receber informações importantes no momento certo por causa da organização do trabalho? | Não |
| Q47 | Você tem acesso fácil aos meios necessários para se comunicar com colegas e liderança durante o trabalho? | **[R]** |

---

### Tópico 13 — Trabalho Remoto e Isolado (Q48–Q50)
Verifica se o trabalho à distância tem gerado sensação de afastamento, solidão ou dificuldade de integração.

| Código | Texto | Reverso |
|--------|-------|---------|
| Q48 | Você trabalha grande parte do tempo de forma remota ou sozinho(a), com pouco contato presencial? | Não |
| Q49 | Você sente que o trabalho remoto ou isolado faz com que se sinta distante da equipe ou da empresa? | Não |
| Q50 | Mesmo trabalhando de forma remota ou isolada, você sente que recebe apoio e acompanhamento adequados da empresa? | **[R]** |

---

## FASE 3 — LÓGICA DE SCORING (src/lib/scoring.ts)

**Escala de entrada**: 0 a 4 por questão  
**Conversão para score de risco**:
- Questão normal: `riskScore = valor` (0=melhor, 4=pior)
- Questão reversa [R]: `riskScore = 4 - valor` (4=melhor vira 0 de risco)

**Score por tópico** = média dos riskScores das questões do tópico (0.0–4.0)  
**Score geral** = média de todos os 50 scores (0.0–4.0)

**Classificação de risco**:

| Score     | Nível    | Cor     | Ação                          |
|-----------|----------|---------|-------------------------------|
| 0.0–1.0   | baixo    | verde   | Manter e monitorar            |
| 1.1–2.0   | moderado | amarelo | Atenção e plano de melhoria   |
| 2.1–3.0   | alto     | laranja | Intervenção necessária        |
| 3.1–4.0   | crítico  | vermelho| Ação imediata obrigatória     |

**Exportar**: `calcScore(answers, questions) → { total, byTopic, riskLevel }`

---

## FASE 4 — MIDDLEWARE DE ANONIMIZAÇÃO (src/middleware.ts)
- Intercepta rotas `/api/r/*`
- Remove IP antes de qualquer log
- Remove User-Agent header
- Adiciona: `X-Anonymous: true`, HSTS, `X-Frame-Options`, `X-Content-Type-Options`
- NÃO intercepta `/api/auth/*` e `/api/dashboard/*`

---

## FASE 5 — APIs BACKEND

### GET /api/r/[token]
- Busca setor pelo linkToken
- Retorna: `{ sectorName, companyName, questions }` — SEM IDs internos
- 404 se token inválido

### POST /api/r/[token]
- Recebe: `{ answers: { questionCode: string, value: number (0-4) }[] }`
- Valida 50 questões respondidas, valores 0–4
- Calcula score via scoring.ts
- Salva Response (sem IP, sem UA)
- Publica job BullMQ "ai-risk-analysis": `{ responseId }`
- Retorna APENAS: `{ message: "Obrigado! Resposta registrada com sucesso." }`

### POST /api/auth/login
- bcrypt + JWT (15min) + refreshToken httpOnly cookie (7 dias)

### POST /api/auth/refresh
### POST /api/auth/logout

### GET /api/dashboard/sectors
### POST /api/dashboard/sectors → cria setor, gera linkToken
### DELETE /api/dashboard/sectors/[id]
### GET /api/dashboard/reports/[sectorId]
### GET /api/dashboard/reports/company
### GET /api/dashboard/reports/[sectorId]/pdf

---

## FASE 6 — WORKER DE IA (src/workers/ai-risk-analysis.ts)

Modelo: `claude-haiku-4-5-20251001`, max_tokens: 800

```
Você é especialista em saúde mental ocupacional, psicologia organizacional e
conformidade com a NR-1 (Norma Regulamentadora nº 1 do MTE).

Analise o seguinte perfil de risco psicossocial de um grupo de colaboradores:

Score geral: {score_total}/4.0 — Nível: {riskLevel}

Scores por tópico:
- Assédio de Qualquer Natureza: {score}/4.0
- Suporte e Apoio: {score}/4.0
- Gestão de Mudanças: {score}/4.0
- Clareza de Papel/Função: {score}/4.0
- Recompensas e Reconhecimento: {score}/4.0
- Controle/Autonomia: {score}/4.0
- Justiça Organizacional: {score}/4.0
- Eventos Traumáticos: {score}/4.0
- Subcarga de Trabalho: {score}/4.0
- Sobrecarga de Trabalho: {score}/4.0
- Relacionamentos: {score}/4.0
- Comunicação: {score}/4.0
- Trabalho Remoto/Isolado: {score}/4.0

Total de respondentes: {totalResponses}

Responda SOMENTE em JSON válido:
{
  "diagnostico": "até 300 chars descrevendo o cenário geral",
  "topicos_criticos": ["tópico com maior risco 1", "tópico 2", "tópico 3"],
  "acoes_imediatas": ["ação 1", "ação 2", "ação 3"],
  "acoes_preventivas": ["ação 1", "ação 2"],
  "adequacao_nr1": {
    "nivel_conformidade": "conforme|atencao|nao_conforme",
    "justificativa": "até 200 chars"
  },
  "prioridade_intervencao": "baixa|media|alta|urgente"
}
```

Retry: 3x com exponential backoff.

---

## FASE 7 — PWA QUESTIONÁRIO (src/app/r/[token]/page.tsx)

- Uma pergunta por vez com tópico e número (ex: "Tópico 1 de 13 — Pergunta 1 de 5")
- Barra de progresso X/50
- Botões 48px+ touch-friendly
- Escala 0–4 com emojis e labels:
  - 0 = 😌 Nunca
  - 1 = 🙂 Raramente
  - 2 = 😐 Às vezes
  - 3 = 😟 Frequentemente
  - 4 = 😰 Sempre
- Texto de contexto/dica (hint) da pergunta exibido em itálico abaixo
- Navegação: Anterior / Próxima / Enviar (na q50)
- Aviso fixo: "🔒 Suas respostas são 100% anônimas"
- Tela de sucesso com animação após envio
- `public/manifest.json` + service worker básico (cache offline das perguntas)
- Cores: branco + azul `#1E40AF`
- Responsivo 375px–428px

---

## FASE 8 — DASHBOARD DA EMPRESA

### /login — formulário email + senha

### /painel — visão geral
- Cards: Total de setores | Total de respostas | Risco médio geral
- Lista de setores: nome, badge de risco, nº de respostas, score médio
- Ações por setor: Ver Relatório | Copiar Link | QR Code
- Botão "Adicionar Setor" → modal com campo de nome

### /painel/setor/[id] — relatório do setor
- Gráfico de radar com os 13 tópicos (recharts)
- Cards por tópico: score + badge de risco
- Recomendações da IA por prioridade
- Badge de conformidade NR-1
- Botão "Exportar PDF"
- Timeline de respostas (gráfico de linha)

### Layout protegido
- Sidebar desktop / hamburguer mobile
- Verificação JWT em cookie — redireciona para /login

---

## FASE 9 — PDF DO RELATÓRIO

`GET /api/dashboard/reports/[sectorId]/pdf`
- HTML → PDF via Puppeteer
- Inclui: cabeçalho empresa/setor, data, scores por tópico, recomendações IA, status NR-1
- Nome: `relatorio-risco-psicossocial-[setor]-[data].pdf`

---

## FASE 10 — VARIÁVEIS DE AMBIENTE (.env.local.example)

```env
DATABASE_URL="postgresql://postgres:[SENHA]@[HOST].supabase.co:5432/postgres"
JWT_SECRET="string-aleatoria-64-chars"
JWT_REFRESH_SECRET="outra-string-aleatoria-diferente"
ANTHROPIC_API_KEY="sk-ant-..."
REDIS_URL="rediss://..."
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@seudominio.com.br"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Ordem de execução
1. FASE 1 → Schema Prisma
2. FASE 2 → Seed das 50 questões
3. FASE 3 → Scoring (escala 0–4)
4. FASE 4 → Middleware anonimização
5. FASE 5 → APIs backend
6. FASE 6 → Worker IA
7. FASE 7 → PWA questionário (50 perguntas, mobile-first)
8. FASE 8 → Dashboard empresa
9. FASE 9 → Geração de PDF
10. FASE 10 → Env vars + README
