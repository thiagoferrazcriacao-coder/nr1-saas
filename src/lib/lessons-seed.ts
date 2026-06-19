import { prisma } from '@/lib/prisma'

// Base de vídeos de exemplo (públicos) — PLACEHOLDER.
// Serão trocados pelos vídeos reais do Rafael (Pataro Treinamentos).
const SAMPLE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample'

// Os 10 programas do protocolo NR-1, com 1 vídeo-aula inicial cada.
const SEED_LESSONS = [
  { programNum: 1,  program: 'Gestão do Estresse e Carga de Trabalho',        title: 'Aula 1 — Reconhecendo o estresse no trabalho',        video: 'BigBuckBunny.mp4' },
  { programNum: 2,  program: 'Comunicação Não-Violenta e Relacionamentos',     title: 'Aula 1 — Fundamentos da comunicação saudável',        video: 'ElephantsDream.mp4' },
  { programNum: 3,  program: 'Liderança Saudável e Suporte da Equipe',         title: 'Aula 1 — O papel da liderança no bem-estar',          video: 'ForBiggerBlazes.mp4' },
  { programNum: 4,  program: 'Prevenção e Combate ao Assédio',                 title: 'Aula 1 — O que é e como prevenir o assédio',          video: 'ForBiggerEscapes.mp4' },
  { programNum: 5,  program: 'Clareza de Papéis, Metas e Expectativas',        title: 'Aula 1 — Entendendo papéis e responsabilidades',      video: 'ForBiggerFun.mp4' },
  { programNum: 6,  program: 'Reconhecimento e Valorização',                   title: 'Aula 1 — A importância do reconhecimento',            video: 'ForBiggerJoyrides.mp4' },
  { programNum: 7,  program: 'Autonomia e Organização do Trabalho',            title: 'Aula 1 — Autonomia com responsabilidade',             video: 'ForBiggerMeltdowns.mp4' },
  { programNum: 8,  program: 'Gestão de Mudanças e Segurança no Emprego',      title: 'Aula 1 — Lidando com mudanças organizacionais',       video: 'Sintel.mp4' },
  { programNum: 9,  program: 'Justiça Organizacional e Transparência',         title: 'Aula 1 — Justiça e transparência no dia a dia',       video: 'TearsOfSteel.mp4' },
  { programNum: 10, program: 'Saúde Mental, Acolhimento e Trabalho Remoto',    title: 'Aula 1 — Cuidando da saúde mental da equipe',         video: 'WeAreGoingOnBullrun.mp4' },
]

/**
 * Garante que a biblioteca de vídeos exista. Idempotente: só cria se estiver vazia.
 * Permite demonstrar a plataforma antes do upload dos vídeos reais.
 */
export async function ensureLessons() {
  const count = await prisma.lesson.count()
  if (count > 0) return

  await prisma.lesson.createMany({
    data: SEED_LESSONS.map((l, i) => ({
      programNum:  l.programNum,
      program:     l.program,
      title:       l.title,
      description: 'Conteúdo introdutório do programa (vídeo de demonstração — será substituído pelo material oficial).',
      videoUrl:    `${SAMPLE}/${l.video}`,
      durationSec: 0,
      order:       i,
    })),
  })
}
