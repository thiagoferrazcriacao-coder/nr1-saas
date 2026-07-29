export type ManagerOption = { label: string; value: number }
export type ManagerQuestion = {
  code: string
  topicNum: number
  factor: string
  kind: 'occurrence' | 'formal' | 'measures'
  text: string
  options: ManagerOption[]
}

const opts = (labels: string[]) => labels.map((label, value) => ({ label, value }))
const factors = [
  ['Assédio', 'Nos últimos 12 meses, você teve conhecimento de situações de desrespeito, constrangimento, piadas ofensivas ou insinuações inadequadas entre pessoas da empresa (incluindo chefias)?', ['Nunca', 'Uma vez, pontual', 'Algumas vezes', 'Com frequência'], 'Existe registro formal ligado a esse tema (reclamação por escrito, denúncia, advertência aplicada, ação trabalhista ou afastamento)?', ['Não', 'Houve relato informal, sem registro', 'Sim, um registro', 'Sim, mais de um'], 'O que a empresa tem hoje de medida sobre esse tema?', ['Nada ainda', 'Orientação verbal à equipe', 'Política/regra por escrito comunicada', 'Política por escrito + canal de denúncias ativo']],
  ['Falta de suporte e apoio', 'Nos últimos 12 meses, com que frequência colaboradores enfrentaram dificuldades de trabalho sem ter a quem recorrer (chefia ausente ou sem retorno)?', ['Nunca', 'Raramente', 'Algumas vezes', 'Com frequência'], 'Houve pedido de ajuda, reclamação ou desligamento em que a falta de apoio da liderança foi mencionada?', ['Não', 'Comentário informal', 'Sim, uma vez', 'Sim, mais de uma vez'], 'O que existe hoje de estrutura de apoio ao colaborador?', ['Nada definido', 'A equipe procura o dono/gestor quando precisa, sem rotina', 'Há pessoa/horário definido a quem recorrer', 'Há rotina fixa de acompanhamento (conversas ou reuniões regulares)']],
  ['Má gestão de mudanças', 'Nos últimos 12 meses, a empresa passou por mudanças relevantes (sistema, endereço, sócio, corte, novo serviço)?', ['Não houve mudança', 'Uma mudança, comunicada com antecedência', 'Mudança(s) comunicada(s) em cima da hora', 'Mudança(s) sem comunicação prévia à equipe'], 'Alguma mudança gerou reclamação, pedido de demissão, queda de desempenho ou clima ruim perceptível?', ['Não', 'Incômodo passageiro', 'Sim, em um caso', 'Sim, em mais de um caso'], 'Como a empresa comunica mudanças hoje?', ['Cada um fica sabendo quando acontece', 'Aviso verbal sem padrão', 'Comunicação com antecedência, mas sem modelo definido', 'Comunicação com antecedência e forma definida (reunião/comunicado)']],
  ['Baixa clareza de papel/função', 'Nos últimos 12 meses, com que frequência houve confusão sobre de quem é uma tarefa ou ordens contraditórias?', ['Nunca', 'Raramente', 'Algumas vezes', 'Com frequência'], 'Houve conflito, retrabalho relevante ou reclamação formal causados por indefinição de responsabilidades?', ['Não', 'Situações pequenas, resolvidas na hora', 'Sim, um caso relevante', 'Sim, casos repetidos'], 'O que existe hoje definindo quem faz o quê?', ['Nada por escrito, cada um sabe o seu', 'Combinados verbais', 'Descrição por escrito de parte das funções', 'Responsabilidades por escrito para todos']],
  ['Baixas recompensas e reconhecimento', 'Nos últimos 12 meses, com que frequência colaboradores demonstraram desmotivação ligada à falta de reconhecimento?', ['Nunca', 'Raramente', 'Algumas vezes', 'Com frequência'], 'Houve pedido de demissão, pedido de aumento negado com atrito ou reclamação em que não sou valorizado apareceu?', ['Não', 'Comentário isolado', 'Sim, um caso', 'Sim, mais de um caso'], 'O que a empresa pratica hoje de reconhecimento?', ['Nada estruturado', 'Elogios eventuais, sem rotina', 'Feedback/reconhecimento com alguma regularidade', 'Prática regular e conhecida pela equipe']],
  ['Baixo controle / falta de autonomia', 'No dia a dia, quanto os colaboradores decidem sobre a forma de executar o próprio trabalho?', ['Têm boa margem de decisão', 'Decidem o operacional, o resto é centralizado', 'Quase tudo passa pela chefia', 'Tudo passa pela chefia, inclusive detalhes'], 'Houve reclamação, desgaste ou perda de gente ligada a excesso de controle, burocracia ou microgerenciamento?', ['Não', 'Comentário isolado', 'Sim, um caso', 'Sim, mais de um caso'], 'Existe definição do que a equipe pode decidir sem pedir autorização?', ['Não, tudo depende de autorização', 'Depende da pessoa/situação, sem regra', 'Há entendimento informal do que cada um decide', 'Há definição clara, mesmo que verbal e conhecida por todos']],
  ['Baixa justiça organizacional', 'Nos últimos 12 meses, com que frequência surgiram queixas ou comentários de tratamento desigual, favoritismo ou critérios pouco claros?', ['Nunca', 'Raramente', 'Algumas vezes', 'Com frequência'], 'Alguma decisão da empresa gerou conflito aberto, reclamação formal ou ação trabalhista?', ['Não', 'Insatisfação passageira', 'Sim, um caso', 'Sim, mais de um caso'], 'As regras do dia a dia estão definidas de forma conhecida por todos?', ['Não, decide-se caso a caso', 'Em parte, algumas coisas são combinadas', 'A maioria é definida e conhecida', 'Sim, regras claras e aplicadas igualmente']],
  ['Eventos violentos ou traumáticos', 'Nos últimos 12 meses, houve evento grave no trabalho ou ligado a ele (assalto, agressão, ameaça séria, acidente relevante, falecimento, emergência)?', ['Não', 'Situação de susto, sem gravidade', 'Sim, um evento grave', 'Sim, mais de um'], 'A atividade da empresa expõe a equipe a risco desse tipo?', ['Não', 'Exposição baixa', 'Exposição moderada', 'Exposição alta'], 'A empresa tem algo definido para o caso de um evento grave?', ['Nada definido', 'Resolveria na hora, sem plano', 'Contatos e responsável definidos', 'Procedimento definido e conhecido pela equipe']],
  ['Subcarga', 'Existe na equipe alguém que passa parte relevante da jornada sem tarefas ou com trabalho muito abaixo da sua capacidade?', ['Não', 'Em períodos pontuais de baixa demanda', 'Sim, uma pessoa', 'Sim, mais de uma'], 'Houve desmotivação, queda de desempenho ou saída ligada a ociosidade ou falta de desafio?', ['Não', 'Comentário isolado', 'Sim, um caso', 'Sim, mais de um caso'], 'Quando a demanda cai, o que a empresa faz?', ['Nada, cada um espera a demanda voltar', 'Improvisa ocupação', 'Redistribui tarefas informalmente', 'Tem prática definida (treinamento, organização, atividades de baixa temporada)']],
  ['Sobrecarga', 'Nos últimos 12 meses, com que frequência a equipe precisou ir além do horário para dar conta?', ['Nunca/raramente', 'Em picos previsíveis (sazonais)', 'Algumas vezes por mês', 'Rotineiramente'], 'Houve afastamento por saúde, atestados repetidos, pedido de demissão ou reclamação ligados a excesso de trabalho, cansaço ou estresse?', ['Não', 'Comentários de cansaço, sem consequência formal', 'Sim, um caso', 'Sim, mais de um caso'], 'O que existe hoje para lidar com picos de demanda?', ['Nada, a equipe absorve', 'Reforço improvisado quando aperta', 'Planejamento parcial (prioridades ou reforço combinado)', 'Prática definida (dimensionamento, prioridades claras, reforço planejado)']],
  ['Maus relacionamentos', 'Nos últimos 12 meses, com que frequência houve atritos, desentendimentos ou clima pesado entre pessoas da equipe?', ['Nunca', 'Raramente, resolvidos na hora', 'Algumas vezes', 'Com frequência'], 'Algum conflito escalou a ponto de gerar advertência, mudança de setor, desligamento ou reclamação formal?', ['Não', 'Precisou de conversa da chefia', 'Sim, um caso', 'Sim, mais de um caso'], 'Quando há conflito entre pessoas, como a empresa age?', ['Não se envolve, os envolvidos que resolvam', 'Age só quando o problema cresce', 'A chefia conversa com os envolvidos', 'Há forma definida de tratar (conversa estruturada, acompanhamento)']],
  ['Difícil comunicação', 'A forma de trabalho da empresa dificulta a comunicação entre as pessoas (turnos, trabalho externo, unidades separadas, barulho)?', ['Não', 'Um pouco, em situações específicas', 'Sim, para parte da equipe', 'Sim, para a maior parte'], 'Nos últimos 12 meses, houve erro, retrabalho ou conflito causado por informação que não chegou ou chegou atrasada?', ['Não', 'Casos pequenos', 'Sim, um caso relevante', 'Sim, casos repetidos'], 'Existe um canal oficial para informação de trabalho chegar a todos?', ['Não, a informação circula como dá', 'Grupo de mensagens informal', 'Canal definido, mas nem tudo passa por ele', 'Canal oficial definido e usado por todos']],
  ['Trabalho remoto e isolado', 'Alguém da equipe trabalha remoto, sozinho ou fisicamente isolado em parte relevante da jornada?', ['Não', 'Sim, ocasionalmente', 'Sim, uma pessoa em rotina', 'Sim, mais de uma pessoa em rotina'], 'Quem trabalha assim demonstrou distanciamento, desmotivação ou dificuldade de acompanhamento pela chefia?', ['Não', 'Levemente', 'Sim, em um caso', 'Sim, em mais de um caso'], 'Existe rotina de contato com quem está remoto/isolado?', ['Não, falam quando precisa', 'Contato irregular', 'Contato regular informal', 'Rotina definida de contato e acompanhamento']],
] as const

export const MANAGER_QUESTIONS: ManagerQuestion[] = factors.flatMap((f, index) => {
  const n = index + 1
  return [
    { code: `G${n}.1`, topicNum: n, factor: f[0], kind: 'occurrence' as const, text: f[1], options: opts([...f[2]]) },
    { code: `G${n}.2`, topicNum: n, factor: f[0], kind: 'formal' as const, text: f[3], options: opts([...f[4]]) },
    { code: `G${n}.3`, topicNum: n, factor: f[0], kind: 'measures' as const, text: f[5], options: opts([...f[6]]) },
  ]
})

export type ManagerAnswer = { code: string; value: number }
export type ManagerResult = {
  topicNum: number
  topic: string
  factor: string
  answers: ManagerAnswer[]
  score: number
  probability: 'baixa' | 'media' | 'alta' | 'nao_aplicavel'
  formalFloorApplied: boolean
  prudentialAdjustmentApplied?: boolean
  notApplicable: boolean
}

export function calculateManagerResults(answers: ManagerAnswer[]): ManagerResult[] {
  const map = new Map(answers.map((a) => [a.code, a.value]))
  const results: ManagerResult[] = []
  for (let n = 1; n <= 13; n++) {
    const qs = MANAGER_QUESTIONS.filter((q) => q.topicNum === n)
    const first = map.get(`G${n}.1`)
    const notApplicable = n === 13 && first === 0
    const selected = qs.filter((q) => !notApplicable || q.code === `G${n}.1`).map((q) => ({ code: q.code, value: map.get(q.code)! }))
    const score = notApplicable ? 0 : selected.reduce((sum, a) => sum + (a.code.endsWith('.3') ? 3 - a.value : a.value), 0)
    const formalFloorApplied = !notApplicable && map.get(`G${n}.2`) === 3 && score <= 3
    const base = score <= 3 ? 'baixa' : score <= 6 ? 'media' : 'alta'
    results.push({ topicNum: n, topic: qs[0].factor, factor: qs[0].factor, answers: selected, score, probability: notApplicable ? 'nao_aplicavel' : formalFloorApplied ? 'media' : base, formalFloorApplied, notApplicable })
  }
  return results
}

export function managerIsComplete(answers: ManagerAnswer[]) {
  const map = new Map(answers.map((a) => [a.code, a.value]))
  for (const q of MANAGER_QUESTIONS) {
    if (q.topicNum === 13 && (q.code === 'G13.2' || q.code === 'G13.3') && map.get('G13.1') === 0) continue
    if (!Number.isInteger(map.get(q.code))) return false
  }
  return true
}
