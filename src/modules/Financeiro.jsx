import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { formatSize } from "@/lib/format";
import { C } from "@/lib/theme";
import "../financeiro.css";

// ─── FINANCEIRO ───────────────────────────────────────────────────────────────
export const FIN_CATEGORIAS = {
  doacao: { label: "Doação", cor: "#15803D", bg: "rgba(34,197,94,0.10)" },
  alimentacao: { label: "Alimentação", cor: "#7E22CE", bg: "rgba(126,34,206,0.10)" },
  transporte: { label: "Transporte", cor: "#C2410C", bg: "rgba(194,65,12,0.10)" },
  utilidades: { label: "Utilidades", cor: "#1D4ED8", bg: "rgba(29,78,216,0.10)" },
  marketing: { label: "Marketing", cor: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  tarifa: { label: "Tarifa", cor: "#6E6E73", bg: "#F2F2F7" },
  reembolso: { label: "Reembolso", cor: "#B45309", bg: "rgba(245,158,11,0.14)" },
  nao_categorizado: { label: "Não categorizado", cor: "#6E6E73", bg: "#F2F2F7" },
};

export const FIN_AREAS = {
  alimentacao: { label: "Alimentação", cor: "#7E22CE", bg: "rgba(126,34,206,0.10)" },
  saude: { label: "Saúde", cor: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  social: { label: "Social", cor: "#15803D", bg: "rgba(34,197,94,0.10)" },
  marketing: { label: "Marketing", cor: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  admin: { label: "Administrativo", cor: "#6E6E73", bg: "#F2F2F7" },
};

export const FIN_TRANSACOES_MOCK = [
  // Maio 2026
  { id: 1, data: "2026-05-11", hora: "14:22", tipo: "pix_in", descricao: "PIX recebido — Maria L. Santos", contraparte: "Maria L. Santos", valor: 250.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null, txid: "AEF-PIX-A8F2" },
  { id: 2, data: "2026-05-11", hora: "10:08", tipo: "pix_in", descricao: "PIX recebido — Carlos H. Mendes", contraparte: "Carlos H. Mendes", valor: 50.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 3, data: "2026-05-10", hora: "16:45", tipo: "boleto_pago", descricao: "Atacadão — Compras Café de Rua", contraparte: "Atacadão SA", valor: -420.50, categoria: "alimentacao", area: "alimentacao", conta: "Cora", conciliado: true, acaoId: 1 },
  { id: 4, data: "2026-05-10", hora: "09:30", tipo: "pix_in", descricao: "PIX recebido — Doador Anônimo", contraparte: "Anônimo", valor: 100.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 5, data: "2026-05-09", hora: "11:15", tipo: "pix_out", descricao: "PIX enviado — Posto Ipiranga (gasolina)", contraparte: "Posto Ipiranga", valor: -180.00, categoria: "transporte", area: "alimentacao", conta: "Cora", conciliado: true, acaoId: 1 },
  { id: 6, data: "2026-05-08", hora: "18:00", tipo: "pix_in", descricao: "PIX recebido — Igreja Batista Central", contraparte: "Igreja Batista Central", valor: 800.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 7, data: "2026-05-07", hora: "13:20", tipo: "boleto_pago", descricao: "Equatorial Pará — Conta de luz", contraparte: "Equatorial Pará", valor: -312.40, categoria: "utilidades", area: "admin", conta: "Cora", conciliado: true, acaoId: null },
  { id: 8, data: "2026-05-06", hora: "08:00", tipo: "tarifa", descricao: "Tarifa mensal Cora PJ", contraparte: "Cora", valor: -29.90, categoria: "tarifa", area: "admin", conta: "Cora", conciliado: true, acaoId: null },
  { id: 9, data: "2026-05-05", hora: "15:42", tipo: "pix_in", descricao: "PIX recebido — Fernanda Albuquerque", contraparte: "Fernanda Albuquerque", valor: 200.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 10, data: "2026-05-04", hora: "10:00", tipo: "pix_out", descricao: "PIX enviado — Gráfica Belém (folders)", contraparte: "Gráfica Belém", valor: -240.00, categoria: "marketing", area: "marketing", conta: "Cora", conciliado: false, acaoId: null },
  { id: 11, data: "2026-05-03", hora: "19:55", tipo: "pix_in", descricao: "PIX recebido — Luís F. Almeida", contraparte: "Luís F. Almeida", valor: 75.00, categoria: "nao_categorizado", conta: "Cora", conciliado: false, acaoId: null },
  { id: 12, data: "2026-05-02", hora: "14:00", tipo: "pix_in", descricao: "PIX recebido — Empresa Belém Distribuidora", contraparte: "Belém Distrib. Ltda", valor: 1500.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 13, data: "2026-05-01", hora: "11:32", tipo: "boleto_pago", descricao: "Cosanpa — Conta de água", contraparte: "Cosanpa", valor: -98.20, categoria: "utilidades", area: "admin", conta: "Cora", conciliado: true, acaoId: null },
  // Abril 2026
  { id: 14, data: "2026-04-28", hora: "16:10", tipo: "pix_out", descricao: "PIX enviado — Alan Costa (reembolso Saúde Guamá)", contraparte: "Alan Costa", valor: -85.00, categoria: "reembolso", area: "saude", conta: "Cora", conciliado: true, acaoId: 2 },
  { id: 15, data: "2026-04-26", hora: "07:15", tipo: "pix_in", descricao: "PIX recebido — Marcos V. Pereira", contraparte: "Marcos V. Pereira", valor: 150.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 16, data: "2026-04-22", hora: "09:14", tipo: "pix_in", descricao: "PIX recebido — Maria L. Santos", contraparte: "Maria L. Santos", valor: 250.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 17, data: "2026-04-20", hora: "12:30", tipo: "pix_in", descricao: "PIX recebido — Igreja Batista Central", contraparte: "Igreja Batista Central", valor: 600.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 18, data: "2026-04-15", hora: "18:22", tipo: "pix_in", descricao: "PIX recebido — Fernanda Albuquerque", contraparte: "Fernanda Albuquerque", valor: 100.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 19, data: "2026-04-12", hora: "14:00", tipo: "boleto_pago", descricao: "Mercado Livre — Material gráfico", contraparte: "Mercado Livre", valor: -185.00, categoria: "marketing", area: "marketing", conta: "Cora", conciliado: true, acaoId: null },
  { id: 20, data: "2026-04-08", hora: "10:45", tipo: "pix_in", descricao: "PIX recebido — Empresa Belém Distribuidora", contraparte: "Belém Distrib. Ltda", valor: 1500.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  // Março 2026
  { id: 21, data: "2026-03-25", hora: "11:30", tipo: "pix_in", descricao: "PIX recebido — Maria L. Santos", contraparte: "Maria L. Santos", valor: 250.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 22, data: "2026-03-20", hora: "16:00", tipo: "pix_in", descricao: "PIX recebido — Igreja Batista Central", contraparte: "Igreja Batista Central", valor: 500.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 23, data: "2026-03-15", hora: "08:20", tipo: "pix_in", descricao: "PIX recebido — Marcos V. Pereira", contraparte: "Marcos V. Pereira", valor: 150.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
  { id: 24, data: "2026-03-10", hora: "13:15", tipo: "pix_in", descricao: "PIX recebido — Fernanda Albuquerque", contraparte: "Fernanda Albuquerque", valor: 200.00, categoria: "doacao", conta: "Cora", conciliado: true, acaoId: null },
];

export const fmtBRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDataBR = (iso) => { const [y, m, d] = iso.split("-"); return `${d}/${m}`; };
export const fmtDataLongaBR = (iso) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
export const inicioMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };
export const mesesAtras = (n) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() - n, 1).toISOString().slice(0, 10); };

export function classificarDoador(qtd, total) {
  if (qtd >= 4 || total >= 1000) return { tipo: "fiel", label: "Fiel", cor: "#15803D", bg: "rgba(34,197,94,0.10)" };
  if (qtd >= 2) return { tipo: "recorrente", label: "Recorrente", cor: "#1D4ED8", bg: "rgba(29,78,216,0.10)" };
  return { tipo: "novo", label: "Novo", cor: "#B45309", bg: "rgba(245,158,11,0.14)" };
}

export function agruparDoadores(transacoes) {
  const map = new Map();
  transacoes.filter(t => t.valor > 0 && t.contraparte && t.contraparte !== "Anônimo").forEach(t => {
    const k = t.contraparte;
    const cur = map.get(k) || { nome: k, total: 0, qtd: 0, primeira: t.data, ultima: t.data };
    cur.total += t.valor;
    cur.qtd += 1;
    if (t.data < cur.primeira) cur.primeira = t.data;
    if (t.data > cur.ultima) cur.ultima = t.data;
    map.set(k, cur);
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function gerarReciboDoacao(transacao) {
  const dataGeracao = new Date().toLocaleString("pt-BR");
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo de Doação</title><style>
body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:0 24px;color:#1D1D1F;line-height:1.6}
.cabecalho{text-align:center;border-bottom:3px solid #D70D16;padding-bottom:18px;margin-bottom:24px}
h1{font-size:24px;margin:8px 0 4px;color:#851811}
.entidade{font-size:13px;color:#6E6E73}
.numero{display:inline-block;background:#F5F5F7;padding:4px 12px;border-radius:6px;font-size:12px;color:#6E6E73;font-family:monospace;margin-top:8px}
.bloco{background:#F5F5F7;padding:16px 20px;border-radius:10px;margin:16px 0}
.label{font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6E6E73;font-weight:700;margin-bottom:3px}
.valor-grande{font-size:32px;font-weight:700;color:#15803D;font-family:Helvetica,sans-serif}
.linha{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E8E8ED}
.linha:last-child{border-bottom:none}
.assinatura{margin-top:40px;padding-top:20px;border-top:1px solid #E8E8ED;font-size:11px;color:#6E6E73;line-height:1.5}
.legal{background:#FFF8E1;border:1px solid #F59E0B;padding:14px 18px;border-radius:8px;margin-top:24px;font-size:12px;color:#92400E}
</style></head><body>
<div class="cabecalho">
  <div style="font-size:13px;color:#6E6E73;letter-spacing:1px;text-transform:uppercase">Recibo de Doação</div>
  <h1>AMOR EM FOCO</h1>
  <div class="entidade">Organização da Sociedade Civil · CNPJ: 00.000.000/0001-00<br/>Belém — Pará</div>
  <div class="numero">N° ${String(transacao.id).padStart(6, "0")}/${new Date(transacao.data).getFullYear()}</div>
</div>

<p>A <b>Amor em Foco</b> declara, para os devidos fins, que recebeu de <b>${transacao.contraparte}</b> a importância de:</p>

<div class="bloco" style="text-align:center">
  <div class="valor-grande">${fmtBRL(transacao.valor)}</div>
  <div style="font-size:13px;color:#6E6E73;margin-top:4px">(${escreverPorExtenso(transacao.valor)})</div>
</div>

<div class="bloco">
  <div class="linha"><span class="label">Data da doação</span><span>${fmtDataLongaBR(transacao.data)} às ${transacao.hora}</span></div>
  <div class="linha"><span class="label">Forma de pagamento</span><span>${transacao.tipo === "pix_in" ? "PIX" : "Transferência"}</span></div>
  <div class="linha"><span class="label">Banco</span><span>Cora SCFI</span></div>
  ${transacao.txid ? `<div class="linha"><span class="label">ID da transação</span><span style="font-family:monospace;font-size:12px">${transacao.txid}</span></div>` : ""}
</div>

<p>A doação foi destinada às atividades fim da entidade, conforme estatuto social, sem qualquer contrapartida ou benefício direto ao doador.</p>

<div class="legal">
  <b>Dedução de Imposto de Renda:</b> Pessoa Física pode deduzir até <b>6%</b> do imposto devido em doações a Organizações da Sociedade Civil (Lei 9.249/95, art. 13, § 2°). Apresente este recibo à sua declaração de IR.
</div>

<div class="assinatura">
  Belém, ${dataGeracao}.<br/><br/>
  ____________________________________<br/>
  <b>Diretoria — Amor em Foco</b><br/>
  Recibo gerado eletronicamente pelo AEF Hub.
</div>
</body></html>`;
  return "data:text/html;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(html)));
}

export function escreverPorExtenso(v) {
  const reais = Math.floor(v);
  const centavos = Math.round((v - reais) * 100);
  let texto = "";
  if (reais === 1) texto = "um real";
  else if (reais > 0) texto = `${reais.toLocaleString("pt-BR")} reais`.replace(/,/g, ".");
  if (centavos > 0) texto += ` e ${centavos} centavos`;
  return texto || "zero";
}

export function Financeiro({ mobile, setActive }) {
  const [tab, setTab] = useState("extrato");
  const [transacoes, setTransacoes] = useState(FIN_TRANSACOES_MOCK);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroPeriodo, setFiltroPeriodo] = useState("mes");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState(null);
  const [meta, setMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aef_fin_meta") || "null") || 5000; } catch { return 5000; }
  });
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [showTransparencia, setShowTransparencia] = useState(false);
  const [reciboToast, setReciboToast] = useState("");

  useEffect(() => {
    try { localStorage.setItem("aef_fin_meta", JSON.stringify(meta)); } catch {}
  }, [meta]);

  const emitirRecibo = (transacao) => {
    const conteudo = gerarReciboDoacao(transacao);
    const doc = {
      id: Date.now(),
      nome: `Recibo Doação ${transacao.contraparte} ${fmtDataBR(transacao.data)}.html`,
      categoria: "declaracoes",
      tamanho: formatSize(conteudo.length),
      tipo: "text/html",
      data: new Date().toLocaleDateString("pt-BR"),
      responsavel: "Financeiro (auto)",
      vigente: true,
      validade: null,
      conteudo,
    };
    try {
      const existentes = JSON.parse(localStorage.getItem("aef_juridico_docs") || "[]");
      localStorage.setItem("aef_juridico_docs", JSON.stringify([doc, ...existentes]));
      setReciboToast(`Recibo de ${transacao.contraparte} salvo no Jurídico ✓`);
      setTimeout(() => setReciboToast(""), 2800);
    } catch (e) {
      alert("Erro ao salvar recibo: " + e.message);
    }
  };

  const dataLimite = filtroPeriodo === "mes" ? inicioMes() : filtroPeriodo === "tudo" ? "0000-01-01" : new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const filtradas = transacoes.filter(t => {
    if (t.data < dataLimite) return false;
    if (filtroCategoria !== "todas" && t.categoria !== filtroCategoria) return false;
    if (busca && !t.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
    if (tab === "doacoes" && t.valor <= 0) return false;
    if (tab === "despesas" && t.valor >= 0) return false;
    return true;
  });

  const entradas = transacoes.filter(t => t.data >= inicioMes() && t.valor > 0).reduce((s, t) => s + t.valor, 0);
  const saidas = transacoes.filter(t => t.data >= inicioMes() && t.valor < 0).reduce((s, t) => s + t.valor, 0);
  const saldoAtual = 3847.20;
  const naoCategorizadas = transacoes.filter(t => t.categoria === "nao_categorizado" || !t.conciliado).length;

  const breakdownDespesas = Object.entries(
    transacoes.filter(t => t.data >= inicioMes() && t.valor < 0).reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + Math.abs(t.valor);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const totalDespesas = Math.abs(saidas) || 1;

  const salvarEdicao = () => {
    setTransacoes(prev => prev.map(t => t.id === editando.id ? editando : t));
    setEditando(null);
  };

  const doadores = agruparDoadores(transacoes);
  const breakdownArea = Object.entries(
    transacoes.filter(t => t.valor < 0 && t.area).reduce((acc, t) => {
      acc[t.area] = (acc[t.area] || 0) + Math.abs(t.valor);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const totalGastosArea = breakdownArea.reduce((s, [, v]) => s + v, 0) || 1;
  const metaPct = Math.min(100, (entradas / meta) * 100);
  const metaBatida = entradas >= meta;
  const alertas = [];
  if (saldoAtual < 500) alertas.push({ tipo: "saldo", texto: `Saldo abaixo de R$ 500 (atual: ${fmtBRL(saldoAtual)}).`, cor: C.red });
  if (naoCategorizadas > 0) alertas.push({ tipo: "pendentes", texto: `${naoCategorizadas} transações aguardando conciliação.`, cor: "#B45309" });

  const tabs = [
    { id: "extrato", label: "Extrato", count: transacoes.length },
    { id: "doacoes", label: "Doações", count: transacoes.filter(t => t.valor > 0).length },
    { id: "despesas", label: "Despesas", count: transacoes.filter(t => t.valor < 0).length },
    { id: "doadores", label: "Doadores", count: doadores.length },
    { id: "area", label: "Por área" },
    { id: "relatorios", label: "Relatórios" },
  ];

  const CAT_TONE = { doacao: "green", alimentacao: "purple", transporte: "orange", utilidades: "blue", marketing: "teal", tarifa: "neutral", reembolso: "amber", nao_categorizado: "neutral" };
  const AREA_TONE = { alimentacao: "purple", saude: "red", social: "green", marketing: "teal", admin: "neutral" };
  const DOADOR_TONE = { fiel: "green", recorrente: "blue", novo: "amber" };

  return (
    <div className="aef-fin">
      <div className="aef-fin__head">
        <div>
          <h1 className="aef-fin__title">Financeiro</h1>
          <p className="aef-fin__desc">Conta Cora, {transacoes.length} movimentações</p>
        </div>
        <div className="aef-fin__head-actions">
          <button type="button" className="aef-fin__btn aef-fin__btn--outline" onClick={() => setShowTransparencia(true)}>
            <span aria-hidden="true"><Icon name="eye" size={14} /></span>
            Página pública
          </button>
          <button type="button" className="aef-fin__btn aef-fin__btn--outline" title="Disponível quando integrarmos com a API Cora" disabled>
            <span aria-hidden="true"><Icon name="settings" size={14} /></span>
            Sincronizar com Cora
          </button>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="aef-fin__alerts" role="status">
          {alertas.map(a => (
            <p key={a.tipo} className="aef-fin__alert" data-tone={a.tipo === "saldo" ? "red" : "amber"}>
              <span aria-hidden="true"><Icon name="shield" size={14} strokeWidth={2} /></span>
              {a.texto}
            </p>
          ))}
        </div>
      )}

      <div className="aef-fin__top">
        <section className="aef-fin__balance" aria-label="Saldo Cora">
          <span className="aef-fin__balance-label">Saldo Cora</span>
          <span className="aef-fin__balance-value">{fmtBRL(saldoAtual)}</span>
        </section>

        {/* Meta mensal */}
        <section className="aef-fin__panel aef-fin__goal" aria-labelledby="fin-meta-title" data-tone={metaBatida ? "green" : undefined}>
          <div className="aef-fin__goal-head">
            <div>
              <h2 id="fin-meta-title" className="aef-fin__h2">Meta de doações do mês</h2>
              <p className="aef-fin__goal-value">
                {fmtBRL(entradas)} <span className="aef-fin__goal-of">de {fmtBRL(meta)} ({metaPct.toFixed(0)}%)</span>
              </p>
            </div>
            <div className="aef-fin__goal-actions">
              {metaBatida && <span className="aef-fin__goal-met"><span aria-hidden="true"><Icon name="check" size={14} strokeWidth={2.5} /></span>Meta batida</span>}
              {editandoMeta ? (
                <>
                  <input type="number" aria-label="Valor da meta mensal" className="aef-fin__input aef-fin__goal-input" value={meta} onChange={e => setMeta(+e.target.value || 0)} />
                  <button type="button" className="aef-fin__btn aef-fin__btn--primary aef-fin__btn--small" onClick={() => setEditandoMeta(false)}>OK</button>
                </>
              ) : (
                <button type="button" className="aef-fin__btn aef-fin__btn--outline aef-fin__btn--small" onClick={() => setEditandoMeta(true)}>Editar meta</button>
              )}
            </div>
          </div>
          <div className="aef-fin__track" role="progressbar" aria-label="Meta de doações do mês" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(metaPct)}>
            <span style={{ width: `${metaPct}%` }} />
          </div>
        </section>
      </div>

      {/* Stats */}
      <ul className="aef-fin__figures">
        <li className="aef-fin__figure" data-tone="green"><span className="aef-fin__figure-label">Entradas mês</span><span className="aef-fin__figure-value">{fmtBRL(entradas)}</span></li>
        <li className="aef-fin__figure" data-tone="red"><span className="aef-fin__figure-label">Saídas mês</span><span className="aef-fin__figure-value">{fmtBRL(Math.abs(saidas))}</span></li>
        <li className="aef-fin__figure" data-tone={naoCategorizadas > 0 ? "amber" : "green"}><span className="aef-fin__figure-label">Pendentes</span><span className="aef-fin__figure-value">{naoCategorizadas}</span><span className="aef-fin__figure-detail">conciliar</span></li>
      </ul>

      {/* Tabs */}
      <nav className="aef-fin__tabs" aria-label="Seções do Financeiro">
        {tabs.map(t => (
          <button key={t.id} type="button" className="aef-fin__tab" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
            {t.label}{t.count !== undefined && <span className="aef-fin__tab-count">({t.count})</span>}
          </button>
        ))}
      </nav>

      {(tab === "extrato" || tab === "doacoes" || tab === "despesas") && (
        <>
          <div className="aef-fin__filters">
            <div className="aef-fin__search">
              <span className="aef-fin__search-icon" aria-hidden="true"><Icon name="search" size={15} /></span>
              <input type="search" aria-label="Buscar por descrição" className="aef-fin__input" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por descrição…" />
            </div>
            <select aria-label="Período" className="aef-fin__select" value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}>
              <option value="semana">Últimos 7 dias</option>
              <option value="mes">Este mês</option>
              <option value="tudo">Tudo</option>
            </select>
            <select aria-label="Categoria" className="aef-fin__select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
              <option value="todas">Todas categorias</option>
              {Object.entries(FIN_CATEGORIAS).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
            </select>
          </div>

          <div className="aef-fin__panel">
            {filtradas.length === 0 ? (
              <p className="aef-fin__empty">Nenhuma movimentação encontrada com esses filtros.</p>
            ) : (
              <ul className="aef-fin__ledger">
                {filtradas.map((t) => {
                  const cat = FIN_CATEGORIAS[t.categoria] || FIN_CATEGORIAS.nao_categorizado;
                  const entrada = t.valor > 0;
                  return (
                    <li key={t.id} className="aef-fin__entry" role="button" tabIndex={0} aria-label={"Detalhes: " + t.descricao}
                      onClick={() => setEditando({ ...t })}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditando({ ...t }); } }}
                    >
                      <div className="aef-fin__entry-main">
                        <div className="aef-fin__entry-title">
                          <span>{t.descricao}</span>
                          {!t.conciliado && <span className="aef-fin__tag" data-tone="amber">Pendente</span>}
                        </div>
                        <div className="aef-fin__meta">
                          <span>{fmtDataBR(t.data)}</span>
                          <span>{t.hora}</span>
                          <span className="aef-fin__tone" data-tone={CAT_TONE[t.categoria] || "neutral"}>{cat.label}</span>
                          {t.acaoId && <span>Ação #{t.acaoId}</span>}
                        </div>
                      </div>
                      <div className="aef-fin__entry-side">
                        <span className="aef-fin__amount" data-tone={entrada ? "green" : undefined}>{entrada ? "+" : ""}{fmtBRL(t.valor)}</span>
                        <span className="aef-fin__receipt-slot">
                          {entrada && t.contraparte !== "Anônimo" && t.categoria === "doacao" && (
                            <button type="button" className="aef-fin__icon-btn" title="Gerar recibo de doação" aria-label={"Gerar recibo de " + t.contraparte} onClick={(e) => { e.stopPropagation(); emitirRecibo(t); }} onKeyDown={e => e.stopPropagation()}>
                              <Icon name="file" size={14} />
                            </button>
                          )}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === "doadores" && (
        <section className="aef-fin__panel">
          <div className="aef-fin__panel-head">
            <h2 className="aef-fin__h2">{doadores.length} doadores identificados</h2>
          </div>
          {doadores.length === 0 ? (
            <p className="aef-fin__empty">Nenhum doador identificado ainda.</p>
          ) : (
            <ul className="aef-fin__ledger">
              {doadores.map((d) => {
                const klass = classificarDoador(d.qtd, d.total);
                return (
                  <li key={d.nome} className="aef-fin__donor">
                    <div className="aef-fin__donor-main">
                      <div className="aef-fin__donor-name">
                        <span>{d.nome}</span>
                        <span className="aef-fin__tag" data-tone={DOADOR_TONE[klass.tipo] || "neutral"}>{klass.label}</span>
                      </div>
                      <div className="aef-fin__meta">
                        <span>{d.qtd} {d.qtd === 1 ? "doação" : "doações"}</span>
                        <span>primeira {fmtDataBR(d.primeira)}</span>
                        <span>última {fmtDataBR(d.ultima)}</span>
                      </div>
                    </div>
                    <div className="aef-fin__donor-total">
                      <strong>{fmtBRL(d.total)}</strong>
                      <span>média {fmtBRL(d.total / d.qtd)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "area" && (
        <section className="aef-fin__panel aef-fin__panel--pad">
          <h2 className="aef-fin__h2" style={{ marginBottom: "var(--space-md)" }}>Despesas por área (todo o histórico)</h2>
          {breakdownArea.length === 0 ? (
            <p className="aef-fin__empty">Sem despesas com área classificada.</p>
          ) : (
            <ul className="aef-fin__bars">
              {breakdownArea.map(([areaId, v]) => {
                const a = FIN_AREAS[areaId] || FIN_AREAS.admin;
                const pct = (v / totalGastosArea) * 100;
                return (
                  <li key={areaId} className="aef-fin__bar" data-tone={AREA_TONE[areaId] || "neutral"}>
                    <div className="aef-fin__bar-head"><span className="aef-fin__bar-name">{a.label}</span><span className="aef-fin__bar-figs"><span>{fmtBRL(v)}</span><span>{pct.toFixed(0)}%</span></span></div>
                    <div className="aef-fin__track" role="presentation"><span style={{ width: `${pct}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="aef-fin__note" style={{ marginTop: "var(--space-lg)" }}>
            Transações vinculadas a uma ação herdam a área dela. Vincule no detalhe da transação.
          </p>
        </section>
      )}

      {tab === "relatorios" && (
        <div className="aef-fin__reports">
          <section className="aef-fin__panel aef-fin__panel--pad">
            <h2 className="aef-fin__h2" style={{ marginBottom: "var(--space-md)" }}>Despesas por categoria</h2>
            {breakdownDespesas.length === 0 ? (
              <p className="aef-fin__empty">Sem despesas este mês.</p>
            ) : (
              <ul className="aef-fin__bars">
                {breakdownDespesas.map(([catId, valor]) => {
                  const cat = FIN_CATEGORIAS[catId] || FIN_CATEGORIAS.nao_categorizado;
                  const pct = (valor / totalDespesas) * 100;
                  return (
                    <li key={catId} className="aef-fin__bar" data-tone={CAT_TONE[catId] || "neutral"}>
                      <div className="aef-fin__bar-head"><span className="aef-fin__bar-name">{cat.label}</span><span className="aef-fin__bar-figs"><span>{fmtBRL(valor)}</span><span>{pct.toFixed(0)}%</span></span></div>
                      <div className="aef-fin__track aef-fin__track--thin" role="presentation"><span style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="aef-fin__panel aef-fin__panel--pad">
            <h2 className="aef-fin__h2">Resumo do mês</h2>
            <ul className="aef-fin__summary">
              <li data-tone="green"><span>Total de doações</span><strong>{fmtBRL(entradas)}</strong></li>
              <li data-tone="red"><span>Total de despesas</span><strong>{fmtBRL(Math.abs(saidas))}</strong></li>
              <li data-tone={entradas + saidas >= 0 ? "green" : "red"}><span>Resultado do mês</span><strong>{fmtBRL(entradas + saidas)}</strong></li>
            </ul>
            <div className="aef-fin__exports">
              <button type="button" className="aef-fin__btn aef-fin__btn--outline aef-fin__btn--grow" disabled>Exportar PDF</button>
              <button type="button" className="aef-fin__btn aef-fin__btn--outline aef-fin__btn--grow" disabled>Exportar Excel</button>
            </div>
            <p className="aef-fin__hint" style={{ textAlign: "center" }}>Disponível após integração com Cora</p>
          </section>
        </div>
      )}

      {/* Toast recibo */}
      {reciboToast && (
        <div className="aef-fin__toast" role="status">{reciboToast}</div>
      )}

      {/* Modal Transparência */}
      {showTransparencia && (
        <div className="aef-fin__scrim aef-fin__scrim--center" onClick={() => setShowTransparencia(false)}>
          <div className="aef-fin__dialog" role="dialog" aria-modal="true" aria-labelledby="fin-transp-title" onClick={(e) => e.stopPropagation()}>
            <div className="aef-fin__dialog-head">
              <div style={{ minWidth: 0 }}>
                <p className="aef-fin__h2">Prévia da página pública</p>
                <p className="aef-fin__url">https://amoremfoco.org/transparencia</p>
              </div>
              <button type="button" className="aef-fin__btn aef-fin__btn--outline" onClick={() => setShowTransparencia(false)}>Fechar</button>
            </div>
            <div className="aef-fin__dialog-body">
              <div className="aef-fin__public-brand">
                <img className="aef-fin__public-logo" src="/logo-vermelha.png" alt="" />
                <h2 id="fin-transp-title" className="aef-fin__dialog-title">Transparência</h2>
                <p className="aef-fin__hint" style={{ marginTop: 0 }}>Amor em Foco, Belém-PA</p>
              </div>
              <ul className="aef-fin__public-figs">
                <li data-tone="green"><span className="aef-fin__figure-label">Doações no mês</span><strong>{fmtBRL(entradas)}</strong></li>
                <li data-tone="red"><span className="aef-fin__figure-label">Gastos no mês</span><strong>{fmtBRL(Math.abs(saidas))}</strong></li>
              </ul>
              <h3 className="aef-fin__h2">Como usamos sua doação</h3>
              <ul className="aef-fin__bars">
                {breakdownArea.map(([areaId, v]) => {
                  const a = FIN_AREAS[areaId] || FIN_AREAS.admin;
                  const pct = (v / totalGastosArea) * 100;
                  return (
                    <li key={areaId} className="aef-fin__bar" data-tone={AREA_TONE[areaId] || "neutral"}>
                      <div className="aef-fin__bar-head"><span className="aef-fin__bar-name">{a.label}</span><span className="aef-fin__bar-figs"><span>{pct.toFixed(0)}%</span></span></div>
                      <div className="aef-fin__track aef-fin__track--thin" role="presentation"><span style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
              <p className="aef-fin__note">
                Atualizado em tempo real com a API da Cora.<br/>
                Conforme LGPD, doadores individuais não são identificados.
              </p>
              <p className="aef-fin__fineprint">Esta página é uma simulação. No deploy real ela ficará pública em <b>amoremfoco.org/transparencia</b>.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editando && (
        <div className="aef-fin__scrim" onClick={() => setEditando(null)}>
          <div className="aef-fin__dialog" role="dialog" aria-modal="true" aria-labelledby="fin-tx-title" onClick={(e) => e.stopPropagation()}>
            <div className="aef-fin__dialog-head">
              <div style={{ minWidth: 0 }}>
                <h2 id="fin-tx-title" className="aef-fin__dialog-title">Detalhes da transação</h2>
                <div className="aef-fin__meta" style={{ marginTop: "var(--space-2xs)" }}>
                  <span>{fmtDataBR(editando.data)}</span>
                  <span>{editando.hora}</span>
                  <span>{editando.tipo.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            <div className="aef-fin__dialog-body">
              <div className="aef-fin__tx" data-tone={editando.valor > 0 ? "green" : undefined}>
                <span className="aef-fin__hint" style={{ marginTop: 0 }}>{editando.contraparte}</span>
                <span className="aef-fin__tx-value">{editando.valor > 0 ? "+" : ""}{fmtBRL(editando.valor)}</span>
                {editando.txid && <span className="aef-fin__hint" style={{ marginTop: 0 }}>txid: {editando.txid}</span>}
              </div>

              <div className="aef-fin__field">
                <label className="aef-fin__label" htmlFor="fin-tx-categoria">Categoria</label>
                <select id="fin-tx-categoria" className="aef-fin__select" value={editando.categoria} onChange={e => setEditando({ ...editando, categoria: e.target.value })}>
                  {Object.entries(FIN_CATEGORIAS).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
                </select>
              </div>
              <div className="aef-fin__field">
                <label className="aef-fin__label" htmlFor="fin-tx-acao">Vincular a ação (opcional)</label>
                <input id="fin-tx-acao" className="aef-fin__input" type="text" placeholder="Nome ou ID da ação" value={editando.acaoId || ""} onChange={e => setEditando({ ...editando, acaoId: e.target.value || null })} />
              </div>
              <label className="aef-fin__checkline">
                <input type="checkbox" checked={!!editando.conciliado} onChange={e => setEditando({ ...editando, conciliado: e.target.checked })} />
                Transação conciliada
              </label>
            </div>

            <div className="aef-fin__dialog-foot">
              <button type="button" className="aef-fin__btn aef-fin__btn--outline aef-fin__btn--grow" onClick={() => setEditando(null)}>Cancelar</button>
              <button type="button" className="aef-fin__btn aef-fin__btn--primary aef-fin__btn--grow" onClick={salvarEdicao}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
