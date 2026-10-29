import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import "./login.css";
import "./dashboard.css";
import "./rh.css";
import "./juridico.css";
import "./marketing.css";
import "./operacoes.css";
import "./financeiro.css";
import "./nav.css";
import "./profile.css";

const C = {
  red: "#D70D16",
  redDark: "#851811",
  white: "#FFFFFF",
  bg: "#F5F5F7",
  surface: "#FFFFFF",
  border: "#E8E8ED",
  borderLight: "#F2F2F7",
  text: "#1D1D1F",
  textSecondary: "#6E6E73",
  textTertiary: "#AEAEB2",
  black: "#000000",
};

const FONT_BODY = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_DISPLAY = "'Gagalin', 'Outfit', sans-serif";
const SESSION_STORAGE_KEY = "aef_session_v1";
const USERS_STORAGE_KEY = "aef_users_v1";
const MODULE_IDS = ["dashboard", "rh", "operacoes", "financeiro", "marketing", "juridico"];

const ACCESS_PROFILES = {
  super_admin: {
    label: "Super Admin",
    department: "Governança",
    modules: ["dashboard", "rh", "operacoes", "financeiro", "marketing", "juridico"],
  },
  diretoria: {
    label: "Diretoria",
    department: "Diretoria",
    modules: ["dashboard", "rh", "operacoes", "financeiro", "marketing", "juridico"],
  },
  financeiro: {
    label: "Financeiro",
    department: "Financeiro",
    modules: ["dashboard", "financeiro", "juridico"],
  },
  rh: {
    label: "RH",
    department: "Recursos Humanos",
    modules: ["dashboard", "rh", "operacoes"],
  },
  operacoes: {
    label: "Operacoes",
    department: "Operacoes",
    modules: ["dashboard", "operacoes", "rh"],
  },
  marketing: {
    label: "Marketing",
    department: "Marketing",
    modules: ["dashboard", "marketing"],
  },
  juridico: {
    label: "Juridico",
    department: "Juridico",
    modules: ["dashboard", "juridico", "financeiro"],
  },
};

const DEMO_USERS = [
  { id: 1, name: "Eder Silva", email: "eder@amoremfoco.org", password: "amor123", profileId: "super_admin", position: "Administrador da Plataforma", city: "Belem, PA", phone: "(91) 9 9999-9999" },
  { id: 2, name: "Camila Rocha", email: "camila.financeiro@amoremfoco.org", password: "amor123", profileId: "financeiro", position: "Coordenadora Financeira", city: "Belem, PA", phone: "(91) 9 8811-2244" },
  { id: 3, name: "Matheus Lima", email: "matheus.rh@amoremfoco.org", password: "amor123", profileId: "rh", position: "Analista de RH", city: "Ananindeua, PA", phone: "(91) 9 8822-3344" },
  { id: 4, name: "Flavia Moraes", email: "flavia.operacoes@amoremfoco.org", password: "amor123", profileId: "operacoes", position: "Coordenadora de Operacoes", city: "Belem, PA", phone: "(91) 9 8833-4455" },
  { id: 5, name: "Duda Martins", email: "duda.marketing@amoremfoco.org", password: "amor123", profileId: "marketing", position: "Coordenadora de Marketing", city: "Belem, PA", phone: "(91) 9 8844-5566" },
  { id: 6, name: "Alan Carvalho", email: "alan.juridico@amoremfoco.org", password: "amor123", profileId: "juridico", position: "Consultor Juridico", city: "Belem, PA", phone: "(91) 9 8855-6677" },
  { id: 7, name: "Rebeca Souza", email: "rebeca.diretoria@amoremfoco.org", password: "amor123", profileId: "diretoria", position: "Diretora Executiva", city: "Belem, PA", phone: "(91) 9 8866-7788" },
];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("");
}

function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

function sanitizeAllowedModules(modules, fallbackModules = []) {
  const source = Array.isArray(modules) && modules.length ? modules : fallbackModules;
  return [...new Set(source.filter(moduleId => MODULE_IDS.includes(moduleId)))];
}

function buildManagedUser(account) {
  const resolvedProfileId = ACCESS_PROFILES[account.profileId] ? account.profileId : "marketing";
  const profile = ACCESS_PROFILES[resolvedProfileId];
  return {
    id: account.id,
    name: (account.name || "").trim(),
    email: normalizeEmail(account.email),
    password: account.password || "amor123",
    initials: account.initials || getInitials(account.name),
    profileId: resolvedProfileId,
    profileLabel: profile.label,
    position: (account.position || profile.label).trim(),
    department: (account.department || profile.department).trim(),
    phone: account.phone || account.telefone || "",
    city: account.city || account.cidade || "",
    active: account.active !== false,
    allowedModules: sanitizeAllowedModules(account.allowedModules, profile.modules),
    createdAt: account.createdAt || new Date().toISOString(),
  };
}

function buildUserSession(account) {
  const managed = buildManagedUser(account);
  const profile = ACCESS_PROFILES[managed.profileId] || ACCESS_PROFILES.super_admin;
  return {
    id: managed.id,
    name: managed.name,
    email: managed.email,
    initials: managed.initials,
    role: managed.position || profile.label,
    position: managed.position || profile.label,
    profileId: managed.profileId,
    profileLabel: profile.label,
    department: managed.department || profile.department,
    area: managed.department || profile.department,
    phone: managed.phone || "",
    telefone: managed.phone || "",
    city: managed.city || "",
    cidade: managed.city || "",
    active: managed.active,
    allowedModules: sanitizeAllowedModules(managed.allowedModules, profile.modules),
  };
}

function getSeedUsers() {
  return DEMO_USERS.map(buildManagedUser);
}

function restoreUserDirectory() {
  if (typeof window === "undefined") return getSeedUsers();
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "null");
    if (!Array.isArray(stored) || stored.length === 0) return getSeedUsers();
    return stored.map(buildManagedUser);
  } catch {
    return getSeedUsers();
  }
}

function persistUserDirectory(users) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function clearUserDirectory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USERS_STORAGE_KEY);
}

function restoreUserSession() {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
    if (!stored?.profileId || !stored?.email || !stored?.name) return null;
    return buildUserSession(stored);
  } catch {
    return null;
  }
}

function persistUserSession(user) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

function clearUserSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.5 }) => {
  const paths = {
    home: <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    building: <><path d="M3 21h18"/><path d="M6 21V4h12v17"/><path d="M9 8h2"/><path d="M13 8h2"/><path d="M9 12h2"/><path d="M13 12h2"/><path d="M10 21v-5h4v5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="3" y1="9" x2="21" y2="9"/></>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 118 0v3"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
    upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin, usersDirectory }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const demoAccounts = usersDirectory.filter(account => account.active).slice(0, 5);

  const submit = () => {
    if (!email || !pass) { setErr("Preencha todos os campos"); return; }
    const account = usersDirectory.find(item => normalizeEmail(item.email) === normalizeEmail(email));
    if (!account) { setErr("E-mail nao cadastrado. Cadastre o usuario no diretório de acessos."); return; }
    if (!account.active) { setErr("Este usuario esta inativo. Reative o acesso na central de acessos."); return; }
    if (pass !== account.password) { setErr("Senha invalida. Use a senha temporaria do ambiente de demonstracao."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(buildUserSession(account)); }, 900);
  };

  return (
    <div className="aef-login">
      <section className="aef-login__brand" aria-label="Amor em Foco">
        <img className="aef-login__logo" src="/logo-branco.png" alt="Amor em Foco" />
        <div>
          <p className="aef-login__statement">Organização a serviço do amor.</p>
          <p className="aef-login__purpose">Plataforma interna de gestão.</p>
        </div>
      </section>

      <main className="aef-login__main">
        <div className="aef-login__panel">
          <header>
            <h1 className="aef-login__title">Entrar na plataforma</h1>
            <p className="aef-login__sub">Acesso restrito por perfil, área e permissão.</p>
          </header>

          <div className="aef-login__fields">
            {[
              { id: "aef-login-email", label: "E-mail", type: "email", autoComplete: "username", value: email, set: setEmail, placeholder: "nome@amoremfoco.org" },
              { id: "aef-login-senha", label: "Senha", type: "password", autoComplete: "current-password", value: pass, set: setPass, placeholder: "••••••••" },
            ].map(f => (
              <div key={f.label} className="aef-login__field">
                <label className="aef-login__label" htmlFor={f.id}>{f.label}</label>
                <input
                  id={f.id} name={f.id} className="aef-login__input"
                  type={f.type} value={f.value} placeholder={f.placeholder} autoComplete={f.autoComplete}
                  aria-invalid={err ? "true" : undefined}
                  aria-describedby={err ? "aef-login-erro" : undefined}
                  onChange={e => { f.set(e.target.value); setErr(""); }}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
              </div>
            ))}

            {err && (
              <p id="aef-login-erro" className="aef-login__error" role="alert">{err}</p>
            )}

            <button type="button" className="aef-login__submit" onClick={submit} disabled={loading} aria-busy={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </div>

          <section className="aef-login__demo" aria-labelledby="aef-login-demo">
            <h2 id="aef-login-demo" className="aef-login__demo-title">Ambiente de demonstração</h2>
            <p className="aef-login__demo-note">
              Senha temporária: <strong>amor123</strong>
            </p>
            <ul className="aef-login__profiles">
              {demoAccounts.map(account => (
                <li key={account.id}>
                  <button
                    type="button"
                    className="aef-login__profile"
                    aria-pressed={normalizeEmail(email) === normalizeEmail(account.email)}
                    disabled={loading}
                    onClick={() => { setEmail(account.email); setPass(account.password); setErr(""); }}
                  >
                    <span className="aef-login__profile-name">{account.name}</span>
                    <span className="aef-login__profile-role">{ACCESS_PROFILES[account.profileId]?.label || "Perfil"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <p className="aef-login__help">
            Problemas de acesso? Fale com o Super Admin ou ajuste o perfil do usuário.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "home", label: "Dashboard" },
  { id: "rh", icon: "users", label: "RH" },
  { id: "operacoes", icon: "settings", label: "Operações" },
  { id: "financeiro", icon: "dollar", label: "Financeiro" },
  { id: "marketing", icon: "camera", label: "Marketing" },
  { id: "juridico", icon: "shield", label: "Jurídico" },
];

function getModuleLabel(moduleId) {
  return NAV_ITEMS.find(item => item.id === moduleId)?.label || moduleId;
}

function canAccessModule(user, moduleId) {
  return !!user?.allowedModules?.includes(moduleId);
}

function getAllowedNavItems(user) {
  return NAV_ITEMS.filter(item => canAccessModule(user, item.id));
}

function getDefaultModule(user) {
  const allowed = getAllowedNavItems(user);
  if (canAccessModule(user, "dashboard")) return "dashboard";
  return allowed[0]?.id || "dashboard";
}

function Sidebar({ active, setActive, user, onOpenProfile, navItems }) {
  return (
    <aside className="aef-nav" aria-label="Módulos">
      <div className="aef-nav__brand">
        <img className="aef-nav__logo" src="/logo-vermelha.png" alt="" />
        <div>
          <div className="aef-nav__wordmark">AEF Hub</div>
          <div className="aef-nav__org">Amor em Foco</div>
        </div>
      </div>

      <nav aria-label="Menu principal" style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <ul className="aef-nav__list">
          {navItems.map(it => {
            const isActive = active === it.id;
            return (
              <li key={it.id}>
                <button type="button" className="aef-nav__item" aria-current={isActive ? "page" : undefined} onClick={() => setActive(it.id)}>
                  <span className="aef-nav__icon" aria-hidden="true"><Icon name={it.icon} size={18} strokeWidth={isActive ? 2 : 1.6} /></span>
                  {it.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <button type="button" className="aef-nav__user" onClick={onOpenProfile} aria-label={"Abrir perfil de " + user.name}>
        <span className="aef-nav__avatar" aria-hidden="true">{user.initials}</span>
        <span className="aef-nav__user-main">
          <span className="aef-nav__user-name">{user.name}</span>
          <span className="aef-nav__user-role">{user.position}</span>
          <span className="aef-nav__user-role">{user.profileLabel}</span>
        </span>
        <span className="aef-nav__chev" aria-hidden="true"><Icon name="chevronRight" size={14} /></span>
      </button>
    </aside>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, setActive, navItems }) {
  return (
    <nav className="aef-bottom" aria-label="Menu principal">
      {navItems.map(it => (
        <button key={it.id} type="button" className="aef-bottom__item" aria-current={active === it.id ? "page" : undefined} onClick={() => setActive(it.id)}>
          <span aria-hidden="true"><Icon name={it.icon} size={20} strokeWidth={active === it.id ? 2 : 1.6} /></span>
          <span className="aef-bottom__label">{it.id === "operacoes" ? "Ops" : it.label}</span>
        </button>
      ))}
    </nav>
  );
}

function AccessNotice({ message }) {
  if (!message) return null;
  return (
    <p className="aef-notice" role="status">
      {message}
    </p>
  );
}

function createAccessDraft(user) {
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

function Acessos({ currentUser, users, onSaveUser, onToggleUserStatus, onResetUsers }) {
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

  const handleSave = () => {
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
    onSaveUser(draft);
    setCreating(false);
    setFeedback("Acesso salvo com sucesso.");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: C.text, marginBottom: 6 }}>Central de Acessos</div>
          <div style={{ color: C.textSecondary, fontSize: 14, maxWidth: 760, lineHeight: 1.6 }}>
            Gestao front-first de usuarios, perfis e modulos liberados. Ideal para desenhar a operacao antes da integracao com backend.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={startCreate} style={{ background: C.red, color: C.white, border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Novo usuario
          </button>
          <button onClick={() => { onResetUsers(); setFeedback("Diretorio restaurado para o padrao."); }} style={{ background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Restaurar padrao
          </button>
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
                onClick={() => {
                  if (selectedUser.id === currentUser.id) {
                    setFeedback("Desative esta conta por outro administrador para evitar perder o acesso atual.");
                    return;
                  }
                  onToggleUserStatus(selectedUser.id);
                }}
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
            ].map(field => (
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
            <button onClick={handleSave} style={{ background: C.red, color: C.white, border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {creating ? "Criar usuario" : "Salvar alteracoes"}
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

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, onClick, icon, tone = "red" }) {
  const tones = {
    red: { bg: "rgba(215,13,22,0.10)", fg: C.red },
    green: { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
    blue: { bg: "rgba(59,130,246,0.12)", fg: "#2563EB" },
    amber: { bg: "rgba(245,158,11,0.14)", fg: "#D97706" },
    purple: { bg: "rgba(126,34,206,0.10)", fg: "#7E22CE" },
    teal: { bg: "rgba(13,148,136,0.10)", fg: "#0D9488" },
  };
  const t = tones[tone] || tones.red;
  return (
    <Card
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Abrir ${label}: ${value} ${sub || ""}` : undefined}
      onClick={onClick}
      onKeyDown={event => { if (onClick && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onClick(); } }}
      className={`border-border/80 shadow-sm transition-all duration-200 ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" : ""}`}
    >
      <CardContent className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10" style={{ background: t.bg }}>
            <Icon name={icon} size={17} color={t.fg} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold leading-none tracking-tight text-foreground sm:text-2xl">{value}</span>
            {sub && <span className="truncate text-[10px] font-medium text-muted-foreground">{sub}</span>}
          </div>
        </div>
        {onClick && <span className="hidden sm:block"><Icon name="chevronRight" size={14} color={C.textTertiary} /></span>}
      </CardContent>
    </Card>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function BalanceCard({ onClick, mobile }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const saldo = "R$ 3.847,20";
  const entrada = "+ R$ 1.200,00";
  const saida = "− R$ 430,50";

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="aef-dash__balance">
      <div className="aef-dash__balance-head">
        <div>
          <h2 className="aef-dash__balance-title">Resumo financeiro</h2>
          <p className="aef-dash__balance-note">Atualizado agora</p>
        </div>
        <button type="button" className="aef-dash__btn aef-dash__btn--on-accent" aria-label={visible ? "Ocultar valores financeiros" : "Mostrar valores financeiros"} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
          <span aria-hidden="true"><Icon name="eye" size={15} /></span>{visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      <div className="aef-dash__amount" aria-live="polite" aria-busy={loading}>
        {loading ? <span className="aef-dash__skeleton" aria-label="Carregando saldo" /> : <span>{visible ? saldo : "R$ ••••••"}</span>}
      </div>
      <div className="aef-dash__flows">
        <dl className="aef-dash__flow-list">
          <div className="aef-dash__flow aef-dash__flow--in"><dt>Entradas</dt><dd>{visible ? entrada : "••••••"}</dd></div>
          <div className="aef-dash__flow aef-dash__flow--out"><dt>Saídas</dt><dd>{visible ? saida : "••••••"}</dd></div>
        </dl>
        <button type="button" className="aef-dash__btn aef-dash__btn--on-accent" onClick={onClick}>Abrir Financeiro</button>
      </div>
    </div>
  );
}

const MURAL_TIPOS = {
  acao_iniciada: { icon: "settings", tone: "green", label: "Ação" },
  votacao: { icon: "shield", tone: "amber", label: "Votação" },
  fotos: { icon: "camera", tone: "blue", label: "Marketing" },
  doc: { icon: "file", tone: "red", label: "Jurídico" },
  voluntario: { icon: "users", tone: "purple", label: "RH" },
  acao_concluida: { icon: "check", tone: "neutral", label: "Ação" },
  doacao: { icon: "dollar", tone: "green", label: "Financeiro" },
  demanda_marketing: { icon: "camera", tone: "teal", label: "Marketing" },
};

const MURAL_EVENTOS = [
  { id: 1, tipo: "acao_iniciada", autor: "Flávia Souza", iniciais: "FS", texto: "deu início à ação", alvo: "Café de Rua", tempo: "há 12 min" },
  { id: 2, tipo: "fotos", autor: "Eder Silva", iniciais: "ES", texto: "adicionou", alvo: "342 fotos ao Acervo", tempo: "há 1h" },
  { id: 3, tipo: "votacao", autor: "Diretoria", iniciais: "DR", texto: "abriu votação:", alvo: "Aprovação do orçamento Maio/2026", tempo: "há 3h" },
  { id: 4, tipo: "doc", autor: "Dr. Rafael Nunes", iniciais: "RN", texto: "subiu documento:", alvo: "Certidão Negativa Receita Federal", tempo: "há 5h" },
  { id: 5, tipo: "voluntario", autor: "Ingrid Lima", iniciais: "IL", texto: "se cadastrou como voluntária em", alvo: "Alimentação", tempo: "ontem" },
  { id: 6, tipo: "doacao", autor: "Doador anônimo", iniciais: "DA", texto: "fez uma doação de", alvo: "R$ 250,00", tempo: "ontem" },
  { id: 7, tipo: "acao_concluida", autor: "Dr. Marcos Farias", iniciais: "MF", texto: "concluiu a ação", alvo: "Saúde — Guamá", tempo: "há 2 dias" },
];

const VOTACAO_DETALHES = {
  3: {
    titulo: "Aprovação do orçamento Maio/2026",
    descricao: "Orçamento mensal proposto pela Diretoria Financeira: R$ 14.820 distribuídos entre Operações (52%), Alimentação (28%), Marketing (12%) e Reserva (8%).",
    aberta_em: "há 3h",
    encerra_em: "em 21h",
    diretores: [
      { nome: "Flávia Souza", iniciais: "FS", voto: "sim" },
      { nome: "Alan Costa", iniciais: "AC", voto: "sim" },
      { nome: "Dra. Ana Paula", iniciais: "AP", voto: null },
      { nome: "Eder Silva", iniciais: "ES", voto: null, ehVoce: true },
    ],
  },
};

function gerarAtaVotacao(detalhes, diretores, votos) {
  const total = diretores.length;
  const aprovado = votos.sim > total / 2;
  const dataAtual = new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  const linhas = diretores.map(d => `<tr><td>${d.nome}</td><td>${d.voto === "sim" ? "Aprovou" : d.voto === "nao" ? "Reprovou" : d.voto === "abster" ? "Absteve-se" : "Não votou"}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Ata — ${detalhes.titulo}</title><style>
body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;color:#1D1D1F;line-height:1.6}
h1{font-size:22px;border-bottom:2px solid #D70D16;padding-bottom:10px}
h2{font-size:16px;margin-top:28px;color:#851811}
.meta{background:#F5F5F7;padding:14px 18px;border-radius:8px;font-size:14px;margin:16px 0}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{padding:10px 12px;border-bottom:1px solid #E8E8ED;text-align:left;font-size:14px}
th{background:#F5F5F7;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
.resultado{padding:18px 22px;border-radius:10px;margin-top:18px;font-weight:600}
.aprovado{background:rgba(34,197,94,0.10);color:#15803D;border:1px solid rgba(34,197,94,0.3)}
.reprovado{background:rgba(215,13,22,0.08);color:#D70D16;border:1px solid rgba(215,13,22,0.3)}
.assinatura{margin-top:40px;padding-top:20px;border-top:1px solid #E8E8ED;font-size:12px;color:#6E6E73}
</style></head><body>
<h1>Ata de Votação — Diretoria AEF</h1>
<div class="meta"><b>Encerrada em:</b> ${dataAtual}<br/><b>Quórum:</b> ${total} diretores</div>
<h2>Pauta</h2>
<p><b>${detalhes.titulo}</b></p>
<p>${detalhes.descricao}</p>
<h2>Apuração</h2>
<table><thead><tr><th>Diretor(a)</th><th>Voto</th></tr></thead><tbody>${linhas}</tbody></table>
<h2>Resultado</h2>
<div class="resultado ${aprovado ? "aprovado" : "reprovado"}">
${aprovado ? "✓ APROVADO" : "✗ REPROVADO"} — ${votos.sim} aprovaram · ${votos.nao} reprovaram · ${votos.abster} abstiveram-se
</div>
<div class="assinatura">Documento gerado automaticamente pelo AEF Hub em ${dataAtual}. Esta ata constitui registro oficial da deliberação da Diretoria conforme Estatuto Social da Amor em Foco.</div>
</body></html>`;
  return "data:text/html;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(html)));
}

function ModalVotacao({ eventoId, onClose }) {
  const detalhes = VOTACAO_DETALHES[eventoId];
  const [diretores, setDiretores] = useState(() => {
    try {
      const stored = localStorage.getItem(`aef_votacao_${eventoId}`);
      return stored ? JSON.parse(stored) : detalhes.diretores;
    } catch { return detalhes.diretores; }
  });
  const [arquivada, setArquivada] = useState(() => {
    try { return localStorage.getItem(`aef_votacao_${eventoId}_arquivada`) === "true"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(`aef_votacao_${eventoId}`, JSON.stringify(diretores)); } catch {}
  }, [diretores, eventoId]);

  const votar = (escolha) => {
    setDiretores(prev => prev.map(d => d.ehVoce ? { ...d, voto: escolha } : d));
  };

  const arquivar = () => {
    const conteudo = gerarAtaVotacao(detalhes, diretores, votos);
    const hoje = new Date();
    const dataBR = hoje.toLocaleDateString("pt-BR");
    const novoDoc = {
      id: Date.now(),
      nome: `Ata Votação — ${detalhes.titulo}.html`,
      categoria: "estatuto",
      tamanho: formatSize(conteudo.length),
      tipo: "text/html",
      data: dataBR,
      responsavel: "Diretoria (gerado pelo Hub)",
      vigente: true,
      validade: null,
      conteudo,
    };
    try {
      const existentes = JSON.parse(localStorage.getItem("aef_juridico_docs") || "[]");
      localStorage.setItem("aef_juridico_docs", JSON.stringify([novoDoc, ...existentes]));
      localStorage.setItem(`aef_votacao_${eventoId}_arquivada`, "true");
      setArquivada(true);
    } catch (e) {
      alert("Erro ao arquivar: " + e.message);
    }
  };

  const meuVoto = diretores.find(d => d.ehVoce)?.voto;
  const votos = {
    sim: diretores.filter(d => d.voto === "sim").length,
    nao: diretores.filter(d => d.voto === "nao").length,
    abster: diretores.filter(d => d.voto === "abster").length,
  };
  const totalVotaram = votos.sim + votos.nao + votos.abster;
  const total = diretores.length;
  const pctSim = total > 0 ? (votos.sim / total) * 100 : 0;
  const pctNao = total > 0 ? (votos.nao / total) * 100 : 0;
  const pctAbster = total > 0 ? (votos.abster / total) * 100 : 0;

  const opcoes = [
    { id: "sim", label: "Aprovar", cor: "#15803D", bg: "rgba(34,197,94,0.10)", borda: "rgba(34,197,94,0.4)" },
    { id: "nao", label: "Reprovar", cor: C.red, bg: "rgba(215,13,22,0.08)", borda: "rgba(215,13,22,0.4)" },
    { id: "abster", label: "Abster", cor: C.textSecondary, bg: C.bg, borda: C.border },
  ];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 500, padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.white, borderRadius: 18, padding: 26,
        width: "100%", maxWidth: 520, fontFamily: FONT_BODY,
        maxHeight: "92vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#B45309", background: "rgba(245,158,11,0.14)", padding: "3px 8px", borderRadius: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Votação aberta
          </span>
          <span style={{ fontSize: 11, color: C.textTertiary }}>encerra {detalhes.encerra_em}</span>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.4, margin: "0 0 8px", fontFamily: FONT_DISPLAY }}>{detalhes.titulo}</h2>
        <p style={{ color: C.textSecondary, fontSize: 13.5, lineHeight: 1.5, margin: "0 0 22px" }}>{detalhes.descricao}</p>

        {/* Barra de progresso */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Resultado parcial</span>
            <span style={{ fontSize: 12, color: C.textTertiary }}>{totalVotaram} de {total} diretores</span>
          </div>
          <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: C.borderLight }}>
            {pctSim > 0 && <div style={{ width: `${pctSim}%`, background: "#22C55E" }} />}
            {pctNao > 0 && <div style={{ width: `${pctNao}%`, background: C.red }} />}
            {pctAbster > 0 && <div style={{ width: `${pctAbster}%`, background: C.textTertiary }} />}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12, color: C.textSecondary }}>
            <span><b style={{ color: "#15803D" }}>{votos.sim}</b> aprovar</span>
            <span><b style={{ color: C.red }}>{votos.nao}</b> reprovar</span>
            <span><b style={{ color: C.textSecondary }}>{votos.abster}</b> abster</span>
          </div>
        </div>

        {/* Lista de diretores */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Diretoria</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {diretores.map(d => (
              <div key={d.nome} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: d.ehVoce ? C.red : C.borderLight, color: d.ehVoce ? C.white : C.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{d.iniciais}</div>
                <span style={{ fontSize: 13, color: C.text, flex: 1, fontWeight: d.ehVoce ? 600 : 500 }}>{d.nome}{d.ehVoce && <span style={{ color: C.textTertiary, fontWeight: 400 }}> (você)</span>}</span>
                {d.voto ? (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 10, color: d.voto === "sim" ? "#15803D" : d.voto === "nao" ? C.red : C.textSecondary, background: d.voto === "sim" ? "rgba(34,197,94,0.10)" : d.voto === "nao" ? "rgba(215,13,22,0.08)" : C.bg }}>
                    {d.voto === "sim" ? "Aprovou" : d.voto === "nao" ? "Reprovou" : "Absteve"}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: C.textTertiary }}>aguardando</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Estado arquivado */}
        {arquivada ? (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Icon name="check" size={16} color="#15803D" strokeWidth={2.5} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>Votação encerrada e arquivada</span>
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginLeft: 24 }}>
              A ata foi salva no Jurídico em <b>Estatuto & Atas</b>. Acesse o módulo Jurídico para baixar ou visualizar.
            </div>
          </div>
        ) : (
          <>
            {/* Botões de voto */}
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Seu voto</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {opcoes.map(op => {
                const ativo = meuVoto === op.id;
                return (
                  <button key={op.id} onClick={() => votar(op.id)} style={{
                    flex: 1, padding: "12px 8px", borderRadius: 10,
                    border: `1.5px solid ${ativo ? op.borda : C.border}`,
                    background: ativo ? op.bg : C.white,
                    color: ativo ? op.cor : C.textSecondary,
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: FONT_BODY, transition: "all 0.15s",
                  }}>
                    {op.label}
                  </button>
                );
              })}
            </div>

            {/* Encerrar e arquivar */}
            <button
              onClick={() => {
                if (totalVotaram === 0) {
                  alert("Nenhum voto registrado ainda.");
                  return;
                }
                const msg = totalVotaram < total
                  ? `Apenas ${totalVotaram} de ${total} diretores votaram. Encerrar mesmo assim e arquivar?`
                  : "Encerrar votação e arquivar a ata no Jurídico?";
                if (confirm(msg)) arquivar();
              }}
              style={{
                width: "100%", padding: "12px", marginBottom: 10,
                background: C.red, color: C.white, border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 16px rgba(215,13,22,0.22)",
              }}>
              <Icon name="shield" size={15} color={C.white} strokeWidth={2} />
              Encerrar e arquivar no Jurídico
            </button>
          </>
        )}

        <button onClick={onClose} style={{
          width: "100%", padding: "11px", background: C.white, color: C.textSecondary,
          border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>Fechar</button>
      </div>
    </div>
  );
}

function Mural({ mobile }) {
  const [expandido, setExpandido] = useState(false);
  const [votacaoAberta, setVotacaoAberta] = useState(null);
  const demandasMarketing = readMarketingStore(MARKETING_STORAGE_KEYS.requests, MARKETING_REQUESTS_SEED);
  const atividadesMarketing = demandasMarketing.flatMap((demanda) => {
    const solicitacao = {
      id: `marketing-request-${demanda.id}`,
      tipo: "demanda_marketing",
      autor: demanda.solicitante || demanda.setor,
      texto: "solicitou ao Marketing:",
      alvo: demanda.titulo,
      tempo: demanda.tempoSolicitacao || "recentemente",
    };
    if (demanda.status === "brief_recebido") return [solicitacao];
    const statusTexto = {
      em_producao: "iniciou a produção de",
      em_aprovacao: "enviou para aprovação:",
      entregue: "concluiu a demanda",
    }[demanda.status] || "atualizou a demanda";
    return [{
      id: `marketing-status-${demanda.id}-${demanda.status}`,
      tipo: "demanda_marketing",
      autor: "Equipe de Marketing",
      texto: statusTexto,
      alvo: demanda.titulo,
      tempo: demanda.tempoAtualizacao || "recentemente",
    }, solicitacao];
  });
  const eventosMural = [...atividadesMarketing, ...MURAL_EVENTOS];
  const limite = mobile && !expandido ? 3 : eventosMural.length;
  const visiveis = eventosMural.slice(0, limite);
  const restantes = eventosMural.length - limite;

  return (
    <div className="aef-dash__panel aef-dash__mural">
      <div className="aef-dash__mural-head">
        <div>
          <h2 className="aef-dash__h2">Mural</h2>
          <p className="aef-dash__hint">Movimentações de todos os setores</p>
        </div>
        <span className="aef-dash__aside">{eventosMural.length} atividades</span>
      </div>
      <ul className={mobile ? "aef-dash__feed" : "aef-dash__feed aef-dash__feed--scroll"}>
        {visiveis.map((ev) => {
          const cfg = MURAL_TIPOS[ev.tipo] || MURAL_TIPOS.doc;
          const clicavel = ev.tipo === "votacao" && VOTACAO_DETALHES[ev.id];
          return (
            <li key={ev.id} className="aef-dash__event" data-tone={cfg.tone} data-clickable={clicavel ? "true" : undefined} onClick={clicavel ? () => setVotacaoAberta(ev.id) : undefined}>
              <span className="aef-dash__icon" aria-hidden="true"><Icon name={cfg.icon} size={18} strokeWidth={2} /></span>
              <div>
                <p className="aef-dash__event-text">
                  <span className="aef-dash__event-who">{ev.autor}</span>
                  <span className="aef-dash__event-verb"> {ev.texto} </span>
                  <span className="aef-dash__event-what">{ev.alvo}</span>
                </p>
                <p className="aef-dash__event-sector">{cfg.label}</p>
              </div>
              <div className="aef-dash__event-side">
                <span className="aef-dash__event-time">{ev.tempo}</span>
                {clicavel && (
                  <button type="button" className="aef-dash__btn aef-dash__btn--vote" onClick={(e) => { e.stopPropagation(); setVotacaoAberta(ev.id); }}>Votar</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {mobile && restantes > 0 && (
        <button type="button" className="aef-dash__btn aef-dash__btn--quiet" onClick={() => setExpandido(true)}>
          Ver mais {restantes} {restantes === 1 ? "atividade" : "atividades"}
        </button>
      )}
      {mobile && expandido && (
        <button type="button" className="aef-dash__btn aef-dash__btn--quiet aef-dash__btn--muted" onClick={() => setExpandido(false)}>
          Mostrar menos
        </button>
      )}
      {votacaoAberta && <ModalVotacao eventoId={votacaoAberta} onClose={() => setVotacaoAberta(null)} />}
    </div>
  );
}

function Dashboard({ setActive, mobile, user }) {
  const now = new Date();
  const today = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const hora = now.getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] || "Eder";

  const indicadores = [
    { icon: "users", tone: "green", label: "Voluntários", value: "134", sub: "+12 mês", area: "rh" },
    { icon: "settings", tone: "amber", label: "Ações", value: "3", sub: "este mês", area: "operacoes" },
    { icon: "dollar", tone: "red", label: "Doadores", value: "47", sub: "ativos", area: "financeiro" },
    { icon: "camera", tone: "blue", label: "Posts", value: "8", sub: "publicados", area: "marketing" },
    { icon: "eye", tone: "purple", label: "Views site", value: "12,4k", sub: "+18%", area: "marketing" },
    { icon: "eye", tone: "teal", label: "Views redes", value: "8,7k", sub: "+24%", area: "marketing" },
  ];

  return (
    <div className="aef-dash">
      <header>
        <h1 className="aef-dash__title">{saudacao}, {firstName}</h1>
        <p className="aef-dash__date">{today}</p>
      </header>

      <div className="aef-dash__top">
        <section aria-label="Resumo financeiro">
          <BalanceCard onClick={() => setActive("financeiro")} mobile={mobile} />
        </section>

        <section className="aef-dash__panel aef-dash__action" aria-labelledby="dashboard-actions">
          <h2 id="dashboard-actions" className="aef-dash__h2">Ações em andamento</h2>
          <div className="aef-dash__action-head">
            <p><span className="aef-dash__state" role="status">Em andamento</span> <span className="aef-dash__state-note">Operação ativa</span></p>
            <span className="aef-dash__pending">8 tarefas pendentes</span>
          </div>
          <div>
            <h3 className="aef-dash__action-title">Café de Rua</h3>
            <p className="aef-dash__when"><span aria-hidden="true"><Icon name="calendar" size={14} /></span>26 de abril</p>
          </div>
          <div className="aef-dash__progress" role="progressbar" aria-label="Progresso da ação" aria-valuemin={0} aria-valuemax={100} aria-valuenow={62}><span style={{ width: "62%" }} /></div>
          <div className="aef-dash__action-foot">
            <p className="aef-dash__hint">Acompanhe as operações que estão sendo executadas.</p>
            <button type="button" className="aef-dash__btn aef-dash__btn--primary" onClick={() => setActive("operacoes")}>Ver POP</button>
          </div>
        </section>
      </div>

      <section className="aef-dash__section" aria-labelledby="dashboard-indicators">
        <div className="aef-dash__section-head">
          <div>
            <h2 id="dashboard-indicators" className="aef-dash__h2">Indicadores principais</h2>
            <p className="aef-dash__hint">Selecione um indicador para abrir a área responsável.</p>
          </div>
          <span className="aef-dash__aside">Atualização automática</span>
        </div>
        <ul className="aef-dash__figures">
          {indicadores.map(item => (
            <li key={item.label}>
              <button type="button" className="aef-dash__figure" data-tone={item.tone} aria-label={"Abrir " + item.label + ": " + item.value + " " + item.sub} onClick={() => setActive(item.area)}>
                <span className="aef-dash__figure-label"><span className="aef-dash__icon" aria-hidden="true"><Icon name={item.icon} size={16} strokeWidth={2} /></span>{item.label}</span>
                <span className="aef-dash__figure-value">{item.value}</span>
                <span className="aef-dash__figure-sub">{item.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Mural de atividades">
        <Mural mobile={mobile} />
      </section>
    </div>
  );
}

// ─── RH ───────────────────────────────────────────────────────────────────────
const volunteers = [
  { name: "Flávia Souza", area: "Operações", formation: "Administração", actions: 12, initials: "FS", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4501" },
  { name: "Alan Costa", area: "Logística", formation: "Engenharia Civil", actions: 8, initials: "AC", verified: false, novato: false, penalizado: false, telefone: "(91) 98123-4502" },
  { name: "Ingrid Lima", area: "Alimentação", formation: "Nutrição", actions: 15, initials: "IL", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4503" },
  { name: "Dr. Marcos Farias", area: "Saúde", formation: "Medicina", actions: 5, initials: "MF", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4504" },
  { name: "Dra. Ana Paula", area: "Saúde", formation: "Enfermagem", actions: 7, initials: "AP", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4505" },
  { name: "Dr. Rafael Nunes", area: "Jurídico", formation: "Direito", actions: 3, initials: "RN", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4506" },
  { name: "Beatriz Mendes", area: "Operações", formation: "Pedagogia", actions: 0, initials: "BM", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4507" },
  { name: "Carlos Henrique", area: "Logística", formation: "Logística", actions: 0, initials: "CH", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4508" },
  { name: "Daniela Pinto", area: "Alimentação", formation: "Gastronomia", actions: 1, initials: "DP", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4509" },
  { name: "Eduardo Lima", area: "Operações", formation: "Sistemas", actions: 0, initials: "EL", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4510" },
  { name: "Gabriela Reis", area: "Saúde", formation: "Psicologia", actions: 4, initials: "GR", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4511" },
  { name: "Henrique Vargas", area: "Operações", formation: "Educação Física", actions: 9, initials: "HV", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4512" },
  { name: "Isabela Costa", area: "Marketing", formation: "Publicidade", actions: 6, initials: "IC", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4513" },
  { name: "João Pedro Sá", area: "Logística", formation: "Administração", actions: 2, initials: "JS", verified: false, novato: false, penalizado: true, motivoPenalidade: "Faltou 2x sem aviso", telefone: "(91) 98123-4514" },
  { name: "Karina Brito", area: "Alimentação", formation: "Nutrição", actions: 11, initials: "KB", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4515" },
  { name: "Lucas Andrade", area: "Operações", formation: "Engenharia", actions: 0, initials: "LA", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4516" },
  { name: "Mariana Torres", area: "Marketing", formation: "Design", actions: 13, initials: "MT", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4517" },
  { name: "Natália Ferraz", area: "Saúde", formation: "Fisioterapia", actions: 5, initials: "NF", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4518" },
  { name: "Otávio Cunha", area: "Operações", formation: "TI", actions: 1, initials: "OC", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4519" },
  { name: "Patrícia Veloso", area: "Logística", formation: "Administração", actions: 7, initials: "PV", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4520" },
  { name: "Renato Maia", area: "Operações", formation: "Direito", actions: 3, initials: "RM", verified: false, novato: false, penalizado: true, motivoPenalidade: "Conduta inadequada na última ação", telefone: "(91) 98123-4521" },
  { name: "Sabrina Duarte", area: "Alimentação", formation: "Nutrição", actions: 0, initials: "SD", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4522" },
  { name: "Thiago Rocha", area: "Operações", formation: "Administração", actions: 8, initials: "TR", verified: true, novato: false, penalizado: false, telefone: "(91) 98123-4523" },
  { name: "Vivian Aguiar", area: "Marketing", formation: "Jornalismo", actions: 2, initials: "VA", verified: false, novato: true, penalizado: false, telefone: "(91) 98123-4524" },
];

const RH_PARTNERS = [
  { id: 1, name: "Instituto Horizonte", segment: "Instituto", contribution: "Apoio institucional", partnerships: 6, since: "2022", lastAction: "Inverno Solidário", contact: "Marina Alves", phone: "(91) 98410-2201", initials: "IH", status: "recorrente" },
  { id: 2, name: "Mercado São Lucas", segment: "Alimentação", contribution: "Doação de alimentos", partnerships: 14, since: "2021", lastAction: "Sopão da Noite", contact: "Rafael Lima", phone: "(91) 3254-1180", initials: "MS", status: "recorrente" },
  { id: 3, name: "Clínica Vida Plena", segment: "Saúde", contribution: "Atendimento voluntário", partnerships: 8, since: "2023", lastAction: "Ação de Saúde Guamá", contact: "Dra. Luiza Melo", phone: "(91) 98165-4430", initials: "CV", status: "ativo" },
  { id: 4, name: "NorteLog Transportes", segment: "Logística", contribution: "Transporte e distribuição", partnerships: 5, since: "2024", lastAction: "Café de Rua", contact: "André Pires", phone: "(91) 3344-9200", initials: "NT", status: "ativo" },
  { id: 5, name: "Estúdio Guará", segment: "Comunicação", contribution: "Design e cobertura", partnerships: 4, since: "2024", lastAction: "Campanha de voluntariado", contact: "Bianca Tavares", phone: "(91) 98240-7712", initials: "EG", status: "ativo" },
  { id: 6, name: "Faculdade Semente", segment: "Educação", contribution: "Voluntariado acadêmico", partnerships: 3, since: "2023", lastAction: "Visita Orfanato", contact: "Prof. Caio Nunes", phone: "(91) 3201-6008", initials: "FS", status: "historico" },
];

const RH_ATTENDANCE_SEED = [
  { id: 1, action: "Café de Rua", date: "2026-08-30", sector: "Operações", organizer: "Flávia Souza", confirmed: 28, present: 24, absent: 3, justified: 1, organizerPresent: true },
  { id: 2, action: "Ação de Saúde Guamá", date: "2026-08-23", sector: "Saúde", organizer: "Dr. Marcos Farias", confirmed: 18, present: 16, absent: 1, justified: 1, organizerPresent: true },
  { id: 3, action: "Sopão da Noite", date: "2026-08-16", sector: "Alimentação", organizer: "Ingrid Lima", confirmed: 22, present: 18, absent: 3, justified: 1, organizerPresent: true },
  { id: 4, action: "Visita Orfanato Santa Clara", date: "2026-08-09", sector: "Operações", organizer: "Alan Costa", confirmed: 15, present: 13, absent: 2, justified: 0, organizerPresent: false },
  { id: 5, action: "Lar de Idosos Esperança", date: "2026-07-26", sector: "Saúde", organizer: "Dra. Ana Paula", confirmed: 17, present: 15, absent: 1, justified: 1, organizerPresent: true },
];

const RH_FEEDBACK_SEED = [
  { id: 1, type: "organizador", action: "Café de Rua", volunteer: "Flávia Souza", evaluator: "Coordenação", date: "2026-08-30", scores: { pontualidade: 5, comprometimento: 5, equipe: 5, comunicacao: 4, postura: 5, orientacoes: 5, proatividade: 5 }, note: "Conduziu a equipe com segurança e acolhimento." },
  { id: 2, type: "organizador", action: "Ação de Saúde Guamá", volunteer: "Gabriela Reis", evaluator: "Dr. Marcos Farias", date: "2026-08-23", scores: { pontualidade: 4, comprometimento: 5, equipe: 5, comunicacao: 5, postura: 5, orientacoes: 5, proatividade: 4 }, note: "Excelente comunicação com a comunidade." },
  { id: 3, type: "voluntario", action: "Sopão da Noite", volunteer: "Daniela Pinto", evaluator: "Daniela Pinto", date: "2026-08-16", scores: { acolhimento: 5, organizacao: 4, clareza: 4, suporte: 5 }, note: "A experiência foi acolhedora; faltou apenas comunicar o horário de encerramento." },
];

const RH_OCCURRENCES_SEED = [
  { id: 1, volunteer: "João Pedro Sá", date: "2026-08-16", action: "Sopão da Noite", type: "Ausência sem aviso", description: "Segunda ausência confirmada sem comunicação prévia à organização.", registeredBy: "Ingrid Lima", actionTaken: "Conversa de orientação e reforço das regras de confirmação.", status: "acompanhamento", recurrence: 2 },
  { id: 2, volunteer: "Renato Maia", date: "2026-08-09", action: "Visita Orfanato Santa Clara", type: "Conduta inadequada", description: "Descumprimento de orientação de abordagem durante a atividade.", registeredBy: "Flávia Souza", actionTaken: "Afastamento preventivo e reunião com o RH agendada.", status: "aberta", recurrence: 1 },
];

const RH_STORAGE_KEYS = {
  attendance: "aef_rh_attendance_v1",
  feedbacks: "aef_rh_feedbacks_v1",
  occurrences: "aef_rh_occurrences_v1",
};

function readRHStore(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

const areaCfg = {
  "Saúde": { bg: "#FEF2F2", text: "#DC2626" },
  "Jurídico": { bg: "#EFF6FF", text: "#1D4ED8" },
  "Operações": { bg: "#F0FDF4", text: "#166534" },
  "Logística": { bg: "#FFF7ED", text: "#C2410C" },
  "Alimentação": { bg: "#FDF4FF", text: "#7E22CE" },
};

const RH_AREA_TONE = { "Saúde": "red", "Jurídico": "blue", "Operações": "green", "Logística": "orange", "Alimentação": "purple" };
const rhTone = area => RH_AREA_TONE[area] || "red";

function RHPersonRow({ person }) {
  const status = person.penalizado
    ? { label: "Requer atenção", tone: "red" }
    : person.novato
      ? { label: "Novo cadastro", tone: "blue" }
      : person.verified
        ? { label: "Verificado", tone: "green" }
        : { label: "Cadastro pendente", tone: "neutral" };
  return (
    <li className="aef-rh__row">
      <div className="min-w-0">
        <div className="aef-rh__row-name">{person.name}</div>
        <div className="aef-rh__row-sub">{person.formation}</div>
      </div>
      <span className="aef-rh__status" data-tone={status.tone}>{status.label}</span>
      <span className="aef-rh__sector" data-tone={rhTone(person.area)}>{person.area}</span>
      <span className="aef-rh__row-cell">{person.telefone}</span>
      <span className="aef-rh__row-count"><strong>{person.actions}</strong><span>ações</span></span>
      {person.penalizado && person.motivoPenalidade && <p className="aef-rh__row-alert">{person.motivoPenalidade}</p>}
    </li>
  );
}

function RHPartnerRow({ partner }) {
  const statusCfg = {
    recorrente: { label: "Parceiro recorrente", tone: "green" },
    ativo: { label: "Parceria ativa", tone: "blue" },
    historico: { label: "Histórico", tone: "neutral" },
  }[partner.status];
  return (
    <li className="aef-rh__row">
      <div className="min-w-0">
        <div className="aef-rh__row-name">{partner.name}</div>
        <div className="aef-rh__row-sub">{partner.contribution}</div>
      </div>
      <div className="min-w-0">
        <div className="aef-rh__status" data-tone={statusCfg.tone}>{statusCfg.label}</div>
        <div className="aef-rh__row-sub">desde {partner.since}</div>
      </div>
      <span className="aef-rh__sector" data-tone={rhTone(partner.segment)}>{partner.segment}</span>
      <div className="min-w-0">
        <div className="aef-rh__row-cell">{partner.contact}</div>
        <div className="aef-rh__row-sub">{partner.phone}</div>
      </div>
      <span className="aef-rh__row-count"><strong>{partner.partnerships}</strong><span>parcerias</span></span>
      <p className="aef-rh__row-extra">Última ação: {partner.lastAction}</p>
    </li>
  );
}

function RHMemberRow({ member }) {
  const profile = ACCESS_PROFILES[member.profileId] || ACCESS_PROFILES.marketing;
  const moduleCount = member.allowedModules?.length || 0;
  return (
    <li className="aef-rh__row">
      <div className="min-w-0">
        <div className="aef-rh__row-name">{member.name}</div>
        <div className="aef-rh__row-sub">{member.position || profile.label}</div>
      </div>
      <div className="min-w-0">
        <div className="aef-rh__status" data-tone="red">{profile.label}</div>
        <div className="aef-rh__status" data-tone={member.active ? "green" : "neutral"}>{member.active ? "Acesso ativo" : "Acesso inativo"}</div>
      </div>
      <span className="aef-rh__row-cell">{member.department || profile.department}</span>
      <span className="aef-rh__row-cell">{member.email}</span>
      <span className="aef-rh__row-count"><strong>{moduleCount}</strong><span>{moduleCount === 1 ? "área liberada" : "áreas liberadas"}</span></span>
    </li>
  );
}

function RHNetwork({ mobile, members = [] }) {
  const [entityType, setEntityType] = useState("todos");
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const filters = ["Todos", ...new Set([...volunteers.map(item => item.area), ...RH_PARTNERS.map(item => item.segment), ...members.map(item => item.department).filter(Boolean)])];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredPeople = volunteers.filter(person =>
    !["empresas", "membros"].includes(entityType) &&
    (filter === "Todos" || person.area === filter) &&
    (!normalizedSearch || [person.name, person.area, person.formation, person.telefone].some(value => value.toLowerCase().includes(normalizedSearch)))
  );
  const filteredPartners = RH_PARTNERS.filter(partner =>
    !["pessoas", "membros"].includes(entityType) &&
    (filter === "Todos" || partner.segment === filter) &&
    (!normalizedSearch || [partner.name, partner.segment, partner.contribution, partner.contact].some(value => value.toLowerCase().includes(normalizedSearch)))
  );
  const filteredMembers = members.filter(member =>
    !["pessoas", "empresas"].includes(entityType) &&
    (filter === "Todos" || member.department === filter) &&
    (!normalizedSearch || [member.name, member.email, member.position, member.department, ACCESS_PROFILES[member.profileId]?.label].filter(Boolean).some(value => value.toLowerCase().includes(normalizedSearch)))
  );
  const totalResults = filteredPeople.length + filteredPartners.length + filteredMembers.length;
  const totalPartnerships = RH_PARTNERS.reduce((sum, partner) => sum + partner.partnerships, 0);
  const entityTypes = [["todos", "Todos"], ["pessoas", "Pessoas"], ["empresas", "Empresas"], ["membros", "Membros"]];

  return (
    <div>
      <div className="aef-rh__head">
        <div>
          <h1 className="aef-rh__title">Rede Amor em Foco</h1>
          <p className="aef-rh__desc">Voluntários, membros, empresas e instituições que constroem a história da organização.</p>
        </div>
        <button type="button" aria-label="Novo cadastro" className="aef-rh__btn aef-rh__btn--primary"><span aria-hidden="true"><Icon name="plus" size={15} /></span>{!mobile && "Novo cadastro"}</button>
      </div>

      <ul className="aef-rh__figures aef-rh__figures--4">
        {[
          ["Pessoas", volunteers.length],
          ["Empresas e parceiros", RH_PARTNERS.length],
          ["Membros da organização", members.length],
          ["Parcerias realizadas", totalPartnerships],
        ].map(([label, value]) => (
          <li key={label} className="aef-rh__figure"><span className="aef-rh__figure-label">{label}</span><span className="aef-rh__figure-value">{value}</span></li>
        ))}
      </ul>

      <div className="aef-rh__panel aef-rh__toolbar">
        <div className="aef-rh__toolbar-top">
          <div className="aef-rh__segments" role="group" aria-label="Tipo de vínculo">
            {entityTypes.map(([value, label]) => (
              <button key={value} type="button" className="aef-rh__segment" aria-pressed={entityType === value} onClick={() => { setEntityType(value); setFilter("Todos"); }}>{label}</button>
            ))}
          </div>
          <div className="aef-rh__search">
            <span className="aef-rh__search-icon" aria-hidden="true"><Icon name="search" size={15} /></span>
            <input className="aef-rh__input" type="search" aria-label="Buscar na rede" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar pessoa, empresa, área ou atuação…" />
          </div>
        </div>
        <div className="aef-rh__chips" role="group" aria-label="Filtrar por área">
          {filters.map(item => <button key={item} type="button" className="aef-rh__chip" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
      </div>

      <div className="aef-rh__results" aria-live="polite">
        <span>{totalResults} registro(s) encontrado(s)</span>
        {filter !== "Todos" && <button type="button" className="aef-rh__btn aef-rh__btn--link" onClick={() => setFilter("Todos")}>Limpar filtro</button>}
      </div>

      {filteredPartners.length > 0 && (
        <section className="aef-rh__group">
          <div className="aef-rh__group-head"><h2 className="aef-rh__h2">Empresas e parceiros</h2><p className="aef-rh__hint">Instituições que apoiam ações, estrutura e alcance.</p></div>
          <ul className="aef-rh__panel aef-rh__rows">{filteredPartners.map(partner => <RHPartnerRow key={partner.id} partner={partner} />)}</ul>
        </section>
      )}

      {filteredMembers.length > 0 && (
        <section className="aef-rh__group">
          <div className="aef-rh__group-head"><h2 className="aef-rh__h2">Membros da organização</h2><p className="aef-rh__hint">Equipe interna com identidade institucional e acesso ao AEF Hub.</p></div>
          <ul className="aef-rh__panel aef-rh__rows">{filteredMembers.map(member => <RHMemberRow key={member.id} member={member} />)}</ul>
        </section>
      )}

      {filteredPeople.length > 0 && (
        <section className="aef-rh__group">
          <div className="aef-rh__group-head"><h2 className="aef-rh__h2">Pessoas da rede</h2><p className="aef-rh__hint">Voluntários e profissionais que participaram da trajetória.</p></div>
          <ul className="aef-rh__panel aef-rh__rows">{filteredPeople.map(person => <RHPersonRow key={person.telefone} person={person} />)}</ul>
        </section>
      )}

      {totalResults === 0 && (
        <div className="aef-rh__panel aef-rh__empty">
          <span className="aef-rh__empty-icon" aria-hidden="true"><Icon name="search" size={22} /></span>
          <h2 className="aef-rh__h2">Nenhum vínculo encontrado</h2>
          <p className="aef-rh__desc">Tente outro nome, área ou tipo de relacionamento.</p>
        </div>
      )}
    </div>
  );
}

const RH_CRITERIA = {
  organizador: ["pontualidade", "comprometimento", "equipe", "comunicacao", "postura", "orientacoes", "proatividade"],
  voluntario: ["acolhimento", "organizacao", "clareza", "suporte"],
};

const RH_CRITERIA_LABELS = {
  pontualidade: "Pontualidade", comprometimento: "Comprometimento", equipe: "Trabalho em equipe",
  comunicacao: "Comunicação", postura: "Postura", orientacoes: "Cumprimento das orientações",
  proatividade: "Proatividade", acolhimento: "Acolhimento", organizacao: "Organização da ação",
  clareza: "Clareza das orientações", suporte: "Suporte da equipe",
};

function RHSectionTitle({ title, description, action, flag }) {
  return (
    <div className="aef-rh__head">
      <div>
        <div className="aef-rh__title-row">
          <h1 className="aef-rh__title">{title}</h1>
          {flag && <span className="aef-rh__flag"><span aria-hidden="true"><Icon name="lock" size={12} /></span>{flag}</span>}
        </div>
        <p className="aef-rh__desc">{description}</p>
      </div>
      {action}
    </div>
  );
}

function RHFigures({ items }) {
  return (
    <ul className={`aef-rh__figures aef-rh__figures--${items.length}`}>
      {items.map(item => (
        <li key={item.label} className="aef-rh__figure" data-tone={item.tone}>
          <span className="aef-rh__figure-label">{item.label}</span>
          <span className="aef-rh__figure-value">{item.value}</span>
          {item.detail && <span className="aef-rh__figure-detail">{item.detail}</span>}
        </li>
      ))}
    </ul>
  );
}

function RHOverview({ attendance, feedbacks, occurrences, onNavigate, mobile }) {
  const active = volunteers.filter(person => person.actions > 0).length;
  const inactive = volunteers.filter(person => person.actions === 0).length;
  const newVolunteers = volunteers.filter(person => person.novato).length;
  const present = attendance.reduce((sum, item) => sum + item.present, 0);
  const confirmed = attendance.reduce((sum, item) => sum + item.confirmed, 0);
  const absences = attendance.reduce((sum, item) => sum + item.absent, 0);
  const attendanceRate = confirmed ? Math.round((present / confirmed) * 100) : 0;
  const openOccurrences = occurrences.filter(item => item.status !== "encerrada").length;
  const organizerFeedbacks = feedbacks.filter(item => item.type === "organizador");
  const feedbackPending = Math.max(0, attendance.length - organizerFeedbacks.length);
  const sectorData = Object.entries(volunteers.reduce((acc, person) => ({ ...acc, [person.area]: (acc[person.area] || 0) + person.actions }), {})).sort((a, b) => b[1] - a[1]);
  const maxSector = Math.max(...sectorData.map(([, value]) => value), 1);
  const topPeople = [...volunteers].sort((a, b) => b.actions - a.actions).slice(0, 5);

  return (
    <div>
      <RHSectionTitle title="Painel do RH" description="Indicadores de vínculo, presença e acompanhamento da rede de voluntários." />
      <RHFigures items={[
        { label: "Ativos", value: active, detail: "Participaram ao menos uma vez" },
        { label: "Novos cadastros", value: newVolunteers, detail: "Aguardando integração" },
        { label: "Inativos", value: inactive, detail: "Sem participação registrada" },
        { label: "Frequência", value: `${attendanceRate}%`, detail: `${absences} faltas registradas` },
      ]} />

      <div className="aef-rh__grid aef-rh__grid--wide">
        <section className="aef-rh__panel aef-rh__panel--pad">
          <div className="aef-rh__panel-head">
            <div><h2 className="aef-rh__h2">Frequência por ação</h2><p className="aef-rh__hint">Presenças sobre confirmações</p></div>
            <button type="button" className="aef-rh__btn aef-rh__btn--link" onClick={() => onNavigate("participacao")}>Ver participação</button>
          </div>
          <ul className="aef-rh__bars">
            {attendance.slice(0, 4).map(item => {
              const rate = Math.round((item.present / item.confirmed) * 100);
              return (
                <li key={item.id} className="aef-rh__bar-row">
                  <span className="aef-rh__bar-label">{item.action}</span>
                  <span className="aef-rh__bar-value">{rate}%</span>
                  <span className="aef-rh__track" role="presentation"><span style={{ width: `${rate}%` }} /></span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="aef-rh__panel" aria-label="Pendências">
          <ul className="aef-rh__followups">
            <li className="aef-rh__followup">
              <div><p className="aef-rh__figure-label">Feedbacks pendentes</p><p className="aef-rh__followup-value">{feedbackPending}</p></div>
              <button type="button" className="aef-rh__btn aef-rh__btn--outline" onClick={() => onNavigate("feedbacks")}>Avaliar</button>
            </li>
            <li className="aef-rh__followup" data-tone={openOccurrences ? "red" : undefined}>
              <div><p className="aef-rh__figure-label">Ocorrências abertas</p><p className="aef-rh__followup-value">{openOccurrences}</p></div>
              <button type="button" className="aef-rh__btn aef-rh__btn--outline" onClick={() => onNavigate("ocorrencias")}>Acompanhar</button>
            </li>
          </ul>
        </section>
      </div>

      <div className="aef-rh__grid aef-rh__grid--half">
        <section className="aef-rh__panel aef-rh__panel--pad">
          <h2 className="aef-rh__h2" style={{ marginBottom: "var(--space-md)" }}>Participação por setor</h2>
          <ul className="aef-rh__bars">
            {sectorData.slice(0, 6).map(([sector, value]) => (
              <li key={sector} className="aef-rh__bar-row aef-rh__bar-row--sector" data-tone={rhTone(sector)}>
                <span className="aef-rh__bar-label">{sector}</span>
                <span className="aef-rh__track" role="presentation"><span style={{ width: `${(value / maxSector) * 100}%` }} /></span>
                <span className="aef-rh__bar-value">{value}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="aef-rh__panel aef-rh__panel--pad">
          <h2 className="aef-rh__h2" style={{ marginBottom: "var(--space-xs)" }}>Maior participação</h2>
          <ol className="aef-rh__rank">
            {topPeople.map((person, index) => (
              <li key={person.telefone}>
                <span className="aef-rh__rank-pos">{index + 1}</span>
                <div className="min-w-0"><div className="aef-rh__rank-name">{person.name}</div><div className="aef-rh__sector" data-tone={rhTone(person.area)}>{person.area}</div></div>
                <span className="aef-rh__rank-count">{person.actions} ações</span>
              </li>
            ))}
          </ol>
          <p className="aef-rh__note">Indicador usado para reconhecimento, nunca para punição ou comparação isolada.</p>
        </section>
      </div>
    </div>
  );
}

function RHParticipation({ attendance }) {
  const totalPresent = attendance.reduce((sum, item) => sum + item.present, 0);
  const totalAbsent = attendance.reduce((sum, item) => sum + item.absent, 0);
  return (
    <div>
      <RHSectionTitle title="Participação e frequência" description="Presença, falta e justificativa registradas por ação, incluindo o organizador." />
      <RHFigures items={[
        { label: "Presenças", value: totalPresent, tone: "green" },
        { label: "Faltas", value: totalAbsent, tone: "red" },
        { label: "Justificadas", value: attendance.reduce((s, i) => s + i.justified, 0), tone: "amber" },
      ]} />
      <div className="aef-rh__panel aef-rh__table-wrap">
        <table className="aef-rh__table">
          <thead>
            <tr><th scope="col">Ação</th><th scope="col">Setor</th><th scope="col">Organização</th><th scope="col" className="num">Presentes</th><th scope="col" className="num">Faltas</th><th scope="col" className="num">Justificadas</th><th scope="col">Frequência</th><th scope="col">Organizador presente</th></tr>
          </thead>
          <tbody>
            {attendance.map(item => {
              const rate = Math.round((item.present / item.confirmed) * 100);
              return (
                <tr key={item.id}>
                  <td><div className="aef-rh__table-action">{item.action}</div><div className="aef-rh__table-sub">{marketingDateLabel(item.date)}</div></td>
                  <td><span className="aef-rh__sector" data-tone={rhTone(item.sector)}>{item.sector}</span></td>
                  <td>{item.organizer}</td>
                  <td className="num" data-tone="green"><span className="aef-rh__status">{item.present}</span></td>
                  <td className="num" data-tone="red"><span className="aef-rh__status">{item.absent}</span></td>
                  <td className="num">{item.justified}</td>
                  <td><div className="aef-rh__rate"><span className="aef-rh__track" role="presentation"><span style={{ width: `${rate}%` }} /></span><span className="aef-rh__bar-value">{rate}%</span></div></td>
                  <td><span className="aef-rh__status" data-tone={item.organizerPresent ? "green" : "red"}>{item.organizerPresent ? "Sim" : "Não"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RHFeedbacks({ feedbacks, onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ type: "organizador", action: RH_ATTENDANCE_SEED[0].action, volunteer: volunteers[0].name, note: "", scores: {} });
  const criteria = RH_CRITERIA[draft.type];
  const submit = event => { event.preventDefault(); const scores = Object.fromEntries(criteria.map(key => [key, Number(draft.scores[key] || 4)])); onAdd({ ...draft, scores }); setDraft(prev => ({ ...prev, note: "", scores: {} })); setShowForm(false); };
  const organizerScores = feedbacks.filter(item => item.type === "organizador").flatMap(item => Object.values(item.scores));
  const average = organizerScores.length ? (organizerScores.reduce((a, b) => a + b, 0) / organizerScores.length).toFixed(1) : "—";
  return (
    <div>
      <RHSectionTitle title="Feedbacks pós-ação" description="Avaliação do organizador e percepção do próprio voluntário sobre a experiência." action={<button type="button" aria-expanded={showForm} onClick={() => setShowForm(value => !value)} className="aef-rh__btn aef-rh__btn--primary"><span aria-hidden="true"><Icon name="plus" size={14} /></span>Nova avaliação</button>} />
      <RHFigures items={[
        { label: "Avaliações", value: feedbacks.length },
        { label: "Média geral", value: average },
        { label: "Do voluntário", value: feedbacks.filter(item => item.type === "voluntario").length },
      ]} />
      {showForm && (
        <form onSubmit={submit} className="aef-rh__panel aef-rh__panel--pad aef-rh__form">
          <div className="aef-rh__form-grid aef-rh__form-grid--3">
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-fb-tipo">Tipo</label><select id="rh-fb-tipo" value={draft.type} onChange={event => setDraft(prev => ({ ...prev, type: event.target.value, scores: {} }))} className="aef-rh__select"><option value="organizador">Organizador avalia</option><option value="voluntario">Voluntário avalia a ação</option></select></div>
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-fb-acao">Ação</label><select id="rh-fb-acao" value={draft.action} onChange={event => setDraft(prev => ({ ...prev, action: event.target.value }))} className="aef-rh__select">{RH_ATTENDANCE_SEED.map(item => <option key={item.id}>{item.action}</option>)}</select></div>
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-fb-voluntario">Voluntário</label><select id="rh-fb-voluntario" value={draft.volunteer} onChange={event => setDraft(prev => ({ ...prev, volunteer: event.target.value }))} className="aef-rh__select">{volunteers.map(item => <option key={item.telefone}>{item.name}</option>)}</select></div>
          </div>
          <div className="aef-rh__form-grid aef-rh__form-grid--2 aef-rh__form-section">
            {criteria.map(key => (
              <label key={key} className="aef-rh__score">
                <span className="aef-rh__score-head"><span>{RH_CRITERIA_LABELS[key]}</span><span>{draft.scores[key] || 4}/5</span></span>
                <input type="range" min="1" max="5" value={draft.scores[key] || 4} onChange={event => setDraft(prev => ({ ...prev, scores: { ...prev.scores, [key]: Number(event.target.value) } }))} className="aef-rh__range" />
              </label>
            ))}
          </div>
          <div className="aef-rh__field aef-rh__form-section"><label className="aef-rh__label" htmlFor="rh-fb-obs">Observação</label><textarea id="rh-fb-obs" value={draft.note} onChange={event => setDraft(prev => ({ ...prev, note: event.target.value }))} placeholder="Contexto útil para desenvolvimento e acompanhamento…" className="aef-rh__textarea" /></div>
          <div className="aef-rh__form-actions"><button type="button" onClick={() => setShowForm(false)} className="aef-rh__btn aef-rh__btn--outline">Cancelar</button><button type="submit" className="aef-rh__btn aef-rh__btn--primary">Salvar avaliação</button></div>
        </form>
      )}
      <ul className="aef-rh__panel aef-rh__records">
        {feedbacks.map(item => {
          const values = Object.values(item.scores);
          const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
          return (
            <li key={item.id} className="aef-rh__record">
              <div className="aef-rh__record-head">
                <div>
                  <div className="aef-rh__record-name">{item.volunteer}</div>
                  <div className="aef-rh__meta"><span>{item.action}</span><span>{marketingDateLabel(item.date)}</span><span>por {item.evaluator}</span></div>
                </div>
                <span className="aef-rh__status" data-tone={item.type === "voluntario" ? "blue" : "neutral"}>{item.type === "voluntario" ? "Experiência da ação" : `Média ${avg}`}</span>
              </div>
              {item.note && <p className="aef-rh__record-text">{item.note}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RHOccurrences({ occurrences, onAdd, canAccess }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ volunteer: volunteers[0].name, action: RH_ATTENDANCE_SEED[0].action, type: "Ausência sem aviso", description: "", actionTaken: "", status: "aberta", recurrence: 1 });
  if (!canAccess) return (
    <div className="aef-rh__panel aef-rh__empty">
      <span className="aef-rh__empty-icon" aria-hidden="true"><Icon name="lock" size={22} /></span>
      <h2 className="aef-rh__h2">Acesso restrito ao RH</h2>
      <p className="aef-rh__desc">Ocorrências contêm informações confidenciais e só podem ser consultadas por perfis de RH e Super Admin.</p>
    </div>
  );
  const submit = event => { event.preventDefault(); if (!draft.description.trim()) return; onAdd(draft); setDraft(prev => ({ ...prev, description: "", actionTaken: "" })); setShowForm(false); };
  const statusTone = { aberta: "red", acompanhamento: "amber", encerrada: "green" };
  return (
    <div>
      <RHSectionTitle flag="Confidencial" title="Registro de ocorrências" description="Acompanhamento restrito de condutas, providências e reincidências." action={<button type="button" aria-expanded={showForm} onClick={() => setShowForm(value => !value)} className="aef-rh__btn aef-rh__btn--primary"><span aria-hidden="true"><Icon name="plus" size={14} /></span>Registrar</button>} />
      <RHFigures items={[
        { label: "Em aberto", value: occurrences.filter(item => item.status === "aberta").length, tone: "red" },
        { label: "Acompanhamento", value: occurrences.filter(item => item.status === "acompanhamento").length, tone: "amber" },
        { label: "Encerradas", value: occurrences.filter(item => item.status === "encerrada").length, tone: "green" },
      ]} />
      {showForm && (
        <form onSubmit={submit} className="aef-rh__panel aef-rh__panel--pad aef-rh__form">
          <div className="aef-rh__form-grid aef-rh__form-grid--3">
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-oc-voluntario">Voluntário</label><select id="rh-oc-voluntario" value={draft.volunteer} onChange={event => setDraft(prev => ({ ...prev, volunteer: event.target.value }))} className="aef-rh__select">{volunteers.map(item => <option key={item.telefone}>{item.name}</option>)}</select></div>
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-oc-acao">Ação</label><select id="rh-oc-acao" value={draft.action} onChange={event => setDraft(prev => ({ ...prev, action: event.target.value }))} className="aef-rh__select">{RH_ATTENDANCE_SEED.map(item => <option key={item.id}>{item.action}</option>)}</select></div>
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-oc-tipo">Tipo</label><input id="rh-oc-tipo" value={draft.type} onChange={event => setDraft(prev => ({ ...prev, type: event.target.value }))} className="aef-rh__input" /></div>
          </div>
          <div className="aef-rh__field aef-rh__form-section"><label className="aef-rh__label" htmlFor="rh-oc-descricao">Descrição</label><textarea id="rh-oc-descricao" required value={draft.description} onChange={event => setDraft(prev => ({ ...prev, description: event.target.value }))} className="aef-rh__textarea" /></div>
          <div className="aef-rh__field aef-rh__form-section"><label className="aef-rh__label" htmlFor="rh-oc-providencia">Providência tomada</label><textarea id="rh-oc-providencia" value={draft.actionTaken} onChange={event => setDraft(prev => ({ ...prev, actionTaken: event.target.value }))} className="aef-rh__textarea" /></div>
          <div className="aef-rh__form-actions"><button type="button" onClick={() => setShowForm(false)} className="aef-rh__btn aef-rh__btn--outline">Cancelar</button><button type="submit" className="aef-rh__btn aef-rh__btn--primary">Salvar ocorrência</button></div>
        </form>
      )}
      <ul className="aef-rh__panel aef-rh__records">
        {occurrences.map(item => (
          <li key={item.id} className="aef-rh__record">
            <div className="aef-rh__record-head">
              <div>
                <div className="aef-rh__record-name">{item.volunteer}</div>
                <div className="aef-rh__meta"><span>{item.type}</span><span>{item.action}</span><span>{marketingDateLabel(item.date)}</span></div>
              </div>
              <span className="aef-rh__status aef-rh__status--cap" data-tone={statusTone[item.status] || "neutral"}>{item.status}</span>
            </div>
            <p className="aef-rh__record-text">{item.description}</p>
            <dl className="aef-rh__details">
              <div><dt>Registrado por:</dt><dd>{item.registeredBy}</dd></div>
              <div><dt>Reincidência:</dt><dd>{item.recurrence} registro(s)</dd></div>
              <div className="aef-rh__details-wide"><dt>Providência:</dt><dd>{item.actionTaken || "Aguardando definição"}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RH({ mobile, user, users, onSaveUser, onToggleUserStatus, onResetUsers }) {
  const [section, setSection] = useState("visao");
  const [attendance, setAttendance] = useState(() => readRHStore(RH_STORAGE_KEYS.attendance, RH_ATTENDANCE_SEED));
  const [feedbacks, setFeedbacks] = useState(() => readRHStore(RH_STORAGE_KEYS.feedbacks, RH_FEEDBACK_SEED));
  const [occurrences, setOccurrences] = useState(() => readRHStore(RH_STORAGE_KEYS.occurrences, RH_OCCURRENCES_SEED));
  useEffect(() => localStorage.setItem(RH_STORAGE_KEYS.attendance, JSON.stringify(attendance)), [attendance]);
  useEffect(() => localStorage.setItem(RH_STORAGE_KEYS.feedbacks, JSON.stringify(feedbacks)), [feedbacks]);
  useEffect(() => localStorage.setItem(RH_STORAGE_KEYS.occurrences, JSON.stringify(occurrences)), [occurrences]);
  const canAccessOccurrences = ["rh", "super_admin"].includes(user?.profileId);
  const canManageAccess = ["rh", "super_admin"].includes(user?.profileId);
  const addFeedback = draft => setFeedbacks(prev => [{ id: Date.now(), ...draft, evaluator: draft.type === "voluntario" ? draft.volunteer : user?.name || "Organizador", date: marketingDateKey(new Date()) }, ...prev]);
  const addOccurrence = draft => setOccurrences(prev => [{ id: Date.now(), ...draft, registeredBy: user?.name || "RH", date: marketingDateKey(new Date()) }, ...prev]);
  const sections = [["visao", "Visão geral"], ["rede", "Rede"], ["participacao", "Participação"], ["feedbacks", "Feedbacks"], ["ocorrencias", "Ocorrências"], ...(canManageAccess ? [["acessos", "Membros & acessos"]] : [])];
  return (
    <div className="aef-rh">
      <nav className="aef-rh__tabs" aria-label="Seções do RH">
        {sections.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined} className="aef-rh__tab">
            {label}
            {id === "ocorrencias" && !canAccessOccurrences && <span aria-label="restrito"><Icon name="lock" size={12} /></span>}
          </button>
        ))}
      </nav>
      {section === "visao" && <RHOverview attendance={attendance} feedbacks={feedbacks} occurrences={occurrences} onNavigate={setSection} mobile={mobile} />}
      {section === "rede" && <RHNetwork mobile={mobile} members={users} />}
      {section === "participacao" && <RHParticipation attendance={attendance} />}
      {section === "feedbacks" && <RHFeedbacks feedbacks={feedbacks} onAdd={addFeedback} />}
      {section === "ocorrencias" && <RHOccurrences occurrences={occurrences} onAdd={addOccurrence} canAccess={canAccessOccurrences} />}
      {section === "acessos" && canManageAccess && <Acessos currentUser={user} users={users} onSaveUser={onSaveUser} onToggleUserStatus={onToggleUserStatus} onResetUsers={onResetUsers} />}
    </div>
  );
}

// ─── PLACEHOLDER ──────────────────────────────────────────────────────────────
function Placeholder({ title, icon, desc }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Icon name={icon} size={24} color={C.textTertiary} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5, margin: "0 0 10px", textAlign: "center", fontFamily: FONT_DISPLAY }}>{title}</h2>
      <p style={{ color: C.textSecondary, fontSize: 14, maxWidth: 360, lineHeight: 1.7, textAlign: "center", margin: "0 0 24px" }}>{desc}</p>
      <div style={{ padding: "8px 18px", background: C.bg, borderRadius: 8, fontSize: 12, color: C.textTertiary, border: `1px solid ${C.border}` }}>
        Em desenvolvimento
      </div>
    </div>
  );
}

// ─── OPERAÇÕES ────────────────────────────────────────────────────────────────
const ACOES_MOCK = [
  {
    id: 1, nome: "Café de Rua", tipo: "Café de Rua", data: "26/04/2025",
    status: "em andamento", voluntarios: 12, responsavel: "Flávia Souza",
    pop: {
      cardapio: [
        { item: "Café com Leite (20L)", qtd: "20L", responsavel: "Flávia / Rebeca / Matheus", status: "pendente" },
        { item: "Suco (24L)", qtd: "24L", responsavel: "Arícia", status: "concluído" },
        { item: "Pão com Hot Dog", qtd: "200 un", responsavel: "Ingrid", status: "pendente" },
        { item: "Pão com Mortadela", qtd: "250 un", responsavel: "", status: "pendente" },
        { item: "Frutas (Mamão e Banana)", qtd: "—", responsavel: "Alan", status: "concluído" },
      ],
      afazeres: [
        { item: "Verificar Pães (450 un)", responsavel: "Aleffe", status: "pendente" },
        { item: "Verificar inventário (garrafas, descartáveis, lixo, luva, copo)", responsavel: "Arícia", status: "concluído" },
        { item: "Fazer compras necessárias", responsavel: "Alan", status: "pendente" },
      ],
      procedimentos: [
        { item: "Lançar listas — Grupo Fixos", responsavel: "Flávia", status: "concluído" },
        { item: "Lançar listas — Grupo Voluntários", responsavel: "Flávia", status: "pendente" },
        { item: "Realizar sorteio e divulgar lista", responsavel: "Flávia", status: "pendente" },
        { item: "Incluir no grupo da ação", responsavel: "Flávia", status: "pendente" },
        { item: "Ministrar capacitação", responsavel: "Flávia", status: "pendente" },
        { item: "Dividir carros", responsavel: "Flávia", status: "pendente" },
      ],
      acao: [
        { item: "Lista de presentes", responsavel: "Flávia", status: "pendente" },
        { item: "Ponto de encontro", responsavel: "Aleffe", status: "pendente" },
      ],
      financeiro: [
        { item: "Fazer compras", responsavel: "Alan", status: "pendente" },
      ],
      marketing: [
        { item: "Bater fotos", responsavel: "Duda", status: "pendente" },
        { item: "Cobertura durante a ação", responsavel: "Duda", status: "pendente" },
      ],
    }
  },
  {
    id: 2, nome: "Ação de Saúde — Guamá", tipo: "Saúde", data: "19/04/2025",
    status: "concluída", voluntarios: 8, responsavel: "Dr. Marcos Farias", pop: null,
  },
  {
    id: 3, nome: "Visita Orfanato Santa Clara", tipo: "Orfanato", data: "12/04/2025",
    status: "concluída", voluntarios: 6, responsavel: "Alan Costa", pop: null,
  },
];

const statusCfgOp = {
  "em andamento": { bg: "#FFF8E1", text: "#B45309", dot: "#F59E0B" },
  "concluída":    { bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
  "planejamento": { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6" },
};

const tipoCfg = {
  "Café de Rua": { bg: "#FFF7ED", text: "#C2410C" },
  "Saúde":       { bg: "#FEF2F2", text: "#DC2626" },
  "Orfanato":    { bg: "#F5F3FF", text: "#6D28D9" },
  "Jurídico":    { bg: "#EFF6FF", text: "#1D4ED8" },
  "Social":      { bg: "#F0FDF4", text: "#166534" },
};

const OPS_STATUS_TONE = { "em andamento": "amber", "concluída": "green", "planejamento": "blue" };
const OPS_TIPO_TONE = { "Café de Rua": "orange", "Saúde": "red", "Orfanato": "purple", "Jurídico": "blue", "Social": "green" };
const OPS_AREA_TONE = { "Saúde": "red", "Jurídico": "blue", "Operações": "green", "Logística": "orange", "Alimentação": "purple" };

function TaskRow({ task, onToggle }) {
  const done = task.status === "concluído";
  return (
    <li className="aef-ops__task" data-done={done ? "true" : undefined}>
      <button type="button" className="aef-ops__check" aria-pressed={done} aria-label={(done ? "Desmarcar " : "Concluir ") + task.item} onClick={onToggle}>
        {done && <Icon name="check" size={12} strokeWidth={3} />}
      </button>
      <div className="aef-ops__task-main">
        <div className="aef-ops__task-name">{task.item}</div>
        {task.qtd && task.qtd !== "—" && <div className="aef-ops__task-qty">{task.qtd}</div>}
      </div>
      <div className="aef-ops__task-owner" data-missing={task.responsavel ? undefined : "true"}>
        {task.responsavel || "Sem responsável"}
      </div>
    </li>
  );
}

function POPSection({ title, tasks, onToggle }) {
  const [open, setOpen] = useState(true);
  const done = tasks.filter(t => t.status === "concluído").length;
  return (
    <div className="aef-ops__pop-section">
      <button type="button" className="aef-ops__pop-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="aef-ops__pop-title">
          {title}
          <span className="aef-ops__pop-count" data-tone={done === tasks.length ? "green" : undefined}>{done}/{tasks.length}</span>
        </span>
        <span className="aef-ops__chev" aria-hidden="true"><Icon name="chevronRight" size={16} /></span>
      </button>
      {open && (
        <ul className="aef-ops__tasks">
          {tasks.map((t, i) => (
            <TaskRow key={i} task={t} onToggle={() => onToggle(i)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AcaoDetail({ acao, onBack, mobile, user }) {
  const [pop, setPop] = useState(acao.pop ? JSON.parse(JSON.stringify(acao.pop)) : null);
  const [tab, setTab] = useState("pop");
  const [showSorteio, setShowSorteio] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [sorteioStored, setSorteioStored] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`aef_sorteio_${acao.id}`) || "null"); } catch { return null; }
  });
  const [inscricoes, setInscricoes] = useState(() => {
    const def = { status: "fechada", abertaEm: null, fechadaEm: null, inscritos: [], imagem: null, descricao: "" };
    try {
      const stored = JSON.parse(localStorage.getItem(`aef_inscricoes_${acao.id}`) || "null");
      return stored ? { ...def, ...stored } : def;
    } catch { return def; }
  });
  const [showEditor, setShowEditor] = useState(false);
  const [pixData, setPixData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`aef_pix_${acao.id}`) || "null"); } catch { return null; }
  });
  const [copiadoPix, setCopiadoPix] = useState("");

  const gerarPix = () => {
    const slug = acao.nome.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    const sufixo = Math.random().toString(36).slice(2, 6).toUpperCase();
    const txid = `AEF-${slug}-${sufixo}`;
    const novo = {
      txid,
      chave: "doacoes@amoremfoco.org",
      criadoEm: new Date().toLocaleString("pt-BR"),
      payload: `00020126580014BR.GOV.BCB.PIX0125doacoes@amoremfoco.org5204000053039865406000.005802BR5913AMOR EM FOCO6005BELEM62${String(txid.length + 4).padStart(2, "0")}05${String(txid.length).padStart(2, "0")}${txid}6304ABCD`,
    };
    try { localStorage.setItem(`aef_pix_${acao.id}`, JSON.stringify(novo)); } catch {}
    setPixData(novo);
  };
  const copiarPix = (campo, valor) => {
    navigator.clipboard.writeText(valor).then(() => {
      setCopiadoPix(campo);
      setTimeout(() => setCopiadoPix(""), 1500);
    });
  };

  useEffect(() => {
    try { localStorage.setItem(`aef_inscricoes_${acao.id}`, JSON.stringify(inscricoes)); } catch {}
  }, [inscricoes, acao.id]);

  const recarregarSorteio = () => {
    try { setSorteioStored(JSON.parse(localStorage.getItem(`aef_sorteio_${acao.id}`) || "null")); } catch {}
  };

  const linkInscricao = `https://amoremfoco.org/inscricao/${acao.id}`;
  const copiarLink = () => {
    navigator.clipboard.writeText(linkInscricao).then(() => {
      setCopiadoLink(true);
      setTimeout(() => setCopiadoLink(false), 1800);
    });
  };
  const abrirInscricoes = () => setInscricoes(prev => ({ ...prev, status: "aberta", abertaEm: new Date().toISOString() }));
  const fecharInscricoes = () => {
    if (!confirm("Fechar inscrições? Novos voluntários não conseguirão mais se inscrever.")) return;
    setInscricoes(prev => ({ ...prev, status: "fechada", fechadaEm: new Date().toISOString() }));
  };
  const removerInscrito = (id) => {
    if (!confirm("Remover este inscrito?")) return;
    setInscricoes(prev => ({ ...prev, inscritos: prev.inscritos.filter(i => i.id !== id) }));
  };
  const adicionarInscrito = (novo) => {
    setInscricoes(prev => ({ ...prev, inscritos: [...prev.inscritos, { id: Date.now(), inscritoEm: new Date().toISOString(), ...novo }] }));
  };
  const handleImagemUpload = (file) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert("Imagem muito grande. Use até 4 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setInscricoes(prev => ({ ...prev, imagem: reader.result }));
    reader.readAsDataURL(file);
  };
  const removerImagem = () => setInscricoes(prev => ({ ...prev, imagem: null }));
  const atualizarDescricao = (texto) => setInscricoes(prev => ({ ...prev, descricao: texto }));

  const toggleTask = (section, idx) => {
    setPop(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const t = next[section][idx];
      t.status = t.status === "concluído" ? "pendente" : "concluído";
      return next;
    });
  };

  const totalTasks = pop ? Object.values(pop).flat().length : 0;
  const doneTasks = pop ? Object.values(pop).flat().filter(t => t.status === "concluído").length : 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const sections = pop ? [
    { key: "cardapio", label: "Cardápio" },
    { key: "afazeres", label: "Afazeres Gerais" },
    { key: "procedimentos", label: "Procedimentos Pré e Pós Ação" },
    { key: "acao", label: "Durante a Ação" },
    { key: "financeiro", label: "Financeiro" },
    { key: "marketing", label: "Marketing" },
  ] : [];

  const detailTabs = [["pop", "POP"], ["voluntarios", "Voluntários"], ["inscricoes", `Inscrições${inscricoes.inscritos.length > 0 ? ` (${inscricoes.inscritos.length})` : ""}`], ["sorteio", "Sorteio"], ["pix", "PIX da ação"]];
  const renderDrawList = (titulo, lista, tom, vazio) => (
    <div className="aef-ops__draw-list" data-tone={tom}>
      <div className="aef-ops__draw-head"><span>{titulo} ({lista.length})</span></div>
      <ul className="aef-ops__people aef-ops__draw-body">
        {lista.length === 0 ? (
          <li className="aef-ops__draw-empty">{vazio}</li>
        ) : lista.map((v, i) => (
          <li key={v.name} className="aef-ops__person" data-tone={tom}>
            <span className="aef-ops__num">{i + 1}.</span>
            <div className="aef-ops__person-main">
              <div className="aef-ops__person-name">{v.name}{v.novato && <span className="aef-ops__tag" data-tone="green">Novato</span>}</div>
              {v.telefone && <div className="aef-ops__hint" style={{ marginTop: 0 }}>{v.telefone}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="aef-ops">
      <button type="button" className="aef-ops__back" onClick={onBack}>
        <span className="aef-ops__flip" aria-hidden="true"><Icon name="chevronRight" size={16} /></span>
        Operações
      </button>

      <header>
        <div className="aef-ops__detail-head">
          <div style={{ minWidth: 0 }}>
            <h1 className="aef-ops__title">{acao.nome}</h1>
            <div className="aef-ops__labels">
              <span className="aef-ops__tone" data-tone={OPS_TIPO_TONE[acao.tipo] || "neutral"}>{acao.tipo}</span>
              <span className="aef-ops__tone aef-ops__cap" data-tone={OPS_STATUS_TONE[acao.status] || "neutral"}>{acao.status}</span>
            </div>
          </div>
          <div className="aef-ops__detail-facts">
            <span>{acao.data}</span>
            <span>{acao.voluntarios} voluntários</span>
          </div>
        </div>

        {pop && (
          <div className="aef-ops__progress" data-tone={progress === 100 ? "green" : undefined}>
            <div className="aef-ops__progress-head"><span>Progresso do POP</span><strong>{progress}%</strong></div>
            <div className="aef-ops__track" role="progressbar" aria-label="Progresso do POP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
            <div className="aef-ops__hint" style={{ marginTop: 0 }}>{doneTasks} de {totalTasks} tarefas concluídas</div>
          </div>
        )}
      </header>

      <nav className="aef-ops__tabs" aria-label="Seções da ação">
        {detailTabs.map(([id, label]) => (
          <button key={id} type="button" className="aef-ops__tab" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
            {label}
            {id === "sorteio" && sorteioStored && <span className="aef-ops__tab-check" aria-label="realizado"><Icon name="check" size={13} strokeWidth={2.5} /></span>}
          </button>
        ))}
      </nav>

      {tab === "pop" && pop && (
        <div className="aef-ops__panel aef-ops__pop">
          {sections.map(s => (
            <POPSection
              key={s.key}
              title={s.label}
              tasks={pop[s.key]}
              onToggle={idx => toggleTask(s.key, idx)}
            />
          ))}
        </div>
      )}

      {tab === "voluntarios" && (
        <ul className="aef-ops__panel aef-ops__people">
          {volunteers.slice(0, acao.voluntarios).map((v, i) => (
            <li key={i} className="aef-ops__person">
              <div className="aef-ops__person-main">
                <div className="aef-ops__person-name">{v.name}</div>
                <div className="aef-ops__hint" style={{ marginTop: 0 }}>{v.formation}</div>
              </div>
              <span className="aef-ops__tone" data-tone={OPS_AREA_TONE[v.area] || "red"}>{v.area}</span>
            </li>
          ))}
        </ul>
      )}

      {tab === "pop" && !pop && (
        <div className="aef-ops__panel aef-ops__empty">
          <p className="aef-ops__hint">POP ainda não cadastrado para esta ação.</p>
        </div>
      )}

      {tab === "sorteio" && (
        <div className="aef-ops__panel aef-ops__panel--pad">
          {sorteioStored ? (
            <div className="aef-ops__stack">
              <div className="aef-ops__status-row">
                <div>
                  <p className="aef-ops__ok"><span aria-hidden="true"><Icon name="check" size={16} strokeWidth={2.5} /></span>Sorteio realizado</p>
                  <div className="aef-ops__meta" style={{ marginTop: "var(--space-2xs)" }}>
                    <span>{sorteioStored.resultado.sorteados.length} sorteados</span>
                    <span>{sorteioStored.resultado.reserva.length} reserva</span>
                    <span>gerado em {sorteioStored.resultado.geradaEm}</span>
                  </div>
                  {sorteioStored.resultado.geradoPor && (
                    <p className="aef-ops__hint">Gerado por <strong style={{ color: "var(--color-ink)", fontWeight: 600 }}>{sorteioStored.resultado.geradoPor}</strong></p>
                  )}
                </div>
                <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => setShowSorteio(true)}>Abrir / Refazer</button>
              </div>
              <div className="aef-ops__draw">
                {renderDrawList("Sorteados", sorteioStored.resultado.sorteados, "green", "Sem sorteados")}
                {renderDrawList("Reserva", sorteioStored.resultado.reserva, undefined, "Sem reserva")}
              </div>
            </div>
          ) : (
            <div className="aef-ops__empty">
              <span className="aef-ops__empty-icon" aria-hidden="true"><Icon name="users" size={24} strokeWidth={1.8} /></span>
              <h3 className="aef-ops__h2">Nenhum sorteio realizado</h3>
              <p className="aef-ops__hint">Sorteie a equipe desta ação a partir do banco de voluntários do RH. Os telefones serão incluídos automaticamente.</p>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={() => setShowSorteio(true)} style={{ marginTop: "var(--space-xs)" }}>
                <span aria-hidden="true"><Icon name="users" size={15} strokeWidth={2} /></span>
                Realizar sorteio
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "inscricoes" && (
        <div className="aef-ops__stack">
          <section className="aef-ops__panel aef-ops__panel--pad aef-ops__stack">
            <div className="aef-ops__status-row">
              <div>
                <h2 className="aef-ops__h2" data-tone={inscricoes.status === "aberta" ? "green" : undefined} style={{ color: "var(--tone, var(--color-ink))" }}>
                  {inscricoes.status === "aberta" ? "Inscrições abertas" : "Inscrições fechadas"}
                </h2>
                <p className="aef-ops__hint">
                  {inscricoes.inscritos.length} {inscricoes.inscritos.length === 1 ? "pessoa inscrita" : "pessoas inscritas"}
                </p>
              </div>
              {inscricoes.status === "aberta" ? (
                <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={fecharInscricoes}>Fechar inscrições</button>
              ) : (
                <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={abrirInscricoes}>Abrir inscrições</button>
              )}
            </div>

            {inscricoes.status === "aberta" && (
              <>
                <div className="aef-ops__field">
                  <span className="aef-ops__label">Link para o grupo do WhatsApp</span>
                  <div className="aef-ops__copy-row">
                    <div className="aef-ops__value">{linkInscricao}</div>
                    <button type="button" className="aef-ops__btn aef-ops__btn--outline" data-done={copiadoLink ? "true" : undefined} onClick={copiarLink} aria-live="polite">
                      {copiadoLink ? "Copiado" : "Copiar link"}
                    </button>
                    <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => setShowPreview(true)}>
                      <span aria-hidden="true"><Icon name="eye" size={14} /></span> Ver página
                    </button>
                  </div>
                </div>
                <div className="aef-ops__qr-row">
                  <img className="aef-ops__qr" alt="QR Code" src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(linkInscricao)}`} />
                  <p>
                    Compartilhe o link no grupo ou cole o QR Code num story.<br />
                    Inscrições serão registradas em tempo real nesta página.
                  </p>
                </div>

                <button type="button" className="aef-ops__disclosure" aria-expanded={showEditor} onClick={() => setShowEditor(s => !s)}>
                  <span className="aef-ops__disclosure-label">
                    <span aria-hidden="true"><Icon name="settings" size={14} /></span>
                    Personalizar página (foto + descrição)
                  </span>
                  <span className="aef-ops__chev" aria-hidden="true"><Icon name="chevronRight" size={14} /></span>
                </button>

                {showEditor && (
                  <div className="aef-ops__editor">
                    <div className="aef-ops__field">
                      <span className="aef-ops__label">Foto de capa</span>
                      {inscricoes.imagem ? (
                        <div>
                          <img className="aef-ops__cover" src={inscricoes.imagem} alt="Capa" />
                          <div className="aef-ops__row-btns">
                            <label className="aef-ops__btn aef-ops__btn--outline aef-ops__btn--grow aef-ops__file-label">
                              Trocar imagem
                              <input className="aef-ops__file" type="file" accept="image/*" onChange={(e) => handleImagemUpload(e.target.files?.[0])} />
                            </label>
                            <button type="button" className="aef-ops__btn aef-ops__btn--outline" style={{ color: "var(--color-accent)" }} onClick={removerImagem}>Remover</button>
                          </div>
                        </div>
                      ) : (
                        <label className="aef-ops__drop">
                          <span className="aef-ops__empty-icon" aria-hidden="true"><Icon name="camera" size={22} strokeWidth={1.8} /></span>
                          <span className="aef-ops__h3">Adicionar foto de capa</span>
                          <span className="aef-ops__hint" style={{ marginTop: 0 }}>JPG ou PNG, até 4 MB</span>
                          <input className="aef-ops__file" type="file" accept="image/*" onChange={(e) => handleImagemUpload(e.target.files?.[0])} />
                        </label>
                      )}
                    </div>

                    <div className="aef-ops__field">
                      <label className="aef-ops__label" htmlFor={`ops-desc-${acao.id}`}>Descrição da ação</label>
                      <textarea
                        id={`ops-desc-${acao.id}`}
                        className="aef-ops__textarea"
                        value={inscricoes.descricao}
                        onChange={(e) => atualizarDescricao(e.target.value)}
                        placeholder="Conte o que vai acontecer nesta ação. Quem vai ser atendido, onde, qual o horário, se tem treinamento obrigatório, materiais que o voluntário precisa levar…"
                        rows={6}
                      />
                      <p className="aef-ops__hint">Aparece em destaque na página pública, antes do formulário. Pode usar emojis e quebras de linha.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="aef-ops__panel">
            <div className="aef-ops__panel-head">
              <h2 className="aef-ops__h3">Inscritos ({inscricoes.inscritos.length})</h2>
              {inscricoes.inscritos.length > 0 && (
                <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={() => setShowSorteio(true)}>
                  <span aria-hidden="true"><Icon name="users" size={13} strokeWidth={2} /></span>
                  Sortear destes
                </button>
              )}
            </div>
            {inscricoes.inscritos.length === 0 ? (
              <div className="aef-ops__empty">
                <p className="aef-ops__hint">
                  {inscricoes.status === "aberta" ? "Aguardando inscrições. Compartilhe o link acima." : "Abra as inscrições para receber voluntários."}
                </p>
              </div>
            ) : (
              <ul className="aef-ops__people">
                {inscricoes.inscritos.map((i) => (
                  <li key={i.id} className="aef-ops__person">
                    <div className="aef-ops__person-main">
                      <div className="aef-ops__person-name">{i.nome}{i.novato && <span className="aef-ops__tag" data-tone="green">Novato</span>}</div>
                      <div className="aef-ops__meta">
                        {i.idade && <span>{i.idade} anos</span>}
                        <span>{i.telefone}</span>
                        {i.ultimaAcao && <span>{i.ultimaAcao}</span>}
                        {i.emergencia && <span>emerg.: {i.emergencia}</span>}
                      </div>
                    </div>
                    <button type="button" className="aef-ops__icon-btn" title="Remover" aria-label={"Remover " + i.nome} onClick={() => removerInscrito(i.id)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "pix" && (
        <div className="aef-ops__panel aef-ops__panel--pad">
          {pixData ? (
            <div className="aef-ops__stack">
              <div className="aef-ops__status-row">
                <div>
                  <p className="aef-ops__ok"><span aria-hidden="true"><Icon name="check" size={16} strokeWidth={2.5} /></span>PIX da ação configurado</p>
                  <p className="aef-ops__hint">Todo PIX recebido com este txid será vinculado automaticamente à ação.</p>
                  <p className="aef-ops__hint">Criado em {pixData.criadoEm}</p>
                </div>
                <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => { if (confirm("Regenerar PIX? O txid antigo deixará de funcionar.")) gerarPix(); }}>Regenerar</button>
              </div>

              <div className="aef-ops__pix">
                <div className="aef-ops__pix-qr">
                  <img alt="QR Code PIX" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.payload)}`} />
                </div>
                <div className="aef-ops__stack">
                  <div className="aef-ops__field">
                    <span className="aef-ops__label">Chave PIX</span>
                    <div className="aef-ops__copy-row">
                      <div className="aef-ops__value">{pixData.chave}</div>
                      <button type="button" className="aef-ops__btn aef-ops__btn--outline" data-done={copiadoPix === "chave" ? "true" : undefined} onClick={() => copiarPix("chave", pixData.chave)}>{copiadoPix === "chave" ? "Copiado" : "Copiar"}</button>
                    </div>
                  </div>
                  <div className="aef-ops__field">
                    <span className="aef-ops__label">Identificador (txid)</span>
                    <div className="aef-ops__copy-row">
                      <div className="aef-ops__value aef-ops__value--code">{pixData.txid}</div>
                      <button type="button" className="aef-ops__btn aef-ops__btn--outline" data-done={copiadoPix === "txid" ? "true" : undefined} onClick={() => copiarPix("txid", pixData.txid)}>{copiadoPix === "txid" ? "Copiado" : "Copiar"}</button>
                    </div>
                  </div>
                  <div className="aef-ops__field">
                    <span className="aef-ops__label">PIX Copia e Cola</span>
                    <div className="aef-ops__copy-row">
                      <div className="aef-ops__value aef-ops__value--muted">{pixData.payload}</div>
                      <button type="button" className="aef-ops__btn aef-ops__btn--outline" data-done={copiadoPix === "payload" ? "true" : undefined} onClick={() => copiarPix("payload", pixData.payload)}>{copiadoPix === "payload" ? "Copiado" : "Copiar"}</button>
                    </div>
                  </div>
                  <p className="aef-ops__note aef-ops__note--amber">
                    Coloque o QR Code no story ou status do WhatsApp. Quando alguém doar, o Hub avisa no Mural e contabiliza esta ação automaticamente.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="aef-ops__empty">
              <span className="aef-ops__empty-icon" aria-hidden="true"><Icon name="dollar" size={24} strokeWidth={1.8} /></span>
              <h3 className="aef-ops__h2">Crie um PIX exclusivo para esta ação</h3>
              <p className="aef-ops__hint">
                Cada PIX recebido com este identificador será vinculado automaticamente à ação <b>{acao.nome}</b>. Você verá quanto a ação arrecadou separado do caixa geral.
              </p>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={gerarPix} style={{ marginTop: "var(--space-xs)" }}>
                <span aria-hidden="true"><Icon name="dollar" size={15} strokeWidth={2} /></span>
                Gerar PIX da ação
              </button>
            </div>
          )}
        </div>
      )}

      {showPreview && <PreviewPaginaInscricao acao={acao} linkInscricao={linkInscricao} imagem={inscricoes.imagem} descricao={inscricoes.descricao} onClose={() => setShowPreview(false)} onInscrever={adicionarInscrito} />}
      {showSorteio && <ModalSorteio acao={acao} user={user} onClose={() => { setShowSorteio(false); recarregarSorteio(); }} mobile={mobile} inscritos={inscricoes.inscritos.length > 0 ? inscricoes.inscritos : null} />}
    </div>
  );
}

const EXPERIENCIA_OPCOES = [
  { id: "cafe_rua", label: "Sim, já participei de Café de Rua" },
  { id: "outra_acao", label: "Sim, já participei de outro tipo de ação" },
  { id: "primeira_vez", label: "É a minha primeira vez" },
];

function PreviewPaginaInscricao({ acao, linkInscricao, imagem, descricao, onClose, onInscrever }) {
  const [form, setForm] = useState({ nome: "", idade: "", experiencia: null, telefone: "", emergencia: "", termo: false });
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const submeter = () => {
    setErro("");
    if (!form.nome.trim() || form.nome.trim().length < 3) return setErro("Digite seu nome completo.");
    const idade = parseInt(form.idade, 10);
    if (!idade || idade < 12 || idade > 100) return setErro("Digite uma idade válida.");
    if (!form.experiencia) return setErro("Conta pra gente se você já participou de alguma ação.");
    if (!form.telefone.trim() || form.telefone.replace(/\D/g, "").length < 10) return setErro("Digite um WhatsApp válido.");
    if (!form.emergencia.trim() || form.emergencia.replace(/\D/g, "").length < 10) return setErro("Digite um contato de emergência válido.");
    if (!form.termo) return setErro("É necessário concordar com o termo de compromisso.");
    const ultimaAcao = form.experiencia === "cafe_rua" ? "Café de Rua" : form.experiencia === "outra_acao" ? "Outra ação AEF" : null;
    onInscrever({
      nome: form.nome.trim(),
      idade,
      telefone: form.telefone.trim(),
      emergencia: form.emergencia.trim(),
      experiencia: form.experiencia,
      novato: form.experiencia === "primeira_vez",
      ultimaAcao,
    });
    setEnviado(true);
  };

  return (
    <div className="aef-ops aef-ops__scrim aef-ops__scrim--center" onClick={onClose}>
      <div className="aef-ops__dialog aef-ops__dialog--public" role="dialog" aria-modal="true" aria-labelledby="ops-public-title" onClick={(e) => e.stopPropagation()}>
        <div className="aef-ops__dialog-head">
          <div style={{ minWidth: 0 }}>
            <p className="aef-ops__h3">Prévia da página pública</p>
            <p className="aef-ops__url">{linkInscricao}</p>
          </div>
          <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose}>Fechar</button>
        </div>
        <div className="aef-ops__dialog-body" style={{ padding: 0 }}>
          {imagem && (
            <div className="aef-ops__public-cover">
              <img src={imagem} alt={acao.nome} />
            </div>
          )}
          <div className="aef-ops__dialog-body aef-ops__stack">
            <div className="aef-ops__public-brand">
              <img className="aef-ops__public-logo" src="/logo-vermelha.png" alt="" />
              <h2 id="ops-public-title" className="aef-ops__dialog-title">Amor em Foco</h2>
              <p className="aef-ops__hint" style={{ marginTop: 0 }}>Inscrição de voluntário</p>
            </div>

            <div className="aef-ops__public-action">
              <span className="aef-ops__public-type">{acao.tipo}</span>
              <span className="aef-ops__h3">{acao.nome}</span>
              <span className="aef-ops__meta-item aef-ops__hint" style={{ marginTop: 0 }}><span aria-hidden="true"><Icon name="calendar" size={13} /></span>{acao.data}</span>
            </div>

            {!enviado && (
              descricao && descricao.trim()
                ? <div className="aef-ops__public-desc">{descricao}</div>
                : <div className="aef-ops__public-desc" data-placeholder="true">Iremos servir café da manhã para pessoas em situação de rua em Belém. <b>Treinamento online obrigatório</b> antes da ação, com data e link enviados a quem for sorteado.</div>
            )}

          {enviado ? (
            <div className="aef-ops__public-done" role="status">
              <span className="aef-ops__public-done-icon" aria-hidden="true"><Icon name="check" size={32} strokeWidth={2.5} /></span>
              <h3 className="aef-ops__dialog-title">Inscrição confirmada!</h3>
              <p className="aef-ops__hint">O resultado do sorteio será divulgado no grupo. Obrigado por se voluntariar.</p>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={onClose}>Fechar</button>
            </div>
          ) : (
            <>
              <div className="aef-ops__form">
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-pub-nome">Nome completo *</label>
                  <input id="ops-pub-nome" className="aef-ops__input" type="text" autoComplete="name" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Seu nome" />
                </div>
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-pub-idade">Idade *</label>
                  <input id="ops-pub-idade" className="aef-ops__input" type="number" min={12} max={100} value={form.idade} onChange={e => setForm(p => ({ ...p, idade: e.target.value }))} placeholder="Sua idade" />
                </div>
                <div className="aef-ops__field">
                  <span className="aef-ops__label" id="ops-pub-exp">Você já participou de alguma ação do Amor em Foco? *</span>
                  <div className="aef-ops__choices" role="radiogroup" aria-labelledby="ops-pub-exp">
                    {EXPERIENCIA_OPCOES.map(opt => {
                      const ativo = form.experiencia === opt.id;
                      return (
                        <button key={opt.id} type="button" role="radio" aria-checked={ativo} className="aef-ops__choice" onClick={() => setForm(p => ({ ...p, experiencia: opt.id }))}>
                          <span className="aef-ops__radio" aria-hidden="true" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-pub-tel">Seu contato (WhatsApp) *</label>
                  <input id="ops-pub-tel" className="aef-ops__input" type="tel" autoComplete="tel" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(91) 9XXXX-XXXX" />
                </div>
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-pub-emerg">Contato de emergência *</label>
                  <input id="ops-pub-emerg" className="aef-ops__input" type="tel" value={form.emergencia} onChange={e => setForm(p => ({ ...p, emergencia: e.target.value }))} placeholder="Familiar ou pessoa próxima" />
                </div>
                <div className="aef-ops__note aef-ops__stack" style={{ gap: "var(--space-xs)" }}>
                  <span className="aef-ops__label">Termo de compromisso</span>
                  <p>
                    Declaro que participarei do treinamento online obrigatório, comparecerei à ação no horário marcado, seguirei as orientações da diretoria e estou ciente de que minha inscrição não garante a vaga (será definida por sorteio).
                  </p>
                  <label className="aef-ops__checkline">
                    <input type="checkbox" checked={form.termo} onChange={e => setForm(p => ({ ...p, termo: e.target.checked }))} />
                    Sim, concordo.
                  </label>
                </div>
              </div>
              {erro && <p className="aef-ops__error" role="alert">{erro}</p>}
              <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--block" onClick={submeter}>
                Quero participar
              </button>
              <p className="aef-ops__fineprint">Esta página é uma simulação. No deploy real ela ficará em <b>amoremfoco.org/inscricao/{acao.id}</b> e qualquer pessoa com o link poderá se inscrever.</p>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ModalSorteio({ acao, user, onClose, mobile, inscritos: inscritosFonte }) {
  const storageKey = `aef_sorteio_${acao.id}`;
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "null"); } catch { return null; }
  })();

  // Quando há lista de inscritos da página pública, ela vira o pool; senão usa o banco RH inteiro
  const pool = inscritosFonte && inscritosFonte.length > 0
    ? inscritosFonte.map(i => ({
        name: i.nome,
        telefone: i.telefone,
        novato: i.novato,
        penalizado: false,
        area: i.ultimaAcao ? "Voluntário(a)" : "Novo cadastro",
        initials: i.nome.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase(),
        actions: i.novato ? 0 : 1,
      }))
    : volunteers;
  const origemPool = inscritosFonte && inscritosFonte.length > 0 ? "inscricoes" : "rh";

  const [etapa, setEtapa] = useState(stored ? "resultado" : "config");
  const [vagas, setVagas] = useState(stored?.vagas ?? (acao.voluntarios > 0 ? acao.voluntarios : 12));
  const [minNovatos, setMinNovatos] = useState(stored?.minNovatos ?? 3);
  const [inscritos, setInscritos] = useState(() => {
    if (stored?.inscritos) return stored.inscritos;
    const init = {};
    pool.forEach(v => { init[v.name] = !v.penalizado; });
    return init;
  });
  const [resultado, setResultado] = useState(stored?.resultado || null);
  const [copiado, setCopiado] = useState("");

  const elegiveis = pool.filter(v => inscritos[v.name] && !v.penalizado);
  const totalNovatos = elegiveis.filter(v => v.novato).length;
  const totalVeteranos = elegiveis.filter(v => !v.novato).length;
  const podeSortear = elegiveis.length >= vagas && vagas > 0;

  const realizar = () => {
    const novatos = elegiveis.filter(v => v.novato);
    const veteranos = elegiveis.filter(v => !v.novato);
    const minNov = Math.min(minNovatos, novatos.length, vagas);
    const novatosSorteados = shuffle(novatos).slice(0, minNov);
    const novatosRestantes = novatos.filter(n => !novatosSorteados.includes(n));
    const restoPool = shuffle([...novatosRestantes, ...veteranos]);
    const completar = restoPool.slice(0, vagas - novatosSorteados.length);
    const sorteados = [...novatosSorteados, ...completar];
    const reserva = restoPool.slice(vagas - novatosSorteados.length);
    const novoResultado = { sorteados, reserva, geradaEm: new Date().toLocaleString("pt-BR"), geradoPor: user?.name || "—" };
    setResultado(novoResultado);
    setEtapa("resultado");
    try {
      localStorage.setItem(storageKey, JSON.stringify({ vagas, minNovatos, inscritos, resultado: novoResultado }));
    } catch (e) { console.warn("Erro ao salvar sorteio", e); }
  };

  const refazer = () => {
    if (!confirm("Refazer o sorteio? O resultado atual será substituído.")) return;
    setResultado(null);
    setEtapa("config");
  };

  const linhaTexto = (v, i) => {
    const tel = v.telefone ? ` — ${v.telefone}` : "";
    const tag = v.novato ? " (novato)" : "";
    return `${i + 1}. ${v.name}${tag}${tel}`;
  };

  const copiar = (tipo) => {
    if (!resultado) return;
    const header = `*${acao.nome}* — ${acao.data}`;
    let texto = "";
    if (tipo === "sorteados") {
      texto = `${header}\n*SORTEADOS (${resultado.sorteados.length}):*\n` + resultado.sorteados.map(linhaTexto).join("\n");
    } else if (tipo === "reserva") {
      texto = `${header}\n*LISTA RESERVA (${resultado.reserva.length}):*\n` + resultado.reserva.map(linhaTexto).join("\n");
    } else {
      const sortLines = resultado.sorteados.map(linhaTexto).join("\n");
      const resLines = resultado.reserva.map(linhaTexto).join("\n");
      texto = `${header}\nSorteio gerado em ${resultado.geradaEm}${resultado.geradoPor ? ` por ${resultado.geradoPor}` : ""}\n\n*SORTEADOS (${resultado.sorteados.length}):*\n${sortLines}\n\n*RESERVA (${resultado.reserva.length}):*\n${resLines}`;
    }
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(tipo);
      setTimeout(() => setCopiado(""), 1800);
    });
  };

  const renderResultList = (titulo, lista, tipo, tom, vazio, botaoCopiar) => (
    <div className="aef-ops__draw-list" data-tone={tom}>
      <div className="aef-ops__draw-head">
        <span>{titulo} ({lista.length})</span>
        {botaoCopiar}
      </div>
      <ul className="aef-ops__people aef-ops__draw-body">
        {lista.length === 0 ? (
          <li className="aef-ops__draw-empty">{vazio}</li>
        ) : lista.map((v, i) => (
          <li key={v.name} className="aef-ops__person" data-tone={tom}>
            <span className="aef-ops__num">{i + 1}.</span>
            <div className="aef-ops__person-main">
              <div className="aef-ops__person-name">{v.name}{v.novato && <span className="aef-ops__tag" data-tone="green">Novato</span>}</div>
              {v.telefone && <div className="aef-ops__hint" style={{ marginTop: 0 }}>{v.telefone}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="aef-ops aef-ops__scrim" onClick={onClose}>
      <div className="aef-ops__dialog aef-ops__dialog--wide" role="dialog" aria-modal="true" aria-labelledby="ops-sorteio-title" onClick={(e) => e.stopPropagation()}>
        <div className="aef-ops__dialog-head">
          <div style={{ minWidth: 0 }}>
            <h2 id="ops-sorteio-title" className="aef-ops__dialog-title">Sorteio: {acao.nome}</h2>
            <div className="aef-ops__meta" style={{ marginTop: "var(--space-2xs)" }}>
              <span>{acao.data}</span>
              {etapa === "config" && <span>Configure critérios e quem está inscrito</span>}
              {etapa === "resultado" && <span>Salvo em {resultado?.geradaEm}{resultado?.geradoPor ? ` por ${resultado.geradoPor}` : ""}</span>}
            </div>
          </div>
          <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose}>Fechar</button>
        </div>

        <div className="aef-ops__dialog-body aef-ops__stack">
          {etapa === "config" && (
            <>
              <div className="aef-ops__row2">
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-vagas">Vagas</label>
                  <input id="ops-vagas" className="aef-ops__input" type="number" min={1} value={vagas} onChange={e => setVagas(Math.max(1, +e.target.value || 1))} />
                </div>
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-min-novatos">Mínimo de novatos</label>
                  <input id="ops-min-novatos" className="aef-ops__input" type="number" min={0} value={minNovatos} onChange={e => setMinNovatos(Math.max(0, +e.target.value || 0))} />
                </div>
              </div>

              <ul className="aef-ops__figures">
                <li className="aef-ops__figure"><span className="aef-ops__figure-label">Inscritos</span><span className="aef-ops__figure-value">{elegiveis.length}</span></li>
                <li className="aef-ops__figure" data-tone="green"><span className="aef-ops__figure-label">Novatos</span><span className="aef-ops__figure-value">{totalNovatos}</span></li>
                <li className="aef-ops__figure" data-tone="purple"><span className="aef-ops__figure-label">Veteranos</span><span className="aef-ops__figure-value">{totalVeteranos}</span></li>
              </ul>

              <div className="aef-ops__pool-head">
                <span className="aef-ops__label">{origemPool === "inscricoes" ? `Inscritos pela página pública (${pool.length})` : "Voluntários do banco"}</span>
                <div style={{ display: "flex", gap: "var(--space-2xs)" }}>
                  <button type="button" className="aef-ops__btn aef-ops__btn--link" onClick={() => setInscritos(Object.fromEntries(pool.map(v => [v.name, !v.penalizado])))}>Marcar todos</button>
                  <button type="button" className="aef-ops__btn aef-ops__btn--quiet" onClick={() => setInscritos({})}>Limpar</button>
                </div>
              </div>

              <div className="aef-ops__pool">
                {pool.map((v) => (
                  <label key={v.name} className="aef-ops__pool-row" data-blocked={v.penalizado ? "true" : undefined}>
                    <input type="checkbox" disabled={v.penalizado} checked={!!inscritos[v.name]}
                      onChange={e => setInscritos(prev => ({ ...prev, [v.name]: e.target.checked }))}
                    />
                    <div className="aef-ops__person-main">
                      <div className="aef-ops__person-name">
                        {v.name}
                        {v.novato && <span className="aef-ops__tag" data-tone="green">Novato</span>}
                        {v.penalizado && <span className="aef-ops__tag" data-tone="red">Penalizado</span>}
                      </div>
                      <div className="aef-ops__meta">
                        <span>{v.area}</span>
                        <span>{v.actions} ações</span>
                        {v.penalizado && v.motivoPenalidade && <span>{v.motivoPenalidade}</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {etapa === "resultado" && resultado && (
            <div className="aef-ops__draw">
              {renderResultList("Sorteados", resultado.sorteados, "sorteados", "green", "Sem sorteados",
                <button type="button" className="aef-ops__btn aef-ops__btn--quiet" data-done={copiado === "sorteados" ? "true" : undefined} onClick={() => copiar("sorteados")}>{copiado === "sorteados" ? "Copiado" : "Copiar"}</button>
              )}
              {renderResultList("Reserva", resultado.reserva, "reserva", undefined, "Sem reserva, todos foram sorteados",
                <button type="button" className="aef-ops__btn aef-ops__btn--quiet" data-done={copiado === "reserva" ? "true" : undefined} onClick={() => copiar("reserva")}>{copiado === "reserva" ? "Copiado" : "Copiar"}</button>
              )}
            </div>
          )}
        </div>

        <div className="aef-ops__dialog-foot">
          {etapa === "config" && (
            <>
              <button type="button" className="aef-ops__btn aef-ops__btn--outline aef-ops__btn--grow" onClick={onClose}>Cancelar</button>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--grow2" disabled={!podeSortear} onClick={realizar}>
                {!podeSortear ? `Selecione ao menos ${vagas} voluntários` : "Realizar sorteio"}
              </button>
            </>
          )}
          {etapa === "resultado" && (
            <>
              <button type="button" className="aef-ops__btn aef-ops__btn--outline aef-ops__btn--grow" onClick={refazer}>Refazer</button>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--grow2" onClick={() => copiar("tudo")} aria-live="polite">
                {copiado === "tudo" ? "Copiado para área de transferência" : "Copiar lista completa"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Operacoes({ mobile, user }) {
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [showNovaAcao, setShowNovaAcao] = useState(false);
  const [novaAcao, setNovaAcao] = useState({ nome: "", tipo: "Café de Rua", data: "", responsavel: "" });
  const [acoes, setAcoes] = useState(ACOES_MOCK);

  const TIPOS = ["Café de Rua", "Sopão da Noite", "Saúde", "Jurídico", "Orfanato", "Lar de Idosos", "Autismo", "Arrecadação", "Educacional", "Outro"];

  if (view === "detail" && selected) {
    return <AcaoDetail acao={selected} onBack={() => { setView("list"); setSelected(null); }} mobile={mobile} user={user} />;
  }

  return (
    <div className="aef-ops">
      <div className="aef-ops__head">
        <div>
          <h1 className="aef-ops__title">Operações</h1>
          <p className="aef-ops__desc">{acoes.length} ações registradas</p>
        </div>
        <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={() => setShowNovaAcao(true)}>
          <span aria-hidden="true"><Icon name="plus" size={16} /></span>
          Nova Ação
        </button>
      </div>

      {/* Nova Ação modal */}
      {showNovaAcao && (
        <div className="aef-ops__scrim" onClick={() => setShowNovaAcao(false)}>
          <div className="aef-ops__dialog" role="dialog" aria-modal="true" aria-labelledby="ops-nova-title" onClick={e => e.stopPropagation()}>
            <div className="aef-ops__dialog-head">
              <h2 id="ops-nova-title" className="aef-ops__dialog-title">Nova Ação</h2>
              <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => setShowNovaAcao(false)}>Fechar</button>
            </div>
            <div className="aef-ops__dialog-body aef-ops__form">
              {[
                { label: "Nome da ação", key: "nome", type: "text", placeholder: "Ex: Café de Rua, Abril" },
                { label: "Data", key: "data", type: "date", placeholder: "" },
                { label: "Responsável", key: "responsavel", type: "text", placeholder: "Nome do diretor responsável" },
              ].map(f => (
                <div key={f.key} className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor={`ops-nova-${f.key}`}>{f.label}</label>
                  <input id={`ops-nova-${f.key}`} className="aef-ops__input" type={f.type} placeholder={f.placeholder} value={novaAcao[f.key]}
                    onChange={e => setNovaAcao(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="ops-nova-tipo">Tipo de ação</label>
                <select id="ops-nova-tipo" className="aef-ops__select" value={novaAcao.tipo} onChange={e => setNovaAcao(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--block" onClick={() => {
                if (!novaAcao.nome || !novaAcao.data) return;
                setAcoes(prev => [{ id: Date.now(), ...novaAcao, status: "planejamento", voluntarios: 0, pop: null }, ...prev]);
                setShowNovaAcao(false);
                setNovaAcao({ nome: "", tipo: "Café de Rua", data: "", responsavel: "" });
              }}>
                Criar Ação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <ul className="aef-ops__panel aef-ops__list">
        {acoes.map((a) => (
          <li key={a.id}>
            <button type="button" className="aef-ops__row" onClick={() => { setSelected(a); setView("detail"); }}>
              <div className="aef-ops__row-main">
                <div className="aef-ops__row-title">
                  <span>{a.nome}</span>
                  <span className="aef-ops__tone" data-tone={OPS_TIPO_TONE[a.tipo] || "neutral"}>{a.tipo}</span>
                </div>
                <div className="aef-ops__meta">
                  <span className="aef-ops__meta-item"><span aria-hidden="true"><Icon name="clock" size={13} /></span>{a.data}</span>
                  <span className="aef-ops__meta-item"><span aria-hidden="true"><Icon name="users" size={13} /></span>{a.voluntarios} voluntários</span>
                  {a.responsavel && <span>{a.responsavel}</span>}
                </div>
              </div>
              <div className="aef-ops__row-side">
                <span className="aef-ops__tone aef-ops__cap" data-tone={OPS_STATUS_TONE[a.status] || "neutral"}>{a.status}</span>
                <span aria-hidden="true"><Icon name="chevronRight" size={16} /></span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
// ─── MARKETING ───────────────────────────────────────────────────────────────
const ACERVO_MOCK = [
  { id: 1, nome: "Café de Rua — Abril 2025", tipo: "foto", acao: "Café de Rua", data: "26/04/2025", url: "https://picsum.photos/seed/cafe1/400/300", tags: ["ação", "voluntários"] },
  { id: 2, nome: "Ação de Saúde Guamá", tipo: "foto", acao: "Saúde", data: "19/04/2025", url: "https://picsum.photos/seed/saude1/400/300", tags: ["saúde", "comunidade"] },
  { id: 3, nome: "Visita Orfanato", tipo: "foto", acao: "Orfanato", data: "12/04/2025", url: "https://picsum.photos/seed/orfanato1/400/300", tags: ["crianças", "social"] },
  { id: 4, nome: "Sopão da Noite", tipo: "foto", acao: "Sopão", data: "05/04/2025", url: "https://picsum.photos/seed/sopao1/400/300", tags: ["alimentação"] },
  { id: 5, nome: "Logo AEF Principal", tipo: "logo", acao: "—", data: "—", url: "https://picsum.photos/seed/logo1/400/300", tags: ["identidade"] },
  { id: 6, nome: "Banner Aniversário 10 Anos", tipo: "arte", acao: "—", data: "—", url: "https://picsum.photos/seed/banner1/400/300", tags: ["aniversário"] },
];

const POSTS_MOCK = [
  { id: 1, legenda: "Mais um Café de Rua realizado com amor. Nossa equipe esteve presente servindo centenas de pessoas em situação de vulnerabilidade nas ruas de Belém.", acao: "Café de Rua", data: "26/04/2025", status: "rascunho", canal: "Instagram", responsavel: "Duda Martins" },
  { id: 2, legenda: "Ação de Saúde no Guamá: levamos atendimento médico gratuito para a comunidade. Porque saúde é direito de todos.", acao: "Saúde", data: "19/04/2025", status: "publicado", canal: "Instagram", responsavel: "Duda Martins" },
  { id: 3, legenda: "Abrimos maio com uma convocação especial para o Sopão da Noite. Precisamos de voluntários, parceiros e divulgação local.", acao: "Sopão da Noite", data: "25/08/2026", status: "agendado", canal: "WhatsApp", responsavel: "Flávia Moraes", scheduledDate: "2026-08-25", scheduledTime: "09:00" },
  { id: 4, legenda: "Bastidores da preparação do Inverno Solidário e chamada para novas doações.", acao: "Inverno Solidário", data: "27/08/2026", status: "agendado", canal: "Instagram", responsavel: "Duda Martins", scheduledDate: "2026-08-27", scheduledTime: "18:30" },
  { id: 5, legenda: "Transparência também é cuidado: confira os principais números do semestre.", acao: "Prestação de Contas", data: "29/08/2026", status: "agendado", canal: "LinkedIn", responsavel: "Camila Rocha", scheduledDate: "2026-08-29", scheduledTime: "10:00" },
];

const MARKETING_CAMPAIGNS_SEED = [
  { id: 1, nome: "Inverno Solidário", objetivo: "Arrecadar agasalhos e ampliar captação recorrente", canal: "Multi-canal", inicio: "2026-08-18", fim: "2026-09-12", status: "ativa", responsavel: "Duda Martins", meta: "120 doações", progresso: 68, deliverables: 7 },
  { id: 2, nome: "Voluntariado Setembro", objetivo: "Atrair novos voluntários para operações de rua", canal: "Instagram", inicio: "2026-09-01", fim: "2026-09-20", status: "planejada", responsavel: "Eder Silva", meta: "35 inscrições", progresso: 18, deliverables: 5 },
  { id: 3, nome: "Prestação de Contas Semestral", objetivo: "Publicar transparência e reforçar credibilidade institucional", canal: "Site + E-mail", inicio: "2026-08-05", fim: "2026-08-25", status: "em_revisao", responsavel: "Camila Rocha", meta: "1 relatório público", progresso: 82, deliverables: 3 },
];

const MARKETING_REQUESTS_SEED = [
  { id: 1, titulo: "Cobertura da ação no Guamá", solicitante: "Flávia Souza", setor: "Operações", formato: "Story + carrossel", prioridade: "alta", prazo: "2026-08-27", status: "brief_recebido", descricao: "Precisamos de story + carrossel com foco em impacto e chamada para próximas ações.", tempoSolicitacao: "há 20 min" },
  { id: 2, titulo: "Campanha de voluntariado feminino", solicitante: "Ingrid Lima", setor: "RH", formato: "Campanha", prioridade: "media", prazo: "2026-09-02", status: "em_producao", descricao: "Peças para Instagram e WhatsApp com foco em acolhimento e capacitação.", tempoSolicitacao: "há 2h", tempoAtualizacao: "há 35 min" },
  { id: 3, titulo: "Post de transparência financeira", solicitante: "Camila Rocha", setor: "Financeiro", formato: "Post estático", prioridade: "alta", prazo: "2026-08-29", status: "em_aprovacao", descricao: "Resumo visual do mês com números principais e destino dos recursos.", tempoSolicitacao: "ontem", tempoAtualizacao: "há 1h" },
];

const MARKETING_STORAGE_KEYS = {
  acervo: "aef_marketing_acervo",
  posts: "aef_marketing_posts",
  campaigns: "aef_marketing_campaigns",
  requests: "aef_marketing_requests",
};

const MARKETING_CAMPAIGN_STATUS = {
  planejada: { label: "Planejada", color: "#1D4ED8", bg: "rgba(29,78,216,0.10)" },
  ativa: { label: "Ativa", color: "#15803D", bg: "rgba(34,197,94,0.10)" },
  em_revisao: { label: "Em revisão", color: "#B45309", bg: "rgba(245,158,11,0.12)" },
  concluida: { label: "Concluída", color: C.textSecondary, bg: C.borderLight },
};

const MARKETING_REQUEST_STATUS = {
  brief_recebido: { label: "Brief recebido", color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  em_producao: { label: "Em produção", color: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  em_aprovacao: { label: "Em aprovação", color: "#B45309", bg: "rgba(245,158,11,0.12)" },
  entregue: { label: "Entregue", color: "#15803D", bg: "rgba(34,197,94,0.10)" },
};

const MARKETING_POST_STATUS = {
  rascunho: { label: "Rascunho", color: "#B45309", bg: "rgba(245,158,11,0.12)" },
  em_aprovacao: { label: "Em aprovação", color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  agendado: { label: "Agendado", color: "#1D4ED8", bg: "rgba(29,78,216,0.10)" },
  publicado: { label: "Publicado", color: "#15803D", bg: "rgba(34,197,94,0.10)" },
};

function readMarketingStore(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

const marketingDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const marketingDateLabel = (dateKey) => {
  if (!dateKey) return "";
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("pt-BR");
};

const googleCalendarUrl = (post) => {
  const start = new Date(`${post.scheduledDate}T${post.scheduledTime || "09:00"}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const stamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Postagem: ${post.acao}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: `${post.legenda || "Conteúdo programado pela equipe de Marketing"}\n\nCanal: ${post.canal}\nResponsável: ${post.responsavel}`,
    ctz: "America/Sao_Paulo",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// ─── FINANCEIRO ───────────────────────────────────────────────────────────────
const FIN_CATEGORIAS = {
  doacao: { label: "Doação", cor: "#15803D", bg: "rgba(34,197,94,0.10)" },
  alimentacao: { label: "Alimentação", cor: "#7E22CE", bg: "rgba(126,34,206,0.10)" },
  transporte: { label: "Transporte", cor: "#C2410C", bg: "rgba(194,65,12,0.10)" },
  utilidades: { label: "Utilidades", cor: "#1D4ED8", bg: "rgba(29,78,216,0.10)" },
  marketing: { label: "Marketing", cor: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  tarifa: { label: "Tarifa", cor: "#6E6E73", bg: "#F2F2F7" },
  reembolso: { label: "Reembolso", cor: "#B45309", bg: "rgba(245,158,11,0.14)" },
  nao_categorizado: { label: "Não categorizado", cor: "#6E6E73", bg: "#F2F2F7" },
};

const FIN_AREAS = {
  alimentacao: { label: "Alimentação", cor: "#7E22CE", bg: "rgba(126,34,206,0.10)" },
  saude: { label: "Saúde", cor: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  social: { label: "Social", cor: "#15803D", bg: "rgba(34,197,94,0.10)" },
  marketing: { label: "Marketing", cor: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  admin: { label: "Administrativo", cor: "#6E6E73", bg: "#F2F2F7" },
};

const FIN_TRANSACOES_MOCK = [
  // Maio 2026
  { id: 1, data: "2026-05-11", hora: "14:22", tipo: "pix_in", descricao: "PIX recebido — Maria L. Santos", contraparte: "Maria L. Santos", valor: 250.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null, txid: "AEF-PIX-A8F2" },
  { id: 2, data: "2026-05-11", hora: "10:08", tipo: "pix_in", descricao: "PIX recebido — Carlos H. Mendes", contraparte: "Carlos H. Mendes", valor: 50.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 3, data: "2026-05-10", hora: "16:45", tipo: "boleto_pago", descricao: "Atacadão — Compras Café de Rua", contraparte: "Atacadão SA", valor: -420.50, categoria: "alimentacao", area: "alimentacao", conta: "Cora", conciliado: true, acaoId: 1 },
  { id: 4, data: "2026-05-10", hora: "09:30", tipo: "pix_in", descricao: "PIX recebido — Doador Anônimo", contraparte: "Anônimo", valor: 100.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 5, data: "2026-05-09", hora: "11:15", tipo: "pix_out", descricao: "PIX enviado — Posto Ipiranga (gasolina)", contraparte: "Posto Ipiranga", valor: -180.00, categoria: "transporte", area: "alimentacao", conta: "Cora", conciliado: true, acaoId: 1 },
  { id: 6, data: "2026-05-08", hora: "18:00", tipo: "pix_in", descricao: "PIX recebido — Igreja Batista Central", contraparte: "Igreja Batista Central", valor: 800.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 7, data: "2026-05-07", hora: "13:20", tipo: "boleto_pago", descricao: "Equatorial Pará — Conta de luz", contraparte: "Equatorial Pará", valor: -312.40, categoria: "utilidades", area: "admin", conta: "Cora", conciliado: true, acaoId: null },
  { id: 8, data: "2026-05-06", hora: "08:00", tipo: "tarifa", descricao: "Tarifa mensal Cora PJ", contraparte: "Cora", valor: -29.90, categoria: "tarifa", area: "admin", conta: "Cora", conciliado: true, acaoId: null },
  { id: 9, data: "2026-05-05", hora: "15:42", tipo: "pix_in", descricao: "PIX recebido — Fernanda Albuquerque", contraparte: "Fernanda Albuquerque", valor: 200.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 10, data: "2026-05-04", hora: "10:00", tipo: "pix_out", descricao: "PIX enviado — Gráfica Belém (folders)", contraparte: "Gráfica Belém", valor: -240.00, categoria: "marketing", area: "marketing", conta: "Cora", conciliado: false, acaoId: null },
  { id: 11, data: "2026-05-03", hora: "19:55", tipo: "pix_in", descricao: "PIX recebido — Luís F. Almeida", contraparte: "Luís F. Almeida", valor: 75.00, categoria: "nao_categorizado", conta: "Cora", conciliado: false, acaoId: null },
  { id: 12, data: "2026-05-02", hora: "14:00", tipo: "pix_in", descricao: "PIX recebido — Empresa Belém Distribuidora", contraparte: "Belém Distrib. Ltda", valor: 1500.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 13, data: "2026-05-01", hora: "11:32", tipo: "boleto_pago", descricao: "Cosanpa — Conta de água", contraparte: "Cosanpa", valor: -98.20, categoria: "utilidades", area: "admin", conta: "Cora", conciliado: true, acaoId: null },
  // Abril 2026
  { id: 14, data: "2026-04-28", hora: "16:10", tipo: "pix_out", descricao: "PIX enviado — Alan Costa (reembolso Saúde Guamá)", contraparte: "Alan Costa", valor: -85.00, categoria: "reembolso", area: "saude", conta: "Cora", conciliado: true, acaoId: 2 },
  { id: 15, data: "2026-04-26", hora: "07:15", tipo: "pix_in", descricao: "PIX recebido — Marcos V. Pereira", contraparte: "Marcos V. Pereira", valor: 150.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 16, data: "2026-04-22", hora: "09:14", tipo: "pix_in", descricao: "PIX recebido — Maria L. Santos", contraparte: "Maria L. Santos", valor: 250.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 17, data: "2026-04-20", hora: "12:30", tipo: "pix_in", descricao: "PIX recebido — Igreja Batista Central", contraparte: "Igreja Batista Central", valor: 600.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 18, data: "2026-04-15", hora: "18:22", tipo: "pix_in", descricao: "PIX recebido — Fernanda Albuquerque", contraparte: "Fernanda Albuquerque", valor: 100.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 19, data: "2026-04-12", hora: "14:00", tipo: "boleto_pago", descricao: "Mercado Livre — Material gráfico", contraparte: "Mercado Livre", valor: -185.00, categoria: "marketing", area: "marketing", conta: "Cora", conciliado: true, acaoId: null },
  { id: 20, data: "2026-04-08", hora: "10:45", tipo: "pix_in", descricao: "PIX recebido — Empresa Belém Distribuidora", contraparte: "Belém Distrib. Ltda", valor: 1500.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  // Março 2026
  { id: 21, data: "2026-03-25", hora: "11:30", tipo: "pix_in", descricao: "PIX recebido — Maria L. Santos", contraparte: "Maria L. Santos", valor: 250.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 22, data: "2026-03-20", hora: "16:00", tipo: "pix_in", descricao: "PIX recebido — Igreja Batista Central", contraparte: "Igreja Batista Central", valor: 500.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 23, data: "2026-03-15", hora: "08:20", tipo: "pix_in", descricao: "PIX recebido — Marcos V. Pereira", contraparte: "Marcos V. Pereira", valor: 150.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 24, data: "2026-03-10", hora: "13:15", tipo: "pix_in", descricao: "PIX recebido — Fernanda Albuquerque", contraparte: "Fernanda Albuquerque", valor: 200.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
];

const fmtBRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDataBR = (iso) => { const [y, m, d] = iso.split("-"); return `${d}/${m}`; };
const fmtDataLongaBR = (iso) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
const inicioMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };
const mesesAtras = (n) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() - n, 1).toISOString().slice(0, 10); };

function classificarDoador(qtd, total) {
  if (qtd >= 4 || total >= 1000) return { tipo: "fiel", label: "Fiel", cor: "#15803D", bg: "rgba(34,197,94,0.10)" };
  if (qtd >= 2) return { tipo: "recorrente", label: "Recorrente", cor: "#1D4ED8", bg: "rgba(29,78,216,0.10)" };
  return { tipo: "novo", label: "Novo", cor: "#B45309", bg: "rgba(245,158,11,0.14)" };
}

function agruparDoadores(transacoes) {
  const map = new Map();
  transacoes.filter(t => t.valor > 0 && t.contraparte && t.contraparte !== "Anônimo").forEach(t => {
    const k = t.contraparte;
    const cur = map.get(k) || { nome: k, total: 0, qtd: 0, primeira: t.data, ultima: t.data };
    cur.total += t.valor;
    cur.qtd += 1;
    if (t.data < cur.primeira) cur.primeira = t.data;
    if (t.data > cur.ultima) cur.ultima = t.data;
    map.set(k, cur);
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function gerarReciboDoacao(transacao) {
  const dataGeracao = new Date().toLocaleString("pt-BR");
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo de Doação</title><style>
body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:0 24px;color:#1D1D1F;line-height:1.6}
.cabecalho{text-align:center;border-bottom:3px solid #D70D16;padding-bottom:18px;margin-bottom:24px}
h1{font-size:24px;margin:8px 0 4px;color:#851811}
.entidade{font-size:13px;color:#6E6E73}
.numero{display:inline-block;background:#F5F5F7;padding:4px 12px;border-radius:6px;font-size:12px;color:#6E6E73;font-family:monospace;margin-top:8px}
.bloco{background:#F5F5F7;padding:16px 20px;border-radius:10px;margin:16px 0}
.label{font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6E6E73;font-weight:700;margin-bottom:3px}
.valor-grande{font-size:32px;font-weight:700;color:#15803D;font-family:Helvetica,sans-serif}
.linha{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E8E8ED}
.linha:last-child{border-bottom:none}
.assinatura{margin-top:40px;padding-top:20px;border-top:1px solid #E8E8ED;font-size:11px;color:#6E6E73;line-height:1.5}
.legal{background:#FFF8E1;border:1px solid #F59E0B;padding:14px 18px;border-radius:8px;margin-top:24px;font-size:12px;color:#92400E}
</style></head><body>
<div class="cabecalho">
  <div style="font-size:13px;color:#6E6E73;letter-spacing:1px;text-transform:uppercase">Recibo de Doação</div>
  <h1>AMOR EM FOCO</h1>
  <div class="entidade">Organização da Sociedade Civil · CNPJ: 00.000.000/0001-00<br/>Belém — Pará</div>
  <div class="numero">N° ${String(transacao.id).padStart(6, "0")}/${new Date(transacao.data).getFullYear()}</div>
</div>

<p>A <b>Amor em Foco</b> declara, para os devidos fins, que recebeu de <b>${transacao.contraparte}</b> a importância de:</p>

<div class="bloco" style="text-align:center">
  <div class="valor-grande">${fmtBRL(transacao.valor)}</div>
  <div style="font-size:13px;color:#6E6E73;margin-top:4px">(${escreverPorExtenso(transacao.valor)})</div>
</div>

<div class="bloco">
  <div class="linha"><span class="label">Data da doação</span><span>${fmtDataLongaBR(transacao.data)} às ${transacao.hora}</span></div>
  <div class="linha"><span class="label">Forma de pagamento</span><span>${transacao.tipo === "pix_in" ? "PIX" : "Transferência"}</span></div>
  <div class="linha"><span class="label">Banco</span><span>Cora SCFI</span></div>
  ${transacao.txid ? `<div class="linha"><span class="label">ID da transação</span><span style="font-family:monospace;font-size:12px">${transacao.txid}</span></div>` : ""}
</div>

<p>A doação foi destinada às atividades fim da entidade, conforme estatuto social, sem qualquer contrapartida ou benefício direto ao doador.</p>

<div class="legal">
  <b>Dedução de Imposto de Renda:</b> Pessoa Física pode deduzir até <b>6%</b> do imposto devido em doações a Organizações da Sociedade Civil (Lei 9.249/95, art. 13, § 2°). Apresente este recibo à sua declaração de IR.
</div>

<div class="assinatura">
  Belém, ${dataGeracao}.<br/><br/>
  ____________________________________<br/>
  <b>Diretoria — Amor em Foco</b><br/>
  Recibo gerado eletronicamente pelo AEF Hub.
</div>
</body></html>`;
  return "data:text/html;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(html)));
}

function escreverPorExtenso(v) {
  const reais = Math.floor(v);
  const centavos = Math.round((v - reais) * 100);
  let texto = "";
  if (reais === 1) texto = "um real";
  else if (reais > 0) texto = `${reais.toLocaleString("pt-BR")} reais`.replace(/,/g, ".");
  if (centavos > 0) texto += ` e ${centavos} centavos`;
  return texto || "zero";
}

function Financeiro({ mobile, setActive }) {
  const [tab, setTab] = useState("extrato");
  const [transacoes, setTransacoes] = useState(FIN_TRANSACOES_MOCK);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroPeriodo, setFiltroPeriodo] = useState("mes");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState(null);
  const [meta, setMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aef_fin_meta") || "null") || 5000; } catch { return 5000; }
  });
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [showTransparencia, setShowTransparencia] = useState(false);
  const [reciboToast, setReciboToast] = useState("");

  useEffect(() => {
    try { localStorage.setItem("aef_fin_meta", JSON.stringify(meta)); } catch {}
  }, [meta]);

  const emitirRecibo = (transacao) => {
    const conteudo = gerarReciboDoacao(transacao);
    const doc = {
      id: Date.now(),
      nome: `Recibo Doação ${transacao.contraparte} ${fmtDataBR(transacao.data)}.html`,
      categoria: "declaracoes",
      tamanho: formatSize(conteudo.length),
      tipo: "text/html",
      data: new Date().toLocaleDateString("pt-BR"),
      responsavel: "Financeiro (auto)",
      vigente: true,
      validade: null,
      conteudo,
    };
    try {
      const existentes = JSON.parse(localStorage.getItem("aef_juridico_docs") || "[]");
      localStorage.setItem("aef_juridico_docs", JSON.stringify([doc, ...existentes]));
      setReciboToast(`Recibo de ${transacao.contraparte} salvo no Jurídico ✓`);
      setTimeout(() => setReciboToast(""), 2800);
    } catch (e) {
      alert("Erro ao salvar recibo: " + e.message);
    }
  };

  const dataLimite = filtroPeriodo === "mes" ? inicioMes() : filtroPeriodo === "tudo" ? "0000-01-01" : new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const filtradas = transacoes.filter(t => {
    if (t.data < dataLimite) return false;
    if (filtroCategoria !== "todas" && t.categoria !== filtroCategoria) return false;
    if (busca && !t.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
    if (tab === "doacoes" && t.valor <= 0) return false;
    if (tab === "despesas" && t.valor >= 0) return false;
    return true;
  });

  const entradas = transacoes.filter(t => t.data >= inicioMes() && t.valor > 0).reduce((s, t) => s + t.valor, 0);
  const saidas = transacoes.filter(t => t.data >= inicioMes() && t.valor < 0).reduce((s, t) => s + t.valor, 0);
  const saldoAtual = 3847.20;
  const naoCategorizadas = transacoes.filter(t => t.categoria === "nao_categorizado" || !t.conciliado).length;

  const breakdownDespesas = Object.entries(
    transacoes.filter(t => t.data >= inicioMes() && t.valor < 0).reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + Math.abs(t.valor);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const totalDespesas = Math.abs(saidas) || 1;

  const salvarEdicao = () => {
    setTransacoes(prev => prev.map(t => t.id === editando.id ? editando : t));
    setEditando(null);
  };

  const doadores = agruparDoadores(transacoes);
  const breakdownArea = Object.entries(
    transacoes.filter(t => t.valor < 0 && t.area).reduce((acc, t) => {
      acc[t.area] = (acc[t.area] || 0) + Math.abs(t.valor);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const totalGastosArea = breakdownArea.reduce((s, [, v]) => s + v, 0) || 1;
  const metaPct = Math.min(100, (entradas / meta) * 100);
  const metaBatida = entradas >= meta;
  const alertas = [];
  if (saldoAtual < 500) alertas.push({ tipo: "saldo", texto: `Saldo abaixo de R$ 500 (atual: ${fmtBRL(saldoAtual)}).`, cor: C.red });
  if (naoCategorizadas > 0) alertas.push({ tipo: "pendentes", texto: `${naoCategorizadas} transações aguardando conciliação.`, cor: "#B45309" });

  const tabs = [
    { id: "extrato", label: "Extrato", count: transacoes.length },
    { id: "doacoes", label: "Doações", count: transacoes.filter(t => t.valor > 0).length },
    { id: "despesas", label: "Despesas", count: transacoes.filter(t => t.valor < 0).length },
    { id: "doadores", label: "Doadores", count: doadores.length },
    { id: "area", label: "Por área" },
    { id: "relatorios", label: "Relatórios" },
  ];

  const CAT_TONE = { doacao: "green", alimentacao: "purple", transporte: "orange", utilidades: "blue", marketing: "teal", tarifa: "neutral", reembolso: "amber", nao_categorizado: "neutral" };
  const AREA_TONE = { alimentacao: "purple", saude: "red", social: "green", marketing: "teal", admin: "neutral" };
  const DOADOR_TONE = { fiel: "green", recorrente: "blue", novo: "amber" };

  return (
    <div className="aef-fin">
      <div className="aef-fin__head">
        <div>
          <h1 className="aef-fin__title">Financeiro</h1>
          <p className="aef-fin__desc">Conta Cora, {transacoes.length} movimentações</p>
        </div>
        <div className="aef-fin__head-actions">
          <button type="button" className="aef-fin__btn aef-fin__btn--outline" onClick={() => setShowTransparencia(true)}>
            <span aria-hidden="true"><Icon name="eye" size={14} /></span>
            Página pública
          </button>
          <button type="button" className="aef-fin__btn aef-fin__btn--outline" title="Disponível quando integrarmos com a API Cora" disabled>
            <span aria-hidden="true"><Icon name="settings" size={14} /></span>
            Sincronizar com Cora
          </button>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="aef-fin__alerts" role="status">
          {alertas.map(a => (
            <p key={a.tipo} className="aef-fin__alert" data-tone={a.tipo === "saldo" ? "red" : "amber"}>
              <span aria-hidden="true"><Icon name="shield" size={14} strokeWidth={2} /></span>
              {a.texto}
            </p>
          ))}
        </div>
      )}

      <div className="aef-fin__top">
        <section className="aef-fin__balance" aria-label="Saldo Cora">
          <span className="aef-fin__balance-label">Saldo Cora</span>
          <span className="aef-fin__balance-value">{fmtBRL(saldoAtual)}</span>
        </section>

        {/* Meta mensal */}
        <section className="aef-fin__panel aef-fin__goal" aria-labelledby="fin-meta-title" data-tone={metaBatida ? "green" : undefined}>
          <div className="aef-fin__goal-head">
            <div>
              <h2 id="fin-meta-title" className="aef-fin__h2">Meta de doações do mês</h2>
              <p className="aef-fin__goal-value">
                {fmtBRL(entradas)} <span className="aef-fin__goal-of">de {fmtBRL(meta)} ({metaPct.toFixed(0)}%)</span>
              </p>
            </div>
            <div className="aef-fin__goal-actions">
              {metaBatida && <span className="aef-fin__goal-met"><span aria-hidden="true"><Icon name="check" size={14} strokeWidth={2.5} /></span>Meta batida</span>}
              {editandoMeta ? (
                <>
                  <input type="number" aria-label="Valor da meta mensal" className="aef-fin__input aef-fin__goal-input" value={meta} onChange={e => setMeta(+e.target.value || 0)} />
                  <button type="button" className="aef-fin__btn aef-fin__btn--primary aef-fin__btn--small" onClick={() => setEditandoMeta(false)}>OK</button>
                </>
              ) : (
                <button type="button" className="aef-fin__btn aef-fin__btn--outline aef-fin__btn--small" onClick={() => setEditandoMeta(true)}>Editar meta</button>
              )}
            </div>
          </div>
          <div className="aef-fin__track" role="progressbar" aria-label="Meta de doações do mês" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(metaPct)}>
            <span style={{ width: `${metaPct}%` }} />
          </div>
        </section>
      </div>

      {/* Stats */}
      <ul className="aef-fin__figures">
        <li className="aef-fin__figure" data-tone="green"><span className="aef-fin__figure-label">Entradas mês</span><span className="aef-fin__figure-value">{fmtBRL(entradas)}</span></li>
        <li className="aef-fin__figure" data-tone="red"><span className="aef-fin__figure-label">Saídas mês</span><span className="aef-fin__figure-value">{fmtBRL(Math.abs(saidas))}</span></li>
        <li className="aef-fin__figure" data-tone={naoCategorizadas > 0 ? "amber" : "green"}><span className="aef-fin__figure-label">Pendentes</span><span className="aef-fin__figure-value">{naoCategorizadas}</span><span className="aef-fin__figure-detail">conciliar</span></li>
      </ul>

      {/* Tabs */}
      <nav className="aef-fin__tabs" aria-label="Seções do Financeiro">
        {tabs.map(t => (
          <button key={t.id} type="button" className="aef-fin__tab" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
            {t.label}{t.count !== undefined && <span className="aef-fin__tab-count">({t.count})</span>}
          </button>
        ))}
      </nav>

      {(tab === "extrato" || tab === "doacoes" || tab === "despesas") && (
        <>
          <div className="aef-fin__filters">
            <div className="aef-fin__search">
              <span className="aef-fin__search-icon" aria-hidden="true"><Icon name="search" size={15} /></span>
              <input type="search" aria-label="Buscar por descrição" className="aef-fin__input" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por descrição…" />
            </div>
            <select aria-label="Período" className="aef-fin__select" value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}>
              <option value="semana">Últimos 7 dias</option>
              <option value="mes">Este mês</option>
              <option value="tudo">Tudo</option>
            </select>
            <select aria-label="Categoria" className="aef-fin__select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
              <option value="todas">Todas categorias</option>
              {Object.entries(FIN_CATEGORIAS).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
            </select>
          </div>

          <div className="aef-fin__panel">
            {filtradas.length === 0 ? (
              <p className="aef-fin__empty">Nenhuma movimentação encontrada com esses filtros.</p>
            ) : (
              <ul className="aef-fin__ledger">
                {filtradas.map((t) => {
                  const cat = FIN_CATEGORIAS[t.categoria] || FIN_CATEGORIAS.nao_categorizado;
                  const entrada = t.valor > 0;
                  return (
                    <li key={t.id} className="aef-fin__entry" role="button" tabIndex={0} aria-label={"Detalhes: " + t.descricao}
                      onClick={() => setEditando({ ...t })}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditando({ ...t }); } }}
                    >
                      <div className="aef-fin__entry-main">
                        <div className="aef-fin__entry-title">
                          <span>{t.descricao}</span>
                          {!t.conciliado && <span className="aef-fin__tag" data-tone="amber">Pendente</span>}
                        </div>
                        <div className="aef-fin__meta">
                          <span>{fmtDataBR(t.data)}</span>
                          <span>{t.hora}</span>
                          <span className="aef-fin__tone" data-tone={CAT_TONE[t.categoria] || "neutral"}>{cat.label}</span>
                          {t.acaoId && <span>Ação #{t.acaoId}</span>}
                        </div>
                      </div>
                      <div className="aef-fin__entry-side">
                        <span className="aef-fin__amount" data-tone={entrada ? "green" : undefined}>{entrada ? "+" : ""}{fmtBRL(t.valor)}</span>
                        <span className="aef-fin__receipt-slot">
                          {entrada && t.contraparte !== "Anônimo" && t.categoria === "doacao" && (
                            <button type="button" className="aef-fin__icon-btn" title="Gerar recibo de doação" aria-label={"Gerar recibo de " + t.contraparte} onClick={(e) => { e.stopPropagation(); emitirRecibo(t); }} onKeyDown={e => e.stopPropagation()}>
                              <Icon name="file" size={14} />
                            </button>
                          )}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === "doadores" && (
        <section className="aef-fin__panel">
          <div className="aef-fin__panel-head">
            <h2 className="aef-fin__h2">{doadores.length} doadores identificados</h2>
          </div>
          {doadores.length === 0 ? (
            <p className="aef-fin__empty">Nenhum doador identificado ainda.</p>
          ) : (
            <ul className="aef-fin__ledger">
              {doadores.map((d) => {
                const klass = classificarDoador(d.qtd, d.total);
                return (
                  <li key={d.nome} className="aef-fin__donor">
                    <div className="aef-fin__donor-main">
                      <div className="aef-fin__donor-name">
                        <span>{d.nome}</span>
                        <span className="aef-fin__tag" data-tone={DOADOR_TONE[klass.tipo] || "neutral"}>{klass.label}</span>
                      </div>
                      <div className="aef-fin__meta">
                        <span>{d.qtd} {d.qtd === 1 ? "doação" : "doações"}</span>
                        <span>primeira {fmtDataBR(d.primeira)}</span>
                        <span>última {fmtDataBR(d.ultima)}</span>
                      </div>
                    </div>
                    <div className="aef-fin__donor-total">
                      <strong>{fmtBRL(d.total)}</strong>
                      <span>média {fmtBRL(d.total / d.qtd)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "area" && (
        <section className="aef-fin__panel aef-fin__panel--pad">
          <h2 className="aef-fin__h2" style={{ marginBottom: "var(--space-md)" }}>Despesas por área (todo o histórico)</h2>
          {breakdownArea.length === 0 ? (
            <p className="aef-fin__empty">Sem despesas com área classificada.</p>
          ) : (
            <ul className="aef-fin__bars">
              {breakdownArea.map(([areaId, v]) => {
                const a = FIN_AREAS[areaId] || FIN_AREAS.admin;
                const pct = (v / totalGastosArea) * 100;
                return (
                  <li key={areaId} className="aef-fin__bar" data-tone={AREA_TONE[areaId] || "neutral"}>
                    <div className="aef-fin__bar-head"><span className="aef-fin__bar-name">{a.label}</span><span className="aef-fin__bar-figs"><span>{fmtBRL(v)}</span><span>{pct.toFixed(0)}%</span></span></div>
                    <div className="aef-fin__track" role="presentation"><span style={{ width: `${pct}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="aef-fin__note" style={{ marginTop: "var(--space-lg)" }}>
            Transações vinculadas a uma ação herdam a área dela. Vincule no detalhe da transação.
          </p>
        </section>
      )}

      {tab === "relatorios" && (
        <div className="aef-fin__reports">
          <section className="aef-fin__panel aef-fin__panel--pad">
            <h2 className="aef-fin__h2" style={{ marginBottom: "var(--space-md)" }}>Despesas por categoria</h2>
            {breakdownDespesas.length === 0 ? (
              <p className="aef-fin__empty">Sem despesas este mês.</p>
            ) : (
              <ul className="aef-fin__bars">
                {breakdownDespesas.map(([catId, valor]) => {
                  const cat = FIN_CATEGORIAS[catId] || FIN_CATEGORIAS.nao_categorizado;
                  const pct = (valor / totalDespesas) * 100;
                  return (
                    <li key={catId} className="aef-fin__bar" data-tone={CAT_TONE[catId] || "neutral"}>
                      <div className="aef-fin__bar-head"><span className="aef-fin__bar-name">{cat.label}</span><span className="aef-fin__bar-figs"><span>{fmtBRL(valor)}</span><span>{pct.toFixed(0)}%</span></span></div>
                      <div className="aef-fin__track aef-fin__track--thin" role="presentation"><span style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="aef-fin__panel aef-fin__panel--pad">
            <h2 className="aef-fin__h2">Resumo do mês</h2>
            <ul className="aef-fin__summary">
              <li data-tone="green"><span>Total de doações</span><strong>{fmtBRL(entradas)}</strong></li>
              <li data-tone="red"><span>Total de despesas</span><strong>{fmtBRL(Math.abs(saidas))}</strong></li>
              <li data-tone={entradas + saidas >= 0 ? "green" : "red"}><span>Resultado do mês</span><strong>{fmtBRL(entradas + saidas)}</strong></li>
            </ul>
            <div className="aef-fin__exports">
              <button type="button" className="aef-fin__btn aef-fin__btn--outline aef-fin__btn--grow" disabled>Exportar PDF</button>
              <button type="button" className="aef-fin__btn aef-fin__btn--outline aef-fin__btn--grow" disabled>Exportar Excel</button>
            </div>
            <p className="aef-fin__hint" style={{ textAlign: "center" }}>Disponível após integração com Cora</p>
          </section>
        </div>
      )}

      {/* Toast recibo */}
      {reciboToast && (
        <div className="aef-fin__toast" role="status">{reciboToast}</div>
      )}

      {/* Modal Transparência */}
      {showTransparencia && (
        <div className="aef-fin__scrim aef-fin__scrim--center" onClick={() => setShowTransparencia(false)}>
          <div className="aef-fin__dialog" role="dialog" aria-modal="true" aria-labelledby="fin-transp-title" onClick={(e) => e.stopPropagation()}>
            <div className="aef-fin__dialog-head">
              <div style={{ minWidth: 0 }}>
                <p className="aef-fin__h2">Prévia da página pública</p>
                <p className="aef-fin__url">https://amoremfoco.org/transparencia</p>
              </div>
              <button type="button" className="aef-fin__btn aef-fin__btn--outline" onClick={() => setShowTransparencia(false)}>Fechar</button>
            </div>
            <div className="aef-fin__dialog-body">
              <div className="aef-fin__public-brand">
                <img className="aef-fin__public-logo" src="/logo-vermelha.png" alt="" />
                <h2 id="fin-transp-title" className="aef-fin__dialog-title">Transparência</h2>
                <p className="aef-fin__hint" style={{ marginTop: 0 }}>Amor em Foco, Belém-PA</p>
              </div>
              <ul className="aef-fin__public-figs">
                <li data-tone="green"><span className="aef-fin__figure-label">Doações no mês</span><strong>{fmtBRL(entradas)}</strong></li>
                <li data-tone="red"><span className="aef-fin__figure-label">Gastos no mês</span><strong>{fmtBRL(Math.abs(saidas))}</strong></li>
              </ul>
              <h3 className="aef-fin__h2">Como usamos sua doação</h3>
              <ul className="aef-fin__bars">
                {breakdownArea.map(([areaId, v]) => {
                  const a = FIN_AREAS[areaId] || FIN_AREAS.admin;
                  const pct = (v / totalGastosArea) * 100;
                  return (
                    <li key={areaId} className="aef-fin__bar" data-tone={AREA_TONE[areaId] || "neutral"}>
                      <div className="aef-fin__bar-head"><span className="aef-fin__bar-name">{a.label}</span><span className="aef-fin__bar-figs"><span>{pct.toFixed(0)}%</span></span></div>
                      <div className="aef-fin__track aef-fin__track--thin" role="presentation"><span style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
              <p className="aef-fin__note">
                Atualizado em tempo real com a API da Cora.<br/>
                Conforme LGPD, doadores individuais não são identificados.
              </p>
              <p className="aef-fin__fineprint">Esta página é uma simulação. No deploy real ela ficará pública em <b>amoremfoco.org/transparencia</b>.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editando && (
        <div className="aef-fin__scrim" onClick={() => setEditando(null)}>
          <div className="aef-fin__dialog" role="dialog" aria-modal="true" aria-labelledby="fin-tx-title" onClick={(e) => e.stopPropagation()}>
            <div className="aef-fin__dialog-head">
              <div style={{ minWidth: 0 }}>
                <h2 id="fin-tx-title" className="aef-fin__dialog-title">Detalhes da transação</h2>
                <div className="aef-fin__meta" style={{ marginTop: "var(--space-2xs)" }}>
                  <span>{fmtDataBR(editando.data)}</span>
                  <span>{editando.hora}</span>
                  <span>{editando.tipo.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            <div className="aef-fin__dialog-body">
              <div className="aef-fin__tx" data-tone={editando.valor > 0 ? "green" : undefined}>
                <span className="aef-fin__hint" style={{ marginTop: 0 }}>{editando.contraparte}</span>
                <span className="aef-fin__tx-value">{editando.valor > 0 ? "+" : ""}{fmtBRL(editando.valor)}</span>
                {editando.txid && <span className="aef-fin__hint" style={{ marginTop: 0 }}>txid: {editando.txid}</span>}
              </div>

              <div className="aef-fin__field">
                <label className="aef-fin__label" htmlFor="fin-tx-categoria">Categoria</label>
                <select id="fin-tx-categoria" className="aef-fin__select" value={editando.categoria} onChange={e => setEditando({ ...editando, categoria: e.target.value })}>
                  {Object.entries(FIN_CATEGORIAS).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
                </select>
              </div>
              <div className="aef-fin__field">
                <label className="aef-fin__label" htmlFor="fin-tx-acao">Vincular a ação (opcional)</label>
                <input id="fin-tx-acao" className="aef-fin__input" type="text" placeholder="Nome ou ID da ação" value={editando.acaoId || ""} onChange={e => setEditando({ ...editando, acaoId: e.target.value || null })} />
              </div>
              <label className="aef-fin__checkline">
                <input type="checkbox" checked={!!editando.conciliado} onChange={e => setEditando({ ...editando, conciliado: e.target.checked })} />
                Transação conciliada
              </label>
            </div>

            <div className="aef-fin__dialog-foot">
              <button type="button" className="aef-fin__btn aef-fin__btn--outline aef-fin__btn--grow" onClick={() => setEditando(null)}>Cancelar</button>
              <button type="button" className="aef-fin__btn aef-fin__btn--primary aef-fin__btn--grow" onClick={salvarEdicao}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MARKETING_NAV_ITEMS = [
  { id: "demandas", label: "Demandas", icon: "file", title: "Central de demandas", description: "Receba, priorize e acompanhe pedidos de todos os setores." },
  { id: "calendario", label: "Calendário", icon: "calendar", title: "Calendário editorial", description: "Planeje publicações e envie compromissos para o Google Agenda." },
  { id: "acervo", label: "Acervo", icon: "camera", title: "Acervo de mídia", description: "Encontre fotos, artes e identidades usadas pela organização." },
  { id: "ia", label: "Legendas", icon: "heart", title: "Assistente de legendas", description: "Crie rascunhos alinhados ao tom de voz do Amor em Foco." },
  { id: "posts", label: "Conteúdos", icon: "camera", title: "Conteúdos e rascunhos", description: "Revise materiais salvos e acompanhe o que já foi publicado." },
  { id: "protecao", label: "Proteção", icon: "shield", title: "Proteção de imagens", description: "Proteja rostos localmente antes de usar ou compartilhar uma foto." },
];

function Marketing({ mobile, user }) {
  const [tab, setTab] = useState("demandas");
  const [acervoFilter, setAcervoFilter] = useState("todos");
  const [gerando, setGerando] = useState(false);
  const [gerado, setGerado] = useState(false);
  const [legenda, setLegenda] = useState("");
  const [acaoSelecionada, setAcaoSelecionada] = useState("Café de Rua");
  const [tom, setTom] = useState("emotivo");
  const [posts, setPosts] = useState(() => readMarketingStore(MARKETING_STORAGE_KEYS.posts, POSTS_MOCK));
  const [acervo, setAcervo] = useState(() => readMarketingStore(MARKETING_STORAGE_KEYS.acervo, ACERVO_MOCK));
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [calendarNotice, setCalendarNotice] = useState("");
  const [requests, setRequests] = useState(() => readMarketingStore(MARKETING_STORAGE_KEYS.requests, MARKETING_REQUESTS_SEED));
  const [requestNotice, setRequestNotice] = useState("");
  const [requestForm, setRequestForm] = useState({
    titulo: "",
    setor: user?.department || user?.profileLabel || "Diretoria",
    formato: "Post estático",
    prioridade: "media",
    prazo: "",
    descricao: "",
  });
  const [calendarForm, setCalendarForm] = useState(() => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    return {
      acao: "",
      canal: "Instagram",
      scheduledDate: marketingDateKey(nextDate),
      scheduledTime: "10:00",
      responsavel: "Equipe de Marketing",
      legenda: "",
    };
  });
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [mascarando, setMascarando] = useState(false);
  const [mascVisible, setMascVisible] = useState(false);
  const [maskStyle, setMaskStyle] = useState("blur");
  const [maskPadding, setMaskPadding] = useState(18);
  const [faceBoxes, setFaceBoxes] = useState([]);
  const [protectionError, setProtectionError] = useState("");
  const [protectionNotice, setProtectionNotice] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [manualDrawing, setManualDrawing] = useState(false);
  const protectionCanvasRef = useRef(null);
  const protectionEditorRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const manualStartRef = useRef(null);
  const activeMarketingSection = MARKETING_NAV_ITEMS.find(item => item.id === tab) || MARKETING_NAV_ITEMS[0];

  const acervoFiltrado = acervo.filter(f =>
    acervoFilter === "todos" || f.tipo === acervoFilter
  );

  useEffect(() => {
    localStorage.setItem(MARKETING_STORAGE_KEYS.posts, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem(MARKETING_STORAGE_KEYS.acervo, JSON.stringify(acervo));
    } catch {
      setProtectionError("O navegador ficou sem espaço para salvar a versão protegida. Baixe o arquivo e conecte o armazenamento definitivo depois.");
    }
  }, [acervo]);

  useEffect(() => {
    localStorage.setItem(MARKETING_STORAGE_KEYS.requests, JSON.stringify(requests));
  }, [requests]);

  const criarDemanda = (event) => {
    event.preventDefault();
    if (!requestForm.titulo.trim() || !requestForm.prazo) return;
    const novaDemanda = {
      id: Date.now(),
      ...requestForm,
      titulo: requestForm.titulo.trim(),
      descricao: requestForm.descricao.trim(),
      solicitante: user?.name || "Diretoria",
      status: "brief_recebido",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tempoSolicitacao: "agora",
    };
    setRequests(prev => [novaDemanda, ...prev]);
    setRequestForm(prev => ({ ...prev, titulo: "", prazo: "", descricao: "" }));
    setRequestNotice("Pedido enviado ao Marketing e registrado no Mural.");
  };

  const atualizarStatusDemanda = (requestId, status) => {
    setRequests(prev => prev.map(request => request.id === requestId ? {
      ...request,
      status,
      updatedAt: new Date().toISOString(),
      tempoAtualizacao: "agora",
    } : request));
    setRequestNotice(`Demanda atualizada para “${MARKETING_REQUEST_STATUS[status]?.label || status}” e refletida no Mural.`);
  };

  const requestMetrics = {
    recebidas: requests.length,
    producao: requests.filter(request => request.status === "em_producao").length,
    aprovacao: requests.filter(request => request.status === "em_aprovacao").length,
    entregues: requests.filter(request => request.status === "entregue").length,
  };

  const calendarYear = calendarCursor.getFullYear();
  const calendarMonth = calendarCursor.getMonth();
  const firstWeekday = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const calendarCells = Array.from({ length: calendarCellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) return null;
    const date = new Date(calendarYear, calendarMonth, day);
    const key = marketingDateKey(date);
    return { day, key, posts: posts.filter(post => post.scheduledDate === key) };
  });

  const agendarPost = (event) => {
    event.preventDefault();
    if (!calendarForm.acao.trim() || !calendarForm.scheduledDate) return;
    const novoPost = {
      id: Date.now(),
      ...calendarForm,
      acao: calendarForm.acao.trim(),
      legenda: calendarForm.legenda.trim(),
      data: marketingDateLabel(calendarForm.scheduledDate),
      status: "agendado",
      googleCalendarSent: false,
    };
    setPosts(prev => [novoPost, ...prev]);
    const scheduled = new Date(`${calendarForm.scheduledDate}T12:00:00`);
    setCalendarCursor(new Date(scheduled.getFullYear(), scheduled.getMonth(), 1));
    setCalendarNotice("Postagem adicionada ao calendário editorial.");
    setCalendarForm(prev => ({ ...prev, acao: "", legenda: "" }));
  };

  const enviarGoogleAgenda = (post) => {
    window.open(googleCalendarUrl(post), "_blank", "noopener,noreferrer");
    setPosts(prev => prev.map(item => item.id === post.id ? { ...item, googleCalendarSent: true } : item));
    setCalendarNotice("Evento preparado no Google Agenda. Revise e confirme na nova aba.");
  };

  const gerarLegenda = () => {
    setGerando(true);
    setGerado(false);
    setLegenda("");
    const legendas = {
      emotivo: `Mais um ${acaoSelecionada} realizado com amor e dedicação. 💛 Cada gesto de cuidado transforma vidas — e é isso que nos move. Obrigado a cada voluntário que esteve presente, fazendo a diferença nas ruas de Belém. Juntos somos mais fortes.\n\n#AmorEmFoco #Belém #Voluntariado #Solidariedade`,
      informativo: `A Amor em Foco realizou mais uma ação de ${acaoSelecionada} em Belém, PA. Foram dezenas de atendimentos realizados por nossa equipe de voluntários, levando dignidade e cuidado às comunidades mais vulneráveis da cidade.\n\n#AmorEmFoco #AçãoSocial #Belém`,
      convocacao: `Você quer fazer a diferença? 🙋 Nossa próxima ação de ${acaoSelecionada} está chegando e precisamos de voluntários! Acesse o link na bio e se inscreva. Venha transformar vidas conosco.\n\n#AmorEmFoco #Voluntariado #Belém #VemSerVoluntário`,
    };
    let i = 0;
    const texto = legendas[tom] || legendas.emotivo;
    const interval = setInterval(() => {
      setLegenda(texto.slice(0, i));
      i += 3;
      if (i > texto.length) { clearInterval(interval); setGerando(false); setGerado(true); }
    }, 18);
  };

  const salvarPost = () => {
    if (!legenda) return;
    setPosts(prev => [{ id: Date.now(), legenda, acao: acaoSelecionada, data: new Date().toLocaleDateString("pt-BR"), status: "rascunho", canal: "Instagram", responsavel: "Equipe de Marketing" }, ...prev]);
    setLegenda(""); setGerado(false);
  };

  const loadProtectionImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:/i.test(src)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível abrir esta imagem para processamento."));
    image.src = src;
  });

  const getFaceDetector = async () => {
    if (faceDetectorRef.current) return faceDetectorRef.current;
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: "/mediapipe/models/blaze_face_short_range.tflite" },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
      minSuppressionThreshold: 0.3,
    });
    return faceDetectorRef.current;
  };

  const processProtectionImage = async (foto) => {
    setMascarando(true);
    setProtectionError("");
    setProtectionNotice("Carregando o detector local...");
    setFaceBoxes([]);
    setReviewConfirmed(false);
    try {
      const image = await loadProtectionImage(foto.url);
      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = protectionCanvasRef.current;
      if (canvas) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      const detector = await getFaceDetector();
      setProtectionNotice("Detectando rostos no dispositivo...");
      const result = detector.detect(image);
      const boxes = (result.detections || []).map((detection, index) => {
        const box = detection.boundingBox;
        return {
          id: `${Date.now()}-${index}`,
          x: Math.max(0, box.originX * scale),
          y: Math.max(0, box.originY * scale),
          width: Math.min(targetWidth, box.width * scale),
          height: Math.min(targetHeight, box.height * scale),
          confidence: detection.categories?.[0]?.score || null,
          manual: false,
        };
      });
      setFaceBoxes(boxes);
      setProtectionNotice(boxes.length
        ? `${boxes.length} rosto(s) detectado(s). Revise e adicione máscaras se algo ficou de fora.`
        : "Nenhum rosto foi detectado. Você pode marcar manualmente arrastando sobre a imagem.");
    } catch (error) {
      setProtectionError(error?.message || "Falha ao processar a imagem.");
      setProtectionNotice("Use o modo manual para proteger a imagem.");
    } finally {
      setMascarando(false);
    }
  };

  const iniciarMascaramento = (foto) => {
    setFotoSelecionada(foto);
    setMascVisible(true);
    processProtectionImage(foto);
    setTimeout(() => protectionEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  const drawProtectedCanvas = async () => {
    if (!fotoSelecionada || !protectionCanvasRef.current) return;
    try {
      const image = await loadProtectionImage(fotoSelecionada.url);
      const canvas = protectionCanvasRef.current;
      if (!canvas.width || !canvas.height) {
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      }
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      faceBoxes.forEach((box) => {
        const paddingX = box.width * (maskPadding / 100);
        const paddingY = box.height * (maskPadding / 100);
        const x = Math.max(0, box.x - paddingX);
        const y = Math.max(0, box.y - paddingY);
        const width = Math.min(canvas.width - x, box.width + paddingX * 2);
        const height = Math.min(canvas.height - y, box.height + paddingY * 2);
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.clip();
        if (maskStyle === "blur") {
          ctx.filter = `blur(${Math.max(16, Math.round(width * 0.14))}px)`;
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";
        } else if (maskStyle === "aef") {
          ctx.fillStyle = "#D70D16";
          ctx.fillRect(x, y, width, height);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `700 ${Math.max(12, Math.round(width * 0.22))}px Outfit, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("AEF", x + width / 2, y + height / 2);
        } else {
          ctx.fillStyle = "rgba(18,18,20,0.94)";
          ctx.fillRect(x, y, width, height);
        }
        ctx.restore();
      });
    } catch (error) {
      setProtectionError(error?.message || "Não foi possível gerar a prévia protegida.");
    }
  };

  useEffect(() => {
    if (mascVisible && !mascarando) drawProtectedCanvas();
  }, [fotoSelecionada, faceBoxes, maskStyle, maskPadding, mascVisible, mascarando]);

  useEffect(() => () => {
    faceDetectorRef.current?.close?.();
  }, []);

  const protectionPoint = (event) => {
    const canvas = protectionCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startManualMask = (event) => {
    if (mascarando) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    manualStartRef.current = protectionPoint(event);
    setManualDrawing(true);
  };

  const finishManualMask = (event) => {
    if (!manualStartRef.current) return;
    const end = protectionPoint(event);
    const start = manualStartRef.current;
    const box = {
      id: `manual-${Date.now()}`,
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
      confidence: null,
      manual: true,
    };
    if (box.width > 12 && box.height > 12) setFaceBoxes(prev => [...prev, box]);
    manualStartRef.current = null;
    setManualDrawing(false);
    setReviewConfirmed(false);
  };

  const handleProtectionUpload = (file) => {
    if (!file) return;
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      setProtectionError("Formato não suportado. Envie uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setProtectionError("A imagem deve ter no máximo 12 MB.");
      return;
    }
    setProtectionError("");
    setProtectionNotice("Lendo a imagem selecionada...");
    setMascarando(true);
    const reader = new FileReader();
    reader.onload = () => iniciarMascaramento({
      id: `upload-${Date.now()}`,
      nome: file.name,
      tipo: "foto",
      acao: "Upload local",
      data: new Date().toLocaleDateString("pt-BR"),
      url: reader.result,
      tags: ["upload local"],
    });
    reader.onerror = () => {
      setMascarando(false);
      setProtectionError("Não foi possível ler a imagem selecionada.");
    };
    reader.readAsDataURL(file);
  };

  const canvasToDataUrl = () => protectionCanvasRef.current?.toDataURL("image/jpeg", 0.9);

  const salvarImagemProtegida = () => {
    if (!reviewConfirmed || !faceBoxes.length) return;
    const protectedUrl = canvasToDataUrl();
    if (!protectedUrl) return;
    const protectedItem = {
      id: Date.now(),
      nome: `${fotoSelecionada.nome.replace(/\.[^.]+$/, "")} — protegida.jpg`,
      tipo: "foto",
      acao: fotoSelecionada.acao || "Marketing",
      data: new Date().toLocaleDateString("pt-BR"),
      url: protectedUrl,
      tags: [...(fotoSelecionada.tags || []), "protegida", "revisada"],
      protected: true,
      sourceId: fotoSelecionada.id,
      protectedBy: user?.name || "Equipe de Marketing",
      protectedAt: new Date().toISOString(),
      maskCount: faceBoxes.length,
    };
    setAcervo(prev => [protectedItem, ...prev]);
    setProtectionNotice("Versão protegida e revisada salva separadamente no Acervo.");
  };

  const baixarImagemProtegida = () => {
    const url = canvasToDataUrl();
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fotoSelecionada?.nome?.replace(/\.[^.]+$/, "") || "imagem"}-protegida.jpg`;
    link.click();
  };

  const REQUEST_TONE = { brief_recebido: "purple", em_producao: "teal", em_aprovacao: "amber", entregue: "green" };
  const PRIORITY_TONE = { alta: "red", media: "amber", baixa: "green" };
  const PRIORITY_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" };
  const POST_TONE = { rascunho: "amber", em_aprovacao: "purple", agendado: "blue", publicado: "green" };

  return (
    <div className="aef-mkt">
      <header className="aef-mkt__head">
        <div>
          <h1 className="aef-mkt__title">Marketing</h1>
          <p className="aef-mkt__desc">Planejamento, produção e proteção do conteúdo institucional.</p>
        </div>
        <span className="aef-mkt__aside">{requests.filter(item => item.status !== "entregue").length} demandas ativas</span>
      </header>

      <nav aria-label="Ferramentas de Marketing" className="aef-mkt__tabs">
        {MARKETING_NAV_ITEMS.map(item => (
          <button key={item.id} type="button" className="aef-mkt__tab" aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)}>
            <span aria-hidden="true"><Icon name={item.icon} size={14} /></span>{item.label}
          </button>
        ))}
      </nav>

      <div className="aef-mkt__section-head"><h2 className="aef-mkt__h2">{activeMarketingSection.title}</h2><p className="aef-mkt__hint">{activeMarketingSection.description}</p></div>

      {/* ── DEMANDAS ── */}
      {tab === "demandas" && (
        <div>
          {requestNotice && (
            <div role="status" className="aef-mkt__notice"><span className="aef-mkt__notice-text"><span aria-hidden="true"><Icon name="check" size={14} /></span>{requestNotice}</span><button type="button" className="aef-mkt__btn" onClick={() => setRequestNotice("")} aria-label="Fechar aviso">Fechar</button></div>
          )}

          <ul className="aef-mkt__figures">
            {[
              ["Recebidas", requestMetrics.recebidas, "blue"],
              ["Em produção", requestMetrics.producao, "teal"],
              ["Em aprovação", requestMetrics.aprovacao, "amber"],
              ["Entregues", requestMetrics.entregues, "green"],
            ].map(([label, value, tone]) => (
              <li key={label} className="aef-mkt__figure" data-tone={tone}><span className="aef-mkt__figure-label">{label}</span><span className="aef-mkt__figure-value">{value}</span></li>
            ))}
          </ul>

          <div className="aef-mkt__split aef-mkt__split--form-first">
            <form onSubmit={criarDemanda} className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__form">
              <div className="aef-mkt__form-head"><h3 className="aef-mkt__h3">Nova solicitação</h3><p className="aef-mkt__hint">O andamento também aparecerá no Mural.</p></div>

              <div className="aef-mkt__field"><label htmlFor="marketing-request-title" className="aef-mkt__label">O que você precisa?</label><input id="marketing-request-title" className="aef-mkt__input" required value={requestForm.titulo} onChange={e => setRequestForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Ex.: Divulgação da próxima ação" /></div>

              <div className="aef-mkt__row2">
                <div className="aef-mkt__field">
                  <label htmlFor="marketing-request-sector" className="aef-mkt__label">Setor</label>
                  <select id="marketing-request-sector" className="aef-mkt__select" value={requestForm.setor} onChange={e => setRequestForm(prev => ({ ...prev, setor: e.target.value }))}>
                    {["Diretoria", "Operações", "Financeiro", "RH", "Jurídico", "Marketing"].map(setor => <option key={setor}>{setor}</option>)}
                  </select>
                </div>
                <div className="aef-mkt__field">
                  <label htmlFor="marketing-request-format" className="aef-mkt__label">Formato</label>
                  <select id="marketing-request-format" className="aef-mkt__select" value={requestForm.formato} onChange={e => setRequestForm(prev => ({ ...prev, formato: e.target.value }))}>
                    {["Post estático", "Carrossel", "Story", "Vídeo/Reels", "Campanha", "Outro"].map(formato => <option key={formato}>{formato}</option>)}
                  </select>
                </div>
              </div>

              <div className="aef-mkt__row2">
                <div className="aef-mkt__field">
                  <label htmlFor="marketing-request-priority" className="aef-mkt__label">Prioridade</label>
                  <select id="marketing-request-priority" className="aef-mkt__select" value={requestForm.prioridade} onChange={e => setRequestForm(prev => ({ ...prev, prioridade: e.target.value }))}>
                    <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
                  </select>
                </div>
                <div className="aef-mkt__field">
                  <label htmlFor="marketing-request-deadline" className="aef-mkt__label">Prazo</label>
                  <input id="marketing-request-deadline" className="aef-mkt__input" required type="date" value={requestForm.prazo} onChange={e => setRequestForm(prev => ({ ...prev, prazo: e.target.value }))} />
                </div>
              </div>

              <div className="aef-mkt__field"><label htmlFor="marketing-request-brief" className="aef-mkt__label">Briefing</label><textarea id="marketing-request-brief" className="aef-mkt__textarea" value={requestForm.descricao} onChange={e => setRequestForm(prev => ({ ...prev, descricao: e.target.value }))} rows={4} placeholder="Objetivo, público, mensagem e referências…" /></div>

              <button type="submit" className="aef-mkt__btn aef-mkt__btn--primary aef-mkt__btn--block">
                <span aria-hidden="true"><Icon name="plus" size={14} /></span> Enviar pedido
              </button>
            </form>

            <section className="aef-mkt__panel">
              <div className="aef-mkt__panel-head">
                <div>
                  <h3 className="aef-mkt__h3">Fila de demandas</h3>
                  <p className="aef-mkt__hint">Do briefing recebido até a entrega final.</p>
                </div>
                <span className="aef-mkt__aside">{requests.length} pedidos</span>
              </div>

              <ul className="aef-mkt__list">
                {requests.map((request) => {
                  return (
                    <li key={request.id} className="aef-mkt__item">
                      <div className="aef-mkt__item-head">
                        <div style={{ minWidth: 0 }}>
                          <div className="aef-mkt__item-title">{request.titulo}</div>
                          <div className="aef-mkt__meta"><span>{request.solicitante || request.setor}</span><span>{request.setor}</span><span>{request.formato || "Conteúdo"}</span></div>
                        </div>
                        <span className="aef-mkt__tone-text aef-mkt__cap" data-tone={PRIORITY_TONE[request.prioridade] || "amber"}>{PRIORITY_LABEL[request.prioridade] || request.prioridade}</span>
                      </div>
                      {request.descricao && <p className="aef-mkt__item-text">{request.descricao}</p>}
                      <div className="aef-mkt__item-foot">
                        <span className="aef-mkt__due"><span aria-hidden="true"><Icon name="clock" size={13} /></span>Prazo: {marketingDateLabel(request.prazo)}</span>
                        <select aria-label={`Status de ${request.titulo}`} className="aef-mkt__status-select" data-tone={REQUEST_TONE[request.status] || "purple"} value={request.status} onChange={e => atualizarStatusDemanda(request.id, e.target.value)}>
                          {Object.entries(MARKETING_REQUEST_STATUS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
                        </select>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* ── ACERVO ── */}
      {tab === "acervo" && (
        <div>
          <div className="aef-mkt__chips" role="group" aria-label="Filtrar acervo">
            {["todos","foto","logo","arte"].map(f => (
              <button key={f} type="button" className="aef-mkt__chip" aria-pressed={acervoFilter === f} onClick={() => setAcervoFilter(f)}>{f}</button>
            ))}
          </div>

          <ul className="aef-mkt__media">
            {acervoFiltrado.map(f => (
              <li key={f.id} className="aef-mkt__panel aef-mkt__tile">
                <div className="aef-mkt__tile-img">
                  <img src={f.url} alt={f.nome} />
                </div>
                <div className="aef-mkt__tile-body">
                  <div className="aef-mkt__tile-name">{f.nome}</div>
                  <div className="aef-mkt__tile-foot">
                    <span className="aef-mkt__meta" style={{ marginTop: 0 }}>{f.acao !== "—" && <span>{f.acao}</span>}{f.data !== "—" && <span>{f.data}</span>}</span>
                    <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={() => iniciarMascaramento(f)}>Proteger</button>
                  </div>
                </div>
              </li>
            ))}

            {/* Drive link card */}
            <li style={{ display: "grid" }}>
              <button type="button" className="aef-mkt__drive">
                <span aria-hidden="true"><Icon name="plus" size={18} /></span>
                Abrir Google Drive
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* ── CALENDÁRIO ── */}
      {tab === "calendario" && (
        <div>
          {calendarNotice && (
            <div role="status" className="aef-mkt__notice"><span className="aef-mkt__notice-text"><span aria-hidden="true"><Icon name="check" size={14} /></span>{calendarNotice}</span><button type="button" className="aef-mkt__btn" onClick={() => setCalendarNotice("")} aria-label="Fechar aviso">Fechar</button></div>
          )}

          <div className="aef-mkt__split aef-mkt__split--form-last">
            <section className="aef-mkt__panel" style={{ overflow: "hidden" }}>
              <div className="aef-mkt__cal-bar">
                <div>
                  <h3 className="aef-mkt__cal-month">{calendarCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h3>
                  <p className="aef-mkt__hint">Calendário editorial da equipe</p>
                </div>
                <div className="aef-mkt__cal-nav">
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={() => setCalendarCursor(new Date())}>Hoje</button>
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--outline aef-mkt__btn--icon" onClick={() => setCalendarCursor(new Date(calendarYear, calendarMonth - 1, 1))} aria-label="Mês anterior"><span className="aef-mkt__flip" aria-hidden="true"><Icon name="chevronRight" size={16} /></span></button>
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--outline aef-mkt__btn--icon" onClick={() => setCalendarCursor(new Date(calendarYear, calendarMonth + 1, 1))} aria-label="Próximo mês"><span aria-hidden="true"><Icon name="chevronRight" size={16} /></span></button>
                </div>
              </div>

              <div className="aef-mkt__cal-scroll">
                <div className="aef-mkt__cal">
                  <div className="aef-mkt__cal-week">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(day => <span key={day}>{day}</span>)}
                  </div>
                  <div className="aef-mkt__cal-grid">
                    {calendarCells.map((cell, index) => {
                      const isToday = cell?.key === marketingDateKey(new Date());
                      return (
                        <div key={cell?.key || `empty-${index}`} className="aef-mkt__cal-day" data-empty={cell ? undefined : "true"} data-today={isToday ? "true" : undefined} data-last-row={index >= calendarCellCount - 7 ? "true" : undefined}>
                          {cell && (
                            <>
                              <div className="aef-mkt__cal-num">{cell.day}</div>
                              <div className="aef-mkt__cal-posts">
                                {cell.posts.slice(0, 2).map(post => (
                                  <div key={post.id} className="aef-mkt__cal-post" data-tone={post.googleCalendarSent ? "green" : "blue"}>
                                    <div className="aef-mkt__cal-post-meta"><span>{post.scheduledTime || "09:00"}</span><span>{post.canal}</span></div>
                                    <div title={post.acao} className="aef-mkt__cal-post-title">{post.acao}</div>
                                    <button type="button" className="aef-mkt__cal-send" onClick={() => enviarGoogleAgenda(post)}>
                                      {post.googleCalendarSent ? "Enviado ao Agenda" : "Enviar ao Agenda"}
                                    </button>
                                  </div>
                                ))}
                                {cell.posts.length > 2 && <div className="aef-mkt__cal-more">+{cell.posts.length - 2} postagem(ns)</div>}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={agendarPost} className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__form">
              <div className="aef-mkt__form-head"><h3 className="aef-mkt__h3">Agendar postagem</h3><p className="aef-mkt__hint">Organize aqui e envie ao Google Agenda quando precisar.</p></div>

              <div className="aef-mkt__field"><label htmlFor="mkt-cal-titulo" className="aef-mkt__label">Título da postagem</label><input id="mkt-cal-titulo" className="aef-mkt__input" required value={calendarForm.acao} onChange={e => setCalendarForm(prev => ({ ...prev, acao: e.target.value }))} placeholder="Ex.: Chamada para voluntários" /></div>

              <div className="aef-mkt__row2">
                <div className="aef-mkt__field">
                  <label htmlFor="mkt-cal-data" className="aef-mkt__label">Data</label>
                  <input id="mkt-cal-data" className="aef-mkt__input" required type="date" value={calendarForm.scheduledDate} onChange={e => setCalendarForm(prev => ({ ...prev, scheduledDate: e.target.value }))} />
                </div>
                <div className="aef-mkt__field">
                  <label htmlFor="mkt-cal-hora" className="aef-mkt__label">Horário</label>
                  <input id="mkt-cal-hora" className="aef-mkt__input" required type="time" value={calendarForm.scheduledTime} onChange={e => setCalendarForm(prev => ({ ...prev, scheduledTime: e.target.value }))} />
                </div>
              </div>

              <div className="aef-mkt__field">
                <label htmlFor="mkt-cal-canal" className="aef-mkt__label">Canal</label>
                <select id="mkt-cal-canal" className="aef-mkt__select" value={calendarForm.canal} onChange={e => setCalendarForm(prev => ({ ...prev, canal: e.target.value }))}>
                  {["Instagram", "Facebook", "WhatsApp", "LinkedIn", "Site", "E-mail"].map(canal => <option key={canal}>{canal}</option>)}
                </select>
              </div>

              <div className="aef-mkt__field"><label htmlFor="mkt-cal-resp" className="aef-mkt__label">Responsável</label><input id="mkt-cal-resp" className="aef-mkt__input" value={calendarForm.responsavel} onChange={e => setCalendarForm(prev => ({ ...prev, responsavel: e.target.value }))} /></div>

              <div className="aef-mkt__field"><label htmlFor="mkt-cal-legenda" className="aef-mkt__label">Observação ou legenda</label><textarea id="mkt-cal-legenda" className="aef-mkt__textarea" value={calendarForm.legenda} onChange={e => setCalendarForm(prev => ({ ...prev, legenda: e.target.value }))} rows={3} placeholder="Resumo do conteúdo…" /></div>

              <button type="submit" className="aef-mkt__btn aef-mkt__btn--primary aef-mkt__btn--block">
                <span aria-hidden="true"><Icon name="plus" size={14} /></span> Adicionar ao calendário
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── IA ── */}
      {tab === "ia" && (
        <div className="aef-mkt__narrow">
          <section className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__form">
            <div className="aef-mkt__form-head"><h3 className="aef-mkt__h3">Configurar geração</h3><p className="aef-mkt__hint">Escolha o contexto e o tom antes de gerar.</p></div>

            <div className={mobile ? "aef-mkt__form" : "aef-mkt__row2"}>
              <div className="aef-mkt__field">
                <label htmlFor="mkt-ia-acao" className="aef-mkt__label">Ação</label>
                <select id="mkt-ia-acao" className="aef-mkt__select" value={acaoSelecionada} onChange={e => setAcaoSelecionada(e.target.value)}>
                  {["Café de Rua","Sopão da Noite","Ação de Saúde","Visita Orfanato","Lar de Idosos","Arrecadação"].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="aef-mkt__field">
                <span className="aef-mkt__label" id="mkt-ia-tom">Tom</span>
                <div className="aef-mkt__segments" role="group" aria-labelledby="mkt-ia-tom">
                  {[["emotivo","Emotivo"],["informativo","Informativo"],["convocacao","Convocação"]].map(([id, label]) => (
                    <button key={id} type="button" className="aef-mkt__segment" aria-pressed={tom === id} onClick={() => setTom(id)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            <button type="button" onClick={gerarLegenda} disabled={gerando} aria-busy={gerando} className="aef-mkt__btn aef-mkt__btn--primary aef-mkt__btn--block">
              {gerando ? (
                <><span className="aef-mkt__spinner" aria-hidden="true" /> Gerando…</>
              ) : (
                <>Gerar com IA</>
              )}
            </button>
          </section>

          {/* Output */}
          {(legenda || gerando) && (
            <section className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__form">
              <div className="aef-mkt__field">
                <label htmlFor="generated-caption" className="aef-mkt__label">Legenda gerada</label>
                <textarea id="generated-caption"
                  className="aef-mkt__textarea aef-mkt__textarea--tall"
                  value={legenda}
                  onChange={e => setLegenda(e.target.value)}
                  rows={8}
                />
              </div>
              {gerado && (
                <div className="aef-mkt__row-actions">
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={gerarLegenda}>Gerar outra</button>
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--primary" onClick={salvarPost}>Salvar rascunho</button>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ── POSTS ── */}
      {tab === "posts" && (
        <ul className="aef-mkt__panel aef-mkt__list">
          {posts.map(p => (
            <li key={p.id} className="aef-mkt__item">
              <div className="aef-mkt__item-head">
                <div>
                  <div className="aef-mkt__item-title">{p.acao}</div>
                  <div className="aef-mkt__meta"><span>{p.data}</span>{p.canal && <span>{p.canal}</span>}</div>
                </div>
                <span className="aef-mkt__tone-text aef-mkt__cap" data-tone={POST_TONE[p.status] || "amber"}>{MARKETING_POST_STATUS[p.status]?.label || p.status}</span>
              </div>
              <p className="aef-mkt__item-text aef-mkt__item-text--3">{p.legenda}</p>
              <div className="aef-mkt__actions">
                <button type="button" className="aef-mkt__btn aef-mkt__btn--outline">Editar</button>
                {p.status === "rascunho" && (
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--primary">Copiar para Instagram</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── PROTEÇÃO ── */}
      {tab === "protecao" && (
        <div className="aef-mkt__protect">
          <section className="aef-mkt__panel aef-mkt__intro">
            <div className="aef-mkt__intro-main">
              <span className="aef-mkt__intro-icon" aria-hidden="true"><Icon name="shield" size={18} /></span>
              <div><h3 className="aef-mkt__h3">Processamento seguro no navegador</h3><p className="aef-mkt__hint">O MediaPipe detecta rostos localmente. A equipe revisa todas as máscaras antes de gerar uma nova versão.</p></div>
            </div>
            <span className="aef-mkt__intro-note">Modelo local e revisão humana</span>
          </section>

          {protectionError && <p className="aef-mkt__error" role="alert">{protectionError}</p>}

          <div className="aef-mkt__protect-grid">
            <div className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__steps" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); handleProtectionUpload(event.dataTransfer.files?.[0]); }}>
              <div className="aef-mkt__step">
                <div className="aef-mkt__step-head">
                  <h3 className="aef-mkt__step-title">1. Escolha a imagem</h3>
                  <div className="aef-mkt__upload">
                    <label htmlFor="protection-image-upload" className="aef-mkt__btn aef-mkt__btn--outline"><span aria-hidden="true"><Icon name="upload" size={13} /></span> Selecionar do computador</label>
                    <input id="protection-image-upload" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; handleProtectionUpload(file); }} />
                  </div>
                </div>
                <div className="aef-mkt__thumbs">
                  {acervo.filter(f => f.tipo === "foto" && !f.protected).slice(0, 6).map(f => (
                    <button key={f.id} type="button" className="aef-mkt__thumb" aria-pressed={fotoSelecionada?.id === f.id} onClick={() => iniciarMascaramento(f)} title={f.nome}>
                      <img src={f.url} alt={f.nome} crossOrigin={/^https?:/i.test(f.url) ? "anonymous" : undefined} />
                    </button>
                  ))}
                </div>
                <div className="aef-mkt__drop-hint" aria-live="polite">
                  {mascarando ? "Processando a foto selecionada…" : fotoSelecionada?.acao === "Upload local" ? `Selecionada: ${fotoSelecionada.nome}` : "Ou arraste aqui uma imagem JPG, PNG ou WebP"}
                </div>
              </div>

              <div className="aef-mkt__step">
                <h3 className="aef-mkt__step-title" id="mkt-mask-style">2. Escolha a proteção</h3>
                <div className="aef-mkt__segments" role="group" aria-labelledby="mkt-mask-style">
                  {[["blur","Desfoque"], ["aef","Elemento AEF"], ["silhouette","Silhueta"]].map(([id, label]) => (
                    <button key={id} type="button" className="aef-mkt__segment" aria-pressed={maskStyle === id} onClick={() => { setMaskStyle(id); setReviewConfirmed(false); }}>{label}</button>
                  ))}
                </div>

                <label className="aef-mkt__field" htmlFor="mkt-mask-padding">
                  <span className="aef-mkt__range-head"><span>Margem da máscara</span><span>{maskPadding}%</span></span>
                  <input id="mkt-mask-padding" className="aef-mkt__range" type="range" min="0" max="45" value={maskPadding} onChange={event => { setMaskPadding(Number(event.target.value)); setReviewConfirmed(false); }} />
                </label>

                <p className="aef-mkt__tip">
                  <strong>Correção manual:</strong> arraste sobre qualquer rosto que o detector não encontrou. Remova máscaras incorretas na lista ao lado.
                </p>
              </div>
            </div>

            <div ref={protectionEditorRef} className="aef-mkt__panel aef-mkt__editor">
              {!mascVisible ? (
                <div className="aef-mkt__editor-empty">
                  <span aria-hidden="true"><Icon name="shield" size={22} /></span>
                  <h3 className="aef-mkt__h3">Selecione uma foto para começar</h3>
                  <p className="aef-mkt__hint">O original será preservado.</p>
                </div>
              ) : (
                <>
                  <div className="aef-mkt__editor-head">
                    <div style={{ minWidth: 0 }}>
                      <div className="aef-mkt__item-title">{fotoSelecionada?.nome}</div>
                      <div className="aef-mkt__hint" aria-live="polite">{manualDrawing ? "Solte para adicionar a máscara" : protectionNotice}</div>
                    </div>
                    <span className="aef-mkt__tone-text" data-tone={faceBoxes.length ? "green" : "amber"}>{faceBoxes.length} máscara(s)</span>
                  </div>

                  <div className="aef-mkt__stage" data-busy={mascarando ? "true" : undefined}>
                    <canvas ref={protectionCanvasRef} onPointerDown={startManualMask} onPointerUp={finishManualMask} onPointerCancel={() => { manualStartRef.current = null; setManualDrawing(false); }} aria-label="Editor da imagem protegida" />
                    {mascarando && (
                      <div className="aef-mkt__stage-busy" role="status">
                        <span className="aef-mkt__spinner" aria-hidden="true" />
                        <span>Processando no dispositivo…</span>
                      </div>
                    )}
                  </div>

                  {!mascarando && faceBoxes.length > 0 && (
                    <div className="aef-mkt__masks">
                      {faceBoxes.map((box, index) => (
                        <button key={box.id} type="button" className="aef-mkt__mask-chip" onClick={() => { setFaceBoxes(prev => prev.filter(item => item.id !== box.id)); setReviewConfirmed(false); }} title="Remover esta máscara">
                          Remover {box.manual ? "manual" : `rosto ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {!mascarando && (
                    <>
                      <label className="aef-mkt__confirm">
                        <input type="checkbox" checked={reviewConfirmed} onChange={event => setReviewConfirmed(event.target.checked)} disabled={!faceBoxes.length} />
                        <span>Revisei a imagem inteira e confirmei que todos os rostos que precisam de proteção estão cobertos.</span>
                      </label>
                      <div className="aef-mkt__final">
                        <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={() => processProtectionImage(fotoSelecionada)}>Detectar novamente</button>
                        <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={baixarImagemProtegida} disabled={!reviewConfirmed || !faceBoxes.length}>Baixar versão</button>
                        <button type="button" className="aef-mkt__btn aef-mkt__btn--primary" onClick={salvarImagemProtegida} disabled={!reviewConfirmed || !faceBoxes.length}>Salvar no Acervo</button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE DRAWER ──────────────────────────────────────────────────────────
const CARGOS_OPCOES = [
  "Diretor(a) Geral", "Diretor(a) de Operações", "Diretor(a) Financeiro(a)",
  "Coordenador(a)", "Tech & Marketing", "Comunicação", "Logística",
  "Saúde", "Jurídico", "Educação", "Voluntário(a)", "Outro",
];

// ─── JURÍDICO ─────────────────────────────────────────────────────────────────
const JURIDICO_CATEGORIAS = [
  { id: "certidoes", label: "Certidões Obrigatórias" },
  { id: "estatuto", label: "Estatuto & Atas" },
  { id: "cnpj", label: "CNPJ & Receita" },
  { id: "contratos", label: "Contratos" },
  { id: "declaracoes", label: "Declarações" },
  { id: "parcerias", label: "Parcerias & Convênios" },
  { id: "outros", label: "Outros" },
];

const isoEmDias = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const JURIDICO_SEED = [
  { id: 1, nome: "Estatuto Social AEF.pdf", categoria: "estatuto", tamanho: "412 KB", data: "12/01/2024", responsavel: "Diretoria", vigente: true },
  { id: 2, nome: "Cartão CNPJ 2025.pdf", categoria: "cnpj", tamanho: "98 KB", data: "03/02/2025", responsavel: "Financeiro", vigente: true },
  { id: 3, nome: "Ata de Posse — Diretoria 2024.pdf", categoria: "estatuto", tamanho: "256 KB", data: "20/01/2024", responsavel: "Diretoria", vigente: true },
  { id: 4, nome: "Certidão Negativa Receita Federal.pdf", categoria: "certidoes", tamanho: "82 KB", data: "10/03/2025", responsavel: "Financeiro", vigente: true, validade: isoEmDias(18) },
  { id: 5, nome: "Certidão Regularidade FGTS.pdf", categoria: "certidoes", tamanho: "64 KB", data: "01/02/2025", responsavel: "Financeiro", vigente: true, validade: isoEmDias(-12) },
  { id: 6, nome: "Certidão Justiça do Trabalho.pdf", categoria: "certidoes", tamanho: "78 KB", data: "15/03/2025", responsavel: "Financeiro", vigente: true, validade: isoEmDias(95) },
  { id: 7, nome: "Estatuto Social AEF — versão 2019.pdf", categoria: "estatuto", tamanho: "388 KB", data: "08/05/2019", responsavel: "Diretoria", vigente: false },
];

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function statusValidade(iso) {
  if (!iso) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(iso + "T00:00:00");
  const dias = Math.round((venc - hoje) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { tipo: "vencido", dias, label: `Vencido há ${Math.abs(dias)}d`, cor: "#D70D16", bg: "rgba(215,13,22,0.1)" };
  if (dias <= 30) return { tipo: "vencendo", dias, label: `Vence em ${dias}d`, cor: "#B45309", bg: "rgba(245,158,11,0.12)" };
  return { tipo: "ok", dias, label: `Vence em ${dias}d`, cor: "#15803D", bg: "rgba(34,197,94,0.1)" };
}

function formatDataBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function Juridico({ mobile }) {
  const [tight, setTight] = useState(typeof window !== "undefined" && window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setTight(window.innerWidth < 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  const [docs, setDocs] = useState(() => {
    try {
      const stored = localStorage.getItem("aef_juridico_docs");
      return stored ? JSON.parse(stored) : JURIDICO_SEED;
    } catch { return JURIDICO_SEED; }
  });
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("aef_juridico_docs", JSON.stringify(docs));
    } catch (e) {
      console.warn("Storage cheio — documentos grandes podem não persistir entre sessões", e);
    }
  }, [docs]);

  const filtrados = docs.filter(d => {
    if (!mostrarHistorico && d.vigente === false) return false;
    if (filtro !== "todos" && d.categoria !== filtro) return false;
    if (busca && !d.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const alertas = docs
    .filter(d => d.vigente !== false && d.validade)
    .map(d => ({ doc: d, status: statusValidade(d.validade) }))
    .filter(x => x.status && x.status.tipo !== "ok")
    .sort((a, b) => a.status.dias - b.status.dias);

  const handleFiles = async (files) => {
    setUploadError("");
    const MAX = 8 * 1024 * 1024;
    const arquivos = Array.from(files);
    const grande = arquivos.find(f => f.size > MAX);
    if (grande) {
      setUploadError(`"${grande.name}" tem mais de 8 MB. O armazenamento local não suporta arquivos tão grandes.`);
      return;
    }
    try {
      const novos = await Promise.all(arquivos.map((f, i) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          id: Date.now() + i,
          nome: f.name,
          categoria: "outros",
          tamanho: formatSize(f.size),
          tipo: f.type || "application/octet-stream",
          data: new Date().toLocaleDateString("pt-BR"),
          responsavel: "Você",
          vigente: true,
          validade: null,
          conteudo: reader.result,
        });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(f);
      })));
      setDocs(prev => [...novos, ...prev]);
      setShowUpload(false);
    } catch (e) {
      setUploadError("Erro ao ler arquivo: " + (e?.message || e));
    }
  };

  const baixarDoc = (doc) => {
    if (!doc.conteudo) {
      alert("Este documento de exemplo não tem arquivo anexado. Faça upload de um arquivo real para testar o download.");
      return;
    }
    const a = document.createElement("a");
    a.href = doc.conteudo;
    a.download = doc.nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const removerDoc = (id) => {
    if (confirm("Remover este documento?")) setDocs(prev => prev.filter(d => d.id !== id));
  };

  const catLabel = (id) => JURIDICO_CATEGORIAS.find(c => c.id === id)?.label || id;

  const tomDoStatus = { vencido: "red", vencendo: "amber", ok: "green" };
  const vencidos = alertas.filter(a => a.status.tipo === "vencido").length;
  const vencendo = alertas.filter(a => a.status.tipo === "vencendo").length;

  return (
    <div className="aef-jur">
      <div className="aef-jur__head">
        <div>
          <h1 className="aef-jur__title">Jurídico</h1>
          <p className="aef-jur__desc">Repositório de documentos oficiais da ONG</p>
        </div>
        <button type="button" onClick={() => setShowUpload(true)} className="aef-jur__btn aef-jur__btn--primary">
          <span aria-hidden="true"><Icon name="upload" size={16} strokeWidth={2} /></span>
          Novo documento
        </button>
      </div>

      <ul className="aef-jur__figures">
        <li className="aef-jur__figure"><span className="aef-jur__figure-label">Total vigentes</span><span className="aef-jur__figure-value">{docs.filter(d => d.vigente !== false).length}</span></li>
        <li className="aef-jur__figure" data-tone={vencidos ? "red" : undefined}><span className="aef-jur__figure-label">Vencidos</span><span className="aef-jur__figure-value">{vencidos}</span></li>
        <li className="aef-jur__figure" data-tone={vencendo ? "amber" : undefined}><span className="aef-jur__figure-label">Vencendo (30d)</span><span className="aef-jur__figure-value">{vencendo}</span></li>
        <li className="aef-jur__figure"><span className="aef-jur__figure-label">Certidões</span><span className="aef-jur__figure-value">{docs.filter(d => d.categoria === "certidoes" && d.vigente !== false).length}</span></li>
      </ul>

      <div className="aef-jur__panel aef-jur__toolbar">
        <div className="aef-jur__search">
          <span className="aef-jur__search-icon" aria-hidden="true"><Icon name="search" size={16} /></span>
          <input
            className="aef-jur__input"
            type="search"
            aria-label="Buscar documento"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar documento…"
          />
        </div>
        <div className="aef-jur__chips" role="group" aria-label="Filtrar por categoria">
          {[{ id: "todos", label: "Todos" }, ...JURIDICO_CATEGORIAS].map(cat => {
            const ativo = filtro === cat.id;
            return (
              <button key={cat.id} type="button" className="aef-jur__chip" aria-pressed={ativo} onClick={() => setFiltro(cat.id)}>
                {cat.label}
              </button>
            );
          })}
        </div>
        <label className="aef-jur__check">
          <input type="checkbox" checked={mostrarHistorico} onChange={(e) => setMostrarHistorico(e.target.checked)} />
          Mostrar versões históricas ({docs.filter(d => d.vigente === false).length})
        </label>
      </div>

      <div className="aef-jur__panel aef-jur__register">
        {filtrados.length === 0 ? (
          <div className="aef-jur__empty">
            <span className="aef-jur__empty-icon" aria-hidden="true"><Icon name="file" size={24} /></span>
            <h2 className="aef-jur__h2">Nenhum documento encontrado</h2>
            <p className="aef-jur__desc">Faça upload do primeiro documento para começar</p>
          </div>
        ) : (
          <>
            <div className="aef-jur__cols" aria-hidden="true">
              <span>Documento</span><span>Categoria</span><span>Validade</span><span>Enviado</span><span>Responsável</span><span />
            </div>
            <ul className="aef-jur__register">
              {filtrados.map((doc) => {
                const status = statusValidade(doc.validade);
                const historico = doc.vigente === false;
                const validade = status && !historico ? <span className="aef-jur__validity" data-tone={tomDoStatus[status.tipo]}>{status.label}</span> : null;
                return (
                  <li key={doc.id} className="aef-jur__doc" data-historic={historico ? "true" : undefined}>
                    <div className="aef-jur__doc-main">
                      <div className="aef-jur__doc-name">
                        <span>{doc.nome}</span>
                        {historico && <span className="aef-jur__tag">Histórico</span>}
                      </div>
                      <div className="aef-jur__doc-sub">
                        <span>{doc.tamanho}</span>
                        <span className="aef-jur__sub-meta">{catLabel(doc.categoria)}</span>
                        <span className="aef-jur__sub-meta">{doc.data}</span>
                        {!mobile && <span className="aef-jur__sub-meta">{doc.responsavel}</span>}
                        {validade && <span className="aef-jur__sub-validity">{validade}</span>}
                      </div>
                    </div>
                    <span className="aef-jur__cell">{catLabel(doc.categoria)}</span>
                    <span className="aef-jur__cell">{validade}</span>
                    <span className="aef-jur__cell">{doc.data}</span>
                    <span className="aef-jur__cell">{doc.responsavel}</span>
                    <div className="aef-jur__actions">
                      <button type="button" className="aef-jur__icon-btn" title="Editar" aria-label={"Editar " + doc.nome} onClick={() => setEditing(doc)}>
                        <Icon name="settings" size={15} />
                      </button>
                      <button type="button" className="aef-jur__icon-btn" title="Visualizar" aria-label={"Visualizar " + doc.nome} onClick={() => setViewing(doc)}>
                        <Icon name="eye" size={15} />
                      </button>
                      <button type="button" className="aef-jur__icon-btn" title="Baixar" aria-label={"Baixar " + doc.nome} onClick={() => baixarDoc(doc)}>
                        <Icon name="download" size={15} />
                      </button>
                      <button type="button" className="aef-jur__icon-btn aef-jur__icon-btn--danger" title="Remover" aria-label={"Remover " + doc.nome} onClick={() => removerDoc(doc.id)}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Modal Upload */}
      {showUpload && (
        <div className="aef-jur__scrim" onClick={() => setShowUpload(false)}>
          <div className="aef-jur__dialog" role="dialog" aria-modal="true" aria-labelledby="jur-upload-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="jur-upload-title" className="aef-jur__dialog-title">Enviar documento</h2>
            <p className="aef-jur__dialog-sub">Selecione um ou mais arquivos do seu computador</p>
            <label className="aef-jur__drop">
              <span className="aef-jur__drop-icon" aria-hidden="true"><Icon name="upload" size={28} /></span>
              <span className="aef-jur__drop-title">Clique para escolher arquivos</span>
              <span className="aef-jur__drop-note">PDF, DOC, JPG, PNG (até 8MB)</span>
              <input type="file" multiple onChange={(e) => handleFiles(e.target.files)} />
            </label>
            {uploadError && <p className="aef-jur__error" role="alert">{uploadError}</p>}
            <button type="button" className="aef-jur__btn aef-jur__btn--outline aef-jur__btn--block" onClick={() => { setShowUpload(false); setUploadError(""); }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editing && (
        <div className="aef-jur__scrim" onClick={() => setEditing(null)}>
          <div className="aef-jur__dialog" role="dialog" aria-modal="true" aria-labelledby="jur-edit-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="jur-edit-title" className="aef-jur__dialog-title">Editar documento</h2>
            <p className="aef-jur__dialog-sub">{editing.nome}</p>

            <div className="aef-jur__fields">
              <div className="aef-jur__field">
                <label className="aef-jur__label" htmlFor="jur-categoria">Categoria</label>
                <select
                  id="jur-categoria"
                  className="aef-jur__select"
                  value={editing.categoria}
                  onChange={(e) => setEditing({ ...editing, categoria: e.target.value })}
                >
                  {JURIDICO_CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div className="aef-jur__field">
                <label className="aef-jur__label" htmlFor="jur-validade">Validade (opcional)</label>
                <input
                  id="jur-validade"
                  className="aef-jur__input"
                  type="date"
                  value={editing.validade || ""}
                  onChange={(e) => setEditing({ ...editing, validade: e.target.value || null })}
                />
                {editing.validade && (() => {
                  const s = statusValidade(editing.validade);
                  return s ? <p className="aef-jur__field-note" data-tone={tomDoStatus[s.tipo]}>{s.label} ({formatDataBR(editing.validade)})</p> : null;
                })()}
              </div>

              <div className="aef-jur__field">
                <label className="aef-jur__label" htmlFor="jur-responsavel">Responsável</label>
                <input
                  id="jur-responsavel"
                  className="aef-jur__input"
                  type="text"
                  value={editing.responsavel || ""}
                  onChange={(e) => setEditing({ ...editing, responsavel: e.target.value })}
                />
              </div>

              <label className="aef-jur__toggle">
                <input
                  type="checkbox"
                  checked={editing.vigente !== false}
                  onChange={(e) => setEditing({ ...editing, vigente: e.target.checked })}
                />
                <span>
                  <span className="aef-jur__toggle-title">Documento vigente</span><br />
                  <span className="aef-jur__toggle-note">Desmarque se for uma versão antiga (Estatuto v1, ata revogada, etc.)</span>
                </span>
              </label>
            </div>

            <div className="aef-jur__dialog-actions">
              <button type="button" className="aef-jur__btn aef-jur__btn--outline" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="button" className="aef-jur__btn aef-jur__btn--primary" onClick={() => {
                setDocs(prev => prev.map(d => d.id === editing.id ? editing : d));
                setEditing(null);
              }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar */}
      {viewing && (
        <div className="aef-jur__scrim aef-jur__scrim--viewer" onClick={() => setViewing(null)}>
          <div className="aef-jur__viewer" role="dialog" aria-modal="true" aria-labelledby="jur-view-title" onClick={(e) => e.stopPropagation()}>
            <div className="aef-jur__viewer-bar">
              <div className="aef-jur__viewer-title">
                <h2 id="jur-view-title" className="aef-jur__viewer-name">{viewing.nome}</h2>
                <div className="aef-jur__doc-sub"><span>{catLabel(viewing.categoria)}</span><span>{viewing.tamanho}</span><span>{viewing.data}</span></div>
              </div>
              <button type="button" title="Baixar" className="aef-jur__btn aef-jur__btn--primary" onClick={() => baixarDoc(viewing)}>
                <span aria-hidden="true"><Icon name="download" size={14} strokeWidth={2} /></span>
                {!mobile && "Baixar"}
              </button>
              <button type="button" title="Fechar" className="aef-jur__btn aef-jur__btn--outline" onClick={() => setViewing(null)}>Fechar</button>
            </div>
            <div className="aef-jur__viewer-body">
              {!viewing.conteudo ? (
                <div className="aef-jur__viewer-empty">
                  <span className="aef-jur__empty-icon" aria-hidden="true"><Icon name="file" size={24} /></span>
                  <h3 className="aef-jur__h2">Sem visualização disponível</h3>
                  <p>Este é um documento de exemplo sem arquivo anexado.</p>
                </div>
              ) : viewing.tipo?.startsWith("image/") ? (
                <img src={viewing.conteudo} alt={viewing.nome} />
              ) : viewing.tipo === "application/pdf" ? (
                <iframe src={viewing.conteudo} title={viewing.nome} />
              ) : viewing.tipo?.startsWith("text/") || viewing.tipo?.includes("json") ? (
                <iframe src={viewing.conteudo} title={viewing.nome} />
              ) : (
                <div className="aef-jur__viewer-empty">
                  <span className="aef-jur__empty-icon" aria-hidden="true"><Icon name="file" size={24} /></span>
                  <h3 className="aef-jur__h2">Pré-visualização não suportada</h3>
                  <p>Tipo: {viewing.tipo || "desconhecido"}. Use o botão Baixar para abrir no seu computador.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Profile({ user, onClose, onLogout, onUpdateUser }) {
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

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [usersDirectory, setUsersDirectory] = useState(() => restoreUserDirectory());
  const [user, setUser] = useState(() => restoreUserSession());
  const [active, setActive] = useState("dashboard");
  const [showProfile, setShowProfile] = useState(false);
  const [accessNotice, setAccessNotice] = useState("");
  const mobile = useIsMobile();

  useEffect(() => {
    persistUserDirectory(usersDirectory);
  }, [usersDirectory]);

  useEffect(() => {
    persistUserSession(user);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fallback = getDefaultModule(user);
    if (!canAccessModule(user, active)) setActive(fallback);
  }, [user, active]);

  useEffect(() => {
    if (!accessNotice) return;
    const timeout = setTimeout(() => setAccessNotice(""), 3200);
    return () => clearTimeout(timeout);
  }, [accessNotice]);

  useEffect(() => {
    if (!user) return;
    const sourceUser = usersDirectory.find(item => item.id === user.id || normalizeEmail(item.email) === normalizeEmail(user.email));
    if (!sourceUser || !sourceUser.active) {
      clearUserSession();
      setShowProfile(false);
      setAccessNotice("Sua sessao foi encerrada porque esse acesso foi desativado.");
      setUser(null);
      setActive("dashboard");
      return;
    }
    const syncedSession = buildUserSession(sourceUser);
    if (JSON.stringify(syncedSession) !== JSON.stringify(user)) {
      setUser(syncedSession);
    }
  }, [usersDirectory, user]);

  const handleLogin = nextUser => {
    setUser(nextUser);
    setActive(getDefaultModule(nextUser));
    setAccessNotice("");
    setShowProfile(false);
  };

  const handleLogout = () => {
    clearUserSession();
    setShowProfile(false);
    setAccessNotice("");
    setUser(null);
    setActive("dashboard");
  };

  const handleUserUpdate = nextUser => {
    setUsersDirectory(prev => prev.map(item => (
      item.id === nextUser.id
        ? buildManagedUser({ ...item, ...nextUser })
        : item
    )));
    setUser(buildUserSession(nextUser));
  };

  const handleSaveUser = draftUser => {
    setUsersDirectory(prev => {
      const nextId = draftUser.id || (prev.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1);
      const managed = buildManagedUser({ ...draftUser, id: nextId });
      const updated = draftUser.id
        ? prev.map(item => item.id === draftUser.id ? managed : item)
        : [managed, ...prev];
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleToggleUserStatus = userId => {
    setUsersDirectory(prev => prev.map(item => (
      item.id === userId
        ? buildManagedUser({ ...item, active: !item.active })
        : item
    )));
  };

  const handleResetUsers = () => {
    clearUserDirectory();
    setUsersDirectory(getSeedUsers());
  };

  const handleSetActive = moduleId => {
    if (!user) return;
    if (canAccessModule(user, moduleId)) {
      setActive(moduleId);
      setAccessNotice("");
      return;
    }
    setAccessNotice(`Seu perfil "${user.profileLabel}" nao tem acesso ao modulo ${getModuleLabel(moduleId)}.`);
  };

  if (!user) return <Login onLogin={handleLogin} usersDirectory={usersDirectory} />;

  const allowedNavItems = getAllowedNavItems(user);

  const renderModule = () => {
    switch (active) {
      case "dashboard": return <Dashboard setActive={handleSetActive} mobile={mobile} user={user} />;
      case "rh": return <RH mobile={mobile} user={user} users={usersDirectory} onSaveUser={handleSaveUser} onToggleUserStatus={handleToggleUserStatus} onResetUsers={handleResetUsers} />;
      case "operacoes": return <Operacoes mobile={mobile} user={user} />;
      case "financeiro": return <Financeiro mobile={mobile} setActive={handleSetActive} />;
      case "marketing": return <Marketing mobile={mobile} user={user} />;
      case "juridico": return <Juridico mobile={mobile} />;
      default: return null;
    }
  };

  return (
    <div className="aef-shell">
      {showProfile && <Profile user={user} onClose={() => setShowProfile(false)} onLogout={handleLogout} onUpdateUser={handleUserUpdate} />}
      {!mobile && <Sidebar active={active} setActive={handleSetActive} user={user} onOpenProfile={() => setShowProfile(true)} navItems={allowedNavItems} />}
      <main className={mobile ? "aef-shell__main aef-shell__main--mobile" : "aef-shell__main"}>
        {/* Mobile top bar */}
        {mobile && (
          <header className="aef-topbar">
            <div className="aef-topbar__brand">
              <img className="aef-topbar__logo" src="/logo-vermelha.png" alt="" />
              <div style={{ minWidth: 0 }}>
                <div className="aef-nav__wordmark">AEF Hub</div>
                <div className="aef-nav__org">{user.profileLabel}</div>
              </div>
            </div>
            <button type="button" className="aef-nav__avatar aef-topbar__avatar" aria-label={"Abrir perfil de " + user.name} onClick={() => setShowProfile(true)}>{user.initials}</button>
          </header>
        )}
        <AccessNotice message={accessNotice} />
        {renderModule()}
      </main>
      {mobile && <BottomNav active={active} setActive={handleSetActive} navItems={allowedNavItems} />}
    </div>
  );
}
