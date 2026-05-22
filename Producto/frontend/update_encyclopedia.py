import json
import os

base_path = 'src/data/encyclopedia'

# Spells
spells_file = os.path.join(base_path, 'spells.json')
with open(spells_file, 'r', encoding='utf-8') as f:
    spells = json.load(f)

new_spells = [
    {
        "id": "magic-missile",
        "name": "Proyectil mágico / Magic Missile",
        "level": 1,
        "school": "Evocación",
        "casting_time": "1 acción",
        "range": "120 pies",
        "components": "V, S",
        "duration": "Instantáneo",
        "desc": ["Dispara dardos de energía que impactan automáticamente causando daño de fuerza."],
        "damage": "1d4 + 1 fuerza (por dardo)"
    },
    {
        "id": "fireball-2",
        "name": "Bola de fuego / Fireball (Resumen)",
        "level": 3,
        "school": "Evocación",
        "casting_time": "1 acción",
        "range": "150 pies",
        "components": "V, S, M",
        "duration": "Instantáneo",
        "desc": ["Explosión de fuego en área que causa gran daño a múltiples enemigos."],
        "damage": "8d6 fuego"
    },
    {
        "id": "invisibility",
        "name": "Invisibilidad / Invisibility",
        "level": 2,
        "school": "Ilusión",
        "casting_time": "1 acción",
        "range": "Toque",
        "components": "V, S, M",
        "duration": "Concentración, hasta 1 hora",
        "desc": ["Vuelve invisible a una criatura hasta que ataque o lance un conjuro."]
    },
    {
        "id": "shield",
        "name": "Escudo / Shield",
        "level": 1,
        "school": "Abjuración",
        "casting_time": "1 reacción",
        "range": "Personal",
        "components": "V, S",
        "duration": "1 ronda",
        "desc": ["Como reacción, otorga +5 a la CA hasta el siguiente turno y anula los proyectiles mágicos."]
    },
    {
        "id": "cure-wounds",
        "name": "Curar heridas / Cure Wounds",
        "level": 1,
        "school": "Evocación",
        "casting_time": "1 acción",
        "range": "Toque",
        "components": "V, S",
        "duration": "Instantáneo",
        "desc": ["Restaura puntos de golpe a una criatura tocada."],
        "damage": "1d8 + modificador curación"
    }
]
spells.extend(new_spells)
with open(spells_file, 'w', encoding='utf-8') as f:
    json.dump(spells, f, indent=2, ensure_ascii=False)

# Monsters
monsters_file = os.path.join(base_path, 'monsters.json')
with open(monsters_file, 'r', encoding='utf-8') as f:
    monsters = json.load(f)

new_monsters = [
    {
        "id": "goblin-2",
        "name": "Goblin (Resumen)",
        "type": "humanoide",
        "size": "Pequeño",
        "challenge_rating": "1/4",
        "armor_class": "15",
        "hit_points": "7",
        "hit_dice": "2d6",
        "strength": 8,
        "dexterity": 14,
        "constitution": 10,
        "intelligence": 10,
        "wisdom": 8,
        "charisma": 8,
        "actions": [
            {
                "name": "Descripción",
                "desc": "Criatura astuta y cobarde que combate en grupo. Puede esconderse o retirarse como acción adicional."
            }
        ]
    },
    {
        "id": "orc",
        "name": "Orco",
        "type": "humanoide",
        "size": "Mediano",
        "challenge_rating": "1/2",
        "armor_class": "13",
        "hit_points": "15",
        "hit_dice": "2d8 + 6",
        "strength": 16,
        "dexterity": 12,
        "constitution": 16,
        "intelligence": 7,
        "wisdom": 11,
        "charisma": 10,
        "actions": [
            {
                "name": "Descripción",
                "desc": "Guerrero brutal que puede avanzar rápidamente hacia sus enemigos gracias a su agresividad."
            }
        ]
    },
    {
        "id": "skeleton",
        "name": "Esqueleto / Skeleton",
        "type": "muerto viviente",
        "size": "Mediano",
        "challenge_rating": "1/4",
        "armor_class": "13",
        "hit_points": "13",
        "hit_dice": "2d8 + 4",
        "strength": 10,
        "dexterity": 14,
        "constitution": 15,
        "intelligence": 6,
        "wisdom": 8,
        "charisma": 5,
        "actions": [
            {
                "name": "Descripción",
                "desc": "Inmune al veneno, vulnerable al daño contundente. Usa armas simples como espada o arco."
            }
        ]
    },
    {
        "id": "zombie",
        "name": "Zombi / Zombie",
        "type": "muerto viviente",
        "size": "Mediano",
        "challenge_rating": "1/4",
        "armor_class": "8",
        "hit_points": "22",
        "hit_dice": "3d8 + 9",
        "strength": 13,
        "dexterity": 6,
        "constitution": 16,
        "intelligence": 3,
        "wisdom": 6,
        "charisma": 5,
        "actions": [
            {
                "name": "Descripción",
                "desc": "Lento pero resistente, puede evitar caer a 0 puntos de golpe gracias a su resistencia antinatural."
            }
        ]
    },
    {
        "id": "mimic",
        "name": "Mímico / Mimic",
        "type": "monstruosidad",
        "size": "Mediano",
        "challenge_rating": "2",
        "armor_class": "12",
        "hit_points": "58",
        "hit_dice": "9d8 + 18",
        "strength": 17,
        "dexterity": 12,
        "constitution": 15,
        "intelligence": 5,
        "wisdom": 13,
        "charisma": 8,
        "actions": [
            {
                "name": "Descripción",
                "desc": "Se disfraza de objeto común para emboscar a sus presas y atraparlas con su cuerpo adhesivo."
            }
        ]
    }
]
monsters.extend(new_monsters)
with open(monsters_file, 'w', encoding='utf-8') as f:
    json.dump(monsters, f, indent=2, ensure_ascii=False)

# Equipment
equipment_file = os.path.join(base_path, 'equipment.json')
with open(equipment_file, 'r', encoding='utf-8') as f:
    equipment = json.load(f)

new_equipment = [
    {
        "id": "acid-vial",
        "name": "Ácido (vial)",
        "category": "adventuring-gear",
        "equipment_category": { "name": "Adventuring Gear" },
        "cost": { "quantity": 25, "unit": "gp" },
        "weight": 1,
        "desc": ["Puede lanzarse para causar 2d6 de daño de ácido a una criatura impactada."]
    },
    {
        "id": "alchemists-fire",
        "name": "Fuego de alquimista",
        "category": "adventuring-gear",
        "equipment_category": { "name": "Adventuring Gear" },
        "cost": { "quantity": 50, "unit": "gp" },
        "weight": 1,
        "desc": ["Se adhiere al objetivo y le causa 1d4 de daño de fuego por turno hasta que se apague."]
    },
    {
        "id": "healers-kit",
        "name": "Kit de sanador",
        "category": "adventuring-gear",
        "equipment_category": { "name": "Adventuring Gear" },
        "cost": { "quantity": 5, "unit": "gp" },
        "weight": 3,
        "desc": ["Permite estabilizar criaturas a 0 puntos de golpe sin necesidad de prueba. (10 usos)"]
    },
    {
        "id": "potion-of-healing",
        "name": "Poción de curación",
        "category": "magic",
        "equipment_category": { "name": "Magic Item" },
        "cost": { "quantity": 50, "unit": "gp" },
        "weight": 0.5,
        "desc": ["Cura 2d4 + 2 puntos de golpe al beberse."]
    },
    {
        "id": "bag-of-holding",
        "name": "Bolsa de contención / Bag of Holding",
        "category": "magic",
        "equipment_category": { "name": "Magic Item" },
        "weight": 15,
        "desc": ["Contenedor extradimensional capaz de almacenar gran cantidad de peso (hasta 500 lb) sin aumentar significativamente su masa."]
    }
]
equipment.extend(new_equipment)
with open(equipment_file, 'w', encoding='utf-8') as f:
    json.dump(equipment, f, indent=2, ensure_ascii=False)

# Traits
traits_file = os.path.join(base_path, 'traits.json')
with open(traits_file, 'r', encoding='utf-8') as f:
    traits = json.load(f)

new_traits = [
    {
        "id": "alert",
        "name": "Alerta / Alert",
        "category": "feats",
        "desc": ["El personaje no puede ser sorprendido mientras esté consciente, obtiene +5 a la iniciativa y las criaturas ocultas no tienen ventaja automática contra él."]
    },
    {
        "id": "lucky",
        "name": "Afortunado / Lucky",
        "category": "feats",
        "desc": ["El personaje tiene 3 puntos de suerte por descanso largo que puede usar para repetir tiradas de ataque, pruebas o salvaciones, o influir en ataques contra él."]
    },
    {
        "id": "mobile",
        "name": "Móvil / Mobile",
        "category": "feats",
        "desc": ["Aumenta la velocidad en 10 pies y evita ataques de oportunidad de criaturas a las que haya atacado en ese turno."]
    },
    {
        "id": "healer",
        "name": "Sanador / Healer",
        "category": "feats",
        "desc": ["Permite usar un kit de sanador para estabilizar criaturas y curarlas con una acción una vez por descanso."]
    },
    {
        "id": "great-weapon-master",
        "name": "Maestro de armas grandes / Great Weapon Master",
        "category": "feats",
        "desc": ["Permite hacer un ataque adicional tras crítico o matar un enemigo, y aceptar -5 al ataque para ganar +10 al daño."]
    }
]
traits.extend(new_traits)
with open(traits_file, 'w', encoding='utf-8') as f:
    json.dump(traits, f, indent=2, ensure_ascii=False)

print("Data appended successfully!")
