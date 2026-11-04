import { Icon } from "@/components/Icon";
import "../nav.css";

export function Sidebar({ active, setActive, user, onOpenProfile, navItems }) {
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
export function BottomNav({ active, setActive, navItems }) {
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

export function AccessNotice({ message }) {
  if (!message) return null;
  return (
    <p className="aef-notice" role="status">
      {message}
    </p>
  );
}
