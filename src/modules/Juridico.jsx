import { useState, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { formatSize } from "@/lib/format";
import "../juridico.css";

// ─── JURÍDICO ─────────────────────────────────────────────────────────────────
const JURIDICO_CATEGORIAS = [
  { id: "certidoes", label: "Certidões Obrigatórias" },
  { id: "estatuto", label: "Estatuto & Atas" },
  { id: "cnpj", label: "CNPJ & Receita" },
  { id: "contratos", label: "Contratos" },
  { id: "declaracoes", label: "Declarações" },
  { id: "parcerias", label: "Parcerias & Convênios" },
  { id: "outros", label: "Outros" },
];

const isoEmDias = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const JURIDICO_SEED = [
  { id: 1, nome: "Estatuto Social AEF.pdf", categoria: "estatuto", tamanho: "412 KB", data: "12/01/2024", responsavel: "Diretoria", vigente: true },
  { id: 2, nome: "Cartão CNPJ 2025.pdf", categoria: "cnpj", tamanho: "98 KB", data: "03/02/2025", responsavel: "Financeiro", vigente: true },
  { id: 3, nome: "Ata de Posse — Diretoria 2024.pdf", categoria: "estatuto", tamanho: "256 KB", data: "20/01/2024", responsavel: "Diretoria", vigente: true },
  { id: 4, nome: "Certidão Negativa Receita Federal.pdf", categoria: "certidoes", tamanho: "82 KB", data: "10/03/2025", responsavel: "Financeiro", vigente: true, validade: isoEmDias(18) },
  { id: 5, nome: "Certidão Regularidade FGTS.pdf", categoria: "certidoes", tamanho: "64 KB", data: "01/02/2025", responsavel: "Financeiro", vigente: true, validade: isoEmDias(-12) },
  { id: 6, nome: "Certidão Justiça do Trabalho.pdf", categoria: "certidoes", tamanho: "78 KB", data: "15/03/2025", responsavel: "Financeiro", vigente: true, validade: isoEmDias(95) },
  { id: 7, nome: "Estatuto Social AEF — versão 2019.pdf", categoria: "estatuto", tamanho: "388 KB", data: "08/05/2019", responsavel: "Diretoria", vigente: false },
];


function statusValidade(iso) {
  if (!iso) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(iso + "T00:00:00");
  const dias = Math.round((venc - hoje) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { tipo: "vencido", dias, label: `Vencido há ${Math.abs(dias)}d`, cor: "#D70D16", bg: "rgba(215,13,22,0.1)" };
  if (dias <= 30) return { tipo: "vencendo", dias, label: `Vence em ${dias}d`, cor: "#B45309", bg: "rgba(245,158,11,0.12)" };
  return { tipo: "ok", dias, label: `Vence em ${dias}d`, cor: "#15803D", bg: "rgba(34,197,94,0.1)" };
}

function formatDataBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function Juridico({ mobile }) {
  const [tight, setTight] = useState(typeof window !== "undefined" && window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setTight(window.innerWidth < 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  const [docs, setDocs] = useState(() => {
    try {
      const stored = localStorage.getItem("aef_juridico_docs");
      return stored ? JSON.parse(stored) : JURIDICO_SEED;
    } catch { return JURIDICO_SEED; }
  });
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("aef_juridico_docs", JSON.stringify(docs));
    } catch (e) {
      console.warn("Storage cheio — documentos grandes podem não persistir entre sessões", e);
    }
  }, [docs]);

  const filtrados = docs.filter(d => {
    if (!mostrarHistorico && d.vigente === false) return false;
    if (filtro !== "todos" && d.categoria !== filtro) return false;
    if (busca && !d.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const alertas = docs
    .filter(d => d.vigente !== false && d.validade)
    .map(d => ({ doc: d, status: statusValidade(d.validade) }))
    .filter(x => x.status && x.status.tipo !== "ok")
    .sort((a, b) => a.status.dias - b.status.dias);

  const handleFiles = async (files) => {
    setUploadError("");
    const MAX = 8 * 1024 * 1024;
    const arquivos = Array.from(files);
    const grande = arquivos.find(f => f.size > MAX);
    if (grande) {
      setUploadError(`"${grande.name}" tem mais de 8 MB. O armazenamento local não suporta arquivos tão grandes.`);
      return;
    }
    try {
      const novos = await Promise.all(arquivos.map((f, i) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          id: Date.now() + i,
          nome: f.name,
          categoria: "outros",
          tamanho: formatSize(f.size),
          tipo: f.type || "application/octet-stream",
          data: new Date().toLocaleDateString("pt-BR"),
          responsavel: "Você",
          vigente: true,
          validade: null,
          conteudo: reader.result,
        });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(f);
      })));
      setDocs(prev => [...novos, ...prev]);
      setShowUpload(false);
    } catch (e) {
      setUploadError("Erro ao ler arquivo: " + (e?.message || e));
    }
  };

  const baixarDoc = (doc) => {
    if (!doc.conteudo) {
      alert("Este documento de exemplo não tem arquivo anexado. Faça upload de um arquivo real para testar o download.");
      return;
    }
    const a = document.createElement("a");
    a.href = doc.conteudo;
    a.download = doc.nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const removerDoc = (id) => {
    if (confirm("Remover este documento?")) setDocs(prev => prev.filter(d => d.id !== id));
  };

  const catLabel = (id) => JURIDICO_CATEGORIAS.find(c => c.id === id)?.label || id;

  const tomDoStatus = { vencido: "red", vencendo: "amber", ok: "green" };
  const vencidos = alertas.filter(a => a.status.tipo === "vencido").length;
  const vencendo = alertas.filter(a => a.status.tipo === "vencendo").length;

  return (
    <div className="aef-jur">
      <div className="aef-jur__head">
        <div>
          <h1 className="aef-jur__title">Jurídico</h1>
          <p className="aef-jur__desc">Repositório de documentos oficiais da ONG</p>
        </div>
        <button type="button" onClick={() => setShowUpload(true)} className="aef-jur__btn aef-jur__btn--primary">
          <span aria-hidden="true"><Icon name="upload" size={16} strokeWidth={2} /></span>
          Novo documento
        </button>
      </div>

      <ul className="aef-jur__figures">
        <li className="aef-jur__figure"><span className="aef-jur__figure-label">Total vigentes</span><span className="aef-jur__figure-value">{docs.filter(d => d.vigente !== false).length}</span></li>
        <li className="aef-jur__figure" data-tone={vencidos ? "red" : undefined}><span className="aef-jur__figure-label">Vencidos</span><span className="aef-jur__figure-value">{vencidos}</span></li>
        <li className="aef-jur__figure" data-tone={vencendo ? "amber" : undefined}><span className="aef-jur__figure-label">Vencendo (30d)</span><span className="aef-jur__figure-value">{vencendo}</span></li>
        <li className="aef-jur__figure"><span className="aef-jur__figure-label">Certidões</span><span className="aef-jur__figure-value">{docs.filter(d => d.categoria === "certidoes" && d.vigente !== false).length}</span></li>
      </ul>

      <div className="aef-jur__panel aef-jur__toolbar">
        <div className="aef-jur__search">
          <span className="aef-jur__search-icon" aria-hidden="true"><Icon name="search" size={16} /></span>
          <input
            className="aef-jur__input"
            type="search"
            aria-label="Buscar documento"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar documento…"
          />
        </div>
        <div className="aef-jur__chips" role="group" aria-label="Filtrar por categoria">
          {[{ id: "todos", label: "Todos" }, ...JURIDICO_CATEGORIAS].map(cat => {
            const ativo = filtro === cat.id;
            return (
              <button key={cat.id} type="button" className="aef-jur__chip" aria-pressed={ativo} onClick={() => setFiltro(cat.id)}>
                {cat.label}
              </button>
            );
          })}
        </div>
        <label className="aef-jur__check">
          <input type="checkbox" checked={mostrarHistorico} onChange={(e) => setMostrarHistorico(e.target.checked)} />
          Mostrar versões históricas ({docs.filter(d => d.vigente === false).length})
        </label>
      </div>

      <div className="aef-jur__panel aef-jur__register">
        {filtrados.length === 0 ? (
          <div className="aef-jur__empty">
            <span className="aef-jur__empty-icon" aria-hidden="true"><Icon name="file" size={24} /></span>
            <h2 className="aef-jur__h2">Nenhum documento encontrado</h2>
            <p className="aef-jur__desc">Faça upload do primeiro documento para começar</p>
          </div>
        ) : (
          <>
            <div className="aef-jur__cols" aria-hidden="true">
              <span>Documento</span><span>Categoria</span><span>Validade</span><span>Enviado</span><span>Responsável</span><span />
            </div>
            <ul className="aef-jur__register">
              {filtrados.map((doc) => {
                const status = statusValidade(doc.validade);
                const historico = doc.vigente === false;
                const validade = status && !historico ? <span className="aef-jur__validity" data-tone={tomDoStatus[status.tipo]}>{status.label}</span> : null;
                return (
                  <li key={doc.id} className="aef-jur__doc" data-historic={historico ? "true" : undefined}>
                    <div className="aef-jur__doc-main">
                      <div className="aef-jur__doc-name">
                        <span>{doc.nome}</span>
                        {historico && <span className="aef-jur__tag">Histórico</span>}
                      </div>
                      <div className="aef-jur__doc-sub">
                        <span>{doc.tamanho}</span>
                        <span className="aef-jur__sub-meta">{catLabel(doc.categoria)}</span>
                        <span className="aef-jur__sub-meta">{doc.data}</span>
                        {!mobile && <span className="aef-jur__sub-meta">{doc.responsavel}</span>}
                        {validade && <span className="aef-jur__sub-validity">{validade}</span>}
                      </div>
                    </div>
                    <span className="aef-jur__cell">{catLabel(doc.categoria)}</span>
                    <span className="aef-jur__cell">{validade}</span>
                    <span className="aef-jur__cell">{doc.data}</span>
                    <span className="aef-jur__cell">{doc.responsavel}</span>
                    <div className="aef-jur__actions">
                      <button type="button" className="aef-jur__icon-btn" title="Editar" aria-label={"Editar " + doc.nome} onClick={() => setEditing(doc)}>
                        <Icon name="settings" size={15} />
                      </button>
                      <button type="button" className="aef-jur__icon-btn" title="Visualizar" aria-label={"Visualizar " + doc.nome} onClick={() => setViewing(doc)}>
                        <Icon name="eye" size={15} />
                      </button>
                      <button type="button" className="aef-jur__icon-btn" title="Baixar" aria-label={"Baixar " + doc.nome} onClick={() => baixarDoc(doc)}>
                        <Icon name="download" size={15} />
                      </button>
                      <button type="button" className="aef-jur__icon-btn aef-jur__icon-btn--danger" title="Remover" aria-label={"Remover " + doc.nome} onClick={() => removerDoc(doc.id)}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Modal Upload */}
      {showUpload && (
        <div className="aef-jur__scrim" onClick={() => setShowUpload(false)}>
          <div className="aef-jur__dialog" role="dialog" aria-modal="true" aria-labelledby="jur-upload-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="jur-upload-title" className="aef-jur__dialog-title">Enviar documento</h2>
            <p className="aef-jur__dialog-sub">Selecione um ou mais arquivos do seu computador</p>
            <label className="aef-jur__drop">
              <span className="aef-jur__drop-icon" aria-hidden="true"><Icon name="upload" size={28} /></span>
              <span className="aef-jur__drop-title">Clique para escolher arquivos</span>
              <span className="aef-jur__drop-note">PDF, DOC, JPG, PNG (até 8MB)</span>
              <input type="file" multiple onChange={(e) => handleFiles(e.target.files)} />
            </label>
            {uploadError && <p className="aef-jur__error" role="alert">{uploadError}</p>}
            <button type="button" className="aef-jur__btn aef-jur__btn--outline aef-jur__btn--block" onClick={() => { setShowUpload(false); setUploadError(""); }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editing && (
        <div className="aef-jur__scrim" onClick={() => setEditing(null)}>
          <div className="aef-jur__dialog" role="dialog" aria-modal="true" aria-labelledby="jur-edit-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="jur-edit-title" className="aef-jur__dialog-title">Editar documento</h2>
            <p className="aef-jur__dialog-sub">{editing.nome}</p>

            <div className="aef-jur__fields">
              <div className="aef-jur__field">
                <label className="aef-jur__label" htmlFor="jur-categoria">Categoria</label>
                <select
                  id="jur-categoria"
                  className="aef-jur__select"
                  value={editing.categoria}
                  onChange={(e) => setEditing({ ...editing, categoria: e.target.value })}
                >
                  {JURIDICO_CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div className="aef-jur__field">
                <label className="aef-jur__label" htmlFor="jur-validade">Validade (opcional)</label>
                <input
                  id="jur-validade"
                  className="aef-jur__input"
                  type="date"
                  value={editing.validade || ""}
                  onChange={(e) => setEditing({ ...editing, validade: e.target.value || null })}
                />
                {editing.validade && (() => {
                  const s = statusValidade(editing.validade);
                  return s ? <p className="aef-jur__field-note" data-tone={tomDoStatus[s.tipo]}>{s.label} ({formatDataBR(editing.validade)})</p> : null;
                })()}
              </div>

              <div className="aef-jur__field">
                <label className="aef-jur__label" htmlFor="jur-responsavel">Responsável</label>
                <input
                  id="jur-responsavel"
                  className="aef-jur__input"
                  type="text"
                  value={editing.responsavel || ""}
                  onChange={(e) => setEditing({ ...editing, responsavel: e.target.value })}
                />
              </div>

              <label className="aef-jur__toggle">
                <input
                  type="checkbox"
                  checked={editing.vigente !== false}
                  onChange={(e) => setEditing({ ...editing, vigente: e.target.checked })}
                />
                <span>
                  <span className="aef-jur__toggle-title">Documento vigente</span><br />
                  <span className="aef-jur__toggle-note">Desmarque se for uma versão antiga (Estatuto v1, ata revogada, etc.)</span>
                </span>
              </label>
            </div>

            <div className="aef-jur__dialog-actions">
              <button type="button" className="aef-jur__btn aef-jur__btn--outline" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="button" className="aef-jur__btn aef-jur__btn--primary" onClick={() => {
                setDocs(prev => prev.map(d => d.id === editing.id ? editing : d));
                setEditing(null);
              }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar */}
      {viewing && (
        <div className="aef-jur__scrim aef-jur__scrim--viewer" onClick={() => setViewing(null)}>
          <div className="aef-jur__viewer" role="dialog" aria-modal="true" aria-labelledby="jur-view-title" onClick={(e) => e.stopPropagation()}>
            <div className="aef-jur__viewer-bar">
              <div className="aef-jur__viewer-title">
                <h2 id="jur-view-title" className="aef-jur__viewer-name">{viewing.nome}</h2>
                <div className="aef-jur__doc-sub"><span>{catLabel(viewing.categoria)}</span><span>{viewing.tamanho}</span><span>{viewing.data}</span></div>
              </div>
              <button type="button" title="Baixar" className="aef-jur__btn aef-jur__btn--primary" onClick={() => baixarDoc(viewing)}>
                <span aria-hidden="true"><Icon name="download" size={14} strokeWidth={2} /></span>
                {!mobile && "Baixar"}
              </button>
              <button type="button" title="Fechar" className="aef-jur__btn aef-jur__btn--outline" onClick={() => setViewing(null)}>Fechar</button>
            </div>
            <div className="aef-jur__viewer-body">
              {!viewing.conteudo ? (
                <div className="aef-jur__viewer-empty">
                  <span className="aef-jur__empty-icon" aria-hidden="true"><Icon name="file" size={24} /></span>
                  <h3 className="aef-jur__h2">Sem visualização disponível</h3>
                  <p>Este é um documento de exemplo sem arquivo anexado.</p>
                </div>
              ) : viewing.tipo?.startsWith("image/") ? (
                <img src={viewing.conteudo} alt={viewing.nome} />
              ) : viewing.tipo === "application/pdf" ? (
                <iframe src={viewing.conteudo} title={viewing.nome} />
              ) : viewing.tipo?.startsWith("text/") || viewing.tipo?.includes("json") ? (
                <iframe src={viewing.conteudo} title={viewing.nome} />
              ) : (
                <div className="aef-jur__viewer-empty">
                  <span className="aef-jur__empty-icon" aria-hidden="true"><Icon name="file" size={24} /></span>
                  <h3 className="aef-jur__h2">Pré-visualização não suportada</h3>
                  <p>Tipo: {viewing.tipo || "desconhecido"}. Use o botão Baixar para abrir no seu computador.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Juridico;
