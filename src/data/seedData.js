export const seedData = {
  centers: [{ id: 1, name: 'Namii Del Valle', location: 'Av. Universidad 1200', rooms: 3, staff: 4, enrolled: 18, capacity: 30, status: 'Active' }],
  rooms: [
    { id: 1, name: 'Orugas (Estimulación Inicial)', ageGroup: '0-6 meses', capacity: 10, enrolled: 6, ratio: '1:4', staffIds: [2], enrolledChildIds: [201] },
    { id: 2, name: 'Gateadores (Movimiento)', ageGroup: '7-12 meses', capacity: 10, enrolled: 7, ratio: '1:5', staffIds: [], enrolledChildIds: [] },
    { id: 3, name: 'Experiencia conecta', ageGroup: '13-24 meses', capacity: 10, enrolled: 5, ratio: '1:5', staffIds: [], enrolledChildIds: [202] }
  ],
  families: [
    { id: 101, parentName: 'Ana', phone: '5512345678', centerName: 'Namii Del Valle', registeredDate: '2026-10-01', status: 'Active', membersCount: 0 },
    { id: 102, parentName: 'Andrea', phone: '5587654321', centerName: 'Namii Del Valle', registeredDate: '2026-10-02', status: 'Active', membersCount: 0 }
  ],
  children: [
    { id: 201, familyId: 101, name: 'Hector', parentName: 'Ana', phone: '5512345678', gender: 'Masculino', dob: '2026-09-01', age: '1', centerName: 'Namii Del Valle', roomName: 'Not enrolled', status: 'Inscrito', archived: false },
    { id: 202, familyId: 102, name: 'Hector', parentName: 'Andrea', phone: '5587654321', gender: 'Masculino', dob: '2025-05-01', age: '17', centerName: 'Namii Del Valle', roomName: 'Experiencia conecta', status: 'Inscrito', archived: false }
  ],
  staff: [
    { id: 1, name: 'Erick Monserrat', role: 'Director', initials: 'EM', shift: 'Matutino', hours: 160 },
    { id: 2, name: 'Sofía Ramírez', role: 'Especialista Sensorial', initials: 'SR', shift: 'Matutino', hours: 140 }
  ],
  leads: [
    { id: 1, parentName: 'Mariana López', childName: 'Mateo', phone: '5599887766', gender: 'Masculino', dob: '2026-02-10', age: '8', centerName: 'Namii Del Valle', source: 'Instagram', assignedTo: 'Erick Monserrat', stage: 'Consulta', targetRoom: 'Gateadores (Movimiento)', activities: [] },
    { id: 2, parentName: 'Carlos Ruiz', childName: 'Valentina', phone: '5544332211', gender: 'Femenino', dob: '2026-06-15', age: '4', centerName: 'Namii Del Valle', source: 'Recomendación', assignedTo: 'Sofía Ramírez', stage: 'Agenda Clase Muestra', targetRoom: 'Orugas (Estimulación Inicial)', activities: [] }
  ]
}

export const crmStages = [
  { id: 'Consulta', label: 'Consulta', color: 'bg-blue-500' },
  { id: 'Agenda Clase Muestra', label: 'Agenda Clase Muestra', color: 'bg-purple-500' },
  { id: 'Clase Muestra', label: 'Clase Muestra', color: 'bg-indigo-500' },
  { id: 'Lista de Espera', label: 'Pendiente de confirmación', color: 'bg-amber-600' },
  { id: 'Fidelizado', label: 'Fidelizado / Inscrito', color: 'bg-emerald-500' },
  { id: 'Perdido', label: 'Perdido', color: 'bg-rose-500' }
]
