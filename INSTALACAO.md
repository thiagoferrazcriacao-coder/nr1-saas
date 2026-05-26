# NR-1 Risk SaaS — Instalação do Zero

> Execute os passos abaixo em ordem. Tempo estimado: **15 minutos**.

---

## Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- [Git](https://git-scm.com)
- [Python 3](https://python.org) *(só para popular o banco — já vem no Mac/Linux)*
- Conta gratuita no [Neon.tech](https://neon.tech) *(PostgreSQL serverless — plano free é suficiente)*
- Conta gratuita na [Anthropic](https://console.anthropic.com) *(para análise de IA)*

---

## 1. Clonar o projeto

```bash
git clone https://github.com/thiagoferrazcriacao-coder/nr1-saas.git
cd nr1-saas
npm install
```

---

## 2. Criar o banco de dados (Neon)

1. Acesse [console.neon.tech](https://console.neon.tech) e crie uma conta gratuita
2. Crie um novo projeto (qualquer nome)
3. Copie a **Connection String** que aparece (começa com `postgresql://...`)
4. Guarde esse valor — você vai usar no passo 4

---

## 3. Gerar as chaves JWT

Execute no terminal:

```bash
node -e "const c=require('crypto');console.log('JWT_SECRET='+c.randomBytes(64).toString('hex'));console.log('JWT_REFRESH_SECRET='+c.randomBytes(64).toString('hex'))"
```

Copie as duas chaves geradas.

---

## 4. Criar o arquivo `.env.local`

Crie o arquivo `.env.local` na raiz do projeto com o conteúdo abaixo (substitua os valores entre `< >`):

```env
DATABASE_URL="<sua connection string do Neon>"
JWT_SECRET="<chave gerada no passo 3>"
JWT_REFRESH_SECRET="<outra chave gerada no passo 3>"
ANTHROPIC_API_KEY="<sua API key da Anthropic>"
REDIS_URL="rediss://PLACEHOLDER"
RESEND_API_KEY="re_PLACEHOLDER"
EMAIL_FROM="noreply@seudominio.com.br"
STRIPE_SECRET_KEY="sk_test_PLACEHOLDER"
STRIPE_WEBHOOK_SECRET="whsec_PLACEHOLDER"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_PLACEHOLDER"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Atenção:** `REDIS_URL`, `RESEND_API_KEY` e `STRIPE_*` podem ficar como PLACEHOLDER por enquanto — o sistema funciona sem eles.

---

## 5. Criar as tabelas e popular o banco

Execute este script Python (funciona no Mac, Linux e Windows):

```bash
python3 setup_db.py
```

> **No Windows**, use `python setup_db.py` ou `py -3 setup_db.py`

Esse script cria todas as tabelas e insere as 50 perguntas NR-1 + usuário admin.

**Credenciais do admin criadas:**
- Email: `admin@minhaempresa.com`
- Senha: `123456`

---

## 6. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000/login](http://localhost:3000/login)

---

## 7. Deploy no Vercel (opcional)

```bash
npm install -g vercel
vercel
```

Na Vercel, adicione as variáveis de ambiente do `.env.local` pelo painel ou com:

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add JWT_REFRESH_SECRET
vercel env add ANTHROPIC_API_KEY
# (repita para cada variável)
```

Depois faça o deploy:

```bash
vercel deploy --prod
```

---

## O que está implementado

| Feature | Status |
|---------|--------|
| Login com JWT + refresh token | ✅ |
| Dashboard multi-tenant (painel) | ✅ |
| Criação de setores com link único | ✅ |
| PWA questionário anônimo (50 perguntas) | ✅ |
| Cálculo de score por tópico (NR-1) | ✅ |
| Análise de IA via Claude Haiku | ✅ |
| Relatório por setor (gráfico radar) | ✅ |
| Relatório geral da empresa | ✅ |
| Matriz de risco NR-1 (Gravidade × Probabilidade) | ✅ |
| Exportação PDF do relatório | ✅ |
| Anonimização total (sem IP/UA) | ✅ |

## O que ainda falta implementar

| Feature | Prioridade |
|---------|-----------|
| Cadastro de novas empresas (self-service) | Alta |
| Envio de e-mail com link do questionário (Resend) | Alta |
| QR Code no painel para o link do setor | Média |
| Planos e pagamento (Stripe) | Média |
| Webhook Stripe (ativar plano após pagamento) | Média |
| Recuperação de senha por e-mail | Média |
| Gráfico de linha (timeline de respostas) | Baixa |
| Modo escuro | Baixa |
| i18n (internacionalização) | Baixa |

---

## Estrutura do projeto

```
nr1-saas/
├── prisma/schema.prisma          # Schema do banco
├── src/
│   ├── app/
│   │   ├── r/[token]/            # PWA questionário (funcionários)
│   │   ├── login/                # Login da empresa
│   │   ├── painel/               # Dashboard
│   │   │   ├── page.tsx          # Visão geral
│   │   │   ├── relatorio-geral/  # Relatório consolidado
│   │   │   └── setor/[id]/       # Relatório por setor
│   │   └── api/                  # Rotas backend
│   ├── lib/
│   │   ├── auth.ts               # JWT + bcrypt
│   │   ├── prisma.ts             # Cliente Prisma
│   │   └── scoring.ts            # Cálculo de risco NR-1
│   └── middleware.ts             # Anonimização de respostas
├── setup_db.py                   # Script de setup do banco
├── CLAUDE.md                     # Especificação completa do produto
└── .env.local                    # Variáveis de ambiente (criar manualmente)
```
