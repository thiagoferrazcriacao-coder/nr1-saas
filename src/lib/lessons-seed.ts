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
