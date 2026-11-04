import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { useVoluntariosActions } from "@/data/VoluntariosContext";
import { getSaude, removeFoto, saveSaude, SEM_AREA, updateVoluntario, uploadFoto, voluntarioErrorMessage } from "@/data/voluntarios";

export const STATUS_VOLUNTARIO = [
  ["novo", "Novo cadastro", "blue"],
  ["ativo", "Ativo", "green"],
  ["inativo", "Inativo", "neutral"],
  ["penalizado", "Penalizado", "red"],
];
export const statusInfo = status => STATUS_VOLUNTARIO.find(([id]) => id === status) || STATUS_VOLUNTARIO[0];

// Photo when there is one, initials otherwise.
export function VolAvatar({ person, url, size = "sm" }) {
  return (
    <span className={`aef-vol__avatar aef-vol__avatar--${size}`} aria-hidden="true">
      {url ? <img src={url} alt="" /> : person.initials}
    </span>
  );
}

// database rows carry status; the demo sample only has flags
const statusDe = person => person.status || (person.penalizado ? "penalizado" : person.novato ? "novo" : person.verified ? "ativo" : "inativo");

const formatDate = iso => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");

export function VoluntarioFicha({ person, canEdit, areas, onClose }) {
  const actions = useVoluntariosActions();
  const editable = canEdit && !!actions;
  const fotoUrl = actions?.fotoUrls[person.fotoPath];
  const fileRef = useRef(null);
  const [draft, setDraft] = useState({ area: person.rawArea ?? (person.area === SEM_AREA ? "" : person.area), formacao: person.formation || "", status: statusDe(person), observacoes: person.observacoes || person.motivoPenalidade || "" });
  const [saude, setSaude] = useState({ loaded: false, text: "", draft: "" });
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => { actions?.requestFotos([person.fotoPath]); }, [actions, person.fotoPath]);

  useEffect(() => {
    if (!editable) return;
    let alive = true;
    getSaude(person.id)
      .then(text => { if (alive) setSaude({ loaded: true, text, draft: text }); })
      .catch(() => { if (alive) setSaude({ loaded: true, text: "", draft: "" }); });
    return () => { alive = false; };
  }, [editable, person.id]);

  useEffect(() => {
    const onKey = event => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = async (label, task, okMessage) => {
    setBusy(label);
    setFeedback("");
    try {
      await task();
      setFeedback(okMessage);
    } catch (error) {
      setFeedback(voluntarioErrorMessage(error));
    }
    setBusy("");
  };

  const save = () => run("salvar", async () => {
    const updated = await updateVoluntario(person.id, {
      area: draft.area.trim() || null,
      formacao: draft.formacao.trim() || null,
      status: draft.status,
      observacoes: draft.observacoes.trim() || null,
    });
    actions.replace(updated);
    if (saude.loaded && saude.draft.trim() !== saude.text) {
      const text = await saveSaude(person.id, saude.draft);
      setSaude({ loaded: true, text, draft: text });
    }
  }, "Ficha salva.");

  const pickPhoto = event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    run("foto", async () => {
      const updated = await uploadFoto(person, file);
      actions.replace(updated);
      actions.requestFotos([updated.fotoPath]);
    }, "Foto atualizada.");
  };

  const dropPhoto = () => run("foto", async () => {
    actions.replace(await removeFoto(person));
  }, "Foto removida.");

  const [, label, tone] = statusInfo(draft.status);
  const penalizado = draft.status === "penalizado";

  return (
    <>
      <div className="aef-vol__scrim" onClick={onClose} />
      <aside className="aef-vol" role="dialog" aria-modal="true" aria-labelledby="vol-ficha-nome">
        <header className="aef-vol__head">
          <div className="aef-vol__photo">
            <VolAvatar person={person} url={fotoUrl} size="lg" />
            {editable && (
              <div className="aef-vol__photo-actions">
                <button type="button" className="aef-rh__btn aef-rh__btn--outline" disabled={!!busy} onClick={() => fileRef.current?.click()}>
                  {busy === "foto" ? "Enviando…" : person.fotoPath ? "Trocar foto" : "Adicionar foto"}
                </button>
                {person.fotoPath && <button type="button" className="aef-rh__btn aef-rh__btn--link" disabled={!!busy} onClick={dropPhoto}>Remover</button>}
                <input ref={fileRef} className="aef-vol__file" type="file" accept="image/*" onChange={pickPhoto} />
              </div>
            )}
          </div>
          <div className="aef-vol__title">
            <h2 id="vol-ficha-nome" className="aef-vol__name">{person.name}</h2>
            <div className="aef-vol__tags">
              <span className="aef-vol__tag" data-tone={tone}>{label}</span>
              <span className="aef-rh__sector" data-tone="neutral">{draft.area || SEM_AREA}</span>
            </div>
          </div>
          <button type="button" className="aef-rh__btn aef-rh__btn--outline" onClick={onClose}>Fechar</button>
        </header>

        <div className="aef-vol__body">
          {penalizado && draft.observacoes && !editable && <p className="aef-vol__alert">{draft.observacoes}</p>}

          <section className="aef-vol__section">
            <h3 className="aef-vol__h3">Na AEF</h3>
            <dl className="aef-vol__info">
              <div><dt>Última ação</dt><dd>Nenhuma ação registrada</dd></div>
              <div><dt>Ações</dt><dd>{person.actions || 0}</dd></div>
            </dl>
          </section>

          <section className="aef-vol__section">
            <h3 className="aef-vol__h3">Cadastro</h3>
            <dl className="aef-vol__info">
              {person.idadeCadastro && <div><dt>Idade no cadastro</dt><dd>{person.idadeCadastro} anos</dd></div>}
              {person.cadastradoEm && <div><dt>Cadastrado em</dt><dd>{formatDate(person.cadastradoEm)}</dd></div>}
              <div><dt>Contato de emergência</dt><dd>{person.telefone || "Não informado"}</dd></div>
              {person.comoConheceu && <div><dt>Como conheceu</dt><dd>{person.comoConheceu}</dd></div>}
            </dl>
          </section>

          {editable ? (
            <section className="aef-vol__section aef-vol__form">
              <h3 className="aef-vol__h3">Acompanhamento do RH</h3>
              <div className="aef-rh__field">
                <label className="aef-rh__label" htmlFor="vol-status">Status</label>
                <select id="vol-status" className="aef-rh__select" value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}>
                  {STATUS_VOLUNTARIO.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
                </select>
              </div>
              <div className="aef-rh__field">
                <label className="aef-rh__label" htmlFor="vol-area">Área</label>
                <input id="vol-area" className="aef-rh__input" list="vol-areas" value={draft.area} onChange={e => setDraft(d => ({ ...d, area: e.target.value }))} placeholder="Ex.: Alimentação" />
                <datalist id="vol-areas">{areas.map(area => <option key={area} value={area} />)}</datalist>
              </div>
              <div className="aef-rh__field">
                <label className="aef-rh__label" htmlFor="vol-formacao">Formação</label>
                <input id="vol-formacao" className="aef-rh__input" value={draft.formacao} onChange={e => setDraft(d => ({ ...d, formacao: e.target.value }))} placeholder="Ex.: Enfermagem" />
              </div>
              <div className="aef-rh__field">
                <label className="aef-rh__label" htmlFor="vol-obs">{penalizado ? "Motivo da penalidade" : "Observações"}</label>
                <textarea id="vol-obs" className="aef-rh__textarea" value={draft.observacoes} onChange={e => setDraft(d => ({ ...d, observacoes: e.target.value }))} placeholder={penalizado ? "O que aconteceu e o que foi combinado" : "Algo que o RH precisa lembrar"} />
              </div>
              <div className="aef-rh__field">
                <label className="aef-rh__label" htmlFor="vol-saude">Saúde (só RH vê)</label>
                <textarea id="vol-saude" className="aef-rh__textarea" disabled={!saude.loaded} value={saude.draft} onChange={e => setSaude(s => ({ ...s, draft: e.target.value }))} placeholder={saude.loaded ? "Doença, deficiência, alergia ou medicamento" : "Carregando…"} />
              </div>
            </section>
          ) : null}

          {feedback && <p className="aef-vol__feedback" role="status">{feedback}</p>}
        </div>

        {editable && (
          <div className="aef-vol__foot">
            <button type="button" className="aef-rh__btn aef-rh__btn--outline" onClick={onClose}>Cancelar</button>
            <button type="button" className="aef-rh__btn aef-rh__btn--primary" disabled={!!busy} onClick={save}>{busy === "salvar" ? "Salvando…" : "Salvar ficha"}</button>
          </div>
        )}
      </aside>
    </>
  );
}

export default VoluntarioFicha;
