// game.js — compatível com o HTML/CSS reescritos (IDs: btnNew, btnContinue, btnStart, etc.)
(() => {
  "use strict";

  const SAVE_KEY = "medical_sim_save_v1";

  // ===== Helpers =====
  const $ = (id) => document.getElementById(id);

  function showScreen(screenId) {
    const screens = document.querySelectorAll(".screen");
    screens.forEach((s) => s.classList.remove("active"));
    const el = $(screenId);
    if (el) el.classList.add("active");
    window.scrollTo(0, 0);
  }

  function requestFullscreen() {
    const el = document.documentElement;
    // Fullscreen só funciona após gesto do usuário (click/touch)
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function typewriter(el, text, speed = 18) {
    el.textContent = "";
    let i = 0;
    const t = setInterval(() => {
      el.textContent += text[i] ?? "";
      i++;
      if (i >= text.length) clearInterval(t);
    }, speed);
  }

  // ===== State =====
  let state = {
    name: "",
    avatar: "",
    score: 0,
    casesResolved: 0,
    rank: "Médico Residente",
  };

  function computeRank(score) {
    if (score < 250) return "Médico Residente";
    if (score < 800) return "Médico Titular";
    return "Médico Pleno";
  }

  function save() {
    state.rank = computeRank(state.score);
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      state = JSON.parse(raw);
      state.rank = computeRank(state.score || 0);
      return true;
    } catch {
      return false;
    }
  }

  function resetSave() {
    localStorage.removeItem(SAVE_KEY);
    state = {
      name: "",
      avatar: "",
      score: 0,
      casesResolved: 0,
      rank: "Médico Residente",
    };
  }

  function updateOfficeHUD() {
    const hudAvatar = $("hudAvatar");
    const hudName = $("hudName");
    const hudRank = $("hudRank");
    const hudScore = $("hudScore");
    const hudCases = $("hudCases");

    if (hudAvatar) hudAvatar.src = state.avatar || "images/avatar1.png";
    if (hudName) hudName.textContent = state.name || "Médico(a)";
    if (hudRank) hudRank.textContent = state.rank || "Médico Residente";
    if (hudScore) hudScore.textContent = String(state.score || 0);
    if (hudCases) hudCases.textContent = String(state.casesResolved || 0);
  }

  // ===== UI refs =====
  const btnNew = $("btnNew");
  const btnContinue = $("btnContinue");
  const btnStart = $("btnStart");
  const btnOffice = $("btnOffice");
  const btnNextCase = $("btnNextCase");

  const inputName = $("inputName");
  const briefingText = $("briefingText");

  // ===== Avatar select =====
  let selectedAvatar = null;

  const avatarImgs = Array.from(document.querySelectorAll(".avatar"));
  avatarImgs.forEach((img) => {
    img.addEventListener("click", () => {
      avatarImgs.forEach((x) => x.classList.remove("selected"));
      img.classList.add("selected");
      selectedAvatar = img.getAttribute("src");
    }, { passive: true });
  });

  // ===== Buttons behavior =====
  if (btnNew) {
    btnNew.addEventListener("click", () => {
      requestFullscreen();
      resetSave();
      save(); // cria save inicial para "Continuar" aparecer depois
      showScreen("screen-profile");
    });
  }

  if (btnContinue) {
    btnContinue.addEventListener("click", () => {
      requestFullscreen();
      const ok = load();
      if (!ok) {
        alert("Nenhum progresso salvo encontrado.");
        return;
      }
      updateOfficeHUD();
      showScreen("screen-office");
    });
  }

  if (btnStart) {
    btnStart.addEventListener("click", () => {
      requestFullscreen();

      const name = (inputName?.value || "").trim();
      if (!name) {
        alert("Digite o nome do médico(a).");
        return;
      }
      if (!selectedAvatar) {
        alert("Selecione um avatar.");
        return;
      }

      state.name = name;
      state.avatar = selectedAvatar;
      state.rank = computeRank(state.score || 0);
      save();

      const msg =
        `Bem-vindo(a), ${state.name}.\n\n` +
        `Temos várias emergências aguardando. Você deverá coletar informações, solicitar exames com critério e decidir diagnóstico/conduta.\n\n` +
        `Assuma seu posto imediatamente.`;

      if (briefingText) typewriter(briefingText, msg, 16);
      showScreen("screen-briefing");
    });
  }

  if (btnOffice) {
    btnOffice.addEventListener("click", () => {
      requestFullscreen();
      updateOfficeHUD();
      showScreen("screen-office");
    });
  }

  // Placeholder para próximo caso (você já tinha sistema de casos; aqui é só para não “morrer”)
  if (btnNextCase) {
    btnNextCase.addEventListener("click", () => {
      alert("Próximo Caso: conecte aqui sua tela de casos (screen-case) e lógica clínica.");
      // Quando você quiser, eu te devolvo o game.js completo com os casos e telas,
      // mas mantendo esses IDs e o full screen correto.
    });
  }

  // ===== Init =====
  // Mostrar/ocultar "Continuar"
  function syncContinueButton() {
    if (!btnContinue) return;
    btnContinue.style.display = localStorage.getItem(SAVE_KEY) ? "inline-block" : "none";
  }

  syncContinueButton();

  // Se existir save, não auto-entra (decisão do usuário), mas mantém o botão
})();
