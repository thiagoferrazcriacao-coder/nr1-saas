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

print("Adicionando colunas de validação DRPS em Company...")
for col, typ, default in [
    ("drpsStatus",      "TEXT",         "'pendente'"),
    ("drpsValidatedAt", "TIMESTAMP(3)", None),
    ("drpsValidatedBy", "TEXT",         None),
    ("drpsNotes",       "TEXT",         None),
]:
    sql = f'ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "{col}" {typ}'
    if default:
        sql += f" DEFAULT {default}"
    run_sql(sql, f"Company.{col}")

print("\nMigration concluida!")
