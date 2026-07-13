// Índice de Vídeos — catálogo fixo da biblioteca (Bloco 1 · 13 fatores × 6 vídeos = 78).
// Base: "ÍNDICE DE VÍDEOS" (Matriz de Produção Zelo). Define o TEMA de cada aula, o autor
// e a trilha. O vídeo em si é vinculado por `videoRef` (a chave, ex: "01.5") quando gravado.
// Estrutura fixa por fator: V1,V2 = Rafael · V3,V4 = Annie · V5,V6 = Thiago.
// Trilha: V1,V2,V5 = Gestor · V3,V4,V6 = Colaborador.

export type Author = 'Rafael' | 'Annie' | 'Thiago'
export type Trilha = 'gestor' | 'colaborador'

export type VideoSlot = {
  key: string        // "FF.V" — fator.vídeo (ex: "01.5")
  factorNum: number  // 1–13
  videoNum: number   // 1–6
  author: Author
  trilha: Trilha
  camada: string     // Jurídico | Gestão emocional | Psicológico/técnico | Processo/plataforma
  title: string      // tema da aula
}

// Nome de cada fator (bate com PROGRAMS)
export const FACTOR_NAMES: Record<number, string> = {
  1: 'Assédio de qualquer natureza', 2: 'Falta de suporte e apoio', 3: 'Má gestão de mudanças organizacionais',
  4: 'Baixa clareza de papel e função', 5: 'Baixas recompensas e reconhecimento', 6: 'Baixo controle / Falta de autonomia',
  7: 'Baixa justiça organizacional', 8: 'Eventos violentos ou traumáticos', 9: 'Baixa demanda (Subcarga)',
  10: 'Excesso de demandas (Sobrecarga)', 11: 'Maus relacionamentos no trabalho', 12: 'Trabalho em condições de difícil comunicação',
  13: 'Trabalho remoto e isolado',
}

// Peso jurídico (prioridade de produção) — núcleo alto risco: 01, 07, 08, 10
export const FACTOR_WEIGHT: Record<number, 'ALTO' | 'MÉDIO' | 'BAIXO'> = {
  1: 'ALTO', 2: 'MÉDIO', 3: 'BAIXO', 4: 'MÉDIO', 5: 'MÉDIO', 6: 'MÉDIO', 7: 'ALTO',
  8: 'ALTO', 9: 'BAIXO', 10: 'ALTO', 11: 'MÉDIO', 12: 'BAIXO', 13: 'BAIXO',
}

// Metadados fixos de cada uma das 6 posições
const SLOT_META: { videoNum: number; author: Author; trilha: Trilha; camada: string }[] = [
  { videoNum: 1, author: 'Rafael', trilha: 'gestor',      camada: 'Jurídico' },
  { videoNum: 2, author: 'Rafael', trilha: 'gestor',      camada: 'Gestão emocional' },
  { videoNum: 3, author: 'Annie',  trilha: 'colaborador', camada: 'Gestão emocional' },
  { videoNum: 4, author: 'Annie',  trilha: 'colaborador', camada: 'Psicológico / técnico' },
  { videoNum: 5, author: 'Thiago', trilha: 'gestor',      camada: 'Processo / plataforma' },
  { videoNum: 6, author: 'Thiago', trilha: 'colaborador', camada: 'Processo / plataforma' },
]

// Título (tema) de cada vídeo, por fator (índice 0–5 = V1–V6)
const TITLES: Record<number, [string, string, string, string, string, string]> = {
  1: [
    'Assédio como passivo: dever de apurar, retaliação e prova',
    'Liderança que previne o assédio',
    'Reconhecer o que se está vivendo e a quem recorrer',
    'O que é assédio na NR-1: efeitos e a diferença entre conflito e assédio',
    'O fator no diagnóstico, o canal de denúncias e o plano de ação',
    'Como relatar com segurança: anonimato real e o que vem depois',
  ],
  2: [
    'Omissão da chefia como agravante e o dever de cuidado',
    'Estar disponível sem sufocar: suporte prático e emocional',
    'Pedir ajuda não é fraqueza: como sinalizar a necessidade de apoio',
    'O que caracteriza a falta de apoio e seu impacto na saúde',
    'A leitura do fator no painel e as ações de suporte no plano',
    'Como responder este eixo e a confidencialidade',
  ],
  3: [
    'Mudança mal conduzida, adoecimento e risco de nexo',
    'Comunicar a mudança e reduzir a insegurança da equipe',
    'Lidar com a incerteza: o que sente quem passa por mudança',
    'Por que a mudança mal gerida vira risco psicossocial',
    'O fator no diagnóstico e as medidas no plano',
    'Como responder este eixo',
  ],
  4: [
    'Acúmulo de função, desvio e documentação de papéis',
    'Dar clareza: alinhar expectativa e entrega',
    'A ansiedade da indefinição e como pedir clareza',
    'O que é ambiguidade de papel e seu efeito na saúde mental',
    'O fator no painel e as ações no plano',
    'Como responder este eixo',
  ],
  5: [
    'Desequilíbrio esforço-recompensa e a relação com pedidos judiciais',
    'Reconhecer sem custo: o peso do reconhecimento simbólico',
    'Sentir-se invisível: o que fazer com isso',
    'O modelo Siegrist e o efeito do desequilíbrio',
    'O fator no diagnóstico e as ações no plano',
    'Como responder este eixo',
  ],
  6: [
    'Controle excessivo e a microgestão como risco',
    'Delegar, confiar e dar margem de decisão',
    'A sensação de impotência e como recuperar a agência',
    'O modelo Demanda-Controle: por que a autonomia protege',
    'O fator no painel e as ações no plano',
    'Como responder este eixo',
  ],
  7: [
    'Tratamento desigual, discriminação e risco de ação',
    'Decidir com critério transparente e a percepção de justiça',
    'Injustiça percebida e o adoecimento por ressentimento',
    'Justiça distributiva, processual e interacional (Adams)',
    'O fator no diagnóstico e as ações no plano',
    'Como responder este eixo',
  ],
  8: [
    'Dever de proteção: acidente, trauma e responsabilidade',
    'Acolher a equipe após o evento: protocolo de gestão',
    'Reações normais a um evento anormal e buscar apoio',
    'Trauma ocupacional, estresse pós-evento e sinais',
    'O fator no painel e o protocolo no plano',
    'Como responder este eixo',
  ],
  9: [
    'Subutilização, desvio de função e o risco silencioso',
    'Dar desafio e reengajar quem estagnou',
    'Tédio crônico e desmotivação: nomear o problema',
    'O modelo JD-R: por que fazer pouco também adoece',
    'O fator no diagnóstico e as ações no plano',
    'Como responder este eixo',
  ],
  10: [
    'Burnout, afastamento e nexo: jornada e desconexão',
    'Dimensionar a carga, respeitar limites e não cobrar fora de hora',
    'Reconhecer a exaustão em si e quando pedir ajuda',
    'Karasek e Maslach: o caminho até o burnout',
    'O fator no painel e as ações no plano',
    'Como responder este eixo',
  ],
  11: [
    'O conflito que escala para assédio e o dever de mediar',
    'Mediar cedo e a cultura de respeito',
    'Lidar com o conflito e a comunicação não violenta',
    'Relações humanas (Mayo): clima e coesão',
    'O fator no diagnóstico e as ações no plano',
    'Como responder este eixo',
  ],
  12: [
    'Falha de comunicação, erro e rastreabilidade',
    'Comunicar com clareza e o feedback bidirecional',
    'A frustração do desencontro e como se posicionar',
    'Comunicação organizacional e a assimetria informacional',
    'O fator no painel e as ações no plano',
    'Como responder este eixo',
  ],
  13: [
    'Desconexão, jornada estendida e controle remoto',
    'Incluir a equipe remota e combater a invisibilidade',
    'Solidão profissional e delimitar a jornada',
    'Isolamento, pertencimento e a sobreposição vida-trabalho',
    'O fator no diagnóstico e as ações no plano',
    'Como responder este eixo',
  ],
}

// Monta o catálogo completo (78 slots)
export const VIDEO_INDEX: VideoSlot[] = Object.keys(TITLES).flatMap((k) => {
  const factorNum = Number(k)
  return SLOT_META.map((m, i) => ({
    key: `${String(factorNum).padStart(2, '0')}.${m.videoNum}`,
    factorNum,
    videoNum: m.videoNum,
    author: m.author,
    trilha: m.trilha,
    camada: m.camada,
    title: TITLES[factorNum][i],
  }))
})

/** Slots de um fator numa trilha, em ordem */
export function slotsFor(factorNum: number, trilha: Trilha): VideoSlot[] {
  return VIDEO_INDEX.filter((s) => s.factorNum === factorNum && s.trilha === trilha)
}

/** Fatores que têm ao menos um slot na trilha (todos, na prática) */
export const FACTOR_NUMS = Object.keys(TITLES).map(Number)
