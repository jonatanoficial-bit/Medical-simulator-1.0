/* ===============================
   AAA CORE
================================ */
const SAVE_KEY = "eds-save";
const RANK_KEY = "eds-ranking";

let deferredPWAInstall = null;

let gameState = {
  doctor: { name: "", avatar: "", tier: "residente" },
  points: 0,
  prestige: 0,
  casesDone: 0,
  hits: 0,
  mistakes: 0,

  cases: [],
  currentCase: null,

  examsCatalog: [],
  requestedExams: new Set(),
  selectedDiagnosis: null,
  selectedMedications: new Set(),

  // AAA time/pressure
  caseTimerSec: 0,
  caseLimitSec: 0,
  pressure: 0, // 0-100
  caseInterval: null
};

function $(id){ return document.getElementById(id); }
function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

function normalizeTriage(triage){
  const t = (triage || "").toLowerCase();
  if(t.includes("verd")) return "verde";
  if(t.includes("amar")) return "amarelo";
  if(t.includes("verm")) return "vermelho";
  return "amarelo";
}

function riskPenalty(risk){
  const r = (risk || "").toLowerCase();
  if(r === "baixa") return 10;
  if(r === "media" || r === "média") return 20;
  if(r === "alta") return 35;
  return 20;
}

function secToMMSS(sec){
  const m = Math.floor(sec/60);
  const s = sec%60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* ===============================
   SAVE / LOAD
================================ */
function saveGame(){
  const safe = {
    ...gameState,
    requestedExams: Array.from(gameState.requestedExams),
    selectedMedications: Array.from(gameState.selectedMedications),
    caseInterval: null // não salva interval
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(safe));
}

function loadSave(){
  const raw = localStorage.getItem(SAVE_KEY);
  if(!raw) return null;
  const data = JSON.parse(raw);
  data.requestedExams = new Set(data.requestedExams || []);
  data.selectedMedications = new Set(data.selectedMedications || []);
  data.caseInterval = null;
  return data;
}

/* ===============================
   PWA
================================ */
window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredPWAInstall = e;
});

async function installPWA(){
  if(!deferredPWAInstall){
    alert("Instalação não disponível agora. No Android/Chrome use: Menu > Instalar app.");
    return;
  }
  deferredPWAInstall.prompt();
  deferredPWAInstall = null;
}

async function registerSW(){
  if("serviceWorker" in navigator){
    try{
      await navigator.serviceWorker.register("./sw.js");
    }catch(e){
      console.warn("SW falhou:", e);
    }
  }
}

/* ===============================
   HELP / FULLSCREEN / RANKING UI
================================ */
function toggleFullscreen(){
  if(!document.fullscreenElement){
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function openHelp(){
  alert(
`MANUAL (AAA)
- Você pode pedir TODOS os exames. Exames errados custam tempo e pontuação.
- Alguns exames são ESSENCIAIS (penalidade grave se não pedir).
- Escolha 1 diagnóstico e até 2 condutas/medicações.
- Casos Vermelhos têm tempo crítico e risco de óbito.
Obs: Simulação educacional. Não é orientação médica real.`
  );
}

function openRanking(){
  renderRanking();
  $("rankOverlay").classList.remove("hidden");
}
function closeRanking(){
  $("rankOverlay").classList.add("hidden");
}

function renderRanking(){
  const list = JSON.parse(localStorage.getItem(RANK_KEY) || "[]");
  const body = $("rankBody");
  if(list.length === 0){
    body.innerHTML = "<p style='opacity:.85'>Sem registros ainda. Finalize casos para entrar no ranking.</p>";
    return;
  }
  const rows = list
    .slice(0,10)
    .map((r,i)=>`
      <div style="display:flex;justify-content:space-between;gap:10px;padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)">
        <div>
          <strong>#${i+1} ${r.name}</strong>
          <div style="opacity:.85;font-size:13px">Cargo: ${r.tier} · Casos: ${r.casesDone} · Acertos: ${r.hits} · Erros: ${r.mistakes}</div>
        </div>
        <div style="text-align:right">
          <strong>${r.points} pts</strong>
          <div style="opacity:.85;font-size:13px">Prestígio: ${r.prestige}</div>
        </div>
      </div>
    `).join("");
  body.innerHTML = rows;
}

function updateRanking(){
  const entry = {
    name: gameState.doctor.name || "Doutor(a)",
    tier: gameState.doctor.tier,
    points: gameState.points,
    prestige: gameState.prestige,
    casesDone: gameState.casesDone,
    hits: gameState.hits,
    mistakes: gameState.mistakes,
    at: Date.now()
  };
  const list = JSON.parse(localStorage.getItem(RANK_KEY) || "[]");
  list.push(entry);
  list.sort((a,b)=> (b.points - a.points) || (b.prestige - a.prestige) || (b.casesDone - a.casesDone));
  localStorage.setItem(RANK_KEY, JSON.stringify(list.slice(0,50)));
}

/* ===============================
   HOME / PROFILE
================================ */
function goHome(){ showScreen("screen-home"); }

function startNewGame() {
  localStorage.removeItem(SAVE_KEY);
  gameState = {
    doctor: { name: "", avatar: "", tier: "residente" },
    points: 0,
    prestige: 0,
    casesDone: 0,
    hits: 0,
    mistakes: 0,
    cases: [],
    currentCase: null,
    examsCatalog: [],
    requestedExams: new Set(),
    selectedDiagnosis: null,
    selectedMedications: new Set(),
    caseTimerSec: 0,
    caseLimitSec: 0,
    pressure: 0,
    caseInterval: null
  };
  showScreen("screen-profile");
  loadAvatars();
}

function continueGame() {
  const loaded = loadSave();
  if(!loaded) return alert("Nenhum jogo salvo.");
  gameState = loaded;
  enterOffice();
}

function loadAvatars() {
  const grid = $("avatarGrid");
  grid.innerHTML = "";
  ["avatar1","avatar2","avatar3","avatar4","avatar5","avatar6"].forEach(a=>{
    const img = document.createElement("img");
    img.src = `images/${a}.png`;
    img.onclick = ()=>{
      document.querySelectorAll("#avatarGrid img").forEach(i=>i.classList.remove("selected"));
      img.classList.add("selected");
      gameState.doctor.avatar = img.src;
    };
    grid.appendChild(img);
  });
}

function confirmProfile() {
  const name = $("doctorName").value.trim();
  if(!name || !gameState.doctor.avatar) return alert("Preencha nome e selecione um avatar.");
  gameState.doctor.name = name;
  saveGame();
  enterOffice();
}

/* ===============================
   LOAD DATA
================================ */
async function loadCasesIfNeeded(){
  if(gameState.cases && gameState.cases.length > 0) return;
  const res = await fetch("cases.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Falha ao carregar cases.json");
  gameState.cases = await res.json();
}

async function loadExamsIfNeeded(){
  if(gameState.examsCatalog && gameState.examsCatalog.length > 0) return;
  const res = await fetch("exams.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Falha ao carregar exams.json");
  gameState.examsCatalog = await res.json();
}

/* ===============================
   PROGRESSÃO AAA
================================ */
function applyProgression(){
  // thresholds AAA (ajuste livre)
  if(gameState.points >= 900) gameState.doctor.tier = "pleno";
  else if(gameState.points >= 350) gameState.doctor.tier = "titular";
  else gameState.doctor.tier = "residente";
}

function prestigeDeltaFromCaseScore(score, death=false){
  if(death) return -20;
  if(score >= 60) return +8;
  if(score >= 30) return +4;
  if(score >= 0) return +1;
  if(score < 0) return -3;
  return 0;
}

/* ===============================
   OFFICE
================================ */
async function enterOffice() {
  try{
    await loadCasesIfNeeded();
    await loadExamsIfNeeded();
  } catch(e){
    alert("Erro ao carregar cases.json/exams.json. Verifique se os arquivos estão na raiz do projeto.");
    console.error(e);
  }

  applyProgression();
  showScreen("screen-office");

  $("doctorAvatar").src = gameState.doctor.avatar || "images/avatar1.png";
  $("doctorInfo").innerHTML = `<strong>${gameState.doctor.name || "Doutor(a)"}</strong><br>Cargo: ${gameState.doctor.tier}`;

  $("points").innerText = String(gameState.points);
  $("casesDone").innerText = String(gameState.casesDone);
  $("prestige").innerText = String(gameState.prestige);
  $("mistakes").innerText = String(gameState.mistakes);
  $("hits").innerText = String(gameState.hits);

  saveGame();
}

function nextCase(){
  if(!gameState.cases || gameState.cases.length === 0){
    updateRanking();
    alert("Você concluiu todos os casos disponíveis. Seu desempenho foi registrado no ranking.");
    return;
  }

  gameState.currentCase = gameState.cases.shift();
  gameState.requestedExams = new Set();
  gameState.selectedDiagnosis = null;
  gameState.selectedMedications = new Set();

  setupCaseTimerAndPressure();
  openCase();
}

/* ===============================
   TIMER + PRESSÃO + ÓBITO
================================ */
function setupCaseTimerAndPressure(){
  stopCaseInterval();

  const c = gameState.currentCase;
  const tri = normalizeTriage(c?.patient?.triage);

  // limites por triagem (segundos)
  const limit = tri === "vermelho" ? 240 : tri === "amarelo" ? 420 : 720;
  gameState.caseLimitSec = limit;
  gameState.caseTimerSec = 0;
  gameState.pressure = tri === "vermelho" ? 35 : tri === "amarelo" ? 20 : 10;

  updateCaseHUD();

  gameState.caseInterval = setInterval(()=>{
    gameState.caseTimerSec += 1;

    // pressão sobe com o tempo (mais agressivo em vermelho)
    const triMul = tri === "vermelho" ? 0.45 : tri === "amarelo" ? 0.30 : 0.20;
    gameState.pressure = clamp(gameState.pressure + triMul, 0, 100);

    updateCaseHUD();

    // óbito automático se estourar tempo em vermelho com pressão alta (AAA)
    if(tri === "vermelho" && gameState.caseTimerSec > gameState.caseLimitSec){
      handleDeath("Tempo crítico excedido em caso vermelho.");
    }
  }, 1000);
}

function stopCaseInterval(){
  if(gameState.caseInterval){
    clearInterval(gameState.caseInterval);
    gameState.caseInterval = null;
  }
}

function pressureLabel(p){
  if(p < 30) return "Baixa";
  if(p < 60) return "Média";
  if(p < 85) return "Alta";
  return "Crítica";
}

function updateCaseHUD(){
  if(!$("caseTime")) return; // caso ainda não tenha tela carregada
  $("caseTime").innerText = secToMMSS(gameState.caseTimerSec);
  $("caseLimit").innerText = secToMMSS(gameState.caseLimitSec);

  const fill = $("pressureFill");
  fill.style.width = `${clamp(gameState.pressure,0,100)}%`;

  $("pressureLabel").innerText = pressureLabel(gameState.pressure);
}

/* ===============================
   ATENDIMENTO UI
================================ */
function openCase(){
  const c = gameState.currentCase;
  if(!c) return;

  showScreen("screen-case");
  $("caseBg").style.backgroundImage = `url(images/hospital_corridor.jpg)`;

  $("patientName").innerText = `${c.patient.name} (${c.patient.age}a)`;
  $("patientMeta").innerText = `${c.patient.sex || ""}`;

  $("patientPhoto").src = c.patient.photo;
  $("patientComplaint").innerText = c.complaint;
  $("patientHistory").innerText = c.history;

  const triBadge = $("triageBadge");
  const triNorm = normalizeTriage(c.patient.triage);
  triBadge.innerText = c.patient.triage || "Amarelo";
  triBadge.className = `triage-badge triage-${triNorm}`;

  const vit = $("vitalsList");
  vit.innerHTML = "";
  (c.vitals || []).forEach(v=>{
    const li = document.createElement("li");
    li.innerText = v;
    vit.appendChild(li);
  });

  renderQuestions(c);
  renderAllExams(c);
  renderDiagnosis(c);
  renderMedications(c);

  $("examResultsArea").innerHTML = "";
  updateCaseHUD();
}

function renderQuestions(c){
  const q = $("questionsArea");
  q.innerHTML = "";
  (c.questions || []).forEach(qu=>{
    const b = document.createElement("button");
    b.innerText = qu.label;
    b.onclick = ()=>{
      // pergunta consome um pouco de tempo/pressão (realismo)
      gameState.caseTimerSec = clamp(gameState.caseTimerSec + 6, 0, 99999);
      gameState.pressure = clamp(gameState.pressure + 1.0, 0, 100);
      updateCaseHUD();
      alert(qu.answer);
      saveGame();
    };
    q.appendChild(b);
  });
}

function renderAllExams(c){
  const area = $("examsArea");
  area.innerHTML = "";

  gameState.examsCatalog.forEach(exam=>{
    const b = document.createElement("button");

    const recommended = (c.recommendedExams || []).includes(exam.id);
    const essential = (c.essentialExams || []).includes(exam.id);

    b.innerHTML =
      `<strong>${exam.label}</strong><br><small>${exam.type} · ${exam.etaMin} min${essential ? " · ESSENCIAL" : (recommended ? " · recomendado" : "")}</small>`;

    b.onclick = ()=>requestExam(exam.id);
    area.appendChild(b);
  });
}

function requestExam(examId){
  const c = gameState.currentCase;
  const catalog = gameState.examsCatalog.find(e=>e.id===examId);
  if(!catalog) return;

  // evita repetição infinita
  if(gameState.requestedExams.has(examId)){
    alert("Exame já solicitado.");
    return;
  }

  gameState.requestedExams.add(examId);

  // custo de tempo e pressão
  const tri = normalizeTriage(c.patient.triage);
  const triTimeMul = tri === "vermelho" ? 1.15 : tri === "amarelo" ? 1.05 : 1.0;

  gameState.caseTimerSec += Math.round(catalog.etaMin * 1.8 * triTimeMul); // 1.8s por “min” simulado
  gameState.pressure = clamp(gameState.pressure + (catalog.etaMin >= 60 ? 7 : 3), 0, 100);

  updateCaseHUD();

  // se for pertinente ao caso, usa resultado do caso; senão normal do catálogo
  const specific = c.examResults ? c.examResults[examId] : null;
  const result = specific || { text: catalog.normalText, image: catalog.image || null };

  const box = $("examResultsArea");

  const wrap = document.createElement("div");
  wrap.style.padding = "10px";
  wrap.style.marginTop = "10px";
  wrap.style.border = "1px solid rgba(255,255,255,0.10)";
  wrap.style.borderRadius = "12px";
  wrap.style.background = "rgba(255,255,255,0.04)";

  const title = document.createElement("div");
  title.innerHTML = `<strong>${catalog.label}</strong> <small style="opacity:.8">(${catalog.type} · ${catalog.etaMin} min)</small>`;
  title.style.marginBottom = "6px";

  const text = document.createElement("div");
  text.innerText = result.text || "(Sem descrição)";

  wrap.appendChild(title);
  wrap.appendChild(text);

  if(result.image){
    const img = document.createElement("img");
    img.src = result.image;
    img.style.width = "100%";
    img.style.borderRadius = "10px";
    img.style.marginTop = "8px";
    img.style.border = "1px solid rgba(255,255,255,0.10)";
    wrap.appendChild(img);
  }

  box.prepend(wrap);
  saveGame();
}

function renderDiagnosis(c){
  const d = $("diagnosisArea");
  d.innerHTML = "";

  (c.diagnosis || []).forEach(di=>{
    const b = document.createElement("button");
    b.innerHTML = `<strong>${di.label}</strong><br><small>gravidade: ${di.severity || "-"}</small>`;
    b.onclick = ()=>{
      document.querySelectorAll("#diagnosisArea button").forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");
      gameState.selectedDiagnosis = di;
      saveGame();
    };
    d.appendChild(b);
  });
}

function renderMedications(c){
  const m = $("medicationsArea");
  m.innerHTML = "";

  (c.medications || []).forEach(me=>{
    const b = document.createElement("button");
    b.innerHTML = `<strong>${me.label}</strong><br><small>risco: ${me.risk || "media"}</small>`;
    b.onclick = ()=>{
      const key = me.label;
      const has = gameState.selectedMedications.has(key);

      if(has){
        gameState.selectedMedications.delete(key);
        b.classList.remove("selected");
      } else {
        if(gameState.selectedMedications.size >= 2){
          alert("Você pode selecionar no máximo 2 condutas/medicações.");
          return;
        }
        gameState.selectedMedications.add(key);
        b.classList.add("selected");
      }

      // conduta errada aumenta pressão (realismo)
      gameState.pressure = clamp(gameState.pressure + 1.5, 0, 100);
      updateCaseHUD();

      saveGame();
    };
    m.appendChild(b);
  });
}

/* ===============================
   ÓBITO / FALHA GRAVE
================================ */
function handleDeath(reason){
  stopCaseInterval();

  gameState.mistakes += 1;
  gameState.prestige += prestigeDeltaFromCaseScore(-999, true);
  gameState.points = Math.max(0, gameState.points - 80);
  gameState.casesDone += 1;

  applyProgression();
  updateRanking();
  saveGame();

  alert(`ÓBITO / FALHA GRAVE\nMotivo: ${reason}\n\nImpacto: -80 pts, prestígio negativo.`);
  enterOffice();
}

/* ===============================
   FINALIZAÇÃO + SCORE AAA
================================ */
function finalizeCase(){
  const c = gameState.currentCase;
  if(!c) return;

  if(!gameState.selectedDiagnosis){
    alert("Selecione um diagnóstico para finalizar.");
    return;
  }

  stopCaseInterval();

  let score = 0;
  let death = false;

  // Diagnóstico
  if(gameState.selectedDiagnosis.correct) score += 50;
  else score -= 45;

  // Medicações/condutas
  const meds = (c.medications || []);
  const chosen = Array.from(gameState.selectedMedications);

  chosen.forEach(label=>{
    const opt = meds.find(x=>x.label === label);
    if(!opt) return;
    if(opt.correct) score += 20;
    else score -= riskPenalty(opt.risk);
  });

  if(chosen.length === 0) score -= 10;

  // Exames: recompensa/penaliza
  const requested = Array.from(gameState.requestedExams);
  const recommended = new Set(c.recommendedExams || []);
  const essential = new Set(c.essentialExams || []);

  // essenciais faltando
  let missingEssential = 0;
  essential.forEach(examId=>{
    if(!gameState.requestedExams.has(examId)){
      score -= 25;
      missingEssential += 1;
    }
  });

  requested.forEach(examId=>{
    if(recommended.has(examId)) score += 2;
    else score -= 6;
  });

  // Penalidade por estouro do tempo
  const over = Math.max(0, gameState.caseTimerSec - gameState.caseLimitSec);
  if(over > 0){
    score -= Math.min(60, Math.floor(over / 10)); // -1 a cada 10s estourados (cap 60)
  }

  // Pressão alta reduz desempenho (AAA)
  if(gameState.pressure >= 85) score -= 12;
  else if(gameState.pressure >= 60) score -= 6;

  // Óbito (AAA): caso vermelho + (diagnóstico errado OU conduta errada alta) + (essencial faltando OU estourou tempo)
  const tri = normalizeTriage(c.patient.triage);
  const hasHighRiskWrong = chosen.some(label=>{
    const opt = meds.find(x=>x.label===label);
    return opt && !opt.correct && String(opt.risk||"").toLowerCase()==="alta";
  });

  if(tri === "vermelho"){
    const wrongDx = !gameState.selectedDiagnosis.correct;
    const timeBad = gameState.caseTimerSec > gameState.caseLimitSec;
    if((wrongDx || hasHighRiskWrong) && (missingEssential > 0 || timeBad || gameState.pressure >= 85)){
      death = true;
    }
  }

  if(death){
    handleDeath("Falha crítica em caso vermelho (diagnóstico/conduta inadequados sob tempo/essenciais/pressão).");
    return;
  }

  // Stats
  if(gameState.selectedDiagnosis.correct) gameState.hits += 1;
  else gameState.mistakes += 1;

  // Aplica
  gameState.points = Math.max(0, gameState.points + score);
  gameState.prestige += prestigeDeltaFromCaseScore(score, false);
  gameState.casesDone += 1;

  applyProgression();
  updateRanking();
  saveGame();

  alert(`Atendimento finalizado.\nPontuação do caso: ${score}\nTotal: ${gameState.points}\nPrestígio: ${gameState.prestige}\nCargo: ${gameState.doctor.tier}`);
  enterOffice();
}

/* ===============================
   AUTO BOOT
================================ */
window.addEventListener("load", async ()=>{
  const loaded = loadSave();
  if(loaded) gameState = loaded;

  await registerSW();
});
