import { createContext, useContext, useEffect, useState } from "react";
import { volunteers as demoVolunteers } from "@/data/rh";
import { listVoluntarios } from "@/data/voluntarios";

const VoluntariosContext = createContext(demoVolunteers);

// Loads the real volunteers once after sign-in; in demo mode the screens keep the sample list.
export function VoluntariosProvider({ enabled, children }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    listVoluntarios()
      .then(rows => { if (alive) setList(rows); })
      .catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, [enabled]);

  return (
    <VoluntariosContext.Provider value={enabled ? list : demoVolunteers}>
      {children}
    </VoluntariosContext.Provider>
  );
}

export function useVoluntarios() {
  return useContext(VoluntariosContext);
}
