import { useState } from 'react'
import { HandHeart, Plus, Search, MapPin, Phone, Calendar, User } from 'lucide-react'

const beneficiaries = [
  { nome: 'Família Souza', responsavel: 'Joana Souza', membros: 5, cidade: 'São Paulo', bairro: 'Brasilândia', cadastro: '15/01/2025', projetos: ['Cesta Solidária', 'Projeto Educar'], telefone: '(11) 99999-1001', status: 'ativo' },
  { nome: 'Família Alves', responsavel: 'Roberto Alves', membros: 3, cidade: 'São Paulo', bairro: 'Capão Redondo', cadastro: '02/03/2025', projetos: ['Cesta Solidária'], telefone: '(11) 99999-1002', status: 'ativo' },
  { nome: 'Família Ferreira', responsavel: 'Sandra Ferreira', membros: 7, cidade: 'Guarulhos', bairro: 'Jardim Santa Mena', cadastro: '20/06/2024', projetos: ['Cesta Solidária', 'Saúde na Comunidade'], telefone: '(11) 99999-1003', status: 'ativo' },
  { nome: 'Lucas Martins', responsavel: 'Lucas Martins', membros: 1, cidade: 'São Paulo', bairro: 'Vila Prudente', cadastro: '10/09/2025', projetos: ['Projeto Educar', 'Arte & Cultura'], telefone: '(11) 99999-1004', status: 'ativo' },
  { nome: 'Família Pereira', responsavel: 'Márcia Pereira', membros: 4, cidade: 'Osasco', bairro: 'Presidente Altino', cadastro: '05/02/2026', projetos: ['Cesta Solidária'], telefone: '(11) 99999-1005', status: 'pendente' },
  { nome: 'Família Costa', responsavel: 'Antônio Costa', membros: 6, cidade: 'São Paulo', bairro: 'Itaquera', cadastro: '18/11/2024', projetos: ['Projeto Educar', 'Inclusão Digital'], telefone: '(11) 99999-1006', status: 'ativo' },
]

const projetoBadge = {
  'Cesta Solidária': 'bg-green-100 text-green-700',
  'Projeto Educar': 'bg-blue-100 text-blue-700',
  'Arte & Cultura': 'bg-violet-100 text-violet-700',
  'Saúde na Comunidade': 'bg-red-100 text-red-700',
  'Inclusão Digital': 'bg-cyan-100 text-cyan-700',
}

export default function Beneficiarios() {
  const [search, setSearch] = useState('')

  const filtered = beneficiaries.filter(b =>
    b.nome.toLowerCase().includes(search.toLowerCase()) ||
    b.responsavel.toLowerCase().includes(search.toLowerCase()) ||
    b.bairro.toLowerCase().includes(search.toLowerCase())
  )

  const totalPessoas = beneficiaries.reduce((a, b) => a + b.membros, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center shrink-0"><HandHeart size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Famílias/Indivíduos</p><p className="text-2xl font-bold text-gray-900">{beneficiaries.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0"><User size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Pessoas Atendidas</p><p className="text-2xl font-bold text-gray-900">{totalPessoas}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-navy-700 flex items-center justify-center shrink-0"><MapPin size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Municípios</p><p className="text-2xl font-bold text-gray-900">3</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center shrink-0"><HandHeart size={20} className="text-white" /></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Novos (2026)</p><p className="text-2xl font-bold text-gray-900">38</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-800">Beneficiários Cadastrados</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} registros</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="text-sm bg-transparent outline-none text-gray-600 w-40" />
            </div>
            <button className="btn-primary"><Plus size={16} /> Novo Beneficiário</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold shrink-0">
                    {b.nome[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{b.nome}</p>
                    <p className="text-xs text-gray-400">{b.membros} {b.membros === 1 ? 'pessoa' : 'pessoas'}</p>
                  </div>
                </div>
                <span className={`badge ${b.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                <MapPin size={11} />{b.bairro}, {b.cidade}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {b.projetos.map((proj, j) => (
                  <span key={j} className={`badge text-xs ${projetoBadge[proj] || 'bg-gray-100 text-gray-600'}`}>{proj}</span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-2">
                <span className="flex items-center gap-1"><Calendar size={10} />Desde {b.cadastro}</span>
                <span className="flex items-center gap-1"><Phone size={10} />{b.telefone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
