-- ============================================================================
-- MIGRACIÓN: Campos adicionales D&D 5e en tabla characters
-- Fase 1 — Character Sheet completo
-- Ejecutar en SQL Editor de Supabase
-- Todos los ALTER son seguros: IF NOT EXISTS / default values incluidos
-- ============================================================================

-- ── Combate adicional ────────────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS hp_temporary    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hit_dice_used   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inspiration     BOOLEAN NOT NULL DEFAULT false;

-- ── Progresión ───────────────────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS experience_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subclass          TEXT,
  ADD COLUMN IF NOT EXISTS player_name       TEXT DEFAULT '';

-- ── Recursos ─────────────────────────────────────────────────────────────────
-- currency: { cp, sp, ep, gp, pp }
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS currency JSONB NOT NULL DEFAULT '{"cp":0,"sp":0,"ep":0,"gp":0,"pp":0}';

-- ── Rasgos adicionales (página 2 de la hoja oficial) ─────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS additional_features TEXT DEFAULT '';

-- ── Asegurarse de que los campos JSONB existentes tienen defaults correctos ───
-- saving_throws: { strength: {proficient: false}, ... }
ALTER TABLE characters
  ALTER COLUMN saving_throws SET DEFAULT '{"strength":{"proficient":false},"dexterity":{"proficient":false},"constitution":{"proficient":false},"intelligence":{"proficient":false},"wisdom":{"proficient":false},"charisma":{"proficient":false}}';

-- skills: { acrobatics: {proficient: false, expertise: false}, ... }
ALTER TABLE characters
  ALTER COLUMN skills SET DEFAULT '{"acrobatics":{"proficient":false,"expertise":false},"animal_handling":{"proficient":false,"expertise":false},"arcana":{"proficient":false,"expertise":false},"athletics":{"proficient":false,"expertise":false},"deception":{"proficient":false,"expertise":false},"history":{"proficient":false,"expertise":false},"insight":{"proficient":false,"expertise":false},"intimidation":{"proficient":false,"expertise":false},"investigation":{"proficient":false,"expertise":false},"medicine":{"proficient":false,"expertise":false},"nature":{"proficient":false,"expertise":false},"perception":{"proficient":false,"expertise":false},"performance":{"proficient":false,"expertise":false},"persuasion":{"proficient":false,"expertise":false},"religion":{"proficient":false,"expertise":false},"sleight_of_hand":{"proficient":false,"expertise":false},"stealth":{"proficient":false,"expertise":false},"survival":{"proficient":false,"expertise":false}}';

-- attacks: 3 filas vacías
ALTER TABLE characters
  ALTER COLUMN attacks SET DEFAULT '[{"name":"","attack_bonus":"+0","damage":"","damage_type":""},{"name":"","attack_bonus":"+0","damage":"","damage_type":""},{"name":"","attack_bonus":"+0","damage":"","damage_type":""}]';

-- spellcasting: estructura completa
ALTER TABLE characters
  ALTER COLUMN spellcasting SET DEFAULT '{"class":"","ability":"","save_dc":0,"attack_bonus":0,"slots":{"1":{"total":0,"used":0},"2":{"total":0,"used":0},"3":{"total":0,"used":0},"4":{"total":0,"used":0},"5":{"total":0,"used":0},"6":{"total":0,"used":0},"7":{"total":0,"used":0},"8":{"total":0,"used":0},"9":{"total":0,"used":0}},"cantrips":[],"spells":[]}';

-- allies_organizations: { text, symbol }
ALTER TABLE characters
  ALTER COLUMN allies_organizations SET DEFAULT '{"text":"","symbol":""}';

-- ── Backfill de personajes existentes (normalizar JSONB vacíos) ───────────────
-- Saving throws vacíos → estructura canónica
UPDATE characters
SET saving_throws = '{"strength":{"proficient":false},"dexterity":{"proficient":false},"constitution":{"proficient":false},"intelligence":{"proficient":false},"wisdom":{"proficient":false},"charisma":{"proficient":false}}'
WHERE saving_throws IS NULL OR saving_throws = '{}'::jsonb;

-- Skills vacíos → estructura canónica
UPDATE characters
SET skills = '{"acrobatics":{"proficient":false,"expertise":false},"animal_handling":{"proficient":false,"expertise":false},"arcana":{"proficient":false,"expertise":false},"athletics":{"proficient":false,"expertise":false},"deception":{"proficient":false,"expertise":false},"history":{"proficient":false,"expertise":false},"insight":{"proficient":false,"expertise":false},"intimidation":{"proficient":false,"expertise":false},"investigation":{"proficient":false,"expertise":false},"medicine":{"proficient":false,"expertise":false},"nature":{"proficient":false,"expertise":false},"perception":{"proficient":false,"expertise":false},"performance":{"proficient":false,"expertise":false},"persuasion":{"proficient":false,"expertise":false},"religion":{"proficient":false,"expertise":false},"sleight_of_hand":{"proficient":false,"expertise":false},"stealth":{"proficient":false,"expertise":false},"survival":{"proficient":false,"expertise":false}}'
WHERE skills IS NULL OR skills = '{}'::jsonb;

-- Attacks vacíos → 3 filas
UPDATE characters
SET attacks = '[{"name":"","attack_bonus":"+0","damage":"","damage_type":""},{"name":"","attack_bonus":"+0","damage":"","damage_type":""},{"name":"","attack_bonus":"+0","damage":"","damage_type":""}]'
WHERE attacks IS NULL OR attacks = '[]'::jsonb;

-- Spellcasting vacío → estructura completa
UPDATE characters
SET spellcasting = '{"class":"","ability":"","save_dc":0,"attack_bonus":0,"slots":{"1":{"total":0,"used":0},"2":{"total":0,"used":0},"3":{"total":0,"used":0},"4":{"total":0,"used":0},"5":{"total":0,"used":0},"6":{"total":0,"used":0},"7":{"total":0,"used":0},"8":{"total":0,"used":0},"9":{"total":0,"used":0}},"cantrips":[],"spells":[]}'
WHERE spellcasting IS NULL OR spellcasting = '{}'::jsonb;

-- allies_organizations vacío
UPDATE characters
SET allies_organizations = '{"text":"","symbol":""}'
WHERE allies_organizations IS NULL OR allies_organizations = '{}'::jsonb;

-- death_saves vacío → { successes: 0, failures: 0 }
UPDATE characters
SET death_saves = '{"successes":0,"failures":0}'
WHERE death_saves IS NULL OR death_saves = '{}'::jsonb;

-- ── Índices nuevos ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_characters_experience_points
  ON characters(experience_points DESC);

-- ── Comentarios de los nuevos campos ─────────────────────────────────────────
COMMENT ON COLUMN characters.hp_temporary        IS 'Puntos de vida temporales';
COMMENT ON COLUMN characters.hit_dice_used        IS 'Dados de golpe usados en descanso';
COMMENT ON COLUMN characters.inspiration          IS 'Inspiración: true si el personaje la tiene';
COMMENT ON COLUMN characters.experience_points    IS 'Puntos de experiencia acumulados';
COMMENT ON COLUMN characters.subclass             IS 'Subclase D&D 5e (ej: Champion, Thief, etc.)';
COMMENT ON COLUMN characters.player_name          IS 'Nombre real del jugador (no del personaje)';
COMMENT ON COLUMN characters.currency             IS 'Monedas: {cp, sp, ep, gp, pp}';
COMMENT ON COLUMN characters.additional_features  IS 'Rasgos adicionales (página 2 hoja oficial)';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
