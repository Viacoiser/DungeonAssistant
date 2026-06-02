"""
Phase 1 - Seeding de encyclopedia en Supabase.

Descarga recursos desde dnd5eapi.co y realiza upsert en la tabla `encyclopedia`.
Uso:
  python scripts/seed_encyclopedia.py
  python scripts/seed_encyclopedia.py --categories spells,monsters,equipment
  python scripts/seed_encyclopedia.py --limit 50 --version 1.1
"""

import argparse
import asyncio
import os
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from supabase import Client, create_client

BASE_API_URL = "https://www.dnd5eapi.co/api/2014"
DEFAULT_CATEGORIES = [
    "traits",
    "equipment",
    "monsters",
    "spells",
    "races",
    "classes",
    "features",
    "feats",
    "backgrounds",
    "proficiencies",
]


def load_environment() -> None:
    root = Path(__file__).resolve().parent.parent
    env_path = root / ".env"
    load_dotenv(env_path)


def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en backend/.env")
    return create_client(url, key)


async def fetch_json(client: httpx.AsyncClient, url: str) -> dict[str, Any]:
    response = await client.get(url, timeout=30)
    response.raise_for_status()
    return response.json()


def chunk_list(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


async def seed_category(
    http_client: httpx.AsyncClient,
    supabase_client: Client,
    category: str,
    version: str,
    language: str,
    limit: int | None,
) -> tuple[int, int]:
    list_url = f"{BASE_API_URL}/{category}"
    payload = await fetch_json(http_client, list_url)
    
    # Manejo especial para subcategorías de equipo (ej: equipment-categories/weapon)
    if "equipment-categories" in category:
        results = payload.get("equipment", [])
    else:
        results = payload.get("results", [])

    if limit is not None:
        results = results[:limit]

    upsert_rows: list[dict[str, Any]] = []

    for item in results:
        item_url = item.get("url")
        item_index = item.get("index")
        item_name = item.get("name", item_index)

        if not item_url or not item_index:
            continue

        detail_url = item_url if item_url.startswith("http") else f"https://www.dnd5eapi.co{item_url}"

        try:
            detail = await fetch_json(http_client, detail_url)
        except Exception as exc:
            print(f"[WARN] {category}/{item_index}: fallo detalle ({exc})")
            continue

        # Normalizar categoría para la DB
        db_category = "equipment" if "equipment-categories" in category else category

        upsert_rows.append(
            {
                "category": db_category,
                "index": item_index,
                "name": item_name,
                "data": detail,
                "language": language,
                "source_url": detail_url,
                "source_system": "dnd5e",
                "version": version,
                "is_active": True,
            }
        )

    inserted = 0
    failed = 0

    for batch in chunk_list(upsert_rows, 100):
        try:
            supabase_client.table("encyclopedia").upsert(batch, on_conflict="category,index").execute()
            inserted += len(batch)
        except Exception as exc:
            failed += len(batch)
            print(f"[ERROR] upsert batch {category}: {exc}")

    return inserted, failed


async def run_seed(categories: list[str], version: str, language: str, limit: int | None) -> None:
    load_environment()
    supabase_client = get_supabase_client()

    print("== Seed Encyclopedia ==")
    print(f"Categorias: {', '.join(categories)}")
    print(f"Version: {version} | Language: {language} | Limit: {limit if limit else 'none'}")

    total_inserted = 0
    total_failed = 0

    async with httpx.AsyncClient(follow_redirects=True) as http_client:
        for category in categories:
            print(f"\n[START] {category}")
            try:
                inserted, failed = await seed_category(
                    http_client=http_client,
                    supabase_client=supabase_client,
                    category=category,
                    version=version,
                    language=language,
                    limit=limit,
                )
                total_inserted += inserted
                total_failed += failed
                print(f"[DONE] {category}: upsert={inserted}, failed={failed}")
            except Exception as exc:
                print(f"[ERROR] {category}: {exc}")

    print("\n== Seed Finished ==")
    print(f"Total upsert: {total_inserted}")
    print(f"Total failed: {total_failed}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed de encyclopedia en Supabase")
    parser.add_argument(
        "--categories",
        type=str,
        default=",".join(DEFAULT_CATEGORIES),
        help="Categorias separadas por coma",
    )
    parser.add_argument(
        "--version",
        type=str,
        default="1.0",
        help="Version a guardar en encyclopedia.version",
    )
    parser.add_argument(
        "--language",
        type=str,
        default="es",
        help="Idioma a guardar en encyclopedia.language",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limite de registros por categoria para pruebas",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    categories = [c.strip() for c in args.categories.split(",") if c.strip()]
    asyncio.run(run_seed(categories, args.version, args.language, args.limit))
