import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ACCESS_PROFILES, NAV_ITEMS, normalizeEmail, sanitizeAllowedModules } from "@/lib/access";
import { C, FONT_BODY, FONT_DISPLAY } from "@/lib/theme";

export function createAccessDraft(user) {
  return {
    id: user?.id || null,
    name: user?.name || "",
    email: user?.email || "",
    password: user?.password || "amor123",
    profileId: user?.profileId || "marketing",
    position: user?.position || "",
    department: user?.department || ACCESS_PROFILES[user?.profileId || "marketing"]?.department || "",
    phone: user?.phone || "",
    city: user?.city || "",
    active: user?.active !== false,
    allowedModules: user?.allowedModules ? [...user.allowedModules] : [...(ACCESS_PROFILES[user?.profileId || "marketing"]?.modules || ["dashboard"])],
  };
}

export function Acessos({ currentUser, users, onSaveUser, onToggleUserStatus, onResetUsers }) {
  // without a reset there is no local demo directory: the list is the database's members table
  const remote = !onResetUsers;
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(users[0]?.id || null);
  const [draft, setDraft] = useState(() => createAccessDraft(users[0]));
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!users.length) {
      setSelectedId(null);
      setDraft(createAccessDraft());
      return;
    }
    // a new user form has no selection on purpose: don't snap back to the first user
    if (creating) return;
    const selected = users.find(item => item.id === selectedId);
    if (!selected) {
      setSelectedId(users[0].id);
      setDraft(createAccessDraft(users[0]));
      setCreating(false);
      return;
    }
    if (!creating) setDraft(createAccessDraft(selected));
  }, [users, selectedId, creating]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(""), 2500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const filteredUsers = users.filter(item => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [item.name, item.email, item.position, ACCESS_PROFILES[item.profileId]?.label]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(term));
  });

  const selectedUser = users.find(item => item.id === selectedId) || null;
  const activeUsers = users.filter(item => item.active).length;
  const customAccessCount = users.filter(item => {
    const base = ACCESS_PROFILES[item.profileId]?.modules || [];
    return JSON.stringify([...item.allowedModules].sort()) !== JSON.stringify([...base].sort());
  }).length;

  const startCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setDraft(createAccessDraft());
    setFeedback("");
  };

  const startEdit = user => {
    setCreating(false);
    setSelectedId(user.id);
    setDraft(createAccessDraft(user));
    setFeedback("");
  };

  const handleProfileChange = profileId => {
    const profile = ACCESS_PROFILES[profileId] || ACCESS_PROFILES.marketing;
    setDraft(prev => ({
      ...prev,
      profileId,
      department: prev.department || profile.department,
      allowedModules: [...profile.modules],
      position: prev.position || profile.label,
    }));
  };

  const toggleModule = moduleId => {
    setDraft(prev => {
      const hasModule = prev.allowedModules.includes(moduleId);
      const nextModules = hasModule
        ? prev.allowedModules.filter(item => item !== moduleId)
        : [...prev.allowedModules, moduleId];
      return {
        ...prev,
        allowedModules: sanitizeAllowedModules(nextModules, ["dashboard"]),
      };
    });
  };

  const handleSave = async () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      setFeedback("Preencha nome e e-mail antes de salvar.");
      return;
    }
    if (!draft.allowedModules.length) {
      setFeedback("Selecione pelo menos um modulo liberado.");
      return;
    }
    const duplicate = users.find(item => normalizeEmail(item.email) === normalizeEmail(draft.email) && item.id !== draft.id);
    if (duplicate) {
      setFeedback("Ja existe um usuario com este e-mail.");
      return;
    }
    const wasCreating = creating;
    setSaving(true);
    const result = await onSaveUser(draft);
    setSaving(false);
    if (result && !result.ok) {
      setFeedback(result.message);
      return;
    }
    setCreating(false);
    if (result?.id) setSelectedId(result.id);
    setFeedback(remote && wasCreating
      ? "Acesso liberado. A pessoa já pode entrar com a conta Google deste e-mail."
      : "Acesso salvo com sucesso.");
  };

  const handleToggle = async () => {
    if (selectedUser.id === currentUser.id) {
      setFeedback("Desative esta conta por outro administrador para evitar perder o acesso atual.");
      return;
    }
    setSaving(true);
    const result = await onToggleUserStatus(selectedUser.id);
    setSaving(false);
    if (result && !result.ok) setFeedback(result.message);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: C.text, marginBottom: 6 }}>Central de Acessos</div>
          <div style={{ color: C.textSecondary, fontSize: 14, maxWidth: 760, lineHeight: 1.6 }}>
            {remote
              ? "Quem está nesta lista e ativo entra no AEF Hub com a conta Google do e-mail cadastrado, vendo só os módulos liberados."
              : "Gestao front-first de usuarios, perfis e modulos liberados. Ideal para desenhar a operacao antes da integracao com backend."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={startCreate} style={{ background: C.red, color: C.white, border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Novo usuario
          </button>
          {!remote && (
          <button onClick={() => { onResetUsers(); setFeedback("Diretorio restaurado para o padrao."); }} style={{ background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Restaurar padrao
          </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Usuarios cadastrados", value: String(users.length) },
          { label: "Usuarios ativos", value: String(activeUsers) },
          { label: "Perfis em uso", value: String(new Set(users.map(item => item.profileId)).size) },
          { label: "Acessos customizados", value: String(customAccessCount) },
        ].map(card => (
          <div key={card.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ color: C.textTertiary, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>{card.label}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: C.text }}>{card.value}</div>
          </div>
        ))}
      </div>

      {feedback && (
        <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 12, background: "#FFF7ED", border: "1px solid rgba(180,83,9,0.22)", color: "#9A3412", fontSize: 13, fontWeight: 600 }}>
          {feedback}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 420px) minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textTertiary, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Diretorio de usuarios</div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou perfil..."
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: FONT_BODY, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ maxHeight: 620, overflowY: "auto", padding: 10 }}>
            {filteredUsers.map(item => {
              const selected = item.id === selectedId && !creating;
              return (
                <button
                  key={item.id}
                  onClick={() => startEdit(item)}
                  style={{
                    width: "100%", textAlign: "left", border: selected ? `1px solid ${C.red}` : `1px solid ${C.border}`,
                    background: selected ? "#FFF5F5" : C.white, borderRadius: 14, padding: "14px 14px 12px",
                    marginBottom: 10, cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>{item.email}</div>
                    </div>
                    <span style={{
                      background: item.active ? "rgba(22,163,74,0.12)" : "rgba(148,163,184,0.15)",
                      color: item.active ? "#166534" : "#475569",
                      padding: "4px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase",
                    }}>
                      {item.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: C.red, background: "#FFF1F2", borderRadius: 999, padding: "4px 8px", fontWeight: 600 }}>{ACCESS_PROFILES[item.profileId]?.label || item.profileId}</span>
                    <span style={{ fontSize: 11, color: C.textSecondary, background: C.bg, borderRadius: 999, padding: "4px 8px", fontWeight: 600 }}>{item.department}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.textSecondary }}>{item.position || "Sem cargo definido"}</div>
                </button>
              );
            })}
            {!filteredUsers.length && (
              <div style={{ padding: 18, color: C.textSecondary, fontSize: 13 }}>Nenhum usuario encontrado para esse filtro.</div>
            )}
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.text, marginBottom: 4 }}>
                {creating ? "Novo usuario" : selectedUser ? selectedUser.name : "Configurar acesso"}
              </div>
              <div style={{ color: C.textSecondary, fontSize: 13 }}>
                {creating ? "Defina o perfil inicial e os modulos liberados." : "Ajuste perfil, area, status e modulos disponiveis para esse usuario."}
              </div>
            </div>
            {!creating && selectedUser && (
              <button
                onClick={handleToggle}
                disabled={saving}
                style={{
                  background: selectedUser.active ? "rgba(148,163,184,0.12)" : "rgba(22,163,74,0.12)",
                  color: selectedUser.active ? "#475569" : "#166534",
                  border: "none", borderRadius: 10, padding: "11px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                {selectedUser.active ? "Desativar usuario" : "Reativar usuario"}
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {[
              { label: "Nome completo", key: "name", type: "text", placeholder: "Ex: Julia Souza" },
              { label: "E-mail", key: "email", type: "email", placeholder: "julia@amoremfoco.org" },
              { label: "Senha temporaria", key: "password", type: "text", placeholder: "amor123" },
              { label: "Cargo", key: "position", type: "text", placeholder: "Coordenadora Financeira" },
              { label: "Area", key: "department", type: "text", placeholder: "Financeiro" },
              { label: "Telefone", key: "phone", type: "text", placeholder: "(91) 9 0000-0000" },
              { label: "Cidade", key: "city", type: "text", placeholder: "Belem, PA" },
            ].filter(field => !(remote && field.key === "password")).map(field => (
              <div key={field.key}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>{field.label}</div>
                <input
                  type={field.type}
                  value={draft[field.key]}
                  placeholder={field.placeholder}
                  onChange={e => setDraft(prev => ({ ...prev, [field.key]: e.target.value }))}
                  style={{ width: "100%", padding: "12px 13px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: FONT_BODY, boxSizing: "border-box" }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>Perfil</div>
              <select
                value={draft.profileId}
                onChange={e => handleProfileChange(e.target.value)}
                style={{ width: "100%", padding: "12px 13px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: FONT_BODY }}
              >
                {Object.entries(ACCESS_PROFILES).map(([id, profile]) => (
                  <option key={id} value={id}>{profile.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>Status</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }}>
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={e => setDraft(prev => ({ ...prev, active: e.target.checked }))}
                />
                <span style={{ fontSize: 13, color: C.text }}>{draft.active ? "Usuario ativo" : "Usuario inativo"}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary }}>Modulos liberados</div>
                <div style={{ fontSize: 12, color: C.textTertiary }}>Voce pode manter o perfil padrao ou customizar o acesso por usuario.</div>
              </div>
              <button
                onClick={() => setDraft(prev => ({ ...prev, allowedModules: [...(ACCESS_PROFILES[prev.profileId]?.modules || ["dashboard"])] }))}
                style={{ background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Usar padrao do perfil
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {NAV_ITEMS.map(item => (
                <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12, border: `1px solid ${C.border}`, background: draft.allowedModules.includes(item.id) ? "#FFF5F5" : C.bg, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={draft.allowedModules.includes(item.id)}
                    onChange={() => toggleModule(item.id)}
                  />
                  <Icon name={item.icon} size={16} color={draft.allowedModules.includes(item.id) ? C.red : C.textSecondary} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
            <button onClick={handleSave} disabled={saving} aria-busy={saving} style={{ background: C.red, color: C.white, border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Salvando…" : creating ? "Criar usuario" : "Salvar alteracoes"}
            </button>
            <button
              onClick={() => {
                if (creating) {
                  const firstUser = users[0] || null;
                  setCreating(false);
                  setSelectedId(firstUser?.id || null);
                  setDraft(createAccessDraft(firstUser));
                } else if (selectedUser) {
                  setDraft(createAccessDraft(selectedUser));
                }
                setFeedback("");
              }}
              style={{ background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
