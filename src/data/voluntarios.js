import { supabase } from "@/lib/supabase";
import { getInitials } from "@/lib/access";

export const SEM_AREA = "Sem área";

// A voluntarios row (Supabase) in the shape the RH, Operações and Inventário screens already use.
function fromRow(row) {
  return {
    id: row.id,
    name: row.nome,
    area: row.area || SEM_AREA,
    formation: row.formacao || "",
    actions: 0, // counted from attendance once Operações is on the database
    initials: getInitials(row.nome),
    verified: row.status === "ativo",
    novato: row.status === "novo",
    penalizado: row.status === "penalizado",
    motivoPenalidade: row.status === "penalizado" ? row.observacoes || "" : "",
    telefone: row.contato_emergencia || "",
    status: row.status,
    observacoes: row.observacoes || "",
    cadastradoEm: row.cadastrado_em,
    idadeCadastro: row.idade_cadastro,
    comoConheceu: row.como_conheceu || "",
  };
}

export async function listVoluntarios() {
  const { data, error } = await supabase.from("voluntarios").select("*").order("nome");
  if (error) throw error;
  return data.map(fromRow);
}
