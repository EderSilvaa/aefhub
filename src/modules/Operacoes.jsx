import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { OPS_STATUS_TONE, OPS_TIPO_TONE, OPS_TEMA } from "@/data/operacoes";
import { useRefreshResumo, useVoluntarios } from "@/data/VoluntariosContext";
import { acaoErrorMessage, createAcao, listAcoes, listEquipe, listParticipacoes, reabrirAcao, updateAcao } from "@/data/acoes";
import { AcaoEquipe, AcaoRelatorio, FinalizarAcao } from "@/modules/AcaoEquipe";
import { Inventario } from "@/modules/Inventario";
import "../operacoes.css";

export function TaskRow({ task, onToggle }) {
  const done = task.status === "concluído";
  return (
    <li className="aef-ops__task" data-done={done ? "true" : undefined}>
      <button type="button" className="aef-ops__check" aria-pressed={done} aria-label={(done ? "Desmarcar " : "Concluir ") + task.item} onClick={onToggle}>
        {done && <Icon name="check" size={12} strokeWidth={3} />}
      </button>
      <div className="aef-ops__task-main">
        <div className="aef-ops__task-name">{task.item}</div>
        {task.qtd && task.qtd !== "—" && <div className="aef-ops__task-qty">{task.qtd}</div>}
      </div>
      <div className="aef-ops__task-owner" data-missing={task.responsavel ? undefined : "true"}>
        {task.responsavel || "Sem responsável"}
      </div>
    </li>
  );
}

export function POPSection({ title, tasks, onToggle }) {
  const [open, setOpen] = useState(true);
  const done = tasks.filter(t => t.status === "concluído").length;
  return (
    <div className="aef-ops__pop-section">
      <button type="button" className="aef-ops__pop-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="aef-ops__pop-title">
          {title}
          <span className="aef-ops__pop-count" data-tone={done === tasks.length ? "green" : undefined}>{done}/{tasks.length}</span>
        </span>
        <span className="aef-ops__chev" aria-hidden="true"><Icon name="chevronRight" size={16} /></span>
      </button>
      {open && (
        <ul className="aef-ops__tasks">
          {tasks.map((t, i) => (
            <TaskRow key={i} task={t} onToggle={() => onToggle(i)} />
          ))}
        </ul>
      )}
    </div>
  );
}

const podeOperar = user => !!user && (["super_admin", "rh"].includes(user.profileId) || (user.allowedModules || []).includes("operacoes"));

export function AcaoDetail({ acao, onBack, onChange, equipe, mobile, user }) {
  const refreshResumo = useRefreshResumo();
  const concluida = acao.status === "concluída";
  const editable = podeOperar(user);
  const [pop, setPop] = useState(acao.pop ? JSON.parse(JSON.stringify(acao.pop)) : null);
  const [tab, setTab] = useState(concluida ? "relatorio" : "pop");
  const [parts, setParts] = useState([]);
  const [showFinalizar, setShowFinalizar] = useState(false);
  const [acaoErro, setAcaoErro] = useState("");
  const [acaoBusy, setAcaoBusy] = useState(false);
  // with coordination set, only they (or the Super Admin) finish the action
  const coordenadores = parts.filter(p => p.coordena).map(p => p.membroId);
  const podeFinalizar = user?.profileId === "super_admin" || (coordenadores.length ? coordenadores.includes(user?.id) : editable);

  useEffect(() => {
    let alive = true;
    listParticipacoes(acao.id).then(rows => { if (alive) setParts(rows); }).catch(error => { if (alive) setAcaoErro(acaoErrorMessage(error)); });
    return () => { alive = false; };
  }, [acao.id, acao.status]);

  const reabrir = async () => {
    if (!confirm("Reabrir esta ação? O relatório continua salvo, mas a equipe e a presença voltam a poder ser alteradas.")) return;
    setAcaoBusy(true); setAcaoErro("");
    try { onChange(await reabrirAcao(acao.id)); setTab("pop"); refreshResumo(); } catch (error) { setAcaoErro(acaoErrorMessage(error)); }
    setAcaoBusy(false);
  };
  const [showSorteio, setShowSorteio] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [sorteioStored, setSorteioStored] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`aef_sorteio_${acao.id}`) || "null"); } catch { return null; }
  });
  const [inscricoes, setInscricoes] = useState(() => {
    const def = { status: "fechada", abertaEm: null, fechadaEm: null, inscritos: [], imagem: null, descricao: "" };
    try {
      const stored = JSON.parse(localStorage.getItem(`aef_inscricoes_${acao.id}`) || "null");
      return stored ? { ...def, ...stored } : def;
    } catch { return def; }
  });
  const [showEditor, setShowEditor] = useState(false);
  const [pixData, setPixData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`aef_pix_${acao.id}`) || "null"); } catch { return null; }
  });
  const [copiadoPix, setCopiadoPix] = useState("");

  const gerarPix = () => {
    const slug = acao.nome.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    const sufixo = Math.random().toString(36).slice(2, 6).toUpperCase();
    const txid = `AEF-${slug}-${sufixo}`;
    const novo = {
      txid,
      chave: "doacoes@amoremfoco.org",
      criadoEm: new Date().toLocaleString("pt-BR"),
      payload: `00020126580014BR.GOV.BCB.PIX0125doacoes@amoremfoco.org5204000053039865406000.005802BR5913AMOR EM FOCO6005BELEM62${String(txid.length + 4).padStart(2, "0")}05${String(txid.length).padStart(2, "0")}${txid}6304ABCD`,
    };
    try { localStorage.setItem(`aef_pix_${acao.id}`, JSON.stringify(novo)); } catch {}
    setPixData(novo);
  };
  const copiarPix = (campo, valor) => {
    navigator.clipboard.writeText(valor).then(() => {
      setCopiadoPix(campo);
      setTimeout(() => setCopiadoPix(""), 1500);
    });
  };

  useEffect(() => {
    try { localStorage.setItem(`aef_inscricoes_${acao.id}`, JSON.stringify(inscricoes)); } catch {}
  }, [inscricoes, acao.id]);

  const recarregarSorteio = () => {
    try { setSorteioStored(JSON.parse(localStorage.getItem(`aef_sorteio_${acao.id}`) || "null")); } catch {}
  };

  const linkInscricao = `https://amoremfoco.org/inscricao/${acao.id}`;
  const copiarLink = () => {
    navigator.clipboard.writeText(linkInscricao).then(() => {
      setCopiadoLink(true);
      setTimeout(() => setCopiadoLink(false), 1800);
    });
  };
  const abrirInscricoes = () => setInscricoes(prev => ({ ...prev, status: "aberta", abertaEm: new Date().toISOString() }));
  const fecharInscricoes = () => {
    if (!confirm("Fechar inscrições? Novos voluntários não conseguirão mais se inscrever.")) return;
    setInscricoes(prev => ({ ...prev, status: "fechada", fechadaEm: new Date().toISOString() }));
  };
  const removerInscrito = (id) => {
    if (!confirm("Remover este inscrito?")) return;
    setInscricoes(prev => ({ ...prev, inscritos: prev.inscritos.filter(i => i.id !== id) }));
  };
  const adicionarInscrito = (novo) => {
    setInscricoes(prev => ({ ...prev, inscritos: [...prev.inscritos, { id: Date.now(), inscritoEm: new Date().toISOString(), ...novo }] }));
  };
  const handleImagemUpload = (file) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert("Imagem muito grande. Use até 4 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setInscricoes(prev => ({ ...prev, imagem: reader.result }));
    reader.readAsDataURL(file);
  };
  const removerImagem = () => setInscricoes(prev => ({ ...prev, imagem: null }));
  const atualizarDescricao = (texto) => setInscricoes(prev => ({ ...prev, descricao: texto }));

  const toggleTask = (section, idx) => {
    if (concluida || !editable) return;
    const next = JSON.parse(JSON.stringify(pop));
    const t = next[section][idx];
    t.status = t.status === "concluído" ? "pendente" : "concluído";
    setPop(next);
    updateAcao(acao.id, { pop: next }).then(onChange).catch(error => setAcaoErro(acaoErrorMessage(error)));
  };

  const totalTasks = pop ? Object.values(pop).flat().length : 0;
  const doneTasks = pop ? Object.values(pop).flat().filter(t => t.status === "concluído").length : 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const sections = pop ? [
    { key: "cardapio", label: "Cardápio" },
    { key: "afazeres", label: "Afazeres Gerais" },
    { key: "procedimentos", label: "Procedimentos Pré e Pós Ação" },
    { key: "acao", label: "Durante a Ação" },
    { key: "financeiro", label: "Financeiro" },
    { key: "marketing", label: "Marketing" },
  ] : [];

  const detailTabs = [...(concluida ? [["relatorio", "Relatório final"]] : []), ["pop", "POP"], ["equipe", `Equipe (${parts.length})`], ["inscricoes", `Inscrições${inscricoes.inscritos.length > 0 ? ` (${inscricoes.inscritos.length})` : ""}`], ["sorteio", "Sorteio"], ["pix", "PIX da ação"]];
  const renderDrawList = (titulo, lista, tom, vazio) => (
    <div className="aef-ops__draw-list" data-tone={tom}>
      <div className="aef-ops__draw-head"><span>{titulo} ({lista.length})</span></div>
      <ul className="aef-ops__people aef-ops__draw-body">
        {lista.length === 0 ? (
          <li className="aef-ops__draw-empty">{vazio}</li>
        ) : lista.map((v, i) => (
          <li key={v.name} className="aef-ops__person" data-tone={tom}>
            <span className="aef-ops__num">{i + 1}.</span>
            <div className="aef-ops__person-main">
              <div className="aef-ops__person-name">{v.name}{v.novato && <span className="aef-ops__tag" data-tone="green">Novato</span>}</div>
              {v.telefone && <div className="aef-ops__hint" style={{ marginTop: 0 }}>{v.telefone}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="aef-ops">
      <button type="button" className="aef-ops__back" onClick={onBack}>
        <span className="aef-ops__flip" aria-hidden="true"><Icon name="chevronRight" size={16} /></span>
        Operações
      </button>

      <header>
        <div className="aef-ops__detail-head" data-tema={OPS_TEMA[acao.tipo]}>
          {OPS_TEMA[acao.tipo] === "natal" && <NatalEnfeites />}
          <div style={{ minWidth: 0 }}>
            <h1 className="aef-ops__title">{acao.nome}</h1>
            <div className="aef-ops__labels">
              <span className="aef-ops__tone" data-tone={OPS_TIPO_TONE[acao.tipo] || "neutral"}>{acao.tipo}</span>
              <span className="aef-ops__tone aef-ops__cap" data-tone={OPS_STATUS_TONE[acao.status] || "neutral"}>{acao.status}</span>
            </div>
          </div>
          <div className="aef-ops__detail-facts">
            <span>{acao.data}</span>
            <span>{parts.filter(p => p.papel === "voluntario").length} voluntários</span>
            {acao.responsavel && <span>{acao.responsavel}</span>}
          </div>
        </div>

        {editable && (
          <div className="aef-ops__detail-actions">
            {!concluida && podeFinalizar && (
              <button type="button" className="aef-ops__btn aef-ops__btn--primary" disabled={acaoBusy} onClick={() => setShowFinalizar(true)}>
                <span aria-hidden="true"><Icon name="check" size={16} strokeWidth={2.25} /></span>
                Finalizar ação
              </button>
            )}
            {!concluida && !podeFinalizar && <p className="aef-ops__hint" style={{ alignSelf: "center", marginTop: 0 }}>Quem finaliza é a coordenação desta ação.</p>}
            {concluida && user?.profileId === "super_admin" && (
              <button type="button" className="aef-ops__btn aef-ops__btn--outline" disabled={acaoBusy} onClick={reabrir}>Reabrir ação</button>
            )}
          </div>
        )}
        {acaoErro && <p className="aef-ops__error" role="alert" style={{ marginTop: "var(--space-sm)" }}>{acaoErro}</p>}

        {pop && (
          <div className="aef-ops__progress" data-tone={progress === 100 ? "green" : undefined}>
            <div className="aef-ops__progress-head"><span>Progresso do POP</span><strong>{progress}%</strong></div>
            <div className="aef-ops__track" role="progressbar" aria-label="Progresso do POP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
            <div className="aef-ops__hint" style={{ marginTop: 0 }}>{doneTasks} de {totalTasks} tarefas concluídas</div>
          </div>
        )}
      </header>

      <nav className="aef-ops__tabs" aria-label="Seções da ação">
        {detailTabs.map(([id, label]) => (
          <button key={id} type="button" className="aef-ops__tab" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
            {label}
            {id === "sorteio" && sorteioStored && <span className="aef-ops__tab-check" aria-label="realizado"><Icon name="check" size={13} strokeWidth={2.5} /></span>}
          </button>
        ))}
      </nav>

      {tab === "pop" && pop && (
        <div className="aef-ops__panel aef-ops__pop">
          {sections.map(s => (
            <POPSection
              key={s.key}
              title={s.label}
              tasks={pop[s.key]}
              onToggle={idx => toggleTask(s.key, idx)}
            />
          ))}
        </div>
      )}

      {tab === "equipe" && <AcaoEquipe acao={acao} parts={parts} setParts={setParts} equipe={equipe} editable={editable} />}

      {tab === "relatorio" && <AcaoRelatorio acao={acao} parts={parts} equipe={equipe} user={user} />}

      {showFinalizar && (
        <FinalizarAcao acao={{ ...acao, pop }} parts={parts} equipe={equipe} user={user} onClose={() => setShowFinalizar(false)}
          onDone={(updated, aviso) => {
            setShowFinalizar(false);
            onChange(updated);
            setAcaoErro(aviso || "");
            refreshResumo();
            setTab("relatorio");
          }}
        />
      )}

      {tab === "pop" && !pop && (
        <div className="aef-ops__panel aef-ops__empty">
          <p className="aef-ops__hint">POP ainda não cadastrado para esta ação.</p>
        </div>
      )}

      {tab === "sorteio" && (
        <div className="aef-ops__panel aef-ops__panel--pad">
          {sorteioStored ? (
            <div className="aef-ops__stack">
              <div className="aef-ops__status-row">
                <div>
                  <p className="aef-ops__ok"><span aria-hidden="true"><Icon name="check" size={16} strokeWidth={2.5} /></span>Sorteio realizado</p>
                  <div className="aef-ops__meta" style={{ marginTop: "var(--space-2xs)" }}>
                    <span>{sorteioStored.resultado.sorteados.length} sorteados</span>
                    <span>{sorteioStored.resultado.reserva.length} reserva</span>
                    <span>gerado em {sorteioStored.resultado.geradaEm}</span>
                  </div>
                  {sorteioStored.resultado.geradoPor && (
                    <p className="aef-ops__hint">Gerado por <strong style={{ color: "var(--color-ink)", fontWeight: 600 }}>{sorteioStored.resultado.geradoPor}</strong></p>
                  )}
                </div>
                <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => setShowSorteio(true)}>Abrir / Refazer</button>
              </div>
              <div className="aef-ops__draw">
                {renderDrawList("Sorteados", sorteioStored.resultado.sorteados, "green", "Sem sorteados")}
                {renderDrawList("Reserva", sorteioStored.resultado.reserva, undefined, "Sem reserva")}
              </div>
            </div>
          ) : (
            <div className="aef-ops__empty">
              <span className="aef-ops__empty-icon" aria-hidden="true"><Icon name="users" size={24} strokeWidth={1.8} /></span>
              <h3 className="aef-ops__h2">Nenhum sorteio realizado</h3>
              <p className="aef-ops__hint">Sorteie a equipe desta ação a partir do banco de voluntários do RH. Os telefones serão incluídos automaticamente.</p>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={() => setShowSorteio(true)} style={{ marginTop: "var(--space-xs)" }}>
                <span aria-hidden="true"><Icon name="users" size={15} strokeWidth={2} /></span>
                Realizar sorteio
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "inscricoes" && (
        <div className="aef-ops__stack">
          <section className="aef-ops__panel aef-ops__panel--pad aef-ops__stack">
            <div className="aef-ops__status-row">
              <div>
                <h2 className="aef-ops__h2" data-tone={inscricoes.status === "aberta" ? "green" : undefined} style={{ color: "var(--tone, var(--color-ink))" }}>
                  {inscricoes.status === "aberta" ? "Inscrições abertas" : "Inscrições fechadas"}
                </h2>
                <p className="aef-ops__hint">
                  {inscricoes.inscritos.length} {inscricoes.inscritos.length === 1 ? "pessoa inscrita" : "pessoas inscritas"}
                </p>
              </div>
              {inscricoes.status === "aberta" ? (
                <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={fecharInscricoes}>Fechar inscrições</button>
              ) : (
                <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={abrirInscricoes}>Abrir inscrições</button>
              )}
            </div>

            {inscricoes.status === "aberta" && (
              <>
                <div className="aef-ops__field">
                  <span className="aef-ops__label">Link para o grupo do WhatsApp</span>
                  <div className="aef-ops__copy-row">
                    <div className="aef-ops__value">{linkInscricao}</div>
                    <button type="button" className="aef-ops__btn aef-ops__btn--outline" data-done={copiadoLink ? "true" : undefined} onClick={copiarLink} aria-live="polite">
                      {copiadoLink ? "Copiado" : "Copiar link"}
                    </button>
                    <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => setShowPreview(true)}>
                      <span aria-hidden="true"><Icon name="eye" size={14} /></span> Ver página
                    </button>
                  </div>
                </div>
                <div className="aef-ops__qr-row">
                  <img className="aef-ops__qr" alt="QR Code" src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(linkInscricao)}`} />
                  <p>
                    Compartilhe o link no grupo ou cole o QR Code num story.<br />
                    Inscrições serão registradas em tempo real nesta página.
                  </p>
                </div>

                <button type="button" className="aef-ops__disclosure" aria-expanded={showEditor} onClick={() => setShowEditor(s => !s)}>
                  <span className="aef-ops__disclosure-label">
                    <span aria-hidden="true"><Icon name="settings" size={14} /></span>
                    Personalizar página (foto + descrição)
                  </span>
                  <span className="aef-ops__chev" aria-hidden="true"><Icon name="chevronRight" size={14} /></span>
                </button>

                {showEditor && (
                  <div className="aef-ops__editor">
                    <div className="aef-ops__field">
                      <span className="aef-ops__label">Foto de capa</span>
                      {inscricoes.imagem ? (
                        <div>
                          <img className="aef-ops__cover" src={inscricoes.imagem} alt="Capa" />
                          <div className="aef-ops__row-btns">
                            <label className="aef-ops__btn aef-ops__btn--outline aef-ops__btn--grow aef-ops__file-label">
                              Trocar imagem
                              <input className="aef-ops__file" type="file" accept="image/*" onChange={(e) => handleImagemUpload(e.target.files?.[0])} />
                            </label>
                            <button type="button" className="aef-ops__btn aef-ops__btn--outline" style={{ color: "var(--color-accent)" }} onClick={removerImagem}>Remover</button>
                          </div>
                        </div>
                      ) : (
                        <label className="aef-ops__drop">
                          <span className="aef-ops__empty-icon" aria-hidden="true"><Icon name="camera" size={22} strokeWidth={1.8} /></span>
                          <span className="aef-ops__h3">Adicionar foto de capa</span>
                          <span className="aef-ops__hint" style={{ marginTop: 0 }}>JPG ou PNG, até 4 MB</span>
                          <input className="aef-ops__file" type="file" accept="image/*" onChange={(e) => handleImagemUpload(e.target.files?.[0])} />
                        </label>
                      )}
                    </div>

                    <div className="aef-ops__field">
                      <label className="aef-ops__label" htmlFor={`ops-desc-${acao.id}`}>Descrição da ação</label>
                      <textarea
                        id={`ops-desc-${acao.id}`}
                        className="aef-ops__textarea"
                        value={inscricoes.descricao}
                        onChange={(e) => atualizarDescricao(e.target.value)}
                        placeholder="Conte o que vai acontecer nesta ação. Quem vai ser atendido, onde, qual o horário, se tem treinamento obrigatório, materiais que o voluntário precisa levar…"
                        rows={6}
                      />
                      <p className="aef-ops__hint">Aparece em destaque na página pública, antes do formulário. Pode usar emojis e quebras de linha.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="aef-ops__panel">
            <div className="aef-ops__panel-head">
              <h2 className="aef-ops__h3">Inscritos ({inscricoes.inscritos.length})</h2>
              {inscricoes.inscritos.length > 0 && (
                <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={() => setShowSorteio(true)}>
                  <span aria-hidden="true"><Icon name="users" size={13} strokeWidth={2} /></span>
                  Sortear destes
                </button>
              )}
            </div>
            {inscricoes.inscritos.length === 0 ? (
              <div className="aef-ops__empty">
                <p className="aef-ops__hint">
                  {inscricoes.status === "aberta" ? "Aguardando inscrições. Compartilhe o link acima." : "Abra as inscrições para receber voluntários."}
                </p>
              </div>
            ) : (
              <ul className="aef-ops__people">
                {inscricoes.inscritos.map((i) => (
                  <li key={i.id} className="aef-ops__person">
                    <div className="aef-ops__person-main">
                      <div className="aef-ops__person-name">{i.nome}{i.novato && <span className="aef-ops__tag" data-tone="green">Novato</span>}</div>
                      <div className="aef-ops__meta">
                        {i.idade && <span>{i.idade} anos</span>}
                        <span>{i.telefone}</span>
                        {i.ultimaAcao && <span>{i.ultimaAcao}</span>}
                        {i.emergencia && <span>emerg.: {i.emergencia}</span>}
                      </div>
                    </div>
                    <button type="button" className="aef-ops__icon-btn" title="Remover" aria-label={"Remover " + i.nome} onClick={() => removerInscrito(i.id)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "pix" && (
        <div className="aef-ops__panel aef-ops__panel--pad">
          {pixData ? (
            <div className="aef-ops__stack">
              <div className="aef-ops__status-row">
                <div>
                  <p className="aef-ops__ok"><span aria-hidden="true"><Icon name="check" size={16} strokeWidth={2.5} /></span>PIX da ação configurado</p>
                  <p className="aef-ops__hint">Todo PIX recebido com este txid será vinculado automaticamente à ação.</p>
                  <p className="aef-ops__hint">Criado em {pixData.criadoEm}</p>
                </div>
                <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => { if (confirm("Regenerar PIX? O txid antigo deixará de funcionar.")) gerarPix(); }}>Regenerar</button>
              </div>

              <div className="aef-ops__pix">
                <div className="aef-ops__pix-qr">
                  <img alt="QR Code PIX" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.payload)}`} />
                </div>
                <div className="aef-ops__stack">
                  <div className="aef-ops__field">
                    <span className="aef-ops__label">Chave PIX</span>
                    <div className="aef-ops__copy-row">
                      <div className="aef-ops__value">{pixData.chave}</div>
                      <button type="button" className="aef-ops__btn aef-ops__btn--outline" data-done={copiadoPix === "chave" ? "true" : undefined} onClick={() => copiarPix("chave", pixData.chave)}>{copiadoPix === "chave" ? "Copiado" : "Copiar"}</button>
                    </div>
                  </div>
                  <div className="aef-ops__field">
                    <span className="aef-ops__label">Identificador (txid)</span>
                    <div className="aef-ops__copy-row">
                      <div className="aef-ops__value aef-ops__value--code">{pixData.txid}</div>
                      <button type="button" className="aef-ops__btn aef-ops__btn--outline" data-done={copiadoPix === "txid" ? "true" : undefined} onClick={() => copiarPix("txid", pixData.txid)}>{copiadoPix === "txid" ? "Copiado" : "Copiar"}</button>
                    </div>
                  </div>
                  <div className="aef-ops__field">
                    <span className="aef-ops__label">PIX Copia e Cola</span>
                    <div className="aef-ops__copy-row">
                      <div className="aef-ops__value aef-ops__value--muted">{pixData.payload}</div>
                      <button type="button" className="aef-ops__btn aef-ops__btn--outline" data-done={copiadoPix === "payload" ? "true" : undefined} onClick={() => copiarPix("payload", pixData.payload)}>{copiadoPix === "payload" ? "Copiado" : "Copiar"}</button>
                    </div>
                  </div>
                  <p className="aef-ops__note aef-ops__note--amber">
                    Coloque o QR Code no story ou status do WhatsApp. Quando alguém doar, o Hub avisa no Mural e contabiliza esta ação automaticamente.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="aef-ops__empty">
              <span className="aef-ops__empty-icon" aria-hidden="true"><Icon name="dollar" size={24} strokeWidth={1.8} /></span>
              <h3 className="aef-ops__h2">Crie um PIX exclusivo para esta ação</h3>
              <p className="aef-ops__hint">
                Cada PIX recebido com este identificador será vinculado automaticamente à ação <b>{acao.nome}</b>. Você verá quanto a ação arrecadou separado do caixa geral.
              </p>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={gerarPix} style={{ marginTop: "var(--space-xs)" }}>
                <span aria-hidden="true"><Icon name="dollar" size={15} strokeWidth={2} /></span>
                Gerar PIX da ação
              </button>
            </div>
          )}
        </div>
      )}

      {showPreview && <PreviewPaginaInscricao acao={acao} linkInscricao={linkInscricao} imagem={inscricoes.imagem} descricao={inscricoes.descricao} onClose={() => setShowPreview(false)} onInscrever={adicionarInscrito} />}
      {showSorteio && <ModalSorteio acao={acao} user={user} onClose={() => { setShowSorteio(false); recarregarSorteio(); }} mobile={mobile} inscritos={inscricoes.inscritos.length > 0 ? inscricoes.inscritos : null} />}
    </div>
  );
}

export const EXPERIENCIA_OPCOES = [
  { id: "cafe_rua", label: "Sim, já participei de Café de Rua" },
  { id: "outra_acao", label: "Sim, já participei de outro tipo de ação" },
  { id: "primeira_vez", label: "É a minha primeira vez" },
];

export function PreviewPaginaInscricao({ acao, linkInscricao, imagem, descricao, onClose, onInscrever }) {
  const [form, setForm] = useState({ nome: "", idade: "", experiencia: null, telefone: "", emergencia: "", termo: false });
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const submeter = () => {
    setErro("");
    if (!form.nome.trim() || form.nome.trim().length < 3) return setErro("Digite seu nome completo.");
    const idade = parseInt(form.idade, 10);
    if (!idade || idade < 12 || idade > 100) return setErro("Digite uma idade válida.");
    if (!form.experiencia) return setErro("Conta pra gente se você já participou de alguma ação.");
    if (!form.telefone.trim() || form.telefone.replace(/\D/g, "").length < 10) return setErro("Digite um WhatsApp válido.");
    if (!form.emergencia.trim() || form.emergencia.replace(/\D/g, "").length < 10) return setErro("Digite um contato de emergência válido.");
    if (!form.termo) return setErro("É necessário concordar com o termo de compromisso.");
    const ultimaAcao = form.experiencia === "cafe_rua" ? "Café de Rua" : form.experiencia === "outra_acao" ? "Outra ação AEF" : null;
    onInscrever({
      nome: form.nome.trim(),
      idade,
      telefone: form.telefone.trim(),
      emergencia: form.emergencia.trim(),
      experiencia: form.experiencia,
      novato: form.experiencia === "primeira_vez",
      ultimaAcao,
    });
    setEnviado(true);
  };

  return (
    <div className="aef-ops aef-ops__scrim aef-ops__scrim--center" onClick={onClose}>
      <div className="aef-ops__dialog aef-ops__dialog--public" role="dialog" aria-modal="true" aria-labelledby="ops-public-title" onClick={(e) => e.stopPropagation()}>
        <div className="aef-ops__dialog-head">
          <div style={{ minWidth: 0 }}>
            <p className="aef-ops__h3">Prévia da página pública</p>
            <p className="aef-ops__url">{linkInscricao}</p>
          </div>
          <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose}>Fechar</button>
        </div>
        <div className="aef-ops__dialog-body" style={{ padding: 0 }}>
          {imagem && (
            <div className="aef-ops__public-cover">
              <img src={imagem} alt={acao.nome} />
            </div>
          )}
          <div className="aef-ops__dialog-body aef-ops__stack">
            <div className="aef-ops__public-brand">
              <img className="aef-ops__public-logo" src="/logo-vermelha.png" alt="" />
              <h2 id="ops-public-title" className="aef-ops__dialog-title">Amor em Foco</h2>
              <p className="aef-ops__hint" style={{ marginTop: 0 }}>Inscrição de voluntário</p>
            </div>

            <div className="aef-ops__public-action">
              <span className="aef-ops__public-type">{acao.tipo}</span>
              <span className="aef-ops__h3">{acao.nome}</span>
              <span className="aef-ops__meta-item aef-ops__hint" style={{ marginTop: 0 }}><span aria-hidden="true"><Icon name="calendar" size={13} /></span>{acao.data}</span>
            </div>

            {!enviado && (
              descricao && descricao.trim()
                ? <div className="aef-ops__public-desc">{descricao}</div>
                : <div className="aef-ops__public-desc" data-placeholder="true">Iremos servir café da manhã para pessoas em situação de rua em Belém. <b>Treinamento online obrigatório</b> antes da ação, com data e link enviados a quem for sorteado.</div>
            )}

          {enviado ? (
            <div className="aef-ops__public-done" role="status">
              <span className="aef-ops__public-done-icon" aria-hidden="true"><Icon name="check" size={32} strokeWidth={2.5} /></span>
              <h3 className="aef-ops__dialog-title">Inscrição confirmada!</h3>
              <p className="aef-ops__hint">O resultado do sorteio será divulgado no grupo. Obrigado por se voluntariar.</p>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={onClose}>Fechar</button>
            </div>
          ) : (
            <>
              <div className="aef-ops__form">
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-pub-nome">Nome completo *</label>
                  <input id="ops-pub-nome" className="aef-ops__input" type="text" autoComplete="name" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Seu nome" />
                </div>
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-pub-idade">Idade *</label>
                  <input id="ops-pub-idade" className="aef-ops__input" type="number" min={12} max={100} value={form.idade} onChange={e => setForm(p => ({ ...p, idade: e.target.value }))} placeholder="Sua idade" />
                </div>
                <div className="aef-ops__field">
                  <span className="aef-ops__label" id="ops-pub-exp">Você já participou de alguma ação do Amor em Foco? *</span>
                  <div className="aef-ops__choices" role="radiogroup" aria-labelledby="ops-pub-exp">
                    {EXPERIENCIA_OPCOES.map(opt => {
                      const ativo = form.experiencia === opt.id;
                      return (
                        <button key={opt.id} type="button" role="radio" aria-checked={ativo} className="aef-ops__choice" onClick={() => setForm(p => ({ ...p, experiencia: opt.id }))}>
                          <span className="aef-ops__radio" aria-hidden="true" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-pub-tel">Seu contato (WhatsApp) *</label>
                  <input id="ops-pub-tel" className="aef-ops__input" type="tel" autoComplete="tel" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(91) 9XXXX-XXXX" />
                </div>
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-pub-emerg">Contato de emergência *</label>
                  <input id="ops-pub-emerg" className="aef-ops__input" type="tel" value={form.emergencia} onChange={e => setForm(p => ({ ...p, emergencia: e.target.value }))} placeholder="Familiar ou pessoa próxima" />
                </div>
                <div className="aef-ops__note aef-ops__stack" style={{ gap: "var(--space-xs)" }}>
                  <span className="aef-ops__label">Termo de compromisso</span>
                  <p>
                    Declaro que participarei do treinamento online obrigatório, comparecerei à ação no horário marcado, seguirei as orientações da diretoria e estou ciente de que minha inscrição não garante a vaga (será definida por sorteio).
                  </p>
                  <label className="aef-ops__checkline">
                    <input type="checkbox" checked={form.termo} onChange={e => setForm(p => ({ ...p, termo: e.target.checked }))} />
                    Sim, concordo.
                  </label>
                </div>
              </div>
              {erro && <p className="aef-ops__error" role="alert">{erro}</p>}
              <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--block" onClick={submeter}>
                Quero participar
              </button>
              <p className="aef-ops__fineprint">Esta página é uma simulação. No deploy real ela ficará em <b>amoremfoco.org/inscricao/{acao.id}</b> e qualquer pessoa com o link poderá se inscrever.</p>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ModalSorteio({ acao, user, onClose, mobile, inscritos: inscritosFonte }) {
  const volunteers = useVoluntarios();
  const storageKey = `aef_sorteio_${acao.id}`;
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "null"); } catch { return null; }
  })();

  // Quando há lista de inscritos da página pública, ela vira o pool; senão usa o banco RH inteiro
  const pool = inscritosFonte && inscritosFonte.length > 0
    ? inscritosFonte.map(i => ({
        name: i.nome,
        telefone: i.telefone,
        novato: i.novato,
        penalizado: false,
        area: i.ultimaAcao ? "Voluntário(a)" : "Novo cadastro",
        initials: i.nome.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase(),
        actions: i.novato ? 0 : 1,
      }))
    : volunteers;
  const origemPool = inscritosFonte && inscritosFonte.length > 0 ? "inscricoes" : "rh";

  const [etapa, setEtapa] = useState(stored ? "resultado" : "config");
  const [vagas, setVagas] = useState(stored?.vagas ?? (acao.voluntarios > 0 ? acao.voluntarios : 12));
  const [minNovatos, setMinNovatos] = useState(stored?.minNovatos ?? 3);
  const [inscritos, setInscritos] = useState(() => {
    if (stored?.inscritos) return stored.inscritos;
    const init = {};
    pool.forEach(v => { init[v.name] = !v.penalizado; });
    return init;
  });
  const [resultado, setResultado] = useState(stored?.resultado || null);
  const [copiado, setCopiado] = useState("");

  const elegiveis = pool.filter(v => inscritos[v.name] && !v.penalizado);
  const totalNovatos = elegiveis.filter(v => v.novato).length;
  const totalVeteranos = elegiveis.filter(v => !v.novato).length;
  const podeSortear = elegiveis.length >= vagas && vagas > 0;

  const realizar = () => {
    const novatos = elegiveis.filter(v => v.novato);
    const veteranos = elegiveis.filter(v => !v.novato);
    const minNov = Math.min(minNovatos, novatos.length, vagas);
    const novatosSorteados = shuffle(novatos).slice(0, minNov);
    const novatosRestantes = novatos.filter(n => !novatosSorteados.includes(n));
    const restoPool = shuffle([...novatosRestantes, ...veteranos]);
    const completar = restoPool.slice(0, vagas - novatosSorteados.length);
    const sorteados = [...novatosSorteados, ...completar];
    const reserva = restoPool.slice(vagas - novatosSorteados.length);
    const novoResultado = { sorteados, reserva, geradaEm: new Date().toLocaleString("pt-BR"), geradoPor: user?.name || "—" };
    setResultado(novoResultado);
    setEtapa("resultado");
    try {
      localStorage.setItem(storageKey, JSON.stringify({ vagas, minNovatos, inscritos, resultado: novoResultado }));
    } catch (e) { console.warn("Erro ao salvar sorteio", e); }
  };

  const refazer = () => {
    if (!confirm("Refazer o sorteio? O resultado atual será substituído.")) return;
    setResultado(null);
    setEtapa("config");
  };

  const linhaTexto = (v, i) => {
    const tel = v.telefone ? ` — ${v.telefone}` : "";
    const tag = v.novato ? " (novato)" : "";
    return `${i + 1}. ${v.name}${tag}${tel}`;
  };

  const copiar = (tipo) => {
    if (!resultado) return;
    const header = `*${acao.nome}* — ${acao.data}`;
    let texto = "";
    if (tipo === "sorteados") {
      texto = `${header}\n*SORTEADOS (${resultado.sorteados.length}):*\n` + resultado.sorteados.map(linhaTexto).join("\n");
    } else if (tipo === "reserva") {
      texto = `${header}\n*LISTA RESERVA (${resultado.reserva.length}):*\n` + resultado.reserva.map(linhaTexto).join("\n");
    } else {
      const sortLines = resultado.sorteados.map(linhaTexto).join("\n");
      const resLines = resultado.reserva.map(linhaTexto).join("\n");
      texto = `${header}\nSorteio gerado em ${resultado.geradaEm}${resultado.geradoPor ? ` por ${resultado.geradoPor}` : ""}\n\n*SORTEADOS (${resultado.sorteados.length}):*\n${sortLines}\n\n*RESERVA (${resultado.reserva.length}):*\n${resLines}`;
    }
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(tipo);
      setTimeout(() => setCopiado(""), 1800);
    });
  };

  const renderResultList = (titulo, lista, tipo, tom, vazio, botaoCopiar) => (
    <div className="aef-ops__draw-list" data-tone={tom}>
      <div className="aef-ops__draw-head">
        <span>{titulo} ({lista.length})</span>
        {botaoCopiar}
      </div>
      <ul className="aef-ops__people aef-ops__draw-body">
        {lista.length === 0 ? (
          <li className="aef-ops__draw-empty">{vazio}</li>
        ) : lista.map((v, i) => (
          <li key={v.name} className="aef-ops__person" data-tone={tom}>
            <span className="aef-ops__num">{i + 1}.</span>
            <div className="aef-ops__person-main">
              <div className="aef-ops__person-name">{v.name}{v.novato && <span className="aef-ops__tag" data-tone="green">Novato</span>}</div>
              {v.telefone && <div className="aef-ops__hint" style={{ marginTop: 0 }}>{v.telefone}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="aef-ops aef-ops__scrim" onClick={onClose}>
      <div className="aef-ops__dialog aef-ops__dialog--wide" role="dialog" aria-modal="true" aria-labelledby="ops-sorteio-title" onClick={(e) => e.stopPropagation()}>
        <div className="aef-ops__dialog-head">
          <div style={{ minWidth: 0 }}>
            <h2 id="ops-sorteio-title" className="aef-ops__dialog-title">Sorteio: {acao.nome}</h2>
            <div className="aef-ops__meta" style={{ marginTop: "var(--space-2xs)" }}>
              <span>{acao.data}</span>
              {etapa === "config" && <span>Configure critérios e quem está inscrito</span>}
              {etapa === "resultado" && <span>Salvo em {resultado?.geradaEm}{resultado?.geradoPor ? ` por ${resultado.geradoPor}` : ""}</span>}
            </div>
          </div>
          <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose}>Fechar</button>
        </div>

        <div className="aef-ops__dialog-body aef-ops__stack">
          {etapa === "config" && (
            <>
              <div className="aef-ops__row2">
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-vagas">Vagas</label>
                  <input id="ops-vagas" className="aef-ops__input" type="number" min={1} value={vagas} onChange={e => setVagas(Math.max(1, +e.target.value || 1))} />
                </div>
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="ops-min-novatos">Mínimo de novatos</label>
                  <input id="ops-min-novatos" className="aef-ops__input" type="number" min={0} value={minNovatos} onChange={e => setMinNovatos(Math.max(0, +e.target.value || 0))} />
                </div>
              </div>

              <ul className="aef-ops__figures">
                <li className="aef-ops__figure"><span className="aef-ops__figure-label">Inscritos</span><span className="aef-ops__figure-value">{elegiveis.length}</span></li>
                <li className="aef-ops__figure" data-tone="green"><span className="aef-ops__figure-label">Novatos</span><span className="aef-ops__figure-value">{totalNovatos}</span></li>
                <li className="aef-ops__figure" data-tone="purple"><span className="aef-ops__figure-label">Veteranos</span><span className="aef-ops__figure-value">{totalVeteranos}</span></li>
              </ul>

              <div className="aef-ops__pool-head">
                <span className="aef-ops__label">{origemPool === "inscricoes" ? `Inscritos pela página pública (${pool.length})` : "Voluntários do banco"}</span>
                <div style={{ display: "flex", gap: "var(--space-2xs)" }}>
                  <button type="button" className="aef-ops__btn aef-ops__btn--link" onClick={() => setInscritos(Object.fromEntries(pool.map(v => [v.name, !v.penalizado])))}>Marcar todos</button>
                  <button type="button" className="aef-ops__btn aef-ops__btn--quiet" onClick={() => setInscritos({})}>Limpar</button>
                </div>
              </div>

              <div className="aef-ops__pool">
                {pool.map((v) => (
                  <label key={v.name} className="aef-ops__pool-row" data-blocked={v.penalizado ? "true" : undefined}>
                    <input type="checkbox" disabled={v.penalizado} checked={!!inscritos[v.name]}
                      onChange={e => setInscritos(prev => ({ ...prev, [v.name]: e.target.checked }))}
                    />
                    <div className="aef-ops__person-main">
                      <div className="aef-ops__person-name">
                        {v.name}
                        {v.novato && <span className="aef-ops__tag" data-tone="green">Novato</span>}
                        {v.penalizado && <span className="aef-ops__tag" data-tone="red">Penalizado</span>}
                      </div>
                      <div className="aef-ops__meta">
                        <span>{v.area}</span>
                        <span>{v.actions} ações</span>
                        {v.penalizado && v.motivoPenalidade && <span>{v.motivoPenalidade}</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {etapa === "resultado" && resultado && (
            <div className="aef-ops__draw">
              {renderResultList("Sorteados", resultado.sorteados, "sorteados", "green", "Sem sorteados",
                <button type="button" className="aef-ops__btn aef-ops__btn--quiet" data-done={copiado === "sorteados" ? "true" : undefined} onClick={() => copiar("sorteados")}>{copiado === "sorteados" ? "Copiado" : "Copiar"}</button>
              )}
              {renderResultList("Reserva", resultado.reserva, "reserva", undefined, "Sem reserva, todos foram sorteados",
                <button type="button" className="aef-ops__btn aef-ops__btn--quiet" data-done={copiado === "reserva" ? "true" : undefined} onClick={() => copiar("reserva")}>{copiado === "reserva" ? "Copiado" : "Copiar"}</button>
              )}
            </div>
          )}
        </div>

        <div className="aef-ops__dialog-foot">
          {etapa === "config" && (
            <>
              <button type="button" className="aef-ops__btn aef-ops__btn--outline aef-ops__btn--grow" onClick={onClose}>Cancelar</button>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--grow2" disabled={!podeSortear} onClick={realizar}>
                {!podeSortear ? `Selecione ao menos ${vagas} voluntários` : "Realizar sorteio"}
              </button>
            </>
          )}
          {etapa === "resultado" && (
            <>
              <button type="button" className="aef-ops__btn aef-ops__btn--outline aef-ops__btn--grow" onClick={refazer}>Refazer</button>
              <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--grow2" onClick={() => copiar("tudo")} aria-live="polite">
                {copiado === "tudo" ? "Copiado para área de transferência" : "Copiar lista completa"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Ceia de Natal banner: a Santa hat on the corner and slow snow (static for reduced motion).
const NEVE = [
  [6, 0, 9, 3], [14, 3.5, 11, 2], [22, 1.2, 8, 4], [31, 5, 12, 2], [39, 2.4, 10, 3], [47, 6.5, 9, 2],
  [55, 0.8, 11, 4], [63, 4.2, 8, 2], [71, 2, 12, 3], [79, 5.6, 10, 2], [87, 1.6, 9, 4], [94, 3.8, 11, 2],
];
const LUZES = 14;
const LUZ_CORES = ["red", "gold", "green", "blue"];
const FIO = Array.from({ length: LUZES }, (_, i) => `Q ${i * 100 + 50} 24 ${i * 100 + 100} 4`).join(" ");
function NatalEnfeites() {
  return (
    <>
      <span className="aef-ops__luzes" aria-hidden="true">
        <svg viewBox={`0 0 ${LUZES * 100} 30`} preserveAspectRatio="none" focusable="false"><path d={`M 0 4 ${FIO}`} /></svg>
        {Array.from({ length: LUZES }, (_, i) => (
          <i key={i} data-cor={LUZ_CORES[i % LUZ_CORES.length]} style={{ "--x": `${((i * 100 + 50) / (LUZES * 100)) * 100}%`, "--delay": `${(i * 0.7) % 3}s` }} />
        ))}
      </span>
      <span className="aef-ops__neve" aria-hidden="true">
        {NEVE.map(([x, delay, dur, size]) => (
          <i key={x} style={{ "--x": `${x}%`, "--delay": `-${delay}s`, "--dur": `${dur}s`, "--size": `${size}px` }} />
        ))}
      </span>
      <svg className="aef-ops__gorro" viewBox="0 0 64 56" aria-hidden="true" focusable="false">
        <path className="aef-ops__gorro-pano" d="M8 40 C 10 22, 24 6, 42 5 C 53 4, 58 11, 57 19 C 51 15, 45 18, 44 24 C 45 30, 49 35, 52 40 Z" />
        <path className="aef-ops__gorro-sombra" d="M44 24 C 45 30, 49 35, 52 40 L 40 40 C 40 33, 41 28, 44 24 Z" />
        <rect className="aef-ops__gorro-pelo" x="3" y="37" width="54" height="13" rx="6.5" />
        <circle className="aef-ops__gorro-pelo" cx="57" cy="20" r="6" />
      </svg>
    </>
  );
}

export function Operacoes({ mobile, user }) {
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [showNovaAcao, setShowNovaAcao] = useState(false);
  const NOVA = { nome: "", tipo: "Ceia de Natal", data: "", responsavelId: "" };
  const [novaAcao, setNovaAcao] = useState(NOVA);
  const [acoes, setAcoes] = useState([]);
  const [equipe, setEquipe] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    let alive = true;
    // separate loads: the team list must not depend on the actions loading
    listEquipe().then(membros => { if (alive) setEquipe(membros); }).catch(error => { if (alive) setErro(acaoErrorMessage(error)); });
    listAcoes()
      .then(lista => { if (alive) setAcoes(lista); })
      .catch(error => { if (alive) setErro(acaoErrorMessage(error)); })
      .finally(() => { if (alive) setCarregando(false); });
    return () => { alive = false; };
  }, []);

  const trocarAcao = updated => {
    setAcoes(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    setSelected(updated);
  };
  const criarAcao = async () => {
    if (!novaAcao.nome.trim() || !novaAcao.data) { setErro("Preencha o nome e a data da ação."); return; }
    setCriando(true); setErro("");
    try {
      const nova = await createAcao({ ...novaAcao, responsavelId: novaAcao.responsavelId ? Number(novaAcao.responsavelId) : null });
      setAcoes(prev => [nova, ...prev].sort((a, b) => b.dataISO.localeCompare(a.dataISO)));
      setShowNovaAcao(false);
      setNovaAcao(NOVA);
    } catch (error) { setErro(acaoErrorMessage(error)); }
    setCriando(false);
  };
  const [aba, setAba] = useState("acoes");

  const TIPOS = ["Ceia de Natal", "Café de Rua", "Sopão da Noite", "Saúde", "Jurídico", "Orfanato", "Lar de Idosos", "Autismo", "Arrecadação", "Educacional", "Outro"];

  if (view === "detail" && selected) {
    return <AcaoDetail key={selected.id} acao={selected} onChange={trocarAcao} equipe={equipe} onBack={() => { setView("list"); setSelected(null); }} mobile={mobile} user={user} />;
  }

  return (
    <div className="aef-ops">
      <div className="aef-ops__head">
        <div>
          <h1 className="aef-ops__title">Operações</h1>
          <p className="aef-ops__desc">{aba === "acoes" ? (carregando ? "Carregando ações…" : `${acoes.length} ações registradas`) : "Tudo que a ONG usa nas ações, e com quem cada coisa está"}</p>
        </div>
        {aba === "acoes" && podeOperar(user) && (
          <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={() => { setErro(""); setShowNovaAcao(true); }}>
            <span aria-hidden="true"><Icon name="plus" size={16} /></span>
            Nova Ação
          </button>
        )}
      </div>

      <nav className="aef-ops__tabs aef-ops__tabs--top" aria-label="Seções de Operações">
        {[["acoes", "Ações"], ["inventario", "Inventário"]].map(([id, label]) => (
          <button key={id} type="button" className="aef-ops__tab" aria-current={aba === id ? "page" : undefined} onClick={() => setAba(id)}>{label}</button>
        ))}
      </nav>

      {aba === "inventario" && <Inventario user={user} acoes={acoes} />}

      {/* Nova Ação modal */}
      {showNovaAcao && (
        <div className="aef-ops__scrim" onClick={() => setShowNovaAcao(false)}>
          <div className="aef-ops__dialog" role="dialog" aria-modal="true" aria-labelledby="ops-nova-title" onClick={e => e.stopPropagation()}>
            <div className="aef-ops__dialog-head">
              <h2 id="ops-nova-title" className="aef-ops__dialog-title">Nova Ação</h2>
              <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => setShowNovaAcao(false)}>Fechar</button>
            </div>
            <div className="aef-ops__dialog-body aef-ops__form">
              {[
                { label: "Nome da ação", key: "nome", type: "text", placeholder: "Ex: Café de Rua, Abril" },
                { label: "Data", key: "data", type: "date", placeholder: "" },
              ].map(f => (
                <div key={f.key} className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor={`ops-nova-${f.key}`}>{f.label}</label>
                  <input id={`ops-nova-${f.key}`} className="aef-ops__input" type={f.type} placeholder={f.placeholder} value={novaAcao[f.key]}
                    onChange={e => setNovaAcao(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="ops-nova-tipo">Tipo de ação</label>
                <select id="ops-nova-tipo" className="aef-ops__select" value={novaAcao.tipo} onChange={e => setNovaAcao(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="ops-nova-resp">Responsável</label>
                <select id="ops-nova-resp" className="aef-ops__select" value={novaAcao.responsavelId} onChange={e => setNovaAcao(p => ({ ...p, responsavelId: e.target.value }))}>
                  <option value="">Definir depois</option>
                  {equipe.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              {erro && <p className="aef-ops__error" role="alert">{erro}</p>}
              <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--block" disabled={criando} onClick={criarAcao}>
                {criando ? "Criando…" : "Criar ação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {aba === "acoes" && erro && !showNovaAcao && <p className="aef-ops__error" role="alert" style={{ marginBottom: "var(--space-md)" }}>{erro}</p>}
      {aba === "acoes" && !carregando && acoes.length === 0 && !erro && (
        <div className="aef-ops__panel aef-ops__empty">
          <p className="aef-ops__h3">Nenhuma ação ainda</p>
          <p className="aef-ops__hint">Crie a primeira em “Nova Ação”. Cada ação finalizada vira um relatório e entra no histórico de quem participou.</p>
        </div>
      )}
      {aba === "acoes" && acoes.length > 0 && <ul className="aef-ops__panel aef-ops__list">
        {acoes.map((a) => (
          <li key={a.id}>
            <button type="button" className="aef-ops__row" data-tema={OPS_TEMA[a.tipo]} onClick={() => { setSelected(a); setView("detail"); }}>
              <div className="aef-ops__row-main">
                <div className="aef-ops__row-title">
                  {OPS_TEMA[a.tipo] === "natal" && <span className="aef-ops__tema-mark" aria-hidden="true"><Icon name="star" size={16} strokeWidth={1.75} /></span>}
                  <span>{a.nome}</span>
                  <span className="aef-ops__tone" data-tone={OPS_TIPO_TONE[a.tipo] || "neutral"}>{a.tipo}</span>
                </div>
                <div className="aef-ops__meta">
                  <span className="aef-ops__meta-item"><span aria-hidden="true"><Icon name="clock" size={13} /></span>{a.data}</span>
                  <span className="aef-ops__meta-item"><span aria-hidden="true"><Icon name="users" size={13} /></span>{a.voluntarios} voluntários</span>
                  {a.relatorio?.publico != null && <span>{a.relatorio.publico} atendidos</span>}
                  {a.responsavel && <span>{a.responsavel}</span>}
                </div>
              </div>
              <div className="aef-ops__row-side">
                <span className="aef-ops__tone aef-ops__cap" data-tone={OPS_STATUS_TONE[a.status] || "neutral"}>{a.status}</span>
                <span aria-hidden="true"><Icon name="chevronRight" size={16} /></span>
              </div>
            </button>
          </li>
        ))}
      </ul>}
    </div>
  );
}
