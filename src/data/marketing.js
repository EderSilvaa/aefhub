import { C } from "@/lib/theme";

// ─── APP ──────────────────────────────────────────────────────────────────────
// ─── MARKETING ───────────────────────────────────────────────────────────────
export const ACERVO_MOCK = [
  { id: 1, nome: "Café de Rua — Abril 2025", tipo: "foto", acao: "Café de Rua", data: "26/04/2025", url: "https://picsum.photos/seed/cafe1/400/300", tags: ["ação", "voluntários"] },
  { id: 2, nome: "Ação de Saúde Guamá", tipo: "foto", acao: "Saúde", data: "19/04/2025", url: "https://picsum.photos/seed/saude1/400/300", tags: ["saúde", "comunidade"] },
  { id: 3, nome: "Visita Orfanato", tipo: "foto", acao: "Orfanato", data: "12/04/2025", url: "https://picsum.photos/seed/orfanato1/400/300", tags: ["crianças", "social"] },
  { id: 4, nome: "Sopão da Noite", tipo: "foto", acao: "Sopão", data: "05/04/2025", url: "https://picsum.photos/seed/sopao1/400/300", tags: ["alimentação"] },
  { id: 5, nome: "Logo AEF Principal", tipo: "logo", acao: "—", data: "—", url: "https://picsum.photos/seed/logo1/400/300", tags: ["identidade"] },
  { id: 6, nome: "Banner Aniversário 10 Anos", tipo: "arte", acao: "—", data: "—", url: "https://picsum.photos/seed/banner1/400/300", tags: ["aniversário"] },
];

export const POSTS_MOCK = [
  { id: 1, legenda: "Mais um Café de Rua realizado com amor. Nossa equipe esteve presente servindo centenas de pessoas em situação de vulnerabilidade nas ruas de Belém.", acao: "Café de Rua", data: "26/04/2025", status: "rascunho", canal: "Instagram", responsavel: "Duda Martins" },
  { id: 2, legenda: "Ação de Saúde no Guamá: levamos atendimento médico gratuito para a comunidade. Porque saúde é direito de todos.", acao: "Saúde", data: "19/04/2025", status: "publicado", canal: "Instagram", responsavel: "Duda Martins" },
  { id: 3, legenda: "Abrimos maio com uma convocação especial para o Sopão da Noite. Precisamos de voluntários, parceiros e divulgação local.", acao: "Sopão da Noite", data: "25/08/2026", status: "agendado", canal: "WhatsApp", responsavel: "Flávia Moraes", scheduledDate: "2026-08-25", scheduledTime: "09:00" },
  { id: 4, legenda: "Bastidores da preparação do Inverno Solidário e chamada para novas doações.", acao: "Inverno Solidário", data: "27/08/2026", status: "agendado", canal: "Instagram", responsavel: "Duda Martins", scheduledDate: "2026-08-27", scheduledTime: "18:30" },
  { id: 5, legenda: "Transparência também é cuidado: confira os principais números do semestre.", acao: "Prestação de Contas", data: "29/08/2026", status: "agendado", canal: "LinkedIn", responsavel: "Camila Rocha", scheduledDate: "2026-08-29", scheduledTime: "10:00" },
];

export const MARKETING_CAMPAIGNS_SEED = [
  { id: 1, nome: "Inverno Solidário", objetivo: "Arrecadar agasalhos e ampliar captação recorrente", canal: "Multi-canal", inicio: "2026-08-18", fim: "2026-09-12", status: "ativa", responsavel: "Duda Martins", meta: "120 doações", progresso: 68, deliverables: 7 },
  { id: 2, nome: "Voluntariado Setembro", objetivo: "Atrair novos voluntários para operações de rua", canal: "Instagram", inicio: "2026-09-01", fim: "2026-09-20", status: "planejada", responsavel: "Eder Silva", meta: "35 inscrições", progresso: 18, deliverables: 5 },
  { id: 3, nome: "Prestação de Contas Semestral", objetivo: "Publicar transparência e reforçar credibilidade institucional", canal: "Site + E-mail", inicio: "2026-08-05", fim: "2026-08-25", status: "em_revisao", responsavel: "Camila Rocha", meta: "1 relatório público", progresso: 82, deliverables: 3 },
];

export const MARKETING_REQUESTS_SEED = [
  { id: 1, titulo: "Cobertura da ação no Guamá", solicitante: "Flávia Souza", setor: "Operações", formato: "Story + carrossel", prioridade: "alta", prazo: "2026-08-27", status: "brief_recebido", descricao: "Precisamos de story + carrossel com foco em impacto e chamada para próximas ações.", tempoSolicitacao: "há 20 min" },
  { id: 2, titulo: "Campanha de voluntariado feminino", solicitante: "Ingrid Lima", setor: "RH", formato: "Campanha", prioridade: "media", prazo: "2026-09-02", status: "em_producao", descricao: "Peças para Instagram e WhatsApp com foco em acolhimento e capacitação.", tempoSolicitacao: "há 2h", tempoAtualizacao: "há 35 min" },
  { id: 3, titulo: "Post de transparência financeira", solicitante: "Camila Rocha", setor: "Financeiro", formato: "Post estático", prioridade: "alta", prazo: "2026-08-29", status: "em_aprovacao", descricao: "Resumo visual do mês com números principais e destino dos recursos.", tempoSolicitacao: "ontem", tempoAtualizacao: "há 1h" },
];

export const MARKETING_STORAGE_KEYS = {
  acervo: "aef_marketing_acervo",
  posts: "aef_marketing_posts",
  campaigns: "aef_marketing_campaigns",
  requests: "aef_marketing_requests",
};

export const MARKETING_CAMPAIGN_STATUS = {
  planejada: { label: "Planejada", color: "#1D4ED8", bg: "rgba(29,78,216,0.10)" },
  ativa: { label: "Ativa", color: "#15803D", bg: "rgba(34,197,94,0.10)" },
  em_revisao: { label: "Em revisão", color: "#B45309", bg: "rgba(245,158,11,0.12)" },
  concluida: { label: "Concluída", color: C.textSecondary, bg: C.borderLight },
};

export const MARKETING_REQUEST_STATUS = {
  brief_recebido: { label: "Brief recebido", color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  em_producao: { label: "Em produção", color: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  em_aprovacao: { label: "Em aprovação", color: "#B45309", bg: "rgba(245,158,11,0.12)" },
  entregue: { label: "Entregue", color: "#15803D", bg: "rgba(34,197,94,0.10)" },
};

export const MARKETING_POST_STATUS = {
  rascunho: { label: "Rascunho", color: "#B45309", bg: "rgba(245,158,11,0.12)" },
  em_aprovacao: { label: "Em aprovação", color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  agendado: { label: "Agendado", color: "#1D4ED8", bg: "rgba(29,78,216,0.10)" },
  publicado: { label: "Publicado", color: "#15803D", bg: "rgba(34,197,94,0.10)" },
};

export function readMarketingStore(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export const marketingDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const marketingDateLabel = (dateKey) => {
  if (!dateKey) return "";
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("pt-BR");
};

export const googleCalendarUrl = (post) => {
  const start = new Date(`${post.scheduledDate}T${post.scheduledTime || "09:00"}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const stamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Postagem: ${post.acao}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: `${post.legenda || "Conteúdo programado pela equipe de Marketing"}\n\nCanal: ${post.canal}\nResponsável: ${post.responsavel}`,
    ctz: "America/Sao_Paulo",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
