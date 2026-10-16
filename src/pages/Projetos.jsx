import { useState } from 'react'
import { FolderOpen, Plus, Users, Calendar, Target, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const projects = [
  {
    nome: 'Projeto Educar', area: 'Educação', status: 'em andamento',
    descricao: 'Aulas de reforço e alfabetização para crianças em situação de vulnerabilidade.',
    inicio: '01/01/2026', fim: '31/12/2026', orcamento: 25000, gasto: 12400,
    beneficiarios: 180, voluntarios: 12, progresso: 52,
  },
  {
    nome: 'Cesta Solidária', area: 'Alimentação', status: 'em andamento',
    descricao: 'Distribuição mensal de cestas básicas para famílias cadastradas.',
    inicio: '01/03/2026', fim: '30/06/2026', orcamento: 18000, gasto: 9600,
    beneficiarios: 350, voluntarios: 8, progresso: 53,
  },
  {
    nome: 'Saúde na Comunidade', area: 'Saúde', status: 'planejado',
    descricao: 'Mutirão de consultas médicas, odontológicas e psicológicas gratuitas.',
    inicio: '01/06/2026', fim: '30/06/2026', orcamento: 12000, gasto: 0,
    beneficiarios: 500, voluntarios: 20, progresso: 0,
  },
  {
    nome: 'Arte & Cultura', area: 'Cultura', status: 'em andamento',
    descricao: 'Oficinas de teatro, música e artes visuais para jovens de 12 a 18 anos.',
    inicio: '15/02/2026', fim: '15/11/2026', orcamento: 8000, gasto: 3200,
    beneficiarios: 90, voluntarios: 5, progresso: 40,
  },
  {
    nome: 'Inclusão Digital', area: 'Tecnologia', status: 'concluído',
    descricao: 'Curso de informática básica e acesso à internet para adultos.',
    inicio: '01/10/2025', fim: '28/02/2026', orcamento: 10000, gasto: 9800,
    beneficiarios: 120, voluntarios: 6, progresso: 100,
  },
]

const statusConfig = {
  'em andamento': { badge: 'bg-blue-100 text-blue-700', icon: Clock },
  planejado: { badge: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  concluído: { badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
}

const areaCores = {
  Educação: 'bg-blue-500',
  Alimentação: 'bg-green-500',
  Saúde: 'bg-red-500',
  Cultura: 'bg-violet-500',
  Tecnologia: 'bg-cyan-500',
}

export default function Projetos() {
  const [filter, setFilter] = useState('todos')

  const filtered = filter === 'todos' ? projects : projects.filter(p => p.status === filter)
  const emAndamento = projects.filter(p => p.status === 'em andamento').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-navy-700 flex items-center justify-center shrink-0"><FolderOpen size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Projetos</p><p className="text-2xl font-bold text-gray-900">{projects.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center shrink-0"><Clock size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Em Andamento</p><p className="text-2xl font-bold text-gray-900">{emAndamento}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center shrink-0"><Users size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Beneficiários</p><p className="text-2xl font-bold text-gray-900">{projects.reduce((a, p) => a + p.beneficiarios, 0).toLocaleString()}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0"><Target size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Orçamento Total</p><p className="text-2xl font-bold text-gray-900">R$ {(projects.reduce((a, p) => a + p.orcamento, 0) / 1000).toFixed(0)}k</p></div>
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm bg-white">
          {['todos', 'em andamento', 'planejado', 'concluído'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 font-medium transition-colors capitalize ${filter === f ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn-primary"><Plus size={16} /> Novo Projeto</button>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((p, i) => {
          const { badge, icon: StatusIcon } = statusConfig[p.status]
          const orcPct = Math.round((p.gasto / p.orcamento) * 100)
          return (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${areaCores[p.area] || 'bg-gray-400'} flex items-center justify-center shrink-0`}>
                    <FolderOpen size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{p.nome}</h3>
                    <p className="text-xs text-gray-400">{p.area}</p>
                  </div>
                </div>
                <span className={`badge ${badge} flex items-center gap-1`}>
                  <StatusIcon size={10} />{p.status}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{p.descricao}</p>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progresso geral</span><span>{p.progresso}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${p.progresso}%` }}></div>
                </div>
              </div>

              {/* Budget */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Orçamento utilizado</span>
                  <span>R$ {p.gasto.toLocaleString('pt-BR')} / R$ {p.orcamento.toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${orcPct > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${orcPct}%` }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3">
                <span className="flex items-center gap-1"><Users size={11} />{p.voluntarios} voluntários</span>
                <span className="flex items-center gap-1"><Users size={11} />{p.beneficiarios} beneficiários</span>
                <span className="flex items-center gap-1"><Calendar size={11} />{p.inicio} → {p.fim}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
