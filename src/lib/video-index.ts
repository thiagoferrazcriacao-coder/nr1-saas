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

// Metadados fixos de cada uma das 6 posições (camada exata do arquivo Índice de Vídeos)
const SLOT_META: { videoNum: number; author: Author; trilha: Trilha; camada: string }[] = [
  { videoNum: 1, author: 'Rafael', trilha: 'gestor',      camada: 'Jurídico' },
  { videoNum: 2, author: 'Rafael', trilha: 'gestor',      camada: 'Emocional' },
  { videoNum: 3, author: 'Annie',  trilha: 'colaborador', camada: 'Emocional' },
  { videoNum: 4, author: 'Annie',  trilha: 'colaborador', camada: 'Técnico' },
  { videoNum: 5, author: 'Thiago', trilha: 'gestor',      camada: 'Processo' },
  { videoNum: 6, author: 'Thiago', trilha: 'colaborador', camada: 'Processo' },
]

// "Foco do roteiro" de cada vídeo — texto EXATO do arquivo Índice de Vídeos (páginas 4+).
// Índice 0–5 = V1–V6.
const TITLES: Record<number, [string, string, string, string, string, string]> = {
  1: [
    'Assédio moral e sexual como passivo; dever de apurar; retaliação; prova documental de 20 anos',
    'Liderança que previne assédio; onde a pressão vira abuso; conduzir sem normalizar',
    'Reconhecer o que se está vivendo; não é frescura; a quem recorrer',
    'O que é assédio na NR-1; efeitos psíquicos; diferença entre conflito e assédio',
    'Como o fator aparece no diagnóstico; ligação com o canal de denúncias; plano de ação',
    'Como relatar com segurança; anonimato real; o que acontece após responder',
  ],
  2: [
    'Omissão da chefia como agravante de nexo; dever de cuidado',
    'Estar disponível sem sufocar; suporte prático x suporte emocional',
    'Pedir ajuda não é fraqueza; como sinalizar necessidade de apoio',
    'O que caracteriza falta de apoio; impacto no engajamento e na saúde',
    'Leitura do fator no painel; ações de suporte no plano',
    'Como responder este eixo; confidencialidade',
  ],
  3: [
    'Mudança mal conduzida e adoecimento; risco de nexo',
    'Comunicar mudança; reduzir insegurança da equipe',
    'Lidar com incerteza; o que sente quem passa por mudança',
    'Por que mudança mal gerida vira risco psicossocial',
    'Fator no diagnóstico; medidas no plano',
    'Como responder este eixo',
  ],
  4: [
    'Acúmulo de função e desvio; documentação de papéis',
    'Dar clareza; alinhar expectativa e entrega',
    'Ansiedade da indefinição; pedir clareza',
    'O que é ambiguidade de papel; efeito na saúde mental',
    'Fator no painel; ações no plano',
    'Como responder este eixo',
  ],
  5: [
    'Desequilíbrio esforço-recompensa; relação com pedidos judiciais',
    'Reconhecer sem custo; o peso do reconhecimento simbólico',
    'Sentir-se invisível; o que fazer com isso',
    'Modelo Siegrist; efeito do desequilíbrio',
    'Fator no diagnóstico; ações no plano',
    'Como responder este eixo',
  ],
  6: [
    'Controle excessivo; microgestão como risco',
    'Delegar; confiar; dar margem de decisão',
    'Sensação de impotência; recuperar agência',
    'Modelo Demanda-Controle; por que autonomia protege',
    'Fator no painel; ações no plano',
    'Como responder este eixo',
  ],
  7: [
    'Tratamento desigual e discriminação; risco de ação',
    'Decidir com critério transparente; percepção de justiça',
    'Injustiça percebida; adoecimento por ressentimento',
    'Justiça distributiva, processual, interacional (Adams)',
    'Fator no diagnóstico; ações no plano',
    'Como responder este eixo',
  ],
  8: [
    'Dever de proteção; acidente e trauma; responsabilidade',
    'Acolher a equipe após evento; protocolo de gestão',
    'Reações normais a evento anormal; buscar apoio',
    'Trauma ocupacional; estresse pós-evento; sinais',
    'Fator no painel; protocolo no plano',
    'Como responder este eixo',
  ],
  9: [
    'Subutilização e desvio de função; risco silencioso',
    'Dar desafio; reengajar quem estagnou',
    'Tédio crônico e desmotivação; nomear o problema',
    'Modelo JD-R; por que fazer pouco também adoece',
    'Fator no diagnóstico; ações no plano',
    'Como responder este eixo',
  ],
  10: [
    'Burnout, afastamento e nexo; jornada e desconexão; prova de 20 anos',
    'Dimensionar carga; respeitar limites; não cobrar fora de hora',
    'Reconhecer exaustão em si; quando pedir ajuda',
    'Karasek + Maslach; caminho até o burnout',
    'Fator no painel; ações no plano',
    'Como responder este eixo',
  ],
  11: [
    'Conflito que escala para assédio; dever de mediar',
    'Mediar cedo; cultura de respeito',
    'Lidar com conflito; comunicação não violenta',
    'Relações humanas (Mayo); clima e coesão',
    'Fator no diagnóstico; ações no plano',
    'Como responder este eixo',
  ],
  12: [
    'Falha de comunicação e erro; rastreabilidade',
    'Comunicar com clareza; feedback bidirecional',
    'Frustração do desencontro; como se posicionar',
    'Comunicação organizacional; assimetria informacional',
    'Fator no painel; ações no plano',
    'Como responder este eixo',
  ],
  13: [
    'Desconexão e jornada estendida; controle remoto',
    'Incluir a equipe remota; combater invisibilidade',
    'Solidão profissional; delimitar jornada',
    'Isolamento e pertencimento; sobreposição vida-trabalho',
    'Fator no diagnóstico; ações no plano',
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
