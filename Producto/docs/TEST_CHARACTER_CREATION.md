# Quick Test: Create Character with Encyclopedia Items

## 🎮 Step-by-Step Guide to Test Filters

### Step 1: Navigate to Character Creation
1. Open the application
2. Click on "New Campaign" or go to Campaigns
3. Click "Add Character" or similar
4. You'll see the Character Form

---

### Step 2: Test Equipment Filter

**Expected Behavior**:
- ✅ When form loads, equipment items should already be visible
- ✅ You should see buttons for "armor" and "transport" categories
- ✅ Clicking each should show different items

**Action Steps**:
1. Look for "Starting Equipment" section
2. By default, should show **armor** items:
   - Aceite (frasco)
   - Agua bendita
   - Anillo de invisibilidad / Ring of Invisibility
   - ... and 23 more

3. Click "transport" button
4. Should show **25 transport items**:
   - Abrojos
   - Amuleto de salud
   - Anillo de regeneración
   - ... and 22 more

**Test**: Try adding 2-3 items from each category
- Click the `+` button next to each item
- Items appear in "Equipment Added" list
- Can adjust quantity

---

### Step 3: Test Traits Filter

**Expected Behavior**:
- ✅ All trait category buttons should have data
- ✅ No empty filter categories
- ✅ Clicking each shows relevant items

**Action Steps**:
1. Look for "Starting Traits" section
2. You'll see category buttons:
   - **all** - shows all 51 traits
   - **races** - shows 13 race traits
   - **classes** - shows 13 class abilities
   - **backgrounds** - shows 13 background features
   - **proficiencies** - shows 12 proficiency types

**Test Each**:

#### All Traits (51 total)
```
Select → Click "all" button
See all traits sorted alphabetically
- Adepto elemental
- Adepto en armaduras ligeras
- ... (48 more)
```

#### Races (13)
```
Select → Click "races" button
See only race traits:
- Adepto en escudos pesados
- Adepto en reflejos
- Adepto marcial superior
- ... (10 more)
```

#### Classes (13)
```
Select → Click "classes" button
See only class traits:
- Adepto en armas ligeras
- Adepto en voluntad
- Adepto metamagia
- ... (10 more)
```

#### Backgrounds (13)
```
Select → Click "backgrounds" button
See only background traits:
- Adepto elemental
- Adepto en armaduras ligeras
- ... (11 more)
```

#### Proficiencies (12)
```
Select → Click "proficiencies" button
See only proficiency traits:
- Actor
- Adepto en armaduras pesadas
- ... (10 more)
```

**Test**: Try adding traits from each category
- Click `+` button to add to character
- Items appear in "Added Traits" list
- Can remove if needed

---

### Step 4: Test Spells Filter

**Expected Behavior**:
- ✅ All spell levels have data
- ✅ Cantrips work correctly (Level 0)
- ✅ Levels 1-9 all have spells

**Action Steps**:
1. Look for "Starting Spells" section
2. Click spell level buttons (all, cantrip, 1-9)

**Test Each Level**:

#### Cantrip
```
Select → Click "cantrip" button
See: 1 cantrip
- Rayo de escarcha / Ray of Frost
```

#### Level 1
```
Select → Click "1" button
See: 5 spells
- Curar heridas / Cure Wounds
- Detectar magia / Detect Magic
- Dormir / Sleep
- Escudo / Shield
- Proyectil mágico / Magic Missile
```

#### Level 2
```
Select → Click "2" button
See: 5 spells
- Imagen espejo / Mirror Image
- Invisibilidad / Invisibility
- Pasar sin dejar rastro / Pass without Trace
- Paso brumoso / Misty Step
- Telaraña / Web
```

#### Level 3
```
Select → Click "3" button
See: 5 spells
- Bola de Fuego / Fireball
- Contrahechizo / Counterspell
- Relámpago / Lightning Bolt
- Volar / Fly
- (1 more)
```

#### Levels 4-9
```
Level 4: 2 spells
Level 5: 6 spells
Level 6: 3 spells
Level 7: 7 spells
Level 8: 5 spells
Level 9: 12 spells
```

**Test**: Try adding spells from different levels
- Click `+` button to add
- Items appear in "Added Spells" list

---

## 🧑‍⚔️ Example: Create "Aragorn"

### Basic Info
- **Name**: Aragorn
- **Race**: Select from list
- **Class**: Ranger
- **Level**: 1
- **Background**: Outlander
- **Alignment**: Neutral Good
- **Player Name**: (your name)

### Equipment Selection
```
From "armor":
  + Leather Armor (qty: 1)

From "transport":
  + Horse (qty: 1)
  + Rope (qty: 2)
```

### Traits Selection
```
From "races":
  + Adepto en reflejos

From "classes":
  + Adepto en armas ligeras

From "backgrounds":
  + Adepto elemental
```

### Spells Selection
```
Cantrip:
  + Rayo de escarcha

Level 1:
  + Curar heridas
  + Detectar magia
```

### Stats & Combat
- Strength: 15
- Dexterity: 16
- Constitution: 13
- Intelligence: 12
- Wisdom: 14
- Charisma: 11

### Final Steps
1. Fill in any other required fields (personality, appearance, etc.)
2. Click "Create Character"
3. Character should save with all selected items
4. Go to character sheet
5. Click on equipment/traits/spells items
6. Should see detail panels with full information

---

## ✅ Success Criteria

### Equipment Filter ✅
- [ ] Items show on initial load
- [ ] Can see both armor and transport categories
- [ ] Can add items with quantities
- [ ] Items persist when saved

### Traits Filter ✅
- [ ] All 5 category buttons show items
- [ ] "All" shows 51 total traits
- [ ] "Races" shows 13 traits
- [ ] "Classes" shows 13 traits
- [ ] "Backgrounds" shows 13 traits
- [ ] "Proficiencies" shows 12 traits
- [ ] Can add multiple traits
- [ ] Items persist when saved

### Spells Filter ✅
- [ ] All spell levels have data
- [ ] Cantrip shows 1 spell
- [ ] Levels 1-9 each have spells
- [ ] Can add spells from different levels
- [ ] Items persist when saved

### Character Sheet ✅
- [ ] Saved character displays with equipment
- [ ] Clicking equipment shows detail panel
- [ ] Saved character displays with traits
- [ ] Clicking traits shows detail panel
- [ ] Saved character displays with spells
- [ ] Clicking spells shows detail panel

---

## 🔧 If Something Doesn't Work

### Equipment still empty on load?
```bash
# Check equipment categories
python3 verify_encyclopedia.py | grep -A 10 "📦 EQUIPMENT"
```

### Trait buttons missing?
```bash
# Check trait types
python3 verify_encyclopedia.py | grep -A 15 "🎭 TRAITS"
```

### Spells not showing?
```bash
# Check spell levels
python3 verify_encyclopedia.py | grep -A 20 "✨ SPELLS"
```

### Full verification
```bash
python3 verify_encyclopedia.py
# Should show: "✨ All filters are properly configured!"
```

---

## 📝 Data Summary

| Category | Count | Status |
|----------|-------|--------|
| Equipment - armor | 26 | ✅ |
| Equipment - transport | 25 | ✅ |
| Traits - races | 13 | ✅ |
| Traits - classes | 13 | ✅ |
| Traits - backgrounds | 13 | ✅ |
| Traits - proficiencies | 12 | ✅ |
| Spells - cantrip | 1 | ✅ |
| Spells - level 1 | 5 | ✅ |
| Spells - level 2 | 5 | ✅ |
| Spells - level 3 | 5 | ✅ |
| Spells - level 4 | 2 | ✅ |
| Spells - level 5 | 6 | ✅ |
| Spells - level 6 | 3 | ✅ |
| Spells - level 7 | 7 | ✅ |
| Spells - level 8 | 5 | ✅ |
| Spells - level 9 | 12 | ✅ |
| **TOTAL** | **153** | ✅ |

---

## 🎯 Next Steps After Testing

1. ✅ Verify all filters work with data
2. ✅ Create 2-3 test characters
3. ✅ Verify detail panels show encyclopedia info
4. ✅ Test with character sheet integration
5. ✅ Deploy to production

All filters are now properly configured and related to encyclopedia data! 🚀
