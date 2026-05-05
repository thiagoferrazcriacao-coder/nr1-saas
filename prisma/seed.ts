import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const questions = [
  // Tópico 01 — Assédio de Qualquer Natureza
  {
    code: 'Q01', topic: 'Assédio de Qualquer Natureza', topicNum: 1, order: 1, reverse: false,
    text: 'Você já presenciou ou sofreu comentários ofensivos, piadas ou insinuações inadequadas no ambiente de trabalho?',
    hint: 'Responda pensando se já presenciou ou sofreu esse tipo de situação no trabalho.',
  },
  {
    code: 'Q02', topic: 'Assédio de Qualquer Natureza', topicNum: 1, order: 2, reverse: true,
    text: 'Você se sente à vontade para relatar situações de assédio moral ou sexual na empresa sem medo de represálias?',
    hint: 'Responda se você se sente seguro(a) para relatar situações de assédio na empresa.',
  },
  {
    code: 'Q03', topic: 'Assédio de Qualquer Natureza', topicNum: 1, order: 3, reverse: true,
    text: 'Existe um canal seguro e sigiloso para denunciar assédio na empresa?',
    hint: 'Responda se a empresa oferece um meio seguro para denunciar assédio e outras situações.',
  },
  {
    code: 'Q04', topic: 'Assédio de Qualquer Natureza', topicNum: 1, order: 4, reverse: false,
    text: 'Há casos conhecidos de assédio moral ou sexual que não foram devidamente investigados ou punidos?',
    hint: 'Responda se você percebe que situações de assédio não são tratadas corretamente.',
  },
  {
    code: 'Q05', topic: 'Assédio de Qualquer Natureza', topicNum: 1, order: 5, reverse: true,
    text: 'O RH e os gestores demonstram comprometimento real com a prevenção do assédio?',
    hint: null,
  },

  // Tópico 02 — Suporte e Apoio no Ambiente de Trabalho
  {
    code: 'Q06', topic: 'Suporte e Apoio no Ambiente de Trabalho', topicNum: 2, order: 6, reverse: true,
    text: 'Você sente que pode contar com seus colegas em momentos de dificuldade?',
    hint: 'Responda se você sente que pode contar com seus colegas quando precisa.',
  },
  {
    code: 'Q07', topic: 'Suporte e Apoio no Ambiente de Trabalho', topicNum: 2, order: 7, reverse: true,
    text: 'Existe apoio da liderança para lidar com desafios relacionados ao trabalho?',
    hint: 'Responda se seus gestores ajudam quando surgem dificuldades no trabalho.',
  },
  {
    code: 'Q08', topic: 'Suporte e Apoio no Ambiente de Trabalho', topicNum: 2, order: 8, reverse: true,
    text: 'O RH está presente e atuante quando surgem conflitos ou dificuldades no trabalho?',
    hint: 'Responda se o RH costuma apoiar quando há conflitos ou problemas.',
  },
  {
    code: 'Q09', topic: 'Suporte e Apoio no Ambiente de Trabalho', topicNum: 2, order: 9, reverse: true,
    text: 'Os gestores promovem um ambiente saudável e respeitoso?',
    hint: 'Responda como você avalia o comportamento dos gestores no dia a dia.',
  },
  {
    code: 'Q10', topic: 'Suporte e Apoio no Ambiente de Trabalho', topicNum: 2, order: 10, reverse: true,
    text: 'Você sente que pode expressar suas dificuldades no trabalho sem ser julgado(a)?',
    hint: 'Responda se você se sente à vontade para falar sobre dificuldades no trabalho.',
  },

  // Tópico 03 — Má Gestão de Mudanças Organizacionais
  {
    code: 'Q11', topic: 'Má Gestão de Mudanças Organizacionais', topicNum: 3, order: 11, reverse: false,
    text: 'Mudanças organizacionais impactaram negativamente seu sentimento de segurança no trabalho?',
    hint: 'Responda se mudanças na empresa afetaram sua sensação de segurança no trabalho.',
  },
  {
    code: 'Q12', topic: 'Má Gestão de Mudanças Organizacionais', topicNum: 3, order: 12, reverse: true,
    text: 'Há comunicação clara sobre mudanças que afetam a empresa ou os trabalhadores?',
    hint: 'Responda se a empresa costuma explicar bem as mudanças que acontecem.',
  },
  {
    code: 'Q13', topic: 'Má Gestão de Mudanças Organizacionais', topicNum: 3, order: 13, reverse: false,
    text: 'Você já sentiu que seu emprego estava ameaçado sem explicações claras durante períodos de mudança?',
    hint: 'Responda se já sentiu insegurança sobre seu emprego durante mudanças.',
  },
  {
    code: 'Q14', topic: 'Má Gestão de Mudanças Organizacionais', topicNum: 3, order: 14, reverse: true,
    text: 'Existe transparência na comunicação da empresa durante processos de mudança?',
    hint: 'Responda se as mudanças são comunicadas de forma clara e aberta.',
  },

  // Tópico 04 — Baixa Clareza de Papel ou Função
  {
    code: 'Q15', topic: 'Baixa Clareza de Papel ou Função', topicNum: 4, order: 15, reverse: true,
    text: 'Você recebe instruções claras sobre suas responsabilidades no trabalho?',
    hint: 'Responda se você entende bem quais são suas responsabilidades.',
  },
  {
    code: 'Q16', topic: 'Baixa Clareza de Papel ou Função', topicNum: 4, order: 16, reverse: true,
    text: 'A comunicação da empresa ajuda você a entender o que é esperado do seu trabalho?',
    hint: 'Responda se a empresa deixa claro o que espera do seu trabalho.',
  },
  {
    code: 'Q17', topic: 'Baixa Clareza de Papel ou Função', topicNum: 4, order: 17, reverse: true,
    text: 'A comunicação entre equipes e setores contribui para a clareza das suas tarefas?',
    hint: 'Responda se a comunicação entre áreas ajuda no seu trabalho.',
  },
  {
    code: 'Q18', topic: 'Baixa Clareza de Papel ou Função', topicNum: 4, order: 18, reverse: true,
    text: 'Você se sente confortável para pedir esclarecimentos quando não entende suas funções ou prioridades?',
    hint: 'Responda se você se sente à vontade para perguntar quando não entende algo.',
  },

  // Tópico 05 — Baixas Recompensas e Reconhecimento
  {
    code: 'Q19', topic: 'Baixas Recompensas e Reconhecimento', topicNum: 5, order: 19, reverse: true,
    text: 'Você sente que seu esforço e desempenho são reconhecidos pela liderança?',
    hint: 'Responda se você se sente valorizado(a) pelo trabalho que realiza.',
  },
  {
    code: 'Q20', topic: 'Baixas Recompensas e Reconhecimento', topicNum: 5, order: 20, reverse: true,
    text: 'Você recebe feedback construtivo sobre o seu trabalho com regularidade?',
    hint: 'Responda se você recebe orientações ou retornos sobre seu trabalho.',
  },
  {
    code: 'Q21', topic: 'Baixas Recompensas e Reconhecimento', topicNum: 5, order: 21, reverse: false,
    text: 'Com que frequência você já se sentiu desmotivado(a) por falta de reconhecimento no trabalho?',
    hint: 'Responda se a falta de reconhecimento já te deixou desmotivado(a).',
  },

  // Tópico 06 — Baixo Controle no Trabalho / Falta de Autonomia
  {
    code: 'Q22', topic: 'Baixo Controle no Trabalho / Falta de Autonomia', topicNum: 6, order: 22, reverse: true,
    text: 'Você tem liberdade para tomar decisões sobre como executar suas tarefas diárias?',
    hint: 'Responda se você pode sugerir melhorias ou decidir como fazer suas tarefas.',
  },
  {
    code: 'Q23', topic: 'Baixo Controle no Trabalho / Falta de Autonomia', topicNum: 6, order: 23, reverse: true,
    text: 'A empresa confia na sua capacidade de organizar e gerenciar o próprio trabalho?',
    hint: 'Responda se sente que a empresa confia na forma como você organiza seu trabalho.',
  },
  {
    code: 'Q24', topic: 'Baixo Controle no Trabalho / Falta de Autonomia', topicNum: 6, order: 24, reverse: false,
    text: 'Existe excesso de controle ou burocracia que interfere no seu desempenho?',
    hint: 'Responda se regras ou controles atrapalham seu desempenho.',
  },
  {
    code: 'Q25', topic: 'Baixo Controle no Trabalho / Falta de Autonomia', topicNum: 6, order: 25, reverse: false,
    text: 'Existe excesso de supervisão que impacta negativamente na sua produtividade ou bem-estar?',
    hint: null,
  },

  // Tópico 07 — Baixa Justiça Organizacional
  {
    code: 'Q26', topic: 'Baixa Justiça Organizacional', topicNum: 7, order: 26, reverse: true,
    text: 'Você acha justas e claras as formas que a empresa usa para avaliar o seu trabalho?',
    hint: 'Responda se as formas de avaliar seu trabalho são claras e justas.',
  },
  {
    code: 'Q27', topic: 'Baixa Justiça Organizacional', topicNum: 7, order: 27, reverse: true,
    text: 'Você sente que há igualdade no reconhecimento entre diferentes áreas ou equipes?',
    hint: 'Responda se você percebe tratamento justo entre equipes ou setores.',
  },
  {
    code: 'Q28', topic: 'Baixa Justiça Organizacional', topicNum: 7, order: 28, reverse: true,
    text: 'Você sente que há transparência nas decisões de desligamento na empresa?',
    hint: 'Responda se a empresa é clara quando ocorrem desligamentos.',
  },
  {
    code: 'Q29', topic: 'Baixa Justiça Organizacional', topicNum: 7, order: 29, reverse: false,
    text: 'Você já presenciou casos de demissões que considerasse injustas?',
    hint: 'Responda se já presenciou demissões que considerou injustas.',
  },

  // Tópico 08 — Eventos Violentos ou Traumáticos
  {
    code: 'Q30', topic: 'Eventos Violentos ou Traumáticos', topicNum: 8, order: 30, reverse: false,
    text: 'Você já vivenciou ou presenciou alguma situação de violência grave no trabalho (agressão física, ameaça séria ou ataque verbal intenso)?',
    hint: null,
  },
  {
    code: 'Q31', topic: 'Eventos Violentos ou Traumáticos', topicNum: 8, order: 31, reverse: false,
    text: 'Você já passou por algum evento grave no trabalho (acidente sério, situação de risco extremo ou episódio muito impactante)?',
    hint: 'Responda se já passou por situações muito graves ou perigosas no trabalho.',
  },
  {
    code: 'Q32', topic: 'Eventos Violentos ou Traumáticos', topicNum: 8, order: 32, reverse: false,
    text: 'Alguma situação vivida no trabalho já foi tão marcante que deixou medo, choque ou forte abalo emocional?',
    hint: 'Responda se alguma situação no trabalho já te causou forte abalo emocional.',
  },

  // Tópico 09 — Subcarga de Trabalho
  {
    code: 'Q33', topic: 'Baixa Demanda no Trabalho (Subcarga)', topicNum: 9, order: 33, reverse: false,
    text: 'Você sente que, na maior parte do tempo, tem pouco trabalho a realizar durante sua jornada?',
    hint: 'Responda se costuma ter pouco trabalho durante sua jornada.',
  },
  {
    code: 'Q34', topic: 'Baixa Demanda no Trabalho (Subcarga)', topicNum: 9, order: 34, reverse: false,
    text: 'Você costuma ficar com tempo ocioso no trabalho por falta de tarefas ou demandas claras?',
    hint: 'Responda se frequentemente fica sem tarefas para realizar.',
  },
  {
    code: 'Q35', topic: 'Baixa Demanda no Trabalho (Subcarga)', topicNum: 9, order: 35, reverse: false,
    text: 'Você sente que suas habilidades ou conhecimentos são pouco utilizados no seu trabalho?',
    hint: 'Responda se sente que suas habilidades são pouco aproveitadas.',
  },
  {
    code: 'Q36', topic: 'Baixa Demanda no Trabalho (Subcarga)', topicNum: 9, order: 36, reverse: false,
    text: 'Seu trabalho costuma ser pouco desafiador ou repetitivo a ponto de gerar desânimo?',
    hint: 'Responda se o trabalho é repetitivo ou desmotivador.',
  },

  // Tópico 10 — Sobrecarga de Trabalho
  {
    code: 'Q37', topic: 'Excesso de Demandas no Trabalho (Sobrecarga)', topicNum: 10, order: 37, reverse: false,
    text: 'Você sente que sua carga de trabalho diária é maior do que consegue realizar dentro do horário normal?',
    hint: 'Responda se a quantidade de trabalho é maior do que consegue realizar.',
  },
  {
    code: 'Q38', topic: 'Excesso de Demandas no Trabalho (Sobrecarga)', topicNum: 10, order: 38, reverse: false,
    text: 'Você frequentemente precisa fazer horas extras ou levar trabalho para casa?',
    hint: 'Responda se costuma trabalhar além do horário normal.',
  },
  {
    code: 'Q39', topic: 'Excesso de Demandas no Trabalho (Sobrecarga)', topicNum: 10, order: 39, reverse: false,
    text: 'Você já teve sintomas físicos ou emocionais (exaustão, ansiedade ou insônia) devido ao excesso de trabalho?',
    hint: 'Responda se o excesso de trabalho já afetou sua saúde.',
  },
  {
    code: 'Q40', topic: 'Excesso de Demandas no Trabalho (Sobrecarga)', topicNum: 10, order: 40, reverse: true,
    text: 'A equipe é dimensionada corretamente para a demanda/quantidade de trabalho existente?',
    hint: 'Responda se a quantidade de pessoas é suficiente para a demanda.',
  },

  // Tópico 11 — Maus Relacionamentos
  {
    code: 'Q41', topic: 'Maus Relacionamentos no Local de Trabalho', topicNum: 11, order: 41, reverse: false,
    text: 'Você já evitou colegas ou superiores por causa de desentendimentos frequentes?',
    hint: 'Responda se já evitou colegas ou superiores por conflitos.',
  },
  {
    code: 'Q42', topic: 'Maus Relacionamentos no Local de Trabalho', topicNum: 11, order: 42, reverse: false,
    text: 'Você percebe rivalidade excessiva ou desnecessária entre colegas ou setores?',
    hint: 'Responda se percebe disputas desnecessárias no trabalho.',
  },
  {
    code: 'Q43', topic: 'Maus Relacionamentos no Local de Trabalho', topicNum: 11, order: 43, reverse: true,
    text: 'Conflitos no trabalho costumam ser resolvidos de forma justa?',
    hint: 'Responda se os conflitos costumam ser resolvidos de forma justa.',
  },

  // Tópico 12 — Difícil Comunicação
  {
    code: 'Q44', topic: 'Trabalho em Condições de Difícil Comunicação', topicNum: 12, order: 44, reverse: false,
    text: 'Você trabalha em condições (turnos diferentes, trabalho externo ou distância física) que dificultam a comunicação no trabalho?',
    hint: 'Responda se seu trabalho dificulta a comunicação com colegas ou líderes.',
  },
  {
    code: 'Q45', topic: 'Trabalho em Condições de Difícil Comunicação', topicNum: 12, order: 45, reverse: false,
    text: 'A distância física entre você e sua equipe ou liderança dificulta a troca de informações?',
    hint: 'Responda se a distância atrapalha a troca de informações.',
  },
  {
    code: 'Q46', topic: 'Trabalho em Condições de Difícil Comunicação', topicNum: 12, order: 46, reverse: false,
    text: 'Você já teve dificuldade para receber informações importantes no momento certo por causa da organização do trabalho?',
    hint: 'Responda se já recebeu informações importantes com atraso.',
  },
  {
    code: 'Q47', topic: 'Trabalho em Condições de Difícil Comunicação', topicNum: 12, order: 47, reverse: true,
    text: 'Você tem acesso fácil aos meios necessários para se comunicar com colegas e liderança durante o trabalho?',
    hint: 'Responda se você tem meios adequados para se comunicar no trabalho.',
  },

  // Tópico 13 — Trabalho Remoto e Isolado
  {
    code: 'Q48', topic: 'Trabalho Remoto e Isolado', topicNum: 13, order: 48, reverse: false,
    text: 'Você trabalha grande parte do tempo de forma remota ou sozinho(a), com pouco contato presencial com colegas ou liderança?',
    hint: 'Responda se você trabalha a maior parte do tempo sozinho(a) ou à distância.',
  },
  {
    code: 'Q49', topic: 'Trabalho Remoto e Isolado', topicNum: 13, order: 49, reverse: false,
    text: 'Você sente que o trabalho remoto ou isolado faz com que se sinta distante da equipe ou da empresa?',
    hint: 'Responda se isso faz você se sentir distante da equipe ou da empresa.',
  },
  {
    code: 'Q50', topic: 'Trabalho Remoto e Isolado', topicNum: 13, order: 50, reverse: true,
    text: 'Mesmo trabalhando de forma remota ou isolada, você sente que recebe apoio e acompanhamento adequados da empresa?',
    hint: 'Responda se, mesmo à distância, você recebe apoio da empresa.',
  },
]

async function main() {
  console.log('Inserindo questões no banco...')

  await prisma.question.deleteMany()

  for (const q of questions) {
    await prisma.question.create({ data: q })
  }

  console.log(`✅ ${questions.length} questões inseridas com sucesso.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
