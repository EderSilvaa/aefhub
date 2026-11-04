import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { volunteers as demoVolunteers } from "@/data/rh";
import { listVoluntarios, signedFotoUrls } from "@/data/voluntarios";

const VoluntariosContext = createContext(demoVolunteers);
const VoluntariosActionsContext = createContext(null);

// Loads the real volunteers once after sign-in; in demo mode the screens keep the sample list (read-only).
export function VoluntariosProvider({ enabled, children }) {
  const [list, setList] = useState([]);
  const [fotoUrls, setFotoUrls] = useState({});
  const requested = useRef(new Set());

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

  return (
    <VoluntariosContext.Provider value={enabled ? list : demoVolunteers}>
      <VoluntariosActionsContext.Provider value={actions}>
        {children}
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
