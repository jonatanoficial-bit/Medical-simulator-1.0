/* =========================================================
   Emergency Doctor Simulator – Core
   ========================================================= */

const STORAGE_KEY = "eds_save_v1";
const RANKING_KEY = "eds_ranking_v1";

/* ---------- State ---------- */
let CASES = [];
let EXAMS = [];

let state = {
  doctor: { name: "", avatar: "images/doctor_1.jpg", rank: "Médico Residente" },
  stats: { points: 0, correct: 0, wrong: 0, cases: 0, shift: 0, streak: 0 },
  lastCaseId: null
};

let current = {
  caseObj: null,
  pickedExams: new Set(),
  pickedDx: null,
  pickedMeds: new Set(),
  maxExams: 3,
  maxMeds: 2
};

/* ---------- Helpers ---------- */
const el = (id) => document.getElementById(id);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function showScreen(name){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screen = document.querySelector(`.screen[data-screen="${name}"]`);
  if (screen) screen.classList.add("active");
}

function toast(msg){
  alert(msg);
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.doctor || !parsed.stats) return false;
    state = parsed;
    return true;
  } catch {
    return false;
  }
}

function resetSave(){
  localStorage.removeItem(STORAGE_KEY);
  state = {
    doctor: { name: "", avatar: "images/doctor_1.jpg", rank: "Médico Residente" },
    stats: { points: 0, correct: 0, wrong: 0, cases: 0, shift: 0, streak: 0 },
    lastCaseId: null
  };
}

/* ---------- Data loading ---------- */
async function loadData(){
  try{
    const [casesRes, examsRes] = await Promise.all([
      fetch("cases.json", { cache: "no-store" }),
      fetch("exams.json", { cache: "no-store" })
    ]);

    if (!casesRes.ok || !examsRes.ok) throw new Error("HTTP error");
    CASES = await casesRes.json();
    EXAMS = await examsRes.json();

    if (!Array.isArray(CASES) || !Array.isArray(EXAMS)) throw new Error("JSON inválido");
    return true;
  }catch(err){
    console.error(err);
    toast("Erro ao carregar cases.json/exams.json. Verifique se os arquivos existem na raiz do projeto.");
    return false;
  }
}

/* ---------- UI: Profile ---------- */
function bindAvatarGrid(){
  const grid = el("avatarGrid");
  if (!grid) return;

  grid.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".avatarCard");
    if (!btn) return;
    const avatar = btn.getAttribute("data-avatar");
    if (!avatar) return;

    state.doctor.avatar = avatar;

    grid.querySelectorAll(".avatarCard").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  }, { passive: true });
}

/* ---------- UI: Office ---------- */
function refreshOffice(){
  el("uiAvatar").src = state.doctor.avatar || "images/doctor_1.jpg";
  el("uiName").textContent = state.doctor.name || "—";
  el("uiRank").textContent = state.doctor.rank || "Médico Residente";

  el("uiPoints").textContent = state.stats.points;
  el("uiCorrect").textContent = state.stats.correct;
  el("uiWrong").textContent = state.stats.wrong;
  el("uiCases").textContent = state.stats.cases;
  el("uiShift").textContent = state.stats.shift;
  el("uiStreak").textContent = state.stats.streak;
}

/* ---------- Triage badge ---------- */
function applyTriage(triage){
  const badge = el("triageBadge");
  badge.classList.remove("triage-green","triage-yellow","triage-red");

  const t = (triage || "").toLowerCase();
  if (t.includes("verde")) badge.classList.add("triage-green");
  else if (t.includes("amare")) badge.classList.add("triage-yellow");
  else if (t.includes("vermel")) badge.classList.add("triage-red");

  el("triageText").textContent = triage || "—";
}

/* ---------- Case selection ---------- */
function pickNextCase(){
  if (!CASES.length) return null;

  // simples: evita repetir o último
  let pool = CASES.slice();
  if (state.lastCaseId){
    pool = pool.filter(c => c.id !== state.lastCaseId);
    if (!pool.length) pool = CASES.slice();
  }

  // “AAA”: aumenta chance de tiers mais altos conforme pontos
  const pts = state.stats.points || 0;
  const tierWanted =
    pts >= 220 ? "pleno" :
    pts >= 120 ? "titular" :
    "residente";

  // prioriza tierWanted, mas mantém mistura
  const preferred = pool.filter(c => (c.tier || "") === tierWanted);
  const mixed = preferred.length ? preferred : pool;
  const chosen = mixed[Math.floor(Math.random() * mixed.length)];
  return chosen || pool[0];
}

/* ---------- Render Case ---------- */
function renderCase(c){
  current.caseObj = c;
  current.pickedExams = new Set();
  current.pickedDx = null;
  current.pickedMeds = new Set();

  // difficulty knobs
  current.maxExams = 3;
  current.maxMeds = 2;

  el("maxExams").textContent = String(current.maxExams);
  el("maxMeds").textContent = String(current.maxMeds);

  el("caseTitle").textContent = `Caso: ${c.id || "—"}`;
  applyTriage(c.patient?.triage);

  el("patientPhoto").src = c.patient?.photo || "images/patient_male.jpg";
  el("patientName").textContent = c.patient?.name || "—";
  el("patientSub").textContent = `${c.patient?.age ?? "—"} anos • ${c.patient?.sex || "—"}`;

  // vitals
  const vitals = el("vitalsList");
  vitals.innerHTML = "";
  (c.vitals || []).forEach(v => {
    const li = document.createElement("li");
    li.textContent = v;
    vitals.appendChild(li);
  });

  el("complaintText").textContent = c.complaint || "—";
  el("historyText").textContent = c.history || "—";

  // questions
  const qBox = el("questionsList");
  qBox.innerHTML = "";
  (c.questions || []).forEach((q) => {
    const row = document.createElement("div");
    row.className = "pickItem";
    row.innerHTML = `
      <div class="pickMeta">
        <div class="pickTitle">${q.label || "Pergunta"}</div>
        <div class="pickSub" style="display:none">${q.answer || "—"}</div>
      </div>
      <button class="chip" type="button">Ver resposta</button>
    `;
    const btn = row.querySelector("button");
    const ans = row.querySelector(".pickSub");
    btn.addEventListener("click", () => {
      const isHidden = ans.style.display === "none";
      ans.style.display = isHidden ? "block" : "none";
      btn.textContent = isHidden ? "Ocultar" : "Ver resposta";
    });
    qBox.appendChild(row);
  });

  // exam results
  const res = el("examResultsBox");
  res.innerHTML = `<div class="muted">Nenhum exame solicitado ainda.</div>`;

  // picks: exams (shows ALL exams)
  renderExamPickList();

  // dx
  renderDxPickList();

  // meds
  renderMedPickList();
}

function renderExamPickList(){
  const list = el("examPickList");
  list.innerHTML = "";

  EXAMS.forEach(ex => {
    const id = ex.id;
    const item = document.createElement("div");
    item.className = "pickItem";
    item.innerHTML = `
      <input type="checkbox" />
      <div class="pickMeta">
        <div class="pickTitle">${ex.label}</div>
        <div class="pickSub">Tempo: ${ex.time} min • ${ex.type}</div>
      </div>
    `;
    const cb = item.querySelector("input");

    item.addEventListener("click", (ev) => {
      if (ev.target.tagName !== "INPUT") cb.checked = !cb.checked;

      if (cb.checked){
        if (current.pickedExams.size >= current.maxExams){
          cb.checked = false;
          toast(`Você pode escolher até ${current.maxExams} exames.`);
          return;
        }
        current.pickedExams.add(id);
        item.classList.add("selected");
      }else{
        current.pickedExams.delete(id);
        item.classList.remove("selected");
      }

      renderExamResults();
    });

    list.appendChild(item);
  });
}

function renderExamResults(){
  const c = current.caseObj;
  const res = el("examResultsBox");
  res.innerHTML = "";

  if (!current.pickedExams.size){
    res.innerHTML = `<div class="muted">Nenhum exame solicitado ainda.</div>`;
    return;
  }

  current.pickedExams.forEach((examId) => {
    const known = (c.examResults || {})[examId];
    const block = document.createElement("div");
    block.className = "block";
    const title = EXAMS.find(e => e.id === examId)?.label || examId;

    // Se não existir resultado no caso => "normal"
    const text = known?.text || "Sem alterações relevantes (resultado normal simulado).";
    const img = known?.image || null;

    block.innerHTML = `
      <div class="blockTitle">${title}</div>
      <div class="blockText">${text}</div>
      ${img ? `<div style="margin-top:10px;"><img src="${img}" alt="Imagem do exame" style="width:100%;border-radius:14px;border:1px solid rgba(255,255,255,.10)"></div>` : ""}
    `;
    res.appendChild(block);
  });
}

function renderDxPickList(){
  const list = el("dxPickList");
  list.innerHTML = "";

  const dx = current.caseObj.diagnosis || [];
  dx.forEach((d, idx) => {
    const item = document.createElement("div");
    item.className = "pickItem";
    item.innerHTML = `
      <input type="radio" name="dxPick" />
      <div class="pickMeta">
        <div class="pickTitle">${d.label}</div>
        <div class="pickSub">Severidade: ${d.severity || "—"}</div>
      </div>
    `;
    const rb = item.querySelector("input");

    item.addEventListener("click", (ev) => {
      if (ev.target.tagName !== "INPUT") rb.checked = true;
      current.pickedDx = idx;

      list.querySelectorAll(".pickItem").forEach(x => x.classList.remove("selected"));
      item.classList.add("selected");
    });

    list.appendChild(item);
  });
}

function renderMedPickList(){
  const list = el("medPickList");
  list.innerHTML = "";

  const meds = current.caseObj.medications || [];
  meds.forEach((m, idx) => {
    const item = document.createElement("div");
    item.className = "pickItem";
    item.innerHTML = `
      <input type="checkbox" />
      <div class="pickMeta">
        <div class="pickTitle">${m.label}</div>
        <div class="pickSub">Risco: ${m.risk || "—"}</div>
      </div>
    `;
    const cb = item.querySelector("input");

    item.addEventListener("click", (ev) => {
      if (ev.target.tagName !== "INPUT") cb.checked = !cb.checked;

      if (cb.checked){
        if (current.pickedMeds.size >= current.maxMeds){
          cb.checked = false;
          toast(`Você pode escolher até ${current.maxMeds} condutas.`);
          return;
        }
        current.pickedMeds.add(idx);
        item.classList.add("selected");
      }else{
        current.pickedMeds.delete(idx);
        item.classList.remove("selected");
      }
    });

    list.appendChild(item);
  });
}

/* ---------- Scoring ---------- */
function scoreCase(){
  const c = current.caseObj;
  let pointsDelta = 0;

  // Exams: essenciais/recomendados ajudam; fora do caso tira
  const essential = new Set(c.essentialExams || []);
  const recommended = new Set(c.recommendedExams || []);

  let examGood = 0;
  let examBad = 0;

  current.pickedExams.forEach(exId => {
    const hasResult = !!((c.examResults || {})[exId]);
    if (essential.has(exId)) { pointsDelta += 18; examGood++; return; }
    if (recommended.has(exId)) { pointsDelta += 10; examGood++; return; }

    // Se não existe resultado no caso (exame "sem sentido")
    if (!hasResult) { pointsDelta -= 10; examBad++; return; }

    // existe resultado mas não era recomendado: leve penalidade
    pointsDelta -= 4; examBad++;
  });

  // Dx
  const dxArr = c.diagnosis || [];
  if (current.pickedDx == null){
    pointsDelta -= 20;
  } else {
    const chosen = dxArr[current.pickedDx];
    if (chosen?.correct) pointsDelta += 35;
    else pointsDelta -= 25;
  }

  // Meds
  const meds = c.medications || [];
  let medGood = 0;
  let medBad = 0;

  current.pickedMeds.forEach(idx => {
    const m = meds[idx];
    if (!m) return;
    if (m.correct){ pointsDelta += 12; medGood++; }
    else{
      // penalidade por risco
      if (m.risk === "alta") pointsDelta -= 28;
      else if (m.risk === "media") pointsDelta -= 16;
      else pointsDelta -= 10;
      medBad++;
    }
  });

  // Ajuste final e clamp por caso
  pointsDelta = clamp(pointsDelta, -80, 80);

  const success = pointsDelta >= 10;

  state.stats.cases += 1;
  state.stats.shift += 1;

  if (success){
    state.stats.correct += 1;
    state.stats.streak += 1;
  } else {
    state.stats.wrong += 1;
    state.stats.streak = 0;
  }

  state.stats.points = Math.max(0, state.stats.points + pointsDelta);

  // rank progression (simples, você pode refiná-la depois)
  const pts = state.stats.points;
  if (pts >= 250) state.doctor.rank = "Médico Pleno";
  else if (pts >= 120) state.doctor.rank = "Médico Titular";
  else state.doctor.rank = "Médico Residente";

  state.lastCaseId = c.id || null;

  save();
  refreshOffice();

  return {
    pointsDelta,
    examGood, examBad,
    dxChosen: current.pickedDx == null ? null : dxArr[current.pickedDx]?.label,
    medGood, medBad,
    success
  };
}

/* ---------- Results screen ---------- */
function showResults(summary){
  el("resultsTitle").textContent = "Resumo do caso";
  el("resultsSub").textContent = summary.success ? "Boa condução (simulado)." : "Condução inadequada (simulado).";

  el("resPoints").textContent = `${summary.pointsDelta >= 0 ? "+" : ""}${summary.pointsDelta}`;
  el("resExams").textContent = `${summary.examGood} ok / ${summary.examBad} ruins`;
  el("resDx").textContent = summary.dxChosen || "Não selecionado";
  el("resMeds").textContent = `${summary.medGood} ok / ${summary.medBad} ruins`;

  // gabarito
  const c = current.caseObj;
  const dxOk = (c.diagnosis || []).find(d => d.correct)?.label || "—";
  const ess = (c.essentialExams || []).join(", ") || "—";
  const rec = (c.recommendedExams || []).join(", ") || "—";
  const medsOk = (c.medications || []).filter(m => m.correct).map(m => m.label).slice(0,4).join("<br/>") || "—";

  el("answerKey").innerHTML = `
    <b>Diagnóstico correto:</b> ${dxOk}<br/><br/>
    <b>Exames essenciais:</b> ${ess}<br/>
    <b>Exames recomendados:</b> ${rec}<br/><br/>
    <b>Condutas recomendadas (amostra):</b><br/>${medsOk}
  `;

  // ranking local
  pushRanking(state.doctor.name || "Anônimo", state.stats.points);

  showScreen("results");
}

/* ---------- Ranking (Local) ---------- */
function pushRanking(name, points){
  const raw = localStorage.getItem(RANKING_KEY);
  let arr = [];
  try { arr = raw ? JSON.parse(raw) : []; } catch { arr = []; }

  arr.push({ name, points, at: Date.now() });
  arr.sort((a,b) => b.points - a.points);
  arr = arr.slice(0, 20);

  localStorage.setItem(RANKING_KEY, JSON.stringify(arr));
}

function renderRanking(){
  const raw = localStorage.getItem(RANKING_KEY);
  let arr = [];
  try { arr = raw ? JSON.parse(raw) : []; } catch { arr = []; }

  if (!arr.length){
    el("rankList").innerHTML = "Sem dados ainda.";
    return;
  }

  el("rankList").innerHTML = arr.map((r, i) => {
    const p = String(r.points).padStart(3," ");
    return `<div style="margin:8px 0"><b>#${i+1}</b> — ${r.name} — <b>${p}</b> pts</div>`;
  }).join("");
}

/* ---------- Events ---------- */
async function onNewGame(){
  const ok = await loadData();
  if (!ok) return;

  resetSave();
  save();

  showScreen("profile");
}

async function onContinue(){
  const ok = await loadData();
  if (!ok) return;

  const has = load();
  if (!has){
    toast("Nenhum salvamento encontrado.");
    return;
  }
  refreshOffice();
  showScreen("office");
}

function onStartFromProfile(){
  const name = (el("inputName").value || "").trim();
  if (name.length < 2){
    toast("Digite seu nome para iniciar.");
    return;
  }

  state.doctor.name = name;

  // se não selecionou avatar, mantém o default
  save();
  refreshOffice();
  showScreen("office");
}

function onNextCase(){
  const c = pickNextCase();
  if (!c){
    toast("Sem casos disponíveis.");
    return;
  }
  renderCase(c);
  showScreen("case");
}

function onFinalize(){
  if (!current.caseObj){
    toast("Nenhum caso carregado.");
    return;
  }
  const summary = scoreCase();
  showResults(summary);
}

function toggleModal(modalEl, show){
  if (!modalEl) return;
  modalEl.classList.toggle("show", !!show);
}

async function requestFullScreen(){
  // iOS Safari limita fullscreen real; ainda assim o layout já é 100% “app-like”.
  const root = document.documentElement;
  try{
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (root.requestFullscreen) await root.requestFullscreen();
  }catch(e){
    // sem alert aqui para não irritar; botão segue útil em browsers compatíveis
    console.warn("Fullscreen não suportado neste navegador.");
  }
}

/* ---------- Bootstrap ---------- */
function wire(){
  // Home buttons
  el("btnNewGame").addEventListener("click", onNewGame);
  el("btnContinue").addEventListener("click", onContinue);

  // Profile
  bindAvatarGrid();
  el("btnProfileBack").addEventListener("click", () => showScreen("home"));
  el("btnStartFromProfile").addEventListener("click", onStartFromProfile);

  // Office
  el("btnNextCase").addEventListener("click", onNextCase);
  el("btnResetSave").addEventListener("click", () => {
    if (confirm("Tem certeza que deseja resetar o salvamento?")){
      resetSave();
      save();
      refreshOffice();
      showScreen("home");
    }
  });

  // Case
  el("btnBackOffice").addEventListener("click", () => {
    refreshOffice();
    showScreen("office");
  });
  el("btnFinalize").addEventListener("click", onFinalize);

  // Results
  el("btnResultsHome").addEventListener("click", () => showScreen("home"));
  el("btnResultsOffice").addEventListener("click", () => { refreshOffice(); showScreen("office"); });

  // Topbar
  el("btnFullScreen").addEventListener("click", requestFullScreen);

  // Help / Ranking
  const helpModal = el("helpModal");
  const rankModal = el("rankModal");

  el("btnHelp").addEventListener("click", () => toggleModal(helpModal, true));
  el("btnCloseHelp").addEventListener("click", () => toggleModal(helpModal, false));
  helpModal.addEventListener("click", (e) => { if (e.target === helpModal) toggleModal(helpModal, false); });

  el("btnRanking").addEventListener("click", () => { renderRanking(); toggleModal(rankModal, true); });
  el("btnCloseRank").addEventListener("click", () => toggleModal(rankModal, false));
  rankModal.addEventListener("click", (e) => { if (e.target === rankModal) toggleModal(rankModal, false); });
}

function bootstrap(){
  // Se existir save, habilita continuar
  const hasSave = !!localStorage.getItem(STORAGE_KEY);
  el("btnContinue").disabled = !hasSave;

  // Tenta carregar save para atualizar label no Office quando entrar por Continue
  if (hasSave){
    load();
  }

  // default avatar selected UI
  const grid = el("avatarGrid");
  if (grid){
    const first = grid.querySelector('.avatarCard[data-avatar="images/doctor_1.jpg"]') || grid.querySelector(".avatarCard");
    if (first) first.classList.add("selected");
  }

  refreshOffice();
  showScreen("home");
}

wire();
bootstrap();
