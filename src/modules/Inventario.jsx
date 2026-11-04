import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { marketingDateKey } from "@/data/marketing";
import { readRHStore, volunteers } from "@/data/rh";
import { DEMO_USERS, getInitials } from "@/lib/access";

// ─── INVENTÁRIO ───────────────────────────────────────────────────────────────
export const INV_STORAGE_KEY = "aef_ops_inventario_v2";
export const INV_PARADO_DIAS = 30;
export const INV_VENCE_DIAS = 7;
export const INV_CATEGORIAS = ["Cozinha", "Estrutura", "Som e luz", "Descartáveis", "Limpeza e EPI", "Outro"];
export const INV_CATEGORIAS_DOACAO = ["Alimento", "Roupa", "Higiene", "Brinquedo", "Outro"];
export const INV_COM_VALIDADE = ["Alimento", "Higiene"];
export const INV_TIPOS = [
  ["patrimonio", "Patrimônio", "Unidade com código: garrafa, mesa, tenda"],
  ["consumivel", "Consumível", "Material da ONG: copos, luvas"],
  ["doacao", "Doação recebida", "Lote que chegou: alimento, roupa, cesta"],
];
export const INV_ESTADOS = {
  ok: { label: "Em uso", tone: "green" },
  danificado: { label: "Danificado", tone: "amber" },
  manutencao: { label: "Em manutenção", tone: "blue" },
  perdido: { label: "Perdido", tone: "red" },
};
export const INV_DESTINOS = {
  acao: { label: "Usado em ação", placeholder: "Qual ação? Ex: Café de Rua 26/04" },
  familias: { label: "Entregue a famílias", placeholder: "Ex: 12 famílias do Guamá" },
  repasse: { label: "Repassado a outra instituição", placeholder: "Qual instituição?" },
  descarte: { label: "Descartado", placeholder: "Motivo. Ex: venceu, estragou" },
};

export function invSeedItem(id, nome, categoria, responsavel, desde, { saidas = [], tipo, ...extra } = {}) {
  const tipoFinal = tipo || (extra.codigo ? "patrimonio" : "consumivel");
  const recebido = extra.qtd !== undefined ? extra.qtd + saidas.reduce((s, h) => s + h.qtd, 0) : undefined;
  return {
    id, nome, categoria, tipo: tipoFinal, responsavel, desde, estado: "ok", nota: "",
    ...(tipoFinal === "doacao" ? { recebidoEm: desde, triado: true, validade: "", conteudo: "", doador: "" } : {}),
    ...extra,
    historico: [...saidas, { data: desde, tipo: "cadastro", para: responsavel, por: "Flavia Moraes", qtd: recebido, doador: extra.doador }],
  };
}

export const INV_SEED = [
  invSeedItem("s1", "Garrafa térmica 5L", "Cozinha", "Arícia", "2026-10-12", { codigo: "GAR-01" }),
  invSeedItem("s2", "Garrafa térmica 5L", "Cozinha", "Arícia", "2026-10-12", { codigo: "GAR-02" }),
  invSeedItem("s3", "Garrafa térmica 5L", "Cozinha", "Flávia Souza", "2026-10-12", { codigo: "GAR-03" }),
  invSeedItem("s4", "Garrafa térmica 5L", "Cozinha", "Flávia Souza", "2026-10-12", { codigo: "GAR-04" }),
  invSeedItem("s5", "Garrafa térmica 5L", "Cozinha", "Alan Costa", "2026-08-09", { codigo: "GAR-05" }),
  invSeedItem("s6", "Garrafa térmica 5L", "Cozinha", "Alan Costa", "2026-08-09", { codigo: "GAR-06", estado: "danificado", nota: "Tampa quebrada" }),
  invSeedItem("s7", "Mesa dobrável", "Estrutura", "Alan Costa", "2026-07-20", { codigo: "MES-01" }),
  invSeedItem("s8", "Mesa dobrável", "Estrutura", "Alan Costa", "2026-07-20", { codigo: "MES-02" }),
  invSeedItem("s9", "Tenda 3x3", "Estrutura", "Aleffe", "2026-10-12", { codigo: "TEN-01" }),
  invSeedItem("s10", "Caldeirão 50L", "Cozinha", "Ingrid Lima", "2026-09-28", { codigo: "CAL-01" }),
  invSeedItem("s11", "Caixa de som", "Som e luz", "Duda Martins", "2026-10-20", { codigo: "SOM-01" }),
  invSeedItem("s12", "Copo descartável 200ml", "Descartáveis", "Arícia", "2026-10-12", { qtd: 300, unidade: "un" }),
  invSeedItem("s13", "Luva descartável", "Limpeza e EPI", "Arícia", "2026-10-12", { qtd: 2, unidade: "caixas" }),
  invSeedItem("s14", "Saco de lixo 100L", "Limpeza e EPI", "Alan Costa", "2026-10-12", { qtd: 1, unidade: "pacote" }),
  invSeedItem("s15", "Guardanapo", "Descartáveis", "Flávia Souza", "2026-10-12", { qtd: 500, unidade: "un" }),
  invSeedItem("d1", "Leite integral 1L", "Alimento", "Flávia Souza", "2026-10-20", { tipo: "doacao", qtd: 24, unidade: "caixas", doador: "Campanha Inverno Solidário", validade: "2026-11-04" }),
  invSeedItem("d2", "Pão de forma", "Alimento", "Arícia", "2026-10-22", { tipo: "doacao", qtd: 6, unidade: "pacotes", doador: "Padaria Estrela", validade: "2026-10-28" }),
  invSeedItem("d3", "Cesta básica", "Alimento", "Alan Costa", "2026-10-18", {
    tipo: "doacao", qtd: 8, unidade: "cestas", doador: "Igreja Batista do Marco", validade: "2026-12-15",
    conteudo: "Arroz 5kg, feijão 1kg, açúcar 1kg, óleo, macarrão, café e leite em pó",
    saidas: [{ data: "2026-10-25", tipo: "saida", qtd: 4, destino: "familias", detalhe: "4 famílias do Guamá", por: "Flavia Moraes" }],
  }),
  invSeedItem("d4", "Arroz 5kg", "Alimento", "Ingrid Lima", "2026-10-05", {
    tipo: "doacao", qtd: 16, unidade: "pacotes", doador: "Supermercado Líder", validade: "2027-03-10",
    saidas: [{ data: "2026-10-24", tipo: "saida", qtd: 4, destino: "acao", detalhe: "Sopão da Noite", por: "Flavia Moraes" }],
  }),
  invSeedItem("d5", "Sacos de roupa (mistura)", "Roupa", "Aleffe", "2026-10-01", { tipo: "doacao", qtd: 6, unidade: "sacos", doador: "Condomínio Village", triado: false, conteudo: "Roupa adulta e infantil, sem separar" }),
  invSeedItem("d6", "Agasalho adulto", "Roupa", "Duda Martins", "2026-10-14", { tipo: "doacao", qtd: 35, unidade: "peças", doador: "Campanha Inverno Solidário" }),
];

export const invNovoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const invDataLabel = (iso) => (iso ? iso.split("-").reverse().join("/") : "—");
export const invDiasAte = (iso) => Math.round((new Date(`${iso}T00:00`) - new Date(`${marketingDateKey(new Date())}T00:00`)) / 86400000);
export const invDiasDesde = (iso) => Math.max(0, -invDiasAte(iso));
export const invPorQtd = (item) => item.tipo !== "patrimonio";
export const invAtivo = (item) => !invPorQtd(item) || item.qtd > 0;
export const invQtdLabel = (item) => (invPorQtd(item) ? `${item.qtd} ${item.unidade || "un"}` : item.codigo);

// O alerta mais importante do item, na ordem: esgotado, estado ruim, validade, triagem, parado com alguém.
export function invAlerta(item) {
  if (!invAtivo(item)) return { label: "Esgotado", tone: "neutral", atencao: false };
  if (item.estado !== "ok") return { ...INV_ESTADOS[item.estado], atencao: true };
  if (item.tipo === "doacao" && item.validade) {
    const dias = invDiasAte(item.validade);
    if (dias < 0) return { label: `Venceu em ${invDataLabel(item.validade)}`, tone: "red", atencao: true };
    if (dias <= INV_VENCE_DIAS) return { label: dias === 0 ? "Vence hoje" : `Vence em ${dias} ${dias === 1 ? "dia" : "dias"}`, tone: "amber", atencao: true };
  }
  if (item.tipo === "doacao" && item.categoria === "Roupa" && !item.triado) return { label: "Falta triar", tone: "blue", atencao: true };
  if (item.tipo !== "doacao" && invDiasDesde(item.desde) > INV_PARADO_DIAS) return { label: `Parado há ${invDiasDesde(item.desde)} dias`, tone: "amber", atencao: true };
  return null;
}
export const invAtencao = (item) => !!invAlerta(item)?.atencao;

export function invProximoCodigo(itens, nome, offset = 0) {
  const prefixo = (nome.normalize("NFD").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "ITM").padEnd(3, "X");
  const maior = itens.reduce((max, i) => {
    const m = i.codigo?.match(new RegExp(`^${prefixo}-(\\d+)$`));
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `${prefixo}-${String(maior + 1 + offset).padStart(2, "0")}`;
}

// Move itens para outra pessoa. Quantidades podem ir em parte; consumível se junta ao lote igual do destino,
// doação não (cada lote tem doador e validade próprios).
export function invTransferir(itens, ids, para, { qtd, nota, por, data }) {
  let next = [...itens];
  ids.forEach(id => {
    const item = next.find(i => i.id === id);
    if (!item || item.responsavel === para) return;
    const parcial = invPorQtd(item) && qtd > 0 && qtd < item.qtd;
    const qtdMovida = invPorQtd(item) ? (parcial ? qtd : item.qtd) : undefined;
    const mov = { data, tipo: "transferencia", de: item.responsavel, para, por, nota, qtd: qtdMovida };
    const destino = item.tipo === "consumivel" && next.find(i => i.id !== item.id && i.tipo === "consumivel" && i.nome === item.nome && i.responsavel === para);
    if (parcial) next = next.map(i => (i.id === item.id ? { ...i, qtd: i.qtd - qtd, historico: [mov, ...i.historico] } : i));
    else next = next.filter(i => i.id !== item.id);
    if (destino) next = next.map(i => (i.id === destino.id ? { ...i, qtd: i.qtd + qtdMovida, desde: data, historico: [mov, ...i.historico] } : i));
    else next.push({ ...item, id: parcial ? invNovoId() : item.id, qtd: qtdMovida, responsavel: para, desde: data, historico: [mov, ...item.historico] });
  });
  return next;
}

export function InvItemRow({ item, onOpen, sub }) {
  const alerta = invAlerta(item);
  return (
    <li>
      <button type="button" className="aef-inv__item" data-esgotado={!invAtivo(item)} onClick={() => onOpen(item.id)}>
        <span className="aef-inv__item-main">
          <span className="aef-inv__item-name">{item.nome}</span>
          <span className="aef-inv__item-sub">
            <span className="aef-inv__code">{invQtdLabel(item)}</span>
            {sub || <span>desde {invDataLabel(item.desde)}</span>}
          </span>
        </span>
        <span className="aef-inv__item-side">
          {alerta && <span className="aef-ops__tag" data-tone={alerta.tone}>{alerta.label}</span>}
          <span aria-hidden="true" className="aef-inv__chev"><Icon name="chevronRight" size={16} /></span>
        </span>
      </button>
    </li>
  );
}

export function InvPessoaInput({ id, value, onChange, pessoas, placeholder = "Nome de quem fica com o item" }) {
  return (
    <>
      <input id={id} className="aef-ops__input" list={`${id}-lista`} value={value} placeholder={placeholder} autoComplete="off" onChange={e => onChange(e.target.value)} />
      <datalist id={`${id}-lista`}>{pessoas.map(p => <option key={p} value={p} />)}</datalist>
    </>
  );
}

export function InvNovoItem({ itens, pessoas, tipoInicial = "patrimonio", onClose, onSave }) {
  const hoje = marketingDateKey(new Date());
  const [d, setD] = useState({ nome: "", categoria: tipoInicial === "doacao" ? INV_CATEGORIAS_DOACAO[0] : INV_CATEGORIAS[0], tipo: tipoInicial, unidades: 1, qtd: "", unidade: "un", responsavel: "", doador: "", recebidoEm: hoje, validade: "", conteudo: "", triado: false });
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const setTipo = tipo => setD(p => ({ ...p, tipo, categoria: tipo === "doacao" ? INV_CATEGORIAS_DOACAO[0] : INV_CATEGORIAS[0] }));
  const doacao = d.tipo === "doacao";
  const pedeValidade = doacao && INV_COM_VALIDADE.includes(d.categoria);
  const unidades = Math.min(50, Math.max(1, Number(d.unidades) || 1));
  const valido = d.nome.trim() && d.responsavel.trim() && (d.tipo === "patrimonio" || Number(d.qtd) > 0);
  const codigos = d.nome.trim() && d.tipo === "patrimonio" ? Array.from({ length: unidades }, (_, n) => invProximoCodigo(itens, d.nome.trim(), n)) : [];
  const placeholderNome = { patrimonio: "Ex: Garrafa térmica 5L", consumivel: "Ex: Copo descartável 200ml", doacao: "Ex: Arroz 5kg, Cesta básica, Sacos de roupa" }[d.tipo];
  return (
    <div className="aef-ops__scrim" onClick={onClose}>
      <div className="aef-ops__dialog aef-ops__dialog--wide" role="dialog" aria-modal="true" aria-labelledby="inv-novo-title" onClick={e => e.stopPropagation()}>
        <div className="aef-ops__dialog-head">
          <h2 id="inv-novo-title" className="aef-ops__dialog-title">{doacao ? "Registrar doação" : "Novo item"}</h2>
          <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose}>Fechar</button>
        </div>
        <div className="aef-ops__dialog-body aef-ops__form">
          <div className="aef-inv__seg" role="radiogroup" aria-label="Tipo de item">
            {INV_TIPOS.map(([v, label, hint]) => (
              <button key={v} type="button" role="radio" aria-checked={d.tipo === v} className="aef-inv__seg-opt" onClick={() => setTipo(v)}>
                <strong>{label}</strong><span>{hint}</span>
              </button>
            ))}
          </div>
          <div className="aef-ops__field">
            <label className="aef-ops__label" htmlFor="inv-novo-nome">{doacao ? "O que chegou" : "Nome do item"}</label>
            <input id="inv-novo-nome" className="aef-ops__input" value={d.nome} placeholder={placeholderNome} onChange={e => set("nome", e.target.value)} />
          </div>
          <div className="aef-ops__row2">
            <div className="aef-ops__field">
              <label className="aef-ops__label" htmlFor="inv-novo-cat">Categoria</label>
              <select id="inv-novo-cat" className="aef-ops__select" value={d.categoria} onChange={e => set("categoria", e.target.value)}>
                {(doacao ? INV_CATEGORIAS_DOACAO : INV_CATEGORIAS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {d.tipo === "patrimonio" ? (
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="inv-novo-un">Quantas unidades</label>
                <input id="inv-novo-un" className="aef-ops__input" type="number" min="1" max="50" value={d.unidades} onChange={e => set("unidades", e.target.value)} />
              </div>
            ) : (
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="inv-novo-qtd">Quantidade</label>
                <div className="aef-inv__qty">
                  <input id="inv-novo-qtd" className="aef-ops__input" type="number" min="1" value={d.qtd} placeholder={doacao ? "20" : "300"} onChange={e => set("qtd", e.target.value)} />
                  <input aria-label="Unidade de medida" className="aef-ops__input" value={d.unidade} placeholder={doacao ? "kg, cestas, sacos" : "un"} onChange={e => set("unidade", e.target.value)} />
                </div>
              </div>
            )}
          </div>
          {doacao && (
            <>
              <div className="aef-ops__row2">
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="inv-novo-doador">Quem doou (opcional)</label>
                  <input id="inv-novo-doador" className="aef-ops__input" value={d.doador} placeholder="Pessoa, empresa ou campanha" onChange={e => set("doador", e.target.value)} />
                </div>
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="inv-novo-receb">Chegou em</label>
                  <input id="inv-novo-receb" className="aef-ops__input" type="date" max={hoje} value={d.recebidoEm} onChange={e => set("recebidoEm", e.target.value)} />
                </div>
              </div>
              {pedeValidade && (
                <div className="aef-ops__field">
                  <label className="aef-ops__label" htmlFor="inv-novo-val">Validade</label>
                  <input id="inv-novo-val" className="aef-ops__input" type="date" value={d.validade} onChange={e => set("validade", e.target.value)} />
                  <p className="aef-ops__hint">Se o lote tem várias validades, coloque a mais próxima. É ela que gera o alerta.</p>
                </div>
              )}
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="inv-novo-cont">O que tem dentro (opcional)</label>
                <textarea id="inv-novo-cont" className="aef-ops__textarea aef-inv__textarea" value={d.conteudo} placeholder="Para cesta, caixa ou saco misturado. Ex: arroz, feijão, óleo, café" onChange={e => set("conteudo", e.target.value)} />
              </div>
              {d.categoria === "Roupa" && (
                <label className="aef-ops__checkline">
                  <input type="checkbox" checked={d.triado} onChange={e => set("triado", e.target.checked)} />
                  Já foi triado (separado por tamanho e tipo)
                </label>
              )}
            </>
          )}
          <div className="aef-ops__field">
            <label className="aef-ops__label" htmlFor="inv-novo-resp">{doacao ? "Com quem ficou guardado" : "Com quem está"}</label>
            <InvPessoaInput id="inv-novo-resp" value={d.responsavel} onChange={v => set("responsavel", v)} pessoas={pessoas} />
          </div>
          {codigos.length > 0 && <p className="aef-ops__note">Códigos gerados: {codigos.length > 4 ? `${codigos[0]} a ${codigos[codigos.length - 1]}` : codigos.join(", ")}. Escreva o código no item com caneta ou etiqueta.</p>}
        </div>
        <div className="aef-ops__dialog-foot">
          <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--block" disabled={!valido} onClick={() => onSave(d, codigos)}>
            {doacao ? "Registrar doação" : d.tipo === "patrimonio" && unidades > 1 ? `Cadastrar ${unidades} unidades` : "Cadastrar item"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InvTransferir({ alvo, pessoas, onClose, onConfirm }) {
  const [para, setPara] = useState("");
  const [nota, setNota] = useState("");
  const unico = alvo.itens.length === 1 ? alvo.itens[0] : null;
  const porQtd = unico && invPorQtd(unico);
  const [qtd, setQtd] = useState(porQtd ? String(unico.qtd) : "");
  const qtdNum = Number(qtd);
  const qtdOk = !porQtd || (qtdNum > 0 && qtdNum <= unico.qtd);
  const mesmo = para.trim() === alvo.de;
  return (
    <div className="aef-ops__scrim" onClick={onClose}>
      <div className="aef-ops__dialog" role="dialog" aria-modal="true" aria-labelledby="inv-transf-title" onClick={e => e.stopPropagation()}>
        <div className="aef-ops__dialog-head">
          <div>
            <h2 id="inv-transf-title" className="aef-ops__dialog-title">Passar para outra pessoa</h2>
            <p className="aef-ops__hint">{unico ? `${unico.nome} · ${invQtdLabel(unico)}` : `${alvo.itens.length} itens`} · hoje com {alvo.de}</p>
          </div>
          <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose}>Fechar</button>
        </div>
        <div className="aef-ops__dialog-body aef-ops__form">
          <div className="aef-ops__field">
            <label className="aef-ops__label" htmlFor="inv-transf-para">Quem recebe</label>
            <InvPessoaInput id="inv-transf-para" value={para} onChange={setPara} pessoas={pessoas.filter(p => p !== alvo.de)} placeholder="Nome de quem vai ficar com isso" />
            {mesmo && <p className="aef-ops__hint">Os itens já estão com {alvo.de}.</p>}
          </div>
          {porQtd && (
            <div className="aef-ops__field">
              <label className="aef-ops__label" htmlFor="inv-transf-qtd">Quantidade ({unico.unidade || "un"})</label>
              <input id="inv-transf-qtd" className="aef-ops__input" type="number" min="1" max={unico.qtd} value={qtd} onChange={e => setQtd(e.target.value)} />
              <p className="aef-ops__hint">Tem {unico.qtd} com {alvo.de}. Pode passar só uma parte.</p>
            </div>
          )}
          <div className="aef-ops__field">
            <label className="aef-ops__label" htmlFor="inv-transf-nota">Observação (opcional)</label>
            <input id="inv-transf-nota" className="aef-ops__input" value={nota} placeholder="Ex: entregue no ponto de encontro do Café de Rua" onChange={e => setNota(e.target.value)} />
          </div>
          {!unico && (
            <ul className="aef-inv__chips">
              {alvo.itens.map(i => <li key={i.id}>{invPorQtd(i) ? `${i.nome} (${invQtdLabel(i)})` : i.codigo}</li>)}
            </ul>
          )}
        </div>
        <div className="aef-ops__dialog-foot">
          <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--block" disabled={!para.trim() || mesmo || !qtdOk}
            onClick={() => onConfirm(para.trim(), { qtd: porQtd ? qtdNum : undefined, nota: nota.trim() })}>
            {para.trim() && !mesmo ? `Passar para ${para.trim()}` : "Passar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InvSaida({ item, acoes, onClose, onConfirm }) {
  const vencido = item.validade && invDiasAte(item.validade) < 0;
  const [qtd, setQtd] = useState(String(item.qtd));
  const [destino, setDestino] = useState(vencido ? "descarte" : "acao");
  const [detalhe, setDetalhe] = useState("");
  const qtdNum = Number(qtd);
  const qtdOk = qtdNum > 0 && qtdNum <= item.qtd;
  return (
    <div className="aef-ops__scrim" onClick={onClose}>
      <div className="aef-ops__dialog" role="dialog" aria-modal="true" aria-labelledby="inv-saida-title" onClick={e => e.stopPropagation()}>
        <div className="aef-ops__dialog-head">
          <div>
            <h2 id="inv-saida-title" className="aef-ops__dialog-title">Registrar saída</h2>
            <p className="aef-ops__hint">{item.nome} · {invQtdLabel(item)} com {item.responsavel}</p>
          </div>
          <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose}>Fechar</button>
        </div>
        <div className="aef-ops__dialog-body aef-ops__form">
          <div className="aef-ops__field">
            <span className="aef-ops__label" id="inv-saida-destino">Para onde foi</span>
            <div className="aef-ops__choices" role="radiogroup" aria-labelledby="inv-saida-destino">
              {Object.entries(INV_DESTINOS).map(([v, cfg]) => (
                <button key={v} type="button" role="radio" aria-checked={destino === v} className="aef-ops__choice" onClick={() => setDestino(v)}>
                  <span className="aef-ops__radio" aria-hidden="true" />{cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div className="aef-ops__field">
            <label className="aef-ops__label" htmlFor="inv-saida-det">Detalhe</label>
            <input id="inv-saida-det" className="aef-ops__input" list={destino === "acao" ? "inv-saida-acoes" : undefined} value={detalhe} placeholder={INV_DESTINOS[destino].placeholder} autoComplete="off" onChange={e => setDetalhe(e.target.value)} />
            <datalist id="inv-saida-acoes">{acoes.map(a => <option key={a.id} value={`${a.nome} ${a.data}`} />)}</datalist>
          </div>
          <div className="aef-ops__field">
            <label className="aef-ops__label" htmlFor="inv-saida-qtd">Quantidade ({item.unidade || "un"})</label>
            <input id="inv-saida-qtd" className="aef-ops__input" type="number" min="1" max={item.qtd} value={qtd} onChange={e => setQtd(e.target.value)} />
            <p className="aef-ops__hint">{qtdOk && qtdNum < item.qtd ? `Ficam ${item.qtd - qtdNum} ${item.unidade || "un"} com ${item.responsavel}.` : `Sai o lote inteiro (${item.qtd} ${item.unidade || "un"}).`}</p>
          </div>
        </div>
        <div className="aef-ops__dialog-foot">
          <button type="button" className="aef-ops__btn aef-ops__btn--primary aef-ops__btn--block" disabled={!qtdOk} onClick={() => onConfirm({ qtd: qtdNum, destino, detalhe: detalhe.trim() })}>
            Registrar saída
          </button>
        </div>
      </div>
    </div>
  );
}

export function InvHistoricoLinha({ h, item }) {
  const un = item.unidade || "un";
  if (h.tipo === "cadastro" && item.tipo === "doacao") return <>Recebido{h.doador ? <> de <strong>{h.doador}</strong></> : ""}{h.qtd ? ` (${h.qtd} ${un})` : ""}, guardado com <strong>{h.para}</strong></>;
  if (h.tipo === "cadastro") return <>Cadastrado com <strong>{h.para}</strong>{h.qtd ? ` (${h.qtd} ${un})` : ""}</>;
  if (h.tipo === "transferencia") return <><strong>{h.de}</strong> passou para <strong>{h.para}</strong>{h.qtd ? ` (${h.qtd} ${un})` : ""}</>;
  if (h.tipo === "saida") return <>Saída de <strong>{h.qtd} {un}</strong>: {INV_DESTINOS[h.destino]?.label.toLowerCase()}</>;
  if (h.tipo === "triagem") return <>Roupa triada</>;
  if (h.tipo === "estado") return <>Estado: <strong>{INV_ESTADOS[h.estado]?.label}</strong>{h.nota ? `, ${h.nota}` : ""}</>;
  return null;
}

export function InvDetalhe({ item, onClose, onTransferir, onSaida, onTriar, onEstado, onExcluir }) {
  const [estado, setEstado] = useState(item.estado);
  const [nota, setNota] = useState(item.nota || "");
  const mudou = estado !== item.estado || nota.trim() !== (item.nota || "");
  const ativo = invAtivo(item);
  const alerta = invAlerta(item);
  const fatos = item.tipo === "doacao" ? [
    ["Doador", item.doador || "Não informado"],
    ["Chegou em", invDataLabel(item.recebidoEm)],
    ...(item.validade ? [["Validade", invDataLabel(item.validade)]] : []),
    ...(item.categoria === "Roupa" ? [["Triagem", item.triado ? "Triado" : "Falta triar"]] : []),
    ...(item.conteudo ? [["O que tem dentro", item.conteudo]] : []),
  ] : [];
  return (
    <div className="aef-ops__scrim" onClick={onClose}>
      <div className="aef-ops__dialog aef-ops__dialog--wide" role="dialog" aria-modal="true" aria-labelledby="inv-det-title" onClick={e => e.stopPropagation()}>
        <div className="aef-ops__dialog-head">
          <div>
            <h2 id="inv-det-title" className="aef-ops__dialog-title">{item.nome}</h2>
            <p className="aef-ops__hint">{invQtdLabel(item)} · {item.categoria}{item.tipo === "doacao" ? " · doação" : ""}</p>
          </div>
          <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onClose}>Fechar</button>
        </div>
        <div className="aef-ops__dialog-body aef-ops__stack">
          {alerta && <p className="aef-inv__alert" data-tone={alerta.tone}>{alerta.label}</p>}
          <div className="aef-inv__holder">
            <div>
              <span className="aef-ops__label">{ativo ? "Está com" : "Estava com"}</span>
              <p className="aef-inv__holder-name">{item.responsavel}</p>
              <p className="aef-ops__hint">desde {invDataLabel(item.desde)} · {invDiasDesde(item.desde)} dias</p>
            </div>
            {ativo && (
              <div className="aef-inv__holder-actions">
                {invPorQtd(item) && <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={onSaida}>Registrar saída</button>}
                <button type="button" className={`aef-ops__btn ${invPorQtd(item) ? "aef-ops__btn--outline" : "aef-ops__btn--primary"}`} onClick={onTransferir}>Passar para outra pessoa</button>
              </div>
            )}
          </div>
          {fatos.length > 0 && (
            <dl className="aef-inv__facts">
              {fatos.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          )}
          {item.tipo === "doacao" && item.categoria === "Roupa" && !item.triado && ativo && (
            <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={onTriar}>Marcar como triado</button>
          )}
          {ativo && (
            <div className="aef-ops__row2">
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="inv-det-estado">Estado</label>
                <select id="inv-det-estado" className="aef-ops__select" value={estado} onChange={e => setEstado(e.target.value)}>
                  {Object.entries(INV_ESTADOS).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
              <div className="aef-ops__field">
                <label className="aef-ops__label" htmlFor="inv-det-nota">Observação</label>
                <input id="inv-det-nota" className="aef-ops__input" value={nota} placeholder={item.tipo === "doacao" ? "Ex: embalagem rasgada" : "Ex: tampa quebrada"} onChange={e => setNota(e.target.value)} />
              </div>
            </div>
          )}
          {mudou && <button type="button" className="aef-ops__btn aef-ops__btn--outline" onClick={() => onEstado(estado, nota.trim())}>Salvar estado</button>}
          <div>
            <h3 className="aef-ops__h3">Histórico</h3>
            <ol className="aef-inv__timeline">
              {item.historico.map((h, n) => (
                <li key={n}>
                  <span className="aef-inv__tl-date">{invDataLabel(h.data)}</span>
                  <span>
                    <InvHistoricoLinha h={h} item={item} />
                    {(h.tipo === "transferencia" ? h.nota : h.tipo === "saida" ? h.detalhe : "") && <span className="aef-inv__tl-note">{h.tipo === "saida" ? h.detalhe : h.nota}</span>}
                    {h.por && <span className="aef-inv__tl-note">registrado por {h.por}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="aef-ops__dialog-foot">
          <button type="button" className="aef-ops__btn aef-ops__btn--quiet" onClick={() => { if (window.confirm(`Remover "${item.nome}" (${invQtdLabel(item)}) do inventário? O histórico dele também some.`)) onExcluir(); }}>
            <span aria-hidden="true"><Icon name="trash" size={14} /></span>Remover do inventário
          </button>
        </div>
      </div>
    </div>
  );
}

export function Inventario({ user, acoes = [] }) {
  const [itens, setItens] = useState(() => readRHStore(INV_STORAGE_KEY, INV_SEED));
  useEffect(() => { try { localStorage.setItem(INV_STORAGE_KEY, JSON.stringify(itens)); } catch {} }, [itens]);
  const [vista, setVista] = useState("pessoas");
  const [busca, setBusca] = useState("");
  const [soAtencao, setSoAtencao] = useState(false);
  const [detalheId, setDetalheId] = useState(null);
  const [transferencia, setTransferencia] = useState(null);
  const [saidaAberta, setSaidaAberta] = useState(false);
  const [novo, setNovo] = useState(false);

  const por = user?.name || "Operações";
  const hoje = marketingDateKey(new Date());
  const pessoas = [...new Set([...itens.map(i => i.responsavel), ...volunteers.map(v => v.name), ...DEMO_USERS.map(u => u.name)])].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const termo = busca.trim().toLowerCase();
  const filtrados = itens.filter(i => (!soAtencao || invAtencao(i)) && (!termo || [i.nome, i.codigo, i.responsavel, i.categoria, i.doador, i.conteudo].some(v => v?.toLowerCase().includes(termo))));
  const visiveis = filtrados.filter(invAtivo);
  const grupos = Object.entries(visiveis.reduce((acc, i) => ({ ...acc, [i.responsavel]: [...(acc[i.responsavel] || []), i] }), {}))
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "pt-BR"));
  const ordenados = [...visiveis].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || (a.codigo || "").localeCompare(b.codigo || ""));
  // Doações: o que vence primeiro no topo (é o que deve sair primeiro); esgotadas ficam no fim, para prestação de contas.
  const doacoes = filtrados.filter(i => i.tipo === "doacao")
    .sort((a, b) => !invAtivo(a) - !invAtivo(b) || (a.validade || "9999").localeCompare(b.validade || "9999") || a.recebidoEm.localeCompare(b.recebidoEm));

  const doacoesAtivas = itens.filter(i => i.tipo === "doacao" && invAtivo(i));
  const vencendo = doacoesAtivas.filter(i => i.validade && invDiasAte(i.validade) <= INV_VENCE_DIAS).length;
  const atencao = itens.filter(invAtencao);
  const figuras = [
    { label: "Patrimônio", value: itens.filter(i => i.tipo === "patrimonio").length, detail: "unidades cadastradas" },
    { label: "Consumíveis", value: new Set(itens.filter(i => i.tipo === "consumivel" && invAtivo(i)).map(i => i.nome)).size, detail: "tipos em mãos" },
    { label: "Doações", value: doacoesAtivas.length, detail: vencendo ? `lotes em estoque · ${vencendo} vencendo ou vencidos` : "lotes em estoque", tone: vencendo ? "amber" : undefined, onClick: () => { setSoAtencao(false); setVista("doacoes"); } },
    { label: "Precisam de atenção", value: atencao.length, detail: "vencendo, parados, sem triagem ou com problema", tone: atencao.length ? "red" : "green", onClick: () => { setSoAtencao(true); setVista("itens"); } },
  ];

  const detalhe = itens.find(i => i.id === detalheId);
  const lista = vista === "doacoes" ? doacoes : visiveis;

  const salvarNovo = (d, codigos) => {
    const responsavel = d.responsavel.trim();
    const base = { nome: d.nome.trim(), categoria: d.categoria, responsavel, desde: hoje, estado: "ok", nota: "" };
    let novos;
    if (d.tipo === "patrimonio") {
      novos = codigos.map(codigo => ({ ...base, id: invNovoId(), tipo: "patrimonio", codigo, historico: [{ data: hoje, tipo: "cadastro", para: responsavel, por }] }));
    } else {
      const qtd = Number(d.qtd);
      const unidade = d.unidade.trim() || "un";
      const doacao = d.tipo === "doacao" ? {
        recebidoEm: d.recebidoEm || hoje,
        doador: d.doador.trim(),
        validade: INV_COM_VALIDADE.includes(d.categoria) ? d.validade : "",
        conteudo: d.conteudo.trim(),
        triado: d.categoria === "Roupa" ? d.triado : true,
      } : {};
      const data = doacao.recebidoEm || hoje;
      novos = [{ ...base, ...doacao, desde: data, id: invNovoId(), tipo: d.tipo, qtd, unidade, historico: [{ data, tipo: "cadastro", para: responsavel, por, qtd, doador: doacao.doador }] }];
    }
    setItens(prev => [...prev, ...novos]);
    setNovo(false);
    if (d.tipo === "doacao") setVista("doacoes");
  };

  const atualizar = (fn) => setItens(prev => prev.map(i => (i.id === detalheId ? fn(i) : i)));

  const confirmarTransferencia = (para, extra) => {
    setItens(prev => invTransferir(prev, transferencia.itens.map(i => i.id), para, { ...extra, por, data: hoje }));
    setTransferencia(null);
    setDetalheId(null);
  };

  const confirmarSaida = ({ qtd, destino, detalhe: det }) => {
    atualizar(i => ({ ...i, qtd: i.qtd - qtd, historico: [{ data: hoje, tipo: "saida", qtd, destino, detalhe: det, por }, ...i.historico] }));
    setSaidaAberta(false);
  };

  const subDoacao = (i) => (
    <>
      <span>{i.doador || "doador não informado"}</span>
      {i.validade && <span>val. {invDataLabel(i.validade)}</span>}
      <span>com <strong>{i.responsavel}</strong></span>
    </>
  );

  return (
    <div className="aef-inv">
      <ul className="aef-inv__figures">
        {figuras.map(f => {
          const corpo = (
            <>
              <span className="aef-inv__figure-label">{f.label}</span>
              <span className="aef-inv__figure-value">{f.value}</span>
              <span className="aef-inv__figure-detail">{f.detail}</span>
            </>
          );
          return (
            <li key={f.label} data-tone={f.tone}>
              {f.onClick
                ? <button type="button" className="aef-inv__figure aef-inv__figure--btn" onClick={f.onClick}>{corpo}</button>
                : <div className="aef-inv__figure">{corpo}</div>}
            </li>
          );
        })}
      </ul>

      <div className="aef-inv__toolbar">
        <div className="aef-inv__views" role="tablist" aria-label="Visualização do inventário">
          {[["pessoas", "Com quem está"], ["itens", "Todos os itens"], ["doacoes", "Doações"]].map(([v, label]) => (
            <button key={v} type="button" role="tab" aria-selected={vista === v} className="aef-inv__view" onClick={() => setVista(v)}>{label}</button>
          ))}
        </div>
        <div className="aef-inv__search">
          <span aria-hidden="true"><Icon name="search" size={16} /></span>
          <input className="aef-ops__input" type="search" aria-label="Buscar no inventário" placeholder="Buscar item, código, pessoa ou doador" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <label className="aef-ops__checkline">
          <input type="checkbox" checked={soAtencao} onChange={e => setSoAtencao(e.target.checked)} />
          Só o que precisa de atenção
        </label>
        <button type="button" className="aef-ops__btn aef-ops__btn--primary" onClick={() => setNovo(true)}>
          <span aria-hidden="true"><Icon name="plus" size={16} /></span>{vista === "doacoes" ? "Registrar doação" : "Novo item"}
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="aef-ops__panel aef-ops__empty">
          <span className="aef-ops__empty-icon" aria-hidden="true"><Icon name={termo || soAtencao ? "search" : "heart"} size={28} /></span>
          <h3 className="aef-ops__h3">{termo || soAtencao ? "Nada encontrado" : vista === "doacoes" ? "Nenhuma doação registrada" : "Nenhum item cadastrado"}</h3>
          <p className="aef-ops__hint">
            {termo || soAtencao ? "Tente outro termo ou desmarque o filtro de atenção."
              : vista === "doacoes" ? "Quando chegar alimento, roupa ou cesta, registre o lote com doador e validade. O sistema avisa antes de vencer."
                : "Cadastre garrafas, mesas, copos e o que mais a ONG usa nas ações, e diga com quem cada coisa está."}
          </p>
        </div>
      ) : vista === "pessoas" ? (
        <div className="aef-inv__groups">
          {grupos.map(([pessoa, doGrupo]) => {
            const unidades = doGrupo.filter(i => i.tipo === "patrimonio").length;
            const consumiveis = doGrupo.filter(i => i.tipo === "consumivel").length;
            const lotes = doGrupo.filter(i => i.tipo === "doacao").length;
            return (
              <section key={pessoa} className="aef-ops__panel" aria-label={`Itens com ${pessoa}`}>
                <div className="aef-ops__panel-head">
                  <div className="aef-inv__person">
                    <span className="aef-inv__avatar" aria-hidden="true">{getInitials(pessoa)}</span>
                    <div>
                      <h3 className="aef-ops__h3">{pessoa}</h3>
                      <p className="aef-ops__hint">
                        {[
                          unidades && `${unidades} ${unidades === 1 ? "unidade" : "unidades"}`,
                          consumiveis && `${consumiveis} ${consumiveis === 1 ? "consumível" : "consumíveis"}`,
                          lotes && `${lotes} ${lotes === 1 ? "lote de doação" : "lotes de doação"}`,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="aef-ops__btn aef-ops__btn--link" onClick={() => setTransferencia({ de: pessoa, itens: doGrupo })}>
                    {doGrupo.length > 1 ? "Passar tudo" : "Passar"}
                  </button>
                </div>
                <ul className="aef-ops__list">
                  {doGrupo.map(i => <InvItemRow key={i.id} item={i} onOpen={setDetalheId} />)}
                </ul>
              </section>
            );
          })}
        </div>
      ) : vista === "doacoes" ? (
        <section className="aef-ops__panel" aria-label="Doações recebidas">
          <div className="aef-ops__panel-head">
            <p className="aef-ops__hint">O que vence primeiro está no topo: use de cima para baixo. Lotes esgotados ficam no fim, com o histórico de para onde foram.</p>
          </div>
          <ul className="aef-ops__list">
            {doacoes.map(i => <InvItemRow key={i.id} item={i} onOpen={setDetalheId} sub={subDoacao(i)} />)}
          </ul>
        </section>
      ) : (
        <ul className="aef-ops__panel aef-ops__list">
          {ordenados.map(i => <InvItemRow key={i.id} item={i} onOpen={setDetalheId} sub={<span>com <strong>{i.responsavel}</strong></span>} />)}
        </ul>
      )}

      {novo && <InvNovoItem itens={itens} pessoas={pessoas} tipoInicial={vista === "doacoes" ? "doacao" : "patrimonio"} onClose={() => setNovo(false)} onSave={salvarNovo} />}
      {detalhe && !transferencia && !saidaAberta && (
        <InvDetalhe key={detalhe.id} item={detalhe} onClose={() => setDetalheId(null)}
          onTransferir={() => setTransferencia({ de: detalhe.responsavel, itens: [detalhe] })}
          onSaida={() => setSaidaAberta(true)}
          onTriar={() => atualizar(i => ({ ...i, triado: true, historico: [{ data: hoje, tipo: "triagem", por }, ...i.historico] }))}
          onEstado={(estado, nota) => atualizar(i => ({ ...i, estado, nota, historico: [{ data: hoje, tipo: "estado", estado, nota, por }, ...i.historico] }))}
          onExcluir={() => { setItens(prev => prev.filter(i => i.id !== detalhe.id)); setDetalheId(null); }} />
      )}
      {detalhe && saidaAberta && <InvSaida item={detalhe} acoes={acoes} onClose={() => setSaidaAberta(false)} onConfirm={confirmarSaida} />}
      {transferencia && <InvTransferir alvo={transferencia} pessoas={pessoas} onClose={() => setTransferencia(null)} onConfirm={confirmarTransferencia} />}
    </div>
  );
}
