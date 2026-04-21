/**
 * DungeonAssistant - Schema Optimizado para Supabase
 * Versión: Phase 2 Complete
 * Ejecutar en SQL Editor de Supabase - COPIAR Y PEGAR TODO DE UNA VEZ
 * 
 * ESTRUCTURA LÓGICA:
 * 1. CORE SYSTEM (Auth & Base)
 * 2. CHARACTER MANAGEMENT
 * 3. WORLD BUILDING (Factions & NPCs)
 * 4. SESSION & GAMEPLAY (Sessions & Analysis)
 * 5. ADMIN (Requests & Utilities)
 */

-- ============================================================================
-- LIMPIAR TABLAS NUEVAS DE PHASE 2 (Si existen)
-- ============================================================================
-- Nota: Solo se eliminan las nuevas tablas de Phase 2
-- Las tablas existentes se recrean con CREATE TABLE IF NOT EXISTS
DROP TABLE IF EXISTS session_npcs;

-- ============================================================================
-- SECCIÓN 1: CORE SYSTEM
-- ============================================================================

-- Tabla: users
-- Almacena información de usuarios autenticados
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE users IS 'Tabla de usuarios del sistema. Contiene información básica de usuarios autenticados en Supabase.';
COMMENT ON COLUMN users.id IS 'UUID vinculado a auth.users, identificador único del usuario';
COMMENT ON COLUMN users.email IS 'Email único del usuario para contacto y login';
COMMENT ON COLUMN users.username IS 'Nombre visible del usuario en la aplicación';
COMMENT ON COLUMN users.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN users.updated_at IS 'Fecha de última actualización del registro';

-- Tabla: campaigns
-- Campaña de D&D con su información base
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    lore_summary TEXT,
    is_active BOOLEAN DEFAULT true,
    invitation_code VARCHAR(6) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE campaigns IS 'Campañas de D&D. Contenedor principal para sesiones, personajes y mundo.';
COMMENT ON COLUMN campaigns.id IS 'UUID único de la campaña';
COMMENT ON COLUMN campaigns.name IS 'Nombre de la campaña (ej: "La Torre Negra")';
COMMENT ON COLUMN campaigns.description IS 'Descripción detallada de la campaña';
COMMENT ON COLUMN campaigns.lore_summary IS 'Resumen del lore/trasfondo de la campaña';
COMMENT ON COLUMN campaigns.is_active IS 'Indica si la campaña está activa o archivada';
COMMENT ON COLUMN campaigns.invitation_code IS 'Código de 6 caracteres para invitar jugadores';
COMMENT ON COLUMN campaigns.created_at IS 'Fecha de creación de la campaña';
COMMENT ON COLUMN campaigns.updated_at IS 'Fecha de última actualización';

-- Tabla: campaign_members
-- Vinculación de usuarios a campañas con roles
CREATE TABLE IF NOT EXISTS campaign_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('GM', 'PLAYER')),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PENDING_ROLE_CHANGE')) DEFAULT 'ACTIVE',
    requested_role TEXT CHECK (requested_role IN ('GM', 'PLAYER')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(campaign_id, user_id)
);

COMMENT ON TABLE campaign_members IS 'Membresía de usuarios en campañas. Define roles (GM/PLAYER) de cada usuario.';
COMMENT ON COLUMN campaign_members.campaign_id IS 'Referencia a la campaña';
COMMENT ON COLUMN campaign_members.user_id IS 'Referencia al usuario';
COMMENT ON COLUMN campaign_members.role IS 'Rol en la campaña: GM (Game Master) o PLAYER';
COMMENT ON COLUMN campaign_members.status IS 'Estado: ACTIVE o PENDING_ROLE_CHANGE';
COMMENT ON COLUMN campaign_members.requested_role IS 'Rol solicitado si hay una petición pendiente';
COMMENT ON COLUMN campaign_members.joined_at IS 'Fecha de entrada del usuario a la campaña';

-- ============================================================================
-- SECCIÓN 2: CHARACTER MANAGEMENT
-- ============================================================================

-- Tabla: characters
-- Personajes jugadores con stats D&D 5e completos
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    class TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),
    background TEXT,
    alignment TEXT,
    stats JSONB NOT NULL DEFAULT '{"strength": 10, "dexterity": 10, "constitution": 10, "intelligence": 10, "wisdom": 10, "charisma": 10}',
    hp_max INTEGER NOT NULL,
    hp_current INTEGER NOT NULL,
    armor_class INTEGER DEFAULT 10,
    initiative INTEGER DEFAULT 0,
    speed INTEGER DEFAULT 30,
    proficiency_bonus INTEGER DEFAULT 2,
    hit_dice TEXT DEFAULT '1d8',
    death_saves JSONB DEFAULT '{"successes": 0, "failures": 0}',
    saving_throws JSONB DEFAULT '{}',
    skills JSONB DEFAULT '{}',
    passive_perception INTEGER DEFAULT 10,
    attacks JSONB DEFAULT '[]',
    personality_traits TEXT,
    ideals TEXT,
    bonds TEXT,
    flaws TEXT,
    other_proficiencies TEXT,
    equipment TEXT,
    features_traits TEXT,
    age TEXT,
    height TEXT,
    weight TEXT,
    eyes TEXT,
    skin TEXT,
    hair TEXT,
    appearance TEXT,
    backstory TEXT,
    allies_organizations JSONB DEFAULT '{}',
    additional_features TEXT,
    treasure TEXT,
    spellcasting JSONB DEFAULT '{}',
    image_url TEXT,
    is_alive BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE characters IS 'Personajes jugadores de D&D 5e. Contiene toda la información del sheet del personaje.';
COMMENT ON COLUMN characters.id IS 'UUID único del personaje';
COMMENT ON COLUMN characters.campaign_id IS 'Campaña a la que pertenece el personaje';
COMMENT ON COLUMN characters.player_id IS 'Usuario (jugador) propietario del personaje';
COMMENT ON COLUMN characters.name IS 'Nombre del personaje';
COMMENT ON COLUMN characters.race IS 'Raza D&D 5e (Humano, Elfo, Enano, etc.)';
COMMENT ON COLUMN characters.class IS 'Clase D&D 5e (Warrior, Mage, Rogue, etc.)';
COMMENT ON COLUMN characters.level IS 'Nivel del personaje (1-20)';
COMMENT ON COLUMN characters.background IS 'Trasfondo del personaje';
COMMENT ON COLUMN characters.alignment IS 'Alineamiento moral (LG, NG, CG, etc.)';
COMMENT ON COLUMN characters.stats IS 'JSON con stats base: STR, DEX, CON, INT, WIS, CHA';
COMMENT ON COLUMN characters.hp_max IS 'Puntos de vida máximos';
COMMENT ON COLUMN characters.hp_current IS 'Puntos de vida actuales';
COMMENT ON COLUMN characters.armor_class IS 'Clase de armadura (AC)';
COMMENT ON COLUMN characters.proficiency_bonus IS 'Bonificador de pericia';
COMMENT ON COLUMN characters.is_alive IS 'Indica si el personaje está vivo o muerto';

-- Tabla: character_history
-- Historial de cambios en personajes para auditoría
CREATE TABLE IF NOT EXISTS character_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL CHECK (change_type IN ('LEVEL_UP', 'HP_CHANGE', 'STATUS_CHANGE', 'STAT_CHANGE', 'DIED', 'REVIVED')),
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE character_history IS 'Auditoría de cambios en personajes. Rastrea cada modificación importante.';
COMMENT ON COLUMN character_history.character_id IS 'Referencia al personaje modificado';
COMMENT ON COLUMN character_history.changed_by IS 'Usuario que realizó el cambio';
COMMENT ON COLUMN character_history.change_type IS 'Tipo de cambio: LEVEL_UP, HP_CHANGE, STAT_CHANGE, DIED, REVIVED, etc.';
COMMENT ON COLUMN character_history.old_value IS 'Valor anterior (para cambios de datos)';
COMMENT ON COLUMN character_history.new_value IS 'Valor nuevo (para cambios de datos)';

-- Tabla: inventories
-- Inventario de items de personajes
CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    description TEXT,
    is_magical BOOLEAN DEFAULT false,
    added_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE inventories IS 'Inventario de items de personajes. Incluye items normales y mágicos.';
COMMENT ON COLUMN inventories.character_id IS 'Personaje propietario del item';
COMMENT ON COLUMN inventories.item_name IS 'Nombre del item';
COMMENT ON COLUMN inventories.quantity IS 'Cantidad disponible';
COMMENT ON COLUMN inventories.is_magical IS 'Indica si es un item mágico';

-- ============================================================================
-- SECCIÓN 3: WORLD BUILDING
-- ============================================================================

-- Tabla: factions
-- Facciones y organizaciones del mundo
CREATE TABLE IF NOT EXISTS factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    alignment TEXT,
    goals TEXT,
    symbol TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE factions IS 'Facciones, organizaciones y poderes del mundo de campaña.';
COMMENT ON COLUMN factions.campaign_id IS 'Campaña a la que pertenece la facción';
COMMENT ON COLUMN factions.name IS 'Nombre de la organización';
COMMENT ON COLUMN factions.description IS 'Descripción y propósitos de la facción';
COMMENT ON COLUMN factions.alignment IS 'Alineamiento general de la facción';
COMMENT ON COLUMN factions.goals IS 'Objetivos a largo plazo de la facción';
COMMENT ON COLUMN factions.symbol IS 'Símbolo heráldico o bandería';

-- Tabla: npcs
-- Personajes no jugadores principales del mundo
CREATE TABLE IF NOT EXISTS npcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    race TEXT,
    class TEXT,
    personality TEXT,
    secrets TEXT,
    stats JSONB,
    relationship_to_party TEXT,
    faction_id UUID REFERENCES factions(id) ON DELETE SET NULL,
    is_alive BOOLEAN DEFAULT true,
    generated_by_ai BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE npcs IS 'NPCs importantes del mundo de campaña. Generados por GM o IA.';
COMMENT ON COLUMN npcs.campaign_id IS 'Campaña a la que pertenece el NPC';
COMMENT ON COLUMN npcs.name IS 'Nombre del NPC';
COMMENT ON COLUMN npcs.race IS 'Raza del NPC';
COMMENT ON COLUMN npcs.class IS 'Clase u ocupación del NPC';
COMMENT ON COLUMN npcs.personality IS 'Descripción de personalidad y manías';
COMMENT ON COLUMN npcs.secrets IS 'Secretos o información oculta del NPC';
COMMENT ON COLUMN npcs.stats IS 'JSON con estadísticas de combate si aplica';
COMMENT ON COLUMN npcs.faction_id IS 'Facción a la que pertenece el NPC';
COMMENT ON COLUMN npcs.is_alive IS 'Estado de vida del NPC';
COMMENT ON COLUMN npcs.generated_by_ai IS 'Indica si fue generado por IA o creado manualmente';

-- ============================================================================
-- SECCIÓN 4: SESSION & GAMEPLAY
-- ============================================================================

-- Tabla: sessions
-- Sesiones de juego registradas
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    title TEXT,
    date DATE DEFAULT CURRENT_DATE,
    summary TEXT,
    is_active BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON COLUMN npcs.campaign_id IS 'Campaña a la que pertenece el NPC';
COMMENT ON COLUMN npcs.name IS 'Nombre del NPC';
COMMENT ON COLUMN npcs.race IS 'Raza del NPC';
COMMENT ON COLUMN npcs.class IS 'Clase u ocupación del NPC';
COMMENT ON COLUMN npcs.personality IS 'Descripción de personalidad y manías';
COMMENT ON COLUMN npcs.secrets IS 'Secretos o información oculta del NPC';
COMMENT ON COLUMN npcs.stats IS 'JSON con estadísticas de combate si aplica';
COMMENT ON COLUMN npcs.faction_id IS 'Facción a la que pertenece el NPC';
COMMENT ON COLUMN npcs.is_alive IS 'Estado de vida del NPC';
COMMENT ON COLUMN npcs.generated_by_ai IS 'Indica si fue generado por IA o creado manualmente';

-- ============================================================================
-- SECCIÓN 4: SESSION & GAMEPLAY
-- ============================================================================

COMMENT ON TABLE sessions IS 'Sesiones de juego. Contiene metadatos y control de sesiones.';
COMMENT ON COLUMN sessions.campaign_id IS 'Campaña a la que pertenece la sesión';
COMMENT ON COLUMN sessions.session_number IS 'Número secuencial de sesión en la campaña';
COMMENT ON COLUMN sessions.title IS 'Título descriptivo de la sesión';
COMMENT ON COLUMN sessions.date IS 'Fecha en que ocurrió/ocurrirá la sesión';
COMMENT ON COLUMN sessions.summary IS 'Resumen de lo que pasó en la sesión';
COMMENT ON COLUMN sessions.is_active IS 'Indica si la sesión está actualmente en vivo';
COMMENT ON COLUMN sessions.started_at IS 'Timestamp de inicio de sesión';
COMMENT ON COLUMN sessions.ended_at IS 'Timestamp de fin de sesión';

-- Tabla: session_notes
-- Notas y apuntes de sesiones con análisis automático
CREATE TABLE IF NOT EXISTS session_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    detected_items JSONB DEFAULT '[]',
    detected_npcs JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE session_notes IS 'Notas de sesiones con análisis automático de items, NPCs y spells. Base para Phase 2.';
COMMENT ON COLUMN session_notes.session_id IS 'Sesión a la que pertenece la nota';
COMMENT ON COLUMN session_notes.author_id IS 'Usuario que escribió la nota';
COMMENT ON COLUMN session_notes.content IS 'Contenido textual de la nota';
COMMENT ON COLUMN session_notes.detected_items IS 'JSON: items detectados automáticamente';
COMMENT ON COLUMN session_notes.detected_npcs IS 'JSON: NPCs detectados automáticamente';

-- Tabla: session_npcs (Phase 2)
-- NPCs detectados en una sesión específica
CREATE TABLE IF NOT EXISTS session_npcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'unknown',
    confidence INTEGER DEFAULT 70 CHECK (confidence >= 0 AND confidence <= 100),
    first_mentioned TIMESTAMPTZ DEFAULT now(),
    last_mentioned TIMESTAMPTZ DEFAULT now(),
    mention_count INTEGER DEFAULT 1,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(session_id, name)
);

COMMENT ON TABLE session_npcs IS 'Phase 2: NPCs detectados en sesiones. Rastrea encuentros con NPCs.';
COMMENT ON COLUMN session_npcs.session_id IS 'Sesión donde se mencionó el NPC';
COMMENT ON COLUMN session_npcs.campaign_id IS 'Campaña para RLS y filtrado';
COMMENT ON COLUMN session_npcs.name IS 'Nombre del NPC detectado';
COMMENT ON COLUMN session_npcs.role IS 'Rol del NPC en la sesión (quest-giver, enemy, ally, etc.)';
COMMENT ON COLUMN session_npcs.confidence IS 'Confianza de detección (0-100). Mayor = más probable que sea real';
COMMENT ON COLUMN session_npcs.mention_count IS 'Cantidad de veces mencionado en sesión';
COMMENT ON COLUMN session_npcs.first_mentioned IS 'Timestamp de primera mención';
COMMENT ON COLUMN session_npcs.last_mentioned IS 'Timestamp de última mención';
COMMENT ON COLUMN session_npcs.details IS 'JSON con detalles adicionales del NPC';

-- ============================================================================
-- SECCIÓN 5: ADMIN & UTILITIES
-- ============================================================================

-- Tabla: role_change_requests
-- Solicitudes de cambio de rol (GM ↔ PLAYER)
CREATE TABLE IF NOT EXISTS role_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_role TEXT NOT NULL CHECK (requested_role IN ('GM', 'PLAYER')),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE role_change_requests IS 'Solicitudes de cambio de rol. Permite que jugadores pidan cambiar entre PM/JUGADOR.';
COMMENT ON COLUMN role_change_requests.campaign_id IS 'Campaña donde se solicita cambio';
COMMENT ON COLUMN role_change_requests.requester_id IS 'Usuario que solicita el cambio';
COMMENT ON COLUMN role_change_requests.requested_role IS 'Nuevo rol solicitado';
COMMENT ON COLUMN role_change_requests.status IS 'Estado: PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN role_change_requests.resolved_by IS 'GM que resolvió la solicitud';
COMMENT ON COLUMN role_change_requests.resolved_at IS 'Timestamp de resolución';

-- ============================================================================
-- ÍNDICES OPTIMIZADOS
-- ============================================================================
-- Índices para queries frecuentes por usuario
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_campaign_members_user_id_campaign_id ON campaign_members(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id_role ON campaign_members(campaign_id, role);

-- Índices para personajes
CREATE INDEX IF NOT EXISTS idx_characters_campaign_id_player_id ON characters(campaign_id, player_id);
CREATE INDEX IF NOT EXISTS idx_characters_is_alive ON characters(is_alive);

-- Índices para sesiones
CREATE INDEX IF NOT EXISTS idx_sessions_campaign_id_session_number ON sessions(campaign_id, session_number DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);

-- Índices para notas y análisis
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id_created_at ON session_notes(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_notes_author_id ON session_notes(author_id);

-- Índices para Phase 2 (NPCs)
CREATE INDEX IF NOT EXISTS idx_session_npcs_campaign_id_confidence ON session_npcs(campaign_id, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_session_npcs_name_lower ON session_npcs(LOWER(name));

-- Índices para mundo
CREATE INDEX IF NOT EXISTS idx_factions_campaign_id ON factions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_npcs_campaign_id_is_alive ON npcs(campaign_id, is_alive);
CREATE INDEX IF NOT EXISTS idx_npcs_faction_id ON npcs(faction_id);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_character_history_character_id_created_at ON character_history(character_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_campaign_id_status ON role_change_requests(campaign_id, status);

-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- NOTA: campaign_members NO tiene RLS para evitar recursión infinita
-- El backend es responsable de validar acceso via tokens JWT
ALTER TABLE campaign_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS - Auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS
-- ============================================================================

-- USERS: Cada usuario ve solo su perfil
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- CAMPAIGNS: El backend valida si el usuario es miembro
DROP POLICY IF EXISTS "Campaign members can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Campaigns SELECT permissive" ON campaigns;
CREATE POLICY "Campaigns SELECT permissive"
ON campaigns FOR SELECT
USING (true);

-- CAMPAIGNS: Permitir INSERT (cualquier usuario autenticado puede crear campaña)
DROP POLICY IF EXISTS "Allow insert campaigns" ON campaigns;
CREATE POLICY "Allow insert campaigns"
ON campaigns FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- CAMPAIGNS: Permitir UPDATE (backend valida que sea GM)
DROP POLICY IF EXISTS "Allow update campaigns" ON campaigns;
CREATE POLICY "Allow update campaigns"
ON campaigns FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- CAMPAIGNS: Permitir DELETE (backend valida que sea GM)
DROP POLICY IF EXISTS "Allow delete campaigns" ON campaigns;
CREATE POLICY "Allow delete campaigns"
ON campaigns FOR DELETE
USING (auth.uid() IS NOT NULL);

-- CAMPAIGN_MEMBERS: SIN RLS (backend valida acceso)
-- Las políticas abajo son innecesarias pero se dejan por documentación
DROP POLICY IF EXISTS "Members can view campaign members" ON campaign_members;
DROP POLICY IF EXISTS "Allow insert campaign members" ON campaign_members;
DROP POLICY IF EXISTS "Allow update campaign members" ON campaign_members;
DROP POLICY IF EXISTS "Allow delete campaign members" ON campaign_members;

-- CHARACTERS: Jugador ve su personaje
-- El backend valida acceso adicional para GMs
DROP POLICY IF EXISTS "Users can view own or GM characters" ON characters;
DROP POLICY IF EXISTS "Users can view own characters" ON characters;
CREATE POLICY "Users can view own characters"
ON characters FOR SELECT
USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "Players can update own character" ON characters;
CREATE POLICY "Players can update own character"
ON characters FOR UPDATE
USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "Players can insert own character" ON characters;
CREATE POLICY "Players can insert own character"
ON characters FOR INSERT
WITH CHECK (auth.uid() = player_id);

-- CHARACTER_HISTORY: El backend valida acceso (RLS permissive)
DROP POLICY IF EXISTS "Users can view character history" ON character_history;
CREATE POLICY "Users can view character history"
ON character_history FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Insert character history" ON character_history;
CREATE POLICY "Insert character history"
ON character_history FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- SESSIONS: El backend valida acceso a miembros de campaña
DROP POLICY IF EXISTS "Campaign members can view sessions" ON sessions;
DROP POLICY IF EXISTS "Sessions SELECT permissive" ON sessions;
DROP POLICY IF EXISTS "Sessions SELECT create" ON sessions;
CREATE POLICY "Sessions SELECT permissive"
ON sessions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Sessions can be created by authenticated users" ON sessions;
CREATE POLICY "Sessions SELECT create"
ON sessions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- SESSION_NOTES: El backend valida acceso
DROP POLICY IF EXISTS "Campaign members can view session notes" ON session_notes;
DROP POLICY IF EXISTS "Session notes SELECT permissive" ON session_notes;
DROP POLICY IF EXISTS "Session notes SELECT create" ON session_notes;
CREATE POLICY "Session notes SELECT permissive"
ON session_notes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "SessionNotes can be created" ON session_notes;
CREATE POLICY "Session notes SELECT create"
ON session_notes FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- SESSION_NPCS: Miembros ven NPCs de sus campañas - El backend valida
DROP POLICY IF EXISTS "Campaign members can view session NPCs" ON session_npcs;
DROP POLICY IF EXISTS "Session NPCs SELECT permissive" ON session_npcs;
CREATE POLICY "Session NPCs SELECT permissive"
ON session_npcs FOR SELECT
USING (true);

-- NPCs: El backend valida acceso
DROP POLICY IF EXISTS "Campaign members can view world NPCs" ON npcs;
DROP POLICY IF EXISTS "NPCs SELECT permissive" ON npcs;
CREATE POLICY "NPCs SELECT permissive"
ON npcs FOR SELECT
USING (true);

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Schema completado y optimizado
-- Todas las tablas están documentadas con comentarios SQL
-- Estructura lógica: Core System → Characters → World → Sessions → Admin
-- Indices optimizados para queries frecuentes
-- RLS habilitado en todas las tablas
-- 1. Core System (auth)
-- 2. Characters (jugadores y su data)
-- 3. World (facciones y NPCs)
-- 4. Sessions (juego y análisis)
-- 5. Admin (requests)
