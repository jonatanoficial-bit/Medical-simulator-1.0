// ===== CONFIGURAÇÃO BÁSICA =====

const STORAGE_KEY = "simuladorPoliticoSave_v6";

// Estado do jogo
let state = {
  name: "",
  party: null,
  officeIndex: 0,
  popularity: 50,
  funds: 50,
  integrity: 50,
};

// Cargos e fundos de tela
const offices = [
  { name: "Vereador", bg: "assets/municipal.png", type: "legislative" },
  {
    name: "Deputado Estadual",
    bg: "assets/assembly.png",
    type: "legislative",
  },
  {
    name: "Deputado Federal",
    bg: "assets/federal.png",
    type: "legislative",
  },
  { name: "Senador", bg: "assets/senate.png", type: "legislative" },
  { name: "Prefeito", bg: "assets/mayor.png", type: "executive" },
  { name: "Governador", bg: "assets/governor.png", type: "executive" },
  { name: "Presidente", bg: "assets/president.png", type: "executive" },
];

const parties = [
  {
    id: "PRP",
    label: "PRP",
    name: "Partido Renovador Popular",
    className: "party-prp",
  },
  {
    id: "PSLB",
    label: "PSLB",
    name: "Partido Social Liberal do Brasil",
    className: "party-pslb",
  },
  {
    id: "PTM",
    label: "PTM",
    name: "Partido Trabalhista Moderno",
    className: "party-ptm",
  },
  {
    id: "PVG",
    label: "PVG",
    name: "Partido Verde Global",
    className: "party-pvg",
  },
  {
    id: "MDBR",
    label: "MDBR",
    name: "Movimento Democrático Brasileiro",
    className: "party-mdbr",
  },
];

// Tons de discurso e temas para campanha
const tones = [
  {
    id: "populista",
    label: "Populista",
    popularity: +8,
    integrity: -6,
    description: "Fala para as massas, promete muito.",
  },
  {
    id: "progressista",
    label: "Progressista",
    popularity: +5,
    integrity: +1,
    description: "Defende pautas sociais e direitos.",
  },
  {
    id: "conservador",
    label: "Conservador",
    popularity: +3,
    integrity: +2,
    description: "Foco em segurança e valores tradicionais.",
  },
  {
    id: "tecnico",
    label: "Técnico",
    popularity: +2,
    integrity: +5,
    description: "Discurso baseado em dados e gestão.",
  },
];

const themes = [
  { id: "economia", label: "Economia", effect: +4 },
  { id: "saude", label: "Saúde", effect: +3 },
  { id: "educacao", label: "Educação", effect: +3 },
  { id: "seguranca", label: "Segurança", effect: +4 },
  { id: "meio-ambiente", label: "Meio Ambiente", effect: +2 },
];

// ===== ELEMENTOS =====

const screens = {
  start: document.getElementById("start-screen"),
  selection: document.getElementById("selection-screen"),
  game: document.getElementById("game-screen"),
  election: document.getElementById("election-screen"),
};

const newGameBtn = document.getElementById("new-game-btn");
const continueBtn = document.getElementById("continue-btn");
const backToStartBtn = document.getElementById("back-to-start-btn");
const confirmSelectionBtn = document.getElementById("confirm-selection-btn");

const partyListDiv = document.getElementById("party-list");
const playerNameInput = document.getElementById("player-name");

const gameScreen = document.getElementById("game-screen");
const playerInfoText = document.getElementById("player-info-text");
const officeText = document.getElementById("office-text");
const statPopularity = document.getElementById("stat-popularity");
const statFunds = document.getElementById("stat-funds");
const statIntegrity = document.getElementById("stat-integrity");
const actionsDiv = document.getElementById("actions");
const feedDiv = document.getElementById("feed");
const resetBtn = document.getElementById("reset-btn");

// Modal genérico
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalOptionsDiv = document.getElementById("modal-options");

// Campanha
const campaignOverlay = document.getElementById("campaign-overlay");
const toneOptionsDiv = document.getElementById("tone-options");
const themeOptionsDiv = document.getElementById("theme-options");
const startCampaignBtn = document.getElementById("start-campaign-btn");
const cancelCampaignBtn = document.getElementById("cancel-campaign-btn");

// Eleição
const electionTitle = document.getElementById("election-title");
const electionSubtitle = document.getElementById("election-subtitle");
const candidateBar = document.getElementById("candidate-bar");
const opponentBar = document.getElementById("opponent-bar");
const candidatePercentSpan = document.getElementById("candidate-percent");
const opponentPercentSpan = document.getElementById("opponent-percent");
const electionResultText = document.getElementById("election-result-text");
const electionContinueBtn = document.getElementById("election-continue-btn");

// ===== FUNÇÕES DE TELA =====

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function updateGameBackground() {
  const office = offices[state.officeIndex];
  gameScreen.style.setProperty(
    "--bg-image",
    `url("${office.bg}")`
  );
  // Usando pseudo-elemento ::before via CSS
  gameScreen.style.setProperty(
    "backgroundImage",
    `url("${office.bg}")`
  );
}

// ===== SALVAMENTO =====

function saveGame() {
  const data = {
    ...state,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // validação simples
    if (!parsed.name || parsed.officeIndex == null) return null;
    state = { ...state, ...parsed };
    return state;
  } catch (e) {
    console.error("Erro ao carregar save:", e);
    return null;
  }
}

function clearSave() {
  localStorage.removeItem(STORAGE_KEY);
}

// ===== FEED =====

function addFeed(message) {
  const p = document.createElement("p");
  p.textContent = message;
  feedDiv.prepend(p);
}

// ===== STATS =====

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function applyDelta(pop = 0, funds = 0, integ = 0, logText = "") {
  state.popularity = clamp(state.popularity + pop, 0, 100);
  state.funds = clamp(state.funds + funds, 0, 100);
  state.integrity = clamp(state.integrity + integ, 0, 100);
  updateHeader();
  if (logText) addFeed(logText);
  saveGame();
}

function updateHeader() {
  const office = offices[state.officeIndex];
  playerInfoText.textContent = `${state.name} — Partido ${state.party?.id ?? ""}`;
  officeText.textContent = office.name;

  statPopularity.textContent = state.popularity;
  statFunds.textContent = state.funds;
  statIntegrity.textContent = state.integrity;

  // Fundo do plenário (pseudo)
  gameScreen.style.setProperty(
    "backgroundImage",
    `url("${office.bg}")`
  );
}

// ===== AÇÕES POR CARGO =====

function getActionsForOffice(office) {
  if (office.type === "legislative") {
    return [
      {
        id: "votar-projeto",
        label: "Votar projeto",
        handler: actionVoteProject,
      },
      {
        id: "propor-lei",
        label: "Propor lei",
        handler: actionProposeLaw,
      },
      {
        id: "fiscalizar",
        label: "Fiscalizar",
        handler: actionInspect,
      },
      {
        id: "discurso",
        label: "Discurso",
        handler: actionSpeech,
      },
      {
        id: "campanha",
        label: "Campanha",
        handler: openCampaignModal,
      },
    ];
  } else {
    // Executivo
    return [
      {
        id: "sancionar",
        label: "Sancionar / Vetar",
        handler: actionSanction,
      },
      {
        id: "crise",
        label: "Gerenciar crise",
        handler: actionCrisis,
      },
      {
        id: "orcamento",
        label: "Orçamento",
        handler: actionBudget,
      },
      {
        id: "discurso",
        label: "Discurso",
        handler: actionSpeech,
      },
      {
        id: "campanha",
        label: "Campanha",
        handler: openCampaignModal,
      },
    ];
  }
}

function renderActions() {
  const office = offices[state.officeIndex];
  const actions = getActionsForOffice(office);
  actionsDiv.innerHTML = "";
  actions.forEach((a) => {
    const btn = document.createElement("button");
    btn.className = "btn secondary";
    btn.textContent = a.label;
    btn.addEventListener("click", () => a.handler());
    actionsDiv.appendChild(btn);
  });
}

// ===== MODAL GENÉRICO =====

function openModal(title, text, options = []) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  modalOptionsDiv.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = `btn ${opt.type || "secondary"}`;
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      closeModal();
      opt.onClick && opt.onClick();
    });
    modalOptionsDiv.appendChild(btn);
  });

  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
}

// ===== AÇÕES LEGISLATIVAS =====

function actionVoteProject() {
  openModal(
    "Votar projeto",
    "Projeto em pauta: Reforma de segurança nas escolas. Qual é o seu voto?",
    [
      {
        label: "Sim",
        type: "primary",
        onClick: () => {
          const approved = Math.random() < 0.55;
          if (approved) {
            applyDelta(+3, 0, +1, "Você votou SIM e o projeto foi aprovado. Popularidade aumentou.");
          } else {
            applyDelta(-2, 0, -2, "Você votou SIM, mas o projeto foi rejeitado. Você é visto como ineficaz.");
          }
        },
      },
      {
        label: "Não",
        type: "secondary",
        onClick: () => {
          const approved = Math.random() < 0.4;
          if (approved) {
            applyDelta(-2, 0, +2, "Você votou NÃO, mas o projeto foi aprovado. Integridade subiu, popularidade caiu.");
          } else {
            applyDelta(0, 0, +1, "Você votou NÃO e o projeto foi rejeitado. Integridade levemente maior.");
          }
        },
      },
    ]
  );
}

function actionProposeLaw() {
  const topics = [
    {
      name: "Projeto de Saúde",
      successPop: +5,
      successInteg: +1,
      failPop: -3,
      failInteg: -2,
    },
    {
      name: "Projeto de Mobilidade Urbana",
      successPop: +4,
      successInteg: +1,
      failPop: -2,
      failInteg: -2,
    },
    {
      name: "Projeto de Educação Integral",
      successPop: +6,
      successInteg: +2,
      failPop: -3,
      failInteg: -1,
    },
  ];

  const chosen = topics[Math.floor(Math.random() * topics.length)];
  const cost = 4;

  if (state.funds < cost) {
    addFeed("Você não tem fundos suficientes para apresentar um novo projeto.");
    return;
  }

  openModal(
    "Propor lei",
    `Deseja apresentar o ${chosen.name}? (custará ${cost} fundos)`,
    [
      {
        label: "Apresentar",
        type: "primary",
        onClick: () => {
          state.funds = clamp(state.funds - cost, 0, 100);
          const approved = Math.random() < 0.6;
          if (approved) {
            applyDelta(
              chosen.successPop,
              0,
              chosen.successInteg,
              `${chosen.name} foi aprovado! Popularidade e integridade aumentaram.`
            );
          } else {
            applyDelta(
              chosen.failPop,
              0,
              chosen.failInteg,
              `${chosen.name} foi rejeitado. Você perdeu apoio.`
            );
          }
        },
      },
      {
        label: "Cancelar",
        type: "secondary",
      },
    ]
  );
}

function actionInspect() {
  openModal(
    "Fiscalização",
    "Você iniciou uma fiscalização de obras públicas. Encontrou irregularidades?",
    [
      {
        label: "Denunciar",
        type: "primary",
        onClick: () => {
          applyDelta(+4, -2, +4, "Você denunciou irregularidades e ganhou crédito com a população.");
        },
      },
      {
        label: "Nada encontrado",
        type: "secondary",
        onClick: () => {
          applyDelta(-2, 0, -1, "A fiscalização não encontrou problemas, mas perdeu tempo precioso.");
        },
      },
    ]
  );
}

function actionSpeech() {
  openModal(
    "Discurso",
    "Escolha o tom do discurso:",
    [
      {
        label: "Motivador",
        type: "primary",
        onClick: () =>
          applyDelta(+3, 0, +1, "Você fez um discurso motivador e inspirou confiança."),
      },
      {
        label: "Técnico",
        type: "secondary",
        onClick: () =>
          applyDelta(+1, 0, +3, "Discurso técnico aumentou a percepção de competência."),
      },
      {
        label: "Polarizador",
        type: "secondary",
        onClick: () =>
          applyDelta(+4, 0, -4, "Discurso polarizador mobilizou sua base, mas reduziu a integridade percebida."),
      },
    ]
  );
}

// ===== AÇÕES EXECUTIVAS =====

function actionSanction() {
  openModal(
    "Sancionar / Vetar",
    "Chegou um projeto polêmico para sanção. Qual sua decisão?",
    [
      {
        label: "Sancionar",
        type: "primary",
        onClick: () => {
          applyDelta(+3, 0, -2, "Você sancionou o projeto e foi visto como pragmático, mas parte da opinião pública criticou.");
        },
      },
      {
        label: "Vetar",
        type: "secondary",
        onClick: () => {
          applyDelta(-2, 0, +4, "Você vetou o projeto por princípio. Integridade subiu, mas perdeu algum apoio.");
        },
      },
    ]
  );
}

function actionCrisis() {
  openModal(
    "Gerenciar crise",
    "Uma crise estourou na imprensa. Como você responde?",
    [
      {
        label: "Coletiva de imprensa",
        type: "primary",
        onClick: () =>
          applyDelta(+2, -3, +1, "Você enfrentou a crise de frente, gastando recursos, mas manteve boa imagem."),
      },
      {
        label: "Negar tudo",
        type: "secondary",
        onClick: () =>
          applyDelta(+1, 0, -5, "Você negou tudo. No curto prazo funcionou, mas sua integridade caiu."),
      },
    ]
  );
}

function actionBudget() {
  openModal(
    "Orçamento",
    "Você precisa decidir a prioridade do orçamento.",
    [
      {
        label: "Cortar gastos",
        type: "secondary",
        onClick: () =>
          applyDelta(-2, +7, +2, "Você cortou gastos, equilibrando o caixa, mas perdeu um pouco de popularidade."),
      },
      {
        label: "Investir em programas sociais",
        type: "primary",
        onClick: () =>
          applyDelta(+5, -6, +1, "Você investiu em programas sociais. Popularidade subiu, mas gastos aumentaram."),
      },
    ]
  );
}

// ===== CAMPANHA =====

let selectedToneId = null;
let selectedThemeId = null;

function renderCampaignOptions() {
  toneOptionsDiv.innerHTML = "";
  tones.forEach((t) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = t.label;
    chip.title = t.description;
    chip.addEventListener("click", () => {
      selectedToneId = t.id;
      [...toneOptionsDiv.children].forEach((c) =>
        c.classList.remove("selected")
      );
      chip.classList.add("selected");
    });
    toneOptionsDiv.appendChild(chip);
  });

  themeOptionsDiv.innerHTML = "";
  themes.forEach((th) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = th.label;
    chip.addEventListener("click", () => {
      selectedThemeId = th.id;
      [...themeOptionsDiv.children].forEach((c) =>
        c.classList.remove("selected")
      );
      chip.classList.add("selected");
    });
    themeOptionsDiv.appendChild(chip);
  });

  selectedToneId = null;
  selectedThemeId = null;
}

function openCampaignModal() {
  renderCampaignOptions();
  campaignOverlay.classList.remove("hidden");
}

function closeCampaignModal() {
  campaignOverlay.classList.add("hidden");
}

startCampaignBtn.addEventListener("click", () => {
  if (!selectedToneId || !selectedThemeId) {
    alert("Selecione o tom do discurso e o tema principal.");
    return;
  }

  const tone = tones.find((t) => t.id === selectedToneId);
  const theme = themes.find((th) => th.id === selectedThemeId);

  // custo financeiro
  const cost = 8;
  if (state.funds < cost) {
    addFeed("Você não possui fundos suficientes para uma campanha robusta.");
    return;
  }

  state.funds = clamp(state.funds - cost, 0, 100);
  state.popularity = clamp(state.popularity + tone.popularity + theme.effect, 0, 100);
  state.integrity = clamp(state.integrity + tone.integrity, 0, 100);

  addFeed(
    `Você lançou campanha com tom ${tone.label} e foco em ${theme.label}. Popularidade e integridade foram ajustadas.`
  );

  saveGame();
  closeCampaignModal();
  startElection();
});

cancelCampaignBtn.addEventListener("click", () => {
  closeCampaignModal();
});

// ===== ELEIÇÃO =====

function startElection() {
  // carregar tela de eleição
  showScreen("election");

  const office = offices[state.officeIndex];
  electionTitle.textContent = `Contagem de votos para ${office.name}`;
  electionSubtitle.textContent = "Apuração em andamento...";

  candidateBar.style.width = "0%";
  opponentBar.style.width = "0%";
  candidatePercentSpan.textContent = "0%";
  opponentPercentSpan.textContent = "0%";
  electionResultText.textContent = "";
  electionContinueBtn.disabled = true;

  // cálculo de chance baseado nas métricas
  const baseChance =
    state.popularity * 0.5 + state.integrity * 0.3 + state.funds * 0.2;
  // converte para percentual vs oponente
  let candidatePercent = clamp(baseChance + (Math.random() * 20 - 10), 5, 95);
  let opponentPercent = 100 - candidatePercent;

  setTimeout(() => {
    candidateBar.style.width = `${candidatePercent}%`;
    opponentBar.style.width = `${opponentPercent}%`;
    candidatePercentSpan.textContent = `${candidatePercent.toFixed(1)}%`;
    opponentPercentSpan.textContent = `${opponentPercent.toFixed(1)}%`;

    setTimeout(() => {
      const won = candidatePercent > opponentPercent;
      if (won) {
        electionResultText.textContent = `Você venceu a eleição com ${candidatePercent.toFixed(
          1
        )}% dos votos!`;
      } else {
        electionResultText.textContent = `Você perdeu a eleição. Conseguiu apenas ${candidatePercent.toFixed(
          1
        )}% dos votos.`;
      }
      electionContinueBtn.disabled = false;

      electionContinueBtn.onclick = () => {
        if (won) {
          advanceOffice();
        } else {
          // penalidade após derrota
          applyDelta(-5, -5, 0, "A derrota abalou sua carreira política.");
          // permanece no mesmo cargo
          showScreen("game");
        }
      };
    }, 1300);
  }, 400);
}

function advanceOffice() {
  if (state.officeIndex < offices.length - 1) {
    state.officeIndex += 1;
    state.popularity = 50;
    state.funds = 40;
    state.integrity = clamp(state.integrity, 30, 100);
    addFeed(
      `Parabéns! Você foi eleito ${offices[state.officeIndex].name}. Um novo mandato começa.`
    );
    saveGame();
    beginMandate();
  } else {
    // Já é presidente
    addFeed(
      "Você alcançou a presidência e manteve-se no poder. Fim de jogo (por enquanto)!"
    );
    saveGame();
    showScreen("game");
  }
}

// ===== INÍCIO DE MANDATO =====

function beginMandate() {
  showScreen("game");
  feedDiv.innerHTML = "";
  updateHeader();
  renderActions();
  addFeed(
    `Iniciando mandato como ${offices[state.officeIndex].name}. Boa sorte!`
  );
  saveGame();
}

// ===== SELEÇÃO DE PARTIDO =====

function renderParties() {
  partyListDiv.innerHTML = "";
  let selectedId = state.party?.id ?? null;

  parties.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = `party-btn ${p.className}`;
    btn.innerHTML = `<strong>${p.label}</strong><span>${p.name}</span>`;
    if (p.id === selectedId) btn.classList.add("selected");

    btn.addEventListener("click", () => {
      selectedId = p.id;
      state.party = p;
      [...partyListDiv.children].forEach((b) =>
        b.classList.remove("selected")
      );
      btn.classList.add("selected");
    });

    partyListDiv.appendChild(btn);
  });
}

// ===== BOTÕES DE NAVEGAÇÃO =====

newGameBtn.addEventListener("click", () => {
  // reset parcial
  state = {
    name: "",
    party: null,
    officeIndex: 0,
    popularity: 50,
    funds: 50,
    integrity: 50,
  };
  clearSave();
  playerNameInput.value = "";
  renderParties();
  showScreen("selection");
});

continueBtn.addEventListener("click", () => {
  const loaded = loadGame();
  if (!loaded) {
    alert("Nenhum jogo salvo encontrado.");
    return;
  }
  beginMandate();
});

backToStartBtn.addEventListener("click", () => {
  showScreen("start");
});

confirmSelectionBtn.addEventListener("click", () => {
  if (!state.party) {
    alert("Selecione um partido.");
    return;
  }
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Digite seu nome.");
    return;
  }
  state.name = name;
  state.officeIndex = 0;
  state.popularity = 50;
  state.funds = 50;
  state.integrity = 50;
  saveGame();
  beginMandate();
});

resetBtn.addEventListener("click", () => {
  if (confirm("Deseja iniciar um novo jogo? O progresso salvo será apagado.")) {
    clearSave();
    state = {
      name: "",
      party: null,
      officeIndex: 0,
      popularity: 50,
      funds: 50,
      integrity: 50,
    };
    playerNameInput.value = "";
    renderParties();
    showScreen("start");
    // mostrar botão continuar como oculto, pois save apagou
    updateContinueVisibility();
  }
});

// ===== INICIALIZAÇÃO =====

function updateContinueVisibility() {
  const hasSave = !!localStorage.getItem(STORAGE_KEY);
  continueBtn.style.display = hasSave ? "inline-block" : "none";
}

function init() {
  renderParties();
  updateContinueVisibility();
}

document.addEventListener("DOMContentLoaded", init);
