import { useMemo, useState } from 'react'
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  DoorOpen,
  User,
  Users,
  Pencil,
  Trash2,
  Filter,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import Modal from '../components/Modal'

const EVENT_TYPES = [
  { id: 'Clase Muestra', label: 'Clase Muestra', color: 'bg-purple-100 text-purple-700 border-purple-200 ring-purple-500' },
  { id: 'Actividad de Sala', label: 'Actividad de Sala', color: 'bg-teal-100 text-teal-800 border-teal-200 ring-teal-500' },
  { id: 'Taller', label: 'Taller para Padres', color: 'bg-amber-100 text-amber-800 border-amber-200 ring-amber-500' },
  { id: 'Evaluación', label: 'Evaluación de Desarrollo', color: 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500' },
  { id: 'Evento Especial', label: 'Evento Especial', color: 'bg-rose-100 text-rose-700 border-rose-200 ring-rose-500' }
]

function getTypeMeta(type) {
  return EVENT_TYPES.find(t => t.id === type) || {
    id: type,
    label: type,
    color: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-400'
  }
}

export default function Calendars({ data, setData, toast }) {
  // Use October 2026 as initial active calendar view matching seed data
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1))
  const [selectedDateStr, setSelectedDateStr] = useState('2026-10-12')
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week' | 'agenda'
  const [centerFilter, setCenterFilter] = useState('ALL')
  const [roomFilter, setRoomFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [form, setForm] = useState({
    title: '',
    type: 'Clase Muestra',
    centerName: data.centers?.[0]?.name || 'Namii Del Valle',
    roomId: data.rooms?.[0]?.id || 1,
    roomName: data.rooms?.[0]?.name || '',
    date: '2026-10-12',
    startTime: '10:00',
    endTime: '11:00',
    instructor: data.staff?.[0]?.name || 'Erick Monserrat',
    capacity: 5,
    status: 'Programada',
    notes: ''
  })

  const events = data.calendarEvents || []

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (centerFilter !== 'ALL' && ev.centerName !== centerFilter) return false
      if (roomFilter !== 'ALL' && String(ev.roomId) !== String(roomFilter)) return false
      if (typeFilter !== 'ALL' && ev.type !== typeFilter) return false
      return true
    })
  }, [events, centerFilter, roomFilter, typeFilter])

  // Calendar calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sun
    // Convert so Monday is 0: (day + 6) % 7
    const adjustedFirstDay = (firstDayIndex + 6) % 7
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days = []

    // Previous month padding
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i)
      const dateStr = prevDate.toISOString().slice(0, 10)
      days.push({
        date: prevDate,
        dateStr,
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false
      })
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(year, month, d)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        date: dateObj,
        dateStr,
        dayNum: d,
        isCurrentMonth: true
      })
    }

    // Next month padding (complete grid to multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i)
      const dateStr = nextDate.toISOString().slice(0, 10)
      days.push({
        date: nextDate,
        dateStr,
        dayNum: i,
        isCurrentMonth: false
      })
    }

    return days
  }, [year, month])

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToday = () => {
    setCurrentDate(new Date(2026, 9, 1))
    setSelectedDateStr('2026-10-12')
  }

  // Open modal for add or edit
  const openModal = (ev = null, defaultDate = null) => {
    if (ev) {
      setEditingEvent(ev)
      setForm({ ...ev })
    } else {
      setEditingEvent(null)
      const room = data.rooms?.[0]
      setForm({
        title: '',
        type: 'Clase Muestra',
        centerName: data.centers?.[0]?.name || 'Namii Del Valle',
        roomId: room?.id || 1,
        roomName: room?.name || '',
        date: defaultDate || selectedDateStr || '2026-10-12',
        startTime: '10:00',
        endTime: '11:00',
        instructor: data.staff?.[0]?.name || 'Erick Monserrat',
        capacity: 6,
        status: 'Programada',
        notes: ''
      })
    }
    setModalOpen(true)
  }

  const saveEvent = () => {
    if (!form.title.trim()) return toast('Ingresa el título de la actividad')
    if (!form.date) return toast('Selecciona una fecha')

    const room = data.rooms?.find(r => String(r.id) === String(form.roomId))
    const roomName = room ? room.name : form.roomName || 'Sala general'

    const eventPayload = {
      ...form,
      roomName,
      capacity: Number(form.capacity) || 1
    }

    if (editingEvent) {
      setData(d => ({
        ...d,
        calendarEvents: (d.calendarEvents || []).map(e =>
          e.id === editingEvent.id ? { ...e, ...eventPayload } : e
        )
      }))
      toast('Evento actualizado')
    } else {
      setData(d => ({
        ...d,
        calendarEvents: [
          ...(d.calendarEvents || []),
          {
            ...eventPayload,
            id: Date.now()
          }
        ]
      }))
      toast('Evento agregado al calendario')
    }

    setModalOpen(false)
  }

  const removeEvent = id => {
    if (confirm('¿Eliminar esta actividad del calendario?')) {
      setData(d => ({
        ...d,
        calendarEvents: (d.calendarEvents || []).filter(e => e.id !== id)
      }))
      toast('Evento eliminado')
      if (editingEvent && editingEvent.id === id) {
        setModalOpen(false)
      }
    }
  }

  // Events on selected day
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter(ev => ev.date === selectedDateStr)
  }, [filteredEvents, selectedDateStr])

  // Count summaries
  const sampleClassesCount = filteredEvents.filter(e => e.type === 'Clase Muestra').length
  const roomActivitiesCount = filteredEvents.filter(e => e.type === 'Actividad de Sala').length
  const workshopsCount = filteredEvents.filter(e => e.type === 'Taller').length

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 dot-pattern">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur p-6 rounded-2xl border border-teal-100/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <CalendarDays size={20} />
              </span>
              <h1 className="text-2xl font-bold text-slate-800">Calendarios</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Programación de clases muestra, actividades de salas, talleres y horarios de centros.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => openModal(null, selectedDateStr)}
              className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 transition-colors text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={16} />
              <span>Nuevo evento</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium">Eventos del mes</span>
            <div className="text-xl font-bold text-slate-800 mt-1">{filteredEvents.length}</div>
            <span className="text-[10px] text-teal-600 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 size={11} /> Todas las sedes
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] text-purple-600 font-medium">Clases Muestra (CRM)</span>
            <div className="text-xl font-bold text-purple-900 mt-1">{sampleClassesCount}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Inducción y captación</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] text-teal-600 font-medium">Actividades de Sala</span>
            <div className="text-xl font-bold text-teal-900 mt-1">{roomActivitiesCount}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Estimulación y movimiento</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] text-amber-600 font-medium">Talleres y Familias</span>
            <div className="text-xl font-bold text-amber-900 mt-1">{workshopsCount}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Encuentros con padres</span>
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Controls: Prev/Next Month & Today */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition"
                title="Mes anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition"
                title="Mes siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              onClick={goToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
            >
              Hoy
            </button>
            <span className="text-sm font-bold text-slate-800 capitalize ml-2">{monthName}</span>
          </div>

          {/* Filters: Center, Room, Type */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Center Filter */}
            <select
              value={centerFilter}
              onChange={e => setCenterFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:border-teal-600"
            >
              <option value="ALL">Todos los Centros</option>
              {(data.centers || []).map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Room Filter */}
            <select
              value={roomFilter}
              onChange={e => setRoomFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:border-teal-600"
            >
              <option value="ALL">Todas las Salas</option>
              {(data.rooms || []).map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Event Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:border-teal-600"
            >
              <option value="ALL">Todos los Tipos</option>
              {EVENT_TYPES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div className="bg-slate-100 rounded-xl p-1 flex">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'month' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'agenda' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Agenda
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {viewMode === 'month' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar Grid (3 Cols on Desktop) */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
                <div>Dom</div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-slate-100">
                {calendarDays.map((item, idx) => {
                  const dayEvents = filteredEvents.filter(e => e.date === item.dateStr)
                  const isSelected = selectedDateStr === item.dateStr
                  const isToday = item.dateStr === '2026-10-09'

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateStr(item.dateStr)}
                      className={`min-h-[92px] sm:min-h-[110px] p-1.5 sm:p-2 cursor-pointer transition flex flex-col justify-between ${
                        !item.isCurrentMonth
                          ? 'bg-slate-50/50 text-slate-300'
                          : isSelected
                          ? 'bg-teal-50/40 ring-2 ring-inset ring-teal-600'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      {/* Day number header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            isToday
                              ? 'bg-teal-700 text-white'
                              : isSelected
                              ? 'bg-teal-100 text-teal-800'
                              : item.isCurrentMonth
                              ? 'text-slate-700'
                              : 'text-slate-300'
                          }`}
                        >
                          {item.dayNum}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips (max 2 visible on grid, +more) */}
                      <div className="space-y-1 mt-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map(ev => {
                          const meta = getTypeMeta(ev.type)
                          return (
                            <div
                              key={ev.id}
                              onClick={e => {
                                e.stopPropagation()
                                openModal(ev)
                              }}
                              className={`text-[10px] truncate px-1.5 py-0.5 rounded border font-medium ${meta.color} hover:brightness-95 transition`}
                              title={`${ev.startTime} ${ev.title} (${ev.roomName})`}
                            >
                              <span className="font-bold mr-1">{ev.startTime}</span>
                              {ev.title}
                            </div>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-slate-400 font-semibold px-1">
                            +{dayEvents.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Selected Day Sidebar Panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                    Día seleccionado
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 capitalize">
                    {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </h3>
                </div>
                <button
                  onClick={() => openModal(null, selectedDateStr)}
                  className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="Agregar actividad para esta fecha"
                >
                  <Plus size={14} />
                  <span>Nuevo</span>
                </button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <CalendarIcon size={32} className="text-slate-300 stroke-1" />
                  <p className="text-xs">Sin actividades programadas para este día.</p>
                  <button
                    onClick={() => openModal(null, selectedDateStr)}
                    className="text-xs text-teal-700 font-semibold hover:underline"
                  >
                    + Programar evento
                  </button>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
                  {selectedDayEvents.map(ev => {
                    const meta = getTypeMeta(ev.type)
                    return (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-teal-200 transition space-y-2 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${meta.color}`}
                          >
                            {ev.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openModal(ev)}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded transition"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => removeEvent(ev.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-800">{ev.title}</h4>

                        <div className="text-[11px] text-slate-500 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" />
                            <span>
                              {ev.startTime} - {ev.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DoorOpen size={12} className="text-slate-400" />
                            <span className="truncate">{ev.roomName || 'Sala General'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-slate-400" />
                            <span>{ev.instructor}</span>
                          </div>
                          {ev.notes && (
                            <div className="text-[10px] text-slate-400 bg-white p-2 rounded-lg border border-slate-100 mt-2">
                              {ev.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Agenda / List View */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Cronograma y Agenda General</h3>
                <p className="text-xs text-slate-400">Lista cronológica de actividades por fecha</p>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                {filteredEvents.length} actividades
              </span>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CalendarIcon size={36} className="mx-auto text-slate-300 stroke-1" />
                <p className="text-xs">No se encontraron actividades con los filtros actuales.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredEvents
                  .slice()
                  .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
                  .map(ev => {
                    const meta = getTypeMeta(ev.type)
                    return (
                      <div
                        key={ev.id}
                        className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          {/* Date badge */}
                          <div className="bg-teal-50/80 border border-teal-100 text-teal-800 rounded-xl p-2.5 text-center min-w-[62px] shrink-0">
                            <span className="text-[10px] uppercase font-bold block text-teal-600">
                              {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                            </span>
                            <span className="text-lg font-black block leading-none">
                              {ev.date.split('-')[2]}
                            </span>
                            <span className="text-[9px] text-teal-600/80 capitalize block">
                              {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' })}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${meta.color}`}
                              >
                                {ev.type}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                <Clock size={12} /> {ev.startTime} - {ev.endTime}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <MapPin size={12} /> {ev.centerName}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-800">{ev.title}</h4>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                              <span className="flex items-center gap-1">
                                <DoorOpen size={13} className="text-teal-600" />
                                <strong>Sala:</strong> {ev.roomName}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={13} className="text-teal-600" />
                                <strong>Instructor:</strong> {ev.instructor}
                              </span>
                              {ev.capacity && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Users size={13} /> Cupo: {ev.capacity}
                                </span>
                              )}
                            </div>

                            {ev.notes && (
                              <p className="text-[11px] text-slate-400 italic pt-1">{ev.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => openModal(ev)}
                            className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg flex items-center gap-1 transition"
                          >
                            <Pencil size={12} /> Editar
                          </button>
                          <button
                            onClick={() => removeEvent(ev.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar evento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {/* Modal: Crear / Editar Evento */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingEvent ? 'Editar Evento de Calendario' : 'Nuevo Evento en Calendario'}
          width="max-w-xl"
        >
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700">
              Título de la actividad *
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Ej. Clase Muestra - Estimulación Inicial"
                className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-700">
                Tipo de evento
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Fecha *
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-700">
                Hora de inicio
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Hora de fin
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-700">
                Centro / Sede
                <select
                  value={form.centerName}
                  onChange={e => setForm({ ...form, centerName: e.target.value })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                >
                  {(data.centers || []).map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Sala / Grupo
                <select
                  value={form.roomId}
                  onChange={e => {
                    const r = data.rooms?.find(x => String(x.id) === String(e.target.value))
                    setForm({
                      ...form,
                      roomId: e.target.value,
                      roomName: r ? r.name : form.roomName
                    })
                  }}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                >
                  {(data.rooms || []).map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.ageGroup})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-700">
                Instructor / Especialista
                <select
                  value={form.instructor}
                  onChange={e => setForm({ ...form, instructor: e.target.value })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                >
                  {(data.staff || []).map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Cupo máximo estimado
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </label>
            </div>

            <label className="block text-xs font-semibold text-slate-700">
              Observaciones / Material necesario
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas de preparación, requerimientos de la sala o prospecto vinculado..."
                className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 resize-none"
              />
            </label>

            <div className="flex gap-2 pt-2">
              {editingEvent && (
                <button
                  type="button"
                  onClick={() => removeEvent(editingEvent.id)}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                >
                  Eliminar
                </button>
              )}
              <button
                type="button"
                onClick={saveEvent}
                className="flex-1 bg-teal-700 hover:bg-teal-800 transition text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm"
              >
                {editingEvent ? 'Guardar cambios' : 'Crear evento'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
