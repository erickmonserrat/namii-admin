import { CheckCircle } from 'lucide-react'
export default function Toast({ message }) {
  if (!message) return null
  return <div className="fixed top-5 right-5 z-[70] bg-slate-800 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700"><CheckCircle className="w-4 h-4 text-emerald-400"/><span>{message}</span></div>
}
