import { Settings, Bell, Shield, Palette, Building2, Save } from 'lucide-react'

export default function Configuracoes() {
  return (
    <div className="max-w-3xl space-y-6">
      {/* ONG Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
            <Building2 size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Dados da ONG</h2>
            <p className="text-xs text-gray-400">Informações institucionais</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Nome da ONG', value: 'Amor em Foco' },
            { label: 'CNPJ', value: '00.000.000/0001-00' },
            { label: 'E-mail', value: 'contato@amoremfoco.org' },
            { label: 'Telefone', value: '(11) 0000-0000' },
            { label: 'Cidade', value: 'São Paulo' },
            { label: 'Site', value: 'www.amoremfoco.org' },
          ].map((f, i) => (
            <div key={i}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
              <input
                defaultValue={f.value}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
          ))}
        </div>
        <button className="btn-primary mt-5"><Save size={16} /> Salvar Alterações</button>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Bell size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Notificações</h2>
            <p className="text-xs text-gray-400">Configure os alertas do sistema</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Nova doação recebida', desc: 'Alerta quando uma doação for confirmada' },
            { label: 'Novo voluntário cadastrado', desc: 'Notificação de novos voluntários aguardando aprovação' },
            { label: 'Prazo de projeto próximo', desc: 'Aviso 7 dias antes do término de um projeto' },
            { label: 'Relatório mensal', desc: 'Envio automático do resumo mensal por e-mail' },
          ].map((n, i) => (
            <div key={i} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{n.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-brand-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Shield size={18} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Segurança</h2>
            <p className="text-xs text-gray-400">Acesso e autenticação</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Senha Atual</label>
            <input type="password" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nova Senha</label>
              <input type="password" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirmar Senha</label>
              <input type="password" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
            </div>
          </div>
          <button className="btn-secondary"><Save size={16} /> Alterar Senha</button>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
            <Palette size={18} className="text-violet-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Aparência</h2>
            <p className="text-xs text-gray-400">Personalização visual</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cor Principal</p>
          <div className="flex gap-3">
            {['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#ef4444'].map(cor => (
              <button key={cor} className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform ring-2 ring-transparent hover:ring-gray-300"
                style={{ backgroundColor: cor }}></button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
