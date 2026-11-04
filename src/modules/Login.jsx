import { useState } from "react";
import { ACCESS_PROFILES, buildUserSession, normalizeEmail } from "@/lib/access";
import "../login.css";

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// The "G" mark, in Google's own colours as their sign-in branding asks.
function GoogleMark() {
  return (
    <svg className="aef-login__google-mark" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false">
      <path className="aef-login__g-red" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path className="aef-login__g-blue" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path className="aef-login__g-yellow" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path className="aef-login__g-green" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function Login({ onLogin, usersDirectory, mode = "demo", onGoogle, error = "" }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [redirecting, setRedirecting] = useState(false);
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
          {mode === "loading" ? (
            <header role="status" aria-live="polite">
              <h1 className="aef-login__title">Entrando…</h1>
              <p className="aef-login__sub">Conferindo seu acesso ao AEF Hub.</p>
            </header>
          ) : (
            <header>
              <h1 className="aef-login__title">Entrar na plataforma</h1>
              <p className="aef-login__sub">Acesso restrito por perfil, área e permissão.</p>
            </header>
          )}

          {mode === "loading" ? null : mode !== "demo" ? (
            <div className="aef-login__fields">
              {error && (
                <p id="aef-login-erro" className="aef-login__error" role="alert">{error}</p>
              )}
              <button
                type="button"
                className="aef-login__google"
                disabled={mode === "loading" || redirecting}
                aria-busy={mode === "loading" || redirecting}
                onClick={() => { setRedirecting(true); onGoogle(); }}
              >
                <GoogleMark />
                {mode === "loading" ? "Verificando acesso…" : redirecting ? "Abrindo o Google…" : "Entrar com Google"}
              </button>
            </div>
          ) : (
          <>
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
          </>
          )}

          <p className="aef-login__help">
            Problemas de acesso? Fale com o Super Admin ou ajuste o perfil do usuário.
          </p>
        </div>
      </main>
    </div>
  );
}
