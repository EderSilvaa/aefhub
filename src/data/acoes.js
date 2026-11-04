import { supabase } from "@/lib/supabase";
import { DEMO_USERS } from "@/lib/access";
import { ACOES_MOCK } from "@/data/operacoes";
import { volunteers as demoVolunteers } from "@/data/rh";

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
  feedbacks: [],
  ocorrencias: [],
};
const PART_RESUMO = ["papel", "presenca", "coordena", "membro_id"];
const demoRow = a => ({
  ...copy(a),
  participacoes: demo.participacoes.filter(p => p.acao_id === a.id).map(p => Object.fromEntries(PART_RESUMO.map(k => [k, p[k]]))),
});
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
// Status follows the date: before the day it is planning, from the day on it is
// under way, and only finishing it (the coordination) makes it concluded.
const hojeISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const statusDaAcao = (status, dataISO) => status === "concluída" ? status : dataISO && dataISO <= hojeISO() ? "em andamento" : "planejamento";

function fromRow(row) {
  const parts = row.participacoes || [];
  const vols = parts.filter(p => p.papel === "voluntario");
  const orgs = parts.filter(p => p.papel === "organizador");
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo,
    dataISO: row.data,
    data: isoToBr(row.data),
    local: row.local || "",
    status: statusDaAcao(row.status, row.data),
    responsavelId: row.responsavel_id,
    responsavel: nomeMembro(row.responsavel_id),
    pop: row.pop || null,
    voluntarios: parts.filter(p => p.papel === "voluntario").length,
    organizadores: orgs.length,
    coordenacao: orgs.filter(p => p.coordena).map(p => p.membro_id),
    organizadoresIds: orgs.map(p => p.membro_id),
    frequencia: {
      presentes: vols.filter(p => p.presenca === "presente").length,
      faltas: vols.filter(p => p.presenca === "falta").length,
      justificadas: vols.filter(p => p.presenca === "justificada").length,
      organizadorPresente: orgs.some(p => p.presenca === "presente"),
    },
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

const ACAO_SELECT = `*, participacoes(${PART_RESUMO.join(", ")})`;

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
  coordena: !!p.coordena,
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
    const row = { id: demo.seq++, presenca: null, observacao: null, coordena: false, ...fields };
    demo.participacoes.push(row);
    return partFromRow(row);
  }
  const { data, error } = await supabase.from("participacoes").insert(fields).select().single();
  if (error) throw error;
  return partFromRow(data);
}

// Organizers: coordination (the 2 to 4 who lead and decide) or support.
export async function setCoordena(id, coordena) {
  if (demo) {
    const row = demo.participacoes.find(p => p.id === id);
    row.coordena = coordena;
    return partFromRow(row);
  }
  const { data, error } = await supabase.from("participacoes").update({ coordena }).eq("id", id).select().single();
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
    const coord = demo.participacoes.filter(p => p.acao_id === acaoId && p.coordena).map(p => p.membro_id);
    const superAdmin = DEMO_USERS.find(u => u.id === userId)?.profileId === "super_admin";
    if (coord.length && !coord.includes(userId) && !superAdmin) throw demoFail("Só quem coordena a ação pode finalizar.", "42501");
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
  acaoId: a.id, nome: a.nome, tipo: a.tipo, dataISO: a.data, data: isoToBr(a.data), status: statusDaAcao(a.status, a.data), papel: p.papel, presenca: p.presenca || null,
  relatorio: a.finalizada_em ? { finalizadaEm: a.finalizada_em } : null,
});
const byDateDesc = (x, y) => y.dataISO.localeCompare(x.dataISO);

async function historico(column, id) {
  if (demo) {
    return demo.participacoes.filter(p => p[column] === id)
      .map(p => histFromRow(p, demo.acoes.find(a => a.id === p.acao_id))).sort(byDateDesc);
  }
  const { data, error } = await supabase.from("participacoes").select("papel, presenca, acoes(id, nome, tipo, data, status, finalizada_em)").eq(column, id);
  if (error) throw error;
  return data.filter(p => p.acoes).map(p => histFromRow(p, p.acoes)).sort(byDateDesc);
}

export const historicoVoluntario = id => historico("voluntario_id", id);
export const historicoMembro = id => historico("membro_id", id);

// ─── After the action: organizers' feedback and notes about volunteers ───────
export const FEEDBACK_DIAS = 7;
export const feedbackAberto = acao => acao.status === "concluída" && !!acao.relatorio
  && Date.now() - new Date(acao.relatorio.finalizadaEm).getTime() < FEEDBACK_DIAS * 86400000;

const fbFromRow = f => ({ id: f.id, acaoId: f.acao_id, membroId: f.membro_id, autor: nomeMembro(f.membro_id), texto: f.texto, criadoEm: f.criado_em });

export async function listFeedbacks(acaoId = null) {
  if (!equipeCache) await listEquipe();
  if (demo) return demo.feedbacks.filter(f => !acaoId || f.acao_id === acaoId).map(fbFromRow);
  let query = supabase.from("feedbacks_acao").select("*").order("criado_em", { ascending: false });
  if (acaoId) query = query.eq("acao_id", acaoId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(fbFromRow);
}

// one per organizer and action; saving again replaces the text
export async function saveFeedback(acaoId, texto, userId) {
  const clean = texto.trim();
  if (demo) {
    let row = demo.feedbacks.find(f => f.acao_id === acaoId && f.membro_id === userId);
    if (!row) { row = { id: demo.seq++, acao_id: acaoId, membro_id: userId, criado_em: new Date().toISOString() }; demo.feedbacks.unshift(row); }
    row.texto = clean;
    return fbFromRow(row);
  }
  const { data, error } = await supabase.from("feedbacks_acao")
    .upsert({ acao_id: acaoId, membro_id: userId, texto: clean }, { onConflict: "acao_id,membro_id" }).select().single();
  if (error) throw error;
  return fbFromRow(data);
}

export const TIPOS_REGISTRO = [
  ["atraso", "Atraso", "amber"],
  ["comportamento", "Comportamento", "red"],
  ["saiu_antes", "Saiu antes", "amber"],
  ["outro", "Outro", "neutral"],
  ["destaque", "Destaque", "green"],
];
export const tipoRegistro = id => TIPOS_REGISTRO.find(([key]) => key === id) || TIPOS_REGISTRO[3];
export const registroNegativo = tipo => tipo !== "destaque";

const ocFromRow = o => ({
  id: o.id, voluntarioId: o.voluntario_id, acaoId: o.acao_id, acaoNome: o.acoes?.nome || "", tipo: o.tipo, descricao: o.descricao || "",
  status: o.status, providencia: o.providencia || "", autor: nomeMembro(o.autor_id), criadoEm: o.criado_em,
});

export async function listOcorrencias(voluntarioId = null) {
  if (!equipeCache) await listEquipe();
  if (demo) {
    return demo.ocorrencias.filter(o => !voluntarioId || o.voluntario_id === voluntarioId)
      .map(o => ocFromRow({ ...o, acoes: demo.acoes.find(a => a.id === o.acao_id) }));
  }
  let query = supabase.from("ocorrencias").select("*, acoes(nome)").order("criado_em", { ascending: false });
  if (voluntarioId) query = query.eq("voluntario_id", voluntarioId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(ocFromRow);
}

// registros: [{ voluntarioId, acaoId, tipo, descricao }]; highlights start closed, the rest open for RH
export async function addOcorrencias(registros, userId) {
  if (!registros.length) return [];
  const rows = registros.map(r => ({
    voluntario_id: r.voluntarioId, acao_id: r.acaoId || null, tipo: r.tipo, descricao: r.descricao?.trim() || null,
    status: r.tipo === "destaque" ? "encerrada" : "aberta",
  }));
  if (demo) {
    const now = new Date().toISOString();
    const added = rows.map(r => ({ id: demo.seq++, providencia: null, autor_id: userId, criado_em: now, ...r }));
    demo.ocorrencias.unshift(...added);
    return added.map(o => ocFromRow({ ...o, acoes: demo.acoes.find(a => a.id === o.acao_id) }));
  }
  const { data, error } = await supabase.from("ocorrencias").insert(rows).select("*, acoes(nome)");
  if (error) throw error;
  return data.map(ocFromRow);
}

export async function updateOcorrencia(id, fields) {
  if (demo) {
    const row = demo.ocorrencias.find(o => o.id === id);
    Object.assign(row, fields);
    return ocFromRow({ ...row, acoes: demo.acoes.find(a => a.id === row.acao_id) });
  }
  const { data, error } = await supabase.from("ocorrencias").update(fields).eq("id", id).select("*, acoes(nome)").single();
  if (error) throw error;
  return ocFromRow(data);
}

// Volunteers of one action, for organizers who cannot read the whole base.
export async function voluntariosDaAcao(acaoId) {
  if (demo) {
    return demo.participacoes.filter(p => p.acao_id === acaoId && p.voluntario_id).map(p => ({
      id: p.voluntario_id, nome: demoVolunteers.find(v => (v.id || v.telefone) === p.voluntario_id)?.name || "Voluntário",
    }));
  }
  const { data, error } = await supabase.rpc("voluntarios_da_acao", { p_acao: acaoId });
  if (error) throw error;
  return data;
}

export function acaoErrorMessage(error) {
  if (error) console.error("[acoes]", error);
  // a column, table or function the app expects is missing: an SQL file was not run yet
  if (["42703", "42P01", "42883", "PGRST200", "PGRST202", "PGRST204", "PGRST205"].includes(error?.code)) {
    return "O banco está desatualizado: falta rodar o último arquivo SQL no Supabase.";
  }
  if (error?.code === "42501" || error?.code === "PGRST116") return "Seu perfil não pode alterar esta ação.";
  if (error?.code === "23505") return "Essa pessoa já está na ação.";
  if (error?.code === "P0001" || error?.code === "P0002") return error.message;
  return "Não foi possível salvar. Tente de novo.";
}

// Database volunteers have an id; the demo sample is keyed by phone.
export const volId = person => person.id || person.telefone;
