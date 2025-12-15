/* ===============================
   ESTADO GLOBAL DO JOGO
================================ */
let gameState = {
  doctor: {
    name: "",
    avatar: "",
    tier: "residente"
  },
  points: 0,
  casesDone: 0,
  cases: [],
  currentCase: null
};

/* ===============================
   UTILITÁRIOS DE TELA
================================ */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

/* ===============================
   BOTÕES PRINCIPAIS
================================ */
function startNewGame() {
  localStorage.removeItem("eds-save");
  showScreen("screen-profile");
  loadAvatars();
}

function continueGame() {
  const save = localStorage.getItem("eds-save");
  if (!save) {
    alert("Nenhum jogo salvo encontrado.");
    return;
  }
  gameState = JSON.parse(save);
  enterOffice();
}

/* ===============================
   PERFIL
================================ */
function loadAvatars() {
  const grid = document.getElementById("avatarGrid");
  grid.innerHTML = "";

  const avatars = [
    "images/avatar1.png",
    "images/avatar2.png",
    "images/avatar3.png",
    "images/avatar4.png",
    "images/avatar5.png",
    "images/avatar6.png"
  ];

  avatars.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.style.width = "120px";
    img.style.borderRadius = "12px";
    img.style.cursor = "pointer";
    img.onclick = () => {
      document.querySelectorAll("#avatarGrid img").forEach(i => i.style.outline = "none");
      img.style.outline = "3px solid #0ea5ff";
      gameState.doctor.avatar = src;
    };
    grid.appendChild(img);
  });
}

function confirmProfile() {
  const name = document.getElementById("doctorName").value.trim();
  if (!name || !gameState.doctor.avatar) {
    alert("Preencha o nome e escolha um avatar.");
    return;
  }
  gameState.doctor.name = name;
  saveGame();
  enterOffice();
}

/* ===============================
   CONSULTÓRIO
================================ */
function enterOffice() {
  showScreen("screen-office");

  document.getElementById("doctorAvatar").src = gameState.doctor.avatar;
  document.getElementById("doctorInfo").innerHTML = `
    <strong>${gameState.doctor.name}</strong><br>
    Cargo: Médico ${gameState.doctor.tier}
  `;

  document.getElementById("points").innerText = gameState.points;
  document.getElementById("casesDone").innerText = gameState.casesDone;

  if (gameState.cases.length === 0) {
    loadCases();
  }
}

/* ===============================
   CASOS
================================ */
async function loadCases() {
  try {
    const res = await fetch("cases.json");
    gameState.cases = await res.json();
  } catch (e) {
    alert("Erro ao carregar cases.json");
  }
}

function nextCase() {
  if (gameState.cases.length === 0) {
    alert("Nenhum caso disponível.");
    return;
  }
  gameState.currentCase = gameState.cases.shift();
  saveGame();
  openCaseScreen();
}

/* ===============================
   TELA DE ATENDIMENTO
================================ */
function openCaseScreen() {
  alert(
    `Novo caso:\n\n${gameState.currentCase.patient.name}\n${gameState.currentCase.complaint}`
  );

  // Próximo passo será substituir esse alert pela tela completa
}

/* ===============================
   SAVE
================================ */
function saveGame() {
  localStorage.setItem("eds-save", JSON.stringify(gameState));
}

/* ===============================
   FULLSCREEN / HELP
================================ */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function openHelp() {
  alert("Manual em desenvolvimento.");
}

/* ===============================
   VOLTAR
================================ */
function goHome() {
  showScreen("screen-home");
}
