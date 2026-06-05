import urllib.request, json, ssl

url = "https://ep-withered-flower-amil9lqj-pooler.c-5.us-east-1.aws.neon.tech/sql"
headers = {
    "Content-Type": "application/json",
    "Neon-Connection-String": "postgresql://neondb_owner:npg_fx57zXavQCgk@ep-withered-flower-amil9lqj-pooler.c-5.us-east-1.aws.neon.tech/neondb"
}

def run_sql(query, label=""):
    data = json.dumps({"query": query}).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx) as r:
            json.loads(r.read())
            print(f"  OK: {label}")
    except urllib.error.HTTPError as e:
        print(f"  ERRO {label}: {e.read().decode()}")

print("Adicionando colunas em Company...")
for col, typ in [
    ("fantasyName", "TEXT"),
    ("responsible", "TEXT"),
    ("phone", "TEXT"),
    ("address", "TEXT"),
    ("city", "TEXT"),
    ("state", "TEXT"),
]:
    run_sql(f'ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "{col}" {typ}', f"Company.{col}")

print("\nCriando CompanyAssessment...")
run_sql("""
CREATE TABLE IF NOT EXISTS "CompanyAssessment" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "companyId"   TEXT NOT NULL UNIQUE,
  "items"       JSONB NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE
)""", "CompanyAssessment")

print("\nCriando ActionPlan...")
run_sql("""
CREATE TABLE IF NOT EXISTS "ActionPlan" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "sectorId"  TEXT NOT NULL UNIQUE,
  "companyId" TEXT NOT NULL,
  "items"     JSONB NOT NULL DEFAULT '[]',
  "status"    TEXT NOT NULL DEFAULT 'ativo',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sectorId")  REFERENCES "Sector"("id")  ON DELETE CASCADE,
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE
)""", "ActionPlan")
run_sql('CREATE INDEX IF NOT EXISTS "ActionPlan_companyId_idx" ON "ActionPlan"("companyId")', "idx ActionPlan")

print("\nPronto!")
