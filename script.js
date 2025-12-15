/* ===============================
   ESTADO DO JOGO
================================ */
let gameState = {
  doctor: { name: "", avatar: "", tier: "residente" },
  points: 0,
  casesDone: 0,
  cases: [],
  currentCase: null,
  selectedDiagnosis: null,
  selectedMedication: null
};

/* ===============================
   TELAS
================================ */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ===============================
   BOTÕES INICIAIS
================================ */
function startNewGame() {
  localStorage.removeItem("eds-save");
  showScreen("screen-profile");
  loadAvatars();
}

function continueGame() {
  const save = localStorage.getItem("eds-save");
  if (!save) return alert("Nenhum jogo salvo.");
  gameState = JSON.parse(save);
  enterOffice();
}

/* ===============================
   PERFIL
================================ */
function loadAvatars() {
  const grid = document.getElementById("avatarGrid");
  grid.innerHTML = "";
  ["avatar1","avatar2","avatar3","avatar4","avatar5","avatar6"].forEach(a=>{
    const img=document.createElement("img");
    img.src=`images/${a}.png`;
    img.style.width="120px";
    img.onclick=()=>{
      document.querySelectorAll("#avatarGrid img").forEach(i=>i.classList.remove("selected"));
      img.classList.add("selected");
      gameState.doctor.avatar=img.src;
    };
    grid.appendChild(img);
  });
}

function confirmProfile() {
  const name=document.getElementById("doctorName").value.trim();
  if(!name||!gameState.doctor.avatar) return alert("Preencha nome e avatar.");
  gameState.doctor.name=name;
  saveGame();
  enterOffice();
}

/* ===============================
   CONSULTÓRIO
================================ */
async function enterOffice() {
  showScreen("screen-office");
  document.getElementById("doctorAvatar").src=gameState.doctor.avatar;
  document.getElementById("doctorInfo").innerHTML=`<strong>${gameState.doctor.name}</strong><br>${gameState.doctor.tier}`;
  document.getElementById("points").innerText=gameState.points;
  document.getElementById("casesDone").innerText=gameState.casesDone;
  if(gameState.cases.length===0){
    const res=await fetch("cases.json");
    gameState.cases=await res.json();
  }
}

function nextCase(){
  gameState.currentCase=gameState.cases.shift();
  openCase();
}

/* ===============================
   ATENDIMENTO
================================ */
function openCase(){
  const c=gameState.currentCase;
  showScreen("screen-case");

  document.getElementById("caseBg").style.backgroundImage=`url(images/hospital_corridor.jpg)`;
  document.getElementById("patientName").innerText=`${c.patient.name} (${c.patient.age}a)`;
  document.getElementById("patientPhoto").src=c.patient.photo;
  document.getElementById("patientComplaint").innerText=c.complaint;
  document.getElementById("patientHistory").innerText=c.history;

  const tri=document.getElementById("triageBadge");
  tri.innerText=c.patient.triage;
  tri.className=`triage-badge triage-${c.patient.triage.toLowerCase()}`;

  const vit=document.getElementById("vitalsList");
  vit.innerHTML="";
  c.vitals.forEach(v=>{const li=document.createElement("li");li.innerText=v;vit.appendChild(li);});

  renderQuestions(c);
  renderExams(c);
  renderDiagnosis(c);
  renderMedications(c);
}

/* ===============================
   RENDERIZAÇÕES
================================ */
function renderQuestions(c){
  const q=document.getElementById("questionsArea");
  q.innerHTML="";
  c.questions.forEach(qu=>{
    const b=document.createElement("button");
    b.innerText=qu.label;
    b.onclick=()=>alert(qu.answer);
    q.appendChild(b);
  });
}

function renderExams(c){
  const e=document.getElementById("examsArea");
  e.innerHTML="";
  document.getElementById("examResultsArea").innerHTML="";
  Object.keys(c.examResults).forEach(key=>{
    const b=document.createElement("button");
    b.innerText=key;
    b.onclick=()=>{
      document.getElementById("examResultsArea").innerText=c.examResults[key].text;
    };
    e.appendChild(b);
  });
}

function renderDiagnosis(c){
  const d=document.getElementById("diagnosisArea");
  d.innerHTML="";
  c.diagnosis.forEach(di=>{
    const b=document.createElement("button");
    b.innerText=di.label;
    b.onclick=()=>{
      document.querySelectorAll("#diagnosisArea button").forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");
      gameState.selectedDiagnosis=di;
    };
    d.appendChild(b);
  });
}

function renderMedications(c){
  const m=document.getElementById("medicationsArea");
  m.innerHTML="";
  c.medications.forEach(me=>{
    const b=document.createElement("button");
    b.innerText=me.label;
    b.onclick=()=>{
      document.querySelectorAll("#medicationsArea button").forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");
      gameState.selectedMedication=me;
    };
    m.appendChild(b);
  });
}

/* ===============================
   FINALIZAÇÃO
================================ */
function finalizeCase(){
  let score=0;
  if(gameState.selectedDiagnosis?.correct) score+=50;
  else score-=30;

  if(gameState.selectedMedication?.correct) score+=30;
  else score-=20;

  gameState.points+=score;
  gameState.casesDone++;
  saveGame();
  alert(`Atendimento finalizado.\nPontuação: ${score}`);
  enterOffice();
}

/* ===============================
   SAVE / FULLSCREEN
================================ */
function saveGame(){localStorage.setItem("eds-save",JSON.stringify(gameState));}
function toggleFullscreen(){!document.fullscreenElement?document.documentElement.requestFullscreen():document.exitFullscreen();}
function openHelp(){alert("Manual em desenvolvimento.");}
function goHome(){showScreen("screen-home");}
