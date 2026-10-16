import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Megaphone, Plus, Instagram, Facebook, Mail, Eye, Heart, Share2, MousePointerClick } from 'lucide-react'

const socialData = [
  { plat: 'Instagram', seguidores: 8420, crescimento: '+12%', alcance: '45k', engajamento: '4.2%', cor: '#E1306C' },
  { plat: 'Facebook', seguidores: 12300, crescimento: '+5%', alcance: '28k', engajamento: '2.8%', cor: '#1877F2' },
  { plat: 'E-mail', seguidores: 3200, crescimento: '+18%', alcance: '3.2k', engajamento: '32%', cor: '#d70d16' },
]

const campaigns = [
  { nome: 'Campanha do Agasalho 2026', status: 'ativa', canal: 'Instagram', alcance: '12.4k', conversoes: 234, inicio: '01/04/2026', fim: '30/06/2026' },
  { nome: 'Newsletter Abril', status: 'concluída', canal: 'E-mail', alcance: '3.1k', conversoes: 87, inicio: '01/04/2026', fim: '05/04/2026' },
  { nome: 'Dia das Crianças — Arrecadação', status: 'planejada', canal: 'Multi-canal', alcance: '—', conversoes: 0, inicio: '01/10/2026', fim: '12/10/2026' },
  { nome: 'Post Semanal — Impacto Social', status: 'ativa', canal: 'Facebook', alcance: '5.8k', conversoes: 42, inicio: '07/04/2026', fim: '30/04/2026' },
]

const engagementData = [
  { semana: 'S1', curtidas: 320, comentarios: 48, compartilhamentos: 92 },
  { semana: 'S2', curtidas: 410, comentarios: 62, compartilhamentos: 118 },
  { semana: 'S3', curtidas: 380, comentarios: 55, compartilhamentos: 105 },
  { semana: 'S4', curtidas: 520, comentarios: 78, compartilhamentos: 145 },
]

const statusBadge = {
  ativa: 'bg-emerald-100 text-emerald-700',
  concluída: 'bg-gray-100 text-gray-600',
  planejada: 'bg-blue-100 text-blue-700',
}

export default function Marketing() {
  return (
    <div className="space-y-6">
      {/* Social stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {socialData.map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: s.cor }}>
                {s.plat === 'Instagram' ? <Instagram size={20} /> : s.plat === 'Facebook' ? <Facebook size={20} /> : <Mail size={20} />}
              </div>
              <div>
                <p className="font-bold text-gray-800">{s.plat}</p>
                <p className="text-xs text-gray-400">{s.crescimento} este mês</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{s.seguidores.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-400">Seguidores</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{s.alcance}</p>
                <p className="text-xs text-gray-400">Alcance</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{s.engajamento}</p>
                <p className="text-xs text-gray-400">Engajamento</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-800">Engajamento Semanal</h2>
            <p className="text-xs text-gray-400 mt-0.5">Instagram — Abril 2026</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={engagementData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="semana" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="curtidas" name="Curtidas" fill="#d70d16" radius={[6, 6, 0, 0]} />
            <Bar dataKey="comentarios" name="Comentários" fill="#243b53" radius={[6, 6, 0, 0]} />
            <Bar dataKey="compartilhamentos" name="Compartilhamentos" fill="#fbbf24" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Campaigns */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-800">Campanhas</h2>
            <p className="text-xs text-gray-400 mt-0.5">{campaigns.length} campanhas cadastradas</p>
          </div>
          <button className="btn-primary"><Plus size={16} /> Nova Campanha</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Campanha</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Canal</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Status</th>
                <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Alcance</th>
                <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Conversões</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Período</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i} className="table-row border-b border-gray-50 last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <Megaphone size={16} className="text-brand-400 shrink-0" />
                      <span className="text-sm font-semibold text-gray-800">{c.nome}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{c.canal}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`badge ${statusBadge[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                      <Eye size={13} />{c.alcance}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold text-brand-600">
                      <MousePointerClick size={13} />{c.conversoes}
                    </div>
                  </td>
                  <td className="py-3.5 text-xs text-gray-500">{c.inicio} → {c.fim}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
