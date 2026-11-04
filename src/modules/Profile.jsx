import { useEffect, useState } from "react";
import { getModuleLabel } from "@/lib/access";
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

  const profileStats = [
    { label: "Ações participadas", value: "23" },
    { label: "Voluntários gerenciados", value: "134" },
    { label: "Meses na ONG", value: "18" },
    { label: "Posts criados", value: "47" },
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
