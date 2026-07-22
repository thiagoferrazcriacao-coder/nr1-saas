# SPEC — Plano de Ação por 12 meses + Assinatura do Gestor + Atas

> Documento de referência aprovado por Thiago. Guia a implementação. Deve ser mantido
> "em pauta" e atualizado sempre que a regra evoluir.

## Contexto
Estamos migrando o Plano de Ação de "52 semanas" para um modelo de **12 meses / 13 fatores**,
com **ritual mensal**, **atas por ação**, **assinatura do gestor** (sem psicóloga) e
**biblioteca organizada por mês** (gestor e colaborador). Abaixo, cada regra em detalhe.

---

## 1. Assinatura do Gestor (remover a da psicóloga)
- **Remover** de TODOS os documentos gerados a assinatura/registro da psicóloga (Annie Talma / CRP).
- **Todos os documentos** (DRPS, Anexo para o PGR, Plano de Ação e Atas) passam a levar a
  **assinatura do GESTOR**.
- Em **Configurações da empresa**, adicionar:
  - Campo **Nome do gestor responsável**.
  - **Upload da assinatura** do gestor (imagem JPG/PNG) — reaproveitar o mecanismo de upload
    que já existe (upload-url → R2). Guardar `gestorName` e `gestorSignatureUrl` na empresa.
- Ao gerar qualquer documento: usar `gestorName` + imagem da assinatura no rodapé de assinatura.
  Se não houver assinatura enviada, mostrar apenas o nome + linha para assinar à mão.

## 2. Plano de Ação sempre com 12 meses (fim da lógica de vencimento)
- **Remover** qualquer lógica de "morrer junto com o acesso" / proporcional ao tempo restante
  (o `horizonWeeks` reduzido some).
- **Todo plano tem SEMPRE 12 meses**, não importa quando foi criado.
- Se a empresa refizer a avaliação no mês 11 (ou em qualquer momento), o novo plano nasce
  **com 12 meses cheios** de novo. Se refez 3 vezes, os 3 planos têm 12 meses cada.
- Não conta mais a partir do dia que entrou na plataforma. Cada plano é independente e completo.

## 3. Régua de ordenação dos 13 fatores (4 critérios em cascata — resultado sempre único)
Ordena do mais prioritário ao menos, sem intervenção manual:
1. **Classificação do DRPS**: Crítico → Alto → Médio → Baixo.
2. **Desempate por peso jurídico** (dentro do mesmo nível, estes passam à frente dos demais,
   nesta ordem): **Assédio (1) → Justiça organizacional (7) → Eventos traumáticos (8) → Sobrecarga (10)**.
3. **Desempate pela pontuação de gravidade** do DRPS (numérica, maior primeiro).
4. **Desempate final**: ordem numérica fixa do fator (1 a 13).

> Implementação: chave de ordenação = (nívelDRPS, grupoJurídico, -score, númeroFator).
> grupoJurídico: Assédio=0, Justiça=1, Eventos=2, Sobrecarga=3, demais=4.

## 4. Estrutura: 13 fatores em 12 meses + Regra do Mês Duplo
- O plano é dividido em **13 tópicos** (os 13 fatores), distribuídos em **12 meses**.
- Como são 13 fatores e 12 meses, **exatamente um mês** terá **ação dupla** (2 fatores juntos).
- **Padrão do mês duplo:** **Difícil comunicação (12)** + **Maus relacionamentos (11)** sempre
  dividem um mês.
- **Exceção:** se **qualquer um dos dois** der **Crítico ou Alto**, ele **ganha mês próprio**
  (com prioridade na fila, conforme a régua) e o mês duplo **passa para o primeiro reserva disponível**.
- **Reservas (candidatos a dividir mês), em ordem:**
  - **Reserva 1:** **Subcarga (9)** + **Sobrecarga (10)** — só se **ambos** estiverem Baixo ou Médio.
    Sobrecarga em Alto/Crítico **nunca** divide mês.
  - **Reserva 2:** **Má gestão de mudanças (3)** + **Baixa clareza de papel (4)** — mesma condição
    (ambos Baixo ou Médio).
- **Caso extremo:** se nenhuma dupla se qualificar, a plataforma **junta os dois últimos fatores
  do ranking**, sejam quais forem.
- Garantia: **o sistema sempre fecha 13 fatores em 12 meses sozinho**.

## 5. Regra do Crítico
- **Fator crítico abre o calendário sempre no Mês 1** (a régua já garante isso).
- **Assédio (1) em Crítico OU Alto** carrega uma **medida adicional obrigatória** no mês dele:
  **ativação do canal de denúncias com comunicação registrada à equipe**. A ação já aparece
  indicada automaticamente naquele mês.

## 6. Ritual Mensal (4 passos — igual todo mês, muda só o fator)
1. **Gestor assiste os vídeos dele e libera os da equipe.** Não trava nada — só **sugere a ordem**
   (gestor primeiro, depois a equipe). Biblioteca **filtrada pelo fator do mês**.
2. **Executa a ação simples do fator** (uma ação objetiva por fator — ver banco de ações).
3. **Registra em ata de uma página.**
4. **Anexa como evidência na plataforma.**

> O conjunto **vídeos + ação registrada (ata + evidência)** é o que sustenta a "gestão contínua"
> perante a fiscalização.

## 7. Biblioteca organizada por MÊS (gestor e colaborador)
- Os vídeos ficam **liberados o tempo todo** para os funcionários assistirem quando quiserem,
  mas a plataforma **propõe a ordem por mês**.
- **Colaborador:** a biblioteca dele também é **separada por meses** (igual o gestor vê). Ele vê
  o **mês atual em destaque**; clica no mês e assiste os vídeos sugeridos daquele mês. Nada de
  lista bagunçada — ele entende **por mês** e, dentro do mês, o **assunto/fator** tratado.
- **Rótulo do mês:** Mês 1 … Mês 12 (contados a partir da criação do plano), exibindo também o
  **nome do mês do calendário** correspondente. Os vídeos sugeridos vêm do Índice de Vídeos,
  filtrados pelo fator daquele mês (trilha do gestor e trilha do colaborador).

## 8. Botão "Gerar Ata" (por ação / por mês)
- Cada ação/mês tem um botão **"Gerar ata do evento"**.
- A ata **resume o que foi feito** e **abre espaços para assinatura**.
- O gestor pode **anexar foto do dia/evento/ação** e **documentos** (opcional).
- Ao clicar em "Gerar ata", o documento mostra:
  - Resumo do que foi feito (fator, mês, ação executada).
  - As **fotos** anexadas e **todas as evidências**.
  - No rodapé, um **espaço com linhas** para colher as **assinaturas das pessoas presentes/participantes**
    do evento.
  - Assinatura do gestor (conforme item 1).

## 9. Botão "Anexar Evidências" (em cada mês)
- Em cada mês, botão **"Anexar evidências"**: pode subir **foto, material extra, PDF** que o gestor
  achar relevante. Fica guardado como evidência daquele fator/mês.

## 10. Mês 12 — Reaplicação do DRPS
- O **Mês 12** é: o **fator final do ranking** + a **sugestão de reaplicar o DRPS**.
- No último mês, a plataforma avisa: *"Você precisa reaplicar o DRPS — refazer os questionários"*
  para dar continuidade ao ciclo (e aí um novo plano de 12 meses é gerado — ver item 2).

---

## Impacto técnico (arquivos previstos)
- `src/lib/action-plan-engine.ts` — reescrever: sair de 52 semanas → **12 meses / 13 fatores**,
  aplicar a **régua de ordenação** (item 3), a **regra do mês duplo** (item 4) e a **regra do crítico** (item 5).
- `src/lib/training-schedule.ts` — passar de semanas → **meses**; liberação/organização por mês.
- `prisma/schema.prisma` — Company: `gestorName`, `gestorSignatureUrl`. Novo modelo **Ata**
  (mês, fator, resumo, fotos[], docs[], assinaturas, createdAt) e/ou reaproveitar evidências.
- `src/app/painel/configuracoes/page.tsx` + API — nome do gestor + upload da assinatura.
- Plano de Ação (UI) — visão por **12 meses**, ritual de 4 passos, botões **Gerar ata** e **Anexar evidências** por mês.
- `.../action-plans/[sectorId]/pdf` e `.../drps` e `.../pgr` — **trocar assinatura** (gestor no lugar da psicóloga).
- Nova rota de **geração de Ata** (HTML/PDF com resumo + fotos + linhas de assinatura).
- Área do colaborador (`/aprender/[slug]`) e Material Didático — biblioteca **por mês**.

## Pontos que decidi por boa prática (me corrija se quiser diferente)
- **Meses relativos:** Mês 1 = 1º mês após criar o plano; mostro também o nome do mês do calendário.
- **"Ação simples do fator":** uma ação objetiva por fator (curada do banco de ações atual, nível "origem").
- **Assinatura do gestor** aplica em DRPS, Anexo PGR, Plano de Ação e Atas.
- Atas e evidências ficam **guardadas por 20 anos** (mantém o aviso legal já existente).

## A confirmar antes de executar
1. A "ação simples" de cada um dos 13 fatores — você aprova eu **curar 1 ação por fator** do banco
   atual, ou você quer ditar quais são?
2. Rótulo do mês: **"Mês 1 (Julho/2026)"** está bom, ou prefere só "Mês 1"?
3. Ata: além das linhas de assinatura dos presentes, quer um **campo de "lista de presença"**
   (nome + assinatura por linha), tipo chamada?
