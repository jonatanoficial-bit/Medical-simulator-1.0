(() => {
  "use strict";

  const SAVE_KEY = "medical_simulator_save_v1";

  // ===== Helpers =====
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  function showScreen(id){
    qsa(".screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo(0,0);
  }

  function requestFullscreen(){
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function typewriter(el, text, speed=16){
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
    hits: 0,
    errors: 0,
    deaths: 0,
    rank: "Médico Residente",
    currentCaseId: null,
    usedExams: [],
    usedQuestions: []
  };

  function computeRank(score){
    if (score < 250) return "Médico Residente";
    if (score < 800) return "Médico Titular";
    return "Médico Pleno";
  }

  function saveGame(){
    state.rank = computeRank(state.score);
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function loadGame(){
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

  function resetGame(){
    localStorage.removeItem(SAVE_KEY);
    state = {
      name: "",
      avatar: "",
      score: 0,
      casesResolved: 0,
      hits: 0,
      errors: 0,
      deaths: 0,
      rank: "Médico Residente",
      currentCaseId: null,
      usedExams: [],
      usedQuestions: []
    };
  }

  // ===== UI refs =====
  const btnHelp = $("btnHelp");
  const helpModal = $("helpModal");
  const btnHelpClose = $("btnHelpClose");

  const btnNew = $("btnNew");
  const btnContinue = $("btnContinue");

  const inputName = $("inputName");
  const avatarGrid = $("avatarGrid");
  const btnProfileNext = $("btnProfileNext");

  const briefingText = $("briefingText");
  const btnGoOffice = $("btnGoOffice");

  const hudAvatar = $("hudAvatar");
  const hudName = $("hudName");
  const hudRank = $("hudRank");
  const hudScore = $("hudScore");
  const hudCases = $("hudCases");
  const hudHits = $("hudHits");
  const hudErrors = $("hudErrors");
  const hudDeaths = $("hudDeaths");
  const hudPrestige = $("hudPrestige");
  const hudPrestigeTxt = $("hudPrestigeTxt");
  const hudPerf = $("hudPerf");
  const hudPerfTxt = $("hudPerfTxt");

  const btnNextCase = $("btnNextCase");
  const btnSave = $("btnSave");
  const btnReset = $("btnReset");

  const patientPhoto = $("patientPhoto");
  const patientName = $("patientName");
  const patientDemo = $("patientDemo");
  const patientTriage = $("patientTriage");
  const patientComplaint = $("patientComplaint");
  const patientHistory = $("patientHistory");
  const vitalsEl = $("vitals");

  const questionsEl = $("questions");
  const qaEl = $("qa");
  const examsEl = $("exams");
  const examResultsEl = $("examResults");
  const diagnosisEl = $("diagnosis");
  const medicationsEl = $("medications");

  const btnFinish = $("btnFinish");
  const btnBackOffice = $("btnBackOffice");

  const resultSummary = $("resultSummary");
  const resultDetail = $("resultDetail");
  const resultScore = $("resultScore");
  const btnResultOffice = $("btnResultOffice");

  // ===== Modal =====
  btnHelp.addEventListener("click", () => helpModal.classList.add("show"));
  btnHelpClose.addEventListener("click", () => helpModal.classList.remove("show"));
  helpModal.addEventListener("click", (e) => { if (e.target === helpModal) helpModal.classList.remove("show"); });

  // ===== Continue visibility =====
  function updateContinueButton(){
    btnContinue.style.display = localStorage.getItem(SAVE_KEY) ? "inline-block" : "none";
  }

  // ===== HUD =====
  function updateHUD(){
    state.rank = computeRank(state.score);

    hudAvatar.src = state.avatar || "images/avatar1.png";
    hudName.textContent = state.name || "Médico(a)";
    hudRank.textContent = state.rank;

    hudScore.textContent = String(state.score || 0);
    hudCases.textContent = String(state.casesResolved || 0);
    hudHits.textContent = String(state.hits || 0);
    hudErrors.textContent = String(state.errors || 0);
    hudDeaths.textContent = String(state.deaths || 0);

    const prestige = Math.max(0, Math.min(100, Math.round((state.score || 0) / 12)));
    const total = (state.hits || 0) + (state.errors || 0) + (state.deaths || 0);
    const perf = total > 0 ? Math.max(0, Math.min(100, Math.round(((state.hits || 0) / total) * 100))) : 0;

    hudPrestige.style.width = prestige + "%";
    hudPrestigeTxt.textContent = prestige + "%";

    hudPerf.style.width = perf + "%";
    hudPerfTxt.textContent = perf + "%";
  }

  // ===== Core scoring =====
  function severityPenalty(sev){
    if (sev === "leve") return 15;
    if (sev === "grave") return 45;
    return 85;
  }
  function medPenalty(risk){
    if (risk === "baixa") return 10;
    if (risk === "media") return 25;
    return 55;
  }

  // ===== Case Engine =====
  // Observação: imagens de exame usam seus arquivos:
  // images/xray.jpg, images/mri.jpg, images/labs.jpg
  // paciente usa: images/patient_male.jpg / images/patient_female.jpg
  const IMG = {
    xray: "images/xray.jpg",
    mri: "images/mri.jpg",
    labs: "images/labs.jpg",
    male: "images/patient_male.jpg",
    female: "images/patient_female.jpg"
  };

  // Banco de casos (24 casos completos, por tier)
  const CASES = [
    // ===== RESIDENTE (8) =====
    mkCase("r_flu", "residente", "Mariana Souza", 22, "Feminino", IMG.female, "Verde",
      ["PA: 112/70", "FC: 92", "FR: 18", "SpO2: 98%", "Temp: 38,2°C"],
      "Febre, dor no corpo e tosse há 2 dias.",
      "Sem comorbidades. Contato com pessoas gripadas. Sem dispneia importante.",
      [
        q("Duração/Progressão", "Início há 48h, piora leve, mantendo alimentação parcial."),
        q("Sinais de alarme", "Nega dispneia intensa, confusão, dor torácica ou cianose."),
        q("Vacinação", "Não atualizou vacina sazonal este ano (simulado).")
      ],
      [
        ex("Teste rápido influenza/COVID (se disponível)", 20, false, 0, "Resultado compatível com infecção viral (simulado).", null, false),
        ex("Raio-X de tórax", 25, false, 0, "Sem consolidações (simulado).", IMG.xray, true),
        ex("Laboratório básico", 25, false, 0, "Sem alterações críticas.", IMG.labs, true)
      ],
      [
        dx("Síndrome gripal/infecção viral", true, "leve"),
        dx("Pneumonia bacteriana", false, "grave"),
        dx("Asma aguda", false, "grave"),
        dx("Embolia pulmonar", false, "critico"),
        dx("Crise de ansiedade", false, "leve"),
        dx("Sinusite bacteriana", false, "grave")
      ],
      [
        med("Hidratação, repouso e orientações de retorno", true, "baixa"),
        med("Antitérmico/analgesia conforme prescrição", true, "baixa"),
        med("Antibiótico empírico sem critérios", false, "media"),
        med("Alta sem orientações", false, "media")
      ],
      outcome()
    ),

    mkCase("r_asthma", "residente", "João Pereira", 19, "Masculino", IMG.male, "Amarelo",
      ["PA: 118/74", "FC: 108", "FR: 26", "SpO2: 94%", "Temp: 36,8°C"],
      "Falta de ar e chiado.",
      "História de asma. Piora após poeira. Sem febre.",
      [
        q("Uso de broncodilatador", "Usou medicação de resgate com melhora parcial."),
        q("Pico de fluxo (se tiver)", "Reduzido (simulado)."),
        q("Dor torácica", "Nega dor em aperto típica de IAM.")
      ],
      [
        ex("Oximetria/monitorização", 5, true, 10, "SpO2 94% em ar ambiente (simulado).", null, false),
        ex("Raio-X de tórax", 25, false, 0, "Sem pneumonia evidente (simulado).", IMG.xray, true)
      ],
      [
        dx("Exacerbação de asma", true, "grave"),
        dx("Pneumonia", false, "grave"),
        dx("Embolia pulmonar", false, "critico"),
        dx("Crise de pânico", false, "grave"),
        dx("Insuficiência cardíaca", false, "critico")
      ],
      [
        med("Broncodilatador inalatório conforme protocolo", true, "baixa"),
        med("Corticoide sistêmico conforme avaliação", true, "media"),
        med("Antibiótico sem sinais de infecção", false, "media"),
        med("Alta imediata com SpO2 baixa e sem melhora", false, "alta")
      ],
      outcome()
    ),

    mkCase("r_gastro", "residente", "Pedro Almeida", 27, "Masculino", IMG.male, "Verde",
      ["PA: 110/72", "FC: 96", "FR: 18", "SpO2: 99%", "Temp: 37,6°C"],
      "Diarreia e vômitos há 1 dia.",
      "Sem sangue nas fezes. Dor abdominal difusa leve. Provável alimento suspeito.",
      [
        q("Sangue nas fezes", "Nega sangue."),
        q("Sinais de desidratação", "Boca seca leve, mas urina presente (simulado)."),
        q("Viagens/antibiótico recente", "Nega.")
      ],
      [
        ex("Laboratório básico", 25, false, 0, "Sem alterações graves. Leve hemoconcentração.", IMG.labs, true)
      ],
      [
        dx("Gastroenterite aguda", true, "leve"),
        dx("Apendicite", false, "grave"),
        dx("Pancreatite", false, "grave"),
        dx("Sepse abdominal", false, "critico"),
        dx("Intoxicação medicamentosa", false, "grave")
      ],
      [
        med("Hidratação oral/venosa conforme necessidade", true, "baixa"),
        med("Antiemético conforme avaliação", true, "baixa"),
        med("Antibiótico sem critérios", false, "media"),
        med("Ignorar sinais de alarme", false, "alta")
      ],
      outcome()
    ),

    mkCase("r_uti_simple", "residente", "Ana Ribeiro", 30, "Feminino", IMG.female, "Verde",
      ["PA: 116/78", "FC: 88", "FR: 16", "SpO2: 99%", "Temp: 37,8°C"],
      "Ardência para urinar e urgência.",
      "Sem dor lombar. Sem vômitos. Sem gestação (simulado).",
      [
        q("Dor lombar", "Nega dor em flanco."),
        q("Febre alta", "Nega febre alta."),
        q("Corrimento", "Nega.")
      ],
      [
        ex("EAS (urina)", 25, true, 10, "Compatível com cistite (simulado).", IMG.labs, false),
        ex("Urocultura", 60, false, 0, "Coletada. Resultado não imediato (simulado).", null, true)
      ],
      [
        dx("Cistite não complicada", true, "leve"),
        dx("Pielonefrite", false, "grave"),
        dx("Cólica renal", false, "grave"),
        dx("Apendicite", false, "grave"),
        dx("IST/DIP", false, "grave")
      ],
      [
        med("Antibiótico conforme diretriz local (sem dose)", true, "media"),
        med("Hidratação e orientações", true, "baixa"),
        med("Alta sem tratar e sem orientações", false, "alta"),
        med("Corticoide sem indicação", false, "media")
      ],
      outcome()
    ),

    // mais 4 residente
    mkCase("r_migraine", "residente", "Beatriz Costa", 24, "Feminino", IMG.female, "Verde",
      ["PA: 120/80", "FC: 84", "FR: 16", "SpO2: 99%", "Temp: 36,6°C"],
      "Cefaleia pulsátil com fotofobia.",
      "História de enxaqueca. Sem déficit neurológico focal (simulado).",
      [q("Aura", "Refere aura visual em episódios anteriores."), q("Sinais de alarme", "Nega rigidez de nuca, febre alta, déficit focal.")],
      [ex("Exame neurológico seriado", 5, true, 10, "Sem déficits focais (simulado).", null, false),
       ex("TC de crânio", 45, false, 0, "Sem hemorragia (simulado).", null, true)],
      [dx("Enxaqueca", true, "leve"), dx("AVC", false, "critico"), dx("Meningite", false, "critico"), dx("Hemorragia subaracnoide", false, "critico")],
      [med("Analgesia/antiemético conforme avaliação", true, "baixa"), med("Alta com sinais de alarme presentes", false, "alta"), med("Antibiótico sem indicação", false, "media")],
      outcome()
    ),

    mkCase("r_sprain", "residente", "Lucas Martins", 17, "Masculino", IMG.male, "Verde",
      ["PA: 118/70", "FC: 90", "FR: 16", "SpO2: 99%", "Temp: 36,7°C"],
      "Entorse de tornozelo após esportes.",
      "Dor e edema leve. Sem deformidade importante (simulado).",
      [q("Capacidade de apoiar", "Consegue apoiar com dor."), q("Trauma grave", "Sem impacto de alta energia.")],
      [ex("Raio-X (regras de Ottawa)", 25, false, 0, "Sem fratura (simulado).", IMG.xray, true)],
      [dx("Entorse de tornozelo", true, "leve"), dx("Fratura instável", false, "grave"), dx("Luxação", false, "grave")],
      [med("Gelo, elevação e imobilização conforme necessidade", true, "baixa"), med("Analgésico conforme avaliação", true, "baixa"), med("Ignorar dor intensa e deformidade", false, "alta")],
      outcome()
    ),

    mkCase("r_otitis", "residente", "Rafael Santos", 10, "Masculino", IMG.male, "Verde",
      ["PA: 100/60", "FC: 98", "FR: 18", "SpO2: 99%", "Temp: 38,1°C"],
      "Dor de ouvido e febre baixa.",
      "Sem rigidez de nuca. Sem vômitos persistentes. (simulado)",
      [q("Secreção", "Sem secreção purulenta evidente."), q("Sintomas respiratórios", "Coriza e tosse leve.")],
      [ex("Otoscopia (simulada)", 5, true, 10, "Membrana hiperemiada compatível (simulado).", null, false)],
      [dx("Otite média aguda", true, "leve"), dx("Meningite", false, "critico"), dx("Pneumonia", false, "grave")],
      [med("Analgesia e acompanhamento", true, "baixa"), med("Antibiótico conforme diretriz local se indicado", true, "media"), med("Alta sem orientar retorno", false, "media")],
      outcome()
    ),

    mkCase("r_dermatitis", "residente", "Paula Nunes", 36, "Feminino", IMG.female, "Verde",
      ["PA: 122/78", "FC: 82", "FR: 16", "SpO2: 99%", "Temp: 36,5°C"],
      "Coceira e placas avermelhadas em mãos.",
      "Contato com produto químico novo. Sem falta de ar.",
      [q("Exposição", "Início após limpeza com produto forte."), q("Sinais sistêmicos", "Nega febre, dispneia, edema de glote.")],
      [ex("Avaliação clínica", 5, true, 10, "Lesão compatível com dermatite de contato (simulado).", null, false)],
      [dx("Dermatite de contato", true, "leve"), dx("Anafilaxia", false, "critico"), dx("Celulite", false, "grave")],
      [med("Evitar irritante e tratamento tópico conforme avaliação", true, "baixa"), med("Adrenalina sem sinais de anafilaxia", false, "alta")],
      outcome()
    ),

    // ===== TITULAR (8) =====
    mkCase("t_appendix", "titular", "Fernanda Lima", 34, "Feminino", IMG.female, "Amarelo",
      ["PA: 118/76", "FC: 98", "FR: 18", "SpO2: 98%", "Temp: 38,0°C"],
      "Dor em fossa ilíaca direita há 12h.",
      "Dor migratória, náuseas e inapetência. Sem cirurgias prévias.",
      [q("Migração da dor", "Começou peri-umbilical e migrou para a direita."), q("Gestação", "Nega atraso importante (simulado).")],
      [ex("Hemograma", 25, true, 15, "Leucocitose com desvio (simulado).", IMG.labs, false),
       ex("USG abdome", 40, true, 20, "Compatível com apendicite (simulado).", null, false),
       ex("TC abdome", 60, false, 0, "Confirma sem perfuração (simulado).", null, true)],
      [dx("Apendicite aguda", true, "grave"), dx("Gastroenterite", false, "grave"), dx("Cólica renal", false, "grave"), dx("DIP", false, "grave"), dx("Cisto ovariano roto", false, "critico")],
      [med("Analgesia/antiemético", true, "baixa"), med("Hidratação venosa se indicado", true, "baixa"), med("Encaminhar cirurgia", true, "baixa"), med("Alta sem investigação", false, "alta")],
      outcome()
    ),

    mkCase("t_pneumonia", "titular", "Roberto Dias", 63, "Masculino", IMG.male, "Amarelo",
      ["PA: 130/78", "FC: 104", "FR: 24", "SpO2: 92%", "Temp: 38,6°C"],
      "Tosse, febre e falta de ar.",
      "Tabagista. Dor pleurítica leve. Escarro amarelado (simulado).",
      [q("Início", "Piora progressiva há 4 dias."), q("Dor torácica", "Dói ao respirar fundo (simulado).")],
      [ex("Raio-X tórax", 25, true, 15, "Infiltrado compatível (simulado).", IMG.xray, false),
       ex("Laboratório básico", 25, false, 0, "Inflamação aumentada (simulado).", IMG.labs, false),
       ex("Gasometria", 20, false, 0, "Hipoxemia (simulado).", null, false)],
      [dx("Pneumonia comunitária", true, "grave"), dx("Asma", false, "grave"), dx("Embolia pulmonar", false, "critico"), dx("Insuficiência cardíaca", false, "critico"), dx("Gripe", false, "leve")],
      [med("Antibiótico conforme protocolo (sem dose)", true, "media"), med("Oxigênio se indicado", true, "baixa"), med("Alta com SpO2 baixa sem plano", false, "alta"), med("Anticoagulação sem indicação", false, "alta")],
      outcome()
    ),

    mkCase("t_kidney_stone", "titular", "Eduardo Rocha", 41, "Masculino", IMG.male, "Amarelo",
      ["PA: 140/88", "FC: 102", "FR: 18", "SpO2: 99%", "Temp: 37,2°C"],
      "Dor intensa em flanco com irradiação para virilha.",
      "Sem febre alta. Náuseas. Hematúria (simulada).",
      [q("Hematúria", "Urina escura/rosada (simulado)."), q("Febre", "Nega febre alta.")],
      [ex("EAS (urina)", 25, true, 15, "Hematúria compatível (simulado).", IMG.labs, false),
       ex("TC sem contraste (se disponível)", 60, false, 0, "Sugere cálculo (simulado).", null, false),
       ex("USG", 40, false, 0, "Hidronefrose leve (simulado).", null, false)],
      [dx("Cólica renal (litíase)", true, "grave"), dx("Apendicite", false, "grave"), dx("Aneurisma dissecante", false, "critico"), dx("Pielonefrite", false, "grave")],
      [med("Analgesia adequada", true, "baixa"), med("Hidratação conforme avaliação", true, "baixa"), med("Antibiótico sem sinais infecciosos", false, "media"), med("Alta sem controle de dor", false, "alta")],
      outcome()
    ),

    mkCase("t_dka", "titular", "Luciano Melo", 29, "Masculino", IMG.male, "Vermelho",
      ["PA: 92/60", "FC: 124", "FR: 28", "SpO2: 98%", "Temp: 37,0°C"],
      "Poliúria, vômitos e respiração ofegante.",
      "Diabetes tipo 1. Sinais de desidratação e hálito cetônico (simulado).",
      [q("Adesão à insulina", "Falhou doses recentes (simulado)."), q("Dor abdominal", "Dor difusa (simulado).")],
      [ex("Glicemia capilar", 5, true, 20, "Muito elevada (simulado).", null, false),
       ex("Gasometria", 20, true, 20, "Acidose metabólica (simulado).", null, false),
       ex("Cetonas", 20, true, 10, "Cetose positiva (simulado).", IMG.labs, false),
       ex("Laboratório (eletrólitos)", 25, true, 10, "Distúrbios eletrolíticos (simulado).", IMG.labs, false)],
      [dx("Cetoacidose diabética", true, "critico"), dx("Gastroenterite", false, "grave"), dx("Sepse", false, "critico"), dx("Crise de pânico", false, "grave")],
      [med("Fluidoterapia e correções conforme protocolo", true, "media"), med("Insulina conforme protocolo e monitorização", true, "media"),
       med("Alta domiciliar", false, "alta"), med("Apenas antiemético e observar", false, "alta")],
      outcome()
    ),

    // mais 4 titular
    mkCase("t_head_injury", "titular", "Gustavo Lima", 37, "Masculino", IMG.male, "Amarelo",
      ["PA: 128/80", "FC: 88", "FR: 16", "SpO2: 99%", "Temp: 36,6°C"],
      "Trauma craniano leve após queda.",
      "Cefaleia e náusea leve. Sem perda prolongada de consciência (simulado).",
      [q("Perda de consciência", "Breve, segundos (simulado)."), q("Anticoagulantes", "Nega uso.")],
      [ex("Avaliação neurológica seriada", 10, true, 10, "Sem déficit focal (simulado).", null, false),
       ex("TC crânio (se indicado)", 45, false, 0, "Sem hemorragia (simulado).", null, true)],
      [dx("Concussão/trauma leve", true, "grave"), dx("Hemorragia intracraniana", false, "critico"), dx("AVC", false, "critico")],
      [med("Observação e orientações de retorno", true, "baixa"), med("Alta sem orientar sinais de alarme", false, "alta")],
      outcome()
    ),

    mkCase("t_cholecystitis", "titular", "Sônia Andrade", 52, "Feminino", IMG.female, "Amarelo",
      ["PA: 136/84", "FC: 102", "FR: 18", "SpO2: 98%", "Temp: 38,2°C"],
      "Dor em hipocôndrio direito pós gordura.",
      "Náuseas. Sinal de Murphy (simulado).",
      [q("Icterícia", "Nega icterícia evidente (simulado)."), q("Vômitos", "Vômitos ocasionais.")],
      [ex("USG abdome", 40, true, 20, "Compatível com colecistite (simulado).", null, false),
       ex("Laboratório", 25, false, 0, "Inflamação aumentada (simulado).", IMG.labs, false)],
      [dx("Colecistite aguda", true, "grave"), dx("Gastrite", false, "leve"), dx("Pancreatite", false, "grave"), dx("Apendicite", false, "grave")],
      [med("Analgesia/antiemético", true, "baixa"), med("Antibiótico conforme protocolo (sem dose)", true, "media"), med("Encaminhar cirurgia/observação", true, "baixa"), med("Alta sem investigação", false, "alta")],
      outcome()
    ),

    mkCase("t_stroke", "titular", "Alberto Souza", 71, "Masculino", IMG.male, "Vermelho",
      ["PA: 190/100", "FC: 96", "FR: 20", "SpO2: 96%", "Temp: 36,7°C"],
      "Fraqueza súbita em um lado e fala enrolada.",
      "Início há 1 hora. HAS. (simulado)",
      [q("Tempo de início", "Há ~60 minutos."), q("Anticoagulante", "Uso desconhecido (simulado).")],
      [ex("Glicemia capilar", 5, true, 20, "Normal (simulado).", null, false),
       ex("TC crânio sem contraste", 45, true, 25, "Sem hemorragia (simulado).", null, false),
       ex("Laboratório básico", 25, false, 0, "Sem alterações críticas (simulado).", IMG.labs, false)],
      [dx("AVC isquêmico agudo", true, "critico"), dx("AVC hemorrágico", false, "critico"), dx("Crise de pânico", false, "grave"), dx("Hipoglicemia", false, "grave")],
      [med("Acionar protocolo AVC/tempo-dependente", true, "media"), med("Monitorização e suporte", true, "baixa"), med("Alta domiciliar", false, "alta"), med("Sedação sem avaliação", false, "alta")],
      outcome()
    ),

    // ===== PLENO (8) =====
    mkCase("p_stemi", "pleno", "Carlos Silva", 58, "Masculino", IMG.male, "Vermelho",
      ["PA: 90/60", "FC: 112", "FR: 24", "SpO2: 92%", "Temp: 36,7°C"],
      "Dor torácica intensa em aperto há 1 hora.",
      "Irradia para braço esquerdo, sudorese e náuseas. HAS e tabagismo.",
      [q("Irradiação", "Braço esquerdo e mandíbula (simulado)."), q("Uso de cocaína", "Nega.")],
      [ex("ECG", 5, true, 35, "Supradesnivelamento de ST (simulado).", null, false),
       ex("Troponina", 30, false, 10, "Elevada (simulado).", null, false),
       ex("Raio-X tórax", 25, false, 0, "Sem congestão importante (simulado).", IMG.xray, true)],
      [dx("IAM com supra de ST", true, "critico"), dx("Angina instável", false, "grave"), dx("Dissecção de aorta", false, "critico"), dx("Embolia pulmonar", false, "critico")],
      [med("Antiagregante/anticoagulação conforme protocolo", true, "media"),
       med("Analgesia e suporte", true, "baixa"),
       med("Alta imediata", false, "alta"),
       med("Apenas antiácido", false, "alta")],
      outcome()
    ),

    mkCase("p_sepsis", "pleno", "Luciana Barbosa", 47, "Feminino", IMG.female, "Vermelho",
      ["PA: 82/54", "FC: 128", "FR: 28", "SpO2: 93%", "Temp: 39,4°C"],
      "Febre alta, confusão e hipotensão.",
      "Diabetes. Disúria dias antes. Piora rápida (simulado).",
      [q("Foco urinário", "Disúria/urgência (simulado)."), q("Consciência", "Sonolenta/confusa (simulado).")],
      [ex("Lactato", 20, true, 20, "Elevado (simulado).", IMG.labs, false),
       ex("Hemoculturas", 40, true, 10, "Coletadas (simulado).", null, false),
       ex("Urina (EAS/urocultura)", 35, true, 10, "Sugere ITU complicada (simulado).", IMG.labs, false),
       ex("Ressonância", 120, false, 0, "Exame demorado e pouco útil inicialmente (simulado).", IMG.mri, true)],
      [dx("Sepse grave provável foco urinário", true, "critico"), dx("Desidratação leve", false, "critico"), dx("Gastroenterite", false, "grave")],
      [med("Antibiótico de amplo espectro conforme protocolo", true, "media"),
       med("Fluidoterapia e suporte hemodinâmico", true, "media"),
       med("Aguardar exames por horas sem tratar", false, "alta"),
       med("Alta domiciliar", false, "alta")],
      outcome()
    ),

    // mais 6 pleno
    mkCase("p_pe", "pleno", "Helena Prado", 55, "Feminino", IMG.female, "Vermelho",
      ["PA: 96/60", "FC: 122", "FR: 30", "SpO2: 88%", "Temp: 36,8°C"],
      "Dispneia súbita e dor pleurítica.",
      "Imobilização recente. Taquicardia e hipoxemia (simulado).",
      [q("Cirurgia/imobilização", "Sim, imobilizada há semanas."), q("Hemoptise", "Nega (simulado).")],
      [ex("Gasometria", 20, true, 15, "Hipoxemia importante (simulado).", null, false),
       ex("D-dímero", 40, false, 0, "Elevado (simulado).", IMG.labs, false),
       ex("Angio-TC (se disponível)", 70, true, 25, "Compatível com TEP (simulado).", null, false)],
      [dx("Tromboembolismo pulmonar", true, "critico"), dx("Pneumonia", false, "grave"), dx("Asma", false, "grave"), dx("Crise de pânico", false, "grave")],
      [med("Oxigênio e suporte", true, "media"), med("Anticoagulação conforme protocolo", true, "media"),
       med("Alta sem investigação", false, "alta"), med("Sedação e liberar", false, "alta")],
      outcome()
    ),

    mkCase("p_meningitis", "pleno", "Thiago Lopes", 28, "Masculino", IMG.male, "Vermelho",
      ["PA: 110/70", "FC: 118", "FR: 22", "SpO2: 97%", "Temp: 39,2°C"],
      "Febre alta, rigidez de nuca e confusão.",
      "Cefaleia intensa. Fotofobia (simulado).",
      [q("Manchas na pele", "Sem púrpura evidente (simulado)."), q("Convulsão", "Nega convulsão.")],
      [ex("Avaliação neurológica", 10, true, 20, "Sinais meníngeos presentes (simulado).", null, false),
       ex("Laboratório básico", 25, false, 0, "Inflamação aumentada (simulado).", IMG.labs, false),
       ex("TC crânio (se indicado)", 45, false, 0, "Sem massa evidente (simulado).", null, true)],
      [dx("Meningite aguda", true, "critico"), dx("Enxaqueca", false, "grave"), dx("Sinusite", false, "grave"), dx("AVC", false, "critico")],
      [med("Antibiótico/antiviral conforme protocolo hospitalar", true, "media"),
       med("Isolamento e suporte", true, "media"),
       med("Alta domiciliar", false, "alta")],
      outcome()
    ),

    mkCase("p_gi_bleed", "pleno", "Sérgio Ramos", 66, "Masculino", IMG.male, "Vermelho",
      ["PA: 88/56", "FC: 130", "FR: 24", "SpO2: 95%", "Temp: 36,4°C"],
      "Vômito com sangue e tontura.",
      "História de uso de anti-inflamatórios. Melena (simulada).",
      [q("Melena", "Fezes escuras (simulado)."), q("Uso de AINE", "Uso frequente (simulado).")],
      [ex("Hemograma", 25, true, 20, "Anemia/queda de Hb (simulado).", IMG.labs, false),
       ex("Tipagem e prova cruzada", 30, true, 20, "Preparar hemocomponentes (simulado).", IMG.labs, false)],
      [dx("Hemorragia digestiva alta", true, "critico"), dx("Gastroenterite", false, "grave"), dx("Pancreatite", false, "grave")],
      [med("Acesso venoso, reposição e protocolo HDA", true, "media"),
       med("Solicitar endoscopia conforme fluxo", true, "media"),
       med("Alta domiciliar", false, "alta")],
      outcome()
    ),

    mkCase("p_anaphylaxis", "pleno", "Camila Torres", 33, "Feminino", IMG.female, "Vermelho",
      ["PA: 80/50", "FC: 132", "FR: 30", "SpO2: 90%", "Temp: 36,8°C"],
      "Urticária, falta de ar e inchaço após alimento.",
      "Início súbito, rouquidão e hipotensão (simulado).",
      [q("Gatilho", "Alimento novo (simulado)."), q("Edema de glote", "Rouquidão e sensação de garganta fechando (simulado).")],
      [ex("Monitorização", 5, true, 30, "Instabilidade (simulado).", null, false)],
      [dx("Anafilaxia", true, "critico"), dx("Crise de pânico", false, "grave"), dx("Asma isolada", false, "grave")],
      [med("Adrenalina conforme protocolo e via adequada", true, "media"),
       med("Suporte de vias aéreas/oxigênio e fluidos", true, "media"),
       med("Aguardar sem intervir", false, "alta")],
      outcome()
    ),

    mkCase("p_pancreatitis", "pleno", "Ricardo Mota", 49, "Masculino", IMG.male, "Vermelho",
      ["PA: 100/64", "FC: 118", "FR: 22", "SpO2: 96%", "Temp: 38,1°C"],
      "Dor epigástrica intensa irradiando para dorso.",
      "Náuseas. História de álcool. (simulado)",
      [q("Álcool", "Consumo frequente (simulado)."), q("Gordura/colelitíase", "História sugestiva (simulado).")],
      [ex("Amilase/lipase", 30, true, 20, "Elevadas (simulado).", IMG.labs, false),
       ex("USG abdome", 40, false, 0, "Pode sugerir causa biliar (simulado).", null, false)],
      [dx("Pancreatite aguda", true, "critico"), dx("Gastrite", false, "grave"), dx("IAM", false, "critico")],
      [med("Hidratação, analgesia e suporte", true, "media"),
       med("Alta domiciliar imediata", false, "alta")],
      outcome()
    ),
  ];

  // ===== Builders =====
  function q(label, answer){ return { label, answer }; }
  function ex(label, time, essential, penaltyIfSkipped, result, image, unnecessary){
    return { id: label.toLowerCase().slice(0,18) + "_" + time, label, time, essential, penaltyIfSkipped, result, image, unnecessary: !!unnecessary };
  }
  function dx(label, correct, severity){ return { label, correct, severity }; }
  function med(label, correct, risk){ return { label, correct, risk }; }
  function outcome(){
    return {
      success:"Conduta adequada. Evolução favorável (simulado).",
      partial:"Você acertou parcialmente, mas houve atraso/conduta incompleta (simulado).",
      fail:"Conduta inadequada para o cenário. Aumenta risco de complicações (simulado).",
      death:"Óbito evitável por atraso/erro crítico (simulado)."
    };
  }
  function mkCase(id, tier, name, age, sex, photo, triage, vitals, complaint, history, questions, exams, diagnosis, meds, out){
    return { id, tier, patient:{ name, age, sex, photo, triage }, vitals, complaint, history, questions, exams, diagnosis, meds, outcome: out };
  }

  // ===== Tier selection =====
  function allowedTier(){
    const r = computeRank(state.score || 0);
    if (r === "Médico Residente") return "residente";
    if (r === "Médico Titular") return "titular";
    return "pleno";
  }

  function pickCase(){
    const tier = allowedTier();
    const pool = CASES.filter(c => c.tier === tier);
    // fallback
    const finalPool = pool.length ? pool : CASES;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  }

  // ===== Render case =====
  function renderCase(c){
    state.currentCaseId = c.id;
    state.usedExams = [];
    state.usedQuestions = [];

    patientPhoto.src = c.patient.photo;
    patientName.textContent = c.patient.name;
    patientDemo.textContent = `${c.patient.age} anos • ${c.patient.sex}`;
    patientTriage.textContent = c.patient.triage;
    patientComplaint.textContent = c.complaint;
    patientHistory.textContent = c.history;
    vitalsEl.innerHTML = c.vitals.map(v => `<div>• ${v}</div>`).join("");

    // perguntas
    questionsEl.innerHTML = "";
    qaEl.textContent = "Selecione uma pergunta para ver a resposta.";
    c.questions.forEach((qq, idx) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = qq.label;
      b.addEventListener("click", () => {
        state.usedQuestions.push(idx);
        b.classList.add("used");
        qaEl.textContent = qq.answer;
      });
      questionsEl.appendChild(b);
    });

    // exames
    examsEl.innerHTML = "";
    examResultsEl.textContent = "Solicite exames para ver resultados.";
    c.exams.forEach((exm) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = `${exm.label} • ${exm.time} min`;
      b.addEventListener("click", () => {
        if (!state.usedExams.includes(exm.id)) state.usedExams.push(exm.id);
        b.classList.add("used");

        let html = `<div><strong>${exm.label}</strong> — ${exm.result}</div>`;
        if (exm.image) html += `<img class="exam-image" src="${exm.image}" alt="${exm.label}">`;
        examResultsEl.innerHTML = html;
      });
      examsEl.appendChild(b);
    });

    // diagnóstico (radio)
    diagnosisEl.innerHTML = "";
    c.diagnosis.forEach((d, i) => {
      const row = document.createElement("div");
      row.className = "opt";
      row.innerHTML = `
        <input type="radio" id="dx_${i}" name="dx" value="${i}">
        <label for="dx_${i}">
          <strong>${d.label}</strong>
          <small>Diferencial (simulado)</small>
        </label>
      `;
      diagnosisEl.appendChild(row);
    });

    // condutas (checkbox)
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

  function finishCase(){
    const c = CASES.find(x => x.id === state.currentCaseId);
    if (!c) return;

    const selectedDx = qs('input[name="dx"]:checked');
    if (!selectedDx){
      alert("Selecione um diagnóstico.");
      return;
    }
    const dxPick = c.diagnosis[Number(selectedDx.value)];
    const medChecks = qsa('#medications input[type="checkbox"]:checked');
    const medsChosen = medChecks.map(ch => c.meds[Number(ch.value)]);

    let delta = 0;
    let flags = { death:false };

    // Diagnóstico
    if (dxPick.correct){
      delta += c.tier === "pleno" ? 140 : (c.tier === "titular" ? 95 : 60);
      state.hits += 1;
    } else {
      delta -= severityPenalty(dxPick.severity);
      state.errors += 1;
    }

    // Exames
    c.exams.forEach(exm => {
      const used = state.usedExams.includes(exm.id);
      if (exm.essential && used) delta += 10;
      if (exm.essential && !used) delta -= (exm.penaltyIfSkipped || 0);
      if (used && exm.unnecessary) delta -= 10;
    });

    // Condutas
    medsChosen.forEach(m => {
      if (m.correct) delta += 12;
      else delta -= medPenalty(m.risk);
    });

    // Óbito evitável (regra determinística em casos vermelhos + grande erro)
    const red = c.patient.triage === "Vermelho";
    const wrongHighRisk = medsChosen.some(m => !m.correct && m.risk === "alta");
    if (red && !dxPick.correct && (wrongHighRisk || delta <= -80)){
      flags.death = true;
      state.deaths += 1;
    }

    state.score += delta;
    state.casesResolved += 1;
    state.rank = computeRank(state.score);
    saveGame();
    updateHUD();

    // Resultado
    let summary, detail;
    if (flags.death){
      summary = "Óbito evitável";
      detail = c.outcome.death;
    } else if (dxPick.correct && delta >= 70){
      summary = "Atendimento bem-sucedido";
      detail = c.outcome.success;
    } else if (dxPick.correct || delta > 0){
      summary = "Atendimento parcialmente correto";
      detail = c.outcome.partial;
    } else {
      summary = "Atendimento inadequado";
      detail = c.outcome.fail;
    }

    resultSummary.textContent = summary;
    resultDetail.textContent = detail;
    resultScore.textContent = `Caso: ${delta >= 0 ? "+" : ""}${delta} | Total: ${state.score} | Rank: ${state.rank}`;
    showScreen("screen-result");
  }

  // ===== Events =====
  // Avatar select
  let selectedAvatar = null;
  avatarGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".avatar-card");
    if (!btn) return;
    qsa(".avatar-card").forEach(x => x.classList.remove("selected"));
    btn.classList.add("selected");
    selectedAvatar = btn.getAttribute("data-avatar");
  });

  btnNew.addEventListener("click", () => {
    requestFullscreen();
    resetGame();
    updateContinueButton();
    showScreen("screen-profile");
  });

  btnContinue.addEventListener("click", () => {
    requestFullscreen();
    if (loadGame()){
      updateHUD();
      showScreen("screen-office");
    } else {
      alert("Nenhum save encontrado.");
    }
  });

  btnProfileNext.addEventListener("click", () => {
    requestFullscreen();
    const name = inputName.value.trim();
    if (!name){ alert("Digite seu nome."); return; }
    if (!selectedAvatar){ alert("Selecione um avatar."); return; }

    state.name = name;
    state.avatar = selectedAvatar;
    saveGame();
    updateContinueButton();

    const msg =
`Bem-vindo(a), ${state.name}.

Temos emergências chegando continuamente. Seu objetivo é:
- coletar dados clínicos (perguntas + vitais)
- solicitar exames coerentes
- escolher diagnóstico e conduta

Casos ficam mais difíceis conforme você sobe de rank.
Assuma seu posto no consultório agora.`;

    typewriter(briefingText, msg, 14);
    showScreen("screen-briefing");
  });

  btnGoOffice.addEventListener("click", () => {
    requestFullscreen();
    updateHUD();
    showScreen("screen-office");
  });

  btnNextCase.addEventListener("click", () => {
    const c = pickCase();
    renderCase(c);
    showScreen("screen-case");
  });

  btnBackOffice.addEventListener("click", () => showScreen("screen-office"));
  btnFinish.addEventListener("click", finishCase);
  btnResultOffice.addEventListener("click", () => showScreen("screen-office"));

  btnSave.addEventListener("click", () => {
    saveGame();
    alert("Jogo salvo.");
  });

  btnReset.addEventListener("click", () => {
    if (confirm("Resetar o jogo apagará seu progresso. Continuar?")){
      resetGame();
      updateContinueButton();
      showScreen("screen-start");
    }
  });

  // ===== Init =====
  updateContinueButton();
})();
