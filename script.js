/* ===== DADOS DO JOGO ===== */

// Avatares de médico (seus arquivos em /images)
const avatars = [
  { id: 'avatar1', name: 'Doutor 1', src: 'images/avatar1.png' },
  { id: 'avatar2', name: 'Doutor 2', src: 'images/avatar2.png' },
  { id: 'avatar3', name: 'Doutora 1', src: 'images/avatar3.png' },
  { id: 'avatar4', name: 'Doutora 2', src: 'images/avatar4.png' },
  { id: 'avatar5', name: 'Doutor 3', src: 'images/avatar5.png' },
  { id: 'avatar6', name: 'Doutora 3', src: 'images/avatar6.png' }
];

// Mapeia gênero do paciente para avatar genérico em quadrinhos
function getPatientImage(gender) {
  if (gender === 'F') return 'images/patient_female.png';
  return 'images/patient_male.png';
}

// Casos clínicos (resumidos para caber aqui – você pode adicionar mais no mesmo padrão)
const cases = [
  {
    gender: 'M',
    patientName: 'José Almeida',
    symptoms: 'Dor no peito, sudorese, falta de ar.',
    history: 'Hipertenso e fumante; dor começou há 30 minutos.',
    diagnoses: ['Infarto agudo do miocárdio', 'Pneumonia', 'Colecistite'],
    correctDiagnosis: 'Infarto agudo do miocárdio',
    tests: ['ECG', 'Raio X de tórax', 'Tomografia abdominal', 'Exame de sangue'],
    correctTests: ['ECG', 'Exame de sangue'],
    testResults: {
      'ECG': 'Supradesnível de ST em derivações inferiores.',
      'Raio X de tórax': 'Sem alterações significativas.',
      'Tomografia abdominal': 'Sem alterações.',
      'Exame de sangue': 'Troponina elevada.'
    },
    medications: ['Aspirina', 'Nitroglicerina', 'Amoxicilina', 'Morfina'],
    correctMeds: ['Aspirina', 'Nitroglicerina']
  },
  {
    gender: 'F',
    patientName: 'Maria dos Santos',
    symptoms: 'Febre, tosse com catarro, dor ao respirar.',
    history: 'Diabética; tosse há 3 dias; sem alergias conhecidas.',
    diagnoses: ['Pneumonia', 'Asma', 'Bronquite'],
    correctDiagnosis: 'Pneumonia',
    tests: ['Raio X de tórax', 'Gasometria arterial', 'ECG', 'Hemograma'],
    correctTests: ['Raio X de tórax', 'Gasometria arterial', 'Hemograma'],
    testResults: {
      'Raio X de tórax': 'Infiltrado lobar direito.',
      'Gasometria arterial': 'Hipoxemia moderada.',
      'ECG': 'Normal.',
      'Hemograma': 'Leucocitose.'
    },
    medications: ['Amoxicilina', 'Salbutamol', 'Morfina', 'Ceftriaxona'],
    correctMeds: ['Amoxicilina', 'Ceftriaxona']
  },
  {
gender: "M",
patientName: "José Almeida",
symptoms: "Dor no peito intensa, sudorese e falta de ar.",
history: "Hipertensão e tabagismo. Dor iniciou há 30 minutos, irradiando para braço esquerdo.",
diagnoses: ["Infarto agudo do miocárdio", "Pneumonia", "Crise de ansiedade"],
correctDiagnosis: "Infarto agudo do miocárdio",
exams: ["ECG", "Exame de sangue (troponina)", "Raio X de tórax"],
correctExams: ["ECG", "Exame de sangue (troponina)"],
medications: ["AAS", "Clopidogrel", "Morfina", "Oxigênio"],
correctMedications: ["AAS", "Clopidogrel", "Oxigênio"],
outcome: "O paciente foi estabilizado após conduta adequada.",
image: "patient_male.png"
},
{
gender: "F",
patientName: "Maria Fernanda Silva",
symptoms: "Febre, tosse produtiva e dor no peito ao respirar.",
history: "Quadro iniciado há 3 dias. Relata cansaço e falta de apetite.",
diagnoses: ["Pneumonia", "Tuberculose", "Asma"],
correctDiagnosis: "Pneumonia",
exams: ["Raio X de tórax", "Exame de sangue", "Oximetria"],
correctExams: ["Raio X de tórax", "Exame de sangue"],
medications: ["Amoxicilina", "Azitromicina", "Hidratação"],
correctMedications: ["Amoxicilina", "Hidratação"],
outcome: "Paciente respondeu bem ao tratamento inicial.",
image: "patient_female.png"
},
{
gender: "M",
patientName: "Carlos Pontes",
symptoms: "Dor abdominal intensa no lado direito, febre e náuseas.",
history: "Dor começou há 8 horas e vem piorando.",
diagnoses: ["Apendicite", "Gastrite", "Cólica renal"],
correctDiagnosis: "Apendicite",
exams: ["Ultrassom abdominal", "Exame de sangue", "Tomografia"],
correctExams: ["Exame de sangue", "Ultrassom abdominal"],
medications: ["Dipirona", "Tramadol", "Ceftriaxona"],
correctMedications: ["Dipirona", "Ceftriaxona"],
outcome: "Paciente encaminhado para cirurgia.",
image: "patient_male.png"
},
{
gender: "F",
patientName: "Patrícia Nogueira",
symptoms: "Crises de falta de ar, chiado no peito e tosse.",
history: "Histórico de asma. Piora após exposição ao clima seco.",
diagnoses: ["Crise asmática", "Pneumonia", "Ansiedade"],
correctDiagnosis: "Crise asmática",
exams: ["Oximetria", "Raio X de tórax"],
correctExams: ["Oximetria"],
medications: ["Salbutamol", "Prednisona"],
correctMedications: ["Salbutamol", "Prednisona"],
outcome: "Paciente melhorou após broncodilatador.",
image: "patient_female.png"
},
{
gender: "M",
patientName: "Eduardo Reis",
symptoms: "Vômitos, diarreia e tontura.",
history: "Comeu comida suspeita em restaurante.",
diagnoses: ["Gastroenterite", "Intoxicação medicamentosa", "Apendicite"],
correctDiagnosis: "Gastroenterite",
exams: ["Exame de sangue", "Hidratação venosa"],
correctExams: ["Exame de sangue"],
medications: ["Soro", "Plasil"],
correctMedications: ["Soro", "Plasil"],
outcome: "Paciente reidratado e estável.",
image: "patient_male.png"
},
{
gender: "F",
patientName: "Letícia Moura",
symptoms: "Dor lombar forte que irradia para a virilha.",
history: "Início súbito há 2 horas.",
diagnoses: ["Cólica renal", "Apendicite", "Infecção urinária"],
correctDiagnosis: "Cólica renal",
exams: ["Ultrassom renal", "Urina tipo 1"],
correctExams: ["Ultrassom renal", "Urina tipo 1"],
medications: ["Tramadol", "Cetoprofeno"],
correctMedications: ["Cetoprofeno"],
outcome: "Cálculo identificado, orientado tratamento.",
image: "patient_female.png"
},
{
gender: "M",
patientName: "Rafael Batista",
symptoms: "Dor no peito ao respirar, febre e cansaço.",
history: "Ex-morador de rua, tosse prolongada.",
diagnoses: ["Tuberculose", "Pneumonia", "Asma"],
correctDiagnosis: "Tuberculose",
exams: ["Raio X", "Escarro BAAR"],
correctExams: ["Raio X", "Escarro BAAR"],
medications: ["Rifampicina", "Isoniazida"],
correctMedications: ["Rifampicina", "Isoniazida"],
outcome: "Encaminhado ao serviço especializado.",
image: "patient_male.png"
},
{
gender: "F",
patientName: "Juliana Ramos",
symptoms: "Desmaio, tontura e palidez.",
history: "Menstruação intensa nos últimos dias.",
diagnoses: ["Anemia", "Hipoglicemia", "Arritmia"],
correctDiagnosis: "Anemia",
exams: ["Hemograma completo"],
correctExams: ["Hemograma completo"],
medications: ["Sulfato ferroso"],
correctMedications: ["Sulfato ferroso"],
outcome: "Reposição adequada iniciada.",
image: "patient_female.png"
},
{
gender: "M",
patientName: "Pedro Carvalho",
symptoms: "Dor de cabeça intensa, febre alta, manchas vermelhas.",
history: "Mora em área com casos de dengue.",
diagnoses: ["Dengue", "Zika", "COVID"],
correctDiagnosis: "Dengue",
exams: ["Hemograma", "Plaquetas"],
correctExams: ["Hemograma", "Plaquetas"],
medications: ["Soro", "Dipirona"],
correctMedications: ["Soro"],
outcome: "Risco de dengue grave monitorado.",
image: "patient_male.png"
},
{
gender: "F",
patientName: "Aline Torres",
symptoms: "Dor ao urinar, febre leve, urina turva.",
history: "Sintomas começaram ontem.",
diagnoses: ["Infecção urinária", "Cólica renal", "Cistite crônica"],
correctDiagnosis: "Infecção urinária",
exams: ["Urina tipo 1", "Urocultura"],
correctExams: ["Urina tipo 1"],
medications: ["Nitrofurantoína"],
correctMedications: ["Nitrofurantoína"],
outcome: "Tratamento iniciado com antibiótico.",
image: "patient_female.png"
}
  {
  // (... aqui você podecopiar e colar todos os outros casos que criamos antes ...)
];

/* ===== VARIÁVEIS DE ESTADO ===== */
let playerName = '';
let selectedAvatar = null;
let currentCaseIndex = 0;

// Estatísticas
let prestige = 0;
let correctCases = 0;
let wrongCases = 0;

let diagCorrect = 0;
let diagWrong = 0;
let testsCorrect = 0;
let testsWrong = 0;
let medsCorrect = 0;
let medsWrong = 0;
let level = 'Residente';

/* ===== ELEMENTOS ===== */
const startScreen = document.getElementById('start-screen');
const nameScreen = document.getElementById('name-screen');
const directorScreen = document.getElementById('director-screen');
const consultScreen = document.getElementById('consult-screen');
const caseScreen = document.getElementById('case-screen');
const examScreen = document.getElementById('exam-screen');
const helpPopup = document.getElementById('help-popup');

// ===== TELA INICIAL =====
document.getElementById('start-button').addEventListener('click', () => {
  startScreen.classList.add('hidden');
  nameScreen.classList.remove('hidden');
  populateAvatars();
});

// ===== SELEÇÃO DE AVATAR =====
function populateAvatars() {
  const container = document.getElementById('avatar-selection');
  container.innerHTML = '';
  avatars.forEach(av => {
    const img = document.createElement('img');
    img.src = av.src;
    img.alt = av.name;
    img.dataset.id = av.id;
    img.addEventListener('click', () => {
      document.querySelectorAll('#avatar-selection img').forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      selectedAvatar = av;
    });
    container.appendChild(img);
  });
}

document.getElementById('continue-button').addEventListener('click', () => {
  const name = document.getElementById('player-name').value.trim();
  if (!name || !selectedAvatar) {
    alert('Informe seu nome e escolha um avatar.');
    return;
  }
  playerName = name;
  nameScreen.classList.add('hidden');
  directorScreen.classList.remove('hidden');
  runDirectorDialogue();
});

// ===== TEXTO DO DIRETOR (MÁQUINA DE ESCREVER) =====
function runDirectorDialogue() {
  const text = `Bem-vindo(a), Dr(a). ${playerName}! Temos várias emergências chegando e precisamos que assuma seu posto imediatamente no pronto socorro. Boa sorte!`;
  const p = document.getElementById('director-text');
  p.textContent = '';
  let idx = 0;
  const interval = setInterval(() => {
    p.textContent += text[idx];
    idx++;
    if (idx >= text.length) clearInterval(interval);
  }, 40);
}

document.getElementById('go-to-consult').addEventListener('click', () => {
  directorScreen.classList.add('hidden');
  consultScreen.classList.remove('hidden');
  document.getElementById('doctor-avatar').src = selectedAvatar.src;
  updateMetrics();
});

// ===== POP-UP DE AJUDA =====
document.getElementById('help-button').addEventListener('click', () => {
  helpPopup.classList.remove('hidden');
});

document.getElementById('close-help').addEventListener('click', () => {
  helpPopup.classList.add('hidden');
});

// ===== CONSULTÓRIO: PRÓXIMO CASO =====
document.getElementById('next-case').addEventListener('click', () => {
  if (currentCaseIndex >= cases.length) {
    alert('Você atendeu todos os casos disponíveis nesta versão.');
    return;
  }
  showCase(cases[currentCaseIndex]);
  consultScreen.classList.add('hidden');
  caseScreen.classList.remove('hidden');
});

// ===== EXIBE CASO =====
function showCase(c) {
  document.getElementById('patient-name').textContent = c.patientName;
  document.getElementById('patient-image').src = getPatientImage(c.gender);
  document.getElementById('patient-symptoms').textContent = 'Sintomas: ' + c.symptoms;
  document.getElementById('patient-history').textContent = 'Histórico: ' + c.history;

  // Diagnósticos
  const diagContainer = document.getElementById('diagnosis-options');
  diagContainer.innerHTML = '';
  c.diagnoses.forEach(diag => {
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.textContent = diag;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#diagnosis-options .option').forEach(o => o.classList.remove('selected'));
      btn.classList.add('selected');
    });
    diagContainer.appendChild(btn);
  });

  // Exames
  const testContainer = document.getElementById('test-options');
  testContainer.innerHTML = '';
  c.tests.forEach(test => {
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.textContent = test;
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      openExamScreen(test, c.testResults[test] || 'Resultado não disponível.');
    });
    testContainer.appendChild(btn);
  });

  // Medicações
  const medContainer = document.getElementById('medication-options');
  medContainer.innerHTML = '';
  c.medications.forEach(med => {
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.textContent = med;
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
    });
    medContainer.appendChild(btn);
  });
}

// ===== TELA DE EXAME =====
function getExamBackground(examName) {
  const lower = examName.toLowerCase();
  if (lower.includes('raio x') || lower.includes('radiografia')) {
    return 'images/xray.jpg';
  }
  if (lower.includes('ressonância') || lower.includes('rm') || lower.includes('angiotomografia')) {
    return 'images/mri.jpg';
  }
  return 'images/labs.jpg';
}

function openExamScreen(examName, resultText) {
  const bg = getExamBackground(examName);
  document.getElementById('exam-background').src = bg;
  document.getElementById('exam-title').textContent = examName;
  document.getElementById('exam-result').textContent = resultText;

  caseScreen.classList.add('hidden');
  examScreen.classList.remove('hidden');
}

document.getElementById('back-to-case').addEventListener('click', () => {
  examScreen.classList.add('hidden');
  caseScreen.classList.remove('hidden');
});

// ===== FINALIZAR CASO =====
document.getElementById('finalize-case').addEventListener('click', () => {
  const c = cases[currentCaseIndex];

  const chosenDiagEl = document.querySelector('#diagnosis-options .option.selected');
  if (!chosenDiagEl) {
    alert('Selecione um diagnóstico.');
    return;
  }
  const chosenDiag = chosenDiagEl.textContent;

  const selectedTests = Array.from(document.querySelectorAll('#test-options .option.selected')).map(e => e.textContent);
  const selectedMeds = Array.from(document.querySelectorAll('#medication-options .option.selected')).map(e => e.textContent);

  // Avaliação
  const diagIsCorrect = chosenDiag === c.correctDiagnosis;
  const testsIsCorrect = compareSets(selectedTests, c.correctTests);
  const medsIsCorrect = compareSets(selectedMeds, c.correctMeds);

  // Atualiza estatísticas detalhadas
  if (diagIsCorrect) diagCorrect++; else diagWrong++;
  if (testsIsCorrect) testsCorrect++; else testsWrong++;
  if (medsIsCorrect) medsCorrect++; else medsWrong++;

  // Prestígio
  if (diagIsCorrect) prestige += 10; else prestige -= 5;
  if (testsIsCorrect) prestige += 5; else prestige -= 3;
  if (medsIsCorrect) prestige += 5; else prestige -= 3;
  if (prestige < 0) prestige = 0;

  // Caso geral
  if (diagIsCorrect && testsIsCorrect && medsIsCorrect) {
    correctCases++;
    alert('Caso concluído com sucesso! Diagnóstico, exames e tratamento corretos.');
  } else {
    wrongCases++;
    let msg = 'Caso finalizado.\n';
    msg += `Diagnóstico: ${diagIsCorrect ? 'correto' : 'incorreto'}\n`;
    msg += `Exames: ${testsIsCorrect ? 'adequados' : 'inadequados'}\n`;
    msg += `Medicação: ${medsIsCorrect ? 'adequada' : 'inadequada'}`;
    alert(msg);
  }

  // Nível
  if (prestige >= 60) level = 'Pleno';
  else if (prestige >= 30) level = 'Titular';
  else level = 'Residente';

  updateMetrics();

  currentCaseIndex++;
  caseScreen.classList.add('hidden');
  consultScreen.classList.remove('hidden');
});

// Compara duas listas sem considerar ordem (e sem permitir extras)
function compareSets(selected, correct) {
  if (selected.length !== correct.length) return false;
  return correct.every(item => selected.includes(item));
}

// Atualiza HUD do consultório
function updateMetrics() {
  document.getElementById('prestige').textContent = prestige;
  document.getElementById('correct-cases').textContent = correctCases;
  document.getElementById('wrong-cases').textContent = wrongCases;
  document.getElementById('level').textContent = level;
  document.getElementById('diag-stats').textContent = `${diagCorrect} / ${diagWrong}`;
  document.getElementById('test-stats').textContent = `${testsCorrect} / ${testsWrong}`;
  document.getElementById('med-stats').textContent = `${medsCorrect} / ${medsWrong}`;
}
