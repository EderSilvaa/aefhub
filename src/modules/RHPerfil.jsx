import { useVoluntarios } from "@/data/VoluntariosContext";

const ANO_MS = 365.25 * 24 * 60 * 60 * 1000;
const FAIXAS = [["Até 17", 0, 17], ["18 a 24", 18, 24], ["25 a 34", 25, 34], ["35 a 44", 35, 44], ["45 a 59", 45, 59], ["60 ou mais", 60, 200]];

// The form asks age at sign-up; today's age adds the years since then (can be off by one: no birthday).
export function idadeAtual(person, hoje = Date.now()) {
  if (!person.idadeCadastro || !person.cadastradoEm) return null;
  return person.idadeCadastro + Math.floor((hoje - new Date(person.cadastradoEm).getTime()) / ANO_MS);
}

const sem = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function origemDe(texto) {
  const t = sem(texto);
  if (!t.trim()) return "Não informou";
  if (t.includes("insta")) return "Instagram";
  if (/amig|indica|conhec|famil|irm|prim|colega|namorad|mae|pai/.test(t)) return "Amigos e indicação";
  if (/igrej|celula|pastor|culto/.test(t)) return "Igreja";
  if (/faculdade|universidade|escola|curso|unama|ufpa|uepa|cesupa/.test(t)) return "Faculdade ou escola";
  if (/tiktok|facebook|whats|google|site|internet|rede/.test(t)) return "Outras redes e internet";
  return "Outros";
}

const trimestre = iso => {
  const d = new Date(iso);
  return { key: `${d.getFullYear()}-${Math.floor(d.getMonth() / 3)}`, label: `${Math.floor(d.getMonth() / 3) + 1}º tri ${String(d.getFullYear()).slice(2)}` };
};

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

// Horizontal bars: label, count and share; the bar is a single hue (magnitude), text stays in ink.
function Barras({ itens, total, rotulo }) {
  const max = Math.max(...itens.map(([, n]) => n), 1);
  return (
    <ul className="aef-rhp__bars" aria-label={rotulo}>
      {itens.map(([nome, n]) => (
        <li key={nome} className="aef-rhp__bar" title={`${nome}: ${n} (${pct(n, total)}%)`}>
          <span className="aef-rhp__bar-name">{nome}</span>
          <span className="aef-rhp__track" aria-hidden="true"><span style={{ width: `${(n / max) * 100}%` }} /></span>
          <span className="aef-rhp__bar-value">{n}<span>{pct(n, total)}%</span></span>
        </li>
      ))}
    </ul>
  );
}

export function RHPerfil() {
  const volunteers = useVoluntarios();
  const comCadastro = volunteers.filter(person => person.cadastradoEm);
  if (!comCadastro.length) return null; // the demo sample has no sign-up data

  const hoje = Date.now();
  const idades = comCadastro.map(person => idadeAtual(person, hoje)).filter(n => n !== null).sort((a, b) => a - b);
  const media = idades.length ? Math.round(idades.reduce((s, n) => s + n, 0) / idades.length) : null;
  const mediana = idades.length ? idades[Math.floor(idades.length / 2)] : null;
  const ultimos12 = comCadastro.filter(person => hoje - new Date(person.cadastradoEm).getTime() <= ANO_MS).length;

  const faixas = FAIXAS.map(([nome, min, max]) => [nome, idades.filter(n => n >= min && n <= max).length]);

  const porTri = new Map();
  comCadastro.forEach(person => {
    const { key, label } = trimestre(person.cadastradoEm);
    porTri.set(key, { label, n: (porTri.get(key)?.n || 0) + 1 });
  });
  const tris = [...porTri.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, v]) => v);
  const maxTri = Math.max(...tris.map(t => t.n), 1);

  const origens = new Map();
  comCadastro.forEach(person => { const o = origemDe(person.comoConheceu); origens.set(o, (origens.get(o) || 0) + 1); });
  const origemItens = [...origens.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <section className="aef-rhp" aria-labelledby="rhp-title">
      <div className="aef-rh__panel-head" style={{ padding: 0, border: 0, marginBottom: "var(--space-sm)" }}>
        <div>
          <h2 id="rhp-title" className="aef-rh__h2">Quem são os voluntários</h2>
          <p className="aef-rh__hint">Dos cadastros pelo formulário do site. Idade atual estimada a partir da idade no cadastro.</p>
        </div>
      </div>

      <ul className="aef-rh__figures aef-rh__figures--4">
        <li className="aef-rh__figure"><span className="aef-rh__figure-label">Voluntários</span><span className="aef-rh__figure-value">{comCadastro.length}</span><span className="aef-rh__figure-detail">na base</span></li>
        <li className="aef-rh__figure"><span className="aef-rh__figure-label">Idade média</span><span className="aef-rh__figure-value">{media ?? "Sem dado"}</span><span className="aef-rh__figure-detail">anos hoje</span></li>
        <li className="aef-rh__figure"><span className="aef-rh__figure-label">Idade mediana</span><span className="aef-rh__figure-value">{mediana ?? "Sem dado"}</span><span className="aef-rh__figure-detail">metade tem menos que isso</span></li>
        <li className="aef-rh__figure"><span className="aef-rh__figure-label">Últimos 12 meses</span><span className="aef-rh__figure-value">{ultimos12}</span><span className="aef-rh__figure-detail">novos cadastros</span></li>
      </ul>

      <div className="aef-rh__grid aef-rh__grid--half" style={{ marginTop: 0 }}>
        <section className="aef-rh__panel aef-rh__panel--pad">
          <h3 className="aef-rhp__h3">Faixa etária hoje</h3>
          <Barras itens={faixas} total={idades.length} rotulo="Voluntários por faixa etária" />
        </section>
        <section className="aef-rh__panel aef-rh__panel--pad">
          <h3 className="aef-rhp__h3">Como conheceram a AEF</h3>
          <Barras itens={origemItens} total={comCadastro.length} rotulo="Voluntários por origem" />
        </section>
      </div>

      <section className="aef-rh__panel aef-rh__panel--pad" style={{ marginTop: "var(--space-md)" }}>
        <h3 className="aef-rhp__h3">Cadastros por trimestre</h3>
        <ol className="aef-rhp__cols" aria-label="Novos cadastros por trimestre">
          {tris.map(t => (
            <li key={t.label} className="aef-rhp__col" title={`${t.label}: ${t.n} cadastros`}>
              <span className="aef-rhp__col-value">{t.n}</span>
              <span className="aef-rhp__col-bar" style={{ height: `${(t.n / maxTri) * 100}%` }} aria-hidden="true" />
              <span className="aef-rhp__col-label">{t.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="aef-rhp__note">
        <strong>Gênero:</strong> o formulário atual não pergunta, então não dá para contar homens e mulheres sem adivinhar pelo nome.
        No formulário novo, inclua gênero (com "prefiro não dizer") e data de nascimento, que deixa a idade exata.
      </p>
    </section>
  );
}

export default RHPerfil;
