import os
import sys
import asyncio
import uuid
import logging
from pathlib import Path
from dotenv import load_dotenv

# Configurar logging básico para ver el output de la tarea
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test_batch_chronicles")

# Añadir el backend al path para que las importaciones funcionen
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

load_dotenv(os.path.join(backend_dir, ".env"))

from services.supabase import SupabaseClient
from routers.sessions import _maybe_generate_chronicle

async def main():
    logger.info("🚀 Iniciando prueba automatizada de Crónicas por Lotes...")
    
    supabase = SupabaseClient()
    admin_client = supabase.admin_client
    
    # 1. Buscar un usuario existente en la base de datos para actuar como GM y autor de las notas
    logger.info("🔍 Buscando un usuario en la base de datos...")
    user_res = admin_client.table("users").select("id, username").limit(1).execute()
    if not user_res.data:
        logger.error("❌ No se encontró ningún usuario en la base de datos. Por favor, crea un usuario primero en el frontend.")
        return
        
    user = user_res.data[0]
    user_id = user["id"]
    username = user["username"]
    logger.info(f"👤 Usando usuario: '{username}' (ID: {user_id})")
    
    # 2. Crear una nueva campaña de prueba
    campaign_name = f"Crónicas de Prueba Antigravity ({str(uuid.uuid4())[:8]})"
    inv_code = str(uuid.uuid4())[:6].upper()
    logger.info(f"➕ Creando campaña de prueba: '{campaign_name}' (Código de invitación: {inv_code})...")
    
    campaign_res = admin_client.table("campaigns").insert({
        "name": campaign_name,
        "description": "Campaña creada automáticamente para probar la generación de crónicas por lotes.",
        "lore_summary": "Un mundo lleno de misterios donde se probará el sistema RAG de DungeonAssistant.",
        "invitation_code": inv_code,
        "is_active": True
    }).execute()
    
    if not campaign_res.data:
        logger.error("❌ No se pudo crear la campaña de prueba.")
        return
        
    campaign = campaign_res.data[0]
    campaign_id = campaign["id"]
    logger.info(f"✅ Campaña de prueba creada exitosamente con ID: {campaign_id}")
    
    # 3. Añadir el usuario como GM de esta campaña
    logger.info("⚔️ Añadiendo usuario a campaign_members con rol de GM...")
    member_res = admin_client.table("campaign_members").insert({
        "campaign_id": campaign_id,
        "user_id": user_id,
        "role": "GM",
        "status": "ACTIVE"
    }).execute()
    
    if not member_res.data:
        logger.error("❌ No se pudo registrar al GM en la campaña.")
        return
    logger.info("✅ Rol de GM asignado correctamente.")
    
    # 4. Crear sesiones de prueba (1, 2, 3, 4, 5)
    # Sesiones 1, 2, 3 tendrán notas que luego serán consolidadas en una crónica.
    # Sesiones 4 y 5 simulan el avance de la campaña.
    logger.info("📅 Creando sesiones 1, 2, 3, 4 y 5...")
    sessions = []
    for i in range(1, 6):
        session_res = admin_client.table("sessions").insert({
            "campaign_id": campaign_id,
            "session_number": i,
            "title": f"Sesión de Prueba #{i}",
            "is_active": False  # Ya finalizadas
        }).execute()
        
        if not session_res.data:
            logger.error(f"❌ No se pudo crear la Sesión #{i}")
            return
        
        sessions.append(session_res.data[0])
    logger.info("✅ Sesiones 1-5 creadas y marcadas como finalizadas.")
    
    # 5. Insertar notas de juego detalladas para las sesiones 1, 2 y 3
    # Esto es lo que Gemini leerá y estructurará.
    notes_data = [
        {
            "session_id": sessions[0]["id"], # Sesión 1
            "content": "Los aventureros se adentraron en el Bosque Susurrante. Allí conocieron al sabio elfo Elrond, quien les advirtió sobre la amenaza del dragón Smaug. Durante la noche, un grupo de orcos atacó el campamento y recuperamos una Daga Rúnica."
        },
        {
            "session_id": sessions[1]["id"], # Sesión 2
            "content": "Viajamos al Templo de Cristal en busca de la Gema de la Verdad. Al llegar, resolvimos los acertijos grabados en la entrada de cristal. Dentro, luchamos contra espectros de cristal y conseguimos el legendario Ojo de la Verdad."
        },
        {
            "session_id": sessions[2]["id"], # Sesión 3
            "content": "Subimos a la cumbre de la Montaña del Trueno. Allí derrotamos al Nigromante Malakor antes de que pudiera completar su ritual oscuro. Encontramos un Escudo de Mitrilo y liberamos a los aldeanos prisioneros."
        }
    ]
    
    logger.info("📝 Insertando notas del juego para las sesiones 1, 2 y 3...")
    for note in notes_data:
        note_res = admin_client.table("session_notes").insert({
            "session_id": note["session_id"],
            "author_id": user_id,
            "content": note["content"],
            "detected_items": [],
            "detected_npcs": []
        }).execute()
        
        if not note_res.data:
            logger.error(f"❌ Error insertando notas en la sesión {note['session_id']}")
            return
            
    logger.info("✅ Notas insertadas exitosamente.")
    
    # 6. Crear la Sesión 6
    logger.info("🎬 Creando Sesión 6 (la sesión actual que finalizará y disparará el proceso)...")
    session6_res = admin_client.table("sessions").insert({
        "campaign_id": campaign_id,
        "session_number": 6,
        "title": "Sesión Activa #6",
        "is_active": True
    }).execute()
    
    if not session6_res.data:
        logger.error("❌ No se pudo crear la Sesión 6")
        return
        
    session6_id = session6_res.data[0]["id"]
    logger.info(f"✅ Sesión 6 creada con ID: {session6_id}")
    
    # 7. Simular el final de la sesión 6 para disparar la generación de la crónica
    logger.info("🔔 Simulando fin de sesión de la Sesión #6 para disparar _maybe_generate_chronicle...")
    
    # Marcamos como inactiva la sesión 6 en la base de datos
    admin_client.table("sessions").update({
        "is_active": False
    }).eq("id", session6_id).execute()
    
    # Ejecutamos la función de generación
    logger.info("🧠 Ejecutando la lógica de IA con Gemini en el backend...")
    try:
        chronicle = await _maybe_generate_chronicle(supabase, campaign_id, 6)
        
        if chronicle:
            logger.info("🎉 ¡CRÓNICA GENERADA CON ÉXITO POR GEMINI! 🎉")
            import json
            print("\n" + "="*80)
            print(f"📌 TÍTULO DE LA CRÓNICA: {chronicle.get('chronicle_title')}")
            print("="*80)
            print(f"📖 RESUMEN NARRATIVO:\n{chronicle.get('narrative_summary')}")
            print("-"*80)
            print(f"👥 NPCs ENCONTRADOS: {', '.join(chronicle.get('npcs_encountered', []))}")
            print(f"🎒 ITEMS OBTENIDOS: {', '.join(chronicle.get('items_obtained', []))}")
            print(f"🗺️ LUGARES VISITADOS: {', '.join(chronicle.get('locations_visited', []))}")
            print("="*80 + "\n")
        else:
            logger.error("❌ La crónica no se generó. Comprueba las condiciones de activación o los logs.")
            return
    except Exception as e:
        logger.error(f"❌ Error durante la generación de la crónica por Gemini: {e}")
        return
        
    # 8. Comprobar que se guardó correctamente en la tabla de RAG (rag_events)
    logger.info("🔍 Comprobando registro guardado en la tabla 'rag_events' de la base de datos...")
    rag_res = admin_client.table("rag_events").select("*").eq("campaign_id", campaign_id).execute()
    if rag_res.data:
        event = rag_res.data[0]
        logger.info(f"✅ ¡Confirmado! Evento encontrado en la tabla 'rag_events' (ID: {event['id']})")
        logger.info(f"   -> Cubre la sesión número: {event['session_number']} (y las siguientes)")
        logger.info(f"   -> Título en DB: {event['event_title']}")
    else:
        logger.error("❌ No se encontró ningún registro en 'rag_events' para esta campaña.")
        return

    # Instrucciones para el usuario
    print("\n" + "*"*80)
    print("🚀 PRUEBA AUTOMATIZADA COMPLETADA CON ÉXITO")
    print("*"*80)
    print("Para ver esta campaña y su crónica en la interfaz web (Frontend):")
    print(f"1. Inicia sesión en el Frontend con el usuario: '{username}'")
    print(f"2. En la lista de campañas, haz clic en 'Unirse a Campaña' (Join Campaign)")
    print(f"3. Introduce el código de invitación: {inv_code}")
    print("4. Entra a la campaña y ve a la nueva pestaña 'Crónicas'!")
    print("   Allí verás el pergamino antiguo generado automáticamente con toda esta información.")
    print("*"*80 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
