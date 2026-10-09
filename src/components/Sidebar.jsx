import { LayoutDashboard, Building2, DoorOpen, Users, HeartHandshake, LogOut, Baby, UserRound } from 'lucide-react'
const items = [
  ['dashboard','Dashboard',LayoutDashboard],
  ['centers','Centros',Building2],
  ['rooms','Grupos / Salas',DoorOpen],
  ['children','Familias y Niños',Users],
  ['crm','CRM',HeartHandshake],
  ['staff','Equipo',UserRound]
]
export default function Sidebar({ currentView, setCurrentView }) {
 return <aside className="w-64 bg-nami-sidebar text-teal-50 flex flex-col justify-between shrink-0 select-none shadow-xl z-30">
  <div className="flex flex-col h-full overflow-y-auto">
   <div className="flex items-center px-5 py-4 border-b border-teal-800/40">
    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mr-3"><Baby size={19}/></div>
    <div><div className="font-bold tracking-tight">NAMII</div><div className="text-[9px] uppercase tracking-[.2em] text-teal-200/70">Admin</div></div>
   </div>
   <nav className="p-3 space-y-1">
    {items.map(([id,label,Icon]) => <button key={id} onClick={()=>setCurrentView(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition ${currentView===id?'bg-nami-sidebarActive text-white font-semibold shadow-sm':'hover:bg-teal-800/40 text-teal-100/80'}`}><Icon size={17}/><span>{label}</span></button>)}
   </nav>
  </div>
  <div className="p-3 border-t border-teal-800/40"><button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-teal-100/70 hover:bg-teal-800/40"><LogOut size={16}/> Cerrar sesión</button></div>
 </aside>
}
