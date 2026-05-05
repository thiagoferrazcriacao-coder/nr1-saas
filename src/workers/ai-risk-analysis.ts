import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type JobData = {
  responseId: string
  total: number
  riskLevel: string
  byTopic: { topicNum: number; topic: string; score: number; riskLevel: string }[]
  sectorName: string
}

function buildPrompt(data: JobData): string {
  const topicLines = data.byTopic
    .map((t) => `- ${t.topic}: ${t.score.toFixed(2)}/4.0 (${t.riskLevel})`)
    .join('\n')

  return `Você é especialista em saúde mental ocupacional, psicologia organizacional e conformidade com a NR-1 (Norma Regulamentadora nº 1 do MTE brasileiro).

Analise o seguinte perfil de risco psicossocial de um grupo de colaboradores do setor "${data.sectorName}":

Score geral: ${data.total.toFixed(2)}/4.0 — Nível: ${data.riskLevel}

Scores por tópico:
${topicLines}

Responda SOMENTE em JSON válido, sem texto antes ou depois:
{
  "diagnostico": "parágrafo de até 300 caracteres descrevendo o cenário geral",
  "topicos_criticos": ["tópico com maior risco 1", "tópico 2", "tópico 3"],
  "acoes_imediatas": ["ação concreta 1", "ação concreta 2", "ação concreta 3"],
  "acoes_preventivas": ["ação preventiva 1", "ação preventiva 2"],
  "adequacao_nr1": {
    "nivel_conformidade": "conforme|atencao|nao_conforme",
    "justificativa": "até 200 caracteres explicando o nível de conformidade"
  },
  "prioridade_intervencao": "baixa|media|alta|urgente"
}`
}

async function processJob(job: Job<JobData>) {
  const { responseId } = job.data

  // Verifica se já foi processado
  const existing = await prisma.aiAnalysis.findUnique({ where: { responseId } })
  if (existing) return

  let lastError = ''

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: buildPrompt(job.data) }],
      })

      const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido')

      const classification = JSON.parse(jsonMatch[0])

      await prisma.aiAnalysis.create({
        data: {
          responseId,
          classification,
          recommendation: classification.diagnostico ?? '',
          modelUsed: 'claude-haiku-4-5-20251001',
        },
      })

      console.log(`✅ Análise IA concluída para response ${responseId}`)
      return
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error(`❌ Tentativa ${attempt}/3 falhou:`, lastError)

      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 2000))
      }
    }
  }

  // Salva erro após 3 tentativas
  await prisma.aiAnalysis.create({
    data: {
      responseId,
      classification: { error: lastError },
      recommendation: 'Análise automática falhou. Revisar manualmente.',
      modelUsed: 'claude-haiku-4-5-20251001',
    },
  })
}

async function start() {
  const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  const worker = new Worker<JobData>('ai-risk-analysis', processJob, {
    connection,
    concurrency: 3,
  })

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} concluído`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} falhou:`, err.message)
  })

  console.log('🤖 Worker de análise IA iniciado...')

  process.on('SIGTERM', async () => {
    await worker.close()
    await prisma.$disconnect()
    process.exit(0)
  })
}

start().catch(console.error)
