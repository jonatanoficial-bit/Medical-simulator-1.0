/* ===========================
   Emergency Doctor Simulator
   Motor completo (AAA lite)
   - cases.json e exams.json na raiz
   - sistema expansivo por JSON
   - pontuação com penalidade (exames/medicações)
   - ranks: Residente -> Titular -> Pleno
   - save/load via localStorage
   =========================== */

const SAVE_KEY = "eds_save_v1";

const el = (id) => document.getElementById(id);

const state = {
  loaded: false,
  cases: [],
  exams: null,

  profile: {
    name: "",
    avatar: "images/avatar1.png"
  },

  progress: {
    score: 0,
    prestige: 0,
    correct: 0,
    wrong: 0,
    wrongExams: 0,
    deaths: 0,
    casesSolved: 0,
    solvedIds: [],
    rank: "residente"
  },

  current: {
    case: null,
    selectedExams: new Set(),
    selectedDx: null,
    selectedMeds: new Set(),
    openedQuestions: new Set()
  }
};

/* ===========================
   UTIL
   =========================== */

function toast(title, text) {
  const host = el("toastHost");
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<div class="toast-title">${escapeHtml(title)}</div><div class="toast-text">${escapeHtml(text)}</div>`;
  host.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(6px)";
    setTimeout(() => t.remove(), 260);
  }, 3200);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screen = document.querySelector(`[data-screen="${name}"]`);
  if (screen) screen.classList.add("active");
}

function safeBg(elementId, candidates) {
  const node = el(elementId);
  if (!node) return;
  // tenta em ordem (não dá para “testar” sem fetch, então apenas aplica a primeira e confia nos assets)
  // você pode trocar a ordem se quiser.
  node.style.backgroundImage = `url('${candidates[0]}')`;
  node.dataset.bgFallback = candidates.slice(1).join("|");
}

function normalizeTriage(t) {
  const s = String(t || "").toLowerCase();
  if (s.includes("vermelh")) return "Vermelho";
  if (s.includes("amarel")) return "Amarelo";
  return "Verde";
}

function triageWeight(triage) {
  const t = normalizeTriage(triage);
  if (t === "Vermelho") return 80;
  if (t === "Amarelo") return 50;
  return 30;
}

function getRankFromScore(score) {
  if (score >= 450) return "pleno";
  if (score >= 200) return "titular";
  return "residente";
}

function rankLabel(rank) {
  if (rank === "pleno") return "Médico Pleno";
  if (rank === "titular") return "Médico Titular";
  return "Médico Residente";
}

function rankMultiplier(rank) {
  if (rank === "pleno") return 1.35;
  if (rank === "titular") return 1.15;
  return 1.0;
}

/* ===========================
   DATA LOADER
   =========================== */

async function loadJson(path) {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} ao carregar ${path}`);
  return await r.json();
}

async function bootstrap() {
  // backgrounds (use seus nomes existentes; ordem importa)
  safeBg("homeBg", ["images/cover.png", "images/capa.jpg", "images/fundo.jpg"]);
  safeBg("profileBg", ["images/fundo.jpg", "images/cover.png", "images/capa.jpg"]);
  safeBg("directorBg", ["images/hospital_corridor.jpg", "images/fundo.jpg"]);
  safeBg("officeBg", ["images/hospital_corridor.jpg", "images/consultorio.jpg", "images/fundo.jpg"]);
  safeBg("caseBg", ["images/consultorio.jpg", "images/hospital_corridor.jpg", "images/fundo.jpg"]);

  // bind top actions
  el("btnHelp").addEventListener("click", () => openOverlay("helpOverlay"));
  el("btnFullscreen").addEventListener("click", requestFullscreen);

  // overlay closers
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const what = e.currentTarget.getAttribute("data-close");
      if (what === "help") closeOverlay("helpOverlay");
      if (what === "result") closeOverlay("resultOverlay");
      if (what === "exam") closeOverlay("examOverlay");
    });
  });

  // home buttons
  el("btnNewGame").addEventListener("click", onNewGame);
  el("btnContinue").addEventListener("click", onContinue);

  // profile buttons
  el("btnProfileBack").addEventListener("click", () => setScreen("home"));
  el("btnProfileNext").addEventListener("click", confirmProfile);

  // director
  el("btnSkipType").addEventListener("click", () => finishTypewriter(true));
  el("btnGoOffice").addEventListener("click", () => setScreen("office"));

  // office
  el("btnNextCase").addEventListener("click", startNextCase);
  el("btnSave").addEventListener("click", saveGame);
  el("btnReset").addEventListener("click", hardReset);

  // case
  el("btnBackOffice").addEventListener("click", () => setScreen("office"));
  el("btnFinalize").addEventListener("click", finalizeCase);

  // result actions
  el("btnResultNext").addEventListener("click", () => {
    closeOverlay("resultOverlay");
    startNextCase();
  });
  el("btnResultOffice").addEventListener("click", () => {
    closeOverlay("resultOverlay");
    setScreen("office");
  });

  // load data
  try {
    state.cases = await loadJson("cases.json");
    state.exams = await loadJson("exams.json");
    if (!Array.isArray(state.cases)) throw new Error("cases.json precisa ser um ARRAY: [ {...}, {...} ]");
    if (!state.exams || !Array.isArray(state.exams.exams)) throw new Error("exams.json inválido. Esperado { exams: [...] }");
    state.loaded = true;
  } catch (err) {
    alert("Erro ao carregar cases.json/exams.json. Verifique se os arquivos existem na raiz do projeto.\n\nDetalhe: " + err.message);
    state.loaded = false;
  }

  // Continue availability
  refreshContinueButton();

  // avatars
  buildAvatarGrid();

  // default HUD avatar
  el("hudAvatar").src = state.profile.avatar;

  // initial screen
  setScreen("home");
}

function refreshContinueButton() {
  const save = localStorage.getItem(SAVE_KEY);
  el("btnContinue").disabled = !save;
}

function openOverlay(id){ el(id).classList.remove("hidden"); }
function closeOverlay(id){ el(id).classList.add("hidden"); }

async function requestFullscreen() {
  try {
    const root = document.documentElement;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      toast("Tela cheia", "Modo tela cheia desativado.");
      return;
    }
    await root.requestFullscreen?.();
    toast("Tela cheia", "Modo tela cheia ativado.");
  } catch {
    toast("Tela cheia", "Seu navegador bloqueou tela cheia. Tente novamente tocando no botão.");
  }
}

/* ===========================
   PROFILE / AVATARS
   =========================== */

function buildAvatarGrid() {
  const grid = el("avatarGrid");
  grid.innerHTML = "";

  const avatarList = [
    { src: "images/avatar1.png", label: "Avatar 1" },
    { src: "images/avatar2.png", label: "Avatar 2" },
    { src: "images/avatar3.png", label: "Avatar 3" },
    { src: "images/avatar4.png", label: "Avatar 4" },
    { src: "images/avatar5.png", label: "Avatar 5" },
    { src: "images/avatar6.png", label: "Avatar 6" }
  ];

  avatarList.forEach((a) => {
    const card = document.createElement("div");
    card.className = "avatar-item";
    card.innerHTML = `
      <img class="avatar-img" src="${a.src}" alt="${escapeHtml(a.label)}"/>
      <div class="avatar-caption">${escapeHtml(a.label)}</div>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll(".avatar-item").forEach(x => x.classList.remove("selected"));
      card.classList.add("selected");
      state.profile.avatar = a.src;
    });

    grid.appendChild(card);
  });

  // select default
  const first = grid.querySelector(".avatar-item");
  if (first) first.classList.add("selected");
}

function confirmProfile() {
  const name = el("inpDoctorName").value.trim();
  state.profile.name = name || "Doutor(a)";

  el("hudAvatar").src = state.profile.avatar;
  el("hudName").textContent = state.profile.name;

  // typewriter screen
  startDirectorIntro();
  setScreen("director");
}

/* ===========================
   TYPEWRITER INTRO
   =========================== */

let twTimer = null;
let twFullText = "";
let twIndex = 0;

function startDirectorIntro() {
  const msg =
`Bem-vindo(a), ${state.profile.name}.

Precisamos que você assuma o posto imediatamente.
O pronto-socorro está com várias emergências em sequência.

Lembre-se:
- Use exames de forma racional.
- Escolhas erradas de medicação podem piorar o paciente.
- Casos VERMELHOS exigem rapidez e precisão.

Boa sorte — o hospital conta com você.`;

  twFullText = msg;
  twIndex = 0;
  el("typewriter").textContent = "";
  el("btnGoOffice").disabled = true;

  if (twTimer) clearInterval(twTimer);
  twTimer = setInterval(() => {
    if (twIndex >= twFullText.length) {
      finishTypewriter(false);
      return;
    }
    el("typewriter").textContent += twFullText[twIndex++];
  }, 18);
}

function finishTypewriter(force) {
  if (twTimer) clearInterval(twTimer);
  twTimer = null;

  if (force) el("typewriter").textContent = twFullText;
  el("btnGoOffice").disabled = false;
}

/* ===========================
   GAME FLOW
   =========================== */

function onNewGame() {
  if (!state.loaded) {
    toast("Erro", "Dados não carregados. Verifique cases.json e exams.json.");
    return;
  }
  // limpa
  state.progress = {
    score: 0,
    prestige: 0,
    correct: 0,
    wrong: 0,
    wrongExams: 0,
    deaths: 0,
    casesSolved: 0,
    solvedIds: [],
    rank: "residente"
  };
  state.current = {
    case: null,
    selectedExams: new Set(),
    selectedDx: null,
    selectedMeds: new Set(),
    openedQuestions: new Set()
  };

  localStorage.removeItem(SAVE_KEY);
  refreshHud();
  setScreen("profile");
}

function onContinue() {
  if (!state.loaded) {
    toast("Erro", "Dados não carregados. Verifique cases.json e exams.json.");
    return;
  }
  const save = localStorage.getItem(SAVE_KEY);
  if (!save) {
    toast("Continuar", "Nenhum salvamento encontrado.");
    return;
  }
  try {
    const data = JSON.parse(save);
    // aplica
    state.profile = data.profile || state.profile;
    state.progress = data.progress || state.progress;

    // normaliza sets
    state.current = {
      case: null,
      selectedExams: new Set(),
      selectedDx: null,
      selectedMeds: new Set(),
      openedQuestions: new Set()
    };

    el("hudAvatar").src = state.profile.avatar;
    el("hudName").textContent = state.profile.name;

    refreshHud();
    toast("Continuar", "Salvamento carregado com sucesso.");
    setScreen("office");
  } catch {
    toast("Erro", "Salvamento corrompido. Inicie um novo jogo.");
  }
}

function saveGame() {
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    profile: state.profile,
    progress: state.progress
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  refreshContinueButton();
  toast("Salvo", "Seu progresso foi salvo.");
}

function hardReset() {
  if (!confirm("Deseja reiniciar tudo? Isso apaga o salvamento e o progresso.")) return;
  localStorage.removeItem(SAVE_KEY);
  refreshContinueButton();
  onNewGame();
}

function refreshHud() {
  state.progress.rank = getRankFromScore(state.progress.score);

  el("hudRank").textContent = rankLabel(state.progress.rank);
  el("hudScore").textContent = String(state.progress.score);
  el("hudPrestige").textContent = String(state.progress.prestige);
  el("hudCorrect").textContent = String(state.progress.correct);
  el("hudWrong").textContent = String(state.progress.wrong);
  el("hudWrongExams").textContent = String(state.progress.wrongExams);
  el("hudDeaths").textContent = String(state.progress.deaths);
}

/* ===========================
   CASE SELECTION
   =========================== */

function pickCaseForRank(rank) {
  // filtra por tier, mas mantém aleatoriedade
  const pool = state.cases.filter(c => (c.tier || "residente") === rank);
  const fallback = state.cases; // se não houver, usa todos
  const use = pool.length ? pool : fallback;

  // evita repetir muito: preferir não resolvidos
  const unsolved = use.filter(c => !state.progress.solvedIds.includes(c.id));
  const finalPool = unsolved.length ? unsolved : use;

  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

function startNextCase() {
  const rank = state.progress.rank;
  const c = pickCaseForRank(rank);

  // reset selections
  state.current.case = c;
  state.current.selectedExams = new Set();
  state.current.selectedDx = null;
  state.current.selectedMeds = new Set();
  state.current.openedQuestions = new Set();

  renderCase(c);
  setScreen("case");
}

/* ===========================
   RENDER CASE
   =========================== */

function renderCase(c) {
  el("btnFinalize").disabled = true;

  // meta
  const triage = normalizeTriage(c.patient?.triage || "Verde");
  el("caseMeta").textContent = `${rankLabel(state.progress.rank)} • Caso: ${c.id} • Risco: ${triage}`;

  // patient
  el("patientPhoto").src = c.patient?.photo || "images/patient_male.jpg";
  el("patientName").textContent = `${c.patient?.name || "Paciente"} (${c.patient?.age ?? "?"}a, ${c.patient?.sex || "—"})`;

  const vitals = Array.isArray(c.vitals) ? c.vitals.join(" • ") : "";
  el("patientVitals").textContent = vitals;

  // triage badge with color
  const badge = el("patientTriage");
  badge.textContent = triage;
  badge.classList.remove("triage-green","triage-yellow","triage-red");
  if (triage === "Vermelho") badge.classList.add("triage-red");
  else if (triage === "Amarelo") badge.classList.add("triage-yellow");
  else badge.classList.add("triage-green");

  // text
  el("caseComplaint").textContent = c.complaint || "—";
  el("caseHistory").textContent = c.history || "—";

  // questions
  const qWrap = el("questionList");
  qWrap.innerHTML = "";
  (c.questions || []).forEach((q, idx) => {
    const item = document.createElement("div");
    item.className = "qa-item";
    item.innerHTML = `
      <div class="qa-top">
        <div class="qa-q">${escapeHtml(q.label || `Pergunta ${idx+1}`)}</div>
        <button class="btn btn-ghost" type="button">Ver resposta</button>
      </div>
      <div class="qa-a">${escapeHtml(q.answer || "—")}</div>
    `;
    const btn = item.querySelector("button");
    btn.addEventListener("click", () => {
      item.classList.toggle("open");
      state.current.openedQuestions.add(idx);
      btn.textContent = item.classList.contains("open") ? "Ocultar" : "Ver resposta";
      maybeEnableFinalize();
    });
    qWrap.appendChild(item);
  });

  // exams (catalog fixo)
  buildExamGrid(c);

  // diagnosis (1 escolha)
  buildDxGrid(c);

  // meds (multi)
  buildMedGrid(c);

  // finalize enable
  maybeEnableFinalize();
}

function buildExamGrid(c) {
  const grid = el("examGrid");
  grid.innerHTML = "";

  state.exams.exams.forEach(ex => {
    const btn = document.createElement("div");
    btn.className = "action-btn";
    btn.innerHTML = `
      <div class="ab-title">${escapeHtml(ex.label)}</div>
      <div class="ab-meta">Tempo: ${escapeHtml(String(ex.time ?? 30))} min • ${escapeHtml(ex.category ?? "Exame")}</div>
    `;

    btn.addEventListener("click", () => {
      const id = ex.id;
      // toggle selection
      if (state.current.selectedExams.has(id)) {
        state.current.selectedExams.delete(id);
        btn.classList.remove("selected");
      } else {
        state.current.selectedExams.add(id);
        btn.classList.add("selected");
        // abrir resultado ao solicitar
        showExamResult(c, ex);
      }
      maybeEnableFinalize();
    });

    grid.appendChild(btn);
  });
}

function showExamResult(c, ex) {
  const id = ex.id;
  const mapped = (c.examResults && c.examResults[id]) ? c.examResults[id] : null;
  const fallback = state.exams.normalFallback || { text: "Resultado dentro da normalidade (simulado).", image: null };

  const res = mapped || fallback;

  el("examTitle").textContent = ex.label;
  el("examText").textContent = res.text || fallback.text;

  const imgNode = el("examImage");
  const img = res.image || ex.image || null;
  if (img) {
    imgNode.style.backgroundImage = `url('${img}')`;
  } else {
    imgNode.style.backgroundImage = "linear-gradient(180deg, rgba(14,165,255,0.18), rgba(0,0,0,0.20))";
  }

  openOverlay("examOverlay");
}

function buildDxGrid(c) {
  const grid = el("dxGrid");
  grid.innerHTML = "";

  (c.diagnosis || []).forEach((dx) => {
    const btn = document.createElement("div");
    btn.className = "action-btn";
    btn.innerHTML = `
      <div class="ab-title">${escapeHtml(dx.label)}</div>
      <div class="ab-meta">Dificuldade: ${escapeHtml(dx.severity || "—")}</div>
    `;
    btn.addEventListener("click", () => {
      // unselect others
      grid.querySelectorAll(".action-btn").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      state.current.selectedDx = dx.label;
      maybeEnableFinalize();
    });
    grid.appendChild(btn);
  });
}

function buildMedGrid(c) {
  const grid = el("medGrid");
  grid.innerHTML = "";

  (c.medications || []).forEach((m) => {
    const btn = document.createElement("div");
    btn.className = "action-btn";
    btn.innerHTML = `
      <div class="ab-title">${escapeHtml(m.label)}</div>
      <div class="ab-meta">Risco: ${escapeHtml(m.risk || "baixa")}</div>
    `;
    btn.addEventListener("click", () => {
      const key = m.label;
      if (state.current.selectedMeds.has(key)) {
        state.current.selectedMeds.delete(key);
        btn.classList.remove("selected");
      } else {
        state.current.selectedMeds.add(key);
        btn.classList.add("selected");
      }
      maybeEnableFinalize();
    });
    grid.appendChild(btn);
  });
}

function maybeEnableFinalize() {
  // regra simples: precisa escolher diagnóstico
  el("btnFinalize").disabled = !state.current.selectedDx;
}

/* ===========================
   SCORING / OUTCOME
   =========================== */

function finalizeCase() {
  const c = state.current.case;
  if (!c) return;

  const triage = normalizeTriage(c.patient?.triage || "Verde");
  const base = triageWeight(triage);
  const mult = rankMultiplier(state.progress.rank);

  const dxChosen = state.current.selectedDx;
  const dxObj = (c.diagnosis || []).find(d => d.label === dxChosen);
  const dxCorrect = !!dxObj?.correct;

  const selectedExams = Array.from(state.current.selectedExams);
  const essential = Array.isArray(c.essentialExams) ? c.essentialExams : [];
  const recommended = Array.isArray(c.recommendedExams) ? c.recommendedExams : [];

  const missingEssential = essential.filter(x => !state.current.selectedExams.has(x));
  const wrongExamCount = selectedExams.filter(x => !recommended.includes(x) && !essential.includes(x)).length;

  // meds
  const medsChosen = Array.from(state.current.selectedMeds);
  const medsCorrectList = (c.medications || []).filter(m => m.correct).map(m => m.label);
  const medsWrongList = (c.medications || []).filter(m => !m.correct).map(m => m.label);

  const medsCorrectChosen = medsChosen.filter(m => medsCorrectList.includes(m));
  const medsWrongChosen = medsChosen.filter(m => medsWrongList.includes(m));

  // harmful meds: risco alta e incorreto
  const harmfulChosen = (c.medications || [])
    .filter(m => medsWrongChosen.includes(m.label) && String(m.risk||"").toLowerCase().includes("alta"))
    .map(m => m.label);

  // pontuação
  let delta = 0;

  // diagnóstico
  if (dxCorrect) delta += Math.round(base * mult);
  else delta -= Math.round(base * 0.75);

  // exames: recomendado/essencial dá leve bônus, errado penaliza
  delta += Math.min(8, (selectedExams.filter(x => recommended.includes(x) || essential.includes(x)).length) * 2);
  delta -= wrongExamCount * 5;

  // faltou essencial
  delta -= missingEssential.length * 10;

  // meds: acerto soma, erro subtrai, perigoso subtrai mais
  delta += medsCorrectChosen.length * 10;
  delta -= medsWrongChosen.length * 15;
  delta -= harmfulChosen.length * 15;

  // risco de piora/óbito (simulado)
  let severityRisk = 0;
  if (triage === "Vermelho") severityRisk += 2;
  if (triage === "Amarelo") severityRisk += 1;

  if (!dxCorrect) severityRisk += 2;
  if (missingEssential.length) severityRisk += 1;
  if (harmfulChosen.length) severityRisk += 2;
  if (wrongExamCount >= 2) severityRisk += 1;

  // outcome
  let outcome = "Alta/Observação";
  let death = false;

  if (severityRisk >= 6) { outcome = "Óbito (simulado)"; death = true; }
  else if (severityRisk >= 4) outcome = "Piora e necessidade de intervenção";
  else if (severityRisk >= 2) outcome = "Observação e retorno";
  else outcome = "Melhora/Alta";

  // aplica stats
  state.progress.casesSolved += 1;
  if (!state.progress.solvedIds.includes(c.id)) state.progress.solvedIds.push(c.id);

  if (dxCorrect) state.progress.correct += 1;
  else state.progress.wrong += 1;

  state.progress.wrongExams += wrongExamCount;
  if (death) state.progress.deaths += 1;

  // prestige: cresce com acerto e cai com óbito
  let prestigeDelta = 0;
  if (dxCorrect) prestigeDelta += 3;
  if (!dxCorrect) prestigeDelta -= 2;
  prestigeDelta -= wrongExamCount;
  prestigeDelta -= harmfulChosen.length * 2;
  if (death) prestigeDelta -= 12;

  state.progress.prestige = Math.max(0, state.progress.prestige + prestigeDelta);

  // score
  state.progress.score = Math.max(0, state.progress.score + delta);

  // rank update
  const oldRank = state.progress.rank;
  state.progress.rank = getRankFromScore(state.progress.score);

  refreshHud();
  saveGame(); // salva automaticamente ao finalizar

  if (oldRank !== state.progress.rank) {
    toast("Promoção", `Parabéns! Você agora é ${rankLabel(state.progress.rank)}.`);
  }

  // mostra resultado
  renderResult(c, {
    triage, base, mult,
    dxChosen, dxCorrect,
    selectedExams, wrongExamCount, missingEssential,
    medsChosen, medsCorrectChosen, medsWrongChosen, harmfulChosen,
    delta, prestigeDelta,
    outcome
  });

  openOverlay("resultOverlay");
}

function renderResult(c, r) {
  el("resultTitle").textContent = r.outcome;
  el("resultSubtitle").textContent = `${c.patient?.name || "Paciente"} • Triagem: ${r.triage}`;

  const summary = [];
  summary.push(`Diagnóstico: ${r.dxCorrect ? "ACERTO" : "ERRO"}.`);
  if (r.missingEssential.length) summary.push(`Faltou exame essencial: ${r.missingEssential.join(", ")}.`);
  if (r.wrongExamCount) summary.push(`Exames sem indicação: ${r.wrongExamCount} (penalidade).`);
  if (r.harmfulChosen.length) summary.push(`Condutas de alto risco escolhidas: ${r.harmfulChosen.join("; ")}.`);
  summary.push(`Desfecho: ${r.outcome}.`);

  el("resultSummary").textContent = summary.join(" ");

  el("resultScore").textContent =
    `Δ Pontos: ${r.delta} | Δ Prestígio: ${r.prestigeDelta}\n` +
    `Pontuação total: ${state.progress.score} | Prestígio: ${state.progress.prestige}\n` +
    `Cargo atual: ${rankLabel(state.progress.rank)}`;

  const examLabels = r.selectedExams.map(id => {
    const ex = state.exams.exams.find(x => x.id === id);
    return ex ? ex.label : id;
  });

  el("resultExams").textContent = examLabels.length ? examLabels.join(", ") : "Nenhum";
  el("resultDx").textContent = r.dxChosen || "Nenhum";
  el("resultMeds").textContent = r.medsChosen.length ? r.medsChosen.join(", ") : "Nenhuma";

  // ao fechar resultado, volta consultório por padrão
}

/* ===========================
   INIT
   =========================== */
bootstrap();
