import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useVoluntarios } from "@/data/VoluntariosContext";
import { acaoErrorMessage, addParticipacao, finalizarAcao, removeParticipacao, volId } from "@/data/acoes";

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
        "Ninguém da organização escalado ainda.")}
      {grupo("Voluntários", "voluntario",
        <PessoaPicker id="ops-add-vol" label="Adicionar voluntário" options={opcoesVols} onPick={adicionar} disabled={busy} />,
        "Nenhum voluntário escalado ainda. Depois do sorteio, adicione aqui quem vai.")}
    </div>
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
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");

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
      onDone(updated);
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
export function AcaoRelatorio({ acao, parts, equipe }) {
  const nomeDe = useNomeParticipante(equipe);
  const rel = acao.relatorio;
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

      <p className="aef-ops__hint">
        Finalizada{rel.finalizadaPor ? ` por ${rel.finalizadaPor}` : ""} em {quando.toLocaleDateString("pt-BR")} às {quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
      </p>
    </div>
  );
}
