import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  UserRound,
  Phone,
  Mail,
  Baby,
  CalendarDays,
  Clock,
  Building2,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Layers,
  ListOrdered,
  PieChart,
  Pencil,
  Trash2,
  ChevronRight,
  UserPlus,
  ArrowRight,
  Sparkles,
  Calendar,
  GripVertical,
  X,
  FileText
} from 'lucide-react'
import { crmStages } from '../data/seedData'
import Modal from '../components/Modal'

function getSourceBadgeStyle(source) {
  const s = (source || '').toLowerCase()
  if (s.includes('instagram')) return 'bg-pink-50 text-pink-700 border-pink-200'
  if (s.includes('whatsapp')) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (s.includes('google')) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (s.includes('recomend')) return 'bg-purple-50 text-purple-700 border-purple-200'
  if (s.includes('paseo') || s.includes('fachada')) return 'bg-amber-50 text-amber-700 border-amber-200'
  if (s.includes('facebook')) return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

const PERIOD_OPTIONS = [
  { id: 'all', label: 'Todo el historial' },
  { id: 'this_month', label: 'Este mes (Octubre 2026)' },
  { id: 'last_30_days', label: 'Últimos 30 días' },
  { id: 'this_quarter', label: 'Este trimestre (Q4 2026)' }
]

const STAGE_ORDER = [
  { id: 'Consulta', label: 'Consulta', color: 'bg-blue-500', headerBg: 'bg-blue-50 text-blue-800 border-blue-200' },
  { id: 'Agenda Clase Muestra', label: 'Agenda Clase Muestra', color: 'bg-purple-500', headerBg: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: 'Clase Muestra', label: 'Clase Muestra', color: 'bg-indigo-500', headerBg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'Pendiente de confirmación', label: 'Pendiente de confirmación', color: 'bg-amber-500', headerBg: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'Fidelizado', label: 'Fidelizado / Inscrito', color: 'bg-emerald-500', headerBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'Perdido', label: 'Perdido', color: 'bg-rose-500', headerBg: 'bg-rose-50 text-rose-800 border-rose-200' }
]

function normalizeStage(st) {
  if (st === 'Lista de Espera') return 'Pendiente de confirmación'
  if (st === 'Fidelizado / Inscrito') return 'Fidelizado'
  return st || 'Consulta'
}

function matchStage(leadStage, targetStageId) {
  const normLead = normalizeStage(leadStage)
  const normTarget = normalizeStage(targetStageId)
  return normLead === normTarget
}

export default function CRM({ data, setData, toast }) {
  const [activeTab, setActiveTab] = useState('flujo') // 'flujo' | 'espera' | 'capacidad'

  // Filters for Flujo
  const [q, setQ] = useState('')
  const [period, setPeriod] = useState('all')
  const [centerFilter, setCenterFilter] = useState('ALL')
  const [roomFilter, setRoomFilter] = useState('ALL')

  // Filters for Lista de Espera
  const [waitlistQ, setWaitlistQ] = useState('')
  const [waitlistCenter, setWaitlistCenter] = useState('ALL')
  const [waitlistRoom, setWaitlistRoom] = useState('ALL')

  // Modals & Drawer
  const [addModal, setAddModal] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState('resumen') // 'resumen' | 'actividad'
  const [scheduleModal, setScheduleModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [newActivityNote, setNewActivityNote] = useState('')

  // Drag and Drop State for Kanban
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  const [dragOverStageId, setDragOverStageId] = useState(null)

  // New Lead Form State
  const initialForm = {
    parentFirstName: '',
    parentLastName1: '',
    parentLastName2: '',
    childFirstName: '',
    childLastName1: '',
    childLastName2: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Masculino',
    dob: '',
    centerName: data.centers?.[0]?.name || 'Namii Del Valle',
    targetRoom: data.rooms?.[0]?.name || 'Orugas (Estimulación Inicial)',
    assignedTo: data.staff?.[0]?.name || 'Erick Monserrat',
    source: 'Instagram',
    stage: 'Consulta',
    notes: ''
  }
  const [form, setForm] = useState(initialForm)

  // Schedule modal form state
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    date: '2026-10-14',
    startTime: '10:00',
    endTime: '11:00',
    centerName: '',
    roomName: '',
    instructor: '',
    notes: ''
  })

  // Date filtering helper
  const isInPeriod = (dateStr, periodId) => {
    if (periodId === 'all') return true
    if (!dateStr) return true
    const d = new Date(dateStr)
    const now = new Date(2026, 9, 9) // Current demo anchor Oct 9, 2026
    if (periodId === 'this_month') {
      return d.getFullYear() === 2026 && d.getMonth() === 9
    }
    if (periodId === 'last_30_days') {
      const diffDays = (now - d) / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays <= 30
    }
    if (periodId === 'this_quarter') {
      return d.getFullYear() === 2026 && d.getMonth() >= 9 && d.getMonth() <= 11
    }
    return true
  }

  // Base leads list filtered by search and period
  const filteredLeads = useMemo(() => {
    return (data.leads || []).filter(l => {
      // Period filter
      if (!isInPeriod(l.registeredDate || l.createdAt, period)) return false

      // Center filter
      if (centerFilter !== 'ALL' && l.centerName !== centerFilter) return false

      // Room filter
      if (roomFilter !== 'ALL' && l.targetRoom !== roomFilter) return false

      // Search query filter (parent name, child name, email, phone)
      if (q.trim()) {
        const query = q.toLowerCase().trim()
        const parent = (
          l.parentName ||
          `${l.parentFirstName || ''} ${l.parentLastName1 || ''} ${l.parentLastName2 || ''}`
        ).toLowerCase()
        const child = (
          l.childName ||
          `${l.childFirstName || ''} ${l.childLastName1 || ''} ${l.childLastName2 || ''}`
        ).toLowerCase()
        const email = (l.email || '').toLowerCase()
        const phone = (l.phone || '').toLowerCase()
        if (
          !parent.includes(query) &&
          !child.includes(query) &&
          !email.includes(query) &&
          !phone.includes(query)
        ) {
          return false
        }
      }

      return true
    })
  }, [data.leads, period, centerFilter, roomFilter, q])

  // Active prospects count (not enrolled/fidelizado and not perdido)
  const activeLeadsCount = useMemo(() => {
    return filteredLeads.filter(
      l => !['Fidelizado', 'Perdido'].includes(normalizeStage(l.stage))
    ).length
  }, [filteredLeads])

  // Waitlist leads specifically for "Lista de espera" tab
  const waitlistLeads = useMemo(() => {
    return (data.leads || []).filter(l => {
      const isWait = matchStage(l.stage, 'Pendiente de confirmación')
      if (!isWait) return false

      if (waitlistCenter !== 'ALL' && l.centerName !== waitlistCenter) return false
      if (waitlistRoom !== 'ALL' && l.targetRoom !== waitlistRoom) return false

      if (waitlistQ.trim()) {
        const query = waitlistQ.toLowerCase().trim()
        const parent = (l.parentName || '').toLowerCase()
        const child = (l.childName || '').toLowerCase()
        const email = (l.email || '').toLowerCase()
        const phone = (l.phone || '').toLowerCase()
        if (
          !parent.includes(query) &&
          !child.includes(query) &&
          !email.includes(query) &&
          !phone.includes(query)
        ) {
          return false
        }
      }
      return true
    })
  }, [data.leads, waitlistCenter, waitlistRoom, waitlistQ])

  // Quick move lead to stage
  const moveLeadStage = (leadId, nextStage) => {
    setData(d => ({
      ...d,
      leads: d.leads.map(l => {
        if (l.id === leadId) {
          const act = l.activities || []
          return {
            ...l,
            stage: nextStage,
            activities: [
              ...act,
              {
                id: Date.now(),
                text: `Etapa actualizada a ${nextStage}.`,
                date: new Date().toISOString().slice(0, 10)
              }
            ]
          }
        }
        return l
      })
    }))
    toast(`Etapa actualizada a "${nextStage}"`)
  }

  // Handle Drag & Drop move
  const handleDropLead = (leadId, targetStageId) => {
    const lead = (data.leads || []).find(l => l.id === leadId)
    if (!lead) return
    if (normalizeStage(lead.stage) === normalizeStage(targetStageId)) return

    setData(d => ({
      ...d,
      leads: d.leads.map(l => {
        if (l.id === leadId) {
          const act = l.activities || []
          return {
            ...l,
            stage: targetStageId,
            activities: [
              ...act,
              {
                id: Date.now(),
                text: `Etapa cambiada a "${targetStageId}" arrastrando en Kanban.`,
                date: new Date().toISOString().slice(0, 10)
              }
            ]
          }
        }
        return l
      })
    }))
    const stageMeta = STAGE_ORDER.find(s => s.id === targetStageId)
    toast(`"${lead.childName || lead.parentName}" movido a "${stageMeta?.label || targetStageId}"`)
  }

  // Delete lead with confirmation
  const handleDeleteLeadWithConfirm = lead => {
    const name = lead.childName ? `${lead.childName} (Tutor: ${lead.parentName})` : lead.parentName
    if (confirm(`¿Estás seguro de eliminar el prospecto de "${name}"? Esta acción no se puede deshacer.`)) {
      setData(d => ({
        ...d,
        leads: d.leads.filter(l => l.id !== lead.id)
      }))
      if (selectedLead?.id === lead.id) {
        setDrawerOpen(false)
        setSelectedLead(null)
      }
      toast('Prospecto eliminado correctamente')
    }
  }

  // Formalize Enrollment (promotes lead to Fidelizado and registers family & child)
  const enrollLead = lead => {
    const parentFullName =
      lead.parentName ||
      `${lead.parentFirstName || ''} ${lead.parentLastName1 || ''}`.trim() ||
      'Responsable'
    const childFullName =
      lead.childName ||
      `${lead.childFirstName || ''} ${lead.childLastName1 || ''}`.trim() ||
      'Alumno'

    // Update lead stage
    const updatedLeads = (data.leads || []).map(l =>
      l.id === lead.id
        ? {
            ...l,
            stage: 'Fidelizado',
            activities: [
              ...(l.activities || []),
              {
                id: Date.now(),
                text: 'Inscripción formal completada y registrada en el sistema escolar.',
                date: new Date().toISOString().slice(0, 10)
              }
            ]
          }
        : l
    )

    // Check if family already exists or create new
    let familyId = Date.now()
    let updatedFamilies = [...(data.families || [])]
    const existingFamily = updatedFamilies.find(
      f => f.parentName.toLowerCase() === parentFullName.toLowerCase()
    )
    if (existingFamily) {
      familyId = existingFamily.id
    } else {
      updatedFamilies.push({
        id: familyId,
        parentName: parentFullName,
        phone: lead.phone || '',
        centerName: lead.centerName || 'Namii Del Valle',
        registeredDate: new Date().toISOString().slice(0, 10),
        status: 'Active',
        membersCount: 1
      })
    }

    // Create enrolled child
    const newChild = {
      id: Date.now() + 1,
      familyId,
      name: childFullName,
      parentName: parentFullName,
      phone: lead.phone || '',
      gender: lead.gender || 'Masculino',
      dob: lead.dob || '2026-01-01',
      age: lead.age || '',
      centerName: lead.centerName || 'Namii Del Valle',
      roomName: lead.targetRoom || 'Not enrolled',
      status: 'Inscrito',
      archived: false
    }
    const updatedChildren = [...(data.children || []), newChild]

    // Update room enrollment count if room matches
    const updatedRooms = (data.rooms || []).map(r => {
      if (r.name === lead.targetRoom) {
        const curEnrolled = r.enrolled || r.enrolledChildIds?.length || 0
        return {
          ...r,
          enrolled: curEnrolled + 1,
          enrolledChildIds: [...(r.enrolledChildIds || []), newChild.id]
        }
      }
      return r
    })

    setData(d => ({
      ...d,
      leads: updatedLeads,
      families: updatedFamilies,
      children: updatedChildren,
      rooms: updatedRooms
    }))

    if (detailModal) setDetailModal(false)
    toast(`¡${childFullName} ha sido inscrito exitosamente en ${lead.targetRoom}!`)
  }

  // Open schedule sample class modal
  const openScheduleClass = lead => {
    setSelectedLead(lead)
    const room = data.rooms?.find(r => r.name === lead.targetRoom)
    setScheduleForm({
      title: `Clase Muestra - ${lead.childName || lead.childFirstName}`,
      date: '2026-10-14',
      startTime: '10:00',
      endTime: '11:00',
      centerName: lead.centerName || 'Namii Del Valle',
      roomName: lead.targetRoom || data.rooms?.[0]?.name || 'Orugas (Estimulación Inicial)',
      roomId: room?.id || data.rooms?.[0]?.id || 1,
      instructor: lead.assignedTo || data.staff?.[0]?.name || 'Sofía Ramírez',
      notes: `Prospecto: ${lead.parentName} (${lead.phone}). Interés en estimulación temprana.`
    })
    setScheduleModal(true)
  }

  // Save scheduled sample class into calendar and update lead stage
  const saveScheduledClass = () => {
    if (!scheduleForm.title.trim()) return toast('Ingresa el título')
    if (!scheduleForm.date) return toast('Selecciona la fecha')

    const newCalendarEvent = {
      id: Date.now(),
      title: scheduleForm.title,
      type: 'Clase Muestra',
      centerName: scheduleForm.centerName,
      roomId: scheduleForm.roomId,
      roomName: scheduleForm.roomName,
      date: scheduleForm.date,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      instructor: scheduleForm.instructor,
      capacity: 3,
      status: 'Programada',
      notes: scheduleForm.notes
    }

    const updatedLeads = (data.leads || []).map(l => {
      if (l.id === selectedLead.id) {
        return {
          ...l,
          stage: 'Agenda Clase Muestra',
          activities: [
            ...(l.activities || []),
            {
              id: Date.now(),
              text: `Clase muestra agendada para el ${scheduleForm.date} a las ${scheduleForm.startTime} en ${scheduleForm.roomName}.`,
              date: new Date().toISOString().slice(0, 10)
            }
          ]
        }
      }
      return l
    })

    setData(d => ({
      ...d,
      calendarEvents: [...(d.calendarEvents || []), newCalendarEvent],
      leads: updatedLeads
    }))

    setScheduleModal(false)
    toast('Clase muestra agendada e integrada en Calendarios')
  }

  // Add activity note to selected lead
  const addActivityNote = () => {
    if (!newActivityNote.trim()) return
    setData(d => ({
      ...d,
      leads: d.leads.map(l => {
        if (l.id === selectedLead.id) {
          return {
            ...l,
            activities: [
              ...(l.activities || []),
              {
                id: Date.now(),
                text: newActivityNote.trim(),
                date: new Date().toISOString().slice(0, 10)
              }
            ]
          }
        }
        return l
      })
    }))
    setSelectedLead(prev => ({
      ...prev,
      activities: [
        ...(prev.activities || []),
        {
          id: Date.now(),
          text: newActivityNote.trim(),
          date: new Date().toISOString().slice(0, 10)
        }
      ]
    }))
    setNewActivityNote('')
    toast('Nota de seguimiento agregada')
  }

  // Save new lead
  const saveNewLead = () => {
    if (!form.parentFirstName.trim() || !form.childFirstName.trim()) {
      return toast('Ingresa el nombre del responsable y del niño')
    }

    const parentFullName = [form.parentFirstName, form.parentLastName1, form.parentLastName2]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ')

    const childFullName = [form.childFirstName, form.childLastName1, form.childLastName2]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ')

    const newLeadItem = {
      id: Date.now(),
      parentName: parentFullName,
      childName: childFullName,
      parentFirstName: form.parentFirstName.trim(),
      parentLastName1: form.parentLastName1.trim(),
      parentLastName2: form.parentLastName2.trim(),
      childFirstName: form.childFirstName.trim(),
      childLastName1: form.childLastName1.trim(),
      childLastName2: form.childLastName2.trim(),
      phone: form.phone,
      email: form.email,
      age: form.age || '',
      gender: form.gender,
      dob: form.dob,
      centerName: form.centerName,
      targetRoom: form.targetRoom,
      assignedTo: form.assignedTo,
      source: form.source,
      stage: form.stage,
      registeredDate: new Date().toISOString().slice(0, 10),
      activities: form.notes
        ? [
            {
              id: Date.now(),
              text: `Registro inicial: ${form.notes}`,
              date: new Date().toISOString().slice(0, 10)
            }
          ]
        : []
    }

    setData(d => ({
      ...d,
      leads: [...d.leads, newLeadItem]
    }))

    setForm(initialForm)
    setAddModal(false)
    toast('Prospecto registrado en el embudo')
  }

  // Delete lead
  const removeLead = leadId => {
    if (confirm('¿Eliminar este prospecto del CRM?')) {
      setData(d => ({
        ...d,
        leads: d.leads.filter(l => l.id !== leadId)
      }))
      if (detailModal) setDetailModal(false)
      toast('Prospecto eliminado')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 dot-pattern">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/85 backdrop-blur p-6 rounded-2xl border border-teal-100/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <Layers size={20} />
              </span>
              <h1 className="text-2xl font-bold text-slate-800">Admisiones y CRM</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gestión del ciclo de admisiones, embudo comercial, lista de espera y control de capacidad en salas.
            </p>
          </div>

          <button
            onClick={() => {
              setForm(initialForm)
              setAddModal(true)
            }}
            className="bg-teal-700 hover:bg-teal-800 transition-colors text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shrink-0"
          >
            <Plus size={16} />
            <span>Agregar lead</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200/80 bg-white/70 backdrop-blur rounded-2xl p-1.5 shadow-xs">
          <button
            onClick={() => setActiveTab('flujo')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'flujo'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Layers size={15} />
            <span>Flujo</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'flujo' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {filteredLeads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('espera')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'espera'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <ListOrdered size={15} />
            <span>Lista de espera</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'espera' ? 'bg-teal-800 text-teal-100' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {(data.leads || []).filter(l => matchStage(l.stage, 'Pendiente de confirmación')).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('capacidad')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'capacidad'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <PieChart size={15} />
            <span>Capacidad</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'capacidad' ? 'bg-teal-800 text-teal-100' : 'bg-teal-50 text-teal-700'
              }`}
            >
              {(data.rooms || []).length} salas
            </span>
          </button>
        </div>

        {/* TAB 1: FLUJO */}
        {activeTab === 'flujo' && (
          <div className="space-y-6">
            {/* Top Controls: Selector de Periodo + Contador de Prospectos Activos + Buscador */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Contador de prospectos activos */}
              <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                    Prospectos Activos
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-slate-800">{activeLeadsCount}</span>
                    <span className="text-xs text-slate-400">en seguimiento</span>
                  </div>
                </div>
                <div className="text-right border-l border-slate-100 pl-4">
                  <span className="text-[10px] text-slate-400 block">Total en periodo</span>
                  <span className="text-sm font-bold text-slate-700">{filteredLeads.length} leads</span>
                </div>
              </div>

              {/* Selector de periodo y filtros de sede */}
              <div className="md:col-span-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Periodo
                  </label>
                  <select
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:border-teal-600"
                  >
                    {PERIOD_OPTIONS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Centro
                  </label>
                  <select
                    value={centerFilter}
                    onChange={e => setCenterFilter(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:border-teal-600"
                  >
                    <option value="ALL">Todos los Centros</option>
                    {(data.centers || []).map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Sala de interés
                  </label>
                  <select
                    value={roomFilter}
                    onChange={e => setRoomFilter(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:border-teal-600"
                  >
                    <option value="ALL">Todas las Salas</option>
                    {(data.rooms || []).map(r => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Buscador global */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar por nombre del contacto, correo, teléfono o nombre del bebé..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Embudo de Admisiones (Funnel Progression) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Embudo de Admisiones y Conversión
                </span>
                <span className="text-xs text-slate-400">
                  Tasa de conversión:{' '}
                  <strong className="text-emerald-700">
                    {filteredLeads.length > 0
                      ? `${Math.round(
                          (filteredLeads.filter(l => matchStage(l.stage, 'Fidelizado')).length /
                            filteredLeads.length) *
                            100
                        )}%`
                      : '0%'}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {STAGE_ORDER.map((stage, idx) => {
                  const count = filteredLeads.filter(l => matchStage(l.stage, stage.id)).length
                  return (
                    <div
                      key={stage.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                        <span className="text-[10px] font-bold text-slate-600 truncate">
                          {stage.label}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-black text-slate-800">{count}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {filteredLeads.length > 0
                            ? `${Math.round((count / filteredLeads.length) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tablero Kanban de 6 Columnas con Drag and Drop */}
            <div className="overflow-x-auto pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-w-[1100px]">
                {STAGE_ORDER.map(stage => {
                  const stageLeads = filteredLeads.filter(l => matchStage(l.stage, stage.id))
                  const isDragOver = dragOverStageId === stage.id
                  return (
                    <div
                      key={stage.id}
                      onDragOver={e => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        if (dragOverStageId !== stage.id) setDragOverStageId(stage.id)
                      }}
                      onDragLeave={e => {
                        if (e.currentTarget.contains(e.relatedTarget)) return
                        if (dragOverStageId === stage.id) setDragOverStageId(null)
                      }}
                      onDrop={e => {
                        e.preventDefault()
                        const droppedId = Number(e.dataTransfer.getData('text/plain')) || draggedLeadId
                        if (droppedId) {
                          handleDropLead(droppedId, stage.id)
                        }
                        setDragOverStageId(null)
                        setDraggedLeadId(null)
                      }}
                      className={`rounded-2xl border transition-all duration-150 p-3 min-h-[480px] flex flex-col ${
                        isDragOver
                          ? 'bg-teal-50/90 border-teal-400 ring-2 ring-teal-500 shadow-md'
                          : 'bg-slate-100/70 border-slate-200/80'
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 mb-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.color}`} />
                          <h3
                            className="text-[11px] font-bold text-slate-800 uppercase tracking-wide truncate"
                            title={stage.label}
                          >
                            {stage.label}
                          </h3>
                        </div>
                        <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200/80 shadow-xs shrink-0">
                          {stageLeads.length}
                        </span>
                      </div>

                      {/* Drop indicator banner */}
                      {isDragOver && (
                        <div className="mb-2 p-2 rounded-xl border-2 border-dashed border-teal-500 bg-teal-100/70 text-teal-900 text-[10px] font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
                          <span>Soltar aquí ({stage.label})</span>
                        </div>
                      )}

                      {/* Cards Container */}
                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {stageLeads.length === 0 ? (
                          <div
                            className={`h-32 flex items-center justify-center border-2 border-dashed rounded-xl text-[11px] transition ${
                              isDragOver
                                ? 'border-teal-400 bg-teal-50/50 text-teal-700 font-semibold'
                                : 'border-slate-200 text-slate-400'
                            }`}
                          >
                            {isDragOver ? 'Soltar aquí' : 'Sin prospectos'}
                          </div>
                        ) : (
                          stageLeads.map(lead => {
                            const isBeingDragged = draggedLeadId === lead.id
                            return (
                              <div
                                key={lead.id}
                                draggable={true}
                                onDragStart={e => {
                                  e.dataTransfer.setData('text/plain', String(lead.id))
                                  e.dataTransfer.effectAllowed = 'move'
                                  setDraggedLeadId(lead.id)
                                }}
                                onDragEnd={() => {
                                  setDraggedLeadId(null)
                                  setDragOverStageId(null)
                                }}
                                onClick={() => {
                                  setSelectedLead(lead)
                                  setDrawerOpen(true)
                                  setDrawerTab('resumen')
                                }}
                                className={`bg-white rounded-xl border p-3.5 shadow-xs transition-all space-y-2 select-none group ${
                                  isBeingDragged
                                    ? 'opacity-40 scale-95 border-teal-500 ring-2 ring-teal-400 shadow-lg'
                                    : 'border-slate-200/90 hover:border-teal-400 hover:shadow-md cursor-pointer'
                                }`}
                              >
                                {/* Fila 1: Nombre del prospecto + Icono para eliminar */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <h4
                                    className="text-xs font-bold text-slate-800 truncate flex-1"
                                    title={lead.parentName}
                                  >
                                    {lead.parentName}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation()
                                      handleDeleteLeadWithConfirm(lead)
                                    }}
                                    className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition shrink-0 opacity-70 group-hover:opacity-100"
                                    title="Eliminar prospecto"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                {/* Fila 2: Nombre del bebé */}
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                                  <Baby size={13} className="text-teal-600 shrink-0" />
                                  <span className="truncate font-medium" title={lead.childName}>
                                    {lead.childName}
                                  </span>
                                </div>

                                {/* Fila 3: Etiqueta de origen */}
                                <div className="pt-1 flex items-center justify-between">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSourceBadgeStyle(
                                      lead.source
                                    )}`}
                                  >
                                    {lead.source || 'Directo'}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LISTA DE ESPERA */}
        {activeTab === 'espera' && (
          <div className="space-y-6">
            {/* Waitlist Header Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Lista de Espera y Admisiones Pendientes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prospectos en etapa de confirmación o con prioridad para asignación de cupos vacantes en salas.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  Total en Lista de Espera
                </span>
                <span className="text-xl font-black text-amber-900">{waitlistLeads.length}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px] relative">
                <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  value={waitlistQ}
                  onChange={e => setWaitlistQ(e.target.value)}
                  placeholder="Buscar en lista de espera..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
              </div>

              <select
                value={waitlistCenter}
                onChange={e => setWaitlistCenter(e.target.value)}
                className="text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none"
              >
                <option value="ALL">Todos los Centros</option>
                {(data.centers || []).map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={waitlistRoom}
                onChange={e => setWaitlistRoom(e.target.value)}
                className="text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none"
              >
                <option value="ALL">Todas las Salas</option>
                {(data.rooms || []).map(r => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Waitlist Table / Cards */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {waitlistLeads.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <ListOrdered size={36} className="mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-semibold">No hay prospectos en lista de espera con los filtros seleccionados.</p>
                  <p className="text-[11px] text-slate-400">
                    Puedes mover cualquier prospecto a la etapa "Pendiente de confirmación" desde el tablero de Flujo.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {waitlistLeads.map((lead, idx) => {
                    // Real Room availability calculation
                    const targetRoomObj = (data.rooms || []).find(r => r.name === lead.targetRoom)
                    const enrolledInRoom = targetRoomObj ? targetRoomObj.enrolled || targetRoomObj.enrolledChildIds?.length || 0 : 0
                    const capacityOfRoom = targetRoomObj ? targetRoomObj.capacity : 10
                    const freeSpots = Math.max(0, capacityOfRoom - enrolledInRoom)
                    const hasSpotAvailable = freeSpots > 0

                    return (
                      <div
                        key={lead.id}
                        className="p-5 hover:bg-slate-50/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          {/* Priority index badge */}
                          <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-3 text-center min-w-[55px] shrink-0">
                            <span className="text-[9px] uppercase font-bold block text-amber-700">Fila</span>
                            <span className="text-lg font-black block leading-none">#{idx + 1}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-800">{lead.childName}</span>
                              {lead.age && (
                                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                                  {lead.age}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Registrado: {lead.registeredDate || 'Reciente'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <UserRound size={12} className="text-slate-400" />
                                <strong>Tutor:</strong> {lead.parentName}
                              </span>
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={12} className="text-slate-400" />
                                  {lead.phone}
                                </span>
                              )}
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail size={12} className="text-slate-400" />
                                  {lead.email}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                              <span className="flex items-center gap-1">
                                <DoorOpen size={12} className="text-teal-700" />
                                <strong>Sala solicitada:</strong> {lead.targetRoom || 'General'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 size={12} className="text-teal-700" />
                                {lead.centerName}
                              </span>
                            </div>

                            {/* Real availability indicator badge */}
                            <div className="pt-1.5 flex items-center gap-2">
                              {hasSpotAvailable ? (
                                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  {freeSpots} cupos libres actualmente en esta sala ({enrolledInRoom}/{capacityOfRoom})
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  Sala llena actualmente ({enrolledInRoom}/{capacityOfRoom})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions for waitlisted lead */}
                        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                          <button
                            onClick={() => enrollLead(lead)}
                            className="bg-emerald-600 hover:bg-emerald-700 transition text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                            title="Formalizar inscripción y asignar cupo definitivo"
                          >
                            <CheckCircle2 size={14} />
                            <span>Inscribir alumno</span>
                          </button>

                          <button
                            onClick={() => openScheduleClass(lead)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
                          >
                            Agendar muestra
                          </button>

                          <button
                            onClick={() => {
                              setSelectedLead(lead)
                              setDrawerOpen(true)
                              setDrawerTab('resumen')
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
                          >
                            Ver detalle
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CAPACIDAD */}
        {activeTab === 'capacidad' && (
          <div className="space-y-6">
            {/* Global Capacity KPI Cards (Calculated strictly from real room capacities and real enrolled children) */}
            {(() => {
              const totalCapacity = (data.rooms || []).reduce((acc, r) => acc + (r.capacity || 0), 0)
              // Real enrolled children from rooms / children
              const totalRealEnrolled = (data.rooms || []).reduce(
                (acc, r) => acc + (r.enrolled || r.enrolledChildIds?.length || 0),
                0
              )
              const totalAvailable = Math.max(0, totalCapacity - totalRealEnrolled)
              const globalOccupancyPct =
                totalCapacity > 0 ? Math.round((totalRealEnrolled / totalCapacity) * 100) : 0
              const totalWaitlisted = (data.leads || []).filter(l =>
                matchStage(l.stage, 'Pendiente de confirmación')
              ).length

              return (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      Capacidad Total
                    </span>
                    <span className="text-2xl font-black text-slate-800 mt-1 block">
                      {totalCapacity}
                    </span>
                    <span className="text-[10px] text-slate-400">Cupos instalados</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] text-teal-700 font-medium block">
                      Alumnos Matriculados
                    </span>
                    <span className="text-2xl font-black text-teal-900 mt-1 block">
                      {totalRealEnrolled}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Niños inscritos reales
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] text-blue-700 font-medium block">
                      Cupos Disponibles
                    </span>
                    <span className="text-2xl font-black text-blue-900 mt-1 block">
                      {totalAvailable}
                    </span>
                    <span className="text-[10px] text-blue-600">Vacantes libres</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] text-purple-700 font-medium block">
                      Ocupación General
                    </span>
                    <span className="text-2xl font-black text-purple-900 mt-1 block">
                      {globalOccupancyPct}%
                    </span>
                    <span className="text-[10px] text-purple-600">Eficiencia de espacio</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] text-amber-700 font-medium block">
                      Demanda en Espera
                    </span>
                    <span className="text-2xl font-black text-amber-900 mt-1 block">
                      {totalWaitlisted}
                    </span>
                    <span className="text-[10px] text-amber-700">Familias en lista</span>
                  </div>
                </div>
              )
            })()}

            {/* Detailed Capacity Breakdown by Room */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(data.rooms || []).map(room => {
                const enrolledCount = room.enrolled || room.enrolledChildIds?.length || 0
                const availableSpots = Math.max(0, room.capacity - enrolledCount)
                const occPercent = Math.min(100, Math.round((enrolledCount / room.capacity) * 100))

                // Real enrolled children list for this room
                const enrolledChildren = (data.children || []).filter(
                  c => c.roomName === room.name && !c.archived
                )

                // Demand from leads for this room
                const waitlistedForRoom = (data.leads || []).filter(
                  l =>
                    (l.targetRoom === room.name || l.targetRoom === room.id) &&
                    matchStage(l.stage, 'Pendiente de confirmación')
                )
                const activeLeadsForRoom = (data.leads || []).filter(
                  l =>
                    (l.targetRoom === room.name || l.targetRoom === room.id) &&
                    !['Fidelizado', 'Perdido'].includes(normalizeStage(l.stage))
                )

                // Calendar activities in this room
                const roomEvents = (data.calendarEvents || []).filter(
                  e => e.roomName === room.name || String(e.roomId) === String(room.id)
                )

                return (
                  <div
                    key={room.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Room Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">{room.name}</h3>
                          <span className="text-[11px] text-teal-700 font-semibold block mt-0.5">
                            {room.ageGroup || 'Sin rango'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            availableSpots > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {availableSpots > 0 ? `${availableSpots} libres` : 'Lleno'}
                        </span>
                      </div>

                      {/* Occupancy Progress Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700">Ocupación real</span>
                          <span className="font-bold text-slate-800">
                            {enrolledCount} / {room.capacity} ({occPercent}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              occPercent >= 90
                                ? 'bg-rose-500'
                                : occPercent >= 70
                                ? 'bg-amber-500'
                                : 'bg-teal-600'
                            }`}
                            style={{ width: `${occPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Ratio: {room.ratio || '1:5'}</span>
                          <span>
                            Staff:{' '}
                            {(room.staffIds || [])
                              .map(id => data.staff?.find(s => s.id === id)?.name)
                              .filter(Boolean)
                              .join(', ') || 'Sin asignar'}
                          </span>
                        </div>
                      </div>

                      {/* Section: Alumnos Inscritos Reales */}
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                          <span>Alumnos Inscritos ({enrolledChildren.length})</span>
                          <span className="text-teal-700 font-semibold">Matrícula real</span>
                        </div>

                        {enrolledChildren.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-1">
                            Sin alumnos asignados en lista escolar.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                            {enrolledChildren.map(c => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100"
                              >
                                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                                  <Baby size={12} className="text-teal-700" />
                                  {c.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Tutor: {c.parentName}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section: Demanda de Prospectos en CRM */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                          Demanda en CRM
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-amber-50/70 border border-amber-100 p-2 rounded-xl">
                            <span className="text-[10px] text-amber-700 font-bold block">
                              En lista de espera
                            </span>
                            <span className="text-base font-black text-amber-900 block">
                              {waitlistedForRoom.length}
                            </span>
                          </div>
                          <div className="bg-blue-50/70 border border-blue-100 p-2 rounded-xl">
                            <span className="text-[10px] text-blue-700 font-bold block">
                              Total prospectos
                            </span>
                            <span className="text-base font-black text-blue-900 block">
                              {activeLeadsForRoom.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section: Calendario de Sesiones */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>Actividades Programadas ({roomEvents.length})</span>
                        </div>
                        {roomEvents.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">
                            Sin eventos agendados este mes.
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {roomEvents.slice(0, 2).map(ev => (
                              <div
                                key={ev.id}
                                className="text-[10px] bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex justify-between items-center text-slate-600"
                              >
                                <span className="font-semibold truncate mr-2">{ev.title}</span>
                                <span className="text-slate-400 shrink-0">
                                  {ev.date.slice(5)} {ev.startTime}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action for Room */}
                    {availableSpots > 0 && waitlistedForRoom.length > 0 && (
                      <button
                        onClick={() => {
                          setWaitlistRoom(room.name)
                          setActiveTab('espera')
                        }}
                        className="w-full mt-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <UserPlus size={14} />
                        <span>Asignar cupo a lista de espera</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* MODAL: AGREGAR LEAD */}
        <Modal open={addModal} onClose={() => setAddModal(false)} title="Agregar lead" width="max-w-2xl">
          <div className="space-y-5">
            {/* Responsable */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <UserRound size={14} className="text-teal-700" />
                <span>Datos del Responsable</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Nombre <span className="text-rose-500">*</span>
                  <input
                    type="text"
                    value={form.parentFirstName}
                    onChange={e => setForm({ ...form, parentFirstName: e.target.value })}
                    placeholder="Ej. Mariana"
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Primer apellido
                  <input
                    type="text"
                    value={form.parentLastName1}
                    onChange={e => setForm({ ...form, parentLastName1: e.target.value })}
                    placeholder="Ej. López"
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Segundo apellido
                  <input
                    type="text"
                    value={form.parentLastName2}
                    onChange={e => setForm({ ...form, parentLastName2: e.target.value })}
                    placeholder="Ej. Morales"
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </label>
              </div>
            </div>

            {/* Niño */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <Baby size={14} className="text-teal-700" />
                <span>Datos del Bebé / Niño</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Nombre <span className="text-rose-500">*</span>
                  <input
                    type="text"
                    value={form.childFirstName}
                    onChange={e => setForm({ ...form, childFirstName: e.target.value })}
                    placeholder="Ej. Mateo"
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Primer apellido
                  <input
                    type="text"
                    value={form.childLastName1}
                    onChange={e => setForm({ ...form, childLastName1: e.target.value })}
                    placeholder="Ej. López"
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Segundo apellido
                  <input
                    type="text"
                    value={form.childLastName2}
                    onChange={e => setForm({ ...form, childLastName2: e.target.value })}
                    placeholder="Ej. Morales"
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Edad estimada
                  <input
                    type="text"
                    value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value })}
                    placeholder="Ej. 6 meses"
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Fecha de nacimiento
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => setForm({ ...form, dob: e.target.value })}
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Género
                  <select
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Contacto & Clasificación */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Teléfono
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="Ej. 55 9988 7766"
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Correo electrónico
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="Ej. contacto@gmail.com"
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Centro / Sede
                  <select
                    value={form.centerName}
                    onChange={e => setForm({ ...form, centerName: e.target.value })}
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                  >
                    {(data.centers || []).map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Sala de interés
                  <select
                    value={form.targetRoom}
                    onChange={e => setForm({ ...form, targetRoom: e.target.value })}
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                  >
                    {(data.rooms || []).map(r => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({r.ageGroup})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Etapa inicial
                  <select
                    value={form.stage}
                    onChange={e => setForm({ ...form, stage: e.target.value })}
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                  >
                    {STAGE_ORDER.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Especialista asignado
                  <select
                    value={form.assignedTo}
                    onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                  >
                    {(data.staff || []).map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Canal de origen
                  <select
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Recomendación">Recomendación</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Paseo / Fachada">Paseo / Fachada</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700 pt-1">
                Notas y observaciones
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Detalles sobre el interés de los padres, disponibilidad o historial..."
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 resize-none"
                />
              </label>
            </div>

            <button
              onClick={saveNewLead}
              className="w-full bg-teal-700 hover:bg-teal-800 transition-colors text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm"
            >
              Guardar lead
            </button>
          </div>
        </Modal>

        {/* SIDEBAR DERECHO DE DETALLE DEL PROSPECTO (RESUMEN Y ACTIVIDAD) */}
        {drawerOpen && selectedLead && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[540px] bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out ${
            drawerOpen && selectedLead ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
        >
          {selectedLead && (
            <>
              {/* Header del Sidebar */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-2 bg-teal-100 text-teal-800 rounded-xl shrink-0">
                    <Baby size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-800 truncate" title={selectedLead.childName}>
                      {selectedLead.childName}
                    </h2>
                    <p className="text-xs text-slate-500 truncate">
                      Prospecto: <strong className="text-slate-700">{selectedLead.parentName}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition shrink-0"
                  title="Cerrar panel lateral"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Selector de pestañas: Resumen vs Actividad */}
              <div className="flex border-b border-slate-200 px-5 pt-2 bg-white gap-4 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setDrawerTab('resumen')}
                  className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
                    drawerTab === 'resumen'
                      ? 'border-teal-700 text-teal-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText size={14} />
                  <span>Resumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('actividad')}
                  className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
                    drawerTab === 'actividad'
                      ? 'border-teal-700 text-teal-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock size={14} />
                  <span>Actividad</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-600 font-bold">
                    {(selectedLead.activities || []).length}
                  </span>
                </button>
              </div>

              {/* Contenido del Sidebar */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {drawerTab === 'resumen' ? (
                  /* SECCIÓN 1: RESUMEN (Datos completos del prospecto, bebé, contacto, servicio y etapa) */
                  <div className="space-y-4">
                    {/* Estado actual & Selector de Etapa */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Etapa actual</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              STAGE_ORDER.find(s => matchStage(selectedLead.stage, s.id))?.color || 'bg-slate-400'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-800">
                            {STAGE_ORDER.find(s => matchStage(selectedLead.stage, s.id))?.label || selectedLead.stage}
                          </span>
                        </div>
                      </div>

                      <select
                        value={normalizeStage(selectedLead.stage)}
                        onChange={e => {
                          moveLeadStage(selectedLead.id, e.target.value)
                          setSelectedLead({ ...selectedLead, stage: e.target.value })
                        }}
                        className="text-xs font-semibold p-2 border border-slate-200 rounded-xl bg-white text-slate-700 outline-none focus:border-teal-600"
                      >
                        {STAGE_ORDER.map(s => (
                          <option key={s.id} value={s.id}>
                            Cambiar a: {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Datos del Prospecto (Contacto / Tutor) */}
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
                      <div className="text-[11px] uppercase font-bold text-teal-800 tracking-wider flex items-center gap-1.5">
                        <UserRound size={13} />
                        <span>Datos del Prospecto / Tutor</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Nombre del contacto</span>
                          <span className="font-semibold text-slate-800">{selectedLead.parentName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Teléfono</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={`tel:${selectedLead.phone}`}
                              className="font-semibold text-teal-700 hover:underline flex items-center gap-1"
                            >
                              <Phone size={12} /> {selectedLead.phone || 'Sin registrar'}
                            </a>
                            {selectedLead.phone && (
                              <a
                                href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold hover:bg-emerald-100"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 block text-[10px]">Correo electrónico</span>
                          {selectedLead.email ? (
                            <a
                              href={`mailto:${selectedLead.email}`}
                              className="font-semibold text-teal-700 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Mail size={12} /> {selectedLead.email}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No registrado</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Datos del Bebé */}
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
                      <div className="text-[11px] uppercase font-bold text-teal-800 tracking-wider flex items-center gap-1.5">
                        <Baby size={13} />
                        <span>Datos del Bebé</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Nombre del bebé</span>
                          <span className="font-semibold text-slate-800">{selectedLead.childName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Edad</span>
                          <span className="font-semibold text-slate-800">{selectedLead.age || 'No especificada'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Fecha de nacimiento</span>
                          <span className="font-semibold text-slate-800">{selectedLead.dob || 'No registrada'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Género</span>
                          <span className="font-semibold text-slate-800">{selectedLead.gender || 'No especificado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Servicio, Centro y Contacto */}
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
                      <div className="text-[11px] uppercase font-bold text-teal-800 tracking-wider flex items-center gap-1.5">
                        <Building2 size={13} />
                        <span>Servicio, Centro y Captación</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Centro / Sede</span>
                          <span className="font-semibold text-slate-800">{selectedLead.centerName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Sala de interés</span>
                          <span className="font-semibold text-slate-800">{selectedLead.targetRoom}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Canal de origen</span>
                          <span className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSourceBadgeStyle(selectedLead.source)}`}>
                            {selectedLead.source || 'Directo'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Especialista asignado</span>
                          <span className="font-semibold text-slate-800">{selectedLead.assignedTo || 'Sin asignar'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones principales */}
                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => openScheduleClass(selectedLead)}
                        className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <CalendarDays size={14} />
                        <span>Agendar Clase Muestra en Calendarios</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => enrollLead(selectedLead)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <CheckCircle2 size={14} />
                        <span>Formalizar Inscripción de Alumno</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLeadWithConfirm(selectedLead)}
                        className="w-full border border-rose-200 text-rose-600 hover:bg-rose-50 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <Trash2 size={14} />
                        <span>Eliminar prospecto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* SECCIÓN 2: ACTIVIDAD (Historial de interacciones) */
                  <div className="space-y-4">
                    {/* Input para nueva interacción */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                        Registrar nueva interacción
                      </label>
                      <textarea
                        rows={2}
                        value={newActivityNote}
                        onChange={e => setNewActivityNote(e.target.value)}
                        placeholder="Escribe detalles de llamada, mensaje de WhatsApp, visita presencial o acuerdo..."
                        className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-teal-600 bg-white resize-none"
                      />
                      <button
                        type="button"
                        onClick={addActivityNote}
                        className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold py-2 rounded-xl transition"
                      >
                        Guardar interacción
                      </button>
                    </div>

                    {/* Timeline de interacciones */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Historial cronológico ({selectedLead.activities?.length || 0})
                      </div>

                      {(selectedLead.activities || []).length === 0 ? (
                        <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl space-y-1">
                          <Clock size={24} className="mx-auto text-slate-300 stroke-1" />
                          <p className="text-xs font-medium">Sin interacciones registradas aún.</p>
                          <p className="text-[10px] text-slate-400">
                            Utiliza la caja de arriba para registrar llamadas, citas o mensajes.
                          </p>
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {(selectedLead.activities || [])
                            .slice()
                            .reverse()
                            .map((act, idx) => (
                              <div key={act.id || idx} className="relative group">
                                <span className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-semibold text-teal-800">Interacción</span>
                                    <span className="text-slate-400">{act.date || 'Reciente'}</span>
                                  </div>
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{act.text}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* MODAL: AGENDAR CLASE MUESTRA EN CALENDARIOS */}
        <Modal
          open={scheduleModal && !!selectedLead}
          onClose={() => setScheduleModal(false)}
          title={`Agendar Clase Muestra · ${selectedLead?.childName || ''}`}
          width="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Esta cita se registrará automáticamente en el módulo de <strong>Calendarios</strong> y avanzará la etapa del prospecto a "Agenda Clase Muestra".
            </p>

            <label className="block text-xs font-semibold text-slate-700">
              Título
              <input
                type="text"
                value={scheduleForm.title}
                onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-700">
                Fecha
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Hora
                <input
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-700">
                Sala
                <select
                  value={scheduleForm.roomName}
                  onChange={e => {
                    const r = data.rooms?.find(x => x.name === e.target.value)
                    setScheduleForm({
                      ...scheduleForm,
                      roomName: e.target.value,
                      roomId: r?.id || 1
                    })
                  }}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                >
                  {(data.rooms || []).map(r => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Instructor
                <select
                  value={scheduleForm.instructor}
                  onChange={e => setScheduleForm({ ...scheduleForm, instructor: e.target.value })}
                  className="mt-1 w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600 bg-white"
                >
                  {(data.staff || []).map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              onClick={saveScheduledClass}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition"
            >
              Confirmar y sincronizar con Calendario
            </button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
