
// ─── RH ───────────────────────────────────────────────────────────────────────
export const volunteers = [
  { name: "Flávia Souza", area: "Operações", formation: "Administração", actions: 12, initials: "FS", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4501" },
  { name: "Alan Costa", area: "Logística", formation: "Engenharia Civil", actions: 8, initials: "AC", verified: false, novato: false, penalizado: false, telefone: "(91) 98123-4502" },
  { name: "Ingrid Lima", area: "Alimentação", formation: "Nutrição", actions: 15, initials: "IL", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4503" },
  { name: "Dr. Marcos Farias", area: "Saúde", formation: "Medicina", actions: 5, initials: "MF", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4504" },
  { name: "Dra. Ana Paula", area: "Saúde", formation: "Enfermagem", actions: 7, initials: "AP", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4505" },
  { name: "Dr. Rafael Nunes", area: "Jurídico", formation: "Direito", actions: 3, initials: "RN", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4506" },
  { name: "Beatriz Mendes", area: "Operações", formation: "Pedagogia", actions: 0, initials: "BM", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4507" },
  { name: "Carlos Henrique", area: "Logística", formation: "Logística", actions: 0, initials: "CH", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4508" },
  { name: "Daniela Pinto", area: "Alimentação", formation: "Gastronomia", actions: 1, initials: "DP", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4509" },
  { name: "Eduardo Lima", area: "Operações", formation: "Sistemas", actions: 0, initials: "EL", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4510" },
  { name: "Gabriela Reis", area: "Saúde", formation: "Psicologia", actions: 4, initials: "GR", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4511" },
  { name: "Henrique Vargas", area: "Operações", formation: "Educação Física", actions: 9, initials: "HV", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4512" },
  { name: "Isabela Costa", area: "Marketing", formation: "Publicidade", actions: 6, initials: "IC", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4513" },
  { name: "João Pedro Sá", area: "Logística", formation: "Administração", actions: 2, initials: "JS", verified: false, novato: false, penalizado: true, motivoPenalidade: "Faltou 2x sem aviso", telefone: "(91) 98123-4514" },
  { name: "Karina Brito", area: "Alimentação", formation: "Nutrição", actions: 11, initials: "KB", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4515" },
  { name: "Lucas Andrade", area: "Operações", formation: "Engenharia", actions: 0, initials: "LA", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4516" },
  { name: "Mariana Torres", area: "Marketing", formation: "Design", actions: 13, initials: "MT", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4517" },
  { name: "Natália Ferraz", area: "Saúde", formation: "Fisioterapia", actions: 5, initials: "NF", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4518" },
  { name: "Otávio Cunha", area: "Operações", formation: "TI", actions: 1, initials: "OC", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4519" },
  { name: "Patrícia Veloso", area: "Logística", formation: "Administração", actions: 7, initials: "PV", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4520" },
  { name: "Renato Maia", area: "Operações", formation: "Direito", actions: 3, initials: "RM", verified: false, novato: false, penalizado: true, motivoPenalidade: "Conduta inadequada na última ação", telefone: "(91) 98123-4521" },
  { name: "Sabrina Duarte", area: "Alimentação", formation: "Nutrição", actions: 0, initials: "SD", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4522" },
  { name: "Thiago Rocha", area: "Operações", formation: "Administração", actions: 8, initials: "TR", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4523" },
  { name: "Vivian Aguiar", area: "Marketing", formation: "Jornalismo", actions: 2, initials: "VA", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4524" },
];

export const RH_PARTNERS = [
  { id: 1, name: "Instituto Horizonte", segment: "Instituto", contribution: "Apoio institucional", partnerships: 6, since: "2022", lastAction: "Inverno Solidário", contact: "Marina Alves", phone: "(91) 98410-2201", initials: "IH", status: "recorrente" },
  { id: 2, name: "Mercado São Lucas", segment: "Alimentação", contribution: "Doação de alimentos", partnerships: 14, since: "2021", lastAction: "Sopão da Noite", contact: "Rafael Lima", phone: "(91) 3254-1180", initials: "MS", status: "recorrente" },
  { id: 3, name: "Clínica Vida Plena", segment: "Saúde", contribution: "Atendimento voluntário", partnerships: 8, since: "2023", lastAction: "Ação de Saúde Guamá", contact: "Dra. Luiza Melo", phone: "(91) 98165-4430", initials: "CV", status: "ativo" },
  { id: 4, name: "NorteLog Transportes", segment: "Logística", contribution: "Transporte e distribuição", partnerships: 5, since: "2024", lastAction: "Café de Rua", contact: "André Pires", phone: "(91) 3344-9200", initials: "NT", status: "ativo" },
  { id: 5, name: "Estúdio Guará", segment: "Comunicação", contribution: "Design e cobertura", partnerships: 4, since: "2024", lastAction: "Campanha de voluntariado", contact: "Bianca Tavares", phone: "(91) 98240-7712", initials: "EG", status: "ativo" },
  { id: 6, name: "Faculdade Semente", segment: "Educação", contribution: "Voluntariado acadêmico", partnerships: 3, since: "2023", lastAction: "Visita Orfanato", contact: "Prof. Caio Nunes", phone: "(91) 3201-6008", initials: "FS", status: "historico" },
];

export const RH_ATTENDANCE_SEED = [
  { id: 1, action: "Café de Rua", date: "2026-08-30", sector: "Operações", organizer: "Flávia Souza", confirmed: 28, present: 24, absent: 3, justified: 1, organizerPresent: true },
  { id: 2, action: "Ação de Saúde Guamá", date: "2026-08-23", sector: "Saúde", organizer: "Dr. Marcos Farias", confirmed: 18, present: 16, absent: 1, justified: 1, organizerPresent: true },
  { id: 3, action: "Sopão da Noite", date: "2026-08-16", sector: "Alimentação", organizer: "Ingrid Lima", confirmed: 22, present: 18, absent: 3, justified: 1, organizerPresent: true },
  { id: 4, action: "Visita Orfanato Santa Clara", date: "2026-08-09", sector: "Operações", organizer: "Alan Costa", confirmed: 15, present: 13, absent: 2, justified: 0, organizerPresent: false },
  { id: 5, action: "Lar de Idosos Esperança", date: "2026-07-26", sector: "Saúde", organizer: "Dra. Ana Paula", confirmed: 17, present: 15, absent: 1, justified: 1, organizerPresent: true },
];

export const RH_FEEDBACK_SEED = [
  { id: 1, type: "organizador", action: "Café de Rua", volunteer: "Flávia Souza", evaluator: "Coordenação", date: "2026-08-30", scores: { pontualidade: 5, comprometimento: 5, equipe: 5, comunicacao: 4, postura: 5, orientacoes: 5, proatividade: 5 }, note: "Conduziu a equipe com segurança e acolhimento." },
  { id: 2, type: "organizador", action: "Ação de Saúde Guamá", volunteer: "Gabriela Reis", evaluator: "Dr. Marcos Farias", date: "2026-08-23", scores: { pontualidade: 4, comprometimento: 5, equipe: 5, comunicacao: 5, postura: 5, orientacoes: 5, proatividade: 4 }, note: "Excelente comunicação com a comunidade." },
  { id: 3, type: "voluntario", action: "Sopão da Noite", volunteer: "Daniela Pinto", evaluator: "Daniela Pinto", date: "2026-08-16", scores: { acolhimento: 5, organizacao: 4, clareza: 4, suporte: 5 }, note: "A experiência foi acolhedora; faltou apenas comunicar o horário de encerramento." },
];

export const RH_OCCURRENCES_SEED = [
  { id: 1, volunteer: "João Pedro Sá", date: "2026-08-16", action: "Sopão da Noite", type: "Ausência sem aviso", description: "Segunda ausência confirmada sem comunicação prévia à organização.", registeredBy: "Ingrid Lima", actionTaken: "Conversa de orientação e reforço das regras de confirmação.", status: "acompanhamento", recurrence: 2 },
  { id: 2, volunteer: "Renato Maia", date: "2026-08-09", action: "Visita Orfanato Santa Clara", type: "Conduta inadequada", description: "Descumprimento de orientação de abordagem durante a atividade.", registeredBy: "Flávia Souza", actionTaken: "Afastamento preventivo e reunião com o RH agendada.", status: "aberta", recurrence: 1 },
];

export const RH_STORAGE_KEYS = {
  attendance: "aef_rh_attendance_v1",
  feedbacks: "aef_rh_feedbacks_v1",
  occurrences: "aef_rh_occurrences_v1",
};

export function readRHStore(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export const areaCfg = {
  "Saúde": { bg: "#FEF2F2", text: "#DC2626" },
  "Jurídico": { bg: "#EFF6FF", text: "#1D4ED8" },
  "Operações": { bg: "#F0FDF4", text: "#166534" },
  "Logística": { bg: "#FFF7ED", text: "#C2410C" },
  "Alimentação": { bg: "#FDF4FF", text: "#7E22CE" },
};
