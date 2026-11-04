import { useState } from "react";
import { ACCESS_PROFILES, buildUserSession, normalizeEmail } from "@/lib/access";
import "../login.css";

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export function Login({ onLogin, usersDirectory }) {
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
