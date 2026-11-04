import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ACERVO_MOCK, MARKETING_POST_STATUS, MARKETING_REQUESTS_SEED, MARKETING_REQUEST_STATUS, MARKETING_STORAGE_KEYS, POSTS_MOCK, googleCalendarUrl, marketingDateKey, marketingDateLabel, readMarketingStore } from "@/data/marketing";
import "../marketing.css";

export const MARKETING_NAV_ITEMS = [
  { id: "demandas", label: "Demandas", icon: "file", title: "Central de demandas", description: "Receba, priorize e acompanhe pedidos de todos os setores." },
  { id: "calendario", label: "Calendário", icon: "calendar", title: "Calendário editorial", description: "Planeje publicações e envie compromissos para o Google Agenda." },
  { id: "acervo", label: "Acervo", icon: "camera", title: "Acervo de mídia", description: "Encontre fotos, artes e identidades usadas pela organização." },
  { id: "ia", label: "Legendas", icon: "heart", title: "Assistente de legendas", description: "Crie rascunhos alinhados ao tom de voz do Amor em Foco." },
  { id: "posts", label: "Conteúdos", icon: "camera", title: "Conteúdos e rascunhos", description: "Revise materiais salvos e acompanhe o que já foi publicado." },
  { id: "protecao", label: "Proteção", icon: "shield", title: "Proteção de imagens", description: "Proteja rostos localmente antes de usar ou compartilhar uma foto." },
];

export function Marketing({ mobile, user }) {
  const [tab, setTab] = useState("demandas");
  const [acervoFilter, setAcervoFilter] = useState("todos");
  const [gerando, setGerando] = useState(false);
  const [gerado, setGerado] = useState(false);
  const [legenda, setLegenda] = useState("");
  const [acaoSelecionada, setAcaoSelecionada] = useState("Café de Rua");
  const [tom, setTom] = useState("emotivo");
  const [posts, setPosts] = useState(() => readMarketingStore(MARKETING_STORAGE_KEYS.posts, POSTS_MOCK));
  const [acervo, setAcervo] = useState(() => readMarketingStore(MARKETING_STORAGE_KEYS.acervo, ACERVO_MOCK));
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [calendarNotice, setCalendarNotice] = useState("");
  const [requests, setRequests] = useState(() => readMarketingStore(MARKETING_STORAGE_KEYS.requests, MARKETING_REQUESTS_SEED));
  const [requestNotice, setRequestNotice] = useState("");
  const [requestForm, setRequestForm] = useState({
    titulo: "",
    setor: user?.department || user?.profileLabel || "Diretoria",
    formato: "Post estático",
    prioridade: "media",
    prazo: "",
    descricao: "",
  });
  const [calendarForm, setCalendarForm] = useState(() => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    return {
      acao: "",
      canal: "Instagram",
      scheduledDate: marketingDateKey(nextDate),
      scheduledTime: "10:00",
      responsavel: "Equipe de Marketing",
      legenda: "",
    };
  });
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [mascarando, setMascarando] = useState(false);
  const [mascVisible, setMascVisible] = useState(false);
  const [maskStyle, setMaskStyle] = useState("blur");
  const [maskPadding, setMaskPadding] = useState(18);
  const [faceBoxes, setFaceBoxes] = useState([]);
  const [protectionError, setProtectionError] = useState("");
  const [protectionNotice, setProtectionNotice] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [manualDrawing, setManualDrawing] = useState(false);
  const protectionCanvasRef = useRef(null);
  const protectionEditorRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const manualStartRef = useRef(null);
  const activeMarketingSection = MARKETING_NAV_ITEMS.find(item => item.id === tab) || MARKETING_NAV_ITEMS[0];

  const acervoFiltrado = acervo.filter(f =>
    acervoFilter === "todos" || f.tipo === acervoFilter
  );

  useEffect(() => {
    localStorage.setItem(MARKETING_STORAGE_KEYS.posts, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem(MARKETING_STORAGE_KEYS.acervo, JSON.stringify(acervo));
    } catch {
      setProtectionError("O navegador ficou sem espaço para salvar a versão protegida. Baixe o arquivo e conecte o armazenamento definitivo depois.");
    }
  }, [acervo]);

  useEffect(() => {
    localStorage.setItem(MARKETING_STORAGE_KEYS.requests, JSON.stringify(requests));
  }, [requests]);

  const criarDemanda = (event) => {
    event.preventDefault();
    if (!requestForm.titulo.trim() || !requestForm.prazo) return;
    const novaDemanda = {
      id: Date.now(),
      ...requestForm,
      titulo: requestForm.titulo.trim(),
      descricao: requestForm.descricao.trim(),
      solicitante: user?.name || "Diretoria",
      status: "brief_recebido",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tempoSolicitacao: "agora",
    };
    setRequests(prev => [novaDemanda, ...prev]);
    setRequestForm(prev => ({ ...prev, titulo: "", prazo: "", descricao: "" }));
    setRequestNotice("Pedido enviado ao Marketing e registrado no Mural.");
  };

  const atualizarStatusDemanda = (requestId, status) => {
    setRequests(prev => prev.map(request => request.id === requestId ? {
      ...request,
      status,
      updatedAt: new Date().toISOString(),
      tempoAtualizacao: "agora",
    } : request));
    setRequestNotice(`Demanda atualizada para “${MARKETING_REQUEST_STATUS[status]?.label || status}” e refletida no Mural.`);
  };

  const requestMetrics = {
    recebidas: requests.length,
    producao: requests.filter(request => request.status === "em_producao").length,
    aprovacao: requests.filter(request => request.status === "em_aprovacao").length,
    entregues: requests.filter(request => request.status === "entregue").length,
  };

  const calendarYear = calendarCursor.getFullYear();
  const calendarMonth = calendarCursor.getMonth();
  const firstWeekday = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const calendarCells = Array.from({ length: calendarCellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) return null;
    const date = new Date(calendarYear, calendarMonth, day);
    const key = marketingDateKey(date);
    return { day, key, posts: posts.filter(post => post.scheduledDate === key) };
  });

  const agendarPost = (event) => {
    event.preventDefault();
    if (!calendarForm.acao.trim() || !calendarForm.scheduledDate) return;
    const novoPost = {
      id: Date.now(),
      ...calendarForm,
      acao: calendarForm.acao.trim(),
      legenda: calendarForm.legenda.trim(),
      data: marketingDateLabel(calendarForm.scheduledDate),
      status: "agendado",
      googleCalendarSent: false,
    };
    setPosts(prev => [novoPost, ...prev]);
    const scheduled = new Date(`${calendarForm.scheduledDate}T12:00:00`);
    setCalendarCursor(new Date(scheduled.getFullYear(), scheduled.getMonth(), 1));
    setCalendarNotice("Postagem adicionada ao calendário editorial.");
    setCalendarForm(prev => ({ ...prev, acao: "", legenda: "" }));
  };

  const enviarGoogleAgenda = (post) => {
    window.open(googleCalendarUrl(post), "_blank", "noopener,noreferrer");
    setPosts(prev => prev.map(item => item.id === post.id ? { ...item, googleCalendarSent: true } : item));
    setCalendarNotice("Evento preparado no Google Agenda. Revise e confirme na nova aba.");
  };

  const gerarLegenda = () => {
    setGerando(true);
    setGerado(false);
    setLegenda("");
    const legendas = {
      emotivo: `Mais um ${acaoSelecionada} realizado com amor e dedicação. 💛 Cada gesto de cuidado transforma vidas — e é isso que nos move. Obrigado a cada voluntário que esteve presente, fazendo a diferença nas ruas de Belém. Juntos somos mais fortes.\n\n#AmorEmFoco #Belém #Voluntariado #Solidariedade`,
      informativo: `A Amor em Foco realizou mais uma ação de ${acaoSelecionada} em Belém, PA. Foram dezenas de atendimentos realizados por nossa equipe de voluntários, levando dignidade e cuidado às comunidades mais vulneráveis da cidade.\n\n#AmorEmFoco #AçãoSocial #Belém`,
      convocacao: `Você quer fazer a diferença? 🙋 Nossa próxima ação de ${acaoSelecionada} está chegando e precisamos de voluntários! Acesse o link na bio e se inscreva. Venha transformar vidas conosco.\n\n#AmorEmFoco #Voluntariado #Belém #VemSerVoluntário`,
    };
    let i = 0;
    const texto = legendas[tom] || legendas.emotivo;
    const interval = setInterval(() => {
      setLegenda(texto.slice(0, i));
      i += 3;
      if (i > texto.length) { clearInterval(interval); setGerando(false); setGerado(true); }
    }, 18);
  };

  const salvarPost = () => {
    if (!legenda) return;
    setPosts(prev => [{ id: Date.now(), legenda, acao: acaoSelecionada, data: new Date().toLocaleDateString("pt-BR"), status: "rascunho", canal: "Instagram", responsavel: "Equipe de Marketing" }, ...prev]);
    setLegenda(""); setGerado(false);
  };

  const loadProtectionImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:/i.test(src)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível abrir esta imagem para processamento."));
    image.src = src;
  });

  const getFaceDetector = async () => {
    if (faceDetectorRef.current) return faceDetectorRef.current;
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: "/mediapipe/models/blaze_face_short_range.tflite" },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
      minSuppressionThreshold: 0.3,
    });
    return faceDetectorRef.current;
  };

  const processProtectionImage = async (foto) => {
    setMascarando(true);
    setProtectionError("");
    setProtectionNotice("Carregando o detector local...");
    setFaceBoxes([]);
    setReviewConfirmed(false);
    try {
      const image = await loadProtectionImage(foto.url);
      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = protectionCanvasRef.current;
      if (canvas) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      const detector = await getFaceDetector();
      setProtectionNotice("Detectando rostos no dispositivo...");
      const result = detector.detect(image);
      const boxes = (result.detections || []).map((detection, index) => {
        const box = detection.boundingBox;
        return {
          id: `${Date.now()}-${index}`,
          x: Math.max(0, box.originX * scale),
          y: Math.max(0, box.originY * scale),
          width: Math.min(targetWidth, box.width * scale),
          height: Math.min(targetHeight, box.height * scale),
          confidence: detection.categories?.[0]?.score || null,
          manual: false,
        };
      });
      setFaceBoxes(boxes);
      setProtectionNotice(boxes.length
        ? `${boxes.length} rosto(s) detectado(s). Revise e adicione máscaras se algo ficou de fora.`
        : "Nenhum rosto foi detectado. Você pode marcar manualmente arrastando sobre a imagem.");
    } catch (error) {
      setProtectionError(error?.message || "Falha ao processar a imagem.");
      setProtectionNotice("Use o modo manual para proteger a imagem.");
    } finally {
      setMascarando(false);
    }
  };

  const iniciarMascaramento = (foto) => {
    setFotoSelecionada(foto);
    setMascVisible(true);
    processProtectionImage(foto);
    setTimeout(() => protectionEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  const drawProtectedCanvas = async () => {
    if (!fotoSelecionada || !protectionCanvasRef.current) return;
    try {
      const image = await loadProtectionImage(fotoSelecionada.url);
      const canvas = protectionCanvasRef.current;
      if (!canvas.width || !canvas.height) {
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      }
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      faceBoxes.forEach((box) => {
        const paddingX = box.width * (maskPadding / 100);
        const paddingY = box.height * (maskPadding / 100);
        const x = Math.max(0, box.x - paddingX);
        const y = Math.max(0, box.y - paddingY);
        const width = Math.min(canvas.width - x, box.width + paddingX * 2);
        const height = Math.min(canvas.height - y, box.height + paddingY * 2);
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.clip();
        if (maskStyle === "blur") {
          ctx.filter = `blur(${Math.max(16, Math.round(width * 0.14))}px)`;
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";
        } else if (maskStyle === "aef") {
          ctx.fillStyle = "#D70D16";
          ctx.fillRect(x, y, width, height);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `700 ${Math.max(12, Math.round(width * 0.22))}px Outfit, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("AEF", x + width / 2, y + height / 2);
        } else {
          ctx.fillStyle = "rgba(18,18,20,0.94)";
          ctx.fillRect(x, y, width, height);
        }
        ctx.restore();
      });
    } catch (error) {
      setProtectionError(error?.message || "Não foi possível gerar a prévia protegida.");
    }
  };

  useEffect(() => {
    if (mascVisible && !mascarando) drawProtectedCanvas();
  }, [fotoSelecionada, faceBoxes, maskStyle, maskPadding, mascVisible, mascarando]);

  useEffect(() => () => {
    faceDetectorRef.current?.close?.();
  }, []);

  const protectionPoint = (event) => {
    const canvas = protectionCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startManualMask = (event) => {
    if (mascarando) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    manualStartRef.current = protectionPoint(event);
    setManualDrawing(true);
  };

  const finishManualMask = (event) => {
    if (!manualStartRef.current) return;
    const end = protectionPoint(event);
    const start = manualStartRef.current;
    const box = {
      id: `manual-${Date.now()}`,
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
      confidence: null,
      manual: true,
    };
    if (box.width > 12 && box.height > 12) setFaceBoxes(prev => [...prev, box]);
    manualStartRef.current = null;
    setManualDrawing(false);
    setReviewConfirmed(false);
  };

  const handleProtectionUpload = (file) => {
    if (!file) return;
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      setProtectionError("Formato não suportado. Envie uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setProtectionError("A imagem deve ter no máximo 12 MB.");
      return;
    }
    setProtectionError("");
    setProtectionNotice("Lendo a imagem selecionada...");
    setMascarando(true);
    const reader = new FileReader();
    reader.onload = () => iniciarMascaramento({
      id: `upload-${Date.now()}`,
      nome: file.name,
      tipo: "foto",
      acao: "Upload local",
      data: new Date().toLocaleDateString("pt-BR"),
      url: reader.result,
      tags: ["upload local"],
    });
    reader.onerror = () => {
      setMascarando(false);
      setProtectionError("Não foi possível ler a imagem selecionada.");
    };
    reader.readAsDataURL(file);
  };

  const canvasToDataUrl = () => protectionCanvasRef.current?.toDataURL("image/jpeg", 0.9);

  const salvarImagemProtegida = () => {
    if (!reviewConfirmed || !faceBoxes.length) return;
    const protectedUrl = canvasToDataUrl();
    if (!protectedUrl) return;
    const protectedItem = {
      id: Date.now(),
      nome: `${fotoSelecionada.nome.replace(/\.[^.]+$/, "")} — protegida.jpg`,
      tipo: "foto",
      acao: fotoSelecionada.acao || "Marketing",
      data: new Date().toLocaleDateString("pt-BR"),
      url: protectedUrl,
      tags: [...(fotoSelecionada.tags || []), "protegida", "revisada"],
      protected: true,
      sourceId: fotoSelecionada.id,
      protectedBy: user?.name || "Equipe de Marketing",
      protectedAt: new Date().toISOString(),
      maskCount: faceBoxes.length,
    };
    setAcervo(prev => [protectedItem, ...prev]);
    setProtectionNotice("Versão protegida e revisada salva separadamente no Acervo.");
  };

  const baixarImagemProtegida = () => {
    const url = canvasToDataUrl();
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fotoSelecionada?.nome?.replace(/\.[^.]+$/, "") || "imagem"}-protegida.jpg`;
    link.click();
  };

  const REQUEST_TONE = { brief_recebido: "purple", em_producao: "teal", em_aprovacao: "amber", entregue: "green" };
  const PRIORITY_TONE = { alta: "red", media: "amber", baixa: "green" };
  const PRIORITY_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" };
  const POST_TONE = { rascunho: "amber", em_aprovacao: "purple", agendado: "blue", publicado: "green" };

  return (
    <div className="aef-mkt">
      <header className="aef-mkt__head">
        <div>
          <h1 className="aef-mkt__title">Marketing</h1>
          <p className="aef-mkt__desc">Planejamento, produção e proteção do conteúdo institucional.</p>
        </div>
        <span className="aef-mkt__aside">{requests.filter(item => item.status !== "entregue").length} demandas ativas</span>
      </header>

      <nav aria-label="Ferramentas de Marketing" className="aef-mkt__tabs">
        {MARKETING_NAV_ITEMS.map(item => (
          <button key={item.id} type="button" className="aef-mkt__tab" aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)}>
            <span aria-hidden="true"><Icon name={item.icon} size={14} /></span>{item.label}
          </button>
        ))}
      </nav>

      <div className="aef-mkt__section-head"><h2 className="aef-mkt__h2">{activeMarketingSection.title}</h2><p className="aef-mkt__hint">{activeMarketingSection.description}</p></div>

      {/* ── DEMANDAS ── */}
      {tab === "demandas" && (
        <div>
          {requestNotice && (
            <div role="status" className="aef-mkt__notice"><span className="aef-mkt__notice-text"><span aria-hidden="true"><Icon name="check" size={14} /></span>{requestNotice}</span><button type="button" className="aef-mkt__btn" onClick={() => setRequestNotice("")} aria-label="Fechar aviso">Fechar</button></div>
          )}

          <ul className="aef-mkt__figures">
            {[
              ["Recebidas", requestMetrics.recebidas, "blue"],
              ["Em produção", requestMetrics.producao, "teal"],
              ["Em aprovação", requestMetrics.aprovacao, "amber"],
              ["Entregues", requestMetrics.entregues, "green"],
            ].map(([label, value, tone]) => (
              <li key={label} className="aef-mkt__figure" data-tone={tone}><span className="aef-mkt__figure-label">{label}</span><span className="aef-mkt__figure-value">{value}</span></li>
            ))}
          </ul>

          <div className="aef-mkt__split aef-mkt__split--form-first">
            <form onSubmit={criarDemanda} className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__form">
              <div className="aef-mkt__form-head"><h3 className="aef-mkt__h3">Nova solicitação</h3><p className="aef-mkt__hint">O andamento também aparecerá no Mural.</p></div>

              <div className="aef-mkt__field"><label htmlFor="marketing-request-title" className="aef-mkt__label">O que você precisa?</label><input id="marketing-request-title" className="aef-mkt__input" required value={requestForm.titulo} onChange={e => setRequestForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Ex.: Divulgação da próxima ação" /></div>

              <div className="aef-mkt__row2">
                <div className="aef-mkt__field">
                  <label htmlFor="marketing-request-sector" className="aef-mkt__label">Setor</label>
                  <select id="marketing-request-sector" className="aef-mkt__select" value={requestForm.setor} onChange={e => setRequestForm(prev => ({ ...prev, setor: e.target.value }))}>
                    {["Diretoria", "Operações", "Financeiro", "RH", "Jurídico", "Marketing"].map(setor => <option key={setor}>{setor}</option>)}
                  </select>
                </div>
                <div className="aef-mkt__field">
                  <label htmlFor="marketing-request-format" className="aef-mkt__label">Formato</label>
                  <select id="marketing-request-format" className="aef-mkt__select" value={requestForm.formato} onChange={e => setRequestForm(prev => ({ ...prev, formato: e.target.value }))}>
                    {["Post estático", "Carrossel", "Story", "Vídeo/Reels", "Campanha", "Outro"].map(formato => <option key={formato}>{formato}</option>)}
                  </select>
                </div>
              </div>

              <div className="aef-mkt__row2">
                <div className="aef-mkt__field">
                  <label htmlFor="marketing-request-priority" className="aef-mkt__label">Prioridade</label>
                  <select id="marketing-request-priority" className="aef-mkt__select" value={requestForm.prioridade} onChange={e => setRequestForm(prev => ({ ...prev, prioridade: e.target.value }))}>
                    <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
                  </select>
                </div>
                <div className="aef-mkt__field">
                  <label htmlFor="marketing-request-deadline" className="aef-mkt__label">Prazo</label>
                  <input id="marketing-request-deadline" className="aef-mkt__input" required type="date" value={requestForm.prazo} onChange={e => setRequestForm(prev => ({ ...prev, prazo: e.target.value }))} />
                </div>
              </div>

              <div className="aef-mkt__field"><label htmlFor="marketing-request-brief" className="aef-mkt__label">Briefing</label><textarea id="marketing-request-brief" className="aef-mkt__textarea" value={requestForm.descricao} onChange={e => setRequestForm(prev => ({ ...prev, descricao: e.target.value }))} rows={4} placeholder="Objetivo, público, mensagem e referências…" /></div>

              <button type="submit" className="aef-mkt__btn aef-mkt__btn--primary aef-mkt__btn--block">
                <span aria-hidden="true"><Icon name="plus" size={14} /></span> Enviar pedido
              </button>
            </form>

            <section className="aef-mkt__panel">
              <div className="aef-mkt__panel-head">
                <div>
                  <h3 className="aef-mkt__h3">Fila de demandas</h3>
                  <p className="aef-mkt__hint">Do briefing recebido até a entrega final.</p>
                </div>
                <span className="aef-mkt__aside">{requests.length} pedidos</span>
              </div>

              <ul className="aef-mkt__list">
                {requests.map((request) => {
                  return (
                    <li key={request.id} className="aef-mkt__item">
                      <div className="aef-mkt__item-head">
                        <div style={{ minWidth: 0 }}>
                          <div className="aef-mkt__item-title">{request.titulo}</div>
                          <div className="aef-mkt__meta"><span>{request.solicitante || request.setor}</span><span>{request.setor}</span><span>{request.formato || "Conteúdo"}</span></div>
                        </div>
                        <span className="aef-mkt__tone-text aef-mkt__cap" data-tone={PRIORITY_TONE[request.prioridade] || "amber"}>{PRIORITY_LABEL[request.prioridade] || request.prioridade}</span>
                      </div>
                      {request.descricao && <p className="aef-mkt__item-text">{request.descricao}</p>}
                      <div className="aef-mkt__item-foot">
                        <span className="aef-mkt__due"><span aria-hidden="true"><Icon name="clock" size={13} /></span>Prazo: {marketingDateLabel(request.prazo)}</span>
                        <select aria-label={`Status de ${request.titulo}`} className="aef-mkt__status-select" data-tone={REQUEST_TONE[request.status] || "purple"} value={request.status} onChange={e => atualizarStatusDemanda(request.id, e.target.value)}>
                          {Object.entries(MARKETING_REQUEST_STATUS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
                        </select>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* ── ACERVO ── */}
      {tab === "acervo" && (
        <div>
          <div className="aef-mkt__chips" role="group" aria-label="Filtrar acervo">
            {["todos","foto","logo","arte"].map(f => (
              <button key={f} type="button" className="aef-mkt__chip" aria-pressed={acervoFilter === f} onClick={() => setAcervoFilter(f)}>{f}</button>
            ))}
          </div>

          <ul className="aef-mkt__media">
            {acervoFiltrado.map(f => (
              <li key={f.id} className="aef-mkt__panel aef-mkt__tile">
                <div className="aef-mkt__tile-img">
                  <img src={f.url} alt={f.nome} />
                </div>
                <div className="aef-mkt__tile-body">
                  <div className="aef-mkt__tile-name">{f.nome}</div>
                  <div className="aef-mkt__tile-foot">
                    <span className="aef-mkt__meta" style={{ marginTop: 0 }}>{f.acao !== "—" && <span>{f.acao}</span>}{f.data !== "—" && <span>{f.data}</span>}</span>
                    <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={() => iniciarMascaramento(f)}>Proteger</button>
                  </div>
                </div>
              </li>
            ))}

            {/* Drive link card */}
            <li style={{ display: "grid" }}>
              <button type="button" className="aef-mkt__drive">
                <span aria-hidden="true"><Icon name="plus" size={18} /></span>
                Abrir Google Drive
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* ── CALENDÁRIO ── */}
      {tab === "calendario" && (
        <div>
          {calendarNotice && (
            <div role="status" className="aef-mkt__notice"><span className="aef-mkt__notice-text"><span aria-hidden="true"><Icon name="check" size={14} /></span>{calendarNotice}</span><button type="button" className="aef-mkt__btn" onClick={() => setCalendarNotice("")} aria-label="Fechar aviso">Fechar</button></div>
          )}

          <div className="aef-mkt__split aef-mkt__split--form-last">
            <section className="aef-mkt__panel" style={{ overflow: "hidden" }}>
              <div className="aef-mkt__cal-bar">
                <div>
                  <h3 className="aef-mkt__cal-month">{calendarCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h3>
                  <p className="aef-mkt__hint">Calendário editorial da equipe</p>
                </div>
                <div className="aef-mkt__cal-nav">
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={() => setCalendarCursor(new Date())}>Hoje</button>
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--outline aef-mkt__btn--icon" onClick={() => setCalendarCursor(new Date(calendarYear, calendarMonth - 1, 1))} aria-label="Mês anterior"><span className="aef-mkt__flip" aria-hidden="true"><Icon name="chevronRight" size={16} /></span></button>
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--outline aef-mkt__btn--icon" onClick={() => setCalendarCursor(new Date(calendarYear, calendarMonth + 1, 1))} aria-label="Próximo mês"><span aria-hidden="true"><Icon name="chevronRight" size={16} /></span></button>
                </div>
              </div>

              <div className="aef-mkt__cal-scroll">
                <div className="aef-mkt__cal">
                  <div className="aef-mkt__cal-week">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(day => <span key={day}>{day}</span>)}
                  </div>
                  <div className="aef-mkt__cal-grid">
                    {calendarCells.map((cell, index) => {
                      const isToday = cell?.key === marketingDateKey(new Date());
                      return (
                        <div key={cell?.key || `empty-${index}`} className="aef-mkt__cal-day" data-empty={cell ? undefined : "true"} data-today={isToday ? "true" : undefined} data-last-row={index >= calendarCellCount - 7 ? "true" : undefined}>
                          {cell && (
                            <>
                              <div className="aef-mkt__cal-num">{cell.day}</div>
                              <div className="aef-mkt__cal-posts">
                                {cell.posts.slice(0, 2).map(post => (
                                  <div key={post.id} className="aef-mkt__cal-post" data-tone={post.googleCalendarSent ? "green" : "blue"}>
                                    <div className="aef-mkt__cal-post-meta"><span>{post.scheduledTime || "09:00"}</span><span>{post.canal}</span></div>
                                    <div title={post.acao} className="aef-mkt__cal-post-title">{post.acao}</div>
                                    <button type="button" className="aef-mkt__cal-send" onClick={() => enviarGoogleAgenda(post)}>
                                      {post.googleCalendarSent ? "Enviado ao Agenda" : "Enviar ao Agenda"}
                                    </button>
                                  </div>
                                ))}
                                {cell.posts.length > 2 && <div className="aef-mkt__cal-more">+{cell.posts.length - 2} postagem(ns)</div>}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={agendarPost} className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__form">
              <div className="aef-mkt__form-head"><h3 className="aef-mkt__h3">Agendar postagem</h3><p className="aef-mkt__hint">Organize aqui e envie ao Google Agenda quando precisar.</p></div>

              <div className="aef-mkt__field"><label htmlFor="mkt-cal-titulo" className="aef-mkt__label">Título da postagem</label><input id="mkt-cal-titulo" className="aef-mkt__input" required value={calendarForm.acao} onChange={e => setCalendarForm(prev => ({ ...prev, acao: e.target.value }))} placeholder="Ex.: Chamada para voluntários" /></div>

              <div className="aef-mkt__row2">
                <div className="aef-mkt__field">
                  <label htmlFor="mkt-cal-data" className="aef-mkt__label">Data</label>
                  <input id="mkt-cal-data" className="aef-mkt__input" required type="date" value={calendarForm.scheduledDate} onChange={e => setCalendarForm(prev => ({ ...prev, scheduledDate: e.target.value }))} />
                </div>
                <div className="aef-mkt__field">
                  <label htmlFor="mkt-cal-hora" className="aef-mkt__label">Horário</label>
                  <input id="mkt-cal-hora" className="aef-mkt__input" required type="time" value={calendarForm.scheduledTime} onChange={e => setCalendarForm(prev => ({ ...prev, scheduledTime: e.target.value }))} />
                </div>
              </div>

              <div className="aef-mkt__field">
                <label htmlFor="mkt-cal-canal" className="aef-mkt__label">Canal</label>
                <select id="mkt-cal-canal" className="aef-mkt__select" value={calendarForm.canal} onChange={e => setCalendarForm(prev => ({ ...prev, canal: e.target.value }))}>
                  {["Instagram", "Facebook", "WhatsApp", "LinkedIn", "Site", "E-mail"].map(canal => <option key={canal}>{canal}</option>)}
                </select>
              </div>

              <div className="aef-mkt__field"><label htmlFor="mkt-cal-resp" className="aef-mkt__label">Responsável</label><input id="mkt-cal-resp" className="aef-mkt__input" value={calendarForm.responsavel} onChange={e => setCalendarForm(prev => ({ ...prev, responsavel: e.target.value }))} /></div>

              <div className="aef-mkt__field"><label htmlFor="mkt-cal-legenda" className="aef-mkt__label">Observação ou legenda</label><textarea id="mkt-cal-legenda" className="aef-mkt__textarea" value={calendarForm.legenda} onChange={e => setCalendarForm(prev => ({ ...prev, legenda: e.target.value }))} rows={3} placeholder="Resumo do conteúdo…" /></div>

              <button type="submit" className="aef-mkt__btn aef-mkt__btn--primary aef-mkt__btn--block">
                <span aria-hidden="true"><Icon name="plus" size={14} /></span> Adicionar ao calendário
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── IA ── */}
      {tab === "ia" && (
        <div className="aef-mkt__narrow">
          <section className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__form">
            <div className="aef-mkt__form-head"><h3 className="aef-mkt__h3">Configurar geração</h3><p className="aef-mkt__hint">Escolha o contexto e o tom antes de gerar.</p></div>

            <div className={mobile ? "aef-mkt__form" : "aef-mkt__row2"}>
              <div className="aef-mkt__field">
                <label htmlFor="mkt-ia-acao" className="aef-mkt__label">Ação</label>
                <select id="mkt-ia-acao" className="aef-mkt__select" value={acaoSelecionada} onChange={e => setAcaoSelecionada(e.target.value)}>
                  {["Café de Rua","Sopão da Noite","Ação de Saúde","Visita Orfanato","Lar de Idosos","Arrecadação"].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="aef-mkt__field">
                <span className="aef-mkt__label" id="mkt-ia-tom">Tom</span>
                <div className="aef-mkt__segments" role="group" aria-labelledby="mkt-ia-tom">
                  {[["emotivo","Emotivo"],["informativo","Informativo"],["convocacao","Convocação"]].map(([id, label]) => (
                    <button key={id} type="button" className="aef-mkt__segment" aria-pressed={tom === id} onClick={() => setTom(id)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            <button type="button" onClick={gerarLegenda} disabled={gerando} aria-busy={gerando} className="aef-mkt__btn aef-mkt__btn--primary aef-mkt__btn--block">
              {gerando ? (
                <><span className="aef-mkt__spinner" aria-hidden="true" /> Gerando…</>
              ) : (
                <>Gerar com IA</>
              )}
            </button>
          </section>

          {/* Output */}
          {(legenda || gerando) && (
            <section className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__form">
              <div className="aef-mkt__field">
                <label htmlFor="generated-caption" className="aef-mkt__label">Legenda gerada</label>
                <textarea id="generated-caption"
                  className="aef-mkt__textarea aef-mkt__textarea--tall"
                  value={legenda}
                  onChange={e => setLegenda(e.target.value)}
                  rows={8}
                />
              </div>
              {gerado && (
                <div className="aef-mkt__row-actions">
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={gerarLegenda}>Gerar outra</button>
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--primary" onClick={salvarPost}>Salvar rascunho</button>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ── POSTS ── */}
      {tab === "posts" && (
        <ul className="aef-mkt__panel aef-mkt__list">
          {posts.map(p => (
            <li key={p.id} className="aef-mkt__item">
              <div className="aef-mkt__item-head">
                <div>
                  <div className="aef-mkt__item-title">{p.acao}</div>
                  <div className="aef-mkt__meta"><span>{p.data}</span>{p.canal && <span>{p.canal}</span>}</div>
                </div>
                <span className="aef-mkt__tone-text aef-mkt__cap" data-tone={POST_TONE[p.status] || "amber"}>{MARKETING_POST_STATUS[p.status]?.label || p.status}</span>
              </div>
              <p className="aef-mkt__item-text aef-mkt__item-text--3">{p.legenda}</p>
              <div className="aef-mkt__actions">
                <button type="button" className="aef-mkt__btn aef-mkt__btn--outline">Editar</button>
                {p.status === "rascunho" && (
                  <button type="button" className="aef-mkt__btn aef-mkt__btn--primary">Copiar para Instagram</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── PROTEÇÃO ── */}
      {tab === "protecao" && (
        <div className="aef-mkt__protect">
          <section className="aef-mkt__panel aef-mkt__intro">
            <div className="aef-mkt__intro-main">
              <span className="aef-mkt__intro-icon" aria-hidden="true"><Icon name="shield" size={18} /></span>
              <div><h3 className="aef-mkt__h3">Processamento seguro no navegador</h3><p className="aef-mkt__hint">O MediaPipe detecta rostos localmente. A equipe revisa todas as máscaras antes de gerar uma nova versão.</p></div>
            </div>
            <span className="aef-mkt__intro-note">Modelo local e revisão humana</span>
          </section>

          {protectionError && <p className="aef-mkt__error" role="alert">{protectionError}</p>}

          <div className="aef-mkt__protect-grid">
            <div className="aef-mkt__panel aef-mkt__panel--pad aef-mkt__steps" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); handleProtectionUpload(event.dataTransfer.files?.[0]); }}>
              <div className="aef-mkt__step">
                <div className="aef-mkt__step-head">
                  <h3 className="aef-mkt__step-title">1. Escolha a imagem</h3>
                  <div className="aef-mkt__upload">
                    <label htmlFor="protection-image-upload" className="aef-mkt__btn aef-mkt__btn--outline"><span aria-hidden="true"><Icon name="upload" size={13} /></span> Selecionar do computador</label>
                    <input id="protection-image-upload" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; handleProtectionUpload(file); }} />
                  </div>
                </div>
                <div className="aef-mkt__thumbs">
                  {acervo.filter(f => f.tipo === "foto" && !f.protected).slice(0, 6).map(f => (
                    <button key={f.id} type="button" className="aef-mkt__thumb" aria-pressed={fotoSelecionada?.id === f.id} onClick={() => iniciarMascaramento(f)} title={f.nome}>
                      <img src={f.url} alt={f.nome} crossOrigin={/^https?:/i.test(f.url) ? "anonymous" : undefined} />
                    </button>
                  ))}
                </div>
                <div className="aef-mkt__drop-hint" aria-live="polite">
                  {mascarando ? "Processando a foto selecionada…" : fotoSelecionada?.acao === "Upload local" ? `Selecionada: ${fotoSelecionada.nome}` : "Ou arraste aqui uma imagem JPG, PNG ou WebP"}
                </div>
              </div>

              <div className="aef-mkt__step">
                <h3 className="aef-mkt__step-title" id="mkt-mask-style">2. Escolha a proteção</h3>
                <div className="aef-mkt__segments" role="group" aria-labelledby="mkt-mask-style">
                  {[["blur","Desfoque"], ["aef","Elemento AEF"], ["silhouette","Silhueta"]].map(([id, label]) => (
                    <button key={id} type="button" className="aef-mkt__segment" aria-pressed={maskStyle === id} onClick={() => { setMaskStyle(id); setReviewConfirmed(false); }}>{label}</button>
                  ))}
                </div>

                <label className="aef-mkt__field" htmlFor="mkt-mask-padding">
                  <span className="aef-mkt__range-head"><span>Margem da máscara</span><span>{maskPadding}%</span></span>
                  <input id="mkt-mask-padding" className="aef-mkt__range" type="range" min="0" max="45" value={maskPadding} onChange={event => { setMaskPadding(Number(event.target.value)); setReviewConfirmed(false); }} />
                </label>

                <p className="aef-mkt__tip">
                  <strong>Correção manual:</strong> arraste sobre qualquer rosto que o detector não encontrou. Remova máscaras incorretas na lista ao lado.
                </p>
              </div>
            </div>

            <div ref={protectionEditorRef} className="aef-mkt__panel aef-mkt__editor">
              {!mascVisible ? (
                <div className="aef-mkt__editor-empty">
                  <span aria-hidden="true"><Icon name="shield" size={22} /></span>
                  <h3 className="aef-mkt__h3">Selecione uma foto para começar</h3>
                  <p className="aef-mkt__hint">O original será preservado.</p>
                </div>
              ) : (
                <>
                  <div className="aef-mkt__editor-head">
                    <div style={{ minWidth: 0 }}>
                      <div className="aef-mkt__item-title">{fotoSelecionada?.nome}</div>
                      <div className="aef-mkt__hint" aria-live="polite">{manualDrawing ? "Solte para adicionar a máscara" : protectionNotice}</div>
                    </div>
                    <span className="aef-mkt__tone-text" data-tone={faceBoxes.length ? "green" : "amber"}>{faceBoxes.length} máscara(s)</span>
                  </div>

                  <div className="aef-mkt__stage" data-busy={mascarando ? "true" : undefined}>
                    <canvas ref={protectionCanvasRef} onPointerDown={startManualMask} onPointerUp={finishManualMask} onPointerCancel={() => { manualStartRef.current = null; setManualDrawing(false); }} aria-label="Editor da imagem protegida" />
                    {mascarando && (
                      <div className="aef-mkt__stage-busy" role="status">
                        <span className="aef-mkt__spinner" aria-hidden="true" />
                        <span>Processando no dispositivo…</span>
                      </div>
                    )}
                  </div>

                  {!mascarando && faceBoxes.length > 0 && (
                    <div className="aef-mkt__masks">
                      {faceBoxes.map((box, index) => (
                        <button key={box.id} type="button" className="aef-mkt__mask-chip" onClick={() => { setFaceBoxes(prev => prev.filter(item => item.id !== box.id)); setReviewConfirmed(false); }} title="Remover esta máscara">
                          Remover {box.manual ? "manual" : `rosto ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {!mascarando && (
                    <>
                      <label className="aef-mkt__confirm">
                        <input type="checkbox" checked={reviewConfirmed} onChange={event => setReviewConfirmed(event.target.checked)} disabled={!faceBoxes.length} />
                        <span>Revisei a imagem inteira e confirmei que todos os rostos que precisam de proteção estão cobertos.</span>
                      </label>
                      <div className="aef-mkt__final">
                        <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={() => processProtectionImage(fotoSelecionada)}>Detectar novamente</button>
                        <button type="button" className="aef-mkt__btn aef-mkt__btn--outline" onClick={baixarImagemProtegida} disabled={!reviewConfirmed || !faceBoxes.length}>Baixar versão</button>
                        <button type="button" className="aef-mkt__btn aef-mkt__btn--primary" onClick={salvarImagemProtegida} disabled={!reviewConfirmed || !faceBoxes.length}>Salvar no Acervo</button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
