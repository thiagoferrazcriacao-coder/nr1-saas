# NR-1 Risk — SaaS de Análise de Risco Psicossocial

SaaS multi-tenant para empresas realizarem a avaliação de risco psicossocial exigida pela NR-1, com questionário anônimo por setor, análise por IA e relatório de conformidade.

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (banco PostgreSQL)
- Conta no [Upstash](https://upstash.com) (Redis)
- Conta na [Anthropic](https://console.anthropic.com) (IA)
- Conta no [Resend](https://resend.com) (e-mails)
- Conta no [Stripe](https://stripe.com) (pagamentos)

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
# Edite .env.local com suas chaves reais
```

### 3. Configurar banco de dados

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

### 5. Rodar o worker de IA (separado)

```bash
npx ts-node src/workers/ai-risk-analysis.ts
```

## Deploy

### App (Vercel)

```bash
npm install -g vercel
vercel
```

Configure as variáveis de ambiente no painel da Vercel.

### Worker de IA (Railway)

1. Crie um projeto no [Railway](https://railway.app)
2. Conecte o repositório GitHub
3. Configure as variáveis de ambiente
4. Start command: `npx ts-node src/workers/ai-risk-analysis.ts`

## Estrutura do questionário

- **50 perguntas** divididas em **13 tópicos**
- Escala: 0=Nunca | 1=Raramente | 2=Ocasionalmente | 3=Frequentemente | 4=Sempre
- Score de risco: 0.0 (mínimo) a 4.0 (máximo)
- Níveis: baixo (≤1.0) | moderado (≤2.0) | alto (≤3.0) | crítico (>3.0)

## Anonimato

- Nenhum IP ou User-Agent é armazenado nas respostas
- O link de acesso não contém informações identificáveis do funcionário
- Apenas o setor é associado à resposta
