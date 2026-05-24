import os
import sys
import asyncio
import logging

# Configurar logging básico para ver el output de la tarea
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("verify_rag_fix")

# Añadir el backend al path para que las importaciones funcionen
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from services.supabase import SupabaseClient
from routers.sessions import _analyze_and_update_note_task

async def run_test():
    logger.info("🚀 Iniciando prueba de validación para la corrección del RAG...")
    
    supabase = SupabaseClient()
    admin_client = supabase.admin_client
    
    # 1. Definir o buscar la campaña
    campaign_id = '9db91a09-0b15-4a97-b211-7a956367bba3'
    
    # Verificar si existe la campaña
    campaign_res = admin_client.table("campaigns").select("name").eq("id", campaign_id).execute()
    if not campaign_res.data:
        logger.warning(f"⚠️ La campaña con ID '{campaign_id}' no existe. Buscando cualquier campaña disponible...")
        campaign_list = admin_client.table("campaigns").select("id, name").limit(1).execute()
        if not campaign_list.data:
            logger.error("❌ No se encontraron campañas en la base de datos. Por favor crea una campaña primero.")
            return
        campaign_id = campaign_list.data[0]["id"]
        campaign_name = campaign_list.data[0]["name"]
        logger.info(f"👉 Usando campaña alternativa: '{campaign_name}' (ID: {campaign_id})")
    else:
        campaign_name = campaign_res.data[0]["name"]
        logger.info(f"👉 Campaña objetivo encontrada: '{campaign_name}' (ID: {campaign_id})")
        
    # 2. Buscar un usuario / miembro de la campaña para asociar la nota
    member_res = admin_client.table("campaign_members").select("user_id").eq("campaign_id", campaign_id).limit(1).execute()
    if not member_res.data:
        logger.error(f"❌ La campaña '{campaign_name}' no tiene miembros activos en 'campaign_members'.")
        return
    user_id = member_res.data[0]["user_id"]
    
    # Obtener el nombre de usuario
    user_res = admin_client.table("users").select("username").eq("id", user_id).single().execute()
    username = user_res.data.get("username", "Jugador de Prueba") if user_res.data else "Jugador de Prueba"
    logger.info(f"👤 Usando miembro de la campaña: '{username}' (ID: {user_id})")
    
    # 3. Buscar o crear una sesión activa para esta campaña
    session_res = admin_client.table("sessions").select("id, session_number").eq("campaign_id", campaign_id).limit(1).execute()
    if not session_res.data:
        logger.info("➕ No hay sesiones para esta campaña. Creando una sesión de prueba...")
        new_session = admin_client.table("sessions").insert({
            "campaign_id": campaign_id,
            "session_number": 99,
            "title": "Sesión de Validación RAG",
            "is_active": True
        }).execute()
        session_id = new_session.data[0]["id"]
        session_number = 99
        logger.info(f"✅ Sesión de prueba creada (ID: {session_id})")
    else:
        session_id = session_res.data[0]["id"]
        session_number = session_res.data[0]["session_number"]
        logger.info(f"🎬 Usando sesión existente: Sesión #{session_number} (ID: {session_id})")
        
    # 4. Insertar una nota de sesión usando admin_client (tal como lo hace la API real en la línea 403)
    content = (
        "Durante la exploración de la cripta antigua, el grupo derrotó al nigromante Malakor "
        "y desarmó una trampa de pinchos. En el cofre principal encontraron una Espada de Ébano (+1 Longsword) "
        "y un Anillo de Regeneración. Luego, regresamos a la posada y conversamos con el tabernero "
        "llamado Barnaby sobre los rumores del dragón."
    )
    
    logger.info("📝 Insertando nota de prueba...")
    note_res = admin_client.table("session_notes").insert({
        "session_id": session_id,
        "author_id": user_id,
        "content": content,
        "detected_items": [],
        "detected_npcs": []
    }).execute()
    
    if not note_res.data:
        logger.error("❌ No se pudo crear la nota de prueba.")
        return
        
    note = note_res.data[0]
    note_id = note["id"]
    logger.info(f"✅ Nota creada exitosamente (ID: {note_id})")
    
    # 5. Ejecutar la tarea de análisis en segundo plano de manera SÍNCRONA para esperar su resultado
    logger.info("🧠 Ejecutando la tarea _analyze_and_update_note_task sincrónicamente...")
    try:
        await _analyze_and_update_note_task(
            note_id=note_id,
            session_id=session_id,
            content=content,
            user_id=user_id,
            username=username
        )
        logger.info("🎉 Tarea de análisis completada.")
    except Exception as e:
        logger.error(f"❌ Error al ejecutar la tarea: {e}")
        return
        
    # 6. Consultar la nota actualizada para verificar detected_items y detected_npcs
    logger.info("🔍 Verificando actualización de la nota en session_notes...")
    updated_note_res = admin_client.table("session_notes").select("*").eq("id", note_id).single().execute()
    
    if updated_note_res.data:
        updated_note = updated_note_res.data
        logger.info("📋 Datos de la nota actualizados:")
        logger.info(f"   -> Items detectados: {updated_note.get('detected_items')}")
        logger.info(f"   -> NPCs detectados: {updated_note.get('detected_npcs')}")
    else:
        logger.error("❌ No se pudo obtener la nota actualizada.")
        
    # 7. Consultar rag_entities para verificar si las entidades del RAG se insertaron correctamente
    logger.info("🔍 Verificando entidades registradas en rag_entities...")
    rag_res = admin_client.table("rag_entities").select("*").eq("campaign_id", campaign_id).execute()
    
    if rag_res.data:
        logger.info(f"🏆 Entidades registradas en RAG (Total: {len(rag_res.data)}):")
        for idx, entity in enumerate(rag_res.data):
            logger.info(
                f"   [{idx + 1}] Tipo: {entity.get('entity_type')} | "
                f"Nombre: {entity.get('entity_name')} | "
                f"Mentions: {entity.get('mention_count')} | "
                f"Creado: {entity.get('created_at')}"
            )
    else:
        logger.error("❌ No se encontraron entidades en rag_entities para esta campaña. El RAG falló.")

if __name__ == "__main__":
    asyncio.run(run_test())
