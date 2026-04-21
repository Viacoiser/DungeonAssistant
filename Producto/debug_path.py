"""
Debug: Check data path
"""
from pathlib import Path
import os

# Simulate dnd5e_search.py location
current_file = r"c:\Users\Usuario\Desktop\Proyecto T\TestDungeonAssistant-Enci\TestDungeonAssistant-Enci\backend\services\dnd5e_search.py"

# Method 1: Path calculation
p = Path(current_file)
print("Current file:", current_file)
print("Path(__file__).parent:", p.parent)
print("Path(__file__).parent.parent:", p.parent.parent)
print("Path(__file__).parent.parent.parent:", p.parent.parent.parent)

# Check different possible paths
data_path_1 = p.parent.parent / "data"
data_path_2 = p.parent.parent.parent / "frontend" / "src" / "data"
data_path_3 = p.parent.parent.parent / "backend" / "data"

print("\nPossible data paths:")
print("1 (backend/data):", data_path_1, "exists?", data_path_1.exists())
print("2 (frontend/src/data):", data_path_2, "exists?", data_path_2.exists())
print("3 (backend/data from root):", data_path_3, "exists?", data_path_3.exists())

# List what's actually in the correct path
if data_path_2.exists():
    print(f"\nFiles in {data_path_2}:")
    for f in data_path_2.iterdir():
        print(f"  - {f.name}")
