// ===============================
// EMERGENCY DOCTOR SIMULATOR
// SCRIPT PRINCIPAL – VERSÃO ESTÁVEL
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Script carregado");

  const btnNovo = document.getElementById("btnNovoJogo");
  const btnContinuar = document.getElementById("btnContinuar");

  // ===============================
  // ESTADO GLOBAL
  // ===============================
  let gameState = {
    doctor: null,
    avatar: null,
    score: 0,
    casesCompleted: 0,
    currentCaseIndex: 0,
    cases: [],
    exams: []
  };

  // ===============================
  // PATHS COMPATÍVEIS (GitHub + Vercel)
  // ===============================
  const BASE_PATH = location.hostname.includes("github.io")
    ? "/Medical-simulator-1.0"
    : "";

  const CASES_URL = `${BASE_PATH}/cases.json`;
  const EXAMS_URL = `${BASE_PATH}/exams.json`;

  // ===============================
  // BOTÕES PRINCIPAIS
  // ===============================
  if (btnNovo) {
    btnNovo.addEventListener("click", iniciarNovoJogo);
  }

  if (btnContinuar) {
    btnContinuar.addEventListener("click", continuarJogo);
  }

  // ===============================
  // INICIAR NOVO JOGO
  // ===============================
  async function iniciarNovoJogo() {
    console.log("▶ Novo jogo");

    await carregarDados();

    gameState.score = 0;
    gameState.casesCompleted = 0;
    gameState.currentCaseIndex = 0;

    localStorage.setItem("eds_save", JSON.stringify(gameState));

    mostrarTelaPerfil();
  }

  // ===============================
  // CONTINUAR JOGO
  // ===============================
  function continuarJogo() {
    const save = localStorage.getItem("eds_save");
    if (!save) {
      alert("Nenhum jogo salvo encontrado.");
      return;
    }

    gameState = JSON.parse(save);
    console.log("▶ Jogo carregado", gameState);

    mostrarTelaAtendimento();
  }

  // ===============================
  // CARREGAMENTO DE DADOS (COM FALLBACK)
  // ===============================
  async function carregarDados() {
    try {
      const [casesRes, examsRes] = await Promise.all([
        fetch(CASES_URL),
        fetch(EXAMS_URL)
      ]);

      if (!casesRes.ok || !examsRes.ok) throw new Error("JSON não encontrado");

      gameState.cases = await casesRes.json();
      gameState.exams = await examsRes.json();

      console.log("📦 Dados carregados com sucesso");
    } catch (e) {
      console.warn("⚠ Usando fallback interno");

      gameState.cases = [
        {
          id: 1,
          title: "Dor torácica",
          risk: "vermelho",
          symptoms: ["Dor no peito", "Sudorese", "Dispneia"],
          correctDiagnosis: "Infarto agudo do miocárdio"
        }
      ];

      gameState.exams = [
        { id: "ecg", name: "ECG" },
        { id: "troponina", name: "Troponina" },
        { id: "rx", name: "Raio-X de tórax" }
      ];
    }
  }

  // ===============================
  // TELAS
  // ===============================
  function mostrarTelaPerfil() {
    ocultarTodas();
    document.getElementById("screenPerfil")?.classList.add("active");
  }

  function mostrarTelaAtendimento() {
    ocultarTodas();
    document.getElementById("screenAtendimento")?.classList.add("active");
    renderizarCasoAtual();
  }

  function ocultarTodas() {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  }

  // ===============================
  // CASO
  // ===============================
  function renderizarCasoAtual() {
    const caso = gameState.cases[gameState.currentCaseIndex];
    if (!caso) {
      alert("Parabéns! Todos os casos concluídos.");
      return;
    }

    const el = document.getElementById("caseTitle");
    if (el) el.textContent = caso.title;
  }

});
