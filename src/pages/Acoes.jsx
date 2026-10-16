import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  Plus, X, Calendar, User, Tag, AlertCircle,
  ChevronDown, MoreHorizontal, Zap, Clock, CheckCircle2, Archive
} from 'lucide-react'

// ─── dados iniciais ──────────────────────────────────────────────────────────
const initialColumns = {
  backlog: {
    id: 'backlog',
    title: 'Backlog',
    icon: Archive,
    color: 'bg-gray-400',
    cards: [
      {
        id: 'c1', title: 'Criar formulário de cadastro de beneficiários',
        desc: 'Formulário online para novos beneficiários se inscreverem via site.',
        priority: 'media', tag: 'Tecnologia', responsavel: 'Diego S.', prazo: '30/04/2026',
      },
      {
        id: 'c2', title: 'Planejar mutirão de limpeza no bairro Brasilândia',
        desc: 'Organizar equipes, materiais e comunicação com moradores.',
        priority: 'baixa', tag: 'Comunidade', responsavel: 'Elaine C.', prazo: '15/05/2026',
      },
    ],
  },
  afazer: {
    id: 'afazer',
    title: 'A Fazer',
    icon: AlertCircle,
    color: 'bg-blue-500',
    cards: [
      {
        id: 'c3', title: 'Enviar relatório de impacto para os parceiros',
        desc: 'PDF com dados de março/abril, fotos e depoimentos.',
        priority: 'alta', tag: 'Relatório', responsavel: 'Ana P.', prazo: '20/04/2026',
      },
      {
        id: 'c4', title: 'Confirmar local do evento de arrecadação',
        desc: 'Entrar em contato com 3 espaços e fechar contrato.',
        priority: 'alta', tag: 'Evento', responsavel: 'Gabriela L.', prazo: '18/04/2026',
      },
      {
        id: 'c5', title: 'Publicar post sobre Dia das Mães nas redes',
        desc: 'Criar arte e legenda para Instagram e Facebook.',
        priority: 'media', tag: 'Marketing', responsavel: 'Diego S.', prazo: '05/05/2026',
      },
    ],
  },
  andamento: {
    id: 'andamento',
    title: 'Em Andamento',
    icon: Clock,
    color: 'bg-brand-500',
    cards: [
      {
        id: 'c6', title: 'Distribuição de cestas básicas — Abril',
        desc: 'Separar, embalar e entregar 350 cestas para famílias cadastradas.',
        priority: 'alta', tag: 'Alimentação', responsavel: 'Bruno M.', prazo: '19/04/2026',
      },
      {
        id: 'c7', title: 'Aulas de reforço — semana 15',
        desc: 'Ministrar 8 turmas de reforço de matemática e português.',
        priority: 'media', tag: 'Educação', responsavel: 'Carla N.', prazo: '17/04/2026',
      },
      {
        id: 'c8', title: 'Atualizar site com fotos novas',
        desc: 'Upload das fotos da última ação no bairro Santa Mena.',
        priority: 'baixa', tag: 'Tecnologia', responsavel: 'Diego S.', prazo: '22/04/2026',
      },
    ],
  },
  revisao: {
    id: 'revisao',
    title: 'Em Revisão',
    icon: Zap,
    color: 'bg-amber-500',
    cards: [
      {
        id: 'c9', title: 'Campanha do Agasalho — arte gráfica',
        desc: 'Revisar layout final do banner e cards para aprovação.',
        priority: 'media', tag: 'Marketing', responsavel: 'Diego S.', prazo: '16/04/2026',
      },
    ],
  },
  concluido: {
    id: 'concluido',
    title: 'Concluído',
    icon: CheckCircle2,
    color: 'bg-emerald-500',
    cards: [
      {
        id: 'c10', title: 'Cadastro de novos voluntários — Março',
        desc: 'Revisar e aprovar 12 fichas de novos voluntários.',
        priority: 'media', tag: 'Voluntários', responsavel: 'Ana P.', prazo: '31/03/2026',
      },
      {
        id: 'c11', title: 'Prestação de contas T1 2026',
        desc: 'Planilha financeira e relatório do 1º trimestre entregues.',
        priority: 'alta', tag: 'Financeiro', responsavel: 'Gabriela L.', prazo: '05/04/2026',
      },
    ],
  },
}

const columnOrder = ['backlog', 'afazer', 'andamento', 'revisao', 'concluido']

// ─── helpers ─────────────────────────────────────────────────────────────────
const priorityConfig = {
  alta:  { label: 'Alta',  cls: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  media: { label: 'Média', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  baixa: { label: 'Baixa', cls: 'bg-gray-100 text-gray-500',  dot: 'bg-gray-400' },
}

const tagColors = {
  Tecnologia: 'bg-cyan-100 text-cyan-700',
  Comunidade: 'bg-green-100 text-green-700',
  Relatório:  'bg-violet-100 text-violet-700',
  Evento:     'bg-pink-100 text-pink-700',
  Marketing:  'bg-blue-100 text-blue-700',
  Alimentação:'bg-orange-100 text-orange-700',
  Educação:   'bg-indigo-100 text-indigo-700',
  Voluntários:'bg-teal-100 text-teal-700',
  Financeiro: 'bg-emerald-100 text-emerald-700',
}

function genId() { return 'c' + Math.random().toString(36).slice(2, 9) }

// ─── Modal de novo card ───────────────────────────────────────────────────────
function NewCardModal({ colId, onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', desc: '', priority: 'media', tag: 'Evento', responsavel: '', prazo: '' })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onAdd(colId, { ...form, id: genId() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Nova Ação</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Título *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="Ex: Organizar evento de arrecadação" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</label>
            <textarea value={form.desc} onChange={e => set('desc', e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none"
              rows={3} placeholder="Detalhes da ação..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridade</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</label>
              <select value={form.tag} onChange={e => set('tag', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
                {Object.keys(tagColors).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Responsável</label>
              <input value={form.responsavel} onChange={e => set('responsavel', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                placeholder="Nome" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prazo</label>
              <input value={form.prazo} onChange={e => set('prazo', e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                placeholder="DD/MM/AAAA" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Criar Ação</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function KanbanCard({ card, index, onDelete }) {
  const pri = priorityConfig[card.priority]
  const tagCls = tagColors[card.tag] || 'bg-gray-100 text-gray-600'

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3
            transition-shadow duration-150 select-none
            ${snapshot.isDragging ? 'shadow-xl border-brand-300 rotate-1' : 'hover:shadow-md'}
          `}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-gray-800 leading-snug flex-1">{card.title}</p>
            <button
              onClick={() => onDelete(card.id)}
              className="shrink-0 p-0.5 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Desc */}
          {card.desc && (
            <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{card.desc}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`badge text-xs ${tagCls}`}>
              <Tag size={9} className="mr-0.5" />{card.tag}
            </span>
            <span className={`badge text-xs ${pri.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pri.dot} mr-1`}></span>
              {pri.label}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
            {card.responsavel ? (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs">
                  {card.responsavel[0]}
                </div>
                <span>{card.responsavel}</span>
              </div>
            ) : <span />}
            {card.prazo && (
              <div className="flex items-center gap-1">
                <Calendar size={11} />{card.prazo}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}

// ─── Coluna ───────────────────────────────────────────────────────────────────
function KanbanColumn({ col, onAddCard, onDelete }) {
  const Icon = col.icon

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg ${col.color} flex items-center justify-center`}>
            <Icon size={13} className="text-white" />
          </div>
          <span className="font-bold text-gray-700 text-sm">{col.title}</span>
          <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
            {col.cards.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(col.id)}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-500 transition-colors"
          title="Adicionar ação"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Drop zone */}
      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 min-h-32 rounded-2xl p-2 transition-colors duration-150
              ${snapshot.isDraggingOver ? 'bg-brand-50 border-2 border-dashed border-brand-300' : 'bg-gray-50'}
            `}
          >
            {col.cards.map((card, i) => (
              <KanbanCard key={card.id} card={card} index={i} onDelete={(id) => onDelete(col.id, id)} />
            ))}
            {provided.placeholder}
            {col.cards.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                <Icon size={24} className="mb-2" />
                <p className="text-xs">Arraste cartões aqui</p>
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Add button at bottom */}
      <button
        onClick={() => onAddCard(col.id)}
        className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors w-full"
      >
        <Plus size={15} /> Adicionar ação
      </button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Acoes() {
  const [columns, setColumns] = useState(initialColumns)
  const [modal, setModal] = useState(null) // colId ou null

  // Drag end
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const srcCol = columns[source.droppableId]
    const dstCol = columns[destination.droppableId]
    const card = srcCol.cards.find(c => c.id === draggableId)

    const newSrcCards = srcCol.cards.filter(c => c.id !== draggableId)
    const newDstCards = [...dstCol.cards]
    newDstCards.splice(destination.index, 0, card)

    setColumns(prev => ({
      ...prev,
      [source.droppableId]: { ...srcCol, cards: newSrcCards },
      [destination.droppableId]: { ...dstCol, cards: newDstCards },
    }))
  }

  const handleAddCard = (colId, cardData) => {
    setColumns(prev => ({
      ...prev,
      [colId]: { ...prev[colId], cards: [...prev[colId].cards, cardData] },
    }))
  }

  const handleDeleteCard = (colId, cardId) => {
    setColumns(prev => ({
      ...prev,
      [colId]: { ...prev[colId], cards: prev[colId].cards.filter(c => c.id !== cardId) },
    }))
  }

  const total = columnOrder.reduce((a, id) => a + columns[id].cards.length, 0)
  const concluidas = columns.concluido.cards.length
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
        <div>
          <h2 className="font-bold text-gray-800">Quadro de Ações</h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} ações · {concluidas} concluídas ({pct}%)</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mini progress */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-28 bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }}></div>
            </div>
            <span className="text-xs text-gray-400">{pct}% concluído</span>
          </div>
          <button onClick={() => setModal('afazer')} className="btn-primary">
            <Plus size={16} /> Nova Ação
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-5 p-6 h-full min-w-max">
            {columnOrder.map(colId => (
              <KanbanColumn
                key={colId}
                col={columns[colId]}
                onAddCard={(id) => setModal(id)}
                onDelete={handleDeleteCard}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modal */}
      {modal && (
        <NewCardModal
          colId={modal}
          onClose={() => setModal(null)}
          onAdd={handleAddCard}
        />
      )}
    </div>
  )
}
