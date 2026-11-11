import { Button } from "@/components/ui/button"
import { Calendar, Users, Sparkles, CheckCircle } from "lucide-react"

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-md border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organiza+</h1>
            <p className="text-sm text-slate-500">Painel de Gestão da Administradora</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm border border-emerald-200">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Frontend configurado com sucesso: React + Vite + Tailwind CSS + shadcn/ui.</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Calendar className="w-5 h-5 text-blue-600 mb-2" />
              <h3 className="font-semibold text-sm">Agenda Inteligente</h3>
              <p className="text-xs text-slate-500 mt-1">Visões dia, semana e mês com prevenção de conflitos.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Users className="w-5 h-5 text-purple-600 mb-2" />
              <h3 className="font-semibold text-sm">Equipe & Clientes</h3>
              <p className="text-xs text-slate-500 mt-1">Gestão de diaristas, avaliações e histórico de atendimentos.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="default" className="flex-1">
            Acessar Painel
          </Button>
          <Button variant="outline">
            Documentação
          </Button>
        </div>
      </div>
    </div>
  )
}
