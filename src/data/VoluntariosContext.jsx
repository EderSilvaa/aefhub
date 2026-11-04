import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { volunteers as demoVolunteers } from "@/data/rh";
import { listVoluntarios, signedFotoUrls } from "@/data/voluntarios";
import { listOcorrencias, listResumoVoluntarios, registroNegativo, volId } from "@/data/acoes";

const VoluntariosContext = createContext(demoVolunteers);
const VoluntariosActionsContext = createContext(null);
const ResumoRefreshContext = createContext(() => {});

// Action history on top of each volunteer: done, absences and the last action.
function comResumo(person, resumo, registros) {
  const reg = registros[volId(person)] || { negativos12m: 0, destaques: 0 };
  const r = resumo[volId(person)];
  if (!r) return person.id || reg.negativos12m || reg.destaques ? { ...person, faltas: 0, faltas12m: 0, ultimaAcao: "", ultimaAcaoData: "", ...reg } : person;
  return { ...person, actions: r.acoesFeitas, faltas: r.faltas, faltas12m: r.faltas12m, ultimaAcao: r.ultimaAcao, ultimaAcaoData: r.ultimaAcaoData, ...reg };
}

// Notes about volunteers (RH sees all; others only what they wrote): negatives in the last 12 months and highlights.
function contarRegistros(lista) {
  const limite = Date.now() - 365 * 86400000;
  return lista.reduce((acc, o) => {
    const r = acc[o.voluntarioId] || (acc[o.voluntarioId] = { negativos12m: 0, destaques: 0 });
    if (o.tipo === "destaque") r.destaques += 1;
    else if (registroNegativo(o.tipo) && new Date(o.criadoEm).getTime() >= limite) r.negativos12m += 1;
    return acc;
  }, {});
}

// Loads the real volunteers once after sign-in; in demo mode the screens keep the sample list (read-only).
export function VoluntariosProvider({ enabled, children }) {
  const [list, setList] = useState([]);
  const [fotoUrls, setFotoUrls] = useState({});
  const requested = useRef(new Set());
  const [resumo, setResumo] = useState({});
  const [registros, setRegistros] = useState({});

  const refreshResumo = useCallback(() => {
    listResumoVoluntarios().then(setResumo).catch(() => {});
    listOcorrencias().then(lista => setRegistros(contarRegistros(lista))).catch(() => {});
  }, []);
  useEffect(() => { refreshResumo(); }, [refreshResumo, enabled]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    listVoluntarios()
      .then(rows => { if (alive) setList(rows); })
      .catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, [enabled]);

  // after a save, swap the volunteer in place so every screen sees the change
  const replace = useCallback(updated => {
    setList(prev => prev.map(item => (item.id === updated.id ? updated : item)));
  }, []);

  // fetch signed links only for photos on screen, once each
  const requestFotos = useCallback(paths => {
    const missing = paths.filter(path => path && !requested.current.has(path));
    if (!missing.length) return;
    missing.forEach(path => requested.current.add(path));
    signedFotoUrls(missing)
      .then(urls => setFotoUrls(prev => ({ ...prev, ...urls })))
      .catch(() => missing.forEach(path => requested.current.delete(path)));
  }, []);

  const actions = useMemo(() => (enabled ? { replace, requestFotos, fotoUrls } : null), [enabled, replace, requestFotos, fotoUrls]);

  const base = enabled ? list : demoVolunteers;
  const value = useMemo(() => base.map(person => comResumo(person, resumo, registros)), [base, resumo, registros]);

  return (
    <VoluntariosContext.Provider value={value}>
      <VoluntariosActionsContext.Provider value={actions}>
        <ResumoRefreshContext.Provider value={refreshResumo}>
          {children}
        </ResumoRefreshContext.Provider>
      </VoluntariosActionsContext.Provider>
    </VoluntariosContext.Provider>
  );
}

export function useVoluntarios() {
  return useContext(VoluntariosContext);
}

// null in demo mode: the screens show the volunteer but cannot save
export function useVoluntariosActions() {
  return useContext(VoluntariosActionsContext);
}

// call after finishing an action so lists and fichas show the new history
export function useRefreshResumo() {
  return useContext(ResumoRefreshContext);
}
