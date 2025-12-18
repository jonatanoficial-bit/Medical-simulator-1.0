// =======================
// ESTADO GLOBAL
// =======================
let state = {
  name: "",
  avatar: "",
  startTime: null,
  currentCase: null
};

// =======================
// ELEMENTOS
// =======================
const coverScreen = document.getElementById("coverScreen");
const profileScreen = document.getElementById("profileScreen");
const gameScreen = document.getElementById("gameScreen");
const typewriter = document.getElementById("typewriter");

const avatarGrid = document.getElementById("avatarGrid");
const playerNameInput = document.getElementById("playerName");
const startGameBtn = document.getElementById("startGameBtn");

const hudName = document.getElementById("hudName");
const timerEl = document.getElementById("timer");
const caseTitle = document.getElementById("caseTitle");
const caseText = document.getElementById("caseText");

// =======================
// TYPEWRITER
// =======================
const text = "Bem-vindo ao Medical Simulator";
let i = 0;
function typeEffect() {
  if (i < text.length) {
    typewriter.textContent += text.charAt(i);
    i++;
    setTimeout(typeEffect, 60);
  }
}
typeEffect();

// =======================
// CAPA → PERFIL
// =======================
coverScreen.addEventListener("click", () => {
  coverScreen.classList.remove("active");
  profileScreen.classList.add("active");
});

// =======================
// AVATARES
// =======================
for (let i = 1; i <= 6; i++) {
  const img = document.createElement("img");
  img.src = `images/avatar${i}.png`;
  img.onclick = () => {
    document.querySelectorAll(".avatar-grid img").forEach(a => a.classList.remove("selected"));
    img.classList.add("selected");
    state.avatar = img.src;
  };
  avatarGrid.appendChild(img);
}

// =======================
// INICIAR JOGO
// =======================
startGameBtn.onclick = async () => {
  if (!playerNameInput.value || !state.avatar) return alert("Preencha nome e avatar");

  state.name = playerNameInput.value;
  state.startTime = Date.now();

  profileScreen.classList.remove("active");
  gameScreen.classList.add("active");

  hudName.textContent = state.name;
  loadCase();
  startTimer();
};

// =======================
// TIMER
// =======================
function startTimer() {
  setInterval(() => {
    const diff = Math.floor((Date.now() - state.startTime) / 1000);
    const min = String(Math.floor(diff / 60)).padStart(2, "0");
    const sec = String(diff % 60).padStart(2, "0");
    timerEl.textContent = `${min}:${sec}`;
  }, 1000);
}

// =======================
// CASOS
// =======================
async function loadCase() {
  const res = await fetch("cases.json");
  const cases = await res.json();
  state.currentCase = cases[Math.floor(Math.random() * cases.length)];
  caseTitle.textContent = state.currentCase.title;
  caseText.textContent = state.currentCase.description;
}
