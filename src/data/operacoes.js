
// ─── OPERAÇÕES ────────────────────────────────────────────────────────────────
export const ACOES_MOCK = [
  {
    id: 1, nome: "Café de Rua", tipo: "Café de Rua", data: "26/04/2025",
    status: "em andamento", voluntarios: 12, responsavel: "Flávia Souza",
    pop: {
      cardapio: [
        { item: "Café com Leite (20L)", qtd: "20L", responsavel: "Flávia / Rebeca / Matheus", status: "pendente" },
        { item: "Suco (24L)", qtd: "24L", responsavel: "Arícia", status: "concluído" },
        { item: "Pão com Hot Dog", qtd: "200 un", responsavel: "Ingrid", status: "pendente" },
        { item: "Pão com Mortadela", qtd: "250 un", responsavel: "", status: "pendente" },
        { item: "Frutas (Mamão e Banana)", qtd: "—", responsavel: "Alan", status: "concluído" },
      ],
      afazeres: [
        { item: "Verificar Pães (450 un)", responsavel: "Aleffe", status: "pendente" },
        { item: "Verificar inventário (garrafas, descartáveis, lixo, luva, copo)", responsavel: "Arícia", status: "concluído" },
        { item: "Fazer compras necessárias", responsavel: "Alan", status: "pendente" },
      ],
      procedimentos: [
        { item: "Lançar listas — Grupo Fixos", responsavel: "Flávia", status: "concluído" },
        { item: "Lançar listas — Grupo Voluntários", responsavel: "Flávia", status: "pendente" },
        { item: "Realizar sorteio e divulgar lista", responsavel: "Flávia", status: "pendente" },
        { item: "Incluir no grupo da ação", responsavel: "Flávia", status: "pendente" },
        { item: "Ministrar capacitação", responsavel: "Flávia", status: "pendente" },
        { item: "Dividir carros", responsavel: "Flávia", status: "pendente" },
      ],
      acao: [
        { item: "Lista de presentes", responsavel: "Flávia", status: "pendente" },
        { item: "Ponto de encontro", responsavel: "Aleffe", status: "pendente" },
      ],
      financeiro: [
        { item: "Fazer compras", responsavel: "Alan", status: "pendente" },
      ],
      marketing: [
        { item: "Bater fotos", responsavel: "Duda", status: "pendente" },
        { item: "Cobertura durante a ação", responsavel: "Duda", status: "pendente" },
      ],
    }
  },
  {
    id: 2, nome: "Ação de Saúde — Guamá", tipo: "Saúde", data: "19/04/2025",
    status: "concluída", voluntarios: 8, responsavel: "Dr. Marcos Farias", pop: null,
  },
  {
    id: 3, nome: "Visita Orfanato Santa Clara", tipo: "Orfanato", data: "12/04/2025",
    status: "concluída", voluntarios: 6, responsavel: "Alan Costa", pop: null,
  },
];

export const statusCfgOp = {
  "em andamento": { bg: "#FFF8E1", text: "#B45309", dot: "#F59E0B" },
  "concluída":    { bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
  "planejamento": { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6" },
};

export const tipoCfg = {
  "Café de Rua": { bg: "#FFF7ED", text: "#C2410C" },
  "Saúde":       { bg: "#FEF2F2", text: "#DC2626" },
  "Orfanato":    { bg: "#F5F3FF", text: "#6D28D9" },
  "Jurídico":    { bg: "#EFF6FF", text: "#1D4ED8" },
  "Social":      { bg: "#F0FDF4", text: "#166534" },
};

export const OPS_STATUS_TONE = { "em andamento": "amber", "concluída": "green", "planejamento": "blue" };
export const OPS_TIPO_TONE = { "Café de Rua": "orange", "Saúde": "red", "Orfanato": "purple", "Jurídico": "blue", "Social": "green" };
export const OPS_AREA_TONE = { "Saúde": "red", "Jurídico": "blue", "Operações": "green", "Logística": "orange", "Alimentação": "purple" };
