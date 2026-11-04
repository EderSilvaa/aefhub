import { supabase } from "@/lib/supabase";
import { buildUserSession } from "@/lib/access";

// With Supabase configured the app signs in with Google only; without it, it falls back to the demo login.
export const googleAuthEnabled = !!supabase;

export const NOT_ALLOWED_MESSAGE = "Este e-mail Google não está liberado no AEF Hub. Peça acesso ao Super Admin.";

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
}

export function signOutGoogle() {
  return supabase.auth.signOut();
}

// After a refused sign-in Supabase sends the error back on the redirect URL; read it once and clean the URL.
export function takeAuthErrorFromUrl() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const description = query.get("error_description") || hash.get("error_description");
  const hasError = description || query.get("error") || hash.get("error");
  if (!hasError) return "";
  window.history.replaceState(null, "", window.location.pathname);
  // the database trigger that blocks e-mails outside the list surfaces as "Database error saving new user"
  if (/saving new user|não liberado/i.test(description || "")) return NOT_ALLOWED_MESSAGE;
  return "Não foi possível entrar com o Google. Tente de novo.";
}

// The signed-in Google account becomes an app user only if its e-mail is an active member.
export async function loadMember(session) {
  const email = (session.user.email || "").toLowerCase();
  const { data, error } = await supabase.from("membros").select("*").eq("email", email).maybeSingle();
  if (error) throw error;
  if (!data || !data.ativo) return null;
  return buildUserSession({
    id: data.id,
    name: data.nome || session.user.user_metadata?.full_name || email,
    email: data.email,
    profileId: data.perfil,
    position: data.cargo || "",
    department: data.area || "",
    phone: data.telefone || "",
    city: data.cidade || "",
    active: data.ativo,
    allowedModules: data.modulos,
  });
}
