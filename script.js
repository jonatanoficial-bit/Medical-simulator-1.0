/* Emergency Doctor Simulator - game.js
   Ajustado para pasta: images/
   - Mais diagnósticos
   - Mais exames (com tempo/penalidade e imagem)
   - Mais medicações (com acertos/erros)
   - Ranking + salvamento
*/

const SAVE_KEY = "medical_simulator_save_v1";

const screens = {
  start: document.getElementById("screenStart"),
  profile: document.getElementById("screenProfile"),
  briefing: document.getElementById("screenBriefing"),
  office: document.getElementById("screenOffice"),
  case: document.getElementById("screenCase"),
  result: document.getElementById("screenResult"),
};

function showScreen(name){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo(0,0);
}

/* STATE */
let state = {
  name: "",
  avatar: "",
  gender: "",
  score: 0,
  casesResolved: 0,
  hits: 0,
  errors: 0,
  deaths: 0,
  currentCaseId: null,
  usedExams: [],
  usedQuestions: [],
  usedMeds: [],
  rank: "Médico Residente",
};

/* RANK */
function computeRank(score){
  if (score < 250) return "Médico Residente";
  if (score < 800) return "Médico Titular";
  return "Médico Pleno";
}

/* SAVE / LOAD */
function saveGame(){
  state.rank = computeRank(state.score);
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadGame(){
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    state = JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

function resetGame(){
  localStorage.removeItem(SAVE_KEY);
  state = {
    name: "",
    avatar: "",
    gender: "",
    score: 0,
    casesResolved: 0,
    hits: 0,
    errors: 0,
    deaths: 0,
    currentCaseId: null,
    usedExams: [],
    usedQuestions: [],
    usedMeds: [],
    rank: "Médico Residente",
  };
}

/* UI refs */
const btnNew = document.getElementById("btnNew");
const btnContinue = document.getElementById("btnContinue");
const btnProfileNext = document.getElementById("btnProfileNext");
const inputName = document.getElementById("inputName");
const avatarGrid = document.getElementById("avatarGrid");

const btnGoOffice = document.getElementById("btnGoOffice");
const briefingText = document.getElementById("briefingText");

const hudAvatar = document.getElementById("hudAvatar");
const hudName = document.getElementById("hudName");
const hudRank = document.getElementById("hudRank");
const hudScore = document.getElementById("hudScore");
const hudCases = document.getElementById("hudCases");
const hudHits = document.getElementById("hudHits");
const hudErrors = document.getElementById("hudErrors");
const hudDeaths = document.getElementById("hudDeaths");

const hudPrestige = document.getElementById("hudPrestige");
const hudPerformance = document.getElementById("hudPerformance");
const hudPrestigeTxt = document.getElementById("hudPrestigeTxt");
const hudPerformanceTxt = document.getElementById("hudPerformanceTxt");

const btnNextCase = document.getElementById("btnNextCase");
const btnBackOffice = document.getElementById("btnBackOffice");
const btnFinish = document.getElementById("btnFinish");
const btnResultOffice = document.getElementById("btnResultOffice");
const btnSave = document.getElementById("btnSave");
const btnReset = document.getElementById("btnReset");

const patientPhoto = document.getElementById("patientPhoto");
const patientName = document.getElementById("patientName");
const patientDemo = document.getElementById("patientDemo");
const patientTriage = document.getElementById("patientTriage");
const patientComplaint = document.getElementById("patientComplaint");
const patientHistory = document.getElementById("patientHistory");
const vitalsEl = document.getElementById("vitals");

const questionsEl = document.getElementById("questions");
const qaEl = document.getElementById("qa");
const examsEl = document.getElementById("exams");
const examResultsEl = document.getElementById("examResults");
const diagnosisEl = document.getElementById("diagnosis");
const medicationsEl = document.getElementById("medications");

const resultSummary = document.getElementById("resultSummary");
const resultDetail = document.getElementById("resultDetail");
const resultScore = document.getElementById("resultScore");

/* HELP MODAL */
const btnHelp = document.getElementById("btnHelp");
const helpModal = document.getElementById("helpModal");
const btnHelpClose = document.getElementById("btnHelpClose");
btnHelp.addEventListener("click", () => helpModal.classList.add("show"));
btnHelpClose.addEventListener("click", () => helpModal.classList.remove("show"));
helpModal.addEventListener("click", (e) => { if (e.target === helpModal) helpModal.classList.remove("show"); });

/* CONTINUE visibility */
function updateContinueButton(){
  btnContinue.style.display = localStorage.getItem(SAVE_KEY) ? "inline-block" : "none";
}

/* TYPEWRITER */
function typewriter(text, el, speed=18){
  el.textContent = "";
  let i = 0;
  const t = setInterval(() => {
    el.textContent += text[i] || "";
    i++;
    if (i > text.length) clearInterval(t);
  }, speed);
}

/* HUD update */
function updateHUD(){
  state.rank = computeRank(state.score);

  hudAvatar.src = state.avatar || "images/avatar1.png";
  hudName.textContent = state.name || "Médico(a)";
  hudRank.textContent = "Rank: " + state.rank;

  hudScore.textContent = state.score;
  hudCases.textContent = state.casesResolved;
  hudHits.textContent = state.hits;
  hudErrors.textContent = state.errors;
  hudDeaths.textContent = state.deaths;

  const prestige = Math.max(0, Math.min(100, Math.round(state.score / 12)));
  const total = state.hits + state.errors + state.deaths;
  const perf = total > 0 ? Math.max(0, Math.min(100, Math.round((state.hits / total) * 100))) : 0;

  hudPrestige.style.width = prestige + "%";
  hudPerformance.style.width = perf + "%";
  hudPrestigeTxt.textContent = prestige + "%";
  hudPerformanceTxt.textContent = perf + "%";
}

/* CASE DATABASE (amostras extensíveis)
   Você pode duplicar e criar dezenas/centenas seguindo o mesmo padrão.
*/
const CASES = [
  {
    id: "chest_pain_stemi",
    tier: "residente",
    patient: {
      name: "Carlos Silva",
      age: 58,
      sex: "Masculino",
      photo: "images/patient_male.jpg",
      triage: "Vermelho",
    },
    vitals: [
      "PA: 90/60 mmHg",
      "FC: 112 bpm",
      "FR: 24 irpm",
      "SpO2: 92%",
      "Temp: 36,7°C",
    ],
    complaint: "Dor torácica intensa em aperto há 1 hora.",
    history: "Irradia para braço esquerdo, sudorese fria e náuseas. HAS e tabagismo. Sem trauma.",
    questions: [
      { label: "Irradiação e tipo da dor", answer: "Dor em aperto, irradia para braço esquerdo e mandíbula." },
      { label: "Dispneia", answer: "Refere falta de ar e sensação de desmaio." },
      { label: "Tempo de início", answer: "Início súbito há ~60 minutos, piorando progressivamente." },
      { label: "Fatores de risco", answer: "Tabagista, hipertenso, histórico familiar de IAM." },
      { label: "Uso de drogas (cocaína)", answer: "Nega uso de cocaína/anfetaminas." },
    ],
    exams: [
      { id:"ecg", label:"ECG", time:2, essential:true, penaltyIfSkipped:35, result:"Supradesnivelamento de ST em parede anterior.", image:null },
      { id:"troponina", label:"Troponina", time:30, essential:false, penaltyIfSkipped:10, result:"Troponina elevada (compatível com injúria miocárdica).", image:null },
      { id:"rx", label:"Raio-X de tórax", time:15, essential:false, penaltyIfSkipped:0, result:"Sem alterações pulmonares relevantes.", image:"images/xray.jpg" },
      { id:"d_dimer", label:"D-dímero", time:40, essential:false, penaltyIfSkipped:0, result:"Leve elevação inespecífica. Não confirma nem exclui o quadro.", image:null, unnecessary:true },
      { id:"gasometria", label:"Gasometria arterial", time:20, essential:false, penaltyIfSkipped:0, result:"Hipoxemia leve. Sem acidose importante.", image:null },
      { id:"labs_basic", label:"Laboratório básico (hemograma/eletrólitos/creatinina)", time:25, essential:false, penaltyIfSkipped:0, result:"Sem alterações críticas imediatas. Creatinina limítrofe.", image:"images/labs.jpg" },
    ],
    diagnosis: [
      { label:"Infarto agudo do miocárdio (IAM)", correct:true, severity:"critico" },
      { label:"Angina instável", correct:false, severity:"grave" },
      { label:"Embolia pulmonar", correct:false, severity:"grave" },
      { label:"Dissecção de aorta", correct:false, severity:"critico" },
      { label:"Crise de ansiedade/pânico", correct:false, severity:"grave" },
      { label:"Refluxo gastroesofágico", correct:false, severity:"leve" },
      { label:"Pneumonia", correct:false, severity:"leve" },
      { label:"Dor musculoesquelética", correct:false, severity:"leve" },
      { label:"Pericardite aguda", correct:false, severity:"grave" },
      { label:"Costocondrite", correct:false, severity:"leve" },
    ],
    meds: [
      { label:"Antiagregante plaquetário (ex.: AAS)", correct:true, risk:"baixa" },
      { label:"Anticoagulação conforme protocolo", correct:true, risk:"media" },
      { label:"Analgesia adequada", correct:true, risk:"baixa" },
      { label:"Oxigênio se indicado", correct:true, risk:"baixa" },
      { label:"Antibiótico empírico", correct:false, risk:"baixa" },
      { label:"Broncodilatador sem indicação", correct:false, risk:"baixa" },
      { label:"Alta imediata sem investigação", correct:false, risk:"alta" },
      { label:"Apenas antiácido e observar", correct:false, risk:"alta" },
    ],
    outcome: {
      success:"Conduta adequada e rápida. Paciente encaminhado para reperfusão com bom prognóstico.",
      partial:"Você acertou parcialmente, mas houve atraso/conduta incompleta. Risco aumentado de complicações.",
      fail:"Conduta inadequada para um quadro grave. Evolução desfavorável com alto risco de parada.",
      death:"Óbito evitável por atraso/erro crítico no reconhecimento e conduta."
    }
  },

  {
    id: "appendicitis",
    tier: "titular",
    patient: {
      name: "Fernanda Lima",
      age: 34,
      sex: "Feminino",
      photo: "images/patient_female.jpg",
      triage: "Amarelo",
    },
    vitals: [
      "PA: 118/76 mmHg",
      "FC: 98 bpm",
      "FR: 18 irpm",
      "SpO2: 98%",
      "Temp: 38,0°C",
    ],
    complaint: "Dor abdominal em fossa ilíaca direita há 12 horas.",
    history: "Iniciou difusa, migrou para quadrante inferior direito. Náuseas e inapetência. Sem cirurgias prévias.",
    questions: [
      { label:"Dor migratória", answer:"Sim, começou peri-umbilical e migrou para a direita inferior." },
      { label:"Vômitos", answer:"Um episódio de vômito. Sem diarreia." },
      { label:"Sintomas urinários", answer:"Nega ardência urinária importante." },
      { label:"Ciclo menstrual / gestação", answer:"Nega atraso importante, sem suspeita de gestação (simulado)." },
      { label:"Sinal de piora", answer:"Piora com movimento e tosse." },
    ],
    exams: [
      { id:"hemograma", label:"Hemograma", time:20, essential:true, penaltyIfSkipped:15, result:"Leucocitose com desvio à esquerda.", image:"images/labs.jpg" },
      { id:"usg", label:"USG de abdome", time:35, essential:true, penaltyIfSkipped:20, result:"Apêndice espessado com sinais de inflamação local.", image:null },
      { id:"tc", label:"TC de abdome", time:55, essential:false, penaltyIfSkipped:0, result:"Achados compatíveis com apendicite aguda. Sem perfuração.", image:null },
      { id:"urina", label:"EAS (urina)", time:25, essential:false, penaltyIfSkipped:0, result:"Sem sinais sugestivos de ITU relevante.", image:"images/labs.jpg" },
      { id:"rx_abd", label:"Raio-X de abdome", time:20, essential:false, penaltyIfSkipped:0, result:"Sem achados específicos.", image:"images/xray.jpg", unnecessary:true },
    ],
    diagnosis: [
      { label:"Apendicite aguda", correct:true, severity:"grave" },
      { label:"Gastroenterite", correct:false, severity:"grave" },
      { label:"Cólica renal", correct:false, severity:"grave" },
      { label:"Doença inflamatória pélvica", correct:false, severity:"grave" },
      { label:"Cisto ovariano roto", correct:false, severity:"critico" },
      { label:"Gastrite", correct:false, severity:"leve" },
      { label:"Obstrução intestinal", correct:false, severity:"critico" },
      { label:"Colecistite", correct:false, severity:"grave" },
      { label:"Cólica menstrual simples", correct:false, severity:"leve" },
      { label:"Dor inespecífica", correct:false, severity:"grave" },
    ],
    meds: [
      { label:"Analgesia e antiemético", correct:true, risk:"baixa" },
      { label:"Hidratação venosa se indicado", correct:true, risk:"baixa" },
      { label:"Encaminhar avaliação cirúrgica", correct:true, risk:"baixa" },
      { label:"Antibiótico conforme protocolo cirúrgico", correct:true, risk:"media" },
      { label:"Alta domiciliar sem investigação", correct:false, risk:"alta" },
      { label:"Antidiarreico como conduta principal", correct:false, risk:"media" },
      { label:"Apenas antiácido e liberar", correct:false, risk:"alta" },
      { label:"Corticoide sem indicação", correct:false, risk:"media" },
    ],
    outcome: {
      success:"Suspeita correta e encaminhamento cirúrgico. Boa evolução.",
      partial:"Conduta parcialmente correta, com atraso em exames/encaminhamento.",
      fail:"Atraso significativo pode evoluir para perfuração e peritonite.",
      death:"Óbito evitável por perfuração não reconhecida e sepse."
    }
  },

  {
    id: "sepsis_uti",
    tier: "pleno",
    patient: {
      name: "Luciana Barbosa",
      age: 47,
      sex: "Feminino",
      photo: "images/patient_female.jpg",
      triage: "Vermelho",
    },
    vitals: [
      "PA: 82/54 mmHg",
      "FC: 128 bpm",
      "FR: 28 irpm",
      "SpO2: 93%",
      "Temp: 39,4°C",
    ],
    complaint: "Febre alta, confusão e queda de pressão.",
    history: "Piora rápida nas últimas horas. Diabetes mal controlada. Disúria dias antes (simulado).",
    questions: [
      { label:"Foco urinário", answer:"Relata disúria e urgência urinária nos últimos dias." },
      { label:"Nível de consciência", answer:"Sonolenta e confusa, responde lentamente." },
      { label:"Alergias", answer:"Nega alergias conhecidas (simulado)." },
      { label:"Uso prévio de antibiótico", answer:"Não usou antibiótico recente." },
      { label:"Dor lombar", answer:"Dor em flanco/lombar leve, inespecífica." },
    ],
    exams: [
      { id:"lactato", label:"Lactato", time:20, essential:true, penaltyIfSkipped:20, result:"Lactato elevado, sugerindo hipoperfusão.", image:"images/labs.jpg" },
      { id:"hemoculturas", label:"Hemoculturas", time:40, essential:true, penaltyIfSkipped:10, result:"Coletadas (resultado final não imediato).", image:null },
      { id:"urina", label:"Urina (EAS/urocultura)", time:35, essential:true, penaltyIfSkipped:10, result:"Sugere ITU complicada (resultado simplificado).", image:"images/labs.jpg" },
      { id:"gasometria", label:"Gasometria", time:25, essential:false, penaltyIfSkipped:0, result:"Acidose metabólica leve.", image:null },
      { id:"imagem", label:"USG renal/abdominal", time:45, essential:false, penaltyIfSkipped:0, result:"Sugere pielonefrite/complicação (simulado).", image:null },
      { id:"mri", label:"Ressonância (se indicado)", time:120, essential:false, penaltyIfSkipped:0, result:"Exame demorado e pouco útil como primeira linha neste cenário.", image:"images/mri.jpg", unnecessary:true },
    ],
    diagnosis: [
      { label:"Sepse grave com provável foco urinário", correct:true, severity:"critico" },
      { label:"Desidratação leve", correct:false, severity:"critico" },
      { label:"Crise de ansiedade", correct:false, severity:"grave" },
      { label:"AVC hemorrágico", correct:false, severity:"grave" },
      { label:"Pneumonia", correct:false, severity:"grave" },
      { label:"Intoxicação medicamentosa", correct:false, severity:"grave" },
      { label:"Hipoglicemia grave", correct:false, severity:"grave" },
      { label:"Gastroenterite", correct:false, severity:"grave" },
      { label:"Meningite", correct:false, severity:"critico" },
      { label:"Choque cardiogênico", correct:false, severity:"critico" },
    ],
    meds: [
      { label:"Antibiótico de amplo espectro conforme protocolo", correct:true, risk:"media" },
      { label:"Fluidoterapia agressiva conforme necessidade", correct:true, risk:"media" },
      { label:"Suporte hemodinâmico / UTI (se refratário)", correct:true, risk:"media" },
      { label:"Controle glicêmico e monitorização", correct:true, risk:"baixa" },
      { label:"Aguardar exames por horas sem tratar", correct:false, risk:"alta" },
      { label:"Alta domiciliar", correct:false, risk:"alta" },
      { label:"Sedação sem suporte/monitorização", correct:false, risk:"alta" },
      { label:"Apenas antitérmico e observar", correct:false, risk:"alta" },
    ],
    outcome: {
      success:"Reconhecimento rápido e conduta adequada. Melhora com suporte intensivo.",
      partial:"Tratamento iniciado, mas com atraso/conduta incompleta. Risco elevado.",
      fail:"Atraso e erro em sepse grave podem evoluir para falência de órgãos.",
      death:"Óbito evitável por choque séptico não tratado adequadamente."
    }
  },
];

/* Case selection by rank/tier */
function allowedTier(){
  const rank = computeRank(state.score);
  if (rank === "Médico Residente") return "residente";
  if (rank === "Médico Titular") return "titular";
  return "pleno";
}

function getCasePool(){
  const tier = allowedTier();
  return CASES.filter(c => c.tier === tier);
}

function pickCase(){
  const pool = getCasePool();
  if (pool.length === 0) return CASES[0];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/* Rendering case */
function renderCase(c){
  state.currentCaseId = c.id;
  state.usedExams = [];
  state.usedQuestions = [];
  state.usedMeds = [];

  patientPhoto.src = c.patient.photo;
  patientName.textContent = c.patient.name;
  patientDemo.textContent = `${c.patient.age} anos • ${c.patient.sex}`;
  patientTriage.textContent = c.patient.triage;
  patientComplaint.textContent = c.complaint;
  patientHistory.textContent = c.history;

  vitalsEl.innerHTML = c.vitals.map(v => `<div>• ${v}</div>`).join("");

  // QUESTIONS
  questionsEl.innerHTML = "";
  qaEl.textContent = "Selecione uma pergunta para ver a resposta.";
  c.questions.forEach((q, i) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = q.label;
    b.addEventListener("click", () => {
      state.usedQuestions.push(i);
      b.classList.add("used");
      qaEl.textContent = q.answer;
    });
    questionsEl.appendChild(b);
  });

  // EXAMS
  examsEl.innerHTML = "";
  examResultsEl.innerHTML = "Solicite exames para ver resultados. Alguns têm imagem.";
  c.exams.forEach((ex, i) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = `${ex.label} • ${ex.time} min`;
    b.addEventListener("click", () => {
      if (!state.usedExams.includes(ex.id)) state.usedExams.push(ex.id);
      b.classList.add("used");

      let html = `<div><strong>${ex.label}</strong> — ${ex.result}</div>`;
      if (ex.image){
        html += `<img class="exam-image" src="${ex.image}" alt="${ex.label}">`;
      }
      examResultsEl.innerHTML = html;
    });
    examsEl.appendChild(b);
  });

  // DIAGNOSIS (radio)
  diagnosisEl.innerHTML = "";
  c.diagnosis.forEach((dx, i) => {
    const row = document.createElement("div");
    row.className = "opt";
    row.innerHTML = `
      <input type="radio" id="dx_${i}" name="dx" value="${i}">
      <label for="dx_${i}">
        <strong>${dx.label}</strong>
        <small>Hipótese diferencial (simulada)</small>
      </label>
    `;
    diagnosisEl.appendChild(row);
  });

  // MEDS (checkbox)
  medicationsEl.innerHTML = "";
  c.meds.forEach((m, i) => {
    const row = document.createElement("div");
    row.className = "opt";
    row.innerHTML = `
      <input type="checkbox" id="med_${i}" value="${i}">
      <label for="med_${i}">
        <strong>${m.label}</strong>
        <small>Impacto simulado • risco: ${m.risk}</small>
      </label>
    `;
    medicationsEl.appendChild(row);
  });
}

/* Scoring rules */
function severityPenalty(sev){
  if (sev === "leve") return 15;
  if (sev === "grave") return 45;
  return 85; // critico
}

function medPenalty(risk){
  if (risk === "baixa") return 10;
  if (risk === "media") return 25;
  return 55; // alta
}

function finishCase(){
  const c = CASES.find(x => x.id === state.currentCaseId);
  if (!c) return;

  // Diagnosis selected?
  const selectedDx = document.querySelector('input[name="dx"]:checked');
  if (!selectedDx){
    alert("Selecione um diagnóstico.");
    return;
  }
  const dx = c.diagnosis[Number(selectedDx.value)];

  // Medications chosen
  const medChecks = Array.from(medicationsEl.querySelectorAll('input[type="checkbox"]:checked'));
  const chosenMeds = medChecks.map(ch => c.meds[Number(ch.value)]);

  // Exams used
  const usedExamObjs = c.exams.filter(ex => state.usedExams.includes(ex.id));

  // Base scoring
  let delta = 0;
  let flags = { criticalError:false, death:false };

  // Diagnosis score
  if (dx.correct){
    // reward by tier
    delta += c.tier === "pleno" ? 140 : (c.tier === "titular" ? 95 : 60);
    state.hits += 1;
  } else {
    const p = severityPenalty(dx.severity);
    delta -= p;
    state.errors += 1;
    if (dx.severity === "critico") flags.criticalError = true;
  }

  // Exam scoring
  // reward essential exams used, penalize missing essential, penalize unnecessary usage
  c.exams.forEach(ex => {
    const used = state.usedExams.includes(ex.id);
    if (ex.essential && used) delta += 10;
    if (ex.essential && !used) delta -= (ex.penaltyIfSkipped || 0);
    if (used && ex.unnecessary) delta -= 10;
  });

  // Medication scoring
  chosenMeds.forEach(m => {
    if (m.correct) delta += 12;
    else delta -= medPenalty(m.risk);
  });

  // Additional: if case is red triage and wrong dx + wrong meds => death risk
  const chosenWrongHighRisk = chosenMeds.some(m => !m.correct && m.risk === "alta");
  const red = c.patient.triage === "Vermelho";
  if (red && (!dx.correct) && (flags.criticalError || chosenWrongHighRisk)){
    // chance-like rule (deterministic): if delta is very negative -> death
    if (delta <= -80){
      flags.death = true;
      state.deaths += 1;
    }
  }

  state.score += delta;
  state.casesResolved += 1;
  state.rank = computeRank(state.score);
  saveGame();
  updateHUD();

  // Outcome text
  let summary = "";
  let detail = "";

  if (flags.death){
    summary = "Óbito evitável";
    detail = c.outcome.death;
  } else if (dx.correct && delta >= 70){
    summary = "Atendimento bem-sucedido";
    detail = c.outcome.success;
  } else if (dx.correct || delta > 0){
    summary = "Atendimento parcialmente correto";
    detail = c.outcome.partial;
  } else {
    summary = "Atendimento inadequado";
    detail = c.outcome.fail;
  }

  resultSummary.textContent = summary;
  resultDetail.textContent = detail;
  resultScore.textContent = `Pontuação do caso: ${delta >= 0 ? "+" : ""}${delta} | Total: ${state.score} | Rank: ${state.rank}`;
  showScreen("result");
}

/* Office / navigation */
btnNextCase.addEventListener("click", () => {
  const c = pickCase();
  renderCase(c);
  showScreen("case");
});

btnBackOffice.addEventListener("click", () => {
  showScreen("office");
});

btnFinish.addEventListener("click", finishCase);

btnResultOffice.addEventListener("click", () => {
  showScreen("office");
});

/* Buttons: save/reset */
btnSave.addEventListener("click", () => {
  saveGame();
  alert("Jogo salvo.");
});

btnReset.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja resetar o jogo? Isso apagará seu progresso.")){
    resetGame();
    updateContinueButton();
    showScreen("start");
  }
});

/* START flow */
btnNew.addEventListener("click", () => {
  resetGame();
  updateContinueButton();
  showScreen("profile");
});

btnContinue.addEventListener("click", () => {
  if (loadGame()){
    updateHUD();
    showScreen("office");
  } else {
    alert("Não foi possível carregar o save.");
  }
});

/* PROFILE: avatar selection */
let selectedAvatar = null;
let selectedGender = "";

avatarGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".avatar-card");
  if (!btn) return;

  document.querySelectorAll(".avatar-card").forEach(x => x.classList.remove("selected"));
  btn.classList.add("selected");

  selectedAvatar = btn.getAttribute("data-avatar");
  selectedGender = btn.getAttribute("data-gender") || "";
});

btnProfileNext.addEventListener("click", () => {
  const name = inputName.value.trim();
  if (!name){
    alert("Digite seu nome.");
    return;
  }
  if (!selectedAvatar){
    alert("Selecione um avatar.");
    return;
  }

  state.name = name;
  state.avatar = selectedAvatar;
  state.gender = selectedGender;
  saveGame();

  const msg =
`Bem-vindo(a), ${state.name}.

Temos múltiplas emergências chegando agora. Sua missão é avaliar rapidamente, formular hipóteses, solicitar exames com critério e iniciar condutas seguras.

Lembre-se: alguns casos exigem decisão imediata. Exames desnecessários ou atraso em quadros graves reduzem seu desempenho.

Assuma seu posto no consultório de emergência.`;

  typewriter(msg, briefingText, 16);
  showScreen("briefing");
});

btnGoOffice.addEventListener("click", () => {
  updateHUD();
  showScreen("office");
});

/* INIT */
(function init(){
  updateContinueButton();
  // se tiver save, mantém botão continuar; não auto-carrega (decisão do usuário)
})();
