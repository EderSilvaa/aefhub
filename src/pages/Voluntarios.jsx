import { useState } from 'react'
import { Users, Plus, Search, Star, Clock, MapPin, Phone } from 'lucide-react'

const volunteers = [
  { nome: 'Ana Paula Ferreira', cargo: 'Psicóloga', area: 'Saúde', horas: 48, status: 'ativo', desde: 'Jan 2024', telefone: '(11) 99999-0001', cidade: 'São Paulo' },
  { nome: 'Bruno Marques', cargo: 'Professor', area: 'Educação', horas: 120, status: 'ativo', desde: 'Mar 2023', telefone: '(11) 99999-0002', cidade: 'São Paulo' },
  { nome: 'Carla Nunes', cargo: 'Nutricionista', area: 'Alimentação', horas: 60, status: 'ativo', desde: 'Jun 2024', telefone: '(11) 99999-0003', cidade: 'Guarulhos' },
  { nome: 'Diego Santos', cargo: 'Designer', area: 'Marketing', horas: 35, status: 'ativo', desde: 'Nov 2024', telefone: '(11) 99999-0004', cidade: 'São Paulo' },
  { nome: 'Elaine Costa', cargo: 'Assistente Social', area: 'Social', horas: 95, status: 'ativo', desde: 'Feb 2023', telefone: '(11) 99999-0005', cidade: 'Osasco' },
  { nome: 'Felipe Rocha', cargo: 'Médico', area: 'Saúde', horas: 30, status: 'pendente', desde: 'Abr 2026', telefone: '(11) 99999-0006', cidade: 'São Paulo' },
  { nome: 'Gabriela Lima', cargo: 'Advogada', area: 'Jurídico', horas: 72, status: 'ativo', desde: 'Aug 2023', telefone: '(11) 99999-0007', cidade: 'São Paulo' },
  { nome: 'Hugo Alves', cargo: 'TI / Dev', area: 'Tecnologia', horas: 55, status: 'inativo', desde: 'Jan 2024', telefone: '(11) 99999-0008', cidade: 'São Paulo' },
]

const areaCores = {
  Saúde: 'bg-red-100 text-red-700',
  Educação: 'bg-blue-100 text-blue-700',
  Alimentação: 'bg-green-100 text-green-700',
  Marketing: 'bg-pink-100 text-pink-700',
  Social: 'bg-violet-100 text-violet-700',
  Jurídico: 'bg-amber-100 text-amber-700',
  Tecnologia: 'bg-cyan-100 text-cyan-700',
}

const statusBadge = {
  ativo: 'bg-emerald-100 text-emerald-700',
  pendente: 'bg-amber-100 text-amber-700',
  inativo: 'bg-gray-100 text-gray-500',
}

export default function Voluntarios() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  const filtered = volunteers.filter(v => {
    const matchSearch = v.nome.toLowerCase().includes(search.toLowerCase()) || v.cargo.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todos' || v.status === filterStatus
    return matchSearch && matchStatus
  })

  const ativos = volunteers.filter(v => v.status === 'ativo').length
  const totalHoras = volunteers.reduce((a, v) => a + v.horas, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-navy-700 flex items-center justify-center shrink-0"><Users size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total</p><p className="text-2xl font-bold text-gray-900">{volunteers.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0"><Star size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Ativos</p><p className="text-2xl font-bold text-gray-900">{ativos}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center shrink-0"><Clock size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Horas Totais</p><p className="text-2xl font-bold text-gray-900">{totalHoras}h</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center shrink-0"><Users size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Pendentes</p><p className="text-2xl font-bold text-gray-900">{volunteers.filter(v => v.status === 'pendente').length}</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-800">Voluntários</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} registros</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="text-sm bg-transparent outline-none text-gray-600 w-36" />
            </div>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
              {['todos', 'ativo', 'pendente', 'inativo'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 font-medium transition-colors capitalize ${filterStatus === s ? 'bg-brand-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn-primary"><Plus size={16} /> Novo Voluntário</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                    {v.nome[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{v.nome}</p>
                    <p className="text-xs text-gray-400">{v.cargo}</p>
                  </div>
                </div>
                <span className={`badge ${statusBadge[v.status]}`}>{v.status}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`badge ${areaCores[v.area] || 'bg-gray-100 text-gray-600'}`}>{v.area}</span>
                <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1"><Clock size={10} />{v.horas}h</span>
                <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1"><MapPin size={10} />{v.cidade}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Desde {v.desde}</span>
                <span className="flex items-center gap-1"><Phone size={10} />{v.telefone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
