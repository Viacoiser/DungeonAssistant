import json

with open('frontend/src/data/items.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f'Total items: {len(items)}')
print('\nSample items:')
for i in range(min(15, len(items))):
    print(f'  - {items[i].get("name", "N/A")}')
