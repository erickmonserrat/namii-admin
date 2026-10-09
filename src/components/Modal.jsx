import { X } from 'lucide-react'
export default function Modal({ open, title, children, onClose, width='max-w-lg' }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm" onMouseDown={onClose}>
    <div className={`w-full ${width} max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200`} onMouseDown={e=>e.stopPropagation()}>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-800">{title}</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><X size={17}/></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
}
