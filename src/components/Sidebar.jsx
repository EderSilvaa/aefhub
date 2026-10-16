import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  DollarSign,
  Heart,
  Megaphone,
  Users,
  FolderOpen,
  HandHeart,
  Settings,
  ChevronLeft,
  Kanban,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Financeiro', path: '/financeiro', icon: DollarSign },
  { label: 'Doações', path: '/doacoes', icon: Heart },
  { label: 'Marketing', path: '/marketing', icon: Megaphone },
  { label: 'Voluntários', path: '/voluntarios', icon: Users },
  { label: 'Projetos', path: '/projetos', icon: FolderOpen },
  { label: 'Beneficiários', path: '/beneficiarios', icon: HandHeart },
  { label: 'Ações', path: '/acoes', icon: Kanban },
]

export default function Sidebar({ open, setOpen }) {
  return (
    <aside
      className={`
        flex flex-col bg-navy-900 text-white transition-all duration-300 shrink-0
        ${open ? 'w-64' : 'w-20'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-navy-700">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg">
          <Heart size={18} className="text-white fill-white" />
        </div>
        {open && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm leading-tight text-white">Amor em Foco</p>
            <p className="text-xs text-navy-300 leading-tight">Central de Gestão</p>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className={`ml-auto p-1 rounded-lg hover:bg-navy-700 transition-colors ${!open && 'hidden'}`}
        >
          <ChevronLeft size={16} className="text-navy-300" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
              ${isActive
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-navy-300 hover:bg-navy-700 hover:text-white'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            {open && <span className="text-sm font-medium truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 pb-4 border-t border-navy-700 pt-4">
        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
            ${isActive
              ? 'bg-brand-500 text-white'
              : 'text-navy-300 hover:bg-navy-700 hover:text-white'
            }`
          }
        >
          <Settings size={20} className="shrink-0" />
          {open && <span className="text-sm font-medium">Configurações</span>}
        </NavLink>
      </div>
    </aside>
  )
}
