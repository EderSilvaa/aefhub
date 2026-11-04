
export const SESSION_STORAGE_KEY = "aef_session_v1";
export const USERS_STORAGE_KEY = "aef_users_v1";
export const MODULE_IDS = ["dashboard", "rh", "operacoes", "financeiro", "marketing", "juridico"];

export const ACCESS_PROFILES = {
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

export const DEMO_USERS = [
  { id: 1, name: "Eder Silva", email: "eder@amoremfoco.org", password: "amor123", profileId: "super_admin", position: "Administrador da Plataforma", city: "Belem, PA", phone: "(91) 9 9999-9999" },
  { id: 2, name: "Camila Rocha", email: "camila.financeiro@amoremfoco.org", password: "amor123", profileId: "financeiro", position: "Coordenadora Financeira", city: "Belem, PA", phone: "(91) 9 8811-2244" },
  { id: 3, name: "Matheus Lima", email: "matheus.rh@amoremfoco.org", password: "amor123", profileId: "rh", position: "Analista de RH", city: "Ananindeua, PA", phone: "(91) 9 8822-3344" },
  { id: 4, name: "Flavia Moraes", email: "flavia.operacoes@amoremfoco.org", password: "amor123", profileId: "operacoes", position: "Coordenadora de Operacoes", city: "Belem, PA", phone: "(91) 9 8833-4455" },
  { id: 5, name: "Duda Martins", email: "duda.marketing@amoremfoco.org", password: "amor123", profileId: "marketing", position: "Coordenadora de Marketing", city: "Belem, PA", phone: "(91) 9 8844-5566" },
  { id: 6, name: "Alan Carvalho", email: "alan.juridico@amoremfoco.org", password: "amor123", profileId: "juridico", position: "Consultor Juridico", city: "Belem, PA", phone: "(91) 9 8855-6677" },
  { id: 7, name: "Rebeca Souza", email: "rebeca.diretoria@amoremfoco.org", password: "amor123", profileId: "diretoria", position: "Diretora Executiva", city: "Belem, PA", phone: "(91) 9 8866-7788" },
];

export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("");
}

export function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

export function sanitizeAllowedModules(modules, fallbackModules = []) {
  const source = Array.isArray(modules) && modules.length ? modules : fallbackModules;
  return [...new Set(source.filter(moduleId => MODULE_IDS.includes(moduleId)))];
}

export function buildManagedUser(account) {
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

export function buildUserSession(account) {
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

export function getSeedUsers() {
  return DEMO_USERS.map(buildManagedUser);
}

export function restoreUserDirectory() {
  if (typeof window === "undefined") return getSeedUsers();
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "null");
    if (!Array.isArray(stored) || stored.length === 0) return getSeedUsers();
    return stored.map(buildManagedUser);
  } catch {
    return getSeedUsers();
  }
}

export function persistUserDirectory(users) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function clearUserDirectory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USERS_STORAGE_KEY);
}

export function restoreUserSession() {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
    if (!stored?.profileId || !stored?.email || !stored?.name) return null;
    return buildUserSession(stored);
  } catch {
    return null;
  }
}

export function persistUserSession(user) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

export function clearUserSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { id: "dashboard", icon: "home", label: "Dashboard" },
  { id: "rh", icon: "users", label: "RH" },
  { id: "operacoes", icon: "settings", label: "Operações" },
  { id: "financeiro", icon: "dollar", label: "Financeiro" },
  { id: "marketing", icon: "camera", label: "Marketing" },
  { id: "juridico", icon: "shield", label: "Jurídico" },
];

export function getModuleLabel(moduleId) {
  return NAV_ITEMS.find(item => item.id === moduleId)?.label || moduleId;
}

export function canAccessModule(user, moduleId) {
  return !!user?.allowedModules?.includes(moduleId);
}

export function getAllowedNavItems(user) {
  return NAV_ITEMS.filter(item => canAccessModule(user, item.id));
}

export function getDefaultModule(user) {
  const allowed = getAllowedNavItems(user);
  if (canAccessModule(user, "dashboard")) return "dashboard";
  return allowed[0]?.id || "dashboard";
}
