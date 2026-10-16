import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
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
  const mobile = useIsMobile();
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
    <div style={{
      minHeight: "100vh", display: "flex",
      flexDirection: mobile ? "column" : "row",
      background: "#FAFAFA", fontFamily: FONT_BODY,
    }}>
      {/* Left panel — red brand hero */}
      <div style={{
        flex: mobile ? "0 0 auto" : 1,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: mobile ? "64px 32px 48px" : "64px",
        position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${C.red} 0%, ${C.redDark || "#851811"} 100%)`,
      }}>
        {/* Decorative shapes */}
        <div style={{
          position: "absolute", width: 520, height: 520, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          top: "-120px", right: "-120px", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 360, height: 360, borderRadius: "50%",
          background: "rgba(0,0,0,0.12)",
          bottom: "-80px", left: "-80px", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", textAlign: "center", maxWidth: 420 }}>
          <div style={{ margin: "0 auto 36px", width: mobile ? 160 : 260 }}>
            <img src="/logo-branco.png" alt="Amor em Foco" style={{ width: "100%", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))" }} />
          </div>

          <p style={{
            color: "rgba(255,255,255,0.95)", fontSize: 17, lineHeight: 1.7,
            fontWeight: 500, margin: 0, letterSpacing: 0.2,
          }}>
            Plataforma interna de gestão.<br />Organização a serviço do amor.
          </p>
        </div>
      </div>

      {/* Right panel — light form */}
      <div style={{
        flex: mobile ? "1 1 auto" : "0 0 480px",
        background: "#FFFFFF",
        borderRadius: mobile ? "24px 24px 0 0" : 0,
        marginTop: mobile ? -24 : 0,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: mobile ? "40px 28px 48px" : "64px 56px",
        boxShadow: mobile ? "none" : "-20px 0 60px rgba(0,0,0,0.05)",
      }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111111", letterSpacing: -0.5, margin: "0 0 8px", fontFamily: FONT_DISPLAY }}>
          Entrar na plataforma
        </h2>
        <p style={{ color: "#6B6B6B", fontSize: 14, margin: "0 0 36px" }}>
          Acesso restrito por perfil, area e permissao
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            { label: "E-mail", type: "email", value: email, set: setEmail, placeholder: "nome@amememfoco.org" },
            { label: "Senha", type: "password", value: pass, set: setPass, placeholder: "••••••••" },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 8, letterSpacing: 0.3 }}>{f.label}</label>
              <input
                type={f.type} value={f.value} placeholder={f.placeholder}
                onChange={e => { f.set(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && submit()}
                style={{
                  width: "100%", padding: "13px 16px",
                  background: "#F5F5F7",
                  border: "1px solid #E5E5EA",
                  borderRadius: 10, fontSize: 15, color: "#111",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s, background 0.2s",
                  WebkitAppearance: "none",
                }}
                onFocus={e => { e.target.style.borderColor = C.red; e.target.style.background = "#FFFFFF"; }}
                onBlur={e => { e.target.style.borderColor = "#E5E5EA"; e.target.style.background = "#F5F5F7"; }}
              />
            </div>
          ))}

          {err && (
            <div style={{ background: "rgba(215,13,22,0.08)", border: "1px solid rgba(215,13,22,0.25)", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, fontWeight: 500 }}>
              {err}
            </div>
          )}

          <button
            onClick={submit} disabled={loading}
            style={{
              background: loading ? "rgba(215,13,22,0.6)" : C.red,
              color: C.white, border: "none", borderRadius: 10,
              padding: "14px", fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8, letterSpacing: 0.2,
              transition: "background 0.2s, transform 0.1s",
              boxShadow: "0 6px 16px rgba(215,13,22,0.25)",
            }}
            onMouseDown={e => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div style={{
            marginTop: 8, padding: "14px 14px 12px",
            background: "#FAFAFA", border: `1px solid ${C.border}`, borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, color: C.textSecondary, textTransform: "uppercase", marginBottom: 8 }}>
              Ambiente de demonstracao
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5, marginBottom: 10 }}>
              Senha temporaria: <strong style={{ color: C.text }}>amor123</strong>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {demoAccounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => { setEmail(account.email); setPass(account.password); setErr(""); }}
                  style={{
                    border: `1px solid ${C.border}`, background: C.white, color: C.text,
                    borderRadius: 999, padding: "7px 10px", fontSize: 11, cursor: "pointer",
                    fontFamily: FONT_BODY,
                  }}
                >
                  {(ACCESS_PROFILES[account.profileId]?.label || "Perfil")} · {account.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#999" }}>
          Problemas de acesso? Fale com o Super Admin ou ajuste o perfil do usuario.
        </p>
      </div>
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
    <div style={{
      width: 248, background: C.white,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 100,
      fontFamily: FONT_BODY,
      borderRight: `1px solid ${C.border}`,
    }}>
      {/* Logo */}
      <div style={{ padding: "26px 22px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, flexShrink: 0 }}>
            <img src="/logo-vermelha.png" alt="Amor em Foco" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 16, letterSpacing: 0.5, fontFamily: FONT_DISPLAY }}>AEF Hub</div>
            <div style={{ color: C.textTertiary, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Amor em Foco</div>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: C.borderLight, margin: "0 16px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "18px 12px" }}>
        <div style={{ fontSize: 10, color: C.textTertiary, letterSpacing: 2, textTransform: "uppercase", padding: "0 12px", marginBottom: 10, fontWeight: 600 }}>Menu</div>
        {navItems.map(it => {
          const isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => setActive(it.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 10, border: "none",
              background: isActive ? C.red : "transparent",
              color: isActive ? C.white : C.textSecondary,
              cursor: "pointer", marginBottom: 4, textAlign: "left",
              fontSize: 14, fontWeight: isActive ? 600 : 500,
              transition: "all 0.15s",
              boxShadow: isActive ? "0 6px 16px rgba(215,13,22,0.25)" : "none",
            }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.borderLight; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={it.icon} size={17} color={isActive ? C.white : C.textSecondary} strokeWidth={isActive ? 2 : 1.6} />
              {it.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ height: 1, background: C.borderLight, margin: "0 16px" }} />
      <div onClick={onOpenProfile} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "background 0.15s", borderRadius: 10 }}
        onMouseEnter={e => e.currentTarget.style.background = C.borderLight}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{user.initials}</div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
          <div style={{ color: C.textTertiary, fontSize: 11 }}>{user.position} · {user.profileLabel}</div>
        </div>
        <Icon name="chevronRight" size={14} color={C.textTertiary} />
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, setActive, navItems }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)",
      display: "flex", borderTop: "1px solid rgba(255,255,255,0.08)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      fontFamily: FONT_BODY,
    }}>
      {navItems.map(it => (
        <button key={it.id} onClick={() => setActive(it.id)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "12px 4px 10px", border: "none",
          background: "transparent", cursor: "pointer", gap: 4,
        }}>
          <Icon name={it.icon} size={20} color={active === it.id ? C.red : "rgba(255,255,255,0.3)"} strokeWidth={active === it.id ? 2 : 1.5} />
          <span style={{ fontSize: 9, color: active === it.id ? C.red : "rgba(255,255,255,0.3)", fontWeight: active === it.id ? 600 : 400, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {it.id === "operacoes" ? "Ops" : it.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

function AccessNotice({ message }) {
  if (!message) return null;
  return (
    <div style={{
      marginBottom: 18, padding: "12px 14px",
      borderRadius: 12, border: "1px solid rgba(180,83,9,0.25)",
      background: "rgba(245,158,11,0.10)", color: "#92400E",
      fontSize: 13, fontWeight: 600,
    }}>
      {message}
    </div>
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
    <Card className="relative h-full overflow-hidden border-0 text-white shadow-xl shadow-red-900/20" style={{ background: `linear-gradient(135deg, ${C.red} 0%, ${C.redDark} 100%)` }}>
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10" />
      <CardContent className={mobile ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><Icon name="dollar" size={16} color={C.white} strokeWidth={2} /></div><div><div className="text-xs font-bold text-white">Resumo financeiro</div><div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-medium text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Atualizado agora</div></div></div>
          <Button type="button" variant="ghost" size="sm" aria-label={visible ? "Ocultar valores financeiros" : "Mostrar valores financeiros"} onClick={() => setVisible(value => !value)} className="h-8 gap-1.5 rounded-lg bg-white/10 px-2 text-[10px] text-white hover:bg-white/20 hover:text-white"><Icon name="eye" size={13} color={C.white} />{visible ? "Ocultar" : "Mostrar"}</Button>
        </div>
        <div className="mt-4">
          {loading ? <div className="h-8 w-36 animate-pulse rounded-lg bg-white/15" /> : <div className="text-2xl font-bold tracking-[-0.04em] text-white">{visible ? saldo : "R$ ••••••"}</div>}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/15 pt-3">
          <div className="flex gap-5">
            <div><div className="text-[8px] font-bold uppercase tracking-wider text-white/60">Entradas</div><div className="mt-1 text-[11px] font-bold text-emerald-200">{visible ? entrada : "••••••"}</div></div>
            <div><div className="text-[8px] font-bold uppercase tracking-wider text-white/60">Saídas</div><div className="mt-1 text-[11px] font-bold text-red-200">{visible ? saida : "••••••"}</div></div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClick} className="h-8 shrink-0 gap-1 rounded-lg px-2 text-[10px] font-semibold text-white hover:bg-white/10 hover:text-white">Financeiro <Icon name="arrowRight" size={12} color={C.white} /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

const MURAL_TIPOS = {
  acao_iniciada: { icon: "settings", cor: "#15803D", bg: "rgba(34,197,94,0.12)", label: "Ação" },
  votacao: { icon: "shield", cor: "#B45309", bg: "rgba(245,158,11,0.14)", label: "Votação" },
  fotos: { icon: "camera", cor: "#1D4ED8", bg: "rgba(29,78,216,0.10)", label: "Marketing" },
  doc: { icon: "file", cor: "#D70D16", bg: "rgba(215,13,22,0.10)", label: "Jurídico" },
  voluntario: { icon: "users", cor: "#7E22CE", bg: "rgba(126,34,206,0.10)", label: "RH" },
  acao_concluida: { icon: "check", cor: "#6E6E73", bg: "#F2F2F7", label: "Ação" },
  doacao: { icon: "dollar", cor: "#0D7A3F", bg: "rgba(13,122,63,0.10)", label: "Financeiro" },
  demanda_marketing: { icon: "camera", cor: "#0D9488", bg: "rgba(13,148,136,0.10)", label: "Marketing" },
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
    <Card className="h-full overflow-hidden border-border/80 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50"><Icon name="home" size={14} color={C.red} /></div><div><h2 className="text-sm font-bold tracking-tight text-foreground" style={{ fontFamily: FONT_DISPLAY }}>Mural</h2><p className="text-[10px] text-muted-foreground">Movimentações de todos os setores</p></div></div>
        <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">{eventosMural.length} atividades</Badge>
      </div>
      <div style={{ maxHeight: mobile ? "none" : 480, overflowY: mobile ? "visible" : "auto" }}>
        {visiveis.map((ev, i) => {
          const cfg = MURAL_TIPOS[ev.tipo] || MURAL_TIPOS.doc;
          const clicavel = ev.tipo === "votacao" && VOTACAO_DETALHES[ev.id];
          return (
            <div key={ev.id} onClick={clicavel ? () => setVotacaoAberta(ev.id) : undefined} style={{
              padding: mobile ? "10px 16px" : "14px 22px",
              display: "flex", alignItems: "center", gap: mobile ? 10 : 12,
              borderBottom: i < visiveis.length - 1 ? `1px solid ${C.borderLight}` : "none",
              cursor: clicavel ? "pointer" : "default",
              transition: "background 0.15s",
            }}
              onMouseEnter={clicavel ? (e) => e.currentTarget.style.background = C.bg : undefined}
              onMouseLeave={clicavel ? (e) => e.currentTarget.style.background = "transparent" : undefined}
            >
              <div style={{ width: mobile ? 32 : 36, height: mobile ? 32 : 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={cfg.icon} size={mobile ? 13 : 15} color={cfg.cor} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: mobile ? 13 : 13.5, color: C.text, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  <span style={{ fontWeight: 700 }}>{ev.autor}</span>
                  <span style={{ color: C.textSecondary }}> {ev.texto} </span>
                  <span style={{ fontWeight: 600 }}>{ev.alvo}</span>
                </div>
                <div style={{ marginTop: 2, fontSize: 11, color: C.textTertiary }}>
                  <span style={{ color: cfg.cor, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", fontSize: 10 }}>{cfg.label}</span>
                  <span> · {ev.tempo}</span>
                </div>
              </div>
              {clicavel && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309", background: "rgba(245,158,11,0.14)", padding: "5px 10px", borderRadius: 10, flexShrink: 0, letterSpacing: 0.3, textTransform: "uppercase" }}>
                  Votar
                </span>
              )}
            </div>
          );
        })}
      </div>
      {mobile && restantes > 0 && (
        <Button variant="ghost" onClick={() => setExpandido(true)} className="h-11 w-full rounded-none border-t border-border/70 text-xs text-primary hover:text-primary">
          Ver mais {restantes} {restantes === 1 ? "atividade" : "atividades"}
        </Button>
      )}
      {mobile && expandido && (
        <Button variant="ghost" onClick={() => setExpandido(false)} className="h-11 w-full rounded-none border-t border-border/70 text-xs text-muted-foreground">
          Mostrar menos
        </Button>
      )}
      {votacaoAberta && <ModalVotacao eventoId={votacaoAberta} onClose={() => setVotacaoAberta(null)} />}
    </Card>
  );
}

function Dashboard({ setActive, mobile, user }) {
  const now = new Date();
  const today = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const hora = now.getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] || "Eder";

  return (
    <div className="space-y-6" style={{ fontFamily: FONT_BODY }}>
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-[34px]" style={{ fontFamily: FONT_DISPLAY }}>{saudacao}, {firstName}</h1>
        <p className="mt-1 text-xs capitalize text-muted-foreground">{today}</p>
      </header>

      <section aria-label="Resumo financeiro">
        <BalanceCard onClick={() => setActive("financeiro")} mobile={mobile} />
      </section>

      <section aria-labelledby="dashboard-actions">
        <div className="mb-3"><h2 id="dashboard-actions" className="text-sm font-bold text-foreground">Ações em andamento</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Acompanhe as operações que estão sendo executadas.</p></div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="relative overflow-hidden border-primary/20 shadow-sm transition-colors hover:border-primary/35">
            <div className="h-1 bg-primary" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50"><Icon name="settings" size={16} color={C.red} /></div><div><Badge className="rounded-full bg-red-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-primary hover:bg-red-50"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary" />Em andamento</Badge><div className="mt-1 text-[9px] text-muted-foreground">Operação ativa</div></div></div>
                <span className="text-[10px] font-semibold text-primary">8 tarefas pendentes</span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div><h3 className="text-lg font-bold tracking-tight text-foreground" style={{ fontFamily: FONT_DISPLAY }}>Café de Rua</h3><div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground"><Icon name="calendar" size={12} color={C.textTertiary} />26 de abril</div></div>
                <Button onClick={() => setActive("operacoes")} size="sm" className="h-9 shrink-0 gap-1.5 rounded-xl px-3 text-[11px] shadow-sm shadow-primary/20">Ver POP <Icon name="arrowRight" size={12} color={C.white} /></Button>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-red-100"><div className="h-full w-[62%] rounded-full bg-primary" /></div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="dashboard-indicators">
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 id="dashboard-indicators" className="text-sm font-bold text-foreground">Indicadores principais</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Selecione um card para abrir a área responsável.</p></div><Badge variant="outline" className="hidden rounded-full text-[9px] font-semibold text-muted-foreground sm:inline-flex">Atualização automática</Badge></div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 2xl:grid-cols-6">
          <StatCard icon="users" tone="green" label="Voluntários" value="134" sub="+12 mês" onClick={() => setActive("rh")} />
          <StatCard icon="settings" tone="amber" label="Ações" value="3" sub="este mês" onClick={() => setActive("operacoes")} />
          <StatCard icon="dollar" tone="red" label="Doadores" value="47" sub="ativos" onClick={() => setActive("financeiro")} />
          <StatCard icon="camera" tone="blue" label="Posts" value="8" sub="publicados" onClick={() => setActive("marketing")} />
          <StatCard icon="eye" tone="purple" label="Views site" value="12,4k" sub="+18%" onClick={() => setActive("marketing")} />
          <StatCard icon="eye" tone="teal" label="Views redes" value="8,7k" sub="+24%" onClick={() => setActive("marketing")} />
        </div>
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

function RHPersonCard({ person }) {
  return (
    <Card className="group relative overflow-hidden border-border/80 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-black/5">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: areaCfg[person.area]?.text || C.red }} />
      <CardContent className="p-0">
        <div className="p-5 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-red-800 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20">
              {person.initials}
              {person.verified && <span className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-emerald-500"><Icon name="check" size={9} color={C.white} strokeWidth={3} /></span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold tracking-[-0.01em] text-foreground">{person.name}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{person.formation}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {person.penalizado ? (
                  <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-[9px] font-bold">Requer atenção</Badge>
                ) : person.novato ? (
                  <Badge variant="secondary" className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 hover:bg-blue-50">Novo cadastro</Badge>
                ) : person.verified ? (
                  <Badge variant="secondary" className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 hover:bg-emerald-50">Verificado</Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[9px] font-bold text-muted-foreground">Cadastro pendente</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted"><Icon name="users" size={12} color={C.textTertiary} /></div>
            <span className="truncate">{person.telefone}</span>
          </div>
          {person.penalizado && person.motivoPenalidade && <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-medium leading-relaxed text-red-700">{person.motivoPenalidade}</div>}
        </div>
        <div className="flex items-center justify-between border-t border-border/70 bg-muted/35 px-5 py-3">
          <Badge variant="outline" className="rounded-full border-0 px-2.5 py-1 text-[10px] font-bold" style={{ background: areaCfg[person.area]?.bg || C.bg, color: areaCfg[person.area]?.text || C.textSecondary }}>{person.area}</Badge>
          <div className="flex items-baseline gap-1"><span className="text-xl font-bold tracking-tight text-foreground">{person.actions}</span><span className="text-[10px] font-medium text-muted-foreground">ações</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

function RHPartnerCard({ partner }) {
  const statusCfg = {
    recorrente: { label: "Parceiro recorrente", color: "text-emerald-700", bg: "bg-emerald-50" },
    ativo: { label: "Parceria ativa", color: "text-blue-700", bg: "bg-blue-50" },
    historico: { label: "Histórico", color: "text-zinc-600", bg: "bg-zinc-100" },
  }[partner.status];
  const tone = areaCfg[partner.segment] || { bg: "#FFF1F2", text: C.red };
  return (
    <Card className="group relative overflow-hidden border-border/80 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-black/5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-zinc-900 via-primary to-red-700" />
      <CardContent className="p-0">
        <div className="p-5 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-bold tracking-wide text-white shadow-sm">{partner.initials}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold tracking-[-0.01em] text-foreground">{partner.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{partner.contribution}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</Badge>
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[9px] font-bold text-muted-foreground">desde {partner.since}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <div className="row-span-2 flex h-7 w-7 items-center justify-center rounded-lg bg-muted"><Icon name="building" size={13} color={C.textTertiary} /></div>
            <span className="truncate font-semibold text-foreground/80">{partner.contact}</span>
            <span className="truncate">{partner.phone}</span>
          </div>
          <div className="mt-3 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground"><b className="text-foreground/75">Última ação:</b> {partner.lastAction}</div>
        </div>
        <div className="flex items-center justify-between border-t border-border/70 bg-muted/35 px-5 py-3">
          <Badge variant="outline" className="rounded-full border-0 px-2.5 py-1 text-[10px] font-bold" style={{ background: tone.bg, color: tone.text }}>{partner.segment}</Badge>
          <div className="flex items-baseline gap-1"><span className="text-xl font-bold tracking-tight text-foreground">{partner.partnerships}</span><span className="text-[10px] font-medium text-muted-foreground">parcerias</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

function RHMemberCard({ member }) {
  const profile = ACCESS_PROFILES[member.profileId] || ACCESS_PROFILES.marketing;
  const moduleCount = member.allowedModules?.length || 0;
  return (
    <Card className="group overflow-hidden border-border/80 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-black/5">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold tracking-wide text-white shadow-sm">{member.initials || getInitials(member.name)}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold tracking-[-0.01em] text-foreground">{member.name}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{member.position || profile.label}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-primary hover:bg-red-50">{profile.label}</Badge>
                <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${member.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-100 text-zinc-600"}`}>{member.active ? "Acesso ativo" : "Acesso inativo"}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/35 p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground/80"><Icon name="users" size={13} color={C.textTertiary} />{member.department || profile.department}</div>
            <div className="mt-2 truncate text-[10px] text-muted-foreground">{member.email}</div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/70 bg-muted/35 px-5 py-3">
          <span className="text-[10px] font-semibold text-muted-foreground">Membro da organização</span>
          <span className="text-[10px] font-bold text-foreground">{moduleCount} {moduleCount === 1 ? "área liberada" : "áreas liberadas"}</span>
        </div>
      </CardContent>
    </Card>
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
  const totalActions = volunteers.reduce((sum, person) => sum + person.actions, 0);
  const totalPartnerships = RH_PARTNERS.reduce((sum, partner) => sum + partner.partnerships, 0);
  const cardGridStyle = { display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 };

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2"><Badge variant="secondary" className="rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary hover:bg-red-50">Acervo de relacionamentos</Badge></div>
          <h1 style={{ fontSize: mobile ? 24 : 30, fontWeight: 700, color: C.text, letterSpacing: -0.6, margin: "0 0 4px", fontFamily: FONT_DISPLAY }}>Rede Amor em Foco</h1>
          <p className="text-sm text-muted-foreground">Voluntários, membros, empresas e instituições que constroem a história da organização.</p>
        </div>
        <Button aria-label="Novo cadastro" className="shrink-0 rounded-xl shadow-sm shadow-primary/20"><Icon name="plus" size={15} color={C.white} /> <span className={mobile ? "hidden" : "inline"}>Novo cadastro</span></Button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          ["Pessoas", volunteers.length, "users", "#D70D16"],
          ["Empresas e parceiros", RH_PARTNERS.length, "building", "#111827"],
          ["Membros da organização", members.length, "shield", "#B45309"],
          ["Parcerias realizadas", totalPartnerships, "check", "#15803D"],
        ].map(([label, value, icon, color]) => (
          <Card key={label} className="border-border/80 shadow-sm"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}12` }}><Icon name={icon} size={16} color={color} /></div><div><div className="text-xl font-bold leading-none text-foreground">{value}</div><div className="mt-1 text-[10px] font-semibold text-muted-foreground">{label}</div></div></CardContent></Card>
        ))}
      </div>

      <Card className="mb-5 border-border/80 shadow-sm">
        <CardContent className="p-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Tabs value={entityType} onValueChange={value => { setEntityType(value); setFilter("Todos"); }} className="shrink-0">
              <TabsList className="grid w-full grid-cols-4 lg:w-[410px]"><TabsTrigger value="todos">Todos</TabsTrigger><TabsTrigger value="pessoas">Pessoas</TabsTrigger><TabsTrigger value="empresas">Empresas</TabsTrigger><TabsTrigger value="membros">Membros</TabsTrigger></TabsList>
            </Tabs>
            <div className="relative min-w-0 flex-1"><div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><Icon name="search" size={15} color={C.textTertiary} /></div><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar pessoa, empresa, área ou atuação..." className="h-10 rounded-xl border-border/80 bg-background pl-9 shadow-none focus-visible:ring-primary" /></div>
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {filters.map(item => <Button key={item} variant={filter === item ? "default" : "outline"} size="sm" onClick={() => setFilter(item)} className="h-7 shrink-0 rounded-full px-3 text-[10px] font-semibold shadow-none">{item}</Button>)}
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center justify-between"><div className="text-xs font-semibold text-muted-foreground">{totalResults} registro(s) encontrado(s)</div>{filter !== "Todos" && <Button variant="ghost" size="sm" onClick={() => setFilter("Todos")} className="h-7 text-[10px] text-primary">Limpar filtro</Button>}</div>

      {filteredPartners.length > 0 && (
        <section className={filteredPeople.length || filteredMembers.length ? "mb-8" : ""}>
          <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900"><Icon name="building" size={13} color={C.white} /></div><div><h2 className="text-sm font-bold text-foreground">Empresas e parceiros</h2><p className="text-[10px] text-muted-foreground">Instituições que apoiam ações, estrutura e alcance.</p></div></div>
          <div style={cardGridStyle}>{filteredPartners.map(partner => <RHPartnerCard key={partner.id} partner={partner} />)}</div>
        </section>
      )}

      {filteredMembers.length > 0 && (
        <section className={filteredPeople.length ? "mb-8" : ""}>
          <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600"><Icon name="shield" size={13} color={C.white} /></div><div><h2 className="text-sm font-bold text-foreground">Membros da organização</h2><p className="text-[10px] text-muted-foreground">Equipe interna com identidade institucional e acesso ao AEF Hub.</p></div></div>
          <div style={cardGridStyle}>{filteredMembers.map(member => <RHMemberCard key={member.id} member={member} />)}</div>
        </section>
      )}

      {filteredPeople.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary"><Icon name="users" size={13} color={C.white} /></div><div><h2 className="text-sm font-bold text-foreground">Pessoas da rede</h2><p className="text-[10px] text-muted-foreground">Voluntários e profissionais que participaram da trajetória.</p></div></div>
          <div style={cardGridStyle}>{filteredPeople.map(person => <RHPersonCard key={person.telefone} person={person} />)}</div>
        </section>
      )}

      {totalResults === 0 && <Card className="border-dashed"><CardContent className="flex min-h-48 flex-col items-center justify-center text-center"><Icon name="search" size={22} color={C.textTertiary} /><div className="mt-3 text-sm font-bold text-foreground">Nenhum vínculo encontrado</div><p className="mt-1 text-xs text-muted-foreground">Tente outro nome, área ou tipo de relacionamento.</p></CardContent></Card>}
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

function RHSectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div><div className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</div><h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: FONT_DISPLAY }}>{title}</h1><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>
      {action}
    </div>
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
      <RHSectionTitle eyebrow="Gestão de pessoas" title="Painel do RH" description="Indicadores de vínculo, presença e acompanhamento da rede de voluntários." />
      <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          ["Ativos", active, "Participaram ao menos uma vez", "#15803D", "users"],
          ["Novos cadastros", newVolunteers, "Aguardando integração", "#1D4ED8", "plus"],
          ["Inativos", inactive, "Sem participação registrada", "#6E6E73", "clock"],
          ["Frequência", `${attendanceRate}%`, `${absences} faltas registradas`, "#D70D16", "check"],
        ].map(([label, value, detail, color, icon]) => (
          <Card key={label} className="border-border/80 shadow-sm"><CardContent className={mobile ? "p-3" : "p-4"}><div className="mb-3 flex items-center justify-between"><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div><div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${color}12` }}><Icon name={icon} size={13} color={color} /></div></div><div className="text-2xl font-bold tracking-tight text-foreground">{value}</div><div className="mt-1 text-[10px] text-muted-foreground">{detail}</div></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-border/80 shadow-sm"><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold">Frequência por ação</h2><p className="text-[10px] text-muted-foreground">Presenças sobre confirmações</p></div><Button variant="ghost" size="sm" onClick={() => onNavigate("participacao")} className="text-[10px] text-primary">Ver participação</Button></div><div className="space-y-3">{attendance.slice(0, 4).map(item => { const rate = Math.round((item.present / item.confirmed) * 100); return <div key={item.id}><div className="mb-1.5 flex items-center justify-between gap-3"><div className="truncate text-[11px] font-semibold text-foreground">{item.action}</div><div className="shrink-0 text-[10px] font-bold text-muted-foreground">{rate}%</div></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} /></div></div>; })}</div></CardContent></Card>

        <div className="grid gap-4">
          <Card className="border-border/80 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Feedbacks pendentes</div><div className="mt-1 text-2xl font-bold">{feedbackPending}</div></div><Button size="sm" variant="outline" onClick={() => onNavigate("feedbacks")} className="rounded-lg text-[10px]">Avaliar</Button></div></CardContent></Card>
          <Card className={`border-border/80 shadow-sm ${openOccurrences ? "border-red-200" : ""}`}><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Ocorrências abertas</div><div className="mt-1 text-2xl font-bold text-red-700">{openOccurrences}</div></div><Button size="sm" variant="outline" onClick={() => onNavigate("ocorrencias")} className="rounded-lg text-[10px]">Acompanhar</Button></div></CardContent></Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm"><CardContent className="p-5"><h2 className="mb-4 text-sm font-bold">Participação por setor</h2><div className="space-y-3">{sectorData.slice(0, 6).map(([sector, value]) => <div key={sector} className="grid grid-cols-[90px_1fr_28px] items-center gap-2"><span className="truncate text-[10px] font-semibold text-muted-foreground">{sector}</span><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(value / maxSector) * 100}%`, background: areaCfg[sector]?.text || C.red }} /></div><span className="text-right text-[10px] font-bold">{value}</span></div>)}</div></CardContent></Card>
        <Card className="border-border/80 shadow-sm"><CardContent className="p-5"><h2 className="mb-4 text-sm font-bold">Maior participação</h2><div className="space-y-2.5">{topPeople.map((person, index) => <div key={person.telefone} className="flex items-center gap-3"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">{index + 1}</div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold">{person.name}</div><div className="text-[9px] text-muted-foreground">{person.area}</div></div><Badge variant="secondary" className="rounded-full text-[9px]">{person.actions} ações</Badge></div>)}</div><p className="mt-4 border-t pt-3 text-[9px] leading-relaxed text-muted-foreground">Indicador usado para reconhecimento, nunca para punição ou comparação isolada.</p></CardContent></Card>
      </div>
    </div>
  );
}

function RHParticipation({ attendance }) {
  const totalPresent = attendance.reduce((sum, item) => sum + item.present, 0);
  const totalAbsent = attendance.reduce((sum, item) => sum + item.absent, 0);
  return (
    <div><RHSectionTitle eyebrow="Operações + RH" title="Participação e frequência" description="Presença, falta e justificativa registradas por ação, incluindo o organizador." />
      <div className="mb-4 grid grid-cols-3 gap-2.5">{[["Presenças", totalPresent, "#15803D"], ["Faltas", totalAbsent, "#D70D16"], ["Justificadas", attendance.reduce((s, i) => s + i.justified, 0), "#B45309"]].map(([label, value, color]) => <Card key={label} className="border-border/80"><CardContent className="p-4"><div className="text-[9px] font-bold uppercase text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold" style={{ color }}>{value}</div></CardContent></Card>)}</div>
      <div className="grid gap-3">{attendance.map(item => { const rate = Math.round((item.present / item.confirmed) * 100); return <Card key={item.id} className="border-border/80 shadow-sm"><CardContent className="p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="text-sm font-bold">{item.action}</div><div className="mt-1 text-[10px] text-muted-foreground">{marketingDateLabel(item.date)} · {item.sector} · Organização: {item.organizer}</div></div><div className="flex flex-wrap gap-1.5"><Badge className="rounded-full bg-emerald-50 text-[9px] text-emerald-700 hover:bg-emerald-50">{item.present} presentes</Badge><Badge className="rounded-full bg-red-50 text-[9px] text-red-700 hover:bg-red-50">{item.absent} faltas</Badge><Badge variant="outline" className="rounded-full text-[9px]">{item.justified} justificadas</Badge></div></div><div className="mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} /></div><span className="text-[10px] font-bold">{rate}%</span></div><div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3"><span className="text-[10px] text-muted-foreground">Organizador presente</span><Badge variant={item.organizerPresent ? "secondary" : "destructive"} className={item.organizerPresent ? "rounded-full bg-emerald-50 text-[9px] text-emerald-700" : "rounded-full text-[9px]"}>{item.organizerPresent ? "Sim" : "Não"}</Badge></div></CardContent></Card>; })}</div>
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
    <div><RHSectionTitle eyebrow="Escuta e desenvolvimento" title="Feedbacks pós-ação" description="Avaliação do organizador e percepção do próprio voluntário sobre a experiência." action={<Button onClick={() => setShowForm(value => !value)} className="rounded-xl text-xs"><Icon name="plus" size={14} color={C.white} /> Nova avaliação</Button>} />
      <div className="mb-4 grid grid-cols-3 gap-2.5">{[["Avaliações", feedbacks.length], ["Média geral", average], ["Do voluntário", feedbacks.filter(item => item.type === "voluntario").length]].map(([label, value]) => <Card key={label} className="border-border/80"><CardContent className="p-4"><div className="text-[9px] font-bold uppercase text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div></CardContent></Card>)}</div>
      {showForm && <Card className="mb-4 border-primary/20 shadow-sm"><CardContent className="p-5"><form onSubmit={submit}><div className="mb-4 grid gap-3 sm:grid-cols-3"><div><Label className="text-[10px]">Tipo</Label><select value={draft.type} onChange={event => setDraft(prev => ({ ...prev, type: event.target.value, scores: {} }))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs"><option value="organizador">Organizador avalia</option><option value="voluntario">Voluntário avalia a ação</option></select></div><div><Label className="text-[10px]">Ação</Label><select value={draft.action} onChange={event => setDraft(prev => ({ ...prev, action: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs">{RH_ATTENDANCE_SEED.map(item => <option key={item.id}>{item.action}</option>)}</select></div><div><Label className="text-[10px]">Voluntário</Label><select value={draft.volunteer} onChange={event => setDraft(prev => ({ ...prev, volunteer: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs">{volunteers.map(item => <option key={item.telefone}>{item.name}</option>)}</select></div></div><div className="grid gap-3 sm:grid-cols-2">{criteria.map(key => <label key={key} className="rounded-lg border border-border/70 bg-muted/30 p-3"><div className="mb-2 flex justify-between text-[10px] font-semibold"><span>{RH_CRITERIA_LABELS[key]}</span><span>{draft.scores[key] || 4}/5</span></div><input type="range" min="1" max="5" value={draft.scores[key] || 4} onChange={event => setDraft(prev => ({ ...prev, scores: { ...prev.scores, [key]: Number(event.target.value) } }))} className="w-full accent-red-600" /></label>)}</div><div className="mt-4"><Label className="text-[10px]">Observação</Label><Textarea value={draft.note} onChange={event => setDraft(prev => ({ ...prev, note: event.target.value }))} placeholder="Contexto útil para desenvolvimento e acompanhamento..." className="mt-1 text-xs" /></div><div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)} className="text-xs">Cancelar</Button><Button type="submit" className="text-xs">Salvar avaliação</Button></div></form></CardContent></Card>}
      <div className="grid gap-3">{feedbacks.map(item => { const values = Object.values(item.scores); const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1); return <Card key={item.id} className="border-border/80 shadow-sm"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold">{item.volunteer}</div><div className="mt-1 text-[10px] text-muted-foreground">{item.action} · {marketingDateLabel(item.date)} · por {item.evaluator}</div></div><Badge variant={item.type === "voluntario" ? "secondary" : "outline"} className="rounded-full text-[9px]">{item.type === "voluntario" ? "Experiência da ação" : `Média ${avg}`}</Badge></div>{item.note && <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">{item.note}</p>}</CardContent></Card>; })}</div>
    </div>
  );
}

function RHOccurrences({ occurrences, onAdd, canAccess }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ volunteer: volunteers[0].name, action: RH_ATTENDANCE_SEED[0].action, type: "Ausência sem aviso", description: "", actionTaken: "", status: "aberta", recurrence: 1 });
  if (!canAccess) return <Card className="border-amber-200 bg-amber-50/50"><CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100"><Icon name="lock" size={20} color="#B45309" /></div><h2 className="mt-4 text-base font-bold">Acesso restrito ao RH</h2><p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">Ocorrências contêm informações confidenciais e só podem ser consultadas por perfis de RH e Super Admin.</p></CardContent></Card>;
  const submit = event => { event.preventDefault(); if (!draft.description.trim()) return; onAdd(draft); setDraft(prev => ({ ...prev, description: "", actionTaken: "" })); setShowForm(false); };
  return (
    <div><RHSectionTitle eyebrow="Confidencial" title="Registro de ocorrências" description="Acompanhamento restrito de condutas, providências e reincidências." action={<Button onClick={() => setShowForm(value => !value)} className="rounded-xl text-xs"><Icon name="plus" size={14} color={C.white} /> Registrar</Button>} />
      <div className="mb-4 grid grid-cols-3 gap-2.5">{[["Em aberto", occurrences.filter(item => item.status === "aberta").length, "#D70D16"], ["Acompanhamento", occurrences.filter(item => item.status === "acompanhamento").length, "#B45309"], ["Encerradas", occurrences.filter(item => item.status === "encerrada").length, "#15803D"]].map(([label, value, color]) => <Card key={label} className="border-border/80"><CardContent className="p-4"><div className="text-[9px] font-bold uppercase text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold" style={{ color }}>{value}</div></CardContent></Card>)}</div>
      {showForm && <Card className="mb-4 border-primary/20"><CardContent className="p-5"><form onSubmit={submit}><div className="grid gap-3 sm:grid-cols-3"><div><Label className="text-[10px]">Voluntário</Label><select value={draft.volunteer} onChange={event => setDraft(prev => ({ ...prev, volunteer: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs">{volunteers.map(item => <option key={item.telefone}>{item.name}</option>)}</select></div><div><Label className="text-[10px]">Ação</Label><select value={draft.action} onChange={event => setDraft(prev => ({ ...prev, action: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs">{RH_ATTENDANCE_SEED.map(item => <option key={item.id}>{item.action}</option>)}</select></div><div><Label className="text-[10px]">Tipo</Label><Input value={draft.type} onChange={event => setDraft(prev => ({ ...prev, type: event.target.value }))} className="mt-1 h-9 text-xs" /></div></div><div className="mt-3"><Label className="text-[10px]">Descrição</Label><Textarea required value={draft.description} onChange={event => setDraft(prev => ({ ...prev, description: event.target.value }))} className="mt-1 text-xs" /></div><div className="mt-3"><Label className="text-[10px]">Providência tomada</Label><Textarea value={draft.actionTaken} onChange={event => setDraft(prev => ({ ...prev, actionTaken: event.target.value }))} className="mt-1 text-xs" /></div><div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)} className="text-xs">Cancelar</Button><Button type="submit" className="text-xs">Salvar ocorrência</Button></div></form></CardContent></Card>}
      <div className="grid gap-3">{occurrences.map(item => <Card key={item.id} className="border-border/80 shadow-sm"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold">{item.volunteer}</div><div className="mt-1 text-[10px] text-muted-foreground">{item.type} · {item.action} · {marketingDateLabel(item.date)}</div></div><Badge variant={item.status === "aberta" ? "destructive" : "secondary"} className="rounded-full text-[9px] capitalize">{item.status}</Badge></div><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{item.description}</p><div className="mt-3 grid gap-2 rounded-lg bg-muted/50 p-3 text-[10px] text-muted-foreground sm:grid-cols-2"><div><b className="text-foreground/75">Registrado por:</b> {item.registeredBy}</div><div><b className="text-foreground/75">Reincidência:</b> {item.recurrence} registro(s)</div><div className="sm:col-span-2"><b className="text-foreground/75">Providência:</b> {item.actionTaken || "Aguardando definição"}</div></div></CardContent></Card>)}</div>
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
    <div>
      <div className="mb-6 overflow-x-auto border-b border-border"><div className="flex min-w-max gap-1">{sections.map(([id, label]) => <button key={id} onClick={() => setSection(id)} className={`relative flex items-center gap-1 rounded-t-md px-3 py-2.5 text-xs font-semibold outline-none transition-colors focus-visible:bg-muted ${section === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}{id === "ocorrencias" && !canAccessOccurrences && <Icon name="lock" size={10} color={C.textTertiary} />}{section === id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}</button>)}</div></div>
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

function TaskRow({ task, onToggle }) {
  const done = task.status === "concluído";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 0",
      borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <button onClick={onToggle} style={{
        width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${done ? "#22C55E" : C.border}`,
        background: done ? "#22C55E" : C.surface, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
      }}>
        {done && <Icon name="check" size={11} color={C.white} strokeWidth={3} />}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: done ? C.textTertiary : C.text, fontWeight: 500, textDecoration: done ? "line-through" : "none" }}>{task.item}</div>
        {task.qtd && <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 1 }}>{task.qtd}</div>}
      </div>
      <div style={{ fontSize: 12, color: task.responsavel ? C.textSecondary : C.red, fontWeight: task.responsavel ? 400 : 600, flexShrink: 0 }}>
        {task.responsavel || "Sem responsável"}
      </div>
    </div>
  );
}

function POPSection({ title, tasks, onToggle }) {
  const [open, setOpen] = useState(true);
  const done = tasks.filter(t => t.status === "concluído").length;
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 0", background: "none", border: "none", cursor: "pointer",
        borderBottom: open ? `1px solid ${C.border}` : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: -0.2 }}>{title}</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
            background: done === tasks.length ? "#F0FDF4" : C.bg,
            color: done === tasks.length ? "#166534" : C.textTertiary,
          }}>{done}/{tasks.length}</span>
        </div>
        <div style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <Icon name="chevronRight" size={14} color={C.textTertiary} />
        </div>
      </button>
      {open && (
        <div style={{ paddingTop: 4 }}>
          {tasks.map((t, i) => (
            <TaskRow key={i} task={t} onToggle={() => onToggle(i)} />
          ))}
        </div>
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

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      {/* Back */}
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
        cursor: "pointer", color: C.textSecondary, fontSize: 13, fontWeight: 500,
        padding: 0, marginBottom: 20,
      }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Operações
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: mobile ? 22 : 26, fontWeight: 700, color: C.text, letterSpacing: -0.5, margin: "0 0 6px", fontFamily: FONT_DISPLAY }}>{acao.nome}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: tipoCfg[acao.tipo]?.bg || C.bg, color: tipoCfg[acao.tipo]?.text || C.textSecondary }}>{acao.tipo}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: statusCfgOp[acao.status]?.bg, padding: "3px 10px", borderRadius: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusCfgOp[acao.status]?.dot }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: statusCfgOp[acao.status]?.text }}>{acao.status}</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: C.textTertiary }}>{acao.data}</div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{acao.voluntarios} voluntários</div>
          </div>
        </div>

        {/* Progress bar */}
        {pop && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.textSecondary }}>Progresso do POP</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: progress === 100 ? "#22C55E" : C.text }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: C.bg, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#22C55E" : C.red, borderRadius: 99, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 5 }}>{doneTasks} de {totalTasks} tarefas concluídas</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0, overflowX: "auto" }}>
        {[["pop", "POP"], ["voluntarios", "Voluntários"], ["inscricoes", `Inscrições${inscricoes.inscritos.length > 0 ? ` (${inscricoes.inscritos.length})` : ""}`], ["sorteio", sorteioStored ? "Sorteio ✓" : "Sorteio"], ["pix", "PIX da ação"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "8px 16px", background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: tab === id ? 600 : 400,
            color: tab === id ? C.text : C.textTertiary,
            borderBottom: tab === id ? `2px solid ${C.red}` : "2px solid transparent",
            marginBottom: -1, transition: "all 0.15s", whiteSpace: "nowrap",
          }}>{label}</button>
        ))}
      </div>

      {tab === "pop" && pop && (
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: "8px 20px 4px" }}>
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
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          {volunteers.slice(0, acao.voluntarios).map((v, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", borderBottom: i < acao.voluntarios - 1 ? `1px solid ${C.borderLight}` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.red, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{v.initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: C.textSecondary }}>{v.formation}</div>
                </div>
              </div>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: areaCfg[v.area]?.bg || C.bg, color: areaCfg[v.area]?.text || C.textSecondary }}>{v.area}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "pop" && !pop && (
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: "32px", textAlign: "center" }}>
          <div style={{ color: C.textTertiary, fontSize: 14 }}>POP ainda não cadastrado para esta ação.</div>
        </div>
      )}

      {tab === "sorteio" && (
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: mobile ? "20px" : "28px" }}>
          {sorteioStored ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icon name="check" size={16} color="#15803D" strokeWidth={2.5} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>Sorteio realizado</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.textSecondary }}>
                    {sorteioStored.resultado.sorteados.length} sorteados · {sorteioStored.resultado.reserva.length} reserva · gerado em {sorteioStored.resultado.geradaEm}
                  </div>
                  {sorteioStored.resultado.geradoPor && (
                    <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="users" size={12} color={C.textTertiary} />
                      Gerado por <b style={{ color: C.text, fontWeight: 600 }}>{sorteioStored.resultado.geradoPor}</b>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowSorteio(true)} style={{
                  background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Abrir / Refazer</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                <div style={{ border: `1.5px solid rgba(34,197,94,0.3)`, background: "rgba(34,197,94,0.04)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: `1px solid rgba(34,197,94,0.2)`, fontSize: 12, fontWeight: 700, color: "#15803D", letterSpacing: 0.4, textTransform: "uppercase" }}>
                    Sorteados ({sorteioStored.resultado.sorteados.length})
                  </div>
                  {sorteioStored.resultado.sorteados.map((v, i) => (
                    <div key={v.name} style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 10, borderTop: i === 0 ? "none" : `1px solid rgba(34,197,94,0.12)` }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", width: 20 }}>{i + 1}.</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{v.name}{v.novato && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: "#15803D", background: "rgba(34,197,94,0.14)", padding: "1px 6px", borderRadius: 6, textTransform: "uppercase" }}>Novato</span>}</div>
                        {v.telefone && <div style={{ fontSize: 11, color: C.textSecondary }}>{v.telefone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ border: `1.5px solid ${C.border}`, background: C.bg, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.4, textTransform: "uppercase" }}>
                    Reserva ({sorteioStored.resultado.reserva.length})
                  </div>
                  {sorteioStored.resultado.reserva.length === 0 ? (
                    <div style={{ padding: 14, fontSize: 12, color: C.textTertiary, textAlign: "center" }}>Sem reserva</div>
                  ) : sorteioStored.resultado.reserva.map((v, i) => (
                    <div key={v.name} style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 10, borderTop: i === 0 ? "none" : `1px solid ${C.borderLight}` }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, width: 20 }}>{i + 1}.</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{v.name}{v.novato && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: "#15803D", background: "rgba(34,197,94,0.12)", padding: "1px 6px", borderRadius: 6, textTransform: "uppercase" }}>Novato</span>}</div>
                        {v.telefone && <div style={{ fontSize: 11, color: C.textSecondary }}>{v.telefone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: C.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon name="users" size={24} color={C.textTertiary} strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 6px", fontFamily: FONT_DISPLAY }}>Nenhum sorteio realizado</h3>
              <p style={{ fontSize: 13, color: C.textSecondary, maxWidth: 360, margin: "0 auto 18px", lineHeight: 1.5 }}>
                Sorteie a equipe desta ação a partir do banco de voluntários do RH. Os telefones serão incluídos automaticamente.
              </p>
              <button onClick={() => setShowSorteio(true)} style={{
                background: C.red, color: C.white, border: "none", borderRadius: 10,
                padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
                boxShadow: "0 6px 16px rgba(215,13,22,0.22)",
              }}>
                <Icon name="users" size={15} color={C.white} strokeWidth={2} />
                Realizar sorteio
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "inscricoes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Status + Link */}
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: mobile ? "18px" : "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: inscricoes.status === "aberta" ? "#22C55E" : C.textTertiary, boxShadow: inscricoes.status === "aberta" ? "0 0 0 3px rgba(34,197,94,0.2)" : "none" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {inscricoes.status === "aberta" ? "Inscrições abertas" : "Inscrições fechadas"}
                  </div>
                  <div style={{ fontSize: 12, color: C.textTertiary }}>
                    {inscricoes.inscritos.length} {inscricoes.inscritos.length === 1 ? "pessoa inscrita" : "pessoas inscritas"}
                  </div>
                </div>
              </div>
              {inscricoes.status === "aberta" ? (
                <button onClick={fecharInscricoes} style={{ padding: "8px 14px", background: C.white, color: C.textSecondary, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Fechar inscrições</button>
              ) : (
                <button onClick={abrirInscricoes} style={{ padding: "9px 16px", background: C.red, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px rgba(215,13,22,0.22)" }}>Abrir inscrições</button>
              )}
            </div>

            {inscricoes.status === "aberta" && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Link para o grupo do WhatsApp</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 220, padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.text, background: C.bg, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {linkInscricao}
                  </div>
                  <button onClick={copiarLink} style={{ padding: "11px 16px", background: copiadoLink ? "#15803D" : C.text, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {copiadoLink ? "✓ Copiado" : "Copiar link"}
                  </button>
                  <button onClick={() => setShowPreview(true)} style={{ padding: "11px 16px", background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="eye" size={14} color={C.text} /> Ver página
                  </button>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 14px", background: C.bg, borderRadius: 10, marginBottom: 14 }}>
                  <img alt="QR Code" src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(linkInscricao)}`} style={{ width: 90, height: 90, borderRadius: 6, background: C.white, padding: 4 }} />
                  <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                    Compartilhe o link no grupo ou cole o QR Code num story.<br />
                    Inscrições serão registradas em tempo real nesta página.
                  </div>
                </div>

                <button onClick={() => setShowEditor(s => !s)} style={{
                  width: "100%", padding: "11px 14px", background: showEditor ? C.bg : C.white,
                  color: C.text, border: `1px solid ${C.border}`, borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="settings" size={14} color={C.text} />
                    Personalizar página (foto + descrição)
                  </span>
                  <span style={{ color: C.textTertiary, fontSize: 12 }}>{showEditor ? "▲" : "▼"}</span>
                </button>

                {showEditor && (
                  <div style={{ marginTop: 12, padding: "16px", border: `1px solid ${C.border}`, borderRadius: 10, background: C.white }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Foto de capa</div>
                    {inscricoes.imagem ? (
                      <div style={{ position: "relative", marginBottom: 14 }}>
                        <img src={inscricoes.imagem} alt="Capa" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, display: "block" }} />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <label style={{ flex: 1, padding: "9px", background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
                            Trocar imagem
                            <input type="file" accept="image/*" onChange={(e) => handleImagemUpload(e.target.files?.[0])} style={{ display: "none" }} />
                          </label>
                          <button onClick={removerImagem} style={{ padding: "9px 14px", background: C.white, color: C.red, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Remover</button>
                        </div>
                      </div>
                    ) : (
                      <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "26px 16px", border: `2px dashed ${C.border}`, borderRadius: 10, cursor: "pointer", background: C.bg, marginBottom: 14 }}>
                        <Icon name="camera" size={22} color={C.textTertiary} strokeWidth={1.8} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 8 }}>Adicionar foto de capa</div>
                        <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 3 }}>JPG ou PNG, até 4 MB</div>
                        <input type="file" accept="image/*" onChange={(e) => handleImagemUpload(e.target.files?.[0])} style={{ display: "none" }} />
                      </label>
                    )}

                    <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Descrição da ação</div>
                    <textarea
                      value={inscricoes.descricao}
                      onChange={(e) => atualizarDescricao(e.target.value)}
                      placeholder="Conte o que vai acontecer nesta ação. Quem vai ser atendido, onde, qual o horário, se tem treinamento obrigatório, materiais que o voluntário precisa levar..."
                      rows={6}
                      style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: FONT_BODY, lineHeight: 1.5, resize: "vertical" }}
                    />
                    <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 6 }}>
                      Aparece em destaque na página pública, antes do formulário. Pode usar emojis e quebras de linha.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Lista de inscritos */}
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Inscritos ({inscricoes.inscritos.length})</span>
              {inscricoes.inscritos.length > 0 && (
                <button onClick={() => setShowSorteio(true)} style={{ padding: "7px 14px", background: C.red, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="users" size={13} color={C.white} strokeWidth={2} />
                  Sortear destes
                </button>
              )}
            </div>
            {inscricoes.inscritos.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: C.textSecondary }}>
                  {inscricoes.status === "aberta" ? "Aguardando inscrições. Compartilhe o link acima." : "Abra as inscrições para receber voluntários."}
                </div>
              </div>
            ) : inscricoes.inscritos.map((i, idx) => (
              <div key={i.id} style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, borderTop: idx === 0 ? "none" : `1px solid ${C.borderLight}` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.bg, color: C.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {i.nome.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{i.nome}</span>
                    {i.novato && <span style={{ fontSize: 9, fontWeight: 700, color: "#15803D", background: "rgba(34,197,94,0.12)", padding: "1px 6px", borderRadius: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Novato</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 1 }}>
                    {i.idade && `${i.idade} anos · `}{i.telefone}
                    {i.ultimaAcao && ` · ${i.ultimaAcao}`}
                    {i.emergencia && ` · emerg.: ${i.emergencia}`}
                  </div>
                </div>
                <button onClick={() => removerInscrito(i.id)} title="Remover" style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="trash" size={13} color={C.red} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "pix" && (
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: mobile ? "20px" : "28px" }}>
          {pixData ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icon name="check" size={16} color="#15803D" strokeWidth={2.5} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>PIX da ação configurado</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.textSecondary }}>
                    Todo PIX recebido com este txid será vinculado automaticamente à ação.
                  </div>
                  <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4 }}>Criado em {pixData.criadoEm}</div>
                </div>
                <button onClick={() => { if (confirm("Regenerar PIX? O txid antigo deixará de funcionar.")) gerarPix(); }} style={{ padding: "9px 14px", background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Regenerar</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "auto 1fr", gap: 20, alignItems: "start" }}>
                <div style={{ background: C.white, padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, justifySelf: mobile ? "center" : "start" }}>
                  <img alt="QR Code PIX" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.payload)}`} style={{ width: 180, height: 180, display: "block" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase" }}>Chave PIX</label>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <div style={{ flex: 1, padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.text, background: C.bg }}>{pixData.chave}</div>
                      <button onClick={() => copiarPix("chave", pixData.chave)} style={{ padding: "10px 14px", background: copiadoPix === "chave" ? "#15803D" : C.text, color: C.white, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{copiadoPix === "chave" ? "✓" : "Copiar"}</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase" }}>Identificador (txid)</label>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <div style={{ flex: 1, padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.text, background: C.bg, fontFamily: "monospace" }}>{pixData.txid}</div>
                      <button onClick={() => copiarPix("txid", pixData.txid)} style={{ padding: "10px 14px", background: copiadoPix === "txid" ? "#15803D" : C.text, color: C.white, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{copiadoPix === "txid" ? "✓" : "Copiar"}</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase" }}>PIX Copia e Cola</label>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <div style={{ flex: 1, padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 11, color: C.textSecondary, background: C.bg, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pixData.payload}</div>
                      <button onClick={() => copiarPix("payload", pixData.payload)} style={{ padding: "10px 14px", background: copiadoPix === "payload" ? "#15803D" : C.text, color: C.white, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{copiadoPix === "payload" ? "✓" : "Copiar"}</button>
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px", background: "rgba(245,158,11,0.10)", borderRadius: 10, fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
                    💡 Coloque o QR Code no story / status do WhatsApp. Quando alguém doar, o Hub avisa no Mural e contabiliza esta ação automaticamente.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: C.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon name="dollar" size={24} color={C.textTertiary} strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 6px", fontFamily: FONT_DISPLAY }}>Crie um PIX exclusivo para esta ação</h3>
              <p style={{ fontSize: 13, color: C.textSecondary, maxWidth: 420, margin: "0 auto 18px", lineHeight: 1.5 }}>
                Cada PIX recebido com este identificador será vinculado automaticamente à ação <b>{acao.nome}</b>. Você verá quanto a ação arrecadou separado do caixa geral.
              </p>
              <button onClick={gerarPix} style={{ background: C.red, color: C.white, border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 6px 16px rgba(215,13,22,0.22)" }}>
                <Icon name="dollar" size={15} color={C.white} strokeWidth={2} />
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600, padding: 12 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, fontFamily: FONT_BODY, maxHeight: "94vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: C.text, color: "rgba(255,255,255,0.7)", padding: "8px 14px", borderRadius: "12px 12px 0 0", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "monospace" }}>🔒 {linkInscricao}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 22, height: 22, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>×</button>
        </div>
        <div style={{ background: C.white, borderRadius: "0 0 12px 12px", overflowY: "auto" }}>
          {imagem && (
            <div style={{ width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: C.bg }}>
              <img src={imagem} alt={acao.nome} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          )}
          <div style={{ padding: 28 }}>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.red, color: C.white, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, fontFamily: FONT_DISPLAY, marginBottom: 10 }}>♥</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", fontFamily: FONT_DISPLAY }}>Amor em Foco</h2>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>Inscrição de voluntário</p>
            </div>

            <div style={{ background: "rgba(215,13,22,0.05)", border: `1px solid rgba(215,13,22,0.15)`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>{acao.tipo}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{acao.nome}</div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>📅 {acao.data}</div>
            </div>

            {!enviado && (
              <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6, marginBottom: 22, padding: "16px 18px", background: C.bg, borderRadius: 12, whiteSpace: "pre-wrap" }}>
                {descricao && descricao.trim()
                  ? descricao
                  : <span style={{ color: C.textSecondary }}>Iremos servir café da manhã para pessoas em situação de rua em Belém. <b>Treinamento online obrigatório</b> antes da ação — data e link serão enviados a quem for sorteado.</span>}
              </div>
            )}

          {enviado ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon name="check" size={26} color="#15803D" strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 6px", fontFamily: FONT_DISPLAY }}>Inscrição confirmada!</h3>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: "0 0 18px" }}>O resultado do sorteio será divulgado no grupo. Obrigado por se voluntariar 💛</p>
              <button onClick={onClose} style={{ padding: "10px 22px", background: C.red, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Nome completo *</label>
                  <input type="text" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Seu nome" style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: FONT_BODY }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Idade *</label>
                  <input type="number" min={12} max={100} value={form.idade} onChange={e => setForm(p => ({ ...p, idade: e.target.value }))} placeholder="Sua idade" style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: FONT_BODY }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Você já participou de alguma ação do Amor em Foco? *</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {EXPERIENCIA_OPCOES.map(opt => {
                      const ativo = form.experiencia === opt.id;
                      return (
                        <button key={opt.id} onClick={() => setForm(p => ({ ...p, experiencia: opt.id }))} style={{ textAlign: "left", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${ativo ? C.red : C.border}`, background: ativo ? "rgba(215,13,22,0.06)" : C.white, color: ativo ? C.red : C.textSecondary, fontSize: 13, fontWeight: ativo ? 700 : 500, cursor: "pointer", fontFamily: FONT_BODY, display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${ativo ? C.red : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {ativo && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} />}
                          </span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Seu contato (WhatsApp) *</label>
                  <input type="tel" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(91) 9XXXX-XXXX" style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: FONT_BODY }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Contato de emergência *</label>
                  <input type="tel" value={form.emergencia} onChange={e => setForm(p => ({ ...p, emergencia: e.target.value }))} placeholder="Familiar ou pessoa próxima" style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: FONT_BODY }} />
                </div>
                <div style={{ padding: "12px 14px", background: C.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>Termo de compromisso</div>
                  <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5, margin: "0 0 10px" }}>
                    Declaro que participarei do treinamento online obrigatório, comparecerei à ação no horário marcado, seguirei as orientações da diretoria e estou ciente de que minha inscrição não garante a vaga (será definida por sorteio).
                  </p>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: C.text, fontWeight: 600 }}>
                    <input type="checkbox" checked={form.termo} onChange={e => setForm(p => ({ ...p, termo: e.target.checked }))} style={{ cursor: "pointer" }} />
                    Sim, concordo.
                  </label>
                </div>
              </div>
              {erro && (
                <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(215,13,22,0.08)", color: C.red, borderRadius: 8, fontSize: 13 }}>{erro}</div>
              )}
              <button onClick={submeter} style={{ marginTop: 20, width: "100%", padding: "13px", background: C.red, color: C.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px rgba(215,13,22,0.22)" }}>
                Quero participar
              </button>
              <p style={{ fontSize: 11, color: C.textTertiary, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>Esta página é uma simulação. No deploy real ela ficará em <b>amoremfoco.org/inscricao/{acao.id}</b> e qualquer pessoa com o link poderá se inscrever.</p>
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

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center",
      zIndex: 500, padding: mobile ? 0 : 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.white, borderRadius: mobile ? "16px 16px 0 0" : 18,
        width: "100%", maxWidth: 640, fontFamily: FONT_BODY,
        maxHeight: mobile ? "94vh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: mobile ? "18px 20px 14px" : "22px 26px 16px", borderBottom: `1px solid ${C.borderLight}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: C.text, letterSpacing: -0.4, margin: "0 0 4px", fontFamily: FONT_DISPLAY }}>Sorteio — {acao.nome}</h2>
              <p style={{ color: C.textSecondary, fontSize: 13, margin: 0 }}>
                {etapa === "config" && `${acao.data} · Configure critérios e quem está inscrito`}
                {etapa === "resultado" && `${acao.data} · Salvo em ${resultado?.geradaEm}${resultado?.geradoPor ? ` por ${resultado.geradoPor}` : ""}`}
              </p>
            </div>
            <button onClick={onClose} style={{ background: C.bg, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: C.textSecondary }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "18px 20px" : "20px 26px" }}>
          {etapa === "config" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Vagas</label>
                  <input type="number" min={1} value={vagas} onChange={e => setVagas(Math.max(1, +e.target.value || 1))}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: FONT_BODY }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Mínimo de novatos</label>
                  <input type="number" min={0} value={minNovatos} onChange={e => setMinNovatos(Math.max(0, +e.target.value || 0))}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: FONT_BODY }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
                <div style={{ background: C.bg, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.textTertiary, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>Inscritos</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{elegiveis.length}</div>
                </div>
                <div style={{ background: "rgba(34,197,94,0.08)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#15803D", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>Novatos</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#15803D" }}>{totalNovatos}</div>
                </div>
                <div style={{ background: "rgba(126,34,206,0.08)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#7E22CE", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>Veteranos</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#7E22CE" }}>{totalVeteranos}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>{origemPool === "inscricoes" ? `Inscritos pela página pública (${pool.length})` : "Voluntários do banco"}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setInscritos(Object.fromEntries(pool.map(v => [v.name, !v.penalizado])))} style={{ fontSize: 11, color: C.red, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Marcar todos</button>
                  <button onClick={() => setInscritos({})} style={{ fontSize: 11, color: C.textSecondary, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Limpar</button>
                </div>
              </div>

              <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                {pool.map((v, i) => (
                  <label key={v.name} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    borderTop: i === 0 ? "none" : `1px solid ${C.borderLight}`,
                    cursor: v.penalizado ? "not-allowed" : "pointer", opacity: v.penalizado ? 0.55 : 1,
                  }}>
                    <input type="checkbox" disabled={v.penalizado} checked={!!inscritos[v.name]}
                      onChange={e => setInscritos(prev => ({ ...prev, [v.name]: e.target.checked }))}
                      style={{ cursor: v.penalizado ? "not-allowed" : "pointer" }}
                    />
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: v.penalizado ? C.borderLight : C.bg, color: C.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{v.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {v.name}
                        {v.novato && <span style={{ fontSize: 9, fontWeight: 700, color: "#15803D", background: "rgba(34,197,94,0.12)", padding: "1px 6px", borderRadius: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Novato</span>}
                        {v.penalizado && <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: "rgba(215,13,22,0.08)", padding: "1px 6px", borderRadius: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Penalizado</span>}
                      </div>
                      <div style={{ fontSize: 11, color: C.textTertiary }}>
                        {v.area} · {v.actions} ações
                        {v.penalizado && v.motivoPenalidade && ` · ${v.motivoPenalidade}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {etapa === "resultado" && resultado && (
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <div style={{ border: `1.5px solid rgba(34,197,94,0.3)`, background: "rgba(34,197,94,0.04)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", borderBottom: `1px solid rgba(34,197,94,0.2)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D", letterSpacing: 0.4, textTransform: "uppercase" }}>Sorteados ({resultado.sorteados.length})</span>
                  <button onClick={() => copiar("sorteados")} style={{ fontSize: 11, fontWeight: 600, color: copiado === "sorteados" ? "#15803D" : C.textSecondary, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    {copiado === "sorteados" ? "✓ copiado" : "Copiar"}
                  </button>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {resultado.sorteados.map((v, i) => (
                    <div key={v.name} style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, borderTop: i === 0 ? "none" : `1px solid rgba(34,197,94,0.12)` }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", width: 22, flexShrink: 0 }}>{i + 1}.</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {v.name}
                          {v.novato && <span style={{ fontSize: 9, fontWeight: 700, color: "#15803D", background: "rgba(34,197,94,0.14)", padding: "1px 6px", borderRadius: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Novato</span>}
                        </div>
                        {v.telefone && <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>{v.telefone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ border: `1.5px solid ${C.border}`, background: C.bg, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.4, textTransform: "uppercase" }}>Reserva ({resultado.reserva.length})</span>
                  <button onClick={() => copiar("reserva")} style={{ fontSize: 11, fontWeight: 600, color: copiado === "reserva" ? "#15803D" : C.textSecondary, background: "none", border: "none", cursor: "pointer" }}>
                    {copiado === "reserva" ? "✓ copiado" : "Copiar"}
                  </button>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {resultado.reserva.length === 0 ? (
                    <div style={{ padding: 14, fontSize: 12, color: C.textTertiary, textAlign: "center" }}>Sem reserva — todos foram sorteados</div>
                  ) : resultado.reserva.map((v, i) => (
                    <div key={v.name} style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, borderTop: i === 0 ? "none" : `1px solid ${C.borderLight}` }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, width: 22, flexShrink: 0 }}>{i + 1}.</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {v.name}
                          {v.novato && <span style={{ fontSize: 9, fontWeight: 700, color: "#15803D", background: "rgba(34,197,94,0.12)", padding: "1px 6px", borderRadius: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Novato</span>}
                        </div>
                        {v.telefone && <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>{v.telefone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: mobile ? "14px 20px" : "16px 26px", borderTop: `1px solid ${C.borderLight}`, display: "flex", gap: 10 }}>
          {etapa === "config" && (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", background: C.white, color: C.textSecondary, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button disabled={!podeSortear} onClick={realizar} style={{
                flex: 2, padding: "11px", background: podeSortear ? C.red : C.borderLight,
                color: podeSortear ? C.white : C.textTertiary, border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: podeSortear ? "pointer" : "not-allowed",
                boxShadow: podeSortear ? "0 6px 16px rgba(215,13,22,0.22)" : "none",
              }}>
                {!podeSortear ? `Selecione ao menos ${vagas} voluntários` : "Realizar sorteio"}
              </button>
            </>
          )}
          {etapa === "resultado" && (
            <>
              <button onClick={refazer} style={{ flex: 1, padding: "11px", background: C.white, color: C.textSecondary, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Refazer</button>
              <button onClick={() => copiar("tudo")} style={{
                flex: 2, padding: "11px", background: copiado === "tudo" ? "#15803D" : C.red,
                color: C.white, border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 6px 16px rgba(215,13,22,0.22)",
              }}>
                {copiado === "tudo" ? "✓ Copiado para área de transferência" : "Copiar lista completa"}
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
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: mobile ? 24 : 28, fontWeight: 700, color: C.text, letterSpacing: -0.5, margin: "0 0 4px", fontFamily: FONT_DISPLAY }}>Operações</h1>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>{acoes.length} ações registradas</p>
        </div>
        <button onClick={() => setShowNovaAcao(true)} style={{
          background: C.red, color: C.white, border: "none", borderRadius: 10,
          padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
        }}>
          <Icon name="plus" size={16} color={C.white} />
          Nova Ação
        </button>
      </div>

      {/* Nova Ação modal */}
      {showNovaAcao && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }} onClick={() => setShowNovaAcao(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.surface, borderRadius: "20px 20px 0 0", padding: "28px 24px 40px",
            width: "100%", maxWidth: 520,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: -0.4, margin: 0 }}>Nova Ação</h2>
              <button onClick={() => setShowNovaAcao(false)} style={{ background: C.bg, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: C.textSecondary }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Nome da ação", key: "nome", type: "text", placeholder: "Ex: Café de Rua — Abril" },
                { label: "Data", key: "data", type: "date", placeholder: "" },
                { label: "Responsável", key: "responsavel", type: "text", placeholder: "Nome do diretor responsável" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={novaAcao[f.key]}
                    onChange={e => setNovaAcao(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = C.red}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>Tipo de ação</label>
                <select value={novaAcao.tipo} onChange={e => setNovaAcao(p => ({ ...p, tipo: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", background: C.surface, appearance: "none" }}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={() => {
                if (!novaAcao.nome || !novaAcao.data) return;
                setAcoes(prev => [{ id: Date.now(), ...novaAcao, status: "planejamento", voluntarios: 0, pop: null }, ...prev]);
                setShowNovaAcao(false);
                setNovaAcao({ nome: "", tipo: "Café de Rua", data: "", responsavel: "" });
              }} style={{
                background: C.red, color: C.white, border: "none", borderRadius: 10,
                padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4,
              }}>
                Criar Ação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {acoes.map((a) => (
          <div key={a.id} onClick={() => { setSelected(a); setView("detail"); }} style={{
            background: C.surface, borderRadius: 16, padding: "18px 20px",
            border: `1px solid ${C.border}`, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            transition: "box-shadow 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: C.text, letterSpacing: -0.3 }}>{a.nome}</span>
                <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: tipoCfg[a.tipo]?.bg || C.bg, color: tipoCfg[a.tipo]?.text || C.textSecondary }}>{a.tipo}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: C.textTertiary, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="clock" size={11} color={C.textTertiary} /> {a.data}
                </span>
                <span style={{ fontSize: 12, color: C.textTertiary, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="users" size={11} color={C.textTertiary} /> {a.voluntarios} voluntários
                </span>
                <span style={{ fontSize: 12, color: C.textSecondary }}>{a.responsavel}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: statusCfgOp[a.status]?.bg, padding: "4px 10px", borderRadius: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusCfgOp[a.status]?.dot }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: statusCfgOp[a.status]?.text, whiteSpace: "nowrap" }}>{a.status}</span>
              </div>
              <Icon name="chevronRight" size={16} color={C.textTertiary} />
            </div>
          </div>
        ))}
      </div>
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

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: mobile ? 24 : 28, fontWeight: 700, color: C.text, letterSpacing: -0.5, margin: "0 0 4px", fontFamily: FONT_DISPLAY }}>Financeiro</h1>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>Conta Cora · {transacoes.length} movimentações</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setShowTransparencia(true)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
            background: C.white, color: C.text, border: `1px solid ${C.border}`,
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <Icon name="eye" size={14} color={C.text} />
            Página pública
          </button>
          <button title="Disponível quando integrarmos com a API Cora" disabled style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
            background: C.bg, color: C.textTertiary, border: `1px solid ${C.border}`,
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "not-allowed",
          }}>
            <Icon name="settings" size={14} color={C.textTertiary} />
            Sincronizar com Cora
          </button>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {alertas.map(a => (
            <div key={a.tipo} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10,
              background: a.cor === C.red ? "rgba(215,13,22,0.06)" : "rgba(245,158,11,0.08)",
              border: `1px solid ${a.cor === C.red ? "rgba(215,13,22,0.2)" : "rgba(245,158,11,0.25)"}`,
              fontSize: 13, color: a.cor, fontWeight: 600,
            }}>
              <Icon name="shield" size={14} color={a.cor} strokeWidth={2} />
              {a.texto}
            </div>
          ))}
        </div>
      )}

      {/* Meta mensal */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 18px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase" }}>Meta de doações do mês</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginTop: 2 }}>
              {fmtBRL(entradas)} <span style={{ fontSize: 13, color: C.textTertiary, fontWeight: 500 }}>de {fmtBRL(meta)} ({metaPct.toFixed(0)}%)</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {metaBatida && <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", background: "rgba(34,197,94,0.12)", padding: "3px 10px", borderRadius: 10, letterSpacing: 0.4, textTransform: "uppercase" }}>🎉 Meta batida</span>}
            {editandoMeta ? (
              <>
                <input type="number" value={meta} onChange={e => setMeta(+e.target.value || 0)} style={{ width: 110, padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: FONT_BODY, outline: "none" }} />
                <button onClick={() => setEditandoMeta(false)} style={{ padding: "6px 12px", background: C.red, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>OK</button>
              </>
            ) : (
              <button onClick={() => setEditandoMeta(true)} style={{ padding: "6px 12px", background: C.white, color: C.textSecondary, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Editar meta</button>
            )}
          </div>
        </div>
        <div style={{ height: 8, background: C.borderLight, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${metaPct}%`, height: "100%", background: metaBatida ? "#22C55E" : C.red, transition: "width 0.5s" }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        <div style={{ background: `linear-gradient(135deg, ${C.red} 0%, ${C.redDark} 100%)`, color: C.white, padding: "14px 16px", borderRadius: 12, boxShadow: "0 8px 24px rgba(215,13,22,0.18)" }}>
          <div style={{ fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.85, fontWeight: 600 }}>Saldo Cora</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing: -0.5 }}>{fmtBRL(saldoAtual)}</div>
        </div>
        <StatCard icon="dollar" tone="green" label="Entradas mês" value={fmtBRL(entradas).replace("R$", "").trim()} sub="este mês" />
        <StatCard icon="dollar" tone="red" label="Saídas mês" value={fmtBRL(Math.abs(saidas)).replace("R$", "").trim()} sub="este mês" />
        <StatCard icon="settings" tone={naoCategorizadas > 0 ? "amber" : "green"} label="Pendentes" value={naoCategorizadas} sub="conciliar" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 16px", background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? C.text : C.textTertiary,
            borderBottom: tab === t.id ? `2px solid ${C.red}` : "2px solid transparent",
            marginBottom: -1, whiteSpace: "nowrap",
          }}>
            {t.label}{t.count !== undefined && ` (${t.count})`}
          </button>
        ))}
      </div>

      {(tab === "extrato" || tab === "doacoes" || tab === "despesas") && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="search" size={15} color={C.textTertiary} />
              </div>
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por descrição..." style={{
                width: "100%", padding: "10px 14px 10px 38px", border: `1px solid ${C.border}`,
                borderRadius: 10, fontSize: 13, fontFamily: FONT_BODY, background: C.white,
                outline: "none", boxSizing: "border-box",
              }} />
            </div>
            <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} style={{
              padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 10,
              fontSize: 13, fontFamily: FONT_BODY, background: C.white, cursor: "pointer",
            }}>
              <option value="semana">Últimos 7 dias</option>
              <option value="mes">Este mês</option>
              <option value="tudo">Tudo</option>
            </select>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{
              padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 10,
              fontSize: 13, fontFamily: FONT_BODY, background: C.white, cursor: "pointer",
            }}>
              <option value="todas">Todas categorias</option>
              {Object.entries(FIN_CATEGORIAS).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
            </select>
          </div>

          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {filtradas.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: C.textTertiary, fontSize: 13 }}>
                Nenhuma movimentação encontrada com esses filtros.
              </div>
            ) : filtradas.map((t, i) => {
              const cat = FIN_CATEGORIAS[t.categoria] || FIN_CATEGORIAS.nao_categorizado;
              const entrada = t.valor > 0;
              return (
                <div key={t.id} onClick={() => setEditando({ ...t })} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: mobile ? "12px 14px" : "14px 18px",
                  borderTop: i === 0 ? "none" : `1px solid ${C.borderLight}`,
                  cursor: "pointer", transition: "background 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: entrada ? "rgba(34,197,94,0.10)" : "rgba(215,13,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: entrada ? "#15803D" : C.red, lineHeight: 1 }}>{entrada ? "↓" : "↑"}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: mobile ? 200 : 380 }}>{t.descricao}</span>
                      {!t.conciliado && <span style={{ fontSize: 9, fontWeight: 700, color: "#B45309", background: "rgba(245,158,11,0.14)", padding: "1px 6px", borderRadius: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Pendente</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.textTertiary, flexWrap: "wrap" }}>
                      <span>{fmtDataBR(t.data)} · {t.hora}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: cat.cor, background: cat.bg, padding: "1px 7px", borderRadius: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>{cat.label}</span>
                      {t.acaoId && <span>· Ação #{t.acaoId}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: entrada ? "#15803D" : C.text, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {entrada ? "+" : ""}{fmtBRL(t.valor)}
                    </div>
                    {entrada && t.contraparte !== "Anônimo" && t.categoria === "doacao" && (
                      <button title="Gerar recibo de doação" onClick={(e) => { e.stopPropagation(); emitirRecibo(t); }} style={{
                        width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                        background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon name="file" size={13} color={C.textSecondary} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "doadores" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{doadores.length} doadores identificados</span>
            <div style={{ display: "flex", gap: 10, fontSize: 11, color: C.textSecondary }}>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#22C55E", marginRight: 4 }} />Fiel</span>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", marginRight: 4 }} />Recorrente</span>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", marginRight: 4 }} />Novo</span>
            </div>
          </div>
          {doadores.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: C.textTertiary, fontSize: 13 }}>Nenhum doador identificado ainda.</div>
          ) : doadores.map((d, i) => {
            const klass = classificarDoador(d.qtd, d.total);
            return (
              <div key={d.nome} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderTop: i === 0 ? "none" : `1px solid ${C.borderLight}` }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: klass.bg, color: klass.cor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {d.nome.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.nome}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: klass.cor, background: klass.bg, padding: "2px 8px", borderRadius: 10, letterSpacing: 0.4, textTransform: "uppercase" }}>{klass.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 2 }}>
                    {d.qtd} {d.qtd === 1 ? "doação" : "doações"} · primeira {fmtDataBR(d.primeira)} · última {fmtDataBR(d.ultima)}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#15803D", fontVariantNumeric: "tabular-nums" }}>{fmtBRL(d.total)}</div>
                  <div style={{ fontSize: 11, color: C.textTertiary }}>média {fmtBRL(d.total / d.qtd)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "area" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px", fontFamily: FONT_DISPLAY }}>Despesas por área (todo o histórico)</h3>
          {breakdownArea.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.textTertiary, fontSize: 13 }}>Sem despesas com área classificada.</div>
          ) : breakdownArea.map(([areaId, v]) => {
            const a = FIN_AREAS[areaId] || FIN_AREAS.admin;
            const pct = (v / totalGastosArea) * 100;
            return (
              <div key={areaId} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: C.text, fontWeight: 600 }}>{a.label}</span>
                  <span style={{ color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(v)} · {pct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 8, background: C.borderLight, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: a.cor, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 16, padding: "10px 14px", background: C.bg, borderRadius: 10, fontSize: 12, color: C.textSecondary }}>
            💡 Transações vinculadas a uma ação herdam a área dela. Vincule no detalhe da transação.
          </div>
        </div>
      )}

      {tab === "relatorios" && (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 14px", fontFamily: FONT_DISPLAY }}>Despesas por categoria</h3>
            {breakdownDespesas.length === 0 ? (
              <div style={{ fontSize: 13, color: C.textTertiary, textAlign: "center", padding: 20 }}>Sem despesas este mês.</div>
            ) : breakdownDespesas.map(([catId, valor]) => {
              const cat = FIN_CATEGORIAS[catId] || FIN_CATEGORIAS.nao_categorizado;
              const pct = (valor / totalDespesas) * 100;
              return (
                <div key={catId} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, fontSize: 13 }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>{cat.label}</span>
                    <span style={{ color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(valor)} · {pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, background: C.borderLight, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: cat.cor, transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 14px", fontFamily: FONT_DISPLAY }}>Resumo do mês</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(34,197,94,0.08)", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#15803D", fontWeight: 600 }}>Total de doações</span>
                <span style={{ fontSize: 14, color: "#15803D", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(entradas)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(215,13,22,0.06)", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>Total de despesas</span>
                <span style={{ fontSize: 14, color: C.red, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(Math.abs(saidas))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: C.bg, borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>Resultado do mês</span>
                <span style={{ fontSize: 14, color: entradas + saidas >= 0 ? "#15803D" : C.red, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(entradas + saidas)}</span>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button disabled style={{ flex: 1, padding: "10px", background: C.bg, color: C.textTertiary, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "not-allowed" }}>Exportar PDF</button>
              <button disabled style={{ flex: 1, padding: "10px", background: C.bg, color: C.textTertiary, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "not-allowed" }}>Exportar Excel</button>
            </div>
            <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 8, textAlign: "center" }}>Disponível após integração com Cora</div>
          </div>
        </div>
      )}

      {/* Toast recibo */}
      {reciboToast && (
        <div style={{
          position: "fixed", bottom: mobile ? 80 : 24, left: "50%", transform: "translateX(-50%)",
          background: C.text, color: C.white, padding: "12px 20px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, zIndex: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}>{reciboToast}</div>
      )}

      {/* Modal Transparência */}
      {showTransparencia && (
        <div onClick={() => setShowTransparencia(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 12 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, fontFamily: FONT_BODY, maxHeight: "94vh", display: "flex", flexDirection: "column" }}>
            <div style={{ background: C.text, color: "rgba(255,255,255,0.7)", padding: "8px 14px", borderRadius: "12px 12px 0 0", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "monospace" }}>🔒 https://amoremfoco.org/transparencia</span>
              <button onClick={() => setShowTransparencia(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 22, height: 22, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>×</button>
            </div>
            <div style={{ background: C.white, padding: 28, borderRadius: "0 0 12px 12px", overflowY: "auto" }}>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.red, color: C.white, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, fontFamily: FONT_DISPLAY, marginBottom: 10 }}>♥</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 4px", fontFamily: FONT_DISPLAY }}>Transparência</h2>
                <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>Amor em Foco · Belém-PA</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                <div style={{ padding: "14px 16px", background: "rgba(34,197,94,0.08)", borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: 0.4 }}>Doações no mês</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#15803D", marginTop: 4 }}>{fmtBRL(entradas)}</div>
                </div>
                <div style={{ padding: "14px 16px", background: "rgba(215,13,22,0.06)", borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.4 }}>Gastos no mês</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.red, marginTop: 4 }}>{fmtBRL(Math.abs(saidas))}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Como usamos sua doação</div>
              {breakdownArea.map(([areaId, v]) => {
                const a = FIN_AREAS[areaId] || FIN_AREAS.admin;
                const pct = (v / totalGastosArea) * 100;
                return (
                  <div key={areaId} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>{a.label}</span>
                      <span style={{ color: C.textSecondary }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 6, background: C.borderLight, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: a.cor }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 18, padding: "12px 14px", background: C.bg, borderRadius: 10, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                ✅ Atualizado em tempo real com a API da Cora.<br/>
                🔒 Conforme LGPD, doadores individuais não são identificados.
              </div>
              <p style={{ fontSize: 11, color: C.textTertiary, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>Esta página é uma simulação. No deploy real ela ficará pública em <b>amoremfoco.org/transparencia</b>.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editando && (
        <div onClick={() => setEditando(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center",
          zIndex: 500, padding: mobile ? 0 : 16,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.white, borderRadius: mobile ? "16px 16px 0 0" : 16,
            padding: mobile ? 22 : 26, width: "100%", maxWidth: 480,
            maxHeight: mobile ? "92vh" : "90vh", overflowY: "auto", fontFamily: FONT_BODY,
          }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: C.text, margin: "0 0 4px", fontFamily: FONT_DISPLAY }}>Detalhes da transação</h2>
            <p style={{ color: C.textSecondary, fontSize: 12, margin: "0 0 18px" }}>{fmtDataBR(editando.data)} · {editando.hora} · {editando.tipo.replace("_", " ")}</p>

            <div style={{ padding: "14px 16px", background: editando.valor > 0 ? "rgba(34,197,94,0.06)" : "rgba(215,13,22,0.04)", borderRadius: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 3 }}>{editando.contraparte}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: editando.valor > 0 ? "#15803D" : C.text, fontVariantNumeric: "tabular-nums" }}>
                {editando.valor > 0 ? "+" : ""}{fmtBRL(editando.valor)}
              </div>
              {editando.txid && <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4, fontFamily: "monospace" }}>txid: {editando.txid}</div>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Categoria</label>
                <select value={editando.categoria} onChange={e => setEditando({ ...editando, categoria: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: FONT_BODY, background: C.white, cursor: "pointer" }}>
                  {Object.entries(FIN_CATEGORIAS).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>Vincular a ação (opcional)</label>
                <input type="text" placeholder="Nome ou ID da ação" value={editando.acaoId || ""} onChange={e => setEditando({ ...editando, acaoId: e.target.value || null })} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: FONT_BODY, background: C.white, boxSizing: "border-box" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", background: C.bg, borderRadius: 10 }}>
                <input type="checkbox" checked={!!editando.conciliado} onChange={e => setEditando({ ...editando, conciliado: e.target.checked })} style={{ cursor: "pointer" }} />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Transação conciliada</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setEditando(null)} style={{ flex: 1, padding: "11px", background: C.white, color: C.textSecondary, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={salvarEdicao} style={{ flex: 1, padding: "11px", background: C.red, color: C.white, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px rgba(215,13,22,0.22)" }}>Salvar</button>
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

  return (
    <div className="space-y-5" style={{ fontFamily: FONT_BODY }}>
      <header>
        <div className="mb-2 flex items-center gap-2"><Badge variant="secondary" className="rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-red-50">Comunicação</Badge><span className="text-[10px] font-semibold text-muted-foreground">{requests.filter(item => item.status !== "entregue").length} demandas ativas</span></div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-[34px]" style={{ fontFamily: FONT_DISPLAY }}>Marketing</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Planejamento, produção e proteção do conteúdo institucional.</p>
      </header>

      <nav aria-label="Ferramentas de Marketing" className="overflow-x-auto pb-1">
        <Tabs value={tab} onValueChange={setTab} className="min-w-max">
          <TabsList className="h-auto gap-1 rounded-xl border border-border/70 bg-card p-1.5 shadow-sm">
            {MARKETING_NAV_ITEMS.map(item => (
              <TabsTrigger key={item.id} value={item.id} style={tab === item.id ? { background: C.red, color: C.white } : undefined} className="h-9 gap-1.5 rounded-lg px-3 text-[11px] font-semibold data-[state=active]:shadow-sm">
                <Icon name={item.icon} size={13} color="currentColor" />{item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </nav>

      <div className="border-b border-border/70 pb-4"><h2 className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: FONT_DISPLAY }}>{activeMarketingSection.title}</h2><p className="mt-1 text-xs text-muted-foreground">{activeMarketingSection.description}</p></div>

      {/* ── DEMANDAS ── */}
      {tab === "demandas" && (
        <div>
          {requestNotice && (
            <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-800"><span className="flex items-center gap-2"><Icon name="check" size={14} color="#15803D" />{requestNotice}</span><Button variant="ghost" size="sm" onClick={() => setRequestNotice("")} aria-label="Fechar aviso" className="h-7 w-7 shrink-0 rounded-full p-0 text-emerald-800 hover:bg-emerald-100">×</Button></div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {[
              ["Recebidas", requestMetrics.recebidas, "#1D4ED8", "rgba(29,78,216,0.08)"],
              ["Em produção", requestMetrics.producao, "#0D9488", "rgba(13,148,136,0.08)"],
              ["Em aprovação", requestMetrics.aprovacao, "#B45309", "rgba(245,158,11,0.10)"],
              ["Entregues", requestMetrics.entregues, "#15803D", "rgba(34,197,94,0.09)"],
            ].map(([label, value, color, bg]) => (
                <Card key={label} className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className={mobile ? "p-3" : "p-4"}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                    <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: bg }}><div style={{ width: `${requestMetrics.recebidas ? Math.max(8, (value / requestMetrics.recebidas) * 100) : 0}%`, height: "100%", borderRadius: 3, background: color }} /></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
            <Card className="border-border/80 shadow-sm"><CardContent className="p-0"><form onSubmit={criarDemanda} className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50"><Icon name="plus" size={15} color={C.red} /></div><div><h3 className="text-sm font-bold text-foreground">Nova solicitação</h3><p className="text-[10px] text-muted-foreground">O andamento também aparecerá no Mural.</p></div></div>

              <div className="mt-5"><Label htmlFor="marketing-request-title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">O que você precisa?</Label><Input id="marketing-request-title" required value={requestForm.titulo} onChange={e => setRequestForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Ex.: Divulgação da próxima ação" className="mt-1.5 h-10 rounded-xl text-xs" /></div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div>
                  <Label htmlFor="marketing-request-sector" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Setor</Label>
                  <select id="marketing-request-sector" value={requestForm.setor} onChange={e => setRequestForm(prev => ({ ...prev, setor: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-2.5 text-[11px] outline-none focus:ring-2 focus:ring-ring">
                    {["Diretoria", "Operações", "Financeiro", "RH", "Jurídico", "Marketing"].map(setor => <option key={setor}>{setor}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="marketing-request-format" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Formato</Label>
                  <select id="marketing-request-format" value={requestForm.formato} onChange={e => setRequestForm(prev => ({ ...prev, formato: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-2.5 text-[11px] outline-none focus:ring-2 focus:ring-ring">
                    {["Post estático", "Carrossel", "Story", "Vídeo/Reels", "Campanha", "Outro"].map(formato => <option key={formato}>{formato}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div>
                  <Label htmlFor="marketing-request-priority" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prioridade</Label>
                  <select id="marketing-request-priority" value={requestForm.prioridade} onChange={e => setRequestForm(prev => ({ ...prev, prioridade: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-2.5 text-[11px] outline-none focus:ring-2 focus:ring-ring">
                    <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="marketing-request-deadline" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prazo</Label>
                  <Input id="marketing-request-deadline" required type="date" value={requestForm.prazo} onChange={e => setRequestForm(prev => ({ ...prev, prazo: e.target.value }))} className="mt-1.5 h-10 rounded-xl px-2.5 text-[11px]" />
                </div>
              </div>

              <div className="mt-3"><Label htmlFor="marketing-request-brief" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Briefing</Label><Textarea id="marketing-request-brief" value={requestForm.descricao} onChange={e => setRequestForm(prev => ({ ...prev, descricao: e.target.value }))} rows={4} placeholder="Objetivo, público, mensagem e referências..." className="mt-1.5 min-h-24 rounded-xl text-xs" /></div>

              <Button type="submit" className="mt-4 w-full rounded-xl bg-primary text-xs font-bold shadow-sm shadow-primary/20 hover:bg-primary/90">
                <Icon name="plus" size={14} color={C.white} /> Enviar pedido
              </Button>
            </form></CardContent></Card>

            <Card className="overflow-hidden border-border/80 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Fila de demandas</h3>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Do briefing recebido até a entrega final.</p>
                </div>
                <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-bold">{requests.length} pedidos</Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {requests.map((request, index) => {
                  const status = MARKETING_REQUEST_STATUS[request.status] || MARKETING_REQUEST_STATUS.brief_recebido;
                  const priority = request.prioridade === "alta" ? { color: "#B91C1C", bg: "#FEF2F2" } : request.prioridade === "baixa" ? { color: "#15803D", bg: "#F0FDF4" } : { color: "#B45309", bg: "#FFF7ED" };
                  return (
                    <article key={request.id} className={`px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5 ${index < requests.length - 1 ? "border-b border-border/70" : ""}`}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{request.titulo}</div>
                          <div style={{ fontSize: 11, color: C.textTertiary }}>{request.solicitante || request.setor} · {request.setor} · {request.formato || "Conteúdo"}</div>
                        </div>
                        <Badge variant="outline" className="shrink-0 rounded-full border-0 px-2 py-1 text-[10px] font-bold capitalize" style={{ color: priority.color, background: priority.bg }}>{request.prioridade}</Badge>
                      </div>
                      {request.descricao && <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5, margin: "10px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{request.descricao}</p>}
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Icon name="clock" size={12} color={C.textTertiary} />
                          <span style={{ fontSize: 11, color: C.textTertiary }}>Prazo: {marketingDateLabel(request.prazo)}</span>
                        </div>
                        <select aria-label={`Status de ${request.titulo}`} value={request.status} onChange={e => atualizarStatusDemanda(request.id, e.target.value)} style={{ border: `1px solid ${status.color}33`, background: status.bg, color: status.color, borderRadius: 20, padding: "6px 9px", fontSize: 10, fontWeight: 700, outline: "none", cursor: "pointer" }}>
                          {Object.entries(MARKETING_REQUEST_STATUS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
                        </select>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── ACERVO ── */}
      {tab === "acervo" && (
        <div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {["todos","foto","logo","arte"].map(f => (
              <Button key={f} variant={acervoFilter === f ? "default" : "outline"} size="sm" onClick={() => setAcervoFilter(f)} className="h-8 shrink-0 rounded-full px-4 text-[11px] capitalize shadow-none">{f}</Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {acervoFiltrado.map(f => (
              <Card key={f.id} className="group overflow-hidden border-border/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={f.url} alt={f.nome} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                </div>
                <CardContent className="p-3 sm:p-4">
                  <div className="truncate text-xs font-bold text-foreground sm:text-sm">{f.nome}</div>
                  <div className="mt-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <span className="truncate text-[9px] text-muted-foreground sm:text-[10px]">{f.acao} · {f.data}</span>
                    <Button variant="secondary" size="sm" onClick={() => iniciarMascaramento(f)} className="h-7 rounded-lg px-2.5 text-[9px]">Proteger</Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Drive link card */}
            <button className="flex min-h-40 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-card p-5 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-red-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Icon name="plus" size={18} color={C.textTertiary} />
              </div>
              <span className="text-center text-[11px] font-semibold">Abrir Google Drive</span>
            </button>
          </div>
        </div>
      )}

      {/* ── CALENDÁRIO ── */}
      {tab === "calendario" && (
        <div>
          {calendarNotice && (
            <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-800"><span className="flex items-center gap-2"><Icon name="check" size={14} color="#15803D" />{calendarNotice}</span><Button variant="ghost" size="sm" onClick={() => setCalendarNotice("")} aria-label="Fechar aviso" className="h-7 w-7 shrink-0 rounded-full p-0 text-emerald-800 hover:bg-emerald-100">×</Button></div>
          )}

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text, textTransform: "capitalize" }}>
                    {calendarCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>Calendário editorial da equipe</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Button variant="outline" size="sm" onClick={() => setCalendarCursor(new Date())} className="h-8 rounded-lg px-2.5 text-[10px]">Hoje</Button>
                  <Button variant="outline" size="sm" onClick={() => setCalendarCursor(new Date(calendarYear, calendarMonth - 1, 1))} aria-label="Mês anterior" className="h-8 w-8 rounded-lg p-0 text-base">‹</Button>
                  <Button variant="outline" size="sm" onClick={() => setCalendarCursor(new Date(calendarYear, calendarMonth + 1, 1))} aria-label="Próximo mês" className="h-8 w-8 rounded-lg p-0 text-base">›</Button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 720 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(day => (
                      <div key={day} style={{ padding: "9px 8px", textAlign: "center", fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: 0.5, textTransform: "uppercase" }}>{day}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                    {calendarCells.map((cell, index) => {
                      const isToday = cell?.key === marketingDateKey(new Date());
                      return (
                        <div key={cell?.key || `empty-${index}`} style={{ minHeight: 112, padding: 7, borderRight: (index + 1) % 7 === 0 ? "none" : `1px solid ${C.border}`, borderBottom: index >= calendarCellCount - 7 ? "none" : `1px solid ${C.border}`, background: cell ? C.surface : "#FAFAFA" }}>
                          {cell && (
                            <>
                              <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? C.white : C.textSecondary, background: isToday ? C.red : "transparent", marginBottom: 5 }}>{cell.day}</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                {cell.posts.slice(0, 2).map(post => (
                                  <div key={post.id} style={{ background: post.googleCalendarSent ? "#F0FDF4" : "#EFF6FF", borderLeft: `3px solid ${post.googleCalendarSent ? "#22C55E" : "#3B82F6"}`, borderRadius: 6, padding: "5px 6px" }}>
                                    <div style={{ fontSize: 9, color: C.textTertiary, marginBottom: 2 }}>{post.scheduledTime || "09:00"} · {post.canal}</div>
                                    <div title={post.acao} style={{ fontSize: 10, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.acao}</div>
                                    <button onClick={() => enviarGoogleAgenda(post)} style={{ background: "none", border: "none", padding: "3px 0 0", color: post.googleCalendarSent ? "#15803D" : "#1D4ED8", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                                      {post.googleCalendarSent ? "Enviado ao Agenda" : "Enviar ao Agenda"}
                                    </button>
                                  </div>
                                ))}
                                {cell.posts.length > 2 && <div style={{ fontSize: 9, color: C.textTertiary }}>+{cell.posts.length - 2} postagem(ns)</div>}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-border/80 shadow-sm"><CardContent className="p-0"><form onSubmit={agendarPost} className="p-4 sm:p-5">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="calendar" size={16} color={C.red} /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Agendar postagem</div>
              </div>
              <p style={{ fontSize: 11, color: C.textTertiary, lineHeight: 1.5, margin: "0 0 16px 43px" }}>Organize aqui e envie ao Google Agenda quando precisar.</p>

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", marginBottom: 5 }}>Título da postagem</label>
              <input required value={calendarForm.acao} onChange={e => setCalendarForm(prev => ({ ...prev, acao: e.target.value }))} placeholder="Ex.: Chamada para voluntários" style={{ width: "100%", boxSizing: "border-box", padding: "10px 11px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 12, color: C.text, outline: "none", marginBottom: 12 }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", marginBottom: 5 }}>Data</label>
                  <input required type="date" value={calendarForm.scheduledDate} onChange={e => setCalendarForm(prev => ({ ...prev, scheduledDate: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "9px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 11, color: C.text, background: C.surface, outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", marginBottom: 5 }}>Horário</label>
                  <input required type="time" value={calendarForm.scheduledTime} onChange={e => setCalendarForm(prev => ({ ...prev, scheduledTime: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "9px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 11, color: C.text, background: C.surface, outline: "none" }} />
                </div>
              </div>

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", margin: "12px 0 5px" }}>Canal</label>
              <select value={calendarForm.canal} onChange={e => setCalendarForm(prev => ({ ...prev, canal: e.target.value }))} style={{ width: "100%", padding: "10px 11px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 12, color: C.text, background: C.surface, outline: "none", marginBottom: 12 }}>
                {["Instagram", "Facebook", "WhatsApp", "LinkedIn", "Site", "E-mail"].map(canal => <option key={canal}>{canal}</option>)}
              </select>

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", marginBottom: 5 }}>Responsável</label>
              <input value={calendarForm.responsavel} onChange={e => setCalendarForm(prev => ({ ...prev, responsavel: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "10px 11px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 12, color: C.text, outline: "none", marginBottom: 12 }} />

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", marginBottom: 5 }}>Observação ou legenda</label>
              <textarea value={calendarForm.legenda} onChange={e => setCalendarForm(prev => ({ ...prev, legenda: e.target.value }))} rows={3} placeholder="Resumo do conteúdo..." style={{ width: "100%", boxSizing: "border-box", padding: "10px 11px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 12, color: C.text, outline: "none", resize: "vertical", fontFamily: "inherit" }} />

              <Button type="submit" className="mt-4 w-full rounded-xl text-xs font-bold shadow-sm shadow-primary/20">
                <Icon name="plus" size={14} color={C.white} /> Adicionar ao calendário
              </Button>
            </form></CardContent></Card>
          </div>
        </div>
      )}

      {/* ── IA ── */}
      {tab === "ia" && (
        <div className="max-w-2xl">
          <Card className="mb-4 border-border/80 shadow-sm"><CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50"><Icon name="heart" size={15} color={C.red} /></div><div><h3 className="text-sm font-bold text-foreground">Configurar geração</h3><p className="text-[10px] text-muted-foreground">Escolha o contexto e o tom antes de gerar.</p></div></div>

            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>Ação</label>
                <select value={acaoSelecionada} onChange={e => setAcaoSelecionada(e.target.value)} style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 10,
                  fontSize: 14, color: C.text, background: C.surface, outline: "none", appearance: "none",
                }}>
                  {["Café de Rua","Sopão da Noite","Ação de Saúde","Visita Orfanato","Lar de Idosos","Arrecadação"].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>Tom</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["emotivo","Emotivo"],["informativo","Informativo"],["convocacao","Convocação"]].map(([id, label]) => (
                    <button key={id} onClick={() => setTom(id)} style={{
                      flex: 1, padding: "10px 4px", borderRadius: 8, border: `1px solid ${tom === id ? C.red : C.border}`,
                      background: tom === id ? "#FEF2F2" : C.surface, color: tom === id ? C.red : C.textSecondary,
                      fontSize: 11, fontWeight: tom === id ? 600 : 400, cursor: "pointer",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={gerarLegenda} disabled={gerando} className="mt-5 w-full rounded-xl text-xs font-bold shadow-sm shadow-primary/20">
              {gerando ? (
                <><div style={{ width: 14, height: 14, border: `2px solid ${C.textTertiary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Gerando...</>
              ) : (
                <><Icon name="camera" size={15} color={C.white} /> Gerar com IA</>
              )}
            </Button>
          </CardContent></Card>

          {/* Output */}
          {(legenda || gerando) && (
            <Card className="border-border/80 shadow-sm"><CardContent className="p-5">
              <Label htmlFor="generated-caption" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legenda gerada</Label>
              <Textarea id="generated-caption"
                value={legenda}
                onChange={e => setLegenda(e.target.value)}
                rows={8}
                className="mt-2 min-h-48 rounded-xl text-sm leading-relaxed"
              />
              {gerado && (
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <Button variant="outline" onClick={gerarLegenda} className="flex-1 rounded-xl text-xs">Gerar outra</Button>
                  <Button onClick={salvarPost} className="flex-1 rounded-xl text-xs">Salvar rascunho</Button>
                </div>
              )}
            </CardContent></Card>
          )}
        </div>
      )}

      {/* ── POSTS ── */}
      {tab === "posts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map(p => (
            <Card key={p.id} className="border-border/80 shadow-sm"><CardContent className="p-4 sm:p-5">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{p.acao}</div>
                  <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 2 }}>{p.data}</div>
                </div>
                <Badge variant={p.status === "publicado" ? "secondary" : "outline"} className={`shrink-0 rounded-full text-[10px] font-bold capitalize ${p.status === "publicado" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : ""}`}>{p.status}</Badge>
              </div>
              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {p.legenda}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px]">Editar</Button>
                {p.status === "rascunho" && (
                  <Button size="sm" className="h-8 rounded-lg text-[10px]">Copiar para Instagram</Button>
                )}
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* ── PROTEÇÃO ── */}
      {tab === "protecao" && (
        <div style={{ maxWidth: 1040 }}>
          <Card className="mb-4 border-primary/15 bg-red-50/30 shadow-sm"><CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary"><Icon name="shield" size={17} color={C.white} /></div><div><h3 className="text-sm font-bold text-foreground">Processamento seguro no navegador</h3><p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">O MediaPipe detecta rostos localmente. A equipe revisa todas as máscaras antes de gerar uma nova versão.</p></div></div><Badge variant="secondary" className="shrink-0 rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-700 hover:bg-emerald-50"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />Modelo local · revisão humana</Badge></CardContent></Card>

          {protectionError && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 11, padding: "11px 13px", fontSize: 12, marginBottom: 14 }}>{protectionError}</div>}

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "310px minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
            <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); handleProtectionUpload(event.dataTransfer.files?.[0]); }} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.4, textTransform: "uppercase" }}>1. Escolha a imagem</div>
                <label htmlFor="protection-image-upload" style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.textSecondary, borderRadius: 8, padding: "7px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="upload" size={12} color={C.textSecondary} /> Selecionar do computador</label>
                <input id="protection-image-upload" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; handleProtectionUpload(file); }} style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
                {acervo.filter(f => f.tipo === "foto" && !f.protected).slice(0, 6).map(f => (
                  <button key={f.id} onClick={() => iniciarMascaramento(f)} title={f.nome} style={{ padding: 0, borderRadius: 9, overflow: "hidden", cursor: "pointer", border: fotoSelecionada?.id === f.id ? `2px solid ${C.red}` : "2px solid transparent", background: C.bg, aspectRatio: "1" }}>
                    <img src={f.url} alt={f.nome} crossOrigin={/^https?:/i.test(f.url) ? "anonymous" : undefined} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
              <div style={{ border: `1px dashed ${C.border}`, borderRadius: 9, padding: "9px 10px", margin: "-8px 0 16px", textAlign: "center", fontSize: 10, color: C.textTertiary }}>
                {mascarando ? "Processando a foto selecionada..." : fotoSelecionada?.acao === "Upload local" ? `Selecionada: ${fotoSelecionada.nome}` : "Ou arraste aqui uma imagem JPG, PNG ou WebP"}
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 9 }}>2. Escolha a proteção</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 16 }}>
                {[["blur","Desfoque"], ["aef","Elemento AEF"], ["silhouette","Silhueta"]].map(([id, label]) => (
                  <button key={id} onClick={() => { setMaskStyle(id); setReviewConfirmed(false); }} style={{ padding: "9px 5px", borderRadius: 8, border: `1px solid ${maskStyle === id ? C.red : C.border}`, background: maskStyle === id ? "#FEF2F2" : C.surface, color: maskStyle === id ? C.red : C.textSecondary, fontSize: 10, fontWeight: maskStyle === id ? 700 : 500, cursor: "pointer" }}>{label}</button>
                ))}
              </div>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 7 }}>
                Margem da máscara <span style={{ color: C.text, fontWeight: 700 }}>{maskPadding}%</span>
              </label>
              <input type="range" min="0" max="45" value={maskPadding} onChange={event => { setMaskPadding(Number(event.target.value)); setReviewConfirmed(false); }} style={{ width: "100%", accentColor: C.red, marginBottom: 18 }} />

              <div style={{ background: C.bg, borderRadius: 10, padding: "11px 12px", fontSize: 11, color: C.textSecondary, lineHeight: 1.5 }}>
                <b style={{ color: C.text }}>Correção manual:</b> arraste sobre qualquer rosto que o detector não encontrou. Remova máscaras incorretas na lista ao lado.
              </div>
            </div>

            <div ref={protectionEditorRef} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: mobile ? "14px" : "18px", scrollMarginTop: 16 }}>
              {!mascVisible ? (
                <div style={{ minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: C.textTertiary }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Icon name="shield" size={21} color={C.textTertiary} /></div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary }}>Selecione uma foto para começar</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>O original será preservado.</div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fotoSelecionada?.nome}</div>
                      <div style={{ fontSize: 10, color: C.textTertiary, marginTop: 2 }}>{manualDrawing ? "Solte para adicionar a máscara" : protectionNotice}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: faceBoxes.length ? "#15803D" : "#B45309", background: faceBoxes.length ? "#F0FDF4" : "#FFF7ED", borderRadius: 20, padding: "5px 8px", flexShrink: 0 }}>{faceBoxes.length} máscara(s)</span>
                  </div>

                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#111", lineHeight: 0 }}>
                    <canvas ref={protectionCanvasRef} onPointerDown={startManualMask} onPointerUp={finishManualMask} onPointerCancel={() => { manualStartRef.current = null; setManualDrawing(false); }} aria-label="Editor da imagem protegida" style={{ display: "block", width: "100%", maxHeight: 560, objectFit: "contain", cursor: mascarando ? "wait" : "crosshair", touchAction: "none" }} />
                    {mascarando && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.62)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <div style={{ width: 22, height: 22, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: C.white, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <span style={{ color: C.white, fontSize: 12, fontWeight: 600 }}>Processando no dispositivo...</span>
                      </div>
                    )}
                  </div>

                  {!mascarando && faceBoxes.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {faceBoxes.map((box, index) => (
                        <button key={box.id} onClick={() => { setFaceBoxes(prev => prev.filter(item => item.id !== box.id)); setReviewConfirmed(false); }} title="Remover esta máscara" style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.textSecondary, borderRadius: 20, padding: "5px 8px", fontSize: 10, cursor: "pointer" }}>
                          {box.manual ? "Manual" : `Rosto ${index + 1}`} · remover
                        </button>
                      ))}
                    </div>
                  )}

                  {!mascarando && (
                    <>
                      <label style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 11px", marginTop: 12, cursor: "pointer" }}>
                        <input type="checkbox" checked={reviewConfirmed} onChange={event => setReviewConfirmed(event.target.checked)} disabled={!faceBoxes.length} style={{ marginTop: 2, accentColor: C.red }} />
                        <span style={{ fontSize: 11, color: "#9A3412", lineHeight: 1.45 }}>Revisei a imagem inteira e confirmei que todos os rostos que precisam de proteção estão cobertos.</span>
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
                        <button onClick={() => processProtectionImage(fotoSelecionada)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px", fontSize: 11, fontWeight: 700, color: C.textSecondary, cursor: "pointer" }}>Detectar novamente</button>
                        <button onClick={baixarImagemProtegida} disabled={!reviewConfirmed || !faceBoxes.length} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px", fontSize: 11, fontWeight: 700, color: reviewConfirmed && faceBoxes.length ? C.text : C.textTertiary, cursor: reviewConfirmed && faceBoxes.length ? "pointer" : "not-allowed" }}>Baixar versão</button>
                        <button onClick={salvarImagemProtegida} disabled={!reviewConfirmed || !faceBoxes.length} style={{ background: reviewConfirmed && faceBoxes.length ? C.red : C.border, border: "none", borderRadius: 9, padding: "10px", fontSize: 11, fontWeight: 700, color: C.white, cursor: reviewConfirmed && faceBoxes.length ? "pointer" : "not-allowed" }}>Salvar no Acervo</button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
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

  return (
    <div style={{ padding: mobile ? "20px 16px 100px" : tight ? "28px 24px" : "32px 40px", fontFamily: FONT_BODY }}>
      <div style={{ display: "flex", alignItems: mobile ? "stretch" : "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap", flexDirection: mobile ? "column" : "row" }}>
        <div>
          <h1 style={{ fontSize: mobile ? 24 : 28, fontWeight: 700, color: C.text, letterSpacing: -0.5, margin: "0 0 4px", fontFamily: FONT_DISPLAY }}>Jurídico</h1>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>Repositório de documentos oficiais da ONG</p>
        </div>
        <button onClick={() => setShowUpload(true)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 18px",
          background: C.red, color: C.white, border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 6px 16px rgba(215,13,22,0.25)",
          width: mobile ? "100%" : "auto",
        }}>
          <Icon name="upload" size={16} color={C.white} strokeWidth={2} />
          Novo documento
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : tight ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: C.white, padding: "16px 18px", borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Total vigentes</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{docs.filter(d => d.vigente !== false).length}</div>
        </div>
        <div style={{ background: C.white, padding: "16px 18px", borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Vencidos</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: alertas.some(a => a.status.tipo === "vencido") ? C.red : C.text }}>
            {alertas.filter(a => a.status.tipo === "vencido").length}
          </div>
        </div>
        <div style={{ background: C.white, padding: "16px 18px", borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Vencendo (30d)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: alertas.some(a => a.status.tipo === "vencendo") ? "#B45309" : C.text }}>
            {alertas.filter(a => a.status.tipo === "vencendo").length}
          </div>
        </div>
        <div style={{ background: C.white, padding: "16px 18px", borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Certidões</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{docs.filter(d => d.categoria === "certidoes" && d.vigente !== false).length}</div>
        </div>
      </div>

      {/* Filtros + busca */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={16} color={C.textTertiary} />
          </div>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar documento..."
            style={{
              width: "100%", padding: "11px 14px 11px 38px",
              border: `1px solid ${C.border}`, borderRadius: 10,
              fontSize: 14, fontFamily: FONT_BODY, background: C.white,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[{ id: "todos", label: "Todos" }, ...JURIDICO_CATEGORIAS].map(cat => {
          const ativo = filtro === cat.id;
          return (
            <button key={cat.id} onClick={() => setFiltro(cat.id)} style={{
              padding: "7px 14px", borderRadius: 20,
              background: ativo ? C.text : C.white,
              color: ativo ? C.white : C.textSecondary,
              border: `1px solid ${ativo ? C.text : C.border}`,
              fontSize: 13, fontWeight: ativo ? 600 : 500,
              cursor: "pointer", fontFamily: FONT_BODY,
            }}>
              {cat.label}
            </button>
          );
        })}
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: C.textSecondary, cursor: "pointer", userSelect: "none" }}>
        <input type="checkbox" checked={mostrarHistorico} onChange={(e) => setMostrarHistorico(e.target.checked)} style={{ cursor: "pointer" }} />
        Mostrar versões históricas ({docs.filter(d => d.vigente === false).length})
      </label>

      {/* Lista de documentos */}
      <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {filtrados.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Icon name="file" size={24} color={C.textTertiary} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>Nenhum documento encontrado</div>
            <div style={{ fontSize: 13, color: C.textSecondary }}>Faça upload do primeiro documento para começar</div>
          </div>
        ) : filtrados.map((doc, idx) => {
          const status = statusValidade(doc.validade);
          const historico = doc.vigente === false;
          return (
          <div key={doc.id} style={{
            display: "flex", alignItems: (mobile || tight) ? "flex-start" : "center", gap: mobile ? 12 : 14,
            padding: mobile ? "14px 14px" : "16px 20px",
            borderTop: idx === 0 ? "none" : `1px solid ${C.borderLight}`,
            opacity: historico ? 0.62 : 1,
            flexWrap: (mobile || tight) ? "wrap" : "nowrap",
          }}>
            <div style={{ width: mobile ? 36 : 40, height: mobile ? 36 : 40, borderRadius: 10, background: "rgba(215,13,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="file" size={mobile ? 16 : 18} color={C.red} strokeWidth={1.8} />
            </div>
            <div style={{ flex: "1 1 0", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto", minWidth: 0 }}>{doc.nome}</span>
                {historico && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textSecondary, background: C.borderLight, padding: "2px 8px", borderRadius: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>Histórico</span>
                )}
                {status && !historico && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: status.cor, background: status.bg, padding: "2px 8px", borderRadius: 10 }}>{status.label}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.textTertiary, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span>{catLabel(doc.categoria)}</span>
                <span>•</span>
                <span>{doc.tamanho}</span>
                <span>•</span>
                <span>{doc.data}</span>
                {!mobile && <><span>•</span><span>{doc.responsavel}</span></>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginLeft: (mobile || tight) ? "auto" : 0, flexShrink: 0, flexBasis: (mobile || tight) ? "100%" : "auto", justifyContent: (mobile || tight) ? "flex-end" : "flex-start" }}>
              <button title="Editar" onClick={() => setEditing(doc)} style={{
                width: mobile ? 32 : 34, height: mobile ? 32 : 34, borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="settings" size={14} color={C.textSecondary} />
              </button>
              <button title="Visualizar" onClick={() => setViewing(doc)} style={{
                width: mobile ? 32 : 34, height: mobile ? 32 : 34, borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="eye" size={15} color={C.textSecondary} />
              </button>
              <button title="Baixar" onClick={() => baixarDoc(doc)} style={{
                width: mobile ? 32 : 34, height: mobile ? 32 : 34, borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="download" size={15} color={C.textSecondary} />
              </button>
              <button title="Remover" onClick={() => removerDoc(doc.id)} style={{
                width: mobile ? 32 : 34, height: mobile ? 32 : 34, borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="trash" size={15} color={C.red} />
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* Modal Upload */}
      {showUpload && (
        <div onClick={() => setShowUpload(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center",
          zIndex: 500, padding: mobile ? 0 : 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.white, borderRadius: mobile ? "16px 16px 0 0" : 16, padding: mobile ? 22 : 28,
            width: "100%", maxWidth: 460, fontFamily: FONT_BODY,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 6px", fontFamily: FONT_DISPLAY }}>Enviar documento</h2>
            <p style={{ color: C.textSecondary, fontSize: 13, margin: "0 0 20px" }}>Selecione um ou mais arquivos do seu computador</p>
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "32px 20px", border: `2px dashed ${C.border}`, borderRadius: 12,
              cursor: "pointer", background: C.bg, marginBottom: 20,
            }}>
              <Icon name="upload" size={28} color={C.textTertiary} />
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: C.text }}>Clique para escolher arquivos</div>
              <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 4 }}>PDF, DOC, JPG, PNG (até 8MB)</div>
              <input type="file" multiple onChange={(e) => handleFiles(e.target.files)} style={{ display: "none" }} />
            </label>
            {uploadError && (
              <div style={{ padding: "10px 12px", background: "rgba(215,13,22,0.08)", color: C.red, borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                {uploadError}
              </div>
            )}
            <button onClick={() => { setShowUpload(false); setUploadError(""); }} style={{
              width: "100%", padding: "11px", background: C.white, color: C.textSecondary,
              border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editing && (
        <div onClick={() => setEditing(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center",
          zIndex: 500, padding: mobile ? 0 : 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.white, borderRadius: mobile ? "16px 16px 0 0" : 16, padding: mobile ? 22 : 28,
            width: "100%", maxWidth: 460, fontFamily: FONT_BODY,
            maxHeight: mobile ? "92vh" : "none", overflowY: "auto",
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", fontFamily: FONT_DISPLAY }}>Editar documento</h2>
            <p style={{ color: C.textSecondary, fontSize: 13, margin: "0 0 20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{editing.nome}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Categoria</label>
                <select
                  value={editing.categoria}
                  onChange={(e) => setEditing({ ...editing, categoria: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: FONT_BODY, background: C.white, color: C.text, cursor: "pointer" }}
                >
                  {JURIDICO_CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Validade (opcional)</label>
                <input
                  type="date"
                  value={editing.validade || ""}
                  onChange={(e) => setEditing({ ...editing, validade: e.target.value || null })}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: FONT_BODY, background: C.white, color: C.text, boxSizing: "border-box" }}
                />
                {editing.validade && (() => {
                  const s = statusValidade(editing.validade);
                  return s ? <div style={{ fontSize: 12, marginTop: 6, color: s.cor, fontWeight: 600 }}>{s.label} ({formatDataBR(editing.validade)})</div> : null;
                })()}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Responsável</label>
                <input
                  type="text"
                  value={editing.responsavel || ""}
                  onChange={(e) => setEditing({ ...editing, responsavel: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: FONT_BODY, background: C.white, color: C.text, boxSizing: "border-box" }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 14px", background: C.bg, borderRadius: 10 }}>
                <input
                  type="checkbox"
                  checked={editing.vigente !== false}
                  onChange={(e) => setEditing({ ...editing, vigente: e.target.checked })}
                  style={{ marginTop: 3, cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Documento vigente</div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Desmarque se for uma versão antiga (Estatuto v1, ata revogada, etc.)</div>
                </div>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setEditing(null)} style={{
                flex: 1, padding: "11px", background: C.white, color: C.textSecondary,
                border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Cancelar</button>
              <button onClick={() => {
                setDocs(prev => prev.map(d => d.id === editing.id ? editing : d));
                setEditing(null);
              }} style={{
                flex: 1, padding: "11px", background: C.red, color: C.white,
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar */}
      {viewing && (
        <div onClick={() => setViewing(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 500, padding: mobile ? 12 : 30,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.white, borderRadius: 14, width: "100%",
            maxWidth: 960, height: mobile ? "94vh" : "90vh", display: "flex", flexDirection: "column",
            overflow: "hidden", fontFamily: FONT_BODY,
          }}>
            <div style={{ padding: mobile ? "12px 14px" : "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: mobile ? 8 : 12 }}>
              <div style={{ width: mobile ? 32 : 36, height: mobile ? 32 : 36, borderRadius: 9, background: "rgba(215,13,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="file" size={mobile ? 14 : 16} color={C.red} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: mobile ? 13 : 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{viewing.nome}</div>
                <div style={{ fontSize: 11, color: C.textTertiary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{catLabel(viewing.categoria)} • {viewing.tamanho} • {viewing.data}</div>
              </div>
              <button title="Baixar" onClick={() => baixarDoc(viewing)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: mobile ? "8px 10px" : "8px 14px",
                background: C.red, color: C.white, border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0,
              }}>
                <Icon name="download" size={14} color={C.white} strokeWidth={2} />
                {!mobile && "Baixar"}
              </button>
              <button title="Fechar" onClick={() => setViewing(null)} style={{
                padding: mobile ? "8px 10px" : "8px 14px", background: C.white, color: C.textSecondary,
                border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0,
              }}>{mobile ? "✕" : "Fechar"}</button>
            </div>
            <div style={{ flex: 1, background: "#2A2A2E", overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!viewing.conteudo ? (
                <div style={{ textAlign: "center", color: C.white, padding: 40 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Icon name="file" size={24} color="rgba(255,255,255,0.5)" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Sem visualização disponível</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Este é um documento de exemplo sem arquivo anexado.</div>
                </div>
              ) : viewing.tipo?.startsWith("image/") ? (
                <img src={viewing.conteudo} alt={viewing.nome} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : viewing.tipo === "application/pdf" ? (
                <iframe src={viewing.conteudo} title={viewing.nome} style={{ width: "100%", height: "100%", border: "none", background: C.white }} />
              ) : viewing.tipo?.startsWith("text/") || viewing.tipo?.includes("json") ? (
                <iframe src={viewing.conteudo} title={viewing.nome} style={{ width: "100%", height: "100%", border: "none", background: C.white }} />
              ) : (
                <div style={{ textAlign: "center", color: C.white, padding: 40 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Icon name="file" size={24} color="rgba(255,255,255,0.5)" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Pré-visualização não suportada</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>Tipo: {viewing.tipo || "desconhecido"}. Use o botão Baixar para abrir no seu computador.</div>
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
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 300, backdropFilter: "blur(3px)",
      }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 340, background: C.surface, zIndex: 301,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        fontFamily: FONT_BODY, overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ background: C.black, padding: "32px 24px 24px", position: "relative" }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: 8, width: 32, height: 32, cursor: "pointer",
            color: "rgba(255,255,255,0.5)", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>

          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: C.red, display: "flex", alignItems: "center",
            justifyContent: "center", color: C.white, fontWeight: 700,
            fontSize: 26, fontFamily: FONT_DISPLAY, marginBottom: 16,
            border: "3px solid rgba(255,255,255,0.1)",
          }}>{user.initials}</div>

          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: C.white, letterSpacing: 0.5, marginBottom: 6 }}>
            {user.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              background: C.red, color: C.white,
              fontSize: 11, fontWeight: 600, padding: "3px 10px",
              borderRadius: 20, letterSpacing: 0.5,
            }}>{user.profileLabel}</span>
            <span style={{
              background: "rgba(255,255,255,0.12)", color: C.white,
              fontSize: 11, fontWeight: 600, padding: "3px 10px",
              borderRadius: 20, letterSpacing: 0.5,
            }}>{user.department}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>· Amor em Foco</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.border, borderBottom: `1px solid ${C.border}` }}>
          {profileStats.map((s, i) => (
            <div key={i} style={{ background: C.surface, padding: "16px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -1, fontFamily: FONT_DISPLAY }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info / Edit */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textTertiary, letterSpacing: 1.5, textTransform: "uppercase" }}>Informações</div>
            {!editing && (
              <button onClick={() => setEditing(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: C.red, fontWeight: 600, fontFamily: FONT_BODY,
              }}>Editar</button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>

            {/* Nome — não editável */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, background: C.surface }}>
              <span style={{ fontSize: 12, color: C.textTertiary }}>Nome completo</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{user.name}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, background: C.surface }}>
              <span style={{ fontSize: 12, color: C.textTertiary }}>Perfil de acesso</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{user.profileLabel}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, background: C.surface }}>
              <span style={{ fontSize: 12, color: C.textTertiary }}>Cargo</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{user.position}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, background: C.surface }}>
              <span style={{ fontSize: 12, color: C.textTertiary }}>Area principal</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{user.department}</span>
            </div>

            {[
              { key: "email", label: "E-mail" },
              { key: "telefone", label: "Telefone" },
              { key: "cidade", label: "Cidade" },
            ].map((f, i, arr) => (
              <div key={f.key} style={{ padding: "12px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${C.borderLight}` : "none", background: editing ? "#FFF8F8" : C.surface }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editing ? 8 : 0 }}>
                  <span style={{ fontSize: 12, color: C.textTertiary }}>{f.label}</span>
                  {!editing && <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{form[f.key]}</span>}
                </div>
                {editing && (
                  <input
                    value={draft[f.key]}
                    onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textTertiary, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Modulos liberados</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {user.allowedModules.map(moduleId => (
                <span key={moduleId} style={{
                  padding: "7px 10px", borderRadius: 999,
                  background: "#FFF1F2", color: C.red, border: "1px solid rgba(215,13,22,0.12)",
                  fontSize: 12, fontWeight: 600,
                }}>
                  {getModuleLabel(moduleId)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div style={{ padding: "0 24px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
          {editing ? (
            <>
              <button onClick={handleSave} style={{
                width: "100%", padding: "12px", background: C.red,
                border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: C.white, cursor: "pointer",
              }}>Salvar alterações</button>
              <button onClick={handleCancel} style={{
                width: "100%", padding: "12px", background: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: C.textSecondary, cursor: "pointer",
              }}>Cancelar</button>
            </>
          ) : (
            <button onClick={onLogout} style={{
              width: "100%", padding: "12px", background: "rgba(215,13,22,0.07)",
              border: `1px solid rgba(215,13,22,0.2)`, borderRadius: 10,
              fontSize: 14, fontWeight: 600, color: C.red, cursor: "pointer",
            }}>Sair da conta</button>
          )}
        </div>
      </div>
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
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      {showProfile && <Profile user={user} onClose={() => setShowProfile(false)} onLogout={handleLogout} onUpdateUser={handleUserUpdate} />}
      {!mobile && <Sidebar active={active} setActive={handleSetActive} user={user} onOpenProfile={() => setShowProfile(true)} navItems={allowedNavItems} />}
      <main style={{
        marginLeft: mobile ? 0 : 240, flex: 1,
        padding: mobile ? "20px 16px 100px" : "40px 44px",
        maxWidth: mobile ? "100%" : "calc(100vw - 240px)",
        boxSizing: "border-box", overflowX: "hidden",
        fontFamily: FONT_BODY,
      }}>
        {/* Mobile top bar */}
        {mobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, flexShrink: 0 }}>
                <img src="/logo-vermelha.png" alt="Amor em Foco" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: 0.5, fontFamily: FONT_DISPLAY }}>AEF Hub</div>
                <div style={{ fontSize: 10, color: C.textTertiary, letterSpacing: 1.1, textTransform: "uppercase" }}>{user.profileLabel}</div>
              </div>
            </div>
            <div onClick={() => setShowProfile(true)} style={{ width: 32, height: 32, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{user.initials}</div>
          </div>
        )}
        <AccessNotice message={accessNotice} />
        {renderModule()}
      </main>
      {mobile && <BottomNav active={active} setActive={handleSetActive} navItems={allowedNavItems} />}
    </div>
  );
}
