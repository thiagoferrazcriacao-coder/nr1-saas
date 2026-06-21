// Base técnica para a análise qualitativa fator por fator do DRPS.
// Cada fator traz o modelo científico de referência e dois textos:
//  - protetivo (quando o risco é Baixo)
//  - de exposição (quando o risco é Moderado/Alto/Crítico)
// Fundamentação: Karasek & Theorell, Siegrist, Kahn, Adams, Mayo,
// Bakker & Demerouti (JD-R), OMS e OIT.

export type FactorText = {
  modelo: string
  protetivo: string
  exposicao: string
  medida: string
}

export const FACTOR_ANALYSIS: Record<number, FactorText> = {
  1: {
    modelo: 'psicodinâmica do trabalho e diretrizes da OIT sobre violência e assédio (Convenção 190)',
    protetivo: 'A análise quantitativa não indicou relatos significativos de comportamentos vexatórios, humilhantes ou intimidadores no ambiente de trabalho. Sob a ótica da psicodinâmica do trabalho, observa-se ambiente preservado quanto à dignidade organizacional, sem evidências de uso do poder hierárquico como instrumento de constrangimento. Recomenda-se a manutenção das medidas preventivas, com revisão anual da política antiassédio e ações periódicas de sensibilização da equipe.',
    exposicao: 'A análise quantitativa identificou percepção de exposição a condutas inadequadas, ofensivas ou constrangedoras no ambiente de trabalho. Sob a ótica da psicodinâmica do trabalho e das diretrizes da OIT, o assédio constitui fator de risco grave à saúde mental, associado a sofrimento psíquico, adoecimento e judicialização. Recomenda-se intervenção imediata, com fortalecimento do canal de denúncias, apuração célere e imparcial, política antiassédio documentada e treinamento obrigatório de prevenção.',
    medida: 'Fortalecer o canal de denúncias e o treinamento de prevenção ao assédio, com apuração célere e imparcial dos relatos.',
  },
  2: {
    modelo: 'modelo Demanda-Controle-Apoio Social de Karasek e Theorell',
    protetivo: 'A coleta quantitativa demonstrou percepção positiva da equipe quanto ao respaldo recebido em situações de dificuldade técnica e operacional. À luz do modelo Demanda-Controle-Apoio Social de Karasek e Theorell, identifica-se equilíbrio entre as exigências da função e os recursos relacionais disponíveis, mitigando efeitos cumulativos de tensão psicológica. Recomenda-se a manutenção do padrão atual e a implementação de rotinas formais de acompanhamento individual periódico.',
    exposicao: 'A análise quantitativa indicou percepção de baixo respaldo da liderança e dos colegas em situações de dificuldade. Segundo o modelo Demanda-Controle-Apoio Social de Karasek e Theorell, a ausência de apoio social amplia os efeitos da tensão psicológica e o risco de adoecimento. Recomenda-se a capacitação das lideranças em suporte à equipe e a instituição de rotinas formais de escuta ativa e acompanhamento individual.',
    medida: 'Capacitar lideranças em suporte à equipe e instituir rotinas formais de escuta ativa e acompanhamento individual.',
  },
  3: {
    modelo: 'psicodinâmica do trabalho (incerteza e insegurança organizacional)',
    protetivo: 'Os indicadores quantitativos demonstram percepção de que as mudanças organizacionais são comunicadas com clareza e antecedência adequadas. Sob a perspectiva da psicodinâmica do trabalho, o ambiente preserva o senso de segurança e previsibilidade. Recomenda-se a manutenção das práticas de comunicação e a estruturação de um protocolo formal para mudanças de maior impacto.',
    exposicao: 'A análise quantitativa identificou percepção de que mudanças organizacionais foram comunicadas com antecedência insuficiente ou clareza limitada. Sob a perspectiva da psicodinâmica do trabalho, a incerteza prolongada sobre transformações constitui fator gerador de sofrimento psíquico, podendo evoluir para ansiedade antecipatória e queda do engajamento. Recomenda-se a adoção de protocolo formal de comunicação prévia de mudanças, com explicação de motivos, impacto esperado e prazo de transição, além de espaços dedicados de alinhamento coletivo.',
    medida: 'Adotar protocolo formal de comunicação prévia de mudanças (motivos, impacto e prazo) e reuniões de alinhamento.',
  },
  4: {
    modelo: 'modelo de tensão de papel de Kahn',
    protetivo: 'Os indicadores quantitativos demonstram percepção consistente da equipe sobre suas atribuições, prioridades e estrutura decisória. Sob a ótica do modelo de tensão de papel de Kahn, observa-se baixo risco de stress role decorrente de demandas contraditórias ou expectativas mal definidas. Recomenda-se a manutenção das descrições funcionais atualizadas e a revisão anual do organograma.',
    exposicao: 'A análise quantitativa indicou ambiguidade ou conflito de papel relevante, com expectativas pouco claras sobre responsabilidades e prioridades. Segundo o modelo de tensão de papel de Kahn, esse cenário gera stress role, sobrecarga cognitiva e exaustão. Recomenda-se documentar e comunicar claramente papéis, metas e responsabilidades de cada função, com revisão periódica das descrições de cargo.',
    medida: 'Documentar e comunicar claramente papéis, metas e responsabilidades de cada função.',
  },
  5: {
    modelo: 'modelo Esforço-Recompensa de Siegrist',
    protetivo: 'A análise quantitativa apresentou equilíbrio adequado entre o esforço empreendido e o reconhecimento recebido. Sob a perspectiva do modelo Esforço-Recompensa de Siegrist, o ambiente preserva a percepção de valorização e o vínculo institucional. Recomenda-se a manutenção das práticas de feedback e a ampliação progressiva do reconhecimento simbólico e material.',
    exposicao: 'A análise quantitativa indicou que o reconhecimento do esforço e a oferta de feedback construtivo podem ser ampliados. Sob a perspectiva do modelo Esforço-Recompensa de Siegrist, o desequilíbrio prolongado entre esforço e recompensa constitui fator de risco para sintomas psicossomáticos, redução do engajamento e elevação do turnover. Recomenda-se a implantação de feedback estruturado periódico, reconhecimento público de conquistas e construção de plano de desenvolvimento individual.',
    medida: 'Implantar feedback estruturado periódico, reconhecimento público de conquistas e plano de desenvolvimento individual.',
  },
  6: {
    modelo: 'modelo Demanda-Controle de Karasek',
    protetivo: 'Os dados quantitativos indicam percepção adequada de autonomia decisória na execução das tarefas, com liberdade para definição de método e ritmo. À luz do modelo Demanda-Controle de Karasek, observa-se equilíbrio funcional entre as exigências e o grau de discricionariedade, configuração associada a menor risco de estresse ocupacional. Recomenda-se a preservação dessa cultura e a ampliação progressiva da delegação.',
    exposicao: 'A análise quantitativa identificou percepção de baixa autonomia, microgestão ou excesso de controle sobre a execução do trabalho. Segundo o modelo Demanda-Controle de Karasek, a combinação de alta demanda com baixo controle (alta tensão / job strain) é a configuração de maior risco para estresse ocupacional e adoecimento. Recomenda-se a ampliação da autonomia na execução das tarefas e a revisão do excesso de controle e burocracia.',
    medida: 'Ampliar a autonomia na execução das tarefas e revisar o excesso de controle e burocracia.',
  },
  7: {
    modelo: 'teoria da equidade organizacional de Adams',
    protetivo: 'A análise quantitativa não revelou percepções significativas de injustiça nas dimensões distributiva, procedimental ou interacional. Sob a perspectiva da teoria da equidade organizacional de Adams, o ambiente apresenta condições favoráveis à manutenção do contrato psicológico entre colaboradores e instituição. Recomenda-se a documentação formal dos critérios de promoção, avaliação e distribuição de tarefas.',
    exposicao: 'A análise quantitativa identificou percepção de injustiça em uma ou mais dimensões (distributiva, procedimental ou interacional). Segundo a teoria da equidade organizacional de Adams, a percepção de iniquidade deteriora o contrato psicológico, gerando desmotivação e ruptura do vínculo. Recomenda-se tornar transparentes os critérios de avaliação, promoção e desligamento, assegurando equidade e previsibilidade.',
    medida: 'Tornar transparentes os critérios de avaliação, promoção e desligamento, assegurando equidade.',
  },
  8: {
    modelo: 'psicotraumatologia ocupacional',
    protetivo: 'Não foram identificados, no período avaliado, relatos de agressão grave, ameaças, acidentes significativos ou episódios de forte abalo emocional coletivo. Sob a perspectiva da psicotraumatologia ocupacional, recomenda-se atenção à eventual exposição secundária a conteúdos emocionalmente carregados, com a implantação de protocolo de acolhimento pós-atendimento em casos de alta carga emocional.',
    exposicao: 'A análise quantitativa identificou exposição a eventos violentos, traumáticos ou de forte impacto emocional. Sob a perspectiva da psicotraumatologia ocupacional, tal exposição é fator de risco para estresse pós-traumático, fadiga por compaixão e estresse vicário. Recomenda-se a implantação de protocolo formal de acolhimento pós-evento crítico e a disponibilização de suporte psicológico de referência.',
    medida: 'Estabelecer protocolo de acolhimento pós-evento crítico e suporte psicológico de referência.',
  },
  9: {
    modelo: 'modelo Job Demands-Resources de Bakker e Demerouti',
    protetivo: 'A análise quantitativa não identificou indicadores significativos de ociosidade funcional, desuso de competências ou desmotivação por baixa estimulação. Sob a ótica do modelo Job Demands-Resources de Bakker e Demerouti, o equilíbrio observado favorece o engajamento e a percepção de significado no trabalho. Recomenda-se monitoramento periódico em períodos de baixa sazonal.',
    exposicao: 'A análise quantitativa identificou indicadores de subcarga, ociosidade ou subutilização das competências da equipe. Segundo o modelo Job Demands-Resources de Bakker e Demerouti, a baixa estimulação reduz o significado do trabalho e o engajamento, favorecendo o tédio e a desmotivação. Recomenda-se enriquecer funções, redistribuir tarefas e ampliar oportunidades de desenvolvimento técnico.',
    medida: 'Enriquecer funções e redistribuir tarefas para reduzir a ociosidade e a subutilização de competências.',
  },
  10: {
    modelo: 'modelo Demanda-Controle de Karasek e modelo Job Demands-Resources',
    protetivo: 'A pontuação quantitativa mantém-se em faixa baixa, com eventual elevação pontual da carga em períodos de demanda concentrada. Sob a perspectiva do modelo Demanda-Controle, a configuração atual não representa risco imediato, sendo recomendável o monitoramento contínuo. Recomenda-se atenção à distribuição equilibrada das demandas e reforço ao respeito ao horário de trabalho.',
    exposicao: 'A análise quantitativa identificou percepção de sobrecarga de trabalho, com volume e pressão acima da capacidade de realização dentro da jornada. Segundo os modelos Demanda-Controle e Job Demands-Resources, demandas excessivas e sustentadas são fator central de exaustão e burnout. Recomenda-se o dimensionamento da equipe à demanda, a revisão de metas e jornada e o reforço institucional ao direito à desconexão fora do expediente.',
    medida: 'Dimensionar a equipe à demanda, revisar metas e jornada e reforçar o direito à desconexão.',
  },
  11: {
    modelo: 'teoria das relações humanas no trabalho de Mayo',
    protetivo: 'Os dados quantitativos demonstram clima relacional preservado, sem indicativos de conflitos persistentes, rivalidade ou comunicação agressiva. Sob a perspectiva da teoria das relações humanas de Mayo, observa-se ambiente favorável à coesão grupal e ao desempenho coletivo. Recomenda-se a manutenção de práticas de integração e a intervenção precoce caso surjam tensões pontuais.',
    exposicao: 'A análise quantitativa identificou tensões relacionais, conflitos frequentes ou clima de rivalidade entre colaboradores ou setores. Segundo a teoria das relações humanas de Mayo, relações deterioradas comprometem a coesão grupal, o bem-estar e o desempenho coletivo. Recomenda-se a mediação justa de conflitos e a promoção ativa da cooperação e da integração das equipes.',
    medida: 'Mediar conflitos de forma justa e promover a cooperação e a integração entre as equipes.',
  },
  12: {
    modelo: 'teoria da comunicação organizacional',
    protetivo: 'Os indicadores quantitativos apontam fluxo de comunicação interna adequado, sem barreiras estruturais significativas para a transmissão tempestiva de informações. Sob a perspectiva da teoria da comunicação organizacional, o ambiente favorece a coordenação interfuncional e a redução de retrabalhos. Recomenda-se a padronização documentada dos canais oficiais e rotinas periódicas de alinhamento.',
    exposicao: 'A análise quantitativa identificou barreiras de comunicação decorrentes de turnos, distância física ou assimetria informacional, dificultando a transmissão tempestiva de informações. Sob a perspectiva da teoria da comunicação organizacional, a falha comunicacional gera retrabalho, desalinhamento e insegurança. Recomenda-se padronizar os canais oficiais de comunicação e instituir rotinas periódicas de alinhamento coletivo.',
    medida: 'Padronizar os canais oficiais de comunicação e instituir rotinas periódicas de alinhamento.',
  },
  13: {
    modelo: 'psicologia organizacional contemporânea (isolamento e teletrabalho)',
    protetivo: 'A modalidade laboral avaliada reduz a exposição aos riscos associados ao trabalho remoto, como isolamento social e sobreposição entre vida pessoal e profissional. Não foram identificados sinais de desconexão emocional ou prejuízo ao sentimento de pertencimento. Sob a perspectiva da psicologia organizacional contemporânea, recomenda-se a manutenção das práticas de integração contínua.',
    exposicao: 'A análise quantitativa identificou exposição relevante ao trabalho remoto ou isolado, com sinais de distanciamento da equipe ou prolongamento informal da jornada. Sob a perspectiva da psicologia organizacional contemporânea, o isolamento eleva o risco de solidão, desengajamento e prejuízo ao pertencimento. Recomenda-se o acompanhamento próximo dos colaboradores remotos, a garantia de integração e a estruturação de protocolos de teletrabalho.',
    medida: 'Acompanhar de perto o trabalho remoto/isolado, garantindo integração e suporte contínuos.',
  },
}
