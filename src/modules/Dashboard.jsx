import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { MARKETING_REQUESTS_SEED, MARKETING_STORAGE_KEYS, readMarketingStore } from "@/data/marketing";
import { formatSize } from "@/lib/format";
import { C, FONT_BODY, FONT_DISPLAY } from "@/lib/theme";
import "../dashboard.css";

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export function BalanceCard({ onClick, mobile }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const saldo = "R$ 3.847,20";
  const entrada = "+ R$ 1.200,00";
  const saida = "− R$ 430,50";

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="aef-dash__balance">
      <div className="aef-dash__balance-head">
        <div>
          <h2 className="aef-dash__balance-title">Resumo financeiro</h2>
          <p className="aef-dash__balance-note">Atualizado agora</p>
        </div>
        <button type="button" className="aef-dash__btn aef-dash__btn--on-accent" aria-label={visible ? "Ocultar valores financeiros" : "Mostrar valores financeiros"} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
          <span aria-hidden="true"><Icon name="eye" size={15} /></span>{visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      <div className="aef-dash__amount" aria-live="polite" aria-busy={loading}>
        {loading ? <span className="aef-dash__skeleton" aria-label="Carregando saldo" /> : <span>{visible ? saldo : "R$ ••••••"}</span>}
      </div>
      <div className="aef-dash__flows">
        <dl className="aef-dash__flow-list">
          <div className="aef-dash__flow aef-dash__flow--in"><dt>Entradas</dt><dd>{visible ? entrada : "••••••"}</dd></div>
          <div className="aef-dash__flow aef-dash__flow--out"><dt>Saídas</dt><dd>{visible ? saida : "••••••"}</dd></div>
        </dl>
        <button type="button" className="aef-dash__btn aef-dash__btn--on-accent" onClick={onClick}>Abrir Financeiro</button>
      </div>
    </div>
  );
}

export const MURAL_TIPOS = {
  acao_iniciada: { icon: "settings", tone: "green", label: "Ação" },
  votacao: { icon: "shield", tone: "amber", label: "Votação" },
  fotos: { icon: "camera", tone: "blue", label: "Marketing" },
  doc: { icon: "file", tone: "red", label: "Jurídico" },
  voluntario: { icon: "users", tone: "purple", label: "RH" },
  acao_concluida: { icon: "check", tone: "neutral", label: "Ação" },
  doacao: { icon: "dollar", tone: "green", label: "Financeiro" },
  demanda_marketing: { icon: "camera", tone: "teal", label: "Marketing" },
};

export const MURAL_EVENTOS = [
  { id: 1, tipo: "acao_iniciada", autor: "Flávia Souza", iniciais: "FS", texto: "deu início à ação", alvo: "Café de Rua", tempo: "há 12 min" },
  { id: 2, tipo: "fotos", autor: "Eder Silva", iniciais: "ES", texto: "adicionou", alvo: "342 fotos ao Acervo", tempo: "há 1h" },
  { id: 3, tipo: "votacao", autor: "Diretoria", iniciais: "DR", texto: "abriu votação:", alvo: "Aprovação do orçamento Maio/2026", tempo: "há 3h" },
  { id: 4, tipo: "doc", autor: "Dr. Rafael Nunes", iniciais: "RN", texto: "subiu documento:", alvo: "Certidão Negativa Receita Federal", tempo: "há 5h" },
  { id: 5, tipo: "voluntario", autor: "Ingrid Lima", iniciais: "IL", texto: "se cadastrou como voluntária em", alvo: "Alimentação", tempo: "ontem" },
  { id: 6, tipo: "doacao", autor: "Doador anônimo", iniciais: "DA", texto: "fez uma doação de", alvo: "R$ 250,00", tempo: "ontem" },
  { id: 7, tipo: "acao_concluida", autor: "Dr. Marcos Farias", iniciais: "MF", texto: "concluiu a ação", alvo: "Saúde — Guamá", tempo: "há 2 dias" },
];

export const VOTACAO_DETALHES = {
  3: {
    titulo: "Aprovação do orçamento Maio/2026",
    descricao: "Orçamento mensal proposto pela Diretoria Financeira: R$ 14.820 distribuídos entre Operações (52%), Alimentação (28%), Marketing (12%) e Reserva (8%).",
    aberta_em: "há 3h",
    encerra_em: "em 21h",
    diretores: [
      { nome: "Flávia Souza", iniciais: "FS", voto: "sim" },
      { nome: "Alan Costa", iniciais: "AC", voto: "sim" },
      { nome: "Dra. Ana Paula", iniciais: "AP", voto: null },
      { nome: "Eder Silva", iniciais: "ES", voto: null, ehVoce: true },
    ],
  },
};

export function gerarAtaVotacao(detalhes, diretores, votos) {
  const total = diretores.length;
  const aprovado = votos.sim > total / 2;
  const dataAtual = new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  const linhas = diretores.map(d => `<tr><td>${d.nome}</td><td>${d.voto === "sim" ? "Aprovou" : d.voto === "nao" ? "Reprovou" : d.voto === "abster" ? "Absteve-se" : "Não votou"}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Ata — ${detalhes.titulo}</title><style>
body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;color:#1D1D1F;line-height:1.6}
h1{font-size:22px;border-bottom:2px solid #D70D16;padding-bottom:10px}
h2{font-size:16px;margin-top:28px;color:#851811}
.meta{background:#F5F5F7;padding:14px 18px;border-radius:8px;font-size:14px;margin:16px 0}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{padding:10px 12px;border-bottom:1px solid #E8E8ED;text-align:left;font-size:14px}
th{background:#F5F5F7;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
.resultado{padding:18px 22px;border-radius:10px;margin-top:18px;font-weight:600}
.aprovado{background:rgba(34,197,94,0.10);color:#15803D;border:1px solid rgba(34,197,94,0.3)}
.reprovado{background:rgba(215,13,22,0.08);color:#D70D16;border:1px solid rgba(215,13,22,0.3)}
.assinatura{margin-top:40px;padding-top:20px;border-top:1px solid #E8E8ED;font-size:12px;color:#6E6E73}
</style></head><body>
<h1>Ata de Votação — Diretoria AEF</h1>
<div class="meta"><b>Encerrada em:</b> ${dataAtual}<br/><b>Quórum:</b> ${total} diretores</div>
<h2>Pauta</h2>
<p><b>${detalhes.titulo}</b></p>
<p>${detalhes.descricao}</p>
<h2>Apuração</h2>
<table><thead><tr><th>Diretor(a)</th><th>Voto</th></tr></thead><tbody>${linhas}</tbody></table>
<h2>Resultado</h2>
<div class="resultado ${aprovado ? "aprovado" : "reprovado"}">
${aprovado ? "✓ APROVADO" : "✗ REPROVADO"} — ${votos.sim} aprovaram · ${votos.nao} reprovaram · ${votos.abster} abstiveram-se
</div>
<div class="assinatura">Documento gerado automaticamente pelo AEF Hub em ${dataAtual}. Esta ata constitui registro oficial da deliberação da Diretoria conforme Estatuto Social da Amor em Foco.</div>
</body></html>`;
  return "data:text/html;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(html)));
}

export function ModalVotacao({ eventoId, onClose }) {
  const detalhes = VOTACAO_DETALHES[eventoId];
  const [diretores, setDiretores] = useState(() => {
    try {
      const stored = localStorage.getItem(`aef_votacao_${eventoId}`);
      return stored ? JSON.parse(stored) : detalhes.diretores;
    } catch { return detalhes.diretores; }
  });
  const [arquivada, setArquivada] = useState(() => {
    try { return localStorage.getItem(`aef_votacao_${eventoId}_arquivada`) === "true"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(`aef_votacao_${eventoId}`, JSON.stringify(diretores)); } catch {}
  }, [diretores, eventoId]);

  const votar = (escolha) => {
    setDiretores(prev => prev.map(d => d.ehVoce ? { ...d, voto: escolha } : d));
  };

  const arquivar = () => {
    const conteudo = gerarAtaVotacao(detalhes, diretores, votos);
    const hoje = new Date();
    const dataBR = hoje.toLocaleDateString("pt-BR");
    const novoDoc = {
      id: Date.now(),
      nome: `Ata Votação — ${detalhes.titulo}.html`,
      categoria: "estatuto",
      tamanho: formatSize(conteudo.length),
      tipo: "text/html",
      data: dataBR,
      responsavel: "Diretoria (gerado pelo Hub)",
      vigente: true,
      validade: null,
      conteudo,
    };
    try {
      const existentes = JSON.parse(localStorage.getItem("aef_juridico_docs") || "[]");
      localStorage.setItem("aef_juridico_docs", JSON.stringify([novoDoc, ...existentes]));
      localStorage.setItem(`aef_votacao_${eventoId}_arquivada`, "true");
      setArquivada(true);
    } catch (e) {
      alert("Erro ao arquivar: " + e.message);
    }
  };

  const meuVoto = diretores.find(d => d.ehVoce)?.voto;
  const votos = {
    sim: diretores.filter(d => d.voto === "sim").length,
    nao: diretores.filter(d => d.voto === "nao").length,
    abster: diretores.filter(d => d.voto === "abster").length,
  };
  const totalVotaram = votos.sim + votos.nao + votos.abster;
  const total = diretores.length;
  const pctSim = total > 0 ? (votos.sim / total) * 100 : 0;
  const pctNao = total > 0 ? (votos.nao / total) * 100 : 0;
  const pctAbster = total > 0 ? (votos.abster / total) * 100 : 0;

  const opcoes = [
    { id: "sim", label: "Aprovar", cor: "#15803D", bg: "rgba(34,197,94,0.10)", borda: "rgba(34,197,94,0.4)" },
    { id: "nao", label: "Reprovar", cor: C.red, bg: "rgba(215,13,22,0.08)", borda: "rgba(215,13,22,0.4)" },
    { id: "abster", label: "Abster", cor: C.textSecondary, bg: C.bg, borda: C.border },
  ];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 500, padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.white, borderRadius: 18, padding: 26,
        width: "100%", maxWidth: 520, fontFamily: FONT_BODY,
        maxHeight: "92vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#B45309", background: "rgba(245,158,11,0.14)", padding: "3px 8px", borderRadius: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Votação aberta
          </span>
          <span style={{ fontSize: 11, color: C.textTertiary }}>encerra {detalhes.encerra_em}</span>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.4, margin: "0 0 8px", fontFamily: FONT_DISPLAY }}>{detalhes.titulo}</h2>
        <p style={{ color: C.textSecondary, fontSize: 13.5, lineHeight: 1.5, margin: "0 0 22px" }}>{detalhes.descricao}</p>

        {/* Barra de progresso */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Resultado parcial</span>
            <span style={{ fontSize: 12, color: C.textTertiary }}>{totalVotaram} de {total} diretores</span>
          </div>
          <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: C.borderLight }}>
            {pctSim > 0 && <div style={{ width: `${pctSim}%`, background: "#22C55E" }} />}
            {pctNao > 0 && <div style={{ width: `${pctNao}%`, background: C.red }} />}
            {pctAbster > 0 && <div style={{ width: `${pctAbster}%`, background: C.textTertiary }} />}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12, color: C.textSecondary }}>
            <span><b style={{ color: "#15803D" }}>{votos.sim}</b> aprovar</span>
            <span><b style={{ color: C.red }}>{votos.nao}</b> reprovar</span>
            <span><b style={{ color: C.textSecondary }}>{votos.abster}</b> abster</span>
          </div>
        </div>

        {/* Lista de diretores */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Diretoria</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {diretores.map(d => (
              <div key={d.nome} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: d.ehVoce ? C.red : C.borderLight, color: d.ehVoce ? C.white : C.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{d.iniciais}</div>
                <span style={{ fontSize: 13, color: C.text, flex: 1, fontWeight: d.ehVoce ? 600 : 500 }}>{d.nome}{d.ehVoce && <span style={{ color: C.textTertiary, fontWeight: 400 }}> (você)</span>}</span>
                {d.voto ? (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 10, color: d.voto === "sim" ? "#15803D" : d.voto === "nao" ? C.red : C.textSecondary, background: d.voto === "sim" ? "rgba(34,197,94,0.10)" : d.voto === "nao" ? "rgba(215,13,22,0.08)" : C.bg }}>
                    {d.voto === "sim" ? "Aprovou" : d.voto === "nao" ? "Reprovou" : "Absteve"}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: C.textTertiary }}>aguardando</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Estado arquivado */}
        {arquivada ? (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Icon name="check" size={16} color="#15803D" strokeWidth={2.5} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>Votação encerrada e arquivada</span>
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginLeft: 24 }}>
              A ata foi salva no Jurídico em <b>Estatuto & Atas</b>. Acesse o módulo Jurídico para baixar ou visualizar.
            </div>
          </div>
        ) : (
          <>
            {/* Botões de voto */}
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Seu voto</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {opcoes.map(op => {
                const ativo = meuVoto === op.id;
                return (
                  <button key={op.id} onClick={() => votar(op.id)} style={{
                    flex: 1, padding: "12px 8px", borderRadius: 10,
                    border: `1.5px solid ${ativo ? op.borda : C.border}`,
                    background: ativo ? op.bg : C.white,
                    color: ativo ? op.cor : C.textSecondary,
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: FONT_BODY, transition: "all 0.15s",
                  }}>
                    {op.label}
                  </button>
                );
              })}
            </div>

            {/* Encerrar e arquivar */}
            <button
              onClick={() => {
                if (totalVotaram === 0) {
                  alert("Nenhum voto registrado ainda.");
                  return;
                }
                const msg = totalVotaram < total
                  ? `Apenas ${totalVotaram} de ${total} diretores votaram. Encerrar mesmo assim e arquivar?`
                  : "Encerrar votação e arquivar a ata no Jurídico?";
                if (confirm(msg)) arquivar();
              }}
              style={{
                width: "100%", padding: "12px", marginBottom: 10,
                background: C.red, color: C.white, border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 16px rgba(215,13,22,0.22)",
              }}>
              <Icon name="shield" size={15} color={C.white} strokeWidth={2} />
              Encerrar e arquivar no Jurídico
            </button>
          </>
        )}

        <button onClick={onClose} style={{
          width: "100%", padding: "11px", background: C.white, color: C.textSecondary,
          border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>Fechar</button>
      </div>
    </div>
  );
}

export function Mural({ mobile }) {
  const [expandido, setExpandido] = useState(false);
  const [votacaoAberta, setVotacaoAberta] = useState(null);
  const demandasMarketing = readMarketingStore(MARKETING_STORAGE_KEYS.requests, MARKETING_REQUESTS_SEED);
  const atividadesMarketing = demandasMarketing.flatMap((demanda) => {
    const solicitacao = {
      id: `marketing-request-${demanda.id}`,
      tipo: "demanda_marketing",
      autor: demanda.solicitante || demanda.setor,
      texto: "solicitou ao Marketing:",
      alvo: demanda.titulo,
      tempo: demanda.tempoSolicitacao || "recentemente",
    };
    if (demanda.status === "brief_recebido") return [solicitacao];
    const statusTexto = {
      em_producao: "iniciou a produção de",
      em_aprovacao: "enviou para aprovação:",
      entregue: "concluiu a demanda",
    }[demanda.status] || "atualizou a demanda";
    return [{
      id: `marketing-status-${demanda.id}-${demanda.status}`,
      tipo: "demanda_marketing",
      autor: "Equipe de Marketing",
      texto: statusTexto,
      alvo: demanda.titulo,
      tempo: demanda.tempoAtualizacao || "recentemente",
    }, solicitacao];
  });
  const eventosMural = [...atividadesMarketing, ...MURAL_EVENTOS];
  const limite = mobile && !expandido ? 3 : eventosMural.length;
  const visiveis = eventosMural.slice(0, limite);
  const restantes = eventosMural.length - limite;

  return (
    <div className="aef-dash__panel aef-dash__mural">
      <div className="aef-dash__mural-head">
        <div>
          <h2 className="aef-dash__h2">Mural</h2>
          <p className="aef-dash__hint">Movimentações de todos os setores</p>
        </div>
        <span className="aef-dash__aside">{eventosMural.length} atividades</span>
      </div>
      <ul className={mobile ? "aef-dash__feed" : "aef-dash__feed aef-dash__feed--scroll"}>
        {visiveis.map((ev) => {
          const cfg = MURAL_TIPOS[ev.tipo] || MURAL_TIPOS.doc;
          const clicavel = ev.tipo === "votacao" && VOTACAO_DETALHES[ev.id];
          return (
            <li key={ev.id} className="aef-dash__event" data-tone={cfg.tone} data-clickable={clicavel ? "true" : undefined} onClick={clicavel ? () => setVotacaoAberta(ev.id) : undefined}>
              <span className="aef-dash__icon" aria-hidden="true"><Icon name={cfg.icon} size={18} strokeWidth={2} /></span>
              <div>
                <p className="aef-dash__event-text">
                  <span className="aef-dash__event-who">{ev.autor}</span>
                  <span className="aef-dash__event-verb"> {ev.texto} </span>
                  <span className="aef-dash__event-what">{ev.alvo}</span>
                </p>
                <p className="aef-dash__event-sector">{cfg.label}</p>
              </div>
              <div className="aef-dash__event-side">
                <span className="aef-dash__event-time">{ev.tempo}</span>
                {clicavel && (
                  <button type="button" className="aef-dash__btn aef-dash__btn--vote" onClick={(e) => { e.stopPropagation(); setVotacaoAberta(ev.id); }}>Votar</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {mobile && restantes > 0 && (
        <button type="button" className="aef-dash__btn aef-dash__btn--quiet" onClick={() => setExpandido(true)}>
          Ver mais {restantes} {restantes === 1 ? "atividade" : "atividades"}
        </button>
      )}
      {mobile && expandido && (
        <button type="button" className="aef-dash__btn aef-dash__btn--quiet aef-dash__btn--muted" onClick={() => setExpandido(false)}>
          Mostrar menos
        </button>
      )}
      {votacaoAberta && <ModalVotacao eventoId={votacaoAberta} onClose={() => setVotacaoAberta(null)} />}
    </div>
  );
}

export function Dashboard({ setActive, mobile, user }) {
  const now = new Date();
  const today = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const hora = now.getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] || "Eder";

  const indicadores = [
    { icon: "users", tone: "green", label: "Voluntários", value: "134", sub: "+12 mês", area: "rh" },
    { icon: "settings", tone: "amber", label: "Ações", value: "3", sub: "este mês", area: "operacoes" },
    { icon: "dollar", tone: "red", label: "Doadores", value: "47", sub: "ativos", area: "financeiro" },
    { icon: "camera", tone: "blue", label: "Posts", value: "8", sub: "publicados", area: "marketing" },
    { icon: "eye", tone: "purple", label: "Views site", value: "12,4k", sub: "+18%", area: "marketing" },
    { icon: "eye", tone: "teal", label: "Views redes", value: "8,7k", sub: "+24%", area: "marketing" },
  ];

  return (
    <div className="aef-dash">
      <header>
        <h1 className="aef-dash__title">{saudacao}, {firstName}</h1>
        <p className="aef-dash__date">{today}</p>
      </header>

      <div className="aef-dash__top">
        <section aria-label="Resumo financeiro">
          <BalanceCard onClick={() => setActive("financeiro")} mobile={mobile} />
        </section>

        <section className="aef-dash__panel aef-dash__action" aria-labelledby="dashboard-actions">
          <h2 id="dashboard-actions" className="aef-dash__h2">Ações em andamento</h2>
          <div className="aef-dash__action-head">
            <p><span className="aef-dash__state" role="status">Em andamento</span> <span className="aef-dash__state-note">Operação ativa</span></p>
            <span className="aef-dash__pending">8 tarefas pendentes</span>
          </div>
          <div>
            <h3 className="aef-dash__action-title">Café de Rua</h3>
            <p className="aef-dash__when"><span aria-hidden="true"><Icon name="calendar" size={14} /></span>26 de abril</p>
          </div>
          <div className="aef-dash__progress" role="progressbar" aria-label="Progresso da ação" aria-valuemin={0} aria-valuemax={100} aria-valuenow={62}><span style={{ width: "62%" }} /></div>
          <div className="aef-dash__action-foot">
            <p className="aef-dash__hint">Acompanhe as operações que estão sendo executadas.</p>
            <button type="button" className="aef-dash__btn aef-dash__btn--primary" onClick={() => setActive("operacoes")}>Ver POP</button>
          </div>
        </section>
      </div>

      <section className="aef-dash__section" aria-labelledby="dashboard-indicators">
        <div className="aef-dash__section-head">
          <div>
            <h2 id="dashboard-indicators" className="aef-dash__h2">Indicadores principais</h2>
            <p className="aef-dash__hint">Selecione um indicador para abrir a área responsável.</p>
          </div>
          <span className="aef-dash__aside">Atualização automática</span>
        </div>
        <ul className="aef-dash__figures">
          {indicadores.map(item => (
            <li key={item.label}>
              <button type="button" className="aef-dash__figure" data-tone={item.tone} aria-label={"Abrir " + item.label + ": " + item.value + " " + item.sub} onClick={() => setActive(item.area)}>
                <span className="aef-dash__figure-label"><span className="aef-dash__icon" aria-hidden="true"><Icon name={item.icon} size={16} strokeWidth={2} /></span>{item.label}</span>
                <span className="aef-dash__figure-value">{item.value}</span>
                <span className="aef-dash__figure-sub">{item.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Mural de atividades">
        <Mural mobile={mobile} />
      </section>
    </div>
  );
}
