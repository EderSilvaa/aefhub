import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Heart, Users, DollarSign, FolderOpen, HandHeart,
  TrendingUp, TrendingDown, ArrowRight, AlertCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'

const donationsData = [
  { mes: 'Out', valor: 8400 },
  { mes: 'Nov', valor: 11200 },
  { mes: 'Dez', valor: 15800 },
  { mes: 'Jan', valor: 9600 },
  { mes: 'Fev', valor: 13200 },
  { mes: 'Mar', valor: 17500 },
  { mes: 'Abr', valor: 14800 },
]

const expenseData = [
  { mes: 'Out', receita: 8400, despesa: 5200 },
  { mes: 'Nov', receita: 11200, despesa: 6800 },
  { mes: 'Dez', receita: 15800, despesa: 9100 },
  { mes: 'Jan', receita: 9600, despesa: 7200 },
  { mes: 'Fev', receita: 13200, despesa: 8400 },
  { mes: 'Mar', receita: 17500, despesa: 10200 },
  { mes: 'Abr', receita: 14800, despesa: 9600 },
]

const pieData = [
  { name: 'Alimentação', value: 35 },
  { name: 'Educação', value: 28 },
  { name: 'Saúde', value: 20 },
  { name: 'Cultura', value: 10 },
  { name: 'Infraestrutura', value: 7 },
]

const COLORS = ['#d70d16', '#1e3a5f', '#fbbf24', '#34d399', '#a78bfa']

const recentDonations = [
  { nome: 'Maria Santos', valor: 250, data: '14/04/2026', tipo: 'PIX', status: 'confirmado' },
  { nome: 'João Pereira', valor: 100, data: '13/04/2026', tipo: 'Cartão', status: 'confirmado' },
  { nome: 'Empresa XYZ', valor: 2000, data: '12/04/2026', tipo: 'Transferência', status: 'confirmado' },
  { nome: 'Ana Costa', valor: 50, data: '12/04/2026', tipo: 'PIX', status: 'pendente' },
  { nome: 'Carlos Lima', valor: 500, data: '11/04/2026', tipo: 'Boleto', status: 'confirmado' },
]

const alerts = [
  { msg: '3 projetos com prazo próximo', tipo: 'warning' },
  { msg: 'Meta mensal atingida em 92%', tipo: 'info' },
  { msg: 'Novo voluntário aguardando aprovação', tipo: 'info' },
]

function StatCard({ icon: Icon, label, value, change, positive, color, link }) {
  return (
    <Link to={link} className="stat-card group">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {change && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{change} vs mês anterior</span>
          </div>
        )}
      </div>
    </Link>
  )
}

const fmt = (v) => `R$ ${v.toLocaleString('pt-BR')}`

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              ${a.tipo === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <AlertCircle size={14} />
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Doações este mês" value="R$ 14.800" change="+12%" positive color="bg-brand-500" link="/doacoes" />
        <StatCard icon={Users} label="Voluntários ativos" value="84" change="+5" positive color="bg-navy-700" link="/voluntarios" />
        <StatCard icon={HandHeart} label="Beneficiários" value="1.240" change="+38" positive color="bg-emerald-500" link="/beneficiarios" />
        <StatCard icon={FolderOpen} label="Projetos em andamento" value="12" change="-1" positive={false} color="bg-violet-500" link="/projetos" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donations area chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-800">Evolução das Doações</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 7 meses</p>
            </div>
            <Link to="/doacoes" className="text-brand-500 hover:text-brand-600 text-sm font-medium flex items-center gap-1">
              Ver tudo <ArrowRight size={14} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={donationsData}>
              <defs>
                <linearGradient id="colorDoacoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d70d16" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#d70d16" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
              <Tooltip formatter={(v) => [fmt(v), 'Doações']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="valor" stroke="#d70d16" strokeWidth={2.5} fill="url(#colorDoacoes)" dot={{ fill: '#d70d16', r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <div className="mb-5">
            <h2 className="font-bold text-gray-800">Distribuição de Gastos</h2>
            <p className="text-xs text-gray-400 mt-0.5">Por área de atuação</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart receita vs despesa */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-800">Receitas vs Despesas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Comparativo mensal</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expenseData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
              <Tooltip formatter={(v) => [fmt(v)]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend formatter={(v) => v === 'receita' ? 'Receita' : 'Despesa'} />
              <Bar dataKey="receita" fill="#d70d16" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesa" fill="#243b53" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent donations table */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-800">Últimas Doações</h2>
              <p className="text-xs text-gray-400 mt-0.5">Transações recentes</p>
            </div>
            <Link to="/doacoes" className="text-brand-500 hover:text-brand-600 text-sm font-medium flex items-center gap-1">
              Ver tudo <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-1">
            {recentDonations.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-sm font-bold">
                    {d.nome[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{d.nome}</p>
                    <p className="text-xs text-gray-400">{d.data} · {d.tipo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">R$ {d.valor.toLocaleString('pt-BR')}</p>
                  <span className={`badge ${d.status === 'confirmado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
