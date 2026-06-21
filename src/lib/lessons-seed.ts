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

export { PROGRAMS } from '@/lib/programs'

// Liga cada fator de risco (tópico 1–13) ao programa de vídeo correspondente (1–10).
// É o que permite sugerir automaticamente os vídeos certos a partir do resultado da avaliação.
export const FACTOR_TO_PROGRAM: Record<number, number> = {
  1:  4,  // Assédio                  → Prevenção e Combate ao Assédio
  2:  3,  // Suporte e Apoio          → Liderança Saudável e Suporte da Equipe
  3:  8,  // Gestão de Mudanças       → Gestão de Mudanças e Segurança no Emprego
  4:  5,  // Clareza de Papel         → Clareza de Papéis, Metas e Expectativas
  5:  6,  // Recompensas              → Reconhecimento e Valorização
  6:  7,  // Controle/Autonomia       → Autonomia e Organização do Trabalho
  7:  9,  // Justiça Organizacional   → Justiça Organizacional e Transparência
  8:  10, // Eventos Traumáticos      → Saúde Mental, Acolhimento e Trabalho Remoto
  9:  1,  // Subcarga                 → Gestão do Estresse e Carga de Trabalho
  10: 1,  // Sobrecarga               → Gestão do Estresse e Carga de Trabalho
  11: 2,  // Relacionamentos          → Comunicação Não-Violenta e Relacionamentos
  12: 2,  // Comunicação              → Comunicação Não-Violenta e Relacionamentos
  13: 10, // Trabalho Remoto/Isolado  → Saúde Mental, Acolhimento e Trabalho Remoto
}

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
