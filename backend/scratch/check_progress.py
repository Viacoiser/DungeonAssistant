import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("encyclopedia").select("id", count="exact").execute()
print(f"TOTAL_ROWS: {res.count}")

# Check by category
res = supabase.table("encyclopedia").select("category").execute()
categories = {}
for item in res.data:
    cat = item["category"]
    categories[cat] = categories.get(cat, 0) + 1

for cat, count in categories.items():
    print(f"{cat}: {count}")
