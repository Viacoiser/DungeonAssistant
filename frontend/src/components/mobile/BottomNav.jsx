import { Menu, Plus } from 'lucide-react'

export default function BottomNav() {
  return (
    <div className="flex justify-around py-3 text-white">
      <button className="flex flex-col items-center gap-1">
        <Menu size={24} />
        <span className="text-xs">Inicio</span>
      </button>
      <button className="flex flex-col items-center gap-1">
        <div className="w-6 h-6">👤</div>
        <span className="text-xs">Personaje</span>
      </button>
      <button className="flex flex-col items-center gap-1">
        <Plus size={24} />
        <span className="text-xs">Sesión</span>
      </button>
      <button className="flex flex-col items-center gap-1">
        <div className="w-6 h-6">💬</div>
        <span className="text-xs">Asistente</span>
      </button>
    </div>
  )
}
