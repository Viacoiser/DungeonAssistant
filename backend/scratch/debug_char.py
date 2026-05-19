import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(timeout=30.0) as c:
        await c.post('http://localhost:8000/api/auth/register', json={'email':'test22@test.com', 'password':'SecurePassword123!', 'username':'test22'})
        resp = await c.post('http://localhost:8000/api/auth/login', json={'email':'test22@test.com', 'password':'SecurePassword123!'})
        t = resp.json().get('access_token')
        
        full_char_data = {
            "name": "Gandalf",
            "race": "Maia",
            "class_": "Wizard",
            "level": 20,
            "hp_max": 120,
            "hp_current": 120,
            "stats": {"strength": 10, "dexterity": 14, "constitution": 14, "intelligence": 20, "wisdom": 18, "charisma": 16},
            "background": "Sage",
            "alignment": "Neutral Good",
            "equipment": "Staff, Robes",
            "attacks": [{"name": "Staff", "attack_bonus": "+8", "damage": "1d6+4", "damage_type": "bludgeoning"}],
            "currency": {"gp": 100, "sp": 50, "cp": 0, "ep": 0, "pp": 0},
            "personality_traits": "Wise and mysterious",
            "ideals": "Protect the innocent",
            "bonds": "Fellowship",
            "flaws": "Smokes too much pipeweed",
            "backstory": "Came from Valinor",
            "campaign_id": None
        }
        r = await c.post('http://localhost:8000/api/characters', json=full_char_data, headers={'Authorization': f'Bearer {t}'})
        print('Status:', r.status_code)
        print('Response:', r.text)

if __name__ == '__main__':
    asyncio.run(test())
