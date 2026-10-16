import { useLocation } from 'react-router-dom'
import { Menu, Bell, Search, ChevronDown } from 'lucide-react'

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Visão geral da ONG' },
  '/financeiro': { title: 'Financeiro', subtitle: 'Controle de receitas e despesas' },
  '/doacoes': { title: 'Doações', subtitle: 'Gestão de doadores e doações' },
  '/marketing': { title: 'Marketing', subtitle: 'Campanhas e comunicação' },
  '/voluntarios': { title: 'Voluntários', subtitle: 'Gestão da equipe voluntária' },
  '/projetos': { title: 'Projetos', subtitle: 'Programas e iniciativas' },
  '/beneficiarios': { title: 'Beneficiários', subtitle: 'Pessoas atendidas pela ONG' },
  '/acoes': { title: 'Ações', subtitle: 'Quadro Kanban de ações e tarefas' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Preferências do sistema' },
}

export default function Header({ onToggleSidebar }) {
  const location = useLocation()
  const info = pageTitles[location.pathname] || { title: 'Amor em Foco', subtitle: '' }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1">
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{info.title}</h1>
        <p className="text-xs text-gray-400">{info.subtitle}</p>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-56">
        <Search size={15} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
        />
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"></span>
      </button>

      {/* Avatar */}
      <button className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors">
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
          A
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-800 leading-tight">Admin</p>
          <p className="text-xs text-gray-400 leading-tight">Coordenador</p>
        </div>
        <ChevronDown size={14} className="text-gray-400 hidden md:block" />
      </button>
    </header>
  )
}
