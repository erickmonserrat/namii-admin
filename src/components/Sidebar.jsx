import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  CalendarDays,
  Users,
  HeartHandshake,
  LogOut,
  Baby,
  UserRound,
  ChevronDown
} from 'lucide-react'

const groupedItems = [
  { id: 'centers', label: 'Centros', Icon: Building2 },
  { id: 'rooms', label: 'Grupos / Salas', Icon: DoorOpen },
  { id: 'calendars', label: 'Calendarios', Icon: CalendarDays }
]

export default function Sidebar({ currentView, setCurrentView }) {
  const isGroupActive = ['centers', 'rooms', 'calendars'].includes(currentView)
  const [isGroupOpen, setIsGroupOpen] = useState(true)

  // Ensure dropdown expands when navigating to any of its children
  useEffect(() => {
    if (isGroupActive) {
      setIsGroupOpen(true)
    }
  }, [isGroupActive])

  return (
    <aside className="w-64 bg-nami-sidebar text-teal-50 flex flex-col justify-between shrink-0 select-none shadow-xl z-30">
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Brand header */}
        <div className="flex items-center px-5 py-4 border-b border-teal-800/40">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mr-3">
            <Baby size={19} />
          </div>
          <div>
            <div className="font-bold tracking-tight">NAMII</div>
            <div className="text-[9px] uppercase tracking-[.2em] text-teal-200/70">Admin</div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition ${
              currentView === 'dashboard'
                ? 'bg-nami-sidebarActive text-white font-semibold shadow-sm'
                : 'hover:bg-teal-800/40 text-teal-100/80'
            }`}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          {/* Collapsible Dropdown: Centros, Salas y Calendarios */}
          <div className="space-y-1">
            <button
              onClick={() => setIsGroupOpen(!isGroupOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition ${
                isGroupActive
                  ? 'bg-teal-800/60 text-white font-semibold'
                  : 'hover:bg-teal-800/40 text-teal-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 size={17} className={isGroupActive ? 'text-teal-200' : 'text-teal-300/80'} />
                <span>Centros y Espacios</span>
              </div>
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${
                  isGroupOpen ? 'rotate-180 text-teal-200' : 'text-teal-300/60'
                }`}
              />
            </button>

            {/* Dropdown sub-items */}
            {isGroupOpen && (
              <div className="ml-3 pl-3 border-l border-teal-700/60 space-y-1 py-1">
                {groupedItems.map(({ id, label, Icon }) => {
                  const active = currentView === id
                  return (
                    <button
                      key={id}
                      onClick={() => setCurrentView(id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition ${
                        active
                          ? 'bg-nami-sidebarActive text-white font-semibold shadow-sm'
                          : 'hover:bg-teal-800/40 text-teal-100/70 hover:text-white'
                      }`}
                    >
                      <Icon size={15} className={active ? 'text-white' : 'text-teal-200/80'} />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Familias y Niños */}
          <button
            onClick={() => setCurrentView('children')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition ${
              currentView === 'children'
                ? 'bg-nami-sidebarActive text-white font-semibold shadow-sm'
                : 'hover:bg-teal-800/40 text-teal-100/80'
            }`}
          >
            <Users size={17} />
            <span>Familias y Niños</span>
          </button>

          {/* Admisiones y CRM */}
          <button
            onClick={() => setCurrentView('crm')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition ${
              currentView === 'crm'
                ? 'bg-nami-sidebarActive text-white font-semibold shadow-sm'
                : 'hover:bg-teal-800/40 text-teal-100/80'
            }`}
          >
            <HeartHandshake size={17} />
            <span>Admisiones y CRM</span>
          </button>

          {/* Equipo */}
          <button
            onClick={() => setCurrentView('staff')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition ${
              currentView === 'staff'
                ? 'bg-nami-sidebarActive text-white font-semibold shadow-sm'
                : 'hover:bg-teal-800/40 text-teal-100/80'
            }`}
          >
            <UserRound size={17} />
            <span>Equipo</span>
          </button>
        </nav>
      </div>

      {/* Logout footer */}
      <div className="p-3 border-t border-teal-800/40">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-teal-100/70 hover:bg-teal-800/40">
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
