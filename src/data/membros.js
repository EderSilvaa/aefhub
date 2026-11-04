import { supabase } from "@/lib/supabase";
import { buildManagedUser, normalizeEmail } from "@/lib/access";

// The membros table (Supabase) in the shape the screens already use for users.
function fromRow(row) {
  return buildManagedUser({
    id: row.id,
    name: row.nome,
    email: row.email,
    profileId: row.perfil,
    position: row.cargo || "",
    department: row.area || "",
    phone: row.telefone || "",
    city: row.cidade || "",
    active: row.ativo,
    allowedModules: row.modulos,
    createdAt: row.criado_em,
  });
}

function toRow(user) {
  return {
    email: normalizeEmail(user.email),
    nome: user.name.trim(),
    perfil: user.profileId,
    modulos: user.allowedModules,
    cargo: user.position?.trim() || null,
    area: user.department?.trim() || null,
    telefone: user.phone?.trim() || null,
    cidade: user.city?.trim() || null,
    ativo: user.active !== false,
  };
}

export async function listMembers() {
  const { data, error } = await supabase.from("membros").select("*").order("nome");
  if (error) throw error;
  return data.map(fromRow);
}

export async function saveMember(draft) {
  const row = toRow(draft);
  const query = draft.id
    ? supabase.from("membros").update(row).eq("id", draft.id)
    : supabase.from("membros").insert(row);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return fromRow(data);
}

export async function setMemberActive(id, ativo) {
  const { data, error } = await supabase.from("membros").update({ ativo }).eq("id", id).select().single();
  if (error) throw error;
  return fromRow(data);
}

export function memberErrorMessage(error) {
  if (error?.code === "23505") return "Já existe um membro com este e-mail.";
  // row level security refuses writes from profiles other than Super Admin and RH
  if (error?.code === "42501" || error?.code === "PGRST116") return "Seu perfil não pode alterar membros.";
  if (error?.code === "23514") return "Perfil inválido para este membro.";
  return "Não foi possível salvar no banco. Tente de novo.";
}
