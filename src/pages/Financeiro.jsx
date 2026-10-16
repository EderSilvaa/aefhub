import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react'

const monthlyData = [
  { mes: 'Out', receita: 8400, despesa: 5200 },
  { mes: 'Nov', receita: 11200, despesa: 6800 },
  { mes: 'Dez', receita: 15800, despesa: 9100 },
  { mes: 'Jan', receita: 9600, despesa: 7200 },
  { mes: 'Fev', receita: 13200, despesa: 8400 },
  { mes: 'Mar', receita: 17500, despesa: 10200 },
  { mes: 'Abr', receita: 14800, despesa: 9600 },
]

const transactions = [
  { desc: 'Doação — Empresa ABC', categoria: 'Doação Empresarial', data: '14/04/2026', valor: 5000, tipo: 'entrada' },
  { desc: 'Aluguel do espaço', categoria: 'Infraestrutura', data: '13/04/2026', valor: -1800, tipo: 'saida' },
  { desc: 'Doação — Maria Santos', categoria: 'Doação Individual', data: '12/04/2026', valor: 250, tipo: 'entrada' },
  { desc: 'Material escolar — Projeto Educar', categoria: 'Educação', data: '12/04/2026', valor: -1200, tipo: 'saida' },
  { desc: 'Patrocínio — Evento Solidário', categoria: 'Evento', data: '11/04/2026', valor: 3500, tipo: 'entrada' },
  { desc: 'Alimentação — Cesta básica', categoria: 'Alimentação', data: '10/04/2026', valor: -2400, tipo: 'saida' },
  { desc: 'Transferência — Fundo Municipal', categoria: 'Subvenção', data: '09/04/2026', valor: 8000, tipo: 'entrada' },
  { desc: 'Salários voluntários (bolsa)', categoria: 'Pessoal', data: '08/04/2026', valor: -3200, tipo: 'saida' },
]

const fmt = (v) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export default function Financeiro() {
  const [filter, setFilter] = useState('todos')

  const receita = transactions.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0)
  const despesa = transactions.filter(t => t.tipo === 'saida').reduce((a, t) => a + t.valor, 0)
  const saldo = receita + despesa

  const filtered = filter === 'todos' ? transactions : transactions.filter(t => t.tipo === filter)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <ArrowUpRight size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Receitas</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{fmt(receita)}</p>
            <p className="text-xs text-gray-400 mt-1">Abril 2026</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <ArrowDownRight size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Despesas</p>
            <p className="text-2xl font-bold text-red-500 mt-0.5">{fmt(despesa)}</p>
            <p className="text-xs text-gray-400 mt-1">Abril 2026</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
            <Wallet size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Saldo do Período</p>
            <p className={`text-2xl font-bold mt-0.5 ${saldo >= 0 ? 'text-brand-600' : 'text-red-500'}`}>{fmt(saldo)}</p>
            <p className="text-xs text-gray-400 mt-1">Abril 2026</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-800">Fluxo de Caixa</h2>
            <p className="text-xs text-gray-400 mt-0.5">Receitas e despesas mensais</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="rec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="des" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
            <Tooltip formatter={(v, n) => [fmt(v), n === 'receita' ? 'Receita' : 'Despesa']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} fill="url(#rec)" />
            <Area type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2} fill="url(#des)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-800">Lançamentos</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} registros</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
              {['todos', 'entrada', 'saida'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 font-medium transition-colors capitalize ${filter === f ? 'bg-brand-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {f === 'todos' ? 'Todos' : f === 'entrada' ? 'Entradas' : 'Saídas'}
                </button>
              ))}
            </div>
            <button className="btn-primary">
              <Plus size={16} /> Lançamento
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Descrição</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Categoria</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Data</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i} className="table-row border-b border-gray-50 last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${t.tipo === 'entrada' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {t.tipo === 'entrada'
                          ? <ArrowUpRight size={14} className="text-emerald-600" />
                          : <ArrowDownRight size={14} className="text-red-500" />}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{t.desc}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="badge bg-gray-100 text-gray-600">{t.categoria}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-500">{t.data}</td>
                  <td className={`py-3.5 text-right text-sm font-bold ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.tipo === 'entrada' ? '+' : '-'}{fmt(t.valor)}
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
