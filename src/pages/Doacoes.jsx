import { useState } from 'react'
import { Heart, Plus, Search, TrendingUp, Users, Target, Gift } from 'lucide-react'

const donors = [
  { nome: 'Maria Santos', email: 'maria@email.com', total: 1500, ultima: '14/04/2026', tipo: 'Recorrente', qtd: 12 },
  { nome: 'Empresa ABC', email: 'contato@abc.com.br', total: 15000, ultima: '12/04/2026', tipo: 'Empresarial', qtd: 6 },
  { nome: 'João Pereira', email: 'joao@email.com', total: 800, ultima: '13/04/2026', tipo: 'Esporádico', qtd: 4 },
  { nome: 'Ana Costa', email: 'ana@email.com', total: 600, ultima: '12/04/2026', tipo: 'Recorrente', qtd: 8 },
  { nome: 'Carlos Lima', email: 'carlos@email.com', total: 2500, ultima: '11/04/2026', tipo: 'Recorrente', qtd: 5 },
  { nome: 'Fundação Esperança', email: 'fundo@esper.org', total: 30000, ultima: '09/04/2026', tipo: 'Institucional', qtd: 3 },
  { nome: 'Pedro Oliveira', email: 'pedro@email.com', total: 350, ultima: '10/04/2026', tipo: 'Esporádico', qtd: 2 },
]

const tipoBadge = {
  Recorrente: 'bg-brand-100 text-brand-700',
  Empresarial: 'bg-blue-100 text-blue-700',
  Esporádico: 'bg-gray-100 text-gray-600',
  Institucional: 'bg-violet-100 text-violet-700',
}

const metaAnual = 200000
const arrecadado = 148650

export default function Doacoes() {
  const [search, setSearch] = useState('')

  const filtered = donors.filter(d =>
    d.nome.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  )

  const pct = Math.round((arrecadado / metaAnual) * 100)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Doadores Ativos</p>
            <p className="text-2xl font-bold text-gray-900">247</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Arrecadado (Ano)</p>
            <p className="text-2xl font-bold text-gray-900">R$ 148k</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-violet-500 flex items-center justify-center shrink-0">
            <Gift size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ticket Médio</p>
            <p className="text-2xl font-bold text-gray-900">R$ 602</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-navy-700 flex items-center justify-center shrink-0">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Novos (mês)</p>
            <p className="text-2xl font-bold text-gray-900">18</p>
          </div>
        </div>
      </div>

      {/* Meta anual */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-gray-800">Meta Anual de Arrecadação</h2>
            <p className="text-xs text-gray-400 mt-0.5">Acompanhamento do ano 2026</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-500">{pct}%</p>
            <p className="text-xs text-gray-400">da meta atingida</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>R$ {arrecadado.toLocaleString('pt-BR')} arrecadados</span>
          <span>Meta: R$ {metaAnual.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Donors table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-800">Doadores</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} registros</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar doador..."
                className="text-sm bg-transparent outline-none text-gray-600 w-40"
              />
            </div>
            <button className="btn-primary"><Plus size={16} /> Novo Doador</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Doador</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Tipo</th>
                <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Doações</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Última</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={i} className="table-row border-b border-gray-50 last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                        {d.nome[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{d.nome}</p>
                        <p className="text-xs text-gray-400">{d.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`badge ${tipoBadge[d.tipo]}`}>{d.tipo}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-center text-sm text-gray-600">{d.qtd}x</td>
                  <td className="py-3.5 pr-4 text-sm text-gray-500">{d.ultima}</td>
                  <td className="py-3.5 text-right text-sm font-bold text-gray-900">
                    R$ {d.total.toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
