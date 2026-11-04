import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { useVoluntarios } from "@/data/VoluntariosContext";
import {
  acaoErrorMessage, addOcorrencias, addParticipacao, feedbackAberto, FEEDBACK_DIAS, finalizarAcao, listFeedbacks,
  removeParticipacao, saveFeedback, setCoordena, TIPOS_REGISTRO, voluntariosDaAcao, volId,
} from "@/data/acoes";
import "../operacoes.css";

const semAcento = text => (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const PRESENCAS = [
  ["presente", "Foi", "green"],
  ["falta", "Faltou", "red"],
  ["justificada", "Justificou", "amber"],
];
const presencaInfo = id => PRESENCAS.find(([key]) => key === id);

// Who a participation points to: a volunteer from the base or a member of the organization.
export function useNomeParticipante(equipe) {
  const volunteers = useVoluntarios();
  return useMemo(() => {
    const vols = new Map(volunteers.map(v => [volId(v), v]));
    const membros = new Map(equipe.map(m => [m.id, m]));
    return part => {
      if (part.membroId) {
        const m = membros.get(part.membroId);
        return { nome: m?.nome || "Membro removido", sub: m?.cargo || "Organização" };
      }
      const v = vols.get(part.voluntarioId);
      return { nome: v?.name || "Voluntário removido", sub: v?.area && v.area !== "Sem área" ? v.area : "Voluntário" };
    };
  }, [volunteers, equipe]);
}

function PessoaPicker({ id, label, options, onPick, disabled }) {
  const [query, setQuery] = useState("");
  const q = semAcento(query.trim());
  const matches = q.length < 2 ? [] : options.filter(o => semAcento(o.label).includes(q)).slice(0, 6);
  return (
    <div className="aef-ops__picker">
      <label className="aef-ops__label" htmlFor={id}>{label}</label>
      <div className="aef-ops__picker-box">
        <span className="aef-ops__picker-icon" aria-hidden="true"><Icon name="search" size={15} /></span>
        <input id={id} className="aef-ops__input" type="search" autoComplete="off" placeholder="Digite pelo menos 2 letras do nome" value={query} disabled={disabled} onChange={e => setQuery(e.target.value)} />
      </div>
      {q.length >= 2 && (
        <ul className="aef-ops__picker-list">
          {matches.length === 0 && <li className="aef-ops__picker-empty">Ninguém com esse nome, ou já está na ação.</li>}
          {matches.map(o => (
            <li key={o.key}>
              <button type="button" className="aef-ops__picker-option" onClick={() => { onPick(o); setQuery(""); }}>
                <span className="aef-ops__picker-name">{o.label}</span>
                {o.sub && <span className="aef-ops__picker-sub">{o.sub}</span>}
                <span className="aef-ops__picker-add" aria-hidden="true"><Icon name="plus" size={15} /></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Equipe tab: organizers and volunteers of one action ─────────────────────
export function AcaoEquipe({ acao, parts, setParts, equipe, editable }) {
  const volunteers = useVoluntarios();
  const nomeDe = useNomeParticipante(equipe);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const concluida = acao.status === "concluída";

  const naAcao = new Set(parts.map(p => (p.membroId ? `m${p.membroId}` : `v${p.voluntarioId}`)));
  const opcoesMembros = equipe.filter(m => !naAcao.has(`m${m.id}`)).map(m => ({ key: `m${m.id}`, label: m.nome, sub: m.cargo, membroId: m.id }));
  const opcoesVols = volunteers.filter(v => !naAcao.has(`v${volId(v)}`) && v.status !== "penalizado" && !v.penalizado)
    .map(v => ({ key: `v${volId(v)}`, label: v.name, sub: v.area !== "Sem área" ? v.area : "", voluntarioId: volId(v) }));

  const adicionar = async opt => {
    setBusy(true); setErro("");
    try {
      const nova = await addParticipacao(acao.id, { membroId: opt.membroId ?? null, voluntarioId: opt.voluntarioId ?? null });
      setParts(prev => [...prev, nova]);
    } catch (error) { setErro(acaoErrorMessage(error)); }
    setBusy(false);
  };
  const alternarCoordena = async part => {
    setBusy(true); setErro("");
    try {
      const updated = await setCoordena(part.id, !part.coordena);
      setParts(prev => prev.map(p => (p.id === part.id ? updated : p)));
    } catch (error) { setErro(acaoErrorMessage(error)); }
    setBusy(false);
  };
  const remover = async part => {
    setBusy(true); setErro("");
    try {
      await removeParticipacao(part.id);
      setParts(prev => prev.filter(p => p.id !== part.id));
    } catch (error) { setErro(acaoErrorMessage(error)); }
    setBusy(false);
  };

  const grupo = (titulo, papel, picker, vazio) => {
    const lista = parts.filter(p => p.papel === papel);
    return (
      <section className="aef-ops__panel">
        <div className="aef-ops__panel-head">
          <h2 className="aef-ops__h3">{titulo} <span className="aef-ops__count">{lista.length}</span></h2>
        </div>
        {editable && !concluida && <div className="aef-ops__panel--pad aef-ops__picker-wrap">{picker}</div>}
        {lista.length === 0 ? (
          <p className="aef-ops__hint aef-ops__equipe-empty">{vazio}</p>
        ) : (
          <ul className="aef-ops__people">
            {lista.map(part => {
              const { nome, sub } = nomeDe(part);
              const pres = presencaInfo(part.presenca);
              return (
                <li key={part.id} className="aef-ops__person">
                  <div className="aef-ops__person-main">
                    <div className="aef-ops__person-name">{nome}</div>
                    <div className="aef-ops__hint" style={{ marginTop: 0 }}>{sub}</div>
                  </div>
                  {papel === "organizador" && (editable && !concluida ? (
                    <button type="button" className="aef-ops__coord" aria-pressed={part.coordena} disabled={busy} onClick={() => alternarCoordena(part)}
                      title={part.coordena ? "Coordena a ação: decide e finaliza" : "Apoio: ajuda e dá feedback depois"}>
                      {part.coordena ? "Coordenação" : "Apoio"}
                    </button>
                  ) : (
                    <span className="aef-ops__tag" data-tone={part.coordena ? "red" : "neutral"}>{part.coordena ? "Coordenação" : "Apoio"}</span>
                  ))}
                  {pres && <span className="aef-ops__tag" data-tone={pres[2]}>{pres[1]}</span>}
                  {editable && !concluida && (
                    <button type="button" className="aef-ops__icon-btn" aria-label={`Tirar ${nome} da ação`} title="Tirar da ação" disabled={busy} onClick={() => remover(part)}>
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="aef-ops__stack">
      {erro && <p className="aef-ops__error" role="alert">{erro}</p>}
      {grupo("Organizadores", "organizador",
        <PessoaPicker id="ops-add-membro" label="Adicionar organizador" options={opcoesMembros} onPick={adicionar} disabled={busy} />,
        "Ninguém da organização escalado ainda. Quem coordena (2 a 4 pessoas) decide e finaliza; o apoio ajuda e dá feedback depois.")}
      {grupo("Voluntários", "voluntario",
        <PessoaPicker id="ops-add-vol" label="Adicionar voluntário" options={opcoesVols} onPick={adicionar} disabled={busy} />,
        "Nenhum voluntário escalado ainda. Depois do sorteio, adicione aqui quem vai.")}
    </div>
  );
}

// ─── Notes about volunteers (late, behavior, highlight…) ─────────────────────
export function RegistrosEditor({ voluntarios, value, onChange, idPrefix }) {
  const set = (i, campo, valor) => onChange(value.map((r, j) => (j === i ? { ...r, [campo]: valor } : r)));
  return (
    <fieldset className="aef-ops__field aef-ops__fieldset">
      <legend className="aef-ops__label">Registrar sobre um voluntário</legend>
      <p className="aef-ops__hint" style={{ marginTop: 0 }}>Atraso, comportamento, saiu antes, ou um destaque de quem mandou bem. Vai para o RH e para a ficha da pessoa; o voluntário não vê.</p>
      {voluntarios.length === 0 && <p className="aef-ops__hint">Nenhum voluntário escalado nesta ação.</p>}
      {value.map((r, i) => (
        <div key={i} className="aef-ops__registro">
          <div className="aef-ops__registro-top">
            <select className="aef-ops__select" aria-label="Voluntário" value={r.voluntarioId} onChange={e => set(i, "voluntarioId", e.target.value)}>
              <option value="">Escolha o voluntário</option>
              {voluntarios.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
            <select className="aef-ops__select aef-ops__select--short" aria-label="Tipo" value={r.tipo} onChange={e => set(i, "tipo", e.target.value)}>
              {TIPOS_REGISTRO.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <button type="button" className="aef-ops__icon-btn" aria-label="Tirar registro" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <Icon name="trash" size={15} />
            </button>
          </div>
          <input id={`${idPrefix}-desc-${i}`} className="aef-ops__input" aria-label="O que aconteceu" placeholder="O que aconteceu, em uma frase" value={r.descricao} onChange={e => set(i, "descricao", e.target.value)} />
        </div>
      ))}
      {voluntarios.length > 0 && (
        <button type="button" className="aef-ops__btn aef-ops__btn--quiet aef-ops__btn--start" onClick={() => onChange([...value, { voluntarioId: "", tipo: "atraso", descricao: "" }])}>
          <span aria-hidden="true"><Icon name="plus" size={15} /></span>Adicionar registro
        </button>
      )}
    </fieldset>
  );
}

const registrosValidos = (lista, acaoId) => lista.filter(r => r.voluntarioId).map(r => ({ ...r, acaoId }));

// Support organizers (and coordination too) tell how it went, up to 7 days after the action.
export function FeedbackDialog({ acao, user, atual, onClose, onSaved }) {
  const [texto, setTexto] = useState(atual?.texto || "");
  const [registros, setRegistros] = useState([]);
  const [voluntarios, setVoluntarios] = useState([]);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let alive = true;
    voluntariosDaAcao(acao.id).then(rows => { if (alive) setVoluntarios(rows); }).catch(() => {});
    return () => { alive = false; };
  }, [acao.id]);

  const salvar = async () => {
    if (!texto.trim()) { setErro("Conte em poucas palavras como foi para você."); return; }
    setBusy(true); setErro("");
    try {
      const fb = await saveFeedback(acao.id, texto, user?.id);
      await addOcorrencias(registrosValidos(registros, acao.id), user?.id);
      onSaved(fb);
    } catch (error) {
      setErro(acaoErrorMessage(error));
      setBusy(false);
    }
  };

  return createPortal(
    <div className="aef-ops">
      <div className="aef-ops__scrim aef-ops__scrim--top" onClick={busy ? undefined : onClose}>
        <div className="aef-ops__dialog aef-ops__dialog--wide" role="dialog" aria-modal="true" aria-labelledby="ops-fb-title" onClick={e => e.stopPropagation()}>
          <div className="aef-ops__dialog-head">
            <div>
              <h2 id="ops-fb-title" className="aef-ops__dialog-title">Feedback: {acao.nome}</h2>
              <p className="aef-ops__hint">Aberto até {FEEDBACK_DIAS} dias depois da ação. A coordenação e o RH leem.</p>
            </div>
            <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose} disabled={busy}>Fechar</button>
          </div>
          <div className="aef-ops__dialog-body aef-ops__form">
            <div className="aef-ops__field">
              <label className="aef-ops__label" htmlFor="ops-fb-texto">Como foi para você</label>
              <textarea id="ops-fb-texto" className="aef-ops__textarea" placeholder="O que funcionou, o que travou, o que dá para melhorar na próxima" value={texto} onChange={e => setTexto(e.target.value)} />
            </div>
            <RegistrosEditor voluntarios={voluntarios} value={registros} onChange={setRegistros} idPrefix="ops-fb" />
            {erro && <p className="aef-ops__error" role="alert">{erro}</p>}
          </div>
          <div className="aef-ops__dialog-foot">
            <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--grow" disabled={busy} onClick={salvar}>
              {busy ? "Enviando…" : atual ? "Atualizar feedback" : "Enviar feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Finish: attendance, then the report ─────────────────────────────────────
export function FinalizarAcao({ acao, parts, equipe, user, onClose, onDone }) {
  const nomeDe = useNomeParticipante(equipe);
  const [passo, setPasso] = useState(1);
  const [presencas, setPresencas] = useState(() => Object.fromEntries(parts.map(p => [p.id, p.presenca || ""])));
  const [rel, setRel] = useState(() => ({
    publico: "",
    servido: (acao.pop?.cardapio || []).map(c => ({ item: c.item, qtd: c.qtd && c.qtd !== "—" ? c.qtd : "" })),
    resumo: "",
    ocorrencias: "",
  }));
  const [registros, setRegistros] = useState([]);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");

  const voluntariosAcao = parts.filter(p => p.voluntarioId).map(p => ({ id: p.voluntarioId, nome: nomeDe(p).nome }));
  const faltam = parts.filter(p => !presencas[p.id]).length;
  const ordenadas = [...parts].sort((a, b) => (a.papel === b.papel ? 0 : a.papel === "organizador" ? -1 : 1));
  const setServido = (i, campo, valor) => setRel(r => ({ ...r, servido: r.servido.map((s, j) => (j === i ? { ...s, [campo]: valor } : s)) }));

  const finalizar = async () => {
    setBusy(true); setErro("");
    try {
      const updated = await finalizarAcao(
        acao.id,
        parts.map(p => ({ id: p.id, presenca: presencas[p.id] })),
        { ...rel, servido: rel.servido.filter(s => s.item.trim()) },
        user?.id,
      );
      let aviso = "";
      try { await addOcorrencias(registrosValidos(registros, acao.id), user?.id); }
      catch { aviso = "A ação foi finalizada, mas os registros sobre voluntários não foram salvos. Peça para o RH registrar."; }
      onDone(updated, aviso);
    } catch (error) {
      setErro(acaoErrorMessage(error));
      setBusy(false);
    }
  };

  return (
    <div className="aef-ops__scrim" onClick={busy ? undefined : onClose}>
      <div className="aef-ops__dialog aef-ops__dialog--wide" role="dialog" aria-modal="true" aria-labelledby="ops-fin-title" onClick={e => e.stopPropagation()}>
        <div className="aef-ops__dialog-head">
          <div>
            <h2 id="ops-fin-title" className="aef-ops__dialog-title">Finalizar {acao.nome}</h2>
            <p className="aef-ops__hint">Passo {passo} de 2: {passo === 1 ? "quem foi" : "como foi a ação"}</p>
          </div>
          <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose} disabled={busy}>Fechar</button>
        </div>

        <div className="aef-ops__dialog-body aef-ops__form">
          {passo === 1 && (parts.length === 0 ? (
            <p className="aef-ops__note aef-ops__note--amber">Ninguém foi escalado nesta ação. Se alguém foi, adicione na aba Equipe antes de finalizar, senão a ação não vai aparecer no histórico dessas pessoas.</p>
          ) : (
            <>
              <div className="aef-ops__fin-bar">
                <span className="aef-ops__hint" style={{ marginTop: 0 }}>{faltam ? `Falta marcar ${faltam} de ${parts.length}` : `Todos os ${parts.length} marcados`}</span>
                <button type="button" className="aef-ops__btn aef-ops__btn--quiet" onClick={() => setPresencas(prev => Object.fromEntries(parts.map(p => [p.id, prev[p.id] || "presente"])))}>
                  Marcar o resto como “foi”
                </button>
              </div>
              <ul className="aef-ops__presencas">
                {ordenadas.map(part => {
                  const { nome, sub } = nomeDe(part);
                  return (
                    <li key={part.id} className="aef-ops__presenca">
                      <div className="aef-ops__person-main">
                        <div className="aef-ops__person-name">{nome}</div>
                        <div className="aef-ops__hint" style={{ marginTop: 0 }}>{part.papel === "organizador" ? "Organizador" : sub}</div>
                      </div>
                      <div className="aef-ops__seg" role="radiogroup" aria-label={`Presença de ${nome}`}>
                        {PRESENCAS.map(([id, label, tone]) => (
                          <button key={id} type="button" role="radio" aria-checked={presencas[part.id] === id} data-tone={tone} className="aef-ops__seg-btn"
                            onClick={() => setPresencas(prev => ({ ...prev, [part.id]: id }))}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ))}

          {passo === 2 && (
            <>
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="ops-fin-publico">Pessoas atendidas</label>
                <input id="ops-fin-publico" className="aef-ops__input aef-ops__input--short" type="number" min="0" inputMode="numeric" placeholder="Ex: 180" value={rel.publico} onChange={e => setRel(r => ({ ...r, publico: e.target.value }))} />
              </div>
              <fieldset className="aef-ops__field aef-ops__fieldset">
                <legend className="aef-ops__label">O que foi servido ou entregue</legend>
                {rel.servido.map((s, i) => (
                  <div key={i} className="aef-ops__servido-row">
                    <input className="aef-ops__input" aria-label="Item" placeholder="Item" value={s.item} onChange={e => setServido(i, "item", e.target.value)} />
                    <input className="aef-ops__input aef-ops__input--short" aria-label="Quantidade" placeholder="Qtd." value={s.qtd} onChange={e => setServido(i, "qtd", e.target.value)} />
                    <button type="button" className="aef-ops__icon-btn" aria-label={`Tirar ${s.item || "item"}`} onClick={() => setRel(r => ({ ...r, servido: r.servido.filter((_, j) => j !== i) }))}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                ))}
                <button type="button" className="aef-ops__btn aef-ops__btn--quiet aef-ops__btn--start" onClick={() => setRel(r => ({ ...r, servido: [...r.servido, { item: "", qtd: "" }] }))}>
                  <span aria-hidden="true"><Icon name="plus" size={15} /></span>Adicionar item
                </button>
              </fieldset>
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="ops-fin-resumo">Como foi a ação</label>
                <textarea id="ops-fin-resumo" className="aef-ops__textarea" placeholder="O que aconteceu, o que deu certo, o que dá para melhorar na próxima" value={rel.resumo} onChange={e => setRel(r => ({ ...r, resumo: e.target.value }))} />
              </div>
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="ops-fin-ocorr">Ocorrências</label>
                <textarea id="ops-fin-ocorr" className="aef-ops__textarea aef-ops__textarea--short" placeholder="Algum problema, acidente ou situação que a diretoria precisa saber (opcional)" value={rel.ocorrencias} onChange={e => setRel(r => ({ ...r, ocorrencias: e.target.value }))} />
              </div>
              <RegistrosEditor voluntarios={voluntariosAcao} value={registros} onChange={setRegistros} idPrefix="ops-fin" />
              <p className="aef-ops__note">Depois de finalizada, a ação fica travada e entra no histórico de cada pessoa. Só o Super Admin consegue reabrir.</p>
            </>
          )}
          {erro && <p className="aef-ops__error" role="alert">{erro}</p>}
        </div>

        <div className="aef-ops__dialog-foot">
          {passo === 1 ? (
            <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--grow" disabled={faltam > 0} onClick={() => setPasso(2)}>
              Próximo: relatório
            </button>
          ) : (
            <>
              <button type="button" className="aef-ops__btn aef-ops__btn--outline" disabled={busy} onClick={() => setPasso(1)}>Voltar</button>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--grow" disabled={busy} onClick={finalizar}>
                {busy ? "Finalizando…" : "Finalizar ação"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Final report of a finished action ───────────────────────────────────────
export function AcaoRelatorio({ acao, parts, equipe, user }) {
  const nomeDe = useNomeParticipante(equipe);
  const rel = acao.relatorio;
  const [feedbacks, setFeedbacks] = useState(null);
  const [dando, setDando] = useState(false);
  useEffect(() => {
    let alive = true;
    listFeedbacks(acao.id).then(rows => { if (alive) setFeedbacks(rows); }).catch(() => { if (alive) setFeedbacks([]); });
    return () => { alive = false; };
  }, [acao.id]);
  const meu = feedbacks?.find(f => f.membroId === user?.id);
  const organizou = parts.some(p => p.membroId && p.membroId === user?.id);
  if (!rel) {
    return (
      <div className="aef-ops__panel aef-ops__empty">
        <p className="aef-ops__hint">Esta ação foi concluída antes do relatório final existir no AEF Hub.</p>
      </div>
    );
  }
  const vols = parts.filter(p => p.papel === "voluntario");
  const presentes = parts.filter(p => p.presenca === "presente");
  const ausentes = parts.filter(p => p.presenca !== "presente");
  const quando = new Date(rel.finalizadaEm);

  return (
    <div className="aef-ops__panel aef-ops__panel--pad aef-ops__stack aef-ops__relatorio">
      <ul className="aef-ops__figures aef-ops__figures--4">
        <li className="aef-ops__figure"><span className="aef-ops__figure-label">Pessoas atendidas</span><span className="aef-ops__figure-value">{rel.publico ?? "Não informado"}</span></li>
        <li className="aef-ops__figure"><span className="aef-ops__figure-label">Voluntários que foram</span><span className="aef-ops__figure-value">{vols.filter(p => p.presenca === "presente").length} de {vols.length}</span></li>
        <li className="aef-ops__figure"><span className="aef-ops__figure-label">Organizadores</span><span className="aef-ops__figure-value">{parts.filter(p => p.papel === "organizador").length}</span></li>
        <li className="aef-ops__figure" data-tone={parts.some(p => p.presenca === "falta") ? "red" : undefined}><span className="aef-ops__figure-label">Faltas</span><span className="aef-ops__figure-value">{parts.filter(p => p.presenca === "falta").length}</span></li>
      </ul>

      {rel.resumo && <section><h3 className="aef-ops__h3">Como foi</h3><p className="aef-ops__prose">{rel.resumo}</p></section>}

      {rel.servido.length > 0 && (
        <section>
          <h3 className="aef-ops__h3">Servido ou entregue</h3>
          <ul className="aef-ops__servido">
            {rel.servido.map((s, i) => <li key={i}><span>{s.item}</span><span className="aef-ops__servido-qtd">{s.qtd}</span></li>)}
          </ul>
        </section>
      )}

      {rel.ocorrencias && <section><h3 className="aef-ops__h3">Ocorrências</h3><p className="aef-ops__prose aef-ops__note aef-ops__note--amber">{rel.ocorrencias}</p></section>}

      <section>
        <h3 className="aef-ops__h3">Quem foi <span className="aef-ops__count">{presentes.length}</span></h3>
        {presentes.length === 0 ? <p className="aef-ops__hint">Ninguém registrado.</p> : (
          <ul className="aef-ops__names">
            {presentes.map(p => <li key={p.id}>{nomeDe(p).nome}{p.papel === "organizador" && <span className="aef-ops__hint" style={{ marginTop: 0 }}> organizador</span>}</li>)}
          </ul>
        )}
      </section>

      {ausentes.length > 0 && (
        <section>
          <h3 className="aef-ops__h3">Não foram <span className="aef-ops__count">{ausentes.length}</span></h3>
          <ul className="aef-ops__names">
            {ausentes.map(p => {
              const pres = presencaInfo(p.presenca);
              return <li key={p.id}>{nomeDe(p).nome} <span className="aef-ops__tag" data-tone={pres?.[2]}>{pres?.[1]}</span></li>;
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="aef-ops__fin-bar">
          <h3 className="aef-ops__h3">Feedback da equipe <span className="aef-ops__count">{feedbacks?.length ?? ""}</span></h3>
          {organizou && feedbackAberto(acao) && (
            <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => setDando(true)}>{meu ? "Editar meu feedback" : "Dar meu feedback"}</button>
          )}
        </div>
        {feedbacks === null ? <p className="aef-ops__hint">Carregando…</p> : feedbacks.length === 0 ? (
          <p className="aef-ops__hint">{feedbackAberto(acao) ? `Ninguém deu feedback ainda. Fica aberto até ${FEEDBACK_DIAS} dias depois da ação.` : "Nenhum feedback registrado."}</p>
        ) : (
          <ul className="aef-ops__feedbacks">
            {feedbacks.map(f => (
              <li key={f.id}>
                <p className="aef-ops__prose">{f.texto}</p>
                <span className="aef-ops__hint" style={{ marginTop: 0 }}>{f.autor || "Organizador"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {dando && (
        <FeedbackDialog acao={acao} user={user} atual={meu} onClose={() => setDando(false)}
          onSaved={fb => { setFeedbacks(prev => [fb, ...(prev || []).filter(f => f.id !== fb.id)]); setDando(false); }} />
      )}

      <p className="aef-ops__hint">
        Finalizada{rel.finalizadaPor ? ` por ${rel.finalizadaPor}` : ""} em {quando.toLocaleDateString("pt-BR")} às {quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
      </p>
    </div>
  );
}
