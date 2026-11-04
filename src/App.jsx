import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/Icon";
import { AccessNotice, BottomNav, Sidebar } from "@/components/Navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { buildManagedUser, buildUserSession, canAccessModule, clearUserDirectory, clearUserSession, getAllowedNavItems, getDefaultModule, getModuleLabel, getSeedUsers, normalizeEmail, persistUserDirectory, persistUserSession, restoreUserDirectory, restoreUserSession } from "@/lib/access";
import { googleAuthEnabled, loadMember, NOT_ALLOWED_MESSAGE, signInWithGoogle, signOutGoogle, takeAuthErrorFromUrl } from "@/lib/googleAuth";
import { supabase } from "@/lib/supabase";
import { C, FONT_DISPLAY } from "@/lib/theme";
import { Dashboard } from "@/modules/Dashboard";
import { Financeiro } from "@/modules/Financeiro";
import Juridico from "@/modules/Juridico";
import { Login } from "@/modules/Login";
import { Marketing } from "@/modules/Marketing";
import { Operacoes } from "@/modules/Operacoes";
import { Profile } from "@/modules/Profile";
import { RH } from "@/modules/RH";

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

// A ONG não tem depósito: cada coisa fica com alguém. O inventário responde "com quem está".
// Patrimônio = unidade com código (GAR-03), circula e volta. Consumível = material da ONG por quantidade, divisível entre pessoas.
// Doação = lote que chegou (simples ou misto, ex. cesta), tem saldo e validade, e sai para ações, famílias ou repasse.
// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [usersDirectory, setUsersDirectory] = useState(() => restoreUserDirectory());
  const [user, setUser] = useState(() => (googleAuthEnabled ? null : restoreUserSession()));
  const [authReady, setAuthReady] = useState(!googleAuthEnabled);
  const [loginError, setLoginError] = useState("");
  const [active, setActive] = useState("dashboard");
  const [showProfile, setShowProfile] = useState(false);
  const [accessNotice, setAccessNotice] = useState("");
  const mobile = useIsMobile();

  useEffect(() => {
    persistUserDirectory(usersDirectory);
  }, [usersDirectory]);

  useEffect(() => {
    if (googleAuthEnabled) return;
    persistUserSession(user);
  }, [user]);

  // Google sign-in: the Supabase session decides who is logged in, the membros table decides what they see.
  useEffect(() => {
    if (!googleAuthEnabled) return;
    const urlError = takeAuthErrorFromUrl();
    if (urlError) setLoginError(urlError);
    let alive = true;
    const apply = async session => {
      if (!session) {
        if (alive) { setUser(null); setAuthReady(true); }
        return;
      }
      try {
        const member = await loadMember(session);
        if (!alive) return;
        if (!member) {
          setLoginError(NOT_ALLOWED_MESSAGE);
          setUser(null);
          await signOutGoogle();
        } else {
          setLoginError("");
          setUser(member);
        }
      } catch {
        if (alive) setLoginError("Não foi possível carregar seu acesso. Tente de novo.");
      }
      if (alive) setAuthReady(true);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // run outside the auth callback, as Supabase recommends for follow-up queries
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(() => apply(session), 0);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

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
    if (!user || googleAuthEnabled) return;
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

  const handleGoogleLogin = async () => {
    setLoginError("");
    const { error } = await signInWithGoogle();
    if (error) setLoginError("Não foi possível abrir o login do Google. Tente de novo.");
  };

  const handleLogout = () => {
    if (googleAuthEnabled) signOutGoogle();
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

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        usersDirectory={usersDirectory}
        mode={googleAuthEnabled ? (authReady ? "google" : "loading") : "demo"}
        onGoogle={handleGoogleLogin}
        error={loginError}
      />
    );
  }

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
