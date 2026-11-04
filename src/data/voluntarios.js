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
    rawArea: row.area || "",
    fotoPath: row.foto_path || "",
  };
}

export async function listVoluntarios() {
  const { data, error } = await supabase.from("voluntarios").select("*").order("nome");
  if (error) throw error;
  return data.map(fromRow);
}

// RH edits: area, formacao, status, observacoes, foto_path.
export async function updateVoluntario(id, fields) {
  const { data, error } = await supabase.from("voluntarios").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return fromRow(data);
}

export async function getSaude(id) {
  const { data, error } = await supabase.from("voluntarios_saude").select("informacao").eq("voluntario_id", id).maybeSingle();
  if (error) throw error;
  return data?.informacao || "";
}

export async function saveSaude(id, text) {
  const informacao = text.trim();
  if (!informacao) {
    const { error } = await supabase.from("voluntarios_saude").delete().eq("voluntario_id", id);
    if (error) throw error;
    return "";
  }
  const { error } = await supabase.from("voluntarios_saude")
    .upsert({ voluntario_id: id, informacao, atualizado_em: new Date().toISOString() });
  if (error) throw error;
  return informacao;
}

// ─── Photos (private bucket) ─────────────────────────────────────────────────
const FOTOS = "voluntarios-fotos";

// Shrink in the browser before upload: ~480px JPEG, around 50 KB per photo.
async function shrinkPhoto(file, max = 480) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error("Não foi possível ler a imagem."))), "image/jpeg", 0.82);
  });
}

export async function uploadFoto(person, file) {
  const blob = await shrinkPhoto(file);
  // a new path per upload, so cached links never show the old photo
  const path = `${person.id}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(FOTOS).upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const updated = await updateVoluntario(person.id, { foto_path: path });
  if (person.fotoPath) await supabase.storage.from(FOTOS).remove([person.fotoPath]);
  return updated;
}

export async function removeFoto(person) {
  const updated = await updateVoluntario(person.id, { foto_path: null });
  if (person.fotoPath) await supabase.storage.from(FOTOS).remove([person.fotoPath]);
  return updated;
}

// Private bucket: photos are shown through links that expire in an hour.
export async function signedFotoUrls(paths) {
  if (!paths.length) return {};
  const { data, error } = await supabase.storage.from(FOTOS).createSignedUrls(paths, 3600);
  if (error) throw error;
  return Object.fromEntries(data.filter(item => item.signedUrl).map(item => [item.path, item.signedUrl]));
}

export function voluntarioErrorMessage(error) {
  if (error?.code === "PGRST116" || error?.code === "42501" || error?.statusCode === "403") return "Seu perfil não pode alterar voluntários.";
  if (error?.code === "23514") return "Valor inválido para este campo.";
  return error?.message?.startsWith("Não foi") ? error.message : "Não foi possível salvar. Tente de novo.";
}
