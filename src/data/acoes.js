import { supabase } from "@/lib/supabase";
import { DEMO_USERS } from "@/lib/access";
import { ACOES_MOCK } from "@/data/operacoes";

// Actions, who took part in each one, and the final report.
// Same functions in both modes: Supabase when configured, an in-memory store in demo mode.

const isoToBr = iso => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const brToIso = br => br.split("/").reverse().join("-");
const copy = value => (value == null ? value : JSON.parse(JSON.stringify(value)));

// ─── Demo store ──────────────────────────────────────────────────────────────
const demo = supabase ? null : {
  seq: 1,
  acoes: ACOES_MOCK.map(a => ({
    id: `demo-${a.id}`, nome: a.nome, tipo: a.tipo, data: brToIso(a.data), local: null, status: a.status,
    responsavel_id: DEMO_USERS.find(u => u.name === a.responsavel)?.id ?? null, pop: copy(a.pop),
    publico_atendido: null, servido: null, resumo: null, ocorrencias: null, finalizada_em: null, finalizada_por: null,
  })),
  participacoes: [],
};
const demoRow = a => ({ ...copy(a), participacoes: demo.participacoes.filter(p => p.acao_id === a.id).map(p => ({ papel: p.papel })) });
const demoFail = (message, code = "P0001") => Object.assign(new Error(message), { code });

// ─── Team names (members of the organization) ────────────────────────────────
let equipeCache = null;

export async function listEquipe() {
  if (demo) {
    equipeCache = DEMO_USERS.map(u => ({ id: u.id, nome: u.name, cargo: u.position || "", area: "" }));
    return equipeCache;
  }
  const { data, error } = await supabase.from("equipe").select("id, nome, cargo, area").order("nome");
  if (error) throw error;
  equipeCache = data.map(m => ({ ...m, cargo: m.cargo || "", area: m.area || "" }));
  return equipeCache;
}

const nomeMembro = id => equipeCache?.find(m => m.id === id)?.nome || "";

// ─── Actions ─────────────────────────────────────────────────────────────────
function fromRow(row) {
  const parts = row.participacoes || [];
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo,
    dataISO: row.data,
    data: isoToBr(row.data),
    local: row.local || "",
    status: row.status,
    responsavelId: row.responsavel_id,
    responsavel: nomeMembro(row.responsavel_id),
    pop: row.pop || null,
    voluntarios: parts.filter(p => p.papel === "voluntario").length,
    organizadores: parts.filter(p => p.papel === "organizador").length,
    relatorio: row.finalizada_em ? {
      publico: row.publico_atendido,
      servido: row.servido || [],
      resumo: row.resumo || "",
      ocorrencias: row.ocorrencias || "",
      finalizadaEm: row.finalizada_em,
      finalizadaPor: nomeMembro(row.finalizada_por),
    } : null,
  };
}

const ACAO_SELECT = "*, participacoes(papel)";

export async function listAcoes() {
  if (!equipeCache) await listEquipe();
  if (demo) return demo.acoes.map(demoRow).map(fromRow).sort((a, b) => b.dataISO.localeCompare(a.dataISO));
  const { data, error } = await supabase.from("acoes").select(ACAO_SELECT).order("data", { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function getAcao(id) {
  if (demo) return fromRow(demoRow(demo.acoes.find(a => a.id === id)));
  const { data, error } = await supabase.from("acoes").select(ACAO_SELECT).eq("id", id).single();
  if (error) throw error;
  return fromRow(data);
}

export async function createAcao({ nome, tipo, data, responsavelId }) {
  const fields = { nome: nome.trim(), tipo, data, responsavel_id: responsavelId || null };
  if (demo) {
    const row = { id: `demo-n${demo.seq++}`, local: null, status: "planejamento", pop: null, publico_atendido: null, servido: null, resumo: null, ocorrencias: null, finalizada_em: null, finalizada_por: null, ...fields };
    demo.acoes.push(row);
    return fromRow(demoRow(row));
  }
  const { data: row, error } = await supabase.from("acoes").insert(fields).select(ACAO_SELECT).single();
  if (error) throw error;
  return fromRow(row);
}

// Open actions only: pop, status (planejamento / em andamento), responsavel_id, nome, data, local.
export async function updateAcao(id, fields) {
  if (demo) {
    const row = demo.acoes.find(a => a.id === id);
    if (row.status === "concluída") throw demoFail("Esta ação já foi finalizada.", "42501");
    Object.assign(row, copy(fields));
    return fromRow(demoRow(row));
  }
  const { data, error } = await supabase.from("acoes").update(fields).eq("id", id).select(ACAO_SELECT).single();
  if (error) throw error;
  return fromRow(data);
}

// ─── Who takes part ──────────────────────────────────────────────────────────
const partFromRow = p => ({
  id: p.id,
  papel: p.papel,
  presenca: p.presenca || null,
  observacao: p.observacao || "",
  voluntarioId: p.voluntario_id || null,
  membroId: p.membro_id || null,
});

export async function listParticipacoes(acaoId) {
  if (demo) return demo.participacoes.filter(p => p.acao_id === acaoId).map(partFromRow);
  const { data, error } = await supabase.from("participacoes").select("*").eq("acao_id", acaoId).order("criado_em");
  if (error) throw error;
  return data.map(partFromRow);
}

// one of voluntarioId / membroId; members join as organizers, volunteers as volunteers
export async function addParticipacao(acaoId, { voluntarioId = null, membroId = null }) {
  const fields = { acao_id: acaoId, voluntario_id: voluntarioId, membro_id: membroId, papel: membroId ? "organizador" : "voluntario" };
  if (demo) {
    const dup = demo.participacoes.some(p => p.acao_id === acaoId && ((voluntarioId && p.voluntario_id === voluntarioId) || (membroId && p.membro_id === membroId)));
    if (dup) throw demoFail("dup", "23505");
    const row = { id: demo.seq++, presenca: null, observacao: null, ...fields };
    demo.participacoes.push(row);
    return partFromRow(row);
  }
  const { data, error } = await supabase.from("participacoes").insert(fields).select().single();
  if (error) throw error;
  return partFromRow(data);
}

export async function removeParticipacao(id) {
  if (demo) {
    demo.participacoes = demo.participacoes.filter(p => p.id !== id);
    return;
  }
  const { error } = await supabase.from("participacoes").delete().eq("id", id);
  if (error) throw error;
}

// ─── Finish and reopen ───────────────────────────────────────────────────────
// presencas: [{ id, presenca, observacao }]; relatorio: { publico, servido, resumo, ocorrencias }
export async function finalizarAcao(acaoId, presencas, relatorio, userId) {
  const publico = relatorio.publico === "" || relatorio.publico == null ? null : Number(relatorio.publico);
  if (demo) {
    const row = demo.acoes.find(a => a.id === acaoId);
    if (row.status === "concluída") throw demoFail("Esta ação já foi finalizada.");
    presencas.forEach(x => {
      const p = demo.participacoes.find(item => item.id === x.id && item.acao_id === acaoId);
      if (p) Object.assign(p, { presenca: x.presenca, observacao: x.observacao || null });
    });
    if (demo.participacoes.some(p => p.acao_id === acaoId && !p.presenca)) throw demoFail("Marque a presença de todo mundo antes de finalizar.");
    Object.assign(row, {
      status: "concluída", publico_atendido: publico, servido: copy(relatorio.servido), resumo: relatorio.resumo || null,
      ocorrencias: relatorio.ocorrencias || null, finalizada_em: new Date().toISOString(), finalizada_por: userId ?? null,
    });
    return getAcao(acaoId);
  }
  const { error } = await supabase.rpc("finalizar_acao", {
    p_acao: acaoId,
    p_presencas: presencas.map(x => ({ id: x.id, presenca: x.presenca, observacao: x.observacao || "" })),
    p_publico: publico,
    p_servido: relatorio.servido,
    p_resumo: relatorio.resumo || "",
    p_ocorrencias: relatorio.ocorrencias || "",
  });
  if (error) throw error;
  return getAcao(acaoId);
}

export async function reabrirAcao(acaoId) {
  if (demo) {
    Object.assign(demo.acoes.find(a => a.id === acaoId), { status: "em andamento", finalizada_em: null, finalizada_por: null });
    return getAcao(acaoId);
  }
  const { error } = await supabase.rpc("reabrir_acao", { p_acao: acaoId });
  if (error) throw error;
  return getAcao(acaoId);
}

// ─── History ─────────────────────────────────────────────────────────────────
// Per volunteer: actions done, absences (all and last 12 months), last action.
function resumoDe(rows) {
  const out = {};
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 1);
  const limiteISO = limite.toISOString().slice(0, 10);
  rows.forEach(({ voluntarioId, presenca, acao }) => {
    if (acao.status !== "concluída") return;
    const r = out[voluntarioId] || (out[voluntarioId] = { acoesFeitas: 0, faltas: 0, faltas12m: 0, ultimaAcao: "", ultimaAcaoData: "" });
    if (presenca === "presente") {
      r.acoesFeitas += 1;
      if (acao.data > r.ultimaAcaoData) { r.ultimaAcao = acao.nome; r.ultimaAcaoData = acao.data; }
    }
    if (presenca === "falta") {
      r.faltas += 1;
      if (acao.data >= limiteISO) r.faltas12m += 1;
    }
  });
  return out;
}

export async function listResumoVoluntarios() {
  if (demo) {
    return resumoDe(demo.participacoes.filter(p => p.voluntario_id).map(p => ({
      voluntarioId: p.voluntario_id, presenca: p.presenca, acao: demo.acoes.find(a => a.id === p.acao_id),
    })));
  }
  const { data, error } = await supabase.from("voluntarios_resumo").select("*");
  if (error) throw error;
  return Object.fromEntries(data.map(r => [r.voluntario_id, {
    acoesFeitas: r.acoes_feitas, faltas: r.faltas, faltas12m: r.faltas_12m, ultimaAcao: r.ultima_acao || "", ultimaAcaoData: r.ultima_acao_data || "",
  }]));
}

const histFromRow = (p, a) => ({
  acaoId: a.id, nome: a.nome, tipo: a.tipo, dataISO: a.data, data: isoToBr(a.data), status: a.status, papel: p.papel, presenca: p.presenca || null,
});
const byDateDesc = (x, y) => y.dataISO.localeCompare(x.dataISO);

async function historico(column, id) {
  if (demo) {
    return demo.participacoes.filter(p => p[column] === id)
      .map(p => histFromRow(p, demo.acoes.find(a => a.id === p.acao_id))).sort(byDateDesc);
  }
  const { data, error } = await supabase.from("participacoes").select("papel, presenca, acoes(id, nome, tipo, data, status)").eq(column, id);
  if (error) throw error;
  return data.filter(p => p.acoes).map(p => histFromRow(p, p.acoes)).sort(byDateDesc);
}

export const historicoVoluntario = id => historico("voluntario_id", id);
export const historicoMembro = id => historico("membro_id", id);

export function acaoErrorMessage(error) {
  if (error?.code === "42501" || error?.code === "PGRST116") return "Seu perfil não pode alterar esta ação.";
  if (error?.code === "23505") return "Essa pessoa já está na ação.";
  if (error?.code === "P0001" || error?.code === "P0002") return error.message;
  return "Não foi possível salvar. Tente de novo.";
}

// Database volunteers have an id; the demo sample is keyed by phone.
export const volId = person => person.id || person.telefone;
