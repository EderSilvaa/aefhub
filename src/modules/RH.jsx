import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { marketingDateKey, marketingDateLabel } from "@/data/marketing";
import { RH_ATTENDANCE_SEED, RH_FEEDBACK_SEED, RH_OCCURRENCES_SEED, RH_PARTNERS, RH_STORAGE_KEYS, readRHStore, volunteers } from "@/data/rh";
import { ACCESS_PROFILES } from "@/lib/access";
import { Acessos } from "@/modules/Acessos";
import "../rh.css";

export const RH_AREA_TONE = { "Saúde": "red", "Jurídico": "blue", "Operações": "green", "Logística": "orange", "Alimentação": "purple" };
export const rhTone = area => RH_AREA_TONE[area] || "red";

export function RHPersonRow({ person }) {
  const status = person.penalizado
    ? { label: "Requer atenção", tone: "red" }
    : person.novato
      ? { label: "Novo cadastro", tone: "blue" }
      : person.verified
        ? { label: "Verificado", tone: "green" }
        : { label: "Cadastro pendente", tone: "neutral" };
  return (
    <li className="aef-rh__row">
      <div className="min-w-0">
        <div className="aef-rh__row-name">{person.name}</div>
        <div className="aef-rh__row-sub">{person.formation}</div>
      </div>
      <span className="aef-rh__status" data-tone={status.tone}>{status.label}</span>
      <span className="aef-rh__sector" data-tone={rhTone(person.area)}>{person.area}</span>
      <span className="aef-rh__row-cell">{person.telefone}</span>
      <span className="aef-rh__row-count"><strong>{person.actions}</strong><span>ações</span></span>
      {person.penalizado && person.motivoPenalidade && <p className="aef-rh__row-alert">{person.motivoPenalidade}</p>}
    </li>
  );
}

export function RHPartnerRow({ partner }) {
  const statusCfg = {
    recorrente: { label: "Parceiro recorrente", tone: "green" },
    ativo: { label: "Parceria ativa", tone: "blue" },
    historico: { label: "Histórico", tone: "neutral" },
  }[partner.status];
  return (
    <li className="aef-rh__row">
      <div className="min-w-0">
        <div className="aef-rh__row-name">{partner.name}</div>
        <div className="aef-rh__row-sub">{partner.contribution}</div>
      </div>
      <div className="min-w-0">
        <div className="aef-rh__status" data-tone={statusCfg.tone}>{statusCfg.label}</div>
        <div className="aef-rh__row-sub">desde {partner.since}</div>
      </div>
      <span className="aef-rh__sector" data-tone={rhTone(partner.segment)}>{partner.segment}</span>
      <div className="min-w-0">
        <div className="aef-rh__row-cell">{partner.contact}</div>
        <div className="aef-rh__row-sub">{partner.phone}</div>
      </div>
      <span className="aef-rh__row-count"><strong>{partner.partnerships}</strong><span>parcerias</span></span>
      <p className="aef-rh__row-extra">Última ação: {partner.lastAction}</p>
    </li>
  );
}

export function RHMemberRow({ member }) {
  const profile = ACCESS_PROFILES[member.profileId] || ACCESS_PROFILES.marketing;
  const moduleCount = member.allowedModules?.length || 0;
  return (
    <li className="aef-rh__row">
      <div className="min-w-0">
        <div className="aef-rh__row-name">{member.name}</div>
        <div className="aef-rh__row-sub">{member.position || profile.label}</div>
      </div>
      <div className="min-w-0">
        <div className="aef-rh__status" data-tone="red">{profile.label}</div>
        <div className="aef-rh__status" data-tone={member.active ? "green" : "neutral"}>{member.active ? "Acesso ativo" : "Acesso inativo"}</div>
      </div>
      <span className="aef-rh__row-cell">{member.department || profile.department}</span>
      <span className="aef-rh__row-cell">{member.email}</span>
      <span className="aef-rh__row-count"><strong>{moduleCount}</strong><span>{moduleCount === 1 ? "área liberada" : "áreas liberadas"}</span></span>
    </li>
  );
}

export function RHNetwork({ mobile, members = [] }) {
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
  const totalPartnerships = RH_PARTNERS.reduce((sum, partner) => sum + partner.partnerships, 0);
  const entityTypes = [["todos", "Todos"], ["pessoas", "Pessoas"], ["empresas", "Empresas"], ["membros", "Membros"]];

  return (
    <div>
      <div className="aef-rh__head">
        <div>
          <h1 className="aef-rh__title">Rede Amor em Foco</h1>
          <p className="aef-rh__desc">Voluntários, membros, empresas e instituições que constroem a história da organização.</p>
        </div>
        <button type="button" aria-label="Novo cadastro" className="aef-rh__btn aef-rh__btn--primary"><span aria-hidden="true"><Icon name="plus" size={15} /></span>{!mobile && "Novo cadastro"}</button>
      </div>

      <ul className="aef-rh__figures aef-rh__figures--4">
        {[
          ["Pessoas", volunteers.length],
          ["Empresas e parceiros", RH_PARTNERS.length],
          ["Membros da organização", members.length],
          ["Parcerias realizadas", totalPartnerships],
        ].map(([label, value]) => (
          <li key={label} className="aef-rh__figure"><span className="aef-rh__figure-label">{label}</span><span className="aef-rh__figure-value">{value}</span></li>
        ))}
      </ul>

      <div className="aef-rh__panel aef-rh__toolbar">
        <div className="aef-rh__toolbar-top">
          <div className="aef-rh__segments" role="group" aria-label="Tipo de vínculo">
            {entityTypes.map(([value, label]) => (
              <button key={value} type="button" className="aef-rh__segment" aria-pressed={entityType === value} onClick={() => { setEntityType(value); setFilter("Todos"); }}>{label}</button>
            ))}
          </div>
          <div className="aef-rh__search">
            <span className="aef-rh__search-icon" aria-hidden="true"><Icon name="search" size={15} /></span>
            <input className="aef-rh__input" type="search" aria-label="Buscar na rede" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar pessoa, empresa, área ou atuação…" />
          </div>
        </div>
        <div className="aef-rh__chips" role="group" aria-label="Filtrar por área">
          {filters.map(item => <button key={item} type="button" className="aef-rh__chip" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
      </div>

      <div className="aef-rh__results" aria-live="polite">
        <span>{totalResults} registro(s) encontrado(s)</span>
        {filter !== "Todos" && <button type="button" className="aef-rh__btn aef-rh__btn--link" onClick={() => setFilter("Todos")}>Limpar filtro</button>}
      </div>

      {filteredPartners.length > 0 && (
        <section className="aef-rh__group">
          <div className="aef-rh__group-head"><h2 className="aef-rh__h2">Empresas e parceiros</h2><p className="aef-rh__hint">Instituições que apoiam ações, estrutura e alcance.</p></div>
          <ul className="aef-rh__panel aef-rh__rows">{filteredPartners.map(partner => <RHPartnerRow key={partner.id} partner={partner} />)}</ul>
        </section>
      )}

      {filteredMembers.length > 0 && (
        <section className="aef-rh__group">
          <div className="aef-rh__group-head"><h2 className="aef-rh__h2">Membros da organização</h2><p className="aef-rh__hint">Equipe interna com identidade institucional e acesso ao AEF Hub.</p></div>
          <ul className="aef-rh__panel aef-rh__rows">{filteredMembers.map(member => <RHMemberRow key={member.id} member={member} />)}</ul>
        </section>
      )}

      {filteredPeople.length > 0 && (
        <section className="aef-rh__group">
          <div className="aef-rh__group-head"><h2 className="aef-rh__h2">Pessoas da rede</h2><p className="aef-rh__hint">Voluntários e profissionais que participaram da trajetória.</p></div>
          <ul className="aef-rh__panel aef-rh__rows">{filteredPeople.map(person => <RHPersonRow key={person.telefone} person={person} />)}</ul>
        </section>
      )}

      {totalResults === 0 && (
        <div className="aef-rh__panel aef-rh__empty">
          <span className="aef-rh__empty-icon" aria-hidden="true"><Icon name="search" size={22} /></span>
          <h2 className="aef-rh__h2">Nenhum vínculo encontrado</h2>
          <p className="aef-rh__desc">Tente outro nome, área ou tipo de relacionamento.</p>
        </div>
      )}
    </div>
  );
}

export const RH_CRITERIA = {
  organizador: ["pontualidade", "comprometimento", "equipe", "comunicacao", "postura", "orientacoes", "proatividade"],
  voluntario: ["acolhimento", "organizacao", "clareza", "suporte"],
};

export const RH_CRITERIA_LABELS = {
  pontualidade: "Pontualidade", comprometimento: "Comprometimento", equipe: "Trabalho em equipe",
  comunicacao: "Comunicação", postura: "Postura", orientacoes: "Cumprimento das orientações",
  proatividade: "Proatividade", acolhimento: "Acolhimento", organizacao: "Organização da ação",
  clareza: "Clareza das orientações", suporte: "Suporte da equipe",
};

export function RHSectionTitle({ title, description, action, flag }) {
  return (
    <div className="aef-rh__head">
      <div>
        <div className="aef-rh__title-row">
          <h1 className="aef-rh__title">{title}</h1>
          {flag && <span className="aef-rh__flag"><span aria-hidden="true"><Icon name="lock" size={12} /></span>{flag}</span>}
        </div>
        <p className="aef-rh__desc">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function RHFigures({ items }) {
  return (
    <ul className={`aef-rh__figures aef-rh__figures--${items.length}`}>
      {items.map(item => (
        <li key={item.label} className="aef-rh__figure" data-tone={item.tone}>
          <span className="aef-rh__figure-label">{item.label}</span>
          <span className="aef-rh__figure-value">{item.value}</span>
          {item.detail && <span className="aef-rh__figure-detail">{item.detail}</span>}
        </li>
      ))}
    </ul>
  );
}

export function RHOverview({ attendance, feedbacks, occurrences, onNavigate, mobile }) {
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
      <RHSectionTitle title="Painel do RH" description="Indicadores de vínculo, presença e acompanhamento da rede de voluntários." />
      <RHFigures items={[
        { label: "Ativos", value: active, detail: "Participaram ao menos uma vez" },
        { label: "Novos cadastros", value: newVolunteers, detail: "Aguardando integração" },
        { label: "Inativos", value: inactive, detail: "Sem participação registrada" },
        { label: "Frequência", value: `${attendanceRate}%`, detail: `${absences} faltas registradas` },
      ]} />

      <div className="aef-rh__grid aef-rh__grid--wide">
        <section className="aef-rh__panel aef-rh__panel--pad">
          <div className="aef-rh__panel-head">
            <div><h2 className="aef-rh__h2">Frequência por ação</h2><p className="aef-rh__hint">Presenças sobre confirmações</p></div>
            <button type="button" className="aef-rh__btn aef-rh__btn--link" onClick={() => onNavigate("participacao")}>Ver participação</button>
          </div>
          <ul className="aef-rh__bars">
            {attendance.slice(0, 4).map(item => {
              const rate = Math.round((item.present / item.confirmed) * 100);
              return (
                <li key={item.id} className="aef-rh__bar-row">
                  <span className="aef-rh__bar-label">{item.action}</span>
                  <span className="aef-rh__bar-value">{rate}%</span>
                  <span className="aef-rh__track" role="presentation"><span style={{ width: `${rate}%` }} /></span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="aef-rh__panel" aria-label="Pendências">
          <ul className="aef-rh__followups">
            <li className="aef-rh__followup">
              <div><p className="aef-rh__figure-label">Feedbacks pendentes</p><p className="aef-rh__followup-value">{feedbackPending}</p></div>
              <button type="button" className="aef-rh__btn aef-rh__btn--outline" onClick={() => onNavigate("feedbacks")}>Avaliar</button>
            </li>
            <li className="aef-rh__followup" data-tone={openOccurrences ? "red" : undefined}>
              <div><p className="aef-rh__figure-label">Ocorrências abertas</p><p className="aef-rh__followup-value">{openOccurrences}</p></div>
              <button type="button" className="aef-rh__btn aef-rh__btn--outline" onClick={() => onNavigate("ocorrencias")}>Acompanhar</button>
            </li>
          </ul>
        </section>
      </div>

      <div className="aef-rh__grid aef-rh__grid--half">
        <section className="aef-rh__panel aef-rh__panel--pad">
          <h2 className="aef-rh__h2" style={{ marginBottom: "var(--space-md)" }}>Participação por setor</h2>
          <ul className="aef-rh__bars">
            {sectorData.slice(0, 6).map(([sector, value]) => (
              <li key={sector} className="aef-rh__bar-row aef-rh__bar-row--sector" data-tone={rhTone(sector)}>
                <span className="aef-rh__bar-label">{sector}</span>
                <span className="aef-rh__track" role="presentation"><span style={{ width: `${(value / maxSector) * 100}%` }} /></span>
                <span className="aef-rh__bar-value">{value}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="aef-rh__panel aef-rh__panel--pad">
          <h2 className="aef-rh__h2" style={{ marginBottom: "var(--space-xs)" }}>Maior participação</h2>
          <ol className="aef-rh__rank">
            {topPeople.map((person, index) => (
              <li key={person.telefone}>
                <span className="aef-rh__rank-pos">{index + 1}</span>
                <div className="min-w-0"><div className="aef-rh__rank-name">{person.name}</div><div className="aef-rh__sector" data-tone={rhTone(person.area)}>{person.area}</div></div>
                <span className="aef-rh__rank-count">{person.actions} ações</span>
              </li>
            ))}
          </ol>
          <p className="aef-rh__note">Indicador usado para reconhecimento, nunca para punição ou comparação isolada.</p>
        </section>
      </div>
    </div>
  );
}

export function RHParticipation({ attendance }) {
  const totalPresent = attendance.reduce((sum, item) => sum + item.present, 0);
  const totalAbsent = attendance.reduce((sum, item) => sum + item.absent, 0);
  return (
    <div>
      <RHSectionTitle title="Participação e frequência" description="Presença, falta e justificativa registradas por ação, incluindo o organizador." />
      <RHFigures items={[
        { label: "Presenças", value: totalPresent, tone: "green" },
        { label: "Faltas", value: totalAbsent, tone: "red" },
        { label: "Justificadas", value: attendance.reduce((s, i) => s + i.justified, 0), tone: "amber" },
      ]} />
      <div className="aef-rh__panel aef-rh__table-wrap">
        <table className="aef-rh__table">
          <thead>
            <tr><th scope="col">Ação</th><th scope="col">Setor</th><th scope="col">Organização</th><th scope="col" className="num">Presentes</th><th scope="col" className="num">Faltas</th><th scope="col" className="num">Justificadas</th><th scope="col">Frequência</th><th scope="col">Organizador presente</th></tr>
          </thead>
          <tbody>
            {attendance.map(item => {
              const rate = Math.round((item.present / item.confirmed) * 100);
              return (
                <tr key={item.id}>
                  <td><div className="aef-rh__table-action">{item.action}</div><div className="aef-rh__table-sub">{marketingDateLabel(item.date)}</div></td>
                  <td><span className="aef-rh__sector" data-tone={rhTone(item.sector)}>{item.sector}</span></td>
                  <td>{item.organizer}</td>
                  <td className="num" data-tone="green"><span className="aef-rh__status">{item.present}</span></td>
                  <td className="num" data-tone="red"><span className="aef-rh__status">{item.absent}</span></td>
                  <td className="num">{item.justified}</td>
                  <td><div className="aef-rh__rate"><span className="aef-rh__track" role="presentation"><span style={{ width: `${rate}%` }} /></span><span className="aef-rh__bar-value">{rate}%</span></div></td>
                  <td><span className="aef-rh__status" data-tone={item.organizerPresent ? "green" : "red"}>{item.organizerPresent ? "Sim" : "Não"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RHFeedbacks({ feedbacks, onAdd }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ type: "organizador", action: RH_ATTENDANCE_SEED[0].action, volunteer: volunteers[0].name, note: "", scores: {} });
  const criteria = RH_CRITERIA[draft.type];
  const submit = event => { event.preventDefault(); const scores = Object.fromEntries(criteria.map(key => [key, Number(draft.scores[key] || 4)])); onAdd({ ...draft, scores }); setDraft(prev => ({ ...prev, note: "", scores: {} })); setShowForm(false); };
  const organizerScores = feedbacks.filter(item => item.type === "organizador").flatMap(item => Object.values(item.scores));
  const average = organizerScores.length ? (organizerScores.reduce((a, b) => a + b, 0) / organizerScores.length).toFixed(1) : "—";
  return (
    <div>
      <RHSectionTitle title="Feedbacks pós-ação" description="Avaliação do organizador e percepção do próprio voluntário sobre a experiência." action={<button type="button" aria-expanded={showForm} onClick={() => setShowForm(value => !value)} className="aef-rh__btn aef-rh__btn--primary"><span aria-hidden="true"><Icon name="plus" size={14} /></span>Nova avaliação</button>} />
      <RHFigures items={[
        { label: "Avaliações", value: feedbacks.length },
        { label: "Média geral", value: average },
        { label: "Do voluntário", value: feedbacks.filter(item => item.type === "voluntario").length },
      ]} />
      {showForm && (
        <form onSubmit={submit} className="aef-rh__panel aef-rh__panel--pad aef-rh__form">
          <div className="aef-rh__form-grid aef-rh__form-grid--3">
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-fb-tipo">Tipo</label><select id="rh-fb-tipo" value={draft.type} onChange={event => setDraft(prev => ({ ...prev, type: event.target.value, scores: {} }))} className="aef-rh__select"><option value="organizador">Organizador avalia</option><option value="voluntario">Voluntário avalia a ação</option></select></div>
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-fb-acao">Ação</label><select id="rh-fb-acao" value={draft.action} onChange={event => setDraft(prev => ({ ...prev, action: event.target.value }))} className="aef-rh__select">{RH_ATTENDANCE_SEED.map(item => <option key={item.id}>{item.action}</option>)}</select></div>
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-fb-voluntario">Voluntário</label><select id="rh-fb-voluntario" value={draft.volunteer} onChange={event => setDraft(prev => ({ ...prev, volunteer: event.target.value }))} className="aef-rh__select">{volunteers.map(item => <option key={item.telefone}>{item.name}</option>)}</select></div>
          </div>
          <div className="aef-rh__form-grid aef-rh__form-grid--2 aef-rh__form-section">
            {criteria.map(key => (
              <label key={key} className="aef-rh__score">
                <span className="aef-rh__score-head"><span>{RH_CRITERIA_LABELS[key]}</span><span>{draft.scores[key] || 4}/5</span></span>
                <input type="range" min="1" max="5" value={draft.scores[key] || 4} onChange={event => setDraft(prev => ({ ...prev, scores: { ...prev.scores, [key]: Number(event.target.value) } }))} className="aef-rh__range" />
              </label>
            ))}
          </div>
          <div className="aef-rh__field aef-rh__form-section"><label className="aef-rh__label" htmlFor="rh-fb-obs">Observação</label><textarea id="rh-fb-obs" value={draft.note} onChange={event => setDraft(prev => ({ ...prev, note: event.target.value }))} placeholder="Contexto útil para desenvolvimento e acompanhamento…" className="aef-rh__textarea" /></div>
          <div className="aef-rh__form-actions"><button type="button" onClick={() => setShowForm(false)} className="aef-rh__btn aef-rh__btn--outline">Cancelar</button><button type="submit" className="aef-rh__btn aef-rh__btn--primary">Salvar avaliação</button></div>
        </form>
      )}
      <ul className="aef-rh__panel aef-rh__records">
        {feedbacks.map(item => {
          const values = Object.values(item.scores);
          const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
          return (
            <li key={item.id} className="aef-rh__record">
              <div className="aef-rh__record-head">
                <div>
                  <div className="aef-rh__record-name">{item.volunteer}</div>
                  <div className="aef-rh__meta"><span>{item.action}</span><span>{marketingDateLabel(item.date)}</span><span>por {item.evaluator}</span></div>
                </div>
                <span className="aef-rh__status" data-tone={item.type === "voluntario" ? "blue" : "neutral"}>{item.type === "voluntario" ? "Experiência da ação" : `Média ${avg}`}</span>
              </div>
              {item.note && <p className="aef-rh__record-text">{item.note}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RHOccurrences({ occurrences, onAdd, canAccess }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ volunteer: volunteers[0].name, action: RH_ATTENDANCE_SEED[0].action, type: "Ausência sem aviso", description: "", actionTaken: "", status: "aberta", recurrence: 1 });
  if (!canAccess) return (
    <div className="aef-rh__panel aef-rh__empty">
      <span className="aef-rh__empty-icon" aria-hidden="true"><Icon name="lock" size={22} /></span>
      <h2 className="aef-rh__h2">Acesso restrito ao RH</h2>
      <p className="aef-rh__desc">Ocorrências contêm informações confidenciais e só podem ser consultadas por perfis de RH e Super Admin.</p>
    </div>
  );
  const submit = event => { event.preventDefault(); if (!draft.description.trim()) return; onAdd(draft); setDraft(prev => ({ ...prev, description: "", actionTaken: "" })); setShowForm(false); };
  const statusTone = { aberta: "red", acompanhamento: "amber", encerrada: "green" };
  return (
    <div>
      <RHSectionTitle flag="Confidencial" title="Registro de ocorrências" description="Acompanhamento restrito de condutas, providências e reincidências." action={<button type="button" aria-expanded={showForm} onClick={() => setShowForm(value => !value)} className="aef-rh__btn aef-rh__btn--primary"><span aria-hidden="true"><Icon name="plus" size={14} /></span>Registrar</button>} />
      <RHFigures items={[
        { label: "Em aberto", value: occurrences.filter(item => item.status === "aberta").length, tone: "red" },
        { label: "Acompanhamento", value: occurrences.filter(item => item.status === "acompanhamento").length, tone: "amber" },
        { label: "Encerradas", value: occurrences.filter(item => item.status === "encerrada").length, tone: "green" },
      ]} />
      {showForm && (
        <form onSubmit={submit} className="aef-rh__panel aef-rh__panel--pad aef-rh__form">
          <div className="aef-rh__form-grid aef-rh__form-grid--3">
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-oc-voluntario">Voluntário</label><select id="rh-oc-voluntario" value={draft.volunteer} onChange={event => setDraft(prev => ({ ...prev, volunteer: event.target.value }))} className="aef-rh__select">{volunteers.map(item => <option key={item.telefone}>{item.name}</option>)}</select></div>
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-oc-acao">Ação</label><select id="rh-oc-acao" value={draft.action} onChange={event => setDraft(prev => ({ ...prev, action: event.target.value }))} className="aef-rh__select">{RH_ATTENDANCE_SEED.map(item => <option key={item.id}>{item.action}</option>)}</select></div>
            <div className="aef-rh__field"><label className="aef-rh__label" htmlFor="rh-oc-tipo">Tipo</label><input id="rh-oc-tipo" value={draft.type} onChange={event => setDraft(prev => ({ ...prev, type: event.target.value }))} className="aef-rh__input" /></div>
          </div>
          <div className="aef-rh__field aef-rh__form-section"><label className="aef-rh__label" htmlFor="rh-oc-descricao">Descrição</label><textarea id="rh-oc-descricao" required value={draft.description} onChange={event => setDraft(prev => ({ ...prev, description: event.target.value }))} className="aef-rh__textarea" /></div>
          <div className="aef-rh__field aef-rh__form-section"><label className="aef-rh__label" htmlFor="rh-oc-providencia">Providência tomada</label><textarea id="rh-oc-providencia" value={draft.actionTaken} onChange={event => setDraft(prev => ({ ...prev, actionTaken: event.target.value }))} className="aef-rh__textarea" /></div>
          <div className="aef-rh__form-actions"><button type="button" onClick={() => setShowForm(false)} className="aef-rh__btn aef-rh__btn--outline">Cancelar</button><button type="submit" className="aef-rh__btn aef-rh__btn--primary">Salvar ocorrência</button></div>
        </form>
      )}
      <ul className="aef-rh__panel aef-rh__records">
        {occurrences.map(item => (
          <li key={item.id} className="aef-rh__record">
            <div className="aef-rh__record-head">
              <div>
                <div className="aef-rh__record-name">{item.volunteer}</div>
                <div className="aef-rh__meta"><span>{item.type}</span><span>{item.action}</span><span>{marketingDateLabel(item.date)}</span></div>
              </div>
              <span className="aef-rh__status aef-rh__status--cap" data-tone={statusTone[item.status] || "neutral"}>{item.status}</span>
            </div>
            <p className="aef-rh__record-text">{item.description}</p>
            <dl className="aef-rh__details">
              <div><dt>Registrado por:</dt><dd>{item.registeredBy}</dd></div>
              <div><dt>Reincidência:</dt><dd>{item.recurrence} registro(s)</dd></div>
              <div className="aef-rh__details-wide"><dt>Providência:</dt><dd>{item.actionTaken || "Aguardando definição"}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RH({ mobile, user, users, onSaveUser, onToggleUserStatus, onResetUsers }) {
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
    <div className="aef-rh">
      <nav className="aef-rh__tabs" aria-label="Seções do RH">
        {sections.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined} className="aef-rh__tab">
            {label}
            {id === "ocorrencias" && !canAccessOccurrences && <span aria-label="restrito"><Icon name="lock" size={12} /></span>}
          </button>
        ))}
      </nav>
      {section === "visao" && <RHOverview attendance={attendance} feedbacks={feedbacks} occurrences={occurrences} onNavigate={setSection} mobile={mobile} />}
      {section === "rede" && <RHNetwork mobile={mobile} members={users} />}
      {section === "participacao" && <RHParticipation attendance={attendance} />}
      {section === "feedbacks" && <RHFeedbacks feedbacks={feedbacks} onAdd={addFeedback} />}
      {section === "ocorrencias" && <RHOccurrences occurrences={occurrences} onAdd={addOccurrence} canAccess={canAccessOccurrences} />}
      {section === "acessos" && canManageAccess && <Acessos currentUser={user} users={users} onSaveUser={onSaveUser} onToggleUserStatus={onToggleUserStatus} onResetUsers={onResetUsers} />}
    </div>
  );
}
