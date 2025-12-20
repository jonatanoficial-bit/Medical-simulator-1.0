// script.js
// Este módulo implementa a lógica principal do simulador, a camada de apresentação e a camada de dados.

class CaseRepository {
  constructor(cases) {
    this.cases = cases;
    this.usedCases = [];
  }

  /**
   * Retorna um caso aleatório e marca como usado (para evitar repetição imediata).
   */
  getRandomCase() {
    if (this.cases.length === 0) return null;
    // Se esgotou todos, recicla
    if (this.usedCases.length === this.cases.length) {
      this.usedCases = [];
    }
    let caseCandidate;
    do {
      const index = Math.floor(Math.random() * this.cases.length);
      caseCandidate = this.cases[index];
    } while (this.usedCases.includes(caseCandidate.id));
    this.usedCases.push(caseCandidate.id);
    return JSON.parse(JSON.stringify(caseCandidate)); // retorna cópia profunda
  }
}

class GameEngine {
  constructor(config, caseRepo, ui) {
    this.config = config;
    this.caseRepo = caseRepo;
    this.ui = ui;
    this.currentLevel = config.initialLevel;
    this.score = 0;
    this.errorCount = 0;
    // Contadores separados de casos corretos e incorretos para estatísticas no consultório
    this.correctCases = 0;
    this.incorrectCases = 0;
    this.patients = [];
    this.activePatientId = null;
    this.player = { name: '', avatarIndex: 0 };
    this.newPatientInterval = null;
    this.tickInterval = null;
    // Contador de casos atendidos para estatísticas (inclui corretos e erros)
    this.casesAttended = 0;
  }

  setPlayer(name, avatarIndex) {
    this.player.name = name;
    this.player.avatarIndex = avatarIndex;
  }

  start() {
    // Inicializa variáveis de jogo
    this.patients = [];
    this.score = 0;
    this.errorCount = 0;
    this.casesAttended = 0;
    this.correctCases = 0;
    this.incorrectCases = 0;
    this.activePatientId = null;
    this.currentLevel = this.config.initialLevel;
    this.ui.updateLevel(this.currentLevel);
    this.ui.updateScore(this.score);
    // Inicia timers
    this.spawnPatient();
    // Intervalo para criar novos pacientes
    if (this.newPatientInterval) clearInterval(this.newPatientInterval);
    this.newPatientInterval = setInterval(() => {
      if (this.patients.length < this.config.maxSimultaneousPatients) {
        this.spawnPatient();
      }
    }, this.config.newPatientIntervalSeconds * 1000);
    // Intervalo de atualização de timers
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => {
      this.updatePatients();
    }, 1000);
  }

  spawnPatient() {
    const newCase = this.caseRepo.getRandomCase();
    if (!newCase) return;
    // Define paciente interno
    const patient = {
      id: Date.now() + Math.random(),
      case: newCase,
      status: 'Estável',
      deteriorationTimer: 60, // segundos até piorar; pode ser ajustado posteriormente
      actionsPerformed: new Set(),
      diagnosisMade: false,
      arrivedAt: new Date()
    };

    // Copia sinais vitais iniciais do caso para o paciente. Cada paciente possui um objeto
    // vitals com números para facilitar a atualização dinâmica.  Se o caso não tiver
    // definição explícita, utiliza valores padrão.
    patient.vitals = {
      pressaoSys: newCase.vitals?.pressaoSys ?? 120,
      pressaoDia: newCase.vitals?.pressaoDia ?? 80,
      freq: newCase.vitals?.freq ?? 80,
      saturacao: newCase.vitals?.saturacao ?? 98,
      temperatura: newCase.vitals?.temperatura ?? 37.0
    };
    // Para simular deterioração, definimos incrementos de alteração por segundo.  Esses valores
    // podem ser ajustados para cada caso, mas por padrão aceleram a frequência e reduzem a saturação.
    patient.vitalDeltas = {
      pressaoSys: -0.1,
      pressaoDia: -0.05,
      freq: 0.5,
      saturacao: -0.2,
      temperatura: 0.0
    };
    // Lista de efeitos de tratamento ativos. Cada efeito tem chave, início e duração e um mapa de alterações
    // aplicadas aos vitais.
    patient.treatmentEffects = [];
    this.patients.push(patient);
    this.ui.renderPatientQueue(this.patients, this.activePatientId);
  }

  updatePatients() {
    // Atualiza temporizadores e status
    for (const patient of this.patients) {
      if (!patient.diagnosisMade) {
        // Atualiza sinais vitais dinâmicos
        this.updateVitalsForPatient(patient);
        // Atualiza timer de deterioração para mudanças abruptas de status
        patient.deteriorationTimer--;
        if (patient.deteriorationTimer <= 0) {
          if (patient.status === 'Estável') {
            patient.status = 'Instável';
            patient.deteriorationTimer = 30;
            this.ui.showNotification(`Paciente ${patient.case.name} piorou para instável!`);
          } else if (patient.status === 'Instável') {
            patient.status = 'Crítico';
            patient.deteriorationTimer = 20;
            this.ui.showNotification(`Paciente ${patient.case.name} piorou para crítico!`);
          } else if (patient.status === 'Crítico') {
            // Paciente morre
            patient.status = 'Óbito';
            patient.diagnosisMade = true;
            this.ui.showNotification(`Paciente ${patient.case.name} evoluiu a óbito por falta de atendimento!`);
            this.handlePatientDeath(patient);
          }
        }
      }
    }
    this.ui.renderPatientQueue(this.patients, this.activePatientId);
  }

  /**
   * Atualiza os sinais vitais de um paciente a cada tick. Os vitais se deterioram
   * gradualmente ao longo do tempo conforme definido em patient.vitalDeltas. Efeitos
   * de tratamentos podem reduzir ou aumentar determinados vitais por um período
   * definido. Se valores extremos forem atingidos, o status do paciente pode
   * mudar independentemente do timer de deterioração.
   * @param {Object} patient Paciente a ser atualizado
   */
  updateVitalsForPatient(patient) {
    if (!patient.vitals) return;
    // Aplica alterações base de deterioração
    for (const key in patient.vitalDeltas) {
      patient.vitals[key] += patient.vitalDeltas[key];
    }
    // Aplica efeitos de tratamentos ativos e remove expirados
    const now = Date.now();
    patient.treatmentEffects = patient.treatmentEffects.filter(effect => {
      const elapsed = (now - effect.startTime) / 1000;
      if (elapsed > effect.duration) {
        return false; // remove expirado
      }
      // aplica o efeito aos vitais
      for (const k in effect.effect) {
        patient.vitals[k] += effect.effect[k];
      }
      return true;
    });
    // Limita valores dentro de faixas fisiológicas plausíveis
    patient.vitals.pressaoSys = Math.max(60, Math.min(200, patient.vitals.pressaoSys));
    patient.vitals.pressaoDia = Math.max(40, Math.min(120, patient.vitals.pressaoDia));
    patient.vitals.freq = Math.max(40, Math.min(200, patient.vitals.freq));
    patient.vitals.saturacao = Math.max(50, Math.min(100, patient.vitals.saturacao));
    patient.vitals.temperatura = Math.max(34, Math.min(41, patient.vitals.temperatura));
    // Atualiza status baseado em valores críticos
    if (patient.status !== 'Óbito') {
      if (patient.vitals.saturacao < 75 || patient.vitals.freq > 180 || patient.vitals.pressaoSys < 80) {
        patient.status = 'Crítico';
      } else if (patient.vitals.saturacao < 88 || patient.vitals.freq > 130 || patient.vitals.pressaoSys < 90) {
        if (patient.status === 'Estável') patient.status = 'Instável';
      }
    }
    // Atualiza display de vitais na UI
    this.ui.updateVitalsDisplay(patient);
  }

  selectPatient(patientId) {
    this.activePatientId = patientId;
    const patient = this.patients.find(p => p.id === patientId);
    this.ui.renderPatientDetails(patient, this);
    this.ui.renderPatientQueue(this.patients, this.activePatientId);
  }

  performAction(patientId, actionKey) {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient || patient.diagnosisMade) return;
    patient.actionsPerformed.add(actionKey);
    // Dependendo da ação, atualizar UI ou lógica
    switch (actionKey) {
      case 'history':
        this.ui.displayHistory(patient.case.history);
        break;
      case 'exam':
        // Exibe exame físico detalhado por sistemas se disponível
        const findings = patient.case.examDetails || patient.case.examFindings;
        this.ui.displayExam(findings);
        break;
      case 'test_ecg':
        this.ui.displayTest('ECG', patient.case.tests.ecg);
        break;
      case 'test_blood':
        // combinar múltiplos possíveis campos: troponina/dDimero/hemograma
        const bloodResults = [];
        ['troponina', 'dDimero', 'hemograma'].forEach(key => {
          if (patient.case.tests[key]) bloodResults.push(`${key}: ${patient.case.tests[key]}`);
        });
        this.ui.displayTest('Exames de sangue', bloodResults.join('<br/>') || 'Sem dados');
        break;
      case 'test_imagem':
        // mostrar primeira imagem disponível
        const imageKeys = ['raiox', 'angioTC', 'ultrassom', 'tomografia'];
        const imgResults = [];
        imageKeys.forEach(key => {
          if (patient.case.tests[key]) imgResults.push(`${key}: ${patient.case.tests[key]}`);
        });
        this.ui.displayTest('Exames de imagem', imgResults.join('<br/>') || 'Sem dados');
        break;
      case 'admin_asa':
        this.ui.displayTreatment('Ácido Acetilsalicílico administrado.');
        // Efeito do ASA: reduz frequência cardíaca e melhora saturação levemente por 15s
        patient.treatmentEffects.push({
          key: 'asa', startTime: Date.now(), duration: 15,
          effect: { freq: -1.5, saturacao: 0.5 }
        });
        break;
      case 'admin_anticoagulante':
        this.ui.displayTreatment('Heparina/anticoagulante administrado.');
        // Anticoagulante: reduz frequência cardíaca moderadamente por 20s
        patient.treatmentEffects.push({
          key: 'anticoagulante', startTime: Date.now(), duration: 20,
          effect: { freq: -1.0 }
        });
        break;
      case 'admin_antibiotico':
        this.ui.displayTreatment('Antibiótico administrado.');
        // Antibiótico: reduz febre/temperatura gradualmente por 30s
        patient.treatmentEffects.push({
          key: 'antibiotico', startTime: Date.now(), duration: 30,
          effect: { temperatura: -0.05 }
        });
        break;
      case 'admin_oxigenio':
        this.ui.displayTreatment('Oxigênio suplementar administrado.');
        // Oxigênio: aumenta saturação rapidamente por 10s
        patient.treatmentEffects.push({
          key: 'oxigenio', startTime: Date.now(), duration: 10,
          effect: { saturacao: 1.0 }
        });
        break;
      case 'refer_cirurgia':
        this.ui.displayTreatment('Paciente encaminhado para cirurgia.');
        break;

      case 'admin_soro':
        patient.physiology.applyTreatment('fluid_bolus', { startIn: 0, duration: 15, effect: { pressao: 3, fc: -1 } });
        this.ui.displayTreatment('Soro EV administrado (bolus). Pode melhorar perfusão em alguns quadros.');
        break;
      case 'admin_antiemetico':
        this.ui.displayTreatment('Antiemético administrado. Sintomas de náusea/vômitos podem aliviar.');
        break;
      case 'admin_analgesico':
        this.ui.displayTreatment('Analgésico administrado. Dor pode reduzir ao longo do tempo.');
        break;
      case 'admin_antitermico':
        patient.physiology.applyTreatment('antipyretic', { startIn: 5, duration: 20, effect: { temperatura: -0.5 } });
        this.ui.displayTreatment('Antitérmico administrado. Febre tende a reduzir após alguns minutos.');
        break;
      case 'admin_antibiotico_ev':
        patient.physiology.applyTreatment('antibiotic', { startIn: 10, duration: 60, effect: { temperatura: -0.3, pressao: 1 } });
        this.ui.displayTreatment('Antibiótico EV iniciado. Efeito clínico é gradual.');
        break;
      case 'admin_adrenalina':
        patient.physiology.applyTreatment('epinephrine', { startIn: 0, duration: 5, effect: { pressao: 6, fc: 8, saturacao: 0.5 } });
        this.ui.displayTreatment('Adrenalina administrada. Use em contextos apropriados (anafilaxia/PCR).');
        break;
      case 'admin_corticoide':
        patient.physiology.applyTreatment('steroid', { startIn: 10, duration: 60, effect: { saturacao: 0.3 } });
        this.ui.displayTreatment('Corticoide administrado. Resposta costuma ser gradual.');
        break;
      case 'admin_broncodilatador':
        patient.physiology.applyTreatment('bronchodilator', { startIn: 2, duration: 30, effect: { saturacao: 0.8, fc: 2 } });
        this.ui.displayTreatment('Broncodilatador administrado. Pode melhorar dispneia e saturação.');
        break;
      case 'admin_diuretico':
        patient.physiology.applyTreatment('diuretic', { startIn: 10, duration: 45, effect: { saturacao: 0.6, pressao: -1 } });
        this.ui.displayTreatment('Diurético administrado. Útil em congestão, mas pode reduzir PA.');
        break;
      case 'admin_dextrose':
        this.ui.displayTreatment('Glicose EV administrada. Útil em hipoglicemia.');
        break;
      case 'presc_analgesico':
      case 'presc_antiinflamatorio':
      case 'presc_antibiotico_oral':
      case 'presc_antiacido':
      case 'presc_antiemetico':
      case 'presc_broncodilatador':
      case 'presc_antihipertensivo':
      case 'presc_antialergico':
      case 'presc_hidratacao_oral':
      case 'presc_orientacoes':
        this.ui.displayTreatment('Prescrição/orientações registradas para alta/seguimento.');
        break;
      case 'proc_acesso_venoso':
        this.ui.displayTreatment('Acesso venoso realizado.');
        break;
      case 'proc_ecg':
        // ECG também está disponível em "Outros" nos exames; aqui apenas registra como procedimento.
        this.ui.displayTreatment('ECG realizado/solicitado.');
        break;
      case 'proc_nebulizacao':
        patient.physiology.applyTreatment('nebulization', { startIn: 0, duration: 20, effect: { saturacao: 0.6, fc: 2 } });
        this.ui.displayTreatment('Nebulização realizada.');
        break;
      case 'proc_imobilizacao':
        this.ui.displayTreatment('Imobilização realizada.');
        break;
      case 'proc_sutura':
        this.ui.displayTreatment('Sutura realizada.');
        break;
      case 'proc_cateter':
        this.ui.displayTreatment('Cateter vesical realizado.');
        break;
      case 'proc_intubacao':
        patient.physiology.applyTreatment('intubation', { startIn: 0, duration: 60, effect: { saturacao: 2.0 } });
        this.ui.displayTreatment('Intubação realizada. Saturação tende a melhorar se indicado.');
        break;
      case 'proc_cpr':
        this.ui.displayTreatment('RCP iniciada (sequência de ações avançadas pode ser expandida em próximas etapas).');
        break;
      case 'proc_desfibrilacao':
        this.ui.displayTreatment('Desfibrilação realizada (quando indicado).');
        break;
      case 'proc_oximetria':
        this.ui.displayTreatment('Monitorização intensificada.');
        break;
      case 'proc_encaminhar':
        this.ui.displayTreatment('Encaminhamento registrado (internação/transferência).');
        break;

      default:
        break;
    }
  }

  finalizeDiagnosis(patientId, chosenDiagnosis) {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient || patient.diagnosisMade) return;
    patient.diagnosisMade = true;
    // Avalia com DiagnosisEvaluator
    const feedback = DiagnosisEvaluator.evaluate(patient.case, patient.actionsPerformed, chosenDiagnosis, this.config.scoring);
    // Atualiza pontuação e erros
    this.score += feedback.points;
    this.ui.updateScore(this.score);
    if (feedback.correct) {
      this.correctCases++;
    } else {
      // diagnóstico ou ações incorretas contam como erro
      this.errorCount++;
      this.incorrectCases++;
    }
    // Remove paciente da fila
    this.patients = this.patients.filter(p => p.id !== patientId);
    // Incrementa o número total de casos atendidos
    this.casesAttended++;
    // Exibe feedback modal
    this.ui.showFeedback(feedback);
    // Verifica progresso de nível
    this.checkProgression();
    // Atualiza fila e detalhes
    this.activePatientId = null;
    this.ui.renderPatientQueue(this.patients, this.activePatientId);
    this.ui.renderPatientDetails(null, this);
  }

  checkProgression() {
    const req = this.config.levelRequirements[String(this.currentLevel)];
    // Calcular precisão: pontuação de casos acertados / total casos atendidos
    // Simplificação: se erroCount > maxErrors => game over
    if (this.errorCount > req.maxErrors) {
      this.endGame(`Você cometeu muitos erros no nível ${this.currentLevel}.`);
      return;
    }
    // Nível sobe se pontuação >= basePoints * número de casos atendidos * minAccuracy
    const casesAttended = this.score / this.config.scoring.basePoints;
    const minPoints = casesAttended * this.config.scoring.basePoints * req.minAccuracy;
    if (this.score >= minPoints && casesAttended >= 3) {
      // sobe nível até máximo configurado
      if (this.config.levelRequirements[String(this.currentLevel + 1)]) {
        this.currentLevel++;
        this.ui.updateLevel(this.currentLevel);
        this.ui.showNotification(`Parabéns! Você alcançou o nível ${this.currentLevel}.`);
      }
    }
  }

  handlePatientDeath(patient) {
    // Penaliza pontuação e erros
    this.score -= this.config.scoring.deathPenalty;
    if (this.score < 0) this.score = 0;
    this.errorCount++;
    // óbito conta como caso incorreto
    this.incorrectCases++;
    // Conta como um caso atendido (mesmo que resultou em óbito)
    this.casesAttended++;
    this.ui.updateScore(this.score);
    this.ui.renderPatientQueue(this.patients, this.activePatientId);
    this.checkProgression();
  }

  endGame(message) {
    // Para timers
    clearInterval(this.newPatientInterval);
    clearInterval(this.tickInterval);
    // Exibe modal de game over
    this.ui.showGameOver(message, this.score);
  }
}

class DiagnosisEvaluator {
  /**
   * Compara as ações realizadas e diagnóstico escolhido com o gabarito do caso.
   * Retorna um objeto com resultado, pontos e mensagens.
   * @param {Object} caseData Dados do caso clínico
   * @param {Set<string>} actions Ações realizadas pelo jogador
   * @param {string} chosenDiagnosis Diagnóstico selecionado
   * @param {Object} scoring Configuração de pontuação
   */
  static evaluate(caseData, actions, chosenDiagnosis, scoring) {
    let correctDiagnosis = chosenDiagnosis.trim().toLowerCase() === caseData.diagnosis.toLowerCase();
    // Conta quantas ações obrigatórias foram cumpridas
    let correctActionsCount = 0;
    for (const req of caseData.requiredActions) {
      if (actions.has(req)) correctActionsCount++;
    }
    // Pontuação base
    let points = scoring.basePoints;
    // Bônus por cada ação correta
    points += correctActionsCount * scoring.correctActionBonus;
    // Se diagnóstico incorreto, penaliza
    if (!correctDiagnosis) {
      points -= scoring.errorPenalty;
    }

    // Penaliza ações irrelevantes (para incentivar escolha adequada de exames/medicações)
    const relevant = new Set([...(caseData.requiredActions || []), ...(caseData.recommendedActions || [])]);
    let irrelevantCount = 0;
    actions.forEach(a => { if (!relevant.has(a)) irrelevantCount++; });
    const irrPenalty = (scoring.irrelevantActionPenalty ?? 2);
    points -= irrelevantCount * irrPenalty;
    if (points < 0) points = 0;
    // Mensagens de feedback
    const messages = [];
    if (correctDiagnosis) {
      messages.push(`<strong>Diagnóstico correto!</strong> Você identificou ${caseData.diagnosis}.`);
    } else {
      messages.push(`<strong>Diagnóstico incorreto.</strong> Diagnóstico correto: ${caseData.diagnosis}.`);
    }
    // Avalia ações
    caseData.requiredActions.forEach(req => {
      if (actions.has(req)) {
        messages.push(`Ação correta realizada: ${DiagnosisEvaluator.describeAction(req)}.`);
      } else {
        messages.push(`Você não realizou a ação obrigatória: ${DiagnosisEvaluator.describeAction(req)}.`);
      }
    });
    return {
      correct: correctDiagnosis && correctActionsCount === caseData.requiredActions.length,
      points: points,
      messages: messages
    };
  }
  /**
   * Retorna uma descrição legível de uma chave de ação.
   */
  static describeAction(actionKey) {
    switch (actionKey) {
      case 'history': return 'coletar história clínica';
      case 'exam': return 'realizar exame físico';
      case 'test_ecg': return 'solicitar ECG';
      case 'test_blood': return 'solicitar exames de sangue';
      case 'test_imagem': return 'solicitar exame de imagem';
      case 'admin_asa': return 'administrar ácido acetilsalicílico';
      case 'admin_anticoagulante': return 'administrar anticoagulante';
      case 'admin_antibiotico': return 'administrar antibiótico';
      case 'admin_oxigenio': return 'administrar oxigênio';
      case 'refer_cirurgia': return 'encaminhar para cirurgia';
      default: return actionKey;
    }
  }
}

class UIController {
  constructor() {
    this.queueContainer = document.getElementById('patient-queue');
    this.detailsContainer = document.getElementById('patient-details');
    this.levelDisplay = document.getElementById('level-display');
    this.scoreDisplay = document.getElementById('score-display');
    this.timerDisplay = document.getElementById('timer-display');
    this.feedbackModal = document.getElementById('feedback-modal');
    this.feedbackBody = document.getElementById('feedback-body');
    this.feedbackClose = document.getElementById('feedback-close');
    this.gameOverModal = document.getElementById('gameover-modal');
    this.gameOverMessage = document.getElementById('gameover-message');
    this.restartButton = document.getElementById('restart-button');
    // Notifications: simple method using alert; could be replaced

    // Elementos do overlay de exames. O overlay é exibido quando o usuário
    // seleciona uma categoria de exames (laboratório, imagem ou outros).
    // Para garantir compatibilidade com versões anteriores, verificamos se
    // os elementos existem antes de usá‑los. O botão de voltar fecha
    // imediatamente o overlay e limpa seu conteúdo.
    this.examPage = document.getElementById('exam-page');
    this.examContent = document.getElementById('exam-content');
    this.examBack = document.getElementById('exam-back');
    if (this.examBack) {
      this.examBack.addEventListener('click', () => {
        if (this.examPage) this.examPage.classList.remove('active');
        if (this.examContent) this.examContent.innerHTML = '';
      });
    }

    // Overlay de medicações/procedimentos
    this.treatmentPage = document.getElementById('treatment-page');
    this.treatmentContent = document.getElementById('treatment-content');
    this.treatmentBack = document.getElementById('treatment-back');
    if (this.treatmentBack) {
      this.treatmentBack.addEventListener('click', () => {
        if (this.treatmentPage) this.treatmentPage.classList.remove('active');
        if (this.treatmentContent) this.treatmentContent.innerHTML = '';
      });
    }

    // Overlay de diagnóstico
    this.diagnosisPage = document.getElementById('diagnosis-page');
    this.diagnosisContent = document.getElementById('diagnosis-content');
    this.diagnosisBack = document.getElementById('diagnosis-back');
    if (this.diagnosisBack) {
      this.diagnosisBack.addEventListener('click', () => {
        if (this.diagnosisPage) this.diagnosisPage.classList.remove('active');
        if (this.diagnosisContent) this.diagnosisContent.innerHTML = '';
      });
    }

    // Overlay de história / exame físico
    this.infoPage = document.getElementById('info-page');
    this.infoContent = document.getElementById('info-content');
    this.infoBack = document.getElementById('info-back');
    if (this.infoBack) {
      this.infoBack.addEventListener('click', () => {
        if (this.infoPage) this.infoPage.classList.remove('active');
        if (this.infoContent) this.infoContent.innerHTML = '';
      });
    }

  }
  updateLevel(level) {
    this.levelDisplay.textContent = `Nível ${level}`;
  }
  updateScore(score) {
    this.scoreDisplay.textContent = `Pontuação: ${score}`;
  }
  renderPatientQueue(patients, activeId) {
    this.queueContainer.innerHTML = '';
    if (patients.length === 0) {
      const emptyEl = document.createElement('p');
      emptyEl.textContent = 'Sem pacientes na fila.';
      this.queueContainer.appendChild(emptyEl);
      return;
    }
    patients.forEach(patient => {
      const card = document.createElement('div');
      card.className = 'patient-card';
      if (patient.id === activeId) card.classList.add('active');
      card.addEventListener('click', () => {
        if (typeof window.gameEngine !== 'undefined') {
          window.gameEngine.selectPatient(patient.id);
        }
      });
      const title = document.createElement('h4');
      title.textContent = patient.case.name;
      const subtitle = document.createElement('p');
      subtitle.innerHTML = `${patient.case.chiefComplaint}<br/><span style="font-weight:bold">Status:</span> ${patient.status}`;
      card.appendChild(title);
      card.appendChild(subtitle);
      this.queueContainer.appendChild(card);
    });
  }
  renderPatientDetails(patient, engine) {
    this.detailsContainer.innerHTML = '';
    if (!patient) {
      const msg = document.createElement('h2');
      msg.textContent = 'Selecione um paciente para começar';
      this.detailsContainer.appendChild(msg);
      return;
    }
    // Cabeçalho
    const header = document.createElement('div');
    header.innerHTML = `<h2>${patient.case.name} (${patient.case.age} anos)</h2><p><strong>Queixa:</strong> ${patient.case.chiefComplaint}</p>`;
    this.detailsContainer.appendChild(header);

    // Foto do paciente de acordo com o gênero
    const portrait = document.createElement('div');
    portrait.className = 'patient-portrait';
    const portraitImg = document.createElement('img');
    // Usa as imagens definidas na pasta para pacientes masculino/feminino
    if (patient.case.gender && patient.case.gender.toUpperCase() === 'F') {
      portraitImg.src = 'images/patient_female.jpg';
    } else {
      portraitImg.src = 'images/patient_male.jpg';
    }
    portraitImg.alt = 'Paciente';
    portrait.appendChild(portraitImg);
    this.detailsContainer.appendChild(portrait);

    // Seção de sinais vitais dinâmicos
    const vitalsSection = document.createElement('div');
    vitalsSection.id = 'vitals-display';
    vitalsSection.innerHTML = this.formatVitals(patient.vitals);
    this.detailsContainer.appendChild(vitalsSection);
    // Contêiner de informações reveladas
    const infoContainer = document.createElement('div');
    infoContainer.id = 'info-container';
    this.detailsContainer.appendChild(infoContainer);
    // Ações
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions action-bar';
    // History
    const btnHistory = this.createActionButton('História Clínica', 'fa-book-medical', () => {
      engine.performAction(patient.id, 'history');
    });
    // Exam
    const btnExam = this.createActionButton('Exame Físico', 'fa-stethoscope', () => {
      engine.performAction(patient.id, 'exam');
    });
    // Cria botões de categorias de exames em vez de mostrar cada exame individualmente.
    // Cada botão abre um overlay com todas as opções possíveis para a categoria selecionada
    // (laboratoriais, imagem ou outros). Ao exibir todas as opções, o usuário pode
    // escolher exames corretos ou incorretos, incentivando o raciocínio clínico.
    const testsContainer = document.createElement('div');
    testsContainer.className = 'test-buttons';
    // Sempre exibir todas as três categorias para permitir escolha ampla
    const examCategories = [
      { key: 'lab', label: 'Exames Laboratoriais' },
      { key: 'image', label: 'Exames de Imagem' },
      { key: 'other', label: 'Outros Exames' }
    ];
    examCategories.forEach(cat => {
      const el = this.createActionButton(cat.label, 'fa-flask', () => {
        // Abre o overlay para a categoria selecionada
        this.showExamCategory(patient, cat.key, engine);
      });
      testsContainer.appendChild(el);
    });
    // Cria botões de medicações/procedimentos (com subtelas para não poluir a UI)
    const treatmentsContainer = document.createElement('div');
    treatmentsContainer.className = 'treatment-buttons';
    const treatmentCategories = [
      { key: 'iv', label: 'Medicação IV' },
      { key: 'home', label: 'Medicação Casa/VO' },
      { key: 'proc', label: 'Procedimentos' }
    ];
    treatmentCategories.forEach(cat => {
      const el = this.createActionButton(cat.label, '', () => {
        this.showTreatmentCategory(patient, cat.key, engine);
      });
      treatmentsContainer.appendChild(el);
    });

    // Diagnóstico (abre a subtela de diagnóstico com busca e catálogo amplo)
    const btnDiagnose = this.createActionButton('Diagnóstico', 'fa-notes-medical', () => {
      this.showDiagnosisDialog(patient, engine);
    });

    // Linha superior: História / Exame Físico
    const hxpeRow = document.createElement('div');
    hxpeRow.className = 'hxpe-row';
    hxpeRow.appendChild(btnHistory);
    hxpeRow.appendChild(btnExam);
    actionsDiv.appendChild(hxpeRow);

    // Exames (categorias)
    actionsDiv.appendChild(testsContainer);
    actionsDiv.appendChild(treatmentsContainer);
    actionsDiv.appendChild(btnDiagnose);
    this.detailsContainer.appendChild(actionsDiv);
  }
  createActionButton(text, iconClass, handler) {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    // Utiliza emoji conforme o tipo de ação para eliminar dependência de fontes externas
    let emoji;
    switch (iconClass) {
      case 'fa-book-medical': emoji = '📖'; break;
      case 'fa-stethoscope': emoji = '🩺'; break;
      case 'fa-flask': emoji = '🧪'; break;
      case 'fa-pills': emoji = '💊'; break;
      case 'fa-notes-medical': emoji = '📄'; break;
      default: emoji = '';
    }
    btn.textContent = `${emoji} ${text}`;
    btn.addEventListener('click', handler);
    return btn;
  }
  displayHistory(history) {
    this.showInfoOverlay('História Clínica', `<p>${history}</p>`);
  }
  displayExam(findings) {
    // Se 'findings' for um objeto, detalha por sistemas; caso contrário, exibe string
    let html = '';
    if (findings && typeof findings === 'object') {
      for (const sys in findings) {
        html += `<p><strong>${sys.charAt(0).toUpperCase() + sys.slice(1)}:</strong> ${findings[sys]}</p>`;
      }
    } else {
      html += `<p>${findings}</p>`;
    }
    this.showInfoOverlay('Exame Físico', html || '<p>Sem achados registrados.</p>');
  }
  displayTest(title, result) {
    this.showInfoOverlay(title, `<p>${result || 'Sem resultados'}</p>`);
  }
  displayTreatment(description) {
    this.showInfoOverlay('Tratamento', `<p>${description}</p>`);
  }

  showInfoOverlay(title, bodyHtml) {
    const page = document.getElementById('info-page');
    const ttl = document.getElementById('info-title');
    const content = document.getElementById('info-content');
    if (!page || !ttl || !content) {
      // fallback: mostra no painel interno
      const info = document.getElementById('info-container');
      if (info) {
        const section = document.createElement('div');
        section.innerHTML = `<h3>${title}</h3>${bodyHtml}`;
        info.appendChild(section);
      }
      return;
    }
    ttl.textContent = title;
    content.innerHTML = bodyHtml;
    page.classList.add('active');
  }
  showFeedback(feedback) {
    this.feedbackBody.innerHTML = `<ul>${feedback.messages.map(m => `<li>${m}</li>`).join('')}</ul><p><strong>Pontuação obtida:</strong> ${feedback.points}</p>`;
    this.feedbackModal.classList.remove('hidden');
  }
  showGameOver(message, score) {
    this.gameOverMessage.innerHTML = `${message}<br/>Sua pontuação final foi ${score}.`;
    this.gameOverModal.classList.remove('hidden');
  }
  showNotification(text) {
    // Simples toast: para fins demonstrativos usamos alert
    console.log(text);
    // Poderíamos implementar toast animado aqui
  }
  showTestMenu(patient, engine) {
    // Cria menu simples via prompt; podemos aprimorar para modal
    const availableTests = [];
    if (patient.case.tests.ecg) availableTests.push({ key: 'test_ecg', label: 'ECG' });
    if (patient.case.tests.troponina || patient.case.tests.dDimero || patient.case.tests.hemograma) availableTests.push({ key: 'test_blood', label: 'Exames de sangue' });
    if (patient.case.tests.raiox || patient.case.tests.angioTC || patient.case.tests.ultrassom || patient.case.tests.tomografia) availableTests.push({ key: 'test_imagem', label: 'Exames de imagem' });
    if (availableTests.length === 0) {
      alert('Nenhum exame disponível.');
      return;
    }
    const optionsStr = availableTests.map((t, i) => `${i + 1}. ${t.label}`).join('\n');
    const choice = prompt(`Escolha um exame:\n${optionsStr}`);
    const idx = parseInt(choice, 10) - 1;
    if (!isNaN(idx) && availableTests[idx]) {
      engine.performAction(patient.id, availableTests[idx].key);
    }
  }
  showTreatmentMenu(patient, engine) {
    const availableTreatments = [
      { key: 'admin_asa', label: 'Ácido Acetilsalicílico' },
      { key: 'admin_anticoagulante', label: 'Anticoagulante' },
      { key: 'admin_antibiotico', label: 'Antibiótico' },
      { key: 'admin_oxigenio', label: 'Oxigênio' },
      { key: 'refer_cirurgia', label: 'Encaminhar para Cirurgia' }
    ];
    const optionsStr = availableTreatments.map((t, i) => `${i + 1}. ${t.label}`).join('\n');
    const choice = prompt(`Escolha um tratamento:\n${optionsStr}`);
    const idx = parseInt(choice, 10) - 1;
    if (!isNaN(idx) && availableTreatments[idx]) {
      engine.performAction(patient.id, availableTreatments[idx].key);
    }
  }
  showDiagnosisDialog(patient, engine) {
    // Mostra uma tela de diagnóstico com busca e muitas opções
    if (!this.diagnosisPage || !this.diagnosisContent) return;

    // Fundo cinematográfico do consultório (reutiliza o mesmo do atendimento)
    this.diagnosisPage.style.backgroundImage = `url('images/consultorio.jpg')`;

    // Lista base: diagnósticos diferenciais do caso + diagnóstico correto + catálogo global
    const fromCase = [];
    if (patient.case && Array.isArray(patient.case.differentialDiagnoses)) {
      fromCase.push(...patient.case.differentialDiagnoses);
    }
    if (patient.case && patient.case.diagnosis) {
      fromCase.push(patient.case.diagnosis);
    }

    // Catálogo global (para induzir o jogador a selecionar corretamente)
    const globalCatalog = [
      'Infarto Agudo do Miocárdio (IAM)',
      'Angina instável',
      'Embolia pulmonar',
      'Pneumonia comunitária',
      'Crise asmática',
      'DPOC exacerbado',
      'Insuficiência cardíaca descompensada',
      'Sepse',
      'Choque séptico',
      'AVC isquêmico',
      'AVC hemorrágico',
      'Cetoacidose diabética',
      'Hipoglicemia',
      'Apendicite aguda',
      'Colecistite aguda',
      'Pancreatite aguda',
      'Gastroenterite',
      'Infecção urinária / Pielonefrite',
      'Cólica renal',
      'Anemia aguda / Hemorragia',
      'Anafilaxia',
      'Intoxicação medicamentosa',
      'Crise convulsiva',
      'Meningite',
      'TCE',
      'Fratura / Trauma',
      'Dor musculoesquelética',
      'Ansiedade / Ataque de pânico'
    ];

    // Junta, remove duplicados e ordena
    const all = Array.from(new Set([...fromCase, ...globalCatalog])).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    // Render
    this.diagnosisContent.innerHTML = `
      <h3>Definir Diagnóstico</h3>
      <div class="diagnosis-search">
        <input id="diag-search-input" type="text" placeholder="Buscar diagnóstico... (ex: infarto, sepse, asma)" />
      </div>
      <div class="diagnosis-options" id="diag-options"></div>
      <p class="hint">Dica: escolha o diagnóstico mais compatível com os achados e exames selecionados. Há opções extras para aumentar o realismo.</p>
    `;

    const optionsEl = this.diagnosisContent.querySelector('#diag-options');
    const inputEl = this.diagnosisContent.querySelector('#diag-search-input');

    const renderList = (filterText) => {
      const q = (filterText || '').trim().toLowerCase();
      optionsEl.innerHTML = '';
      const filtered = q ? all.filter(d => d.toLowerCase().includes(q)) : all;
      filtered.forEach(d => {
        const btn = document.createElement('button');
        btn.textContent = d;
        btn.addEventListener('click', () => {
          engine.finalizeDiagnosis(patient.id, d);
          this.diagnosisPage.classList.remove('active');
        });
        optionsEl.appendChild(btn);
      });
      if (filtered.length === 0) {
        optionsEl.innerHTML = '<p>Nenhum diagnóstico encontrado.</p>';
      }
    };

    renderList('');
    if (inputEl) {
      inputEl.addEventListener('input', (e) => {
        renderList(e.target.value);
      });
    }

    this.diagnosisPage.classList.add('active');
  }

  /**
   * Exibe o overlay de exames para uma categoria específica. Cria um painel
   * com botões para cada exame disponível no caso do paciente dentro da
   * categoria escolhida (laboratorial, imagem ou outros). Ao selecionar
   * um exame, o resultado é exibido e a ação é registrada na engine.
   *
   * @param {Object} patient Paciente atual
   * @param {string} category Categoria ('lab', 'image' ou 'other')
   * @param {GameEngine} engine Instância da engine
   */
  showExamCategory(patient, category, engine) {
    if (!this.examPage || !this.examContent) return;
    // Define a imagem de fundo com base na categoria
    let bg;
    if (category === 'lab') {
      bg = 'images/labs.jpg';
    } else if (category === 'image') {
      // Para exames de imagem usamos ressonância como imagem de fundo padrão
      bg = 'images/mri.jpg';
    } else {
      bg = 'images/xray.jpg';
    }
    this.examPage.style.backgroundImage = `url('${bg}')`;
    // Lista de opções de exames disponíveis. Em vez de filtrar pelos testes presentes
    // no caso, apresentamos todas as opções da categoria para incentivar o usuário
    // a escolher corretamente ou cometer erros. Se um exame não estiver definido no
    // caso, o resultado exibido será "Sem dados".
    let options = [];
    if (category === 'lab') {
      options = [
        { key: 'troponina', label: 'Troponina' },
        { key: 'dDimero', label: 'D-Dímero' },
        { key: 'hemograma', label: 'Hemograma' },
        { key: 'gasometria', label: 'Gasometria' }
      ];
    } else if (category === 'image') {
      options = [
        { key: 'raiox', label: 'Raio-X' },
        { key: 'angioTC', label: 'AngioTC' },
        { key: 'ultrassom', label: 'Ultrassom' },
        { key: 'tomografia', label: 'Tomografia' },
        { key: 'mri', label: 'Ressonância' },
        { key: 'xray', label: 'X-Ray' }
      ];
    } else {
      options = [ { key: 'ecg', label: 'ECG' } ];
    }
    // Construção do HTML
    let html = `<h3>Escolha um exame</h3>`;
    if (options.length === 0) {
      html += '<p>Não há exames disponíveis nesta categoria.</p>';
    } else {
      html += '<div class="exam-options">';
      options.forEach(opt => {
        html += `<button data-exam-key="${opt.key}" data-exam-cat="${category}">${opt.label}</button>`;
      });
      html += '</div>';
    }
    this.examContent.innerHTML = html;
    // Adiciona listeners para cada botão
    const buttons = this.examContent.querySelectorAll('button[data-exam-key]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const examKey = btn.getAttribute('data-exam-key');
        const examCat = btn.getAttribute('data-exam-cat');
        this.showExamResult(patient, examKey, examCat, engine);
      });
    });
    this.examPage.classList.add('active');
  }

  
  /**
   * Exibe o overlay de medicações/procedimentos por categoria.
   * @param {Object} patient Paciente atual
   * @param {string} category 'iv' | 'home' | 'proc'
   * @param {GameEngine} engine Motor do jogo
   */
  showTreatmentCategory(patient, category, engine) {
    if (!this.treatmentPage || !this.treatmentContent) return;

    const catalog = {
      iv: {
        title: 'Medicação Intravenosa / Emergência',
        background: 'images/labs.jpg',
        options: [
          { key: 'admin_oxigenio', label: 'Oxigênio (O2)' },
          { key: 'admin_soro', label: 'Soro fisiológico EV' },
          { key: 'admin_asa', label: 'AAS (ácido acetilsalicílico)' },
          { key: 'admin_anticoagulante', label: 'Anticoagulante (ex.: heparina)' },
          { key: 'admin_nitro', label: 'Nitrato (ex.: nitroglicerina)' },
          { key: 'admin_morfina', label: 'Opioide (ex.: morfina)' },
          { key: 'admin_antiemetico', label: 'Antiemético (ex.: ondansetrona)' },
          { key: 'admin_analgesico', label: 'Analgésico EV (ex.: dipirona)' },
          { key: 'admin_antitermico', label: 'Antitérmico EV' },
          { key: 'admin_adrenalina', label: 'Adrenalina (anafilaxia/PCR)' },
          { key: 'admin_corticoide', label: 'Corticoide EV (ex.: hidrocortisona)' },
          { key: 'admin_broncodilatador', label: 'Broncodilatador (nebulização/EV conforme protocolo)' },
          { key: 'admin_antibiotico_ev', label: 'Antibiótico EV' },
          { key: 'admin_diuretico', label: 'Diurético EV (ex.: furosemida)' },
          { key: 'admin_insulina', label: 'Insulina (protocolos)' },
          { key: 'admin_dextrose', label: 'Glicose EV (hipoglicemia)' },
          { key: 'admin_sedacao', label: 'Sedação / Analgesia procedimental' },
          { key: 'admin_benzo', label: 'Benzodiazepínico (ex.: diazepam)' },
          { key: 'admin_anticonvulsivante', label: 'Anticonvulsivante (ex.: fenitoína)' },
          { key: 'admin_vasopressor', label: 'Vasopressor (ex.: noradrenalina)' },
          { key: 'admin_trombolise', label: 'Trombólise (quando indicado)' },
          { key: 'admin_naloxona', label: 'Naloxona (overdose opioide)' }
        ]
      },
      home: {
        title: 'Medicação para Casa / Via Oral',
        background: 'images/consultorio.jpg',
        options: [
          { key: 'presc_analgesico', label: 'Analgésico VO (ex.: paracetamol)' },
          { key: 'presc_antiinflamatorio', label: 'Anti-inflamatório VO (ex.: ibuprofeno)' },
          { key: 'presc_antibiotico_oral', label: 'Antibiótico VO (ex.: amoxicilina)' },
          { key: 'presc_antiacido', label: 'Antiácido / IBP (ex.: omeprazol)' },
          { key: 'presc_antiemetico', label: 'Antiemético VO' },
          { key: 'presc_broncodilatador', label: 'Broncodilatador inalatório' },
          { key: 'presc_antihipertensivo', label: 'Anti-hipertensivo (ajuste)' },
          { key: 'presc_antialergico', label: 'Anti-histamínico (alergia)' },
          { key: 'presc_hidratacao_oral', label: 'Sais de reidratação oral' },
          { key: 'presc_orientacoes', label: 'Orientações e sinais de alarme' },
          { key: 'presc_estatina', label: 'Estatina (secundária)' },
          { key: 'presc_antiagregante', label: 'Antiagregante (ex.: clopidogrel)' },
          { key: 'presc_anticoagulante_oral', label: 'Anticoagulante oral' }
        ]
      },
      proc: {
        title: 'Procedimentos',
        background: 'images/hospital_corridor.jpg',
        options: [
          { key: 'proc_acesso_venoso', label: 'Acesso venoso periférico' },
          { key: 'proc_ecg', label: 'ECG (12 derivações)' },
          { key: 'proc_nebulizacao', label: 'Nebulização' },
          { key: 'proc_imobilizacao', label: 'Imobilização / Tala' },
          { key: 'proc_sutura', label: 'Sutura' },
          { key: 'proc_cateter', label: 'Cateter vesical' },
          { key: 'proc_intubacao', label: 'Intubação orotraqueal' },
          { key: 'proc_cpr', label: 'RCP (reanimação cardiopulmonar)' },
          { key: 'proc_desfibrilacao', label: 'Desfibrilação' },
          { key: 'proc_oximetria', label: 'Monitorização (oximetria/PA/ECG contínuo)' },
          { key: 'proc_encaminhar', label: 'Encaminhar / Internar / Transferir' },
          { key: 'proc_sonda_naso', label: 'Sonda nasogástrica' },
          { key: 'proc_puncao', label: 'Punção / Drenagem (quando indicado)' }
        ]
      }
    };

    const pack = catalog[category] || catalog.proc;
    this.treatmentPage.style.backgroundImage = `url('${pack.background}')`;

    let html = `<h3>${pack.title}</h3><div class="treatment-options">`;
    pack.options.forEach(opt => {
      html += `<button data-treat-key="${opt.key}" data-treat-cat="${category}">${opt.label}</button>`;
    });
    html += `</div><p class="hint">Selecione livremente. Opções extras existem para simular escolhas incorretas e impactar sua pontuação.</p>`;
    this.treatmentContent.innerHTML = html;

    const buttons = this.treatmentContent.querySelectorAll('button[data-treat-key]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-treat-key');
        this.showTreatmentResult(patient, key, category, engine);
      });
    });

    this.treatmentPage.classList.add('active');
  }

  /**
   * Exibe o resultado/registro da ação de tratamento e retorna ao atendimento via botão "Voltar".
   */
  showTreatmentResult(patient, actionKey, category, engine) {
    // Registra na engine (pontuação será avaliada ao final)
    engine.performAction(patient.id, actionKey);

    const labelMap = {
      admin_oxigenio: 'Oxigênio iniciado',
      admin_soro: 'Soro administrado',
      admin_asa: 'AAS administrado',
      admin_anticoagulante: 'Anticoagulante administrado',
      admin_nitro: 'Nitrato administrado',
      admin_morfina: 'Opioide administrado',
      admin_adrenalina: 'Adrenalina administrada',
      proc_ecg: 'ECG solicitado/realizado',
      proc_nebulizacao: 'Nebulização realizada',
      proc_cpr: 'RCP iniciada'
    };

    // Renderiza uma tela “cinematográfica” simples para feedback
    this.treatmentContent.innerHTML = `
      <h3>Ação Registrada</h3>
      <p><strong>${labelMap[actionKey] || 'Procedimento/medicação selecionado(a)'}</strong></p>
      <p>Essa ação foi adicionada ao prontuário do paciente e será considerada no relatório final.</p>
      <div style="margin-top:12px;">
        <h4>Sinais vitais (atual)</h4>
        <p>${this.formatVitals(patient.vitals)}</p>
      </div>
      <p class="hint">Use o botão <strong>Voltar</strong> para retornar ao atendimento.</p>
    `;
  }

/**
   * Formata um objeto de sinais vitais em HTML legível.
   * @param {Object} vitals Objeto com pressaoSys, pressaoDia, freq, saturacao, temperatura
   */
  formatVitals(vitals) {
    if (!vitals) return '';
    return `<h3>Sinais Vitais</h3>
      <p>Pressão arterial: ${Math.round(vitals.pressaoSys)}/${Math.round(vitals.pressaoDia)} mmHg</p>
      <p>Frequência cardíaca: ${Math.round(vitals.freq)} bpm</p>
      <p>Saturação de O₂: ${Math.round(vitals.saturacao)}%</p>
      <p>Temperatura: ${vitals.temperatura.toFixed(1)} °C</p>`;
  }

  /**
   * Atualiza a seção de sinais vitais na interface para o paciente ativo.
   * @param {Object} patient Paciente cujos vitais devem ser exibidos
   */
  updateVitalsDisplay(patient) {
    const vitalsDiv = document.getElementById('vitals-display');
    if (vitalsDiv && patient && patient.vitals) {
      vitalsDiv.innerHTML = this.formatVitals(patient.vitals);
    }
  }

  /**
   * Exibe o resultado do exame selecionado no overlay e registra a ação
   * correspondente na engine (agrupando por tipo conforme gabarito de
   * pontuação). O overlay permanece ativo e exibe somente o resultado;
   * o jogador pode usar o botão "Voltar" para regressar.
   *
   * @param {Object} patient Paciente atual
   * @param {string} examKey Chave do exame no objeto tests
   * @param {string} examCat Categoria do exame
   * @param {GameEngine} engine Instância da engine
   */
  showExamResult(patient, examKey, examCat, engine) {
    if (!this.examPage || !this.examContent) return;
    // Determina o actionKey para registrar nas ações realizadas
    let actionKey;
    if (examKey === 'ecg') {
      actionKey = 'test_ecg';
    } else if (['troponina','dDimero','hemograma','gasometria'].includes(examKey)) {
      actionKey = 'test_blood';
    } else {
      actionKey = 'test_imagem';
    }
    // Registra imediatamente a ação para pontuação/estatística
    if (engine && patient) {
      engine.performAction(patient.id, actionKey);
    }
    // Mapeia nomes amigáveis
    const labelMap = {
      troponina: 'Troponina', dDimero: 'D-Dímero', hemograma: 'Hemograma', gasometria: 'Gasometria',
      raiox: 'Raio-X', angioTC: 'AngioTC', ultrassom: 'Ultrassom', tomografia: 'Tomografia', mri: 'Ressonância', xray: 'X-Ray', ecg: 'ECG'
    };
    const label = labelMap[examKey] || examKey;
    const result = patient.case.tests[examKey];
    // Exibe mensagem de espera enquanto o exame é processado
    this.examContent.innerHTML = `<h3>${label}</h3><p>Processando resultado... aguarde alguns segundos.</p>`;
    // Após o tempo configurado, exibe o resultado real (ou "Sem dados" se não houver)
    const delay = (engine?.config?.examDelaySeconds || 10) * 1000;
    setTimeout(() => {
      if (!this.examContent) return;
      this.examContent.innerHTML = `<h3>${label}</h3><p>${result || 'Sem dados'}</p>`;
    }, delay);
  }
}

// Controle de fluxo da aplicação
document.addEventListener('DOMContentLoaded', () => {
  // Dados embutidos para evitar problemas de carregamento de arquivo local
  const casesData = [
    {
      id: 1,
      name: 'José Silva',
      age: 45,
      gender: 'M',
      chiefComplaint: 'Dor torácica súbita acompanhada de náuseas',
      history: 'Fumante, hipertenso, histórico familiar de infarto',
      // Define sinais vitais numéricos para permitir deterioração dinâmica
      vitals: {
        pressaoSys: 160,
        pressaoDia: 100,
        freq: 98,
        saturacao: 94,
        temperatura: 36.8
      },
      // Detalhes de exame físico por sistemas
      examDetails: {
        cardiovascular: 'Dor retroesternal intensa, sem alívio em repouso',
        respiratory: 'Ausculta pulmonar sem estertores',
        abdominal: 'Abdome sem dor à palpação',
        neurological: 'Sem déficit neurológico'
      },
      tests: {
        ecg: 'Elevação do segmento ST em D2, D3 e avF.',
        troponina: 'Aumentada (2,5 ng/mL)',
        raiox: 'Infiltrado discreto em base esquerda'
      },
      requiredActions: ['test_ecg', 'test_blood', 'admin_asa'],
      differentialDiagnoses: [
        'Angina Instável', 'Dissecção de Aorta', 'Estenose Aórtica'
      ],
      diagnosis: 'Infarto Agudo do Miocárdio'
    },
    {
      id: 2,
      name: 'Maria Oliveira',
      age: 30,
      gender: 'F',
      chiefComplaint: 'Falta de ar súbita e dor torácica pleurítica',
      history: 'Uso recente de anticoncepcional oral, imobilização devido a fratura de tornozelo há duas semanas',
      vitals: {
        pressaoSys: 110,
        pressaoDia: 70,
        freq: 110,
        saturacao: 90,
        temperatura: 37.0
      },
      examDetails: {
        cardiovascular: 'Taquicardia moderada',
        respiratory: 'Taquipneia e roncos esparsos à ausculta',
        abdominal: 'Abdome flácido sem dor',
        neurological: 'Sem alterações'
      },
      tests: {
        dDimero: 'Elevado (2.0 µg/mL)',
        angioTC: 'Trombo em artéria pulmonar direita',
        gasometria: 'pO2 60 mmHg, pCO2 32 mmHg, pH 7.45'
      },
      requiredActions: ['test_imagem', 'admin_anticoagulante', 'admin_oxigenio'],
      differentialDiagnoses: [
        'Pneumonia', 'Asma Aguda', 'Pneumotórax'
      ],
      diagnosis: 'Embolia Pulmonar'
    },
    {
      id: 3,
      name: 'João Ferreira',
      age: 55,
      gender: 'M',
      chiefComplaint: 'Dor abdominal intensa no quadrante inferior direito',
      history: 'Dor há 12 horas, náuseas, sem apetite, histórico prévio de apendicite na família',
      vitals: {
        pressaoSys: 120,
        pressaoDia: 80,
        freq: 88,
        saturacao: 97,
        temperatura: 38.5
      },
      examDetails: {
        cardiovascular: 'Frequência cardíaca levemente elevada',
        respiratory: 'Pulmões sem alterações',
        abdominal: 'Sensibilidade aumentada no QID, Blumberg positivo',
        neurological: 'Paciente consciente e orientado'
      },
      tests: {
        hemograma: 'Leucócitos 16.000/mm³, neutrofilia',
        ultrassom: 'Inflamação de apêndice, diâmetro aumentado',
        tomografia: 'Confirmando apendicite aguda'
      },
      requiredActions: ['test_blood', 'test_imagem', 'refer_cirurgia'],
      differentialDiagnoses: [
        'Gastrite', 'Colecistite', 'Diverticulite'
      ],
      diagnosis: 'Apendicite Aguda'
    },
    {
      id: 4,
      name: 'Ana Souza',
      age: 70,
      gender: 'F',
      chiefComplaint: 'Perda de força súbita no lado direito e dificuldade de falar',
      history: 'Hipertensa, diabética e portadora de fibrilação atrial, sem uso regular de anticoagulante',
      vitals: {
        pressaoSys: 160,
        pressaoDia: 90,
        freq: 80,
        saturacao: 95,
        temperatura: 36.7
      },
      examDetails: {
        cardiovascular: 'Ritmo irregular, presença de fibrilação atrial',
        respiratory: 'Pulmões limpos à ausculta',
        abdominal: 'Sem dor à palpação',
        neurological: 'Fraqueza em hemicorpo direito, dificuldade de articulação da fala'
      },
      tests: {
        ecg: 'Fibrilação atrial',
        tomografia: 'Lesão isquêmica em território de artéria cerebral média esquerda',
        raiox: 'Sem alterações'
      },
      requiredActions: ['test_imagem', 'admin_anticoagulante', 'admin_oxigenio'],
      differentialDiagnoses: [
        'Hipoglicemia', 'Crise Convulsiva', 'Enxaqueca Hemiplégica'
      ],
      diagnosis: 'Acidente Vascular Cerebral Isquêmico'
    },
    {
      id: 5,
      name: 'Carlos Lima',
      age: 60,
      gender: 'M',
      chiefComplaint: 'Febre alta, hipotensão e dor abdominal difusa',
      history: 'Cirurgia abdominal recente por perfuração intestinal, diabético tipo 2',
      vitals: {
        pressaoSys: 90,
        pressaoDia: 60,
        freq: 120,
        saturacao: 92,
        temperatura: 39.0
      },
      examDetails: {
        cardiovascular: 'Taquicardia intensa',
        respiratory: 'Sons vesiculares diminuídos nas bases',
        abdominal: 'Abdome distendido com dor difusa e defesa muscular',
        neurological: 'Ligeira confusão mental'
      },
      tests: {
        hemograma: 'Leucócitos 18.000/mm³, neutrofilia',
        gasometria: 'pH 7.30, lactato elevado',
        tomografia: 'Coleções intra‑abdominais e sinais de peritonite',
        ecg: 'Taquicardia sinusal'
      },
      requiredActions: ['test_blood', 'test_imagem', 'admin_antibiotico', 'admin_oxigenio'],
      differentialDiagnoses: [
        'Apendicite', 'Pancreatite', 'Choque Cardiogênico'
      ],
      diagnosis: 'Sepse de origem abdominal'
    },
    {
      id: 6,
      name: 'Luana Costa',
      age: 25,
      gender: 'F',
      chiefComplaint: 'Chiado no peito e falta de ar',
      history: 'Asmática em uso de broncodilatadores, iniciou sintomas há 2 horas',
      vitals: {
        pressaoSys: 110,
        pressaoDia: 70,
        freq: 130,
        saturacao: 88,
        temperatura: 37.2
      },
      examDetails: {
        cardiovascular: 'Taquicardia',
        respiratory: 'Sibilos difusos e uso de musculatura acessória',
        abdominal: 'Sem dor abdominal',
        neurological: 'Ansiosa, mas orientada'
      },
      tests: {
        ecg: 'Taquicardia sinusal',
        raiox: 'Hiperinsuflação pulmonar difusa',
        troponina: 'Normal'
      },
      requiredActions: ['test_imagem', 'admin_oxigenio'],
      differentialDiagnoses: [
        'Pneumonia', 'Alveolite', 'Edema Pulmonar'
      ],
      diagnosis: 'Crise Asmática'
    },
    {
      id: 7,
      name: 'Pedro Santos',
      age: 48,
      gender: 'M',
      chiefComplaint: 'Tontura, sudorese e episódio de desmaio',
      history: 'Portador de diabetes tipo 1 em uso de insulina, refeição atrasada',
      vitals: {
        pressaoSys: 100,
        pressaoDia: 60,
        freq: 90,
        saturacao: 96,
        temperatura: 36.5
      },
      examDetails: {
        cardiovascular: 'Taquicardia leve',
        respiratory: 'Sem alterações',
        abdominal: 'Abdome flácido e indolor',
        neurological: 'Confuso, sudoreico, responsivo a estímulos'
      },
      tests: {
        hemograma: 'Sem alterações significativas',
        ecg: 'Taquicardia sinusal',
        dDimero: 'Normal'
      },
      requiredActions: ['test_blood', 'admin_oxigenio'],
      differentialDiagnoses: [
        'Infarto Agudo do Miocárdio', 'Acidente Vascular Cerebral', 'Choque Séptico'
      ],
      diagnosis: 'Hipoglicemia'
    },
    {
      id: 8,
      name: 'Bruno Rocha',
      age: 40,
      gender: 'M',
      chiefComplaint: 'Dor abdominal intensa após acidente automobilístico',
      history: 'Acidente de alta energia, uso do cinto de segurança, perda momentânea da consciência',
      vitals: {
        pressaoSys: 90,
        pressaoDia: 50,
        freq: 140,
        saturacao: 90,
        temperatura: 37.2
      },
      examDetails: {
        cardiovascular: 'Taquicardia significativa',
        respiratory: 'Respiração rápida e superficial',
        abdominal: 'Distensão abdominal, dor generalizada e sensibilidade à palpação',
        neurological: 'Confuso, orientado a dor'
      },
      tests: {
        ecg: 'Taquicardia sinusal',
        hemograma: 'Hemoglobina 9 g/dL, anemia aguda',
        ultrassom: 'Presença de líquido livre em cavidade abdominal',
        tomografia: 'Hematoma esplênico e hemoperitônio'
      },
      requiredActions: ['test_blood', 'test_imagem', 'refer_cirurgia'],
      differentialDiagnoses: [
        'Pancreatite', 'Apendicite', 'Ruptura de aneurisma'
      ],
      diagnosis: 'Trauma abdominal com hemorragia interna'
    },
    {
      id: 9,
      name: 'Júlia Mendes',
      age: 52,
      gender: 'F',
      chiefComplaint: 'Vômitos com sangue e fezes enegrecidas',
      history: 'Uso crônico de anti‑inflamatórios, hipertensão arterial sistêmica',
      vitals: {
        pressaoSys: 100,
        pressaoDia: 60,
        freq: 110,
        saturacao: 94,
        temperatura: 37.4
      },
      examDetails: {
        cardiovascular: 'Taquicardia',
        respiratory: 'Sem alterações significativas',
        abdominal: 'Dor epigástrica à palpação',
        neurological: 'Alerta, orientada'
      },
      tests: {
        hemograma: 'Hemoglobina 8 g/dL, anemia',
        ultrassom: 'Conteúdo líquido no estômago sugestivo de sangue',
        raiox: 'Estômago distendido com níveis hidroaéreos',
        ecg: 'Taquicardia sinusal'
      },
      requiredActions: ['test_blood', 'test_imagem', 'refer_cirurgia'],
      differentialDiagnoses: [
        'Colecistite', 'Hepatite', 'Pancreatite'
      ],
      diagnosis: 'Hemorragia Digestiva Alta'
    },
    {
      id: 10,
      name: 'Eduardo Reis',
      age: 28,
      gender: 'M',
      chiefComplaint: 'Confusão mental, bradicardia e convulsões',
      history: 'Uso recreativo de drogas, suspeita de overdose de opióides',
      vitals: {
        pressaoSys: 85,
        pressaoDia: 50,
        freq: 50,
        saturacao: 85,
        temperatura: 36.0
      },
      examDetails: {
        cardiovascular: 'Bradicardia importante',
        respiratory: 'Respiração deprimida',
        abdominal: 'Sem alterações',
        neurological: 'Pacote convulsivo, lentidão de resposta'
      },
      tests: {
        gasometria: 'pH 7.32, pCO2 55 mmHg, acidose respiratória',
        ecg: 'Bradicardia sinusal',
        raiox: 'Sem alterações'
      },
      requiredActions: ['test_blood', 'test_imagem', 'admin_oxigenio'],
      differentialDiagnoses: [
        'Acidente Vascular Hemorrágico', 'Sepse', 'Síncope Vasovagal'
      ],
      diagnosis: 'Overdose de opióides'
    }
  ];
  const configData = {
    initialLevel: 1,
    maxSimultaneousPatients: 2,
    newPatientIntervalSeconds: 60,
    levelRequirements: {
      '1': { minAccuracy: 0.5, maxErrors: 3 },
      '2': { minAccuracy: 0.7, maxErrors: 2 },
      '3': { minAccuracy: 0.9, maxErrors: 1 }
    },
    scoring: {
      basePoints: 100,
      correctActionBonus: 20,
      timeBonusMultiplier: 1,
      errorPenalty: 50,
      deathPenalty: 100
    },
    // Tempo em segundos para receber resultados dos exames (para simular tempo real)
    examDelaySeconds: 10
  };
  const caseRepo = new CaseRepository(casesData);
  const ui = new UIController();
  const engine = new GameEngine(configData, caseRepo, ui);
  // Expor engine globalmente para acesso nos eventos
  window.gameEngine = engine;
  // Configurar UI de início
  // Avatares agora utilizam imagens fotográficas realistas em vez de emojis.
  // Cada entrada do array contém o caminho relativo para a imagem correspondente em "medsim/images".
  // Definição dos avatares cinematográficos.  Os arquivos provêm do
  // repositório "Medical‑simulator‑1.0/images" e foram baixados para
  // o diretório de imagens local.  Caso você deseje ampliar a lista,
  // basta adicionar novos objetos com o caminho da imagem.
  const avatars = [
    { image: 'images/avatar1.png' },
    { image: 'images/avatar2.png' },
    { image: 'images/avatar3.png' },
    { image: 'images/avatar4.png' },
    { image: 'images/avatar5.png' },
    { image: 'images/avatar6.png' }
  ];
  const avatarContainer = document.getElementById('avatar-options');
  let selectedAvatarIndex = 0;
  avatars.forEach((av, index) => {
    const item = document.createElement('div');
    item.className = 'avatar-item';
    if (index === 0) item.classList.add('selected');
    // Cria elemento de imagem para o avatar
    const img = document.createElement('img');
    img.src = av.image;
    img.alt = `Avatar ${index + 1}`;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    item.appendChild(img);
    item.addEventListener('click', () => {
      document.querySelectorAll('.avatar-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      selectedAvatarIndex = index;
    });
    avatarContainer.appendChild(item);
  });
  // Screens
  const splashScreen = document.getElementById('splash-screen');
  const welcomeScreen = document.getElementById('welcome-screen');
  const lobbyScreen = document.getElementById('lobby-screen');
  const gameScreen = document.getElementById('game-screen');
  const officeScreen = document.getElementById('office-screen');
  // Clicar na capa leva à tela de boas‑vindas
  splashScreen.addEventListener('click', () => {
    splashScreen.classList.remove('active');
    welcomeScreen.classList.add('active');
  });
  // Continuar após boas‑vindas leva ao lobby
  const welcomeContinueButton = document.getElementById('welcome-continue-button');
  welcomeContinueButton.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    lobbyScreen.classList.add('active');
  });
  const startButton = document.getElementById('start-button');
  startButton.addEventListener('click', () => {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    if (!name) {
      alert('Por favor, insira seu nome.');
      return;
    }
    // Atualiza dados do jogador
    engine.setPlayer(name, selectedAvatarIndex);
    // Atualiza exibição
    const playerDisplay = document.getElementById('player-name-display');
    const playerAvatarImg = document.getElementById('player-avatar');
    playerAvatarImg.src = avatars[selectedAvatarIndex].image;
    playerAvatarImg.style.display = 'inline-block';
    playerDisplay.textContent = '';
    playerDisplay.appendChild(document.createTextNode(name));
    // Transiciona para o consultório: esconde lobby, mostra office
    lobbyScreen.classList.remove('active');
    updateOfficeScreen();
    officeScreen.classList.add('active');
  });

  // Próximo caso: iniciar plantão a partir do consultório
  const nextCaseButton = document.getElementById('next-case-button');
  nextCaseButton.addEventListener('click', () => {
    officeScreen.classList.remove('active');
    gameScreen.classList.add('active');
    // Inicia jogo (se ainda não tiver iniciado)
    engine.start();
  });

  /**
   * Atualiza o consultório com as estatísticas do jogador
   */
  function updateOfficeScreen() {
    const officeAvatarEl = document.getElementById('office-avatar');
    const officePlayerNameEl = document.getElementById('office-player-name');
    const officeRankEl = document.getElementById('office-rank');
    const officeScoreEl = document.getElementById('office-score');
    const officeStatsEl = document.getElementById('office-stats');
    const rankMap = {
      1: 'Residente',
      2: 'Plantonista',
      3: 'Chefe de Plantão',
      4: 'Supervisor',
      5: 'Diretor'
    };
    const level = engine.currentLevel;
    const rankName = rankMap[level] || 'Especialista';
    officeAvatarEl.src = avatars[engine.player.avatarIndex].image;
    officeAvatarEl.style.display = 'inline-block';
    officePlayerNameEl.textContent = engine.player.name;
    officeRankEl.textContent = `Cargo: ${rankName}`;
    officeScoreEl.textContent = `Pontuação: ${engine.score}`;
    // Exibe estatísticas mais detalhadas: casos corretos, erros e gráfico de barras
    const correctCount = engine.correctCases;
    const incorrectCount = engine.incorrectCases;
    const total = correctCount + incorrectCount;
    // Calcula percentuais para barras, evitando divisão por zero
    const correctPct = total > 0 ? (correctCount / total) * 100 : 0;
    const incorrectPct = total > 0 ? (incorrectCount / total) * 100 : 0;
    // Calcula progresso de promoção baseado em número de casos corretos por nível
    // Para avançar de nível, consideramos 3 casos corretos por nível como referência.
    const casesForNextLevel = engine.currentLevel * 3;
    const progressRatio = casesForNextLevel > 0 ? Math.min(correctCount / casesForNextLevel, 1) : 0;
    const progressPct = progressRatio * 100;
    // Constrói gráfico de barras simples usando divs
    const barHtml = `
      <div class="stats-bar">
        <div class="bar-correct" style="width: ${correctPct}%;"></div>
        <div class="bar-incorrect" style="width: ${incorrectPct}%;"></div>
      </div>
    `;
    // Constrói barra de progresso para promoção
    const progressBarHtml = `
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${progressPct}%;"></div>
      </div>
      <p>Progresso para promoção: ${progressPct.toFixed(0)}%</p>
    `;
    // Define o HTML com texto, gráfico e progresso
    officeStatsEl.innerHTML = `Casos corretos: ${correctCount}, Erros: ${incorrectCount}, Total: ${total}${barHtml}${progressBarHtml}`;
  }
  // Feedback close
  ui.feedbackClose.addEventListener('click', () => {
    ui.feedbackModal.classList.add('hidden');
  });
  // Restart button
  ui.restartButton.addEventListener('click', () => {
    ui.gameOverModal.classList.add('hidden');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('lobby-screen').classList.add('active');
    // Limpa avatares selecionados e campos
    document.querySelectorAll('.avatar-item').forEach(el => el.classList.remove('selected'));
    document.querySelector('.avatar-item').classList.add('selected');
    document.getElementById('player-name').value = '';
    // Reset engine
    engine.endGame = () => {}; // no-op
  });
});
