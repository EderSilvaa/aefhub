import { useEffect, useState } from "react";
import { getModuleLabel } from "@/lib/access";
import { feedbackAberto, historicoMembro, listFeedbacks } from "@/data/acoes";
import { FeedbackDialog } from "@/modules/AcaoEquipe";
import { C, FONT_BODY } from "@/lib/theme";
import "../profile.css";

// ─── PROFILE DRAWER ──────────────────────────────────────────────────────────
export const CARGOS_OPCOES = [
  "Diretor(a) Geral", "Diretor(a) de Operações", "Diretor(a) Financeiro(a)",
  "Coordenador(a)", "Tech & Marketing", "Comunicação", "Logística",
  "Saúde", "Jurídico", "Educação", "Voluntário(a)", "Outro",
];

export function Profile({ user, onClose, onLogout, onUpdateUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    email: user.email || "",
    telefone: user.telefone || user.phone || "",
    cidade: user.cidade || user.city || "",
  });
  const [draft, setDraft] = useState({ ...form });

  useEffect(() => {
    const nextForm = {
      email: user.email || "",
      telefone: user.telefone || user.phone || "",
      cidade: user.cidade || user.city || "",
    };
    setForm(nextForm);
    setDraft(nextForm);
    setEditing(false);
  }, [user]);

  // the member's own actions, from Operações (organized, took part, coming up)
  const [historico, setHistorico] = useState(null);
  const [meusFeedbacks, setMeusFeedbacks] = useState([]);
  const [feedbackDe, setFeedbackDe] = useState(null);
  useEffect(() => {
    let alive = true;
    historicoMembro(user.id).then(rows => { if (alive) setHistorico(rows); }).catch(() => { if (alive) setHistorico([]); });
    listFeedbacks().then(rows => { if (alive) setMeusFeedbacks(rows.filter(f => f.membroId === user.id)); }).catch(() => {});
    return () => { alive = false; };
  }, [user.id]);
  const feedbackDoUsuario = acaoId => meusFeedbacks.find(f => f.acaoId === acaoId);

  const feitas = (historico || []).filter(h => h.status === "concluída" && h.presenca === "presente");
  const profileStats = [
    { label: "Ações organizadas", value: historico ? feitas.filter(h => h.papel === "organizador").length : "…" },
    { label: "Ações como voluntário", value: historico ? feitas.filter(h => h.papel === "voluntario").length : "…" },
    { label: "Próximas ações", value: historico ? historico.filter(h => h.status !== "concluída").length : "…" },
    { label: "Última ação", value: feitas[0]?.data || "Nenhuma" },
  ];

  const inputStyle = {
    width: "100%", padding: "9px 12px",
    border: `1.5px solid ${C.red}`, borderRadius: 8,
    fontSize: 13, color: C.text, background: "#FEF2F2",
    outline: "none", fontFamily: FONT_BODY, boxSizing: "border-box",
  };

  const handleSave = () => {
    const novoForm = { ...draft };
    setForm(novoForm);
    onUpdateUser({
      ...user,
      email: novoForm.email,
      telefone: novoForm.telefone,
      phone: novoForm.telefone,
      cidade: novoForm.cidade,
      city: novoForm.cidade,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({ ...form });
    setEditing(false);
  };

  return (
    <>
      <div className="aef-prof__scrim" onClick={onClose} />

      <aside className="aef-prof" role="dialog" aria-modal="true" aria-labelledby="prof-name">
        <header className="aef-prof__head">
          <div className="aef-prof__head-top">
            <span className="aef-prof__avatar" aria-hidden="true">{user.initials}</span>
            <button type="button" className="aef-prof__close" onClick={onClose}>Fechar</button>
          </div>
          <h2 id="prof-name" className="aef-prof__name">{user.name}</h2>
          <div className="aef-prof__tags">
            <span className="aef-prof__tag">{user.profileLabel}</span>
            <span className="aef-prof__tag">{user.department}</span>
            <span className="aef-prof__org">Amor em Foco</span>
          </div>
        </header>

        <ul className="aef-prof__figures">
          {profileStats.map((s, i) => (
            <li key={i} className="aef-prof__figure">
              <span className="aef-prof__figure-value">{s.value}</span>
              <span className="aef-prof__figure-label">{s.label}</span>
            </li>
          ))}
        </ul>

        <div className="aef-prof__body">
          <section className="aef-prof__section" aria-labelledby="prof-info">
            <div className="aef-prof__section-head">
              <h3 id="prof-info" className="aef-prof__h3">Informações</h3>
              {!editing && (
                <button type="button" className="aef-prof__link" onClick={() => setEditing(true)}>Editar</button>
              )}
            </div>

            <dl className="aef-prof__info">
              <div className="aef-prof__row"><dt>Nome completo</dt><dd>{user.name}</dd></div>
              <div className="aef-prof__row"><dt>Perfil de acesso</dt><dd>{user.profileLabel}</dd></div>
              <div className="aef-prof__row"><dt>Cargo</dt><dd>{user.position}</dd></div>
              <div className="aef-prof__row"><dt>Área principal</dt><dd>{user.department}</dd></div>
              {[
                { key: "email", label: "E-mail" },
                { key: "telefone", label: "Telefone" },
                { key: "cidade", label: "Cidade" },
              ].map((f) => (
                editing ? (
                  <div key={f.key} className="aef-prof__row aef-prof__row--edit">
                    <label htmlFor={`prof-${f.key}`}>{f.label}</label>
                    <input
                      id={`prof-${f.key}`}
                      className="aef-prof__input"
                      type={f.key === "email" ? "email" : f.key === "telefone" ? "tel" : "text"}
                      value={draft[f.key]}
                      onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                    />
                  </div>
                ) : (
                  <div key={f.key} className="aef-prof__row"><dt>{f.label}</dt><dd>{form[f.key]}</dd></div>
                )
              ))}
            </dl>
          </section>

          <section className="aef-prof__section" aria-labelledby="prof-acoes">
            <h3 id="prof-acoes" className="aef-prof__h3">Minhas ações</h3>
            {historico === null ? <p className="aef-prof__muted">Carregando…</p> : historico.length === 0 ? (
              <p className="aef-prof__muted">Quando você for escalado numa ação em Operações, ela aparece aqui.</p>
            ) : (
              <ul className="aef-prof__info aef-prof__hist">
                {historico.map(h => (
                  <li key={h.acaoId} className="aef-prof__row">
                    <span><strong>{h.nome}</strong><span className="aef-prof__muted"> {h.data}</span></span>
                    {h.papel === "organizador" && h.presenca === "presente" && feedbackAberto(h) ? (
                      <button type="button" className="aef-prof__link" onClick={() => setFeedbackDe(h)}>
                        {feedbackDoUsuario(h.acaoId) ? "Editar feedback" : "Dar feedback"}
                      </button>
                    ) : (
                      <span className="aef-prof__muted">
                        {h.status !== "concluída" ? "Escalado" : h.presenca === "presente" ? (h.papel === "organizador" ? "Organizou" : "Participou") : h.presenca === "justificada" ? "Justificou" : "Faltou"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {feedbackDe && (
            <FeedbackDialog acao={{ id: feedbackDe.acaoId, nome: feedbackDe.nome }} user={user} atual={feedbackDoUsuario(feedbackDe.acaoId)}
              onClose={() => setFeedbackDe(null)}
              onSaved={fb => { setMeusFeedbacks(prev => [fb, ...prev.filter(f => f.id !== fb.id)]); setFeedbackDe(null); }} />
          )}

          <section className="aef-prof__section" aria-labelledby="prof-modules">
            <h3 id="prof-modules" className="aef-prof__h3">Módulos liberados</h3>
            <ul className="aef-prof__modules">
              {user.allowedModules.map(moduleId => (
                <li key={moduleId} className="aef-prof__module">{getModuleLabel(moduleId)}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="aef-prof__actions">
          {editing ? (
            <>
              <button type="button" className="aef-prof__btn aef-prof__btn--primary" onClick={handleSave}>Salvar alterações</button>
              <button type="button" className="aef-prof__btn aef-prof__btn--outline" onClick={handleCancel}>Cancelar</button>
            </>
          ) : (
            <button type="button" className="aef-prof__btn aef-prof__btn--danger" onClick={onLogout}>Sair da conta</button>
          )}
        </div>
      </aside>
    </>
  );
}
