import urllib.request
import json
import ssl

url = "https://ep-withered-flower-amil9lqj-pooler.c-5.us-east-1.aws.neon.tech/sql"
headers = {
    "Content-Type": "application/json",
    "Neon-Connection-String": "postgresql://neondb_owner:npg_fx57zXavQCgk@ep-withered-flower-amil9lqj-pooler.c-5.us-east-1.aws.neon.tech/neondb"
}

def run_sql(query, label=""):
    data = json.dumps({"query": query}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            result = json.loads(resp.read().decode())
            print(f"OK: {label}")
            return result
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"ERROR: {label} -> {err}")
        return {"error": err}

# Q01-Q10
run_sql("""INSERT INTO "Question" ("code","topic","topicNum","text","hint","reverse","order") VALUES
('Q01','Assedio de Qualquer Natureza',1,'Voce ja presenciou ou sofreu comentarios ofensivos, piadas ou insinuacoes inadequadas no ambiente de trabalho?',NULL,false,1),
('Q02','Assedio de Qualquer Natureza',1,'Voce se sente a vontade para relatar situacoes de assedio moral ou sexual na empresa sem medo de represalias?',NULL,true,2),
('Q03','Assedio de Qualquer Natureza',1,'Existe um canal seguro e sigiloso para denunciar assedio na empresa?',NULL,true,3),
('Q04','Assedio de Qualquer Natureza',1,'Ha casos conhecidos de assedio moral ou sexual que nao foram devidamente investigados ou punidos?',NULL,false,4),
('Q05','Assedio de Qualquer Natureza',1,'O RH e os gestores demonstram comprometimento real com a prevencao do assedio?',NULL,true,5),
('Q06','Suporte e Apoio no Ambiente de Trabalho',2,'Voce sente que pode contar com seus colegas em momentos de dificuldade?',NULL,true,6),
('Q07','Suporte e Apoio no Ambiente de Trabalho',2,'Existe apoio da lideranca para lidar com desafios relacionados ao trabalho?',NULL,true,7),
('Q08','Suporte e Apoio no Ambiente de Trabalho',2,'O RH esta presente e atuante quando surgem conflitos ou dificuldades no trabalho?',NULL,true,8),
('Q09','Suporte e Apoio no Ambiente de Trabalho',2,'Os gestores promovem um ambiente saudavel e respeitoso?',NULL,true,9),
('Q10','Suporte e Apoio no Ambiente de Trabalho',2,'Voce sente que pode expressar suas dificuldades no trabalho sem ser julgado(a)?',NULL,true,10)
ON CONFLICT ("code") DO NOTHING""", "Q01-Q10")

# Q11-Q20
run_sql("""INSERT INTO "Question" ("code","topic","topicNum","text","hint","reverse","order") VALUES
('Q11','Ma Gestao de Mudancas Organizacionais',3,'Mudancas organizacionais impactaram negativamente seu sentimento de seguranca no trabalho?',NULL,false,11),
('Q12','Ma Gestao de Mudancas Organizacionais',3,'Ha comunicacao clara sobre mudancas que afetam a empresa ou os trabalhadores?',NULL,true,12),
('Q13','Ma Gestao de Mudancas Organizacionais',3,'Voce ja sentiu que seu emprego estava ameacado sem explicacoes claras durante periodos de mudanca?',NULL,false,13),
('Q14','Ma Gestao de Mudancas Organizacionais',3,'Existe transparencia na comunicacao da empresa durante processos de mudanca?',NULL,true,14),
('Q15','Baixa Clareza de Papel ou Funcao',4,'Voce recebe instrucoes claras sobre suas responsabilidades no trabalho?',NULL,true,15),
('Q16','Baixa Clareza de Papel ou Funcao',4,'A comunicacao da empresa ajuda voce a entender o que e esperado do seu trabalho?',NULL,true,16),
('Q17','Baixa Clareza de Papel ou Funcao',4,'A comunicacao entre equipes e setores contribui para a clareza das suas tarefas?',NULL,true,17),
('Q18','Baixa Clareza de Papel ou Funcao',4,'Voce se sente confortavel para pedir esclarecimentos quando nao entende suas funcoes ou prioridades?',NULL,true,18),
('Q19','Baixas Recompensas e Reconhecimento',5,'Voce sente que seu esforco e desempenho sao reconhecidos pela lideranca?',NULL,true,19),
('Q20','Baixas Recompensas e Reconhecimento',5,'Voce recebe feedback construtivo sobre o seu trabalho com regularidade?',NULL,true,20)
ON CONFLICT ("code") DO NOTHING""", "Q11-Q20")

# Q21-Q30
run_sql("""INSERT INTO "Question" ("code","topic","topicNum","text","hint","reverse","order") VALUES
('Q21','Baixas Recompensas e Reconhecimento',5,'Com que frequencia voce ja se sentiu desmotivado(a) por falta de reconhecimento no trabalho?',NULL,false,21),
('Q22','Baixo Controle no Trabalho / Falta de Autonomia',6,'Voce tem liberdade para tomar decisoes sobre como executar suas tarefas diarias?',NULL,true,22),
('Q23','Baixo Controle no Trabalho / Falta de Autonomia',6,'A empresa confia na sua capacidade de organizar e gerenciar o proprio trabalho?',NULL,true,23),
('Q24','Baixo Controle no Trabalho / Falta de Autonomia',6,'Existe excesso de controle ou burocracia que interfere no seu desempenho?',NULL,false,24),
('Q25','Baixo Controle no Trabalho / Falta de Autonomia',6,'Existe excesso de supervisao que impacta negativamente na sua produtividade ou bem-estar?',NULL,false,25),
('Q26','Baixa Justica Organizacional',7,'Voce acha justas e claras as formas que a empresa usa para avaliar o seu trabalho?',NULL,true,26),
('Q27','Baixa Justica Organizacional',7,'Voce sente que ha igualdade no reconhecimento entre diferentes areas ou equipes?',NULL,true,27),
('Q28','Baixa Justica Organizacional',7,'Voce sente que ha transparencia nas decisoes de desligamento na empresa?',NULL,true,28),
('Q29','Baixa Justica Organizacional',7,'Voce ja presenciou casos de demissoes que considerasse injustas?',NULL,false,29),
('Q30','Eventos Violentos ou Traumaticos',8,'Voce ja vivenciou ou presenciou alguma situacao de violencia grave no trabalho?',NULL,false,30)
ON CONFLICT ("code") DO NOTHING""", "Q21-Q30")

# Q31-Q40
run_sql("""INSERT INTO "Question" ("code","topic","topicNum","text","hint","reverse","order") VALUES
('Q31','Eventos Violentos ou Traumaticos',8,'Voce ja passou por algum evento grave no trabalho (acidente serio, situacao de risco extremo ou episodio muito impactante)?',NULL,false,31),
('Q32','Eventos Violentos ou Traumaticos',8,'Alguma situacao vivida no trabalho ja foi tao marcante que deixou medo, choque ou forte abalo emocional?',NULL,false,32),
('Q33','Baixa Demanda no Trabalho / Subcarga',9,'Voce sente que, na maior parte do tempo, tem pouco trabalho a realizar durante sua jornada?',NULL,false,33),
('Q34','Baixa Demanda no Trabalho / Subcarga',9,'Voce costuma ficar com tempo ocioso no trabalho por falta de tarefas ou demandas claras?',NULL,false,34),
('Q35','Baixa Demanda no Trabalho / Subcarga',9,'Voce sente que suas habilidades ou conhecimentos sao pouco utilizados no seu trabalho?',NULL,false,35),
('Q36','Baixa Demanda no Trabalho / Subcarga',9,'Seu trabalho costuma ser pouco desafiador ou repetitivo a ponto de gerar desanimo?',NULL,false,36),
('Q37','Excesso de Demandas / Sobrecarga',10,'Voce sente que sua carga de trabalho diaria e maior do que consegue realizar dentro do horario normal?',NULL,false,37),
('Q38','Excesso de Demandas / Sobrecarga',10,'Voce frequentemente precisa fazer horas extras ou levar trabalho para casa?',NULL,false,38),
('Q39','Excesso de Demandas / Sobrecarga',10,'Voce ja teve sintomas fisicos ou emocionais (exaustao, ansiedade ou insonia) devido ao excesso de trabalho?',NULL,false,39),
('Q40','Excesso de Demandas / Sobrecarga',10,'A equipe e dimensionada corretamente para a demanda/quantidade de trabalho existente?',NULL,true,40)
ON CONFLICT ("code") DO NOTHING""", "Q31-Q40")

# Q41-Q50
run_sql("""INSERT INTO "Question" ("code","topic","topicNum","text","hint","reverse","order") VALUES
('Q41','Maus Relacionamentos no Local de Trabalho',11,'Voce ja evitou colegas ou superiores por causa de desentendimentos frequentes?',NULL,false,41),
('Q42','Maus Relacionamentos no Local de Trabalho',11,'Voce percebe rivalidade excessiva ou desnecessaria entre colegas ou setores?',NULL,false,42),
('Q43','Maus Relacionamentos no Local de Trabalho',11,'Conflitos no trabalho costumam ser resolvidos de forma justa?',NULL,true,43),
('Q44','Trabalho em Condicoes de Dificil Comunicacao',12,'Voce trabalha em condicoes (turnos diferentes, trabalho externo ou distancia fisica) que dificultam a comunicacao?',NULL,false,44),
('Q45','Trabalho em Condicoes de Dificil Comunicacao',12,'A distancia fisica entre voce e sua equipe ou lideranca dificulta a troca de informacoes?',NULL,false,45),
('Q46','Trabalho em Condicoes de Dificil Comunicacao',12,'Voce ja teve dificuldade para receber informacoes importantes no momento certo por causa da organizacao do trabalho?',NULL,false,46),
('Q47','Trabalho em Condicoes de Dificil Comunicacao',12,'Voce tem acesso facil aos meios necessarios para se comunicar com colegas e lideranca durante o trabalho?',NULL,true,47),
('Q48','Trabalho Remoto e Isolado',13,'Voce trabalha grande parte do tempo de forma remota ou sozinho(a), com pouco contato presencial?',NULL,false,48),
('Q49','Trabalho Remoto e Isolado',13,'Voce sente que o trabalho remoto ou isolado faz com que se sinta distante da equipe ou da empresa?',NULL,false,49),
('Q50','Trabalho Remoto e Isolado',13,'Mesmo trabalhando de forma remota ou isolada, voce sente que recebe apoio e acompanhamento adequados da empresa?',NULL,true,50)
ON CONFLICT ("code") DO NOTHING""", "Q41-Q50")

# Create admin company and user
run_sql("""INSERT INTO "Company" ("id","name","slug","plan")
VALUES (gen_random_uuid()::TEXT, 'Minha Empresa', 'minha-empresa', 'starter')
ON CONFLICT ("slug") DO NOTHING""", "Empresa admin")

result = run_sql("""SELECT "id" FROM "Company" WHERE "slug" = 'minha-empresa' LIMIT 1""", "Buscar company_id")
company_id = result['rows'][0]['id']
print(f"Company ID: {company_id}")

run_sql(f"""INSERT INTO "User" ("id","companyId","email","passwordHash","role")
VALUES (
    gen_random_uuid()::TEXT,
    '{company_id}',
    'admin@minhaempresa.com',
    '$2b$12$bDg/3m.xBsMTix.XH1zGj.WwtjyLaMmRkDPAGrM0ix98TD6uRf.Ei',
    'ADMIN'
)
ON CONFLICT ("email") DO NOTHING""", "Usuario admin")

# Verify
q_count = run_sql('SELECT COUNT(*) as total FROM "Question"', "Contar questoes")
u_count = run_sql('SELECT COUNT(*) as total FROM "User"', "Contar usuarios")
print(f"\nQuestoes: {q_count.get('rows', [])}")
print(f"Usuarios: {u_count.get('rows', [])}")
print("\n=== Setup completo! ===")
