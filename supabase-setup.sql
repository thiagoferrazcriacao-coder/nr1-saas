-- ============================================================
-- NR1-SAAS — Setup completo do banco de dados
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. TABELAS
CREATE TABLE IF NOT EXISTS "Company" (
  "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name"             TEXT NOT NULL,
  "slug"             TEXT NOT NULL UNIQUE,
  "cnpj"             TEXT,
  "logoUrl"          TEXT,
  "stripeCustomerId" TEXT,
  "plan"             TEXT NOT NULL DEFAULT 'starter',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Company_slug_idx" ON "Company"("slug");

CREATE TABLE IF NOT EXISTS "User" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyId"    TEXT NOT NULL,
  "email"        TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role"         TEXT NOT NULL DEFAULT 'ADMIN',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "User_companyId_idx" ON "User"("companyId");

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id"                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyId"            TEXT NOT NULL,
  "stripeSubscriptionId" TEXT,
  "status"               TEXT NOT NULL,
  "plan"                 TEXT NOT NULL,
  "currentPeriodEnd"     TIMESTAMP(3),
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Subscription_companyId_idx" ON "Subscription"("companyId");

CREATE TABLE IF NOT EXISTS "Sector" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyId" TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "linkToken" TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Sector_companyId_idx" ON "Sector"("companyId");
CREATE INDEX IF NOT EXISTS "Sector_linkToken_idx" ON "Sector"("linkToken");

CREATE TABLE IF NOT EXISTS "TopicAssessment" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "sectorId"     TEXT NOT NULL,
  "topicNum"     INTEGER NOT NULL,
  "topic"        TEXT NOT NULL,
  "probability"  TEXT NOT NULL,
  "observations" TEXT,
  "assessedBy"   TEXT,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE,
  UNIQUE ("sectorId", "topicNum")
);
CREATE INDEX IF NOT EXISTS "TopicAssessment_sectorId_idx" ON "TopicAssessment"("sectorId");

CREATE TABLE IF NOT EXISTS "Response" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "sectorId"  TEXT NOT NULL,
  "answers"   JSONB NOT NULL,
  "riskScore" DOUBLE PRECISION,
  "riskLevel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Response_sectorId_idx" ON "Response"("sectorId");
CREATE INDEX IF NOT EXISTS "Response_createdAt_idx" ON "Response"("createdAt");

CREATE TABLE IF NOT EXISTS "AiAnalysis" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "responseId"     TEXT NOT NULL UNIQUE,
  "classification" JSONB NOT NULL,
  "recommendation" TEXT NOT NULL,
  "modelUsed"      TEXT NOT NULL,
  "processedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Question" (
  "id"      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "code"    TEXT NOT NULL UNIQUE,
  "topic"   TEXT NOT NULL,
  "topicNum" INTEGER NOT NULL,
  "text"    TEXT NOT NULL,
  "hint"    TEXT,
  "reverse" BOOLEAN NOT NULL DEFAULT FALSE,
  "order"   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "Question_topicNum_idx" ON "Question"("topicNum");
CREATE INDEX IF NOT EXISTS "Question_order_idx" ON "Question"("order");

-- ============================================================
-- 2. SEED — 50 questões NR-1
-- ============================================================
INSERT INTO "Question" ("code","topic","topicNum","text","hint","reverse","order") VALUES
-- Tópico 01 — Assédio de Qualquer Natureza
('Q01','Assédio de Qualquer Natureza',1,'Você já presenciou ou sofreu comentários ofensivos, piadas ou insinuações inadequadas no ambiente de trabalho?',NULL,false,1),
('Q02','Assédio de Qualquer Natureza',1,'Você se sente à vontade para relatar situações de assédio moral ou sexual na empresa sem medo de represálias?',NULL,true,2),
('Q03','Assédio de Qualquer Natureza',1,'Existe um canal seguro e sigiloso para denunciar assédio na empresa?',NULL,true,3),
('Q04','Assédio de Qualquer Natureza',1,'Há casos conhecidos de assédio moral ou sexual que não foram devidamente investigados ou punidos?',NULL,false,4),
('Q05','Assédio de Qualquer Natureza',1,'O RH e os gestores demonstram comprometimento real com a prevenção do assédio?',NULL,true,5),
-- Tópico 02 — Suporte e Apoio no Ambiente de Trabalho
('Q06','Suporte e Apoio no Ambiente de Trabalho',2,'Você sente que pode contar com seus colegas em momentos de dificuldade?',NULL,true,6),
('Q07','Suporte e Apoio no Ambiente de Trabalho',2,'Existe apoio da liderança para lidar com desafios relacionados ao trabalho?',NULL,true,7),
('Q08','Suporte e Apoio no Ambiente de Trabalho',2,'O RH está presente e atuante quando surgem conflitos ou dificuldades no trabalho?',NULL,true,8),
('Q09','Suporte e Apoio no Ambiente de Trabalho',2,'Os gestores promovem um ambiente saudável e respeitoso?',NULL,true,9),
('Q10','Suporte e Apoio no Ambiente de Trabalho',2,'Você sente que pode expressar suas dificuldades no trabalho sem ser julgado(a)?',NULL,true,10),
-- Tópico 03 — Má Gestão de Mudanças Organizacionais
('Q11','Má Gestão de Mudanças Organizacionais',3,'Mudanças organizacionais impactaram negativamente seu sentimento de segurança no trabalho?',NULL,false,11),
('Q12','Má Gestão de Mudanças Organizacionais',3,'Há comunicação clara sobre mudanças que afetam a empresa ou os trabalhadores?',NULL,true,12),
('Q13','Má Gestão de Mudanças Organizacionais',3,'Você já sentiu que seu emprego estava ameaçado sem explicações claras durante períodos de mudança?',NULL,false,13),
('Q14','Má Gestão de Mudanças Organizacionais',3,'Existe transparência na comunicação da empresa durante processos de mudança?',NULL,true,14),
-- Tópico 04 — Baixa Clareza de Papel ou Função
('Q15','Baixa Clareza de Papel ou Função',4,'Você recebe instruções claras sobre suas responsabilidades no trabalho?',NULL,true,15),
('Q16','Baixa Clareza de Papel ou Função',4,'A comunicação da empresa ajuda você a entender o que é esperado do seu trabalho?',NULL,true,16),
('Q17','Baixa Clareza de Papel ou Função',4,'A comunicação entre equipes e setores contribui para a clareza das suas tarefas?',NULL,true,17),
('Q18','Baixa Clareza de Papel ou Função',4,'Você se sente confortável para pedir esclarecimentos quando não entende suas funções ou prioridades?',NULL,true,18),
-- Tópico 05 — Baixas Recompensas e Reconhecimento
('Q19','Baixas Recompensas e Reconhecimento',5,'Você sente que seu esforço e desempenho são reconhecidos pela liderança?',NULL,true,19),
('Q20','Baixas Recompensas e Reconhecimento',5,'Você recebe feedback construtivo sobre o seu trabalho com regularidade?',NULL,true,20),
('Q21','Baixas Recompensas e Reconhecimento',5,'Com que frequência você já se sentiu desmotivado(a) por falta de reconhecimento no trabalho?',NULL,false,21),
-- Tópico 06 — Baixo Controle no Trabalho / Falta de Autonomia
('Q22','Baixo Controle no Trabalho / Falta de Autonomia',6,'Você tem liberdade para tomar decisões sobre como executar suas tarefas diárias?',NULL,true,22),
('Q23','Baixo Controle no Trabalho / Falta de Autonomia',6,'A empresa confia na sua capacidade de organizar e gerenciar o próprio trabalho?',NULL,true,23),
('Q24','Baixo Controle no Trabalho / Falta de Autonomia',6,'Existe excesso de controle ou burocracia que interfere no seu desempenho?',NULL,false,24),
('Q25','Baixo Controle no Trabalho / Falta de Autonomia',6,'Existe excesso de supervisão que impacta negativamente na sua produtividade ou bem-estar?',NULL,false,25),
-- Tópico 07 — Baixa Justiça Organizacional
('Q26','Baixa Justiça Organizacional',7,'Você acha justas e claras as formas que a empresa usa para avaliar o seu trabalho?',NULL,true,26),
('Q27','Baixa Justiça Organizacional',7,'Você sente que há igualdade no reconhecimento entre diferentes áreas ou equipes?',NULL,true,27),
('Q28','Baixa Justiça Organizacional',7,'Você sente que há transparência nas decisões de desligamento na empresa?',NULL,true,28),
('Q29','Baixa Justiça Organizacional',7,'Você já presenciou casos de demissões que considerasse injustas?',NULL,false,29),
-- Tópico 08 — Eventos Violentos ou Traumáticos
('Q30','Eventos Violentos ou Traumáticos',8,'Você já vivenciou ou presenciou alguma situação de violência grave no trabalho (agressão física, ameaça séria ou ataque verbal intenso)?',NULL,false,30),
('Q31','Eventos Violentos ou Traumáticos',8,'Você já passou por algum evento grave no trabalho (acidente sério, situação de risco extremo ou episódio muito impactante)?',NULL,false,31),
('Q32','Eventos Violentos ou Traumáticos',8,'Alguma situação vivida no trabalho já foi tão marcante que deixou medo, choque ou forte abalo emocional?',NULL,false,32),
-- Tópico 09 — Baixa Demanda no Trabalho / Subcarga
('Q33','Baixa Demanda no Trabalho / Subcarga',9,'Você sente que, na maior parte do tempo, tem pouco trabalho a realizar durante sua jornada?',NULL,false,33),
('Q34','Baixa Demanda no Trabalho / Subcarga',9,'Você costuma ficar com tempo ocioso no trabalho por falta de tarefas ou demandas claras?',NULL,false,34),
('Q35','Baixa Demanda no Trabalho / Subcarga',9,'Você sente que suas habilidades ou conhecimentos são pouco utilizados no seu trabalho?',NULL,false,35),
('Q36','Baixa Demanda no Trabalho / Subcarga',9,'Seu trabalho costuma ser pouco desafiador ou repetitivo a ponto de gerar desânimo?',NULL,false,36),
-- Tópico 10 — Excesso de Demandas / Sobrecarga
('Q37','Excesso de Demandas / Sobrecarga',10,'Você sente que sua carga de trabalho diária é maior do que consegue realizar dentro do horário normal?',NULL,false,37),
('Q38','Excesso de Demandas / Sobrecarga',10,'Você frequentemente precisa fazer horas extras ou levar trabalho para casa?',NULL,false,38),
('Q39','Excesso de Demandas / Sobrecarga',10,'Você já teve sintomas físicos ou emocionais (exaustão, ansiedade ou insônia) devido ao excesso de trabalho?',NULL,false,39),
('Q40','Excesso de Demandas / Sobrecarga',10,'A equipe é dimensionada corretamente para a demanda/quantidade de trabalho existente?',NULL,true,40),
-- Tópico 11 — Maus Relacionamentos no Local de Trabalho
('Q41','Maus Relacionamentos no Local de Trabalho',11,'Você já evitou colegas ou superiores por causa de desentendimentos frequentes?',NULL,false,41),
('Q42','Maus Relacionamentos no Local de Trabalho',11,'Você percebe rivalidade excessiva ou desnecessária entre colegas ou setores?',NULL,false,42),
('Q43','Maus Relacionamentos no Local de Trabalho',11,'Conflitos no trabalho costumam ser resolvidos de forma justa?',NULL,true,43),
-- Tópico 12 — Trabalho em Condições de Difícil Comunicação
('Q44','Trabalho em Condições de Difícil Comunicação',12,'Você trabalha em condições (turnos diferentes, trabalho externo ou distância física) que dificultam a comunicação?',NULL,false,44),
('Q45','Trabalho em Condições de Difícil Comunicação',12,'A distância física entre você e sua equipe ou liderança dificulta a troca de informações?',NULL,false,45),
('Q46','Trabalho em Condições de Difícil Comunicação',12,'Você já teve dificuldade para receber informações importantes no momento certo por causa da organização do trabalho?',NULL,false,46),
('Q47','Trabalho em Condições de Difícil Comunicação',12,'Você tem acesso fácil aos meios necessários para se comunicar com colegas e liderança durante o trabalho?',NULL,true,47),
-- Tópico 13 — Trabalho Remoto e Isolado
('Q48','Trabalho Remoto e Isolado',13,'Você trabalha grande parte do tempo de forma remota ou sozinho(a), com pouco contato presencial?',NULL,false,48),
('Q49','Trabalho Remoto e Isolado',13,'Você sente que o trabalho remoto ou isolado faz com que se sinta distante da equipe ou da empresa?',NULL,false,49),
('Q50','Trabalho Remoto e Isolado',13,'Mesmo trabalhando de forma remota ou isolada, você sente que recebe apoio e acompanhamento adequados da empresa?',NULL,true,50)
ON CONFLICT ("code") DO NOTHING;

-- ============================================================
-- 3. ADMIN — Empresa e usuário inicial
-- senha: 123456 (hash bcrypt rounds=12)
-- ============================================================
DO $$
DECLARE
  company_id TEXT;
BEGIN
  -- Cria empresa se não existir
  INSERT INTO "Company" ("id","name","slug","plan")
  VALUES (gen_random_uuid()::TEXT, 'Minha Empresa', 'minha-empresa', 'starter')
  ON CONFLICT ("slug") DO NOTHING;

  SELECT "id" INTO company_id FROM "Company" WHERE "slug" = 'minha-empresa';

  -- Cria admin se não existir
  -- Hash bcrypt de '123456' com 12 rounds
  INSERT INTO "User" ("id","companyId","email","passwordHash","role")
  VALUES (
    gen_random_uuid()::TEXT,
    company_id,
    'admin@minhaempresa.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VK.s5uCP2',
    'ADMIN'
  )
  ON CONFLICT ("email") DO NOTHING;
END $$;

-- ============================================================
-- Verificação final
-- ============================================================
SELECT 'Tabelas criadas: ' || COUNT(*)::TEXT FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Questões inseridas: ' || COUNT(*)::TEXT FROM "Question";
SELECT 'Admin criado: ' || "email" FROM "User" WHERE "role" = 'ADMIN' LIMIT 1;
