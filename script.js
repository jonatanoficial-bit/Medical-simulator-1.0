/* Dados do jogo */

// Avatares (substitua os arquivos por suas próprias imagens na pasta assets)
const avatars = [
  { id: 'avatar1', name: 'Doutor 1', src: 'assets/avatar1.png' },
  { id: 'avatar2', name: 'Doutor 2', src: 'assets/avatar2.png' },
  { id: 'avatar3', name: 'Doutora 1', src: 'assets/avatar3.png' },
  { id: 'avatar4', name: 'Doutora 2', src: 'assets/avatar4.png' }
];

// Casos clínicos – adicione quantos casos quiser seguindo este formato
const cases = [
  {
    patientName: 'Sr. José',
    patientImage: 'assets/patient1.png',
    symptoms: 'Dor no peito, sudorese e falta de ar.',
    history: 'Hipertenso, fumante. Dor iniciou há 30 minutos.',
    diagnoses: ['Infarto agudo do miocárdio', 'Pneumonia', 'Colecistite'],
    correctDiagnosis: 'Infarto agudo do miocárdio',
    tests: ['ECG', 'Raio X de tórax', 'Tomografia abdominal'],
    correctTests: ['ECG'],
    testResults: {
      'ECG': 'Mostra supradesnível do segmento ST em derivações inferiores.',
      'Raio X de tórax': 'Sem alterações significativas.',
      'Tomografia abdominal': 'Sem alterações.'
    },
    medications: ['Aspirina', 'Nitroglicerina', 'Amoxicilina'],
    correctMeds: ['Aspirina', 'Nitroglicerina']
  },
  {
    patientName: 'Dona Maria',
    patientImage: 'assets/patient2.png',
    symptoms: 'Febre, tosse produtiva e dor torácica ao respirar.',
    history: 'Diabética, começou com tosse há 3 dias.',
    diagnoses: ['Pneumonia', 'Asma', 'Infarto agudo do miocárdio'],
    correctDiagnosis: 'Pneumonia',
    tests: ['Raio X de tórax', 'Gasometria arterial', 'ECG'],
    correctTests: ['Raio X de tórax', 'Gasometria arterial'],
    testResults: {
      'Raio X de tórax': 'Infiltrado lobar direito compatível com pneumonia.',
      'Gasometria arterial': 'Hipoxemia moderada.',
      'ECG': 'Normal.'
    },
    medications: ['Amoxicilina', 'Salbutamol', 'Morfina'],
    correctMeds: ['Amoxicilina']
  },
  // Você pode adicionar mais objetos para criar um jogo longo.
];

/* Variáveis de estado */
let playerName = '';
let selectedAvatar = null;
let prestige = 0;
let correctCount = 0;
let errorCount = 0;
let level = 'Residente';
let currentCaseIndex = 0;

/* Elementos da DOM */
const startScreen = document.getElementById('start-screen');
const nameScreen = document.getElementById('name-screen');
const directorScreen = document.getElementById('director-screen');
const consultScreen = document.getElementById('consult-screen');
const caseScreen = document.getElementById('case-screen');
const helpModal = document.getElementById('help-modal');

document.getElementById('start-button').addEventListener('click', () => {
  startScreen.classList.add('hidden');
  nameScreen.classList.remove('hidden');
  populateAvatars();
});

// Preenche a seleção de avatares
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
  const nameInput = document.getElementById('player-name').value.trim();
  if (!nameInput || !selectedAvatar) {
    alert('Informe seu nome e escolha um avatar.');
    return;
  }
  playerName = nameInput;
  nameScreen.classList.add('hidden');
  directorScreen.classList.remove('hidden');
  runDirectorDialogue();
});

// Efeito de máquina de escrever para a fala do diretor
function runDirectorDialogue() {
  const text = `Bem-vindo(a) Dr(a). ${playerName}! Temos várias emergências chegando e precisamos que assuma seu posto imediatamente. Boa sorte!`;
  const p = document.getElementById('director-text');
  p.textContent = '';
  let idx = 0;
  const interval = setInterval(() => {
    p.textContent += text[idx];
    idx++;
    if (idx >= text.length) clearInterval(interval);
  }, 50);
}

document.getElementById('go-to-consult').addEventListener('click', () => {
  directorScreen.classList.add('hidden');
  consultScreen.classList.remove('hidden');
  document.getElementById('doctor-avatar').src = selectedAvatar.src;
  loadMetrics();
});

// Carrega as métricas na tela de consultório
function loadMetrics() {
  document.getElementById('prestige').textContent = prestige;
  document.getElementById('correct').textContent = correctCount;
  document.getElementById('errors').textContent = errorCount;
  document.getElementById('level').textContent = level;
}

// Exibe ajuda
document.getElementById('help-button').addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});
document.getElementById('close-help').addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

// Próximo caso
document.getElementById('next-case').addEventListener('click', () => {
  if (currentCaseIndex >= cases.length) {
    alert('Parabéns! Você atendeu todos os casos disponíveis.');
    return;
  }
  consultScreen.classList.add('hidden');
  caseScreen.classList.remove('hidden');
  displayCase(cases[currentCaseIndex]);
});

// Exibe o caso atual
function displayCase(c) {
  document.getElementById('patient-name').textContent = c.patientName;
  document.getElementById('patient-image').src = c.patientImage;
  document.getElementById('patient-symptoms').textContent = 'Sintomas: ' + c.symptoms;
  document.getElementById('patient-history').textContent = 'Histórico: ' + c.history;
  // Diagnósticos
  const diagContainer = document.getElementById('diagnosis-options');
  diagContainer.innerHTML = '';
  c.diagnoses.forEach(diag => {
    const btn = document.createElement('div');
    btn.textContent = diag;
    btn.className = 'option';
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
    btn.textContent = test;
    btn.className = 'option';
    btn.addEventListener('click', () => {
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
      } else {
        btn.classList.add('selected');
        // Exibe resultado imediatamente
        alert('Resultado de ' + test + ': ' + c.testResults[test]);
      }
    });
    testContainer.appendChild(btn);
  });
  // Medicações
  const medContainer = document.getElementById('medication-options');
  medContainer.innerHTML = '';
  c.medications.forEach(med => {
    const btn = document.createElement('div');
    btn.textContent = med;
    btn.className = 'option';
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
    });
    medContainer.appendChild(btn);
  });
}

// Finaliza o caso e pontua
document.getElementById('finalize-case').addEventListener('click', () => {
  const c = cases[currentCaseIndex];
  const chosenDiag = document.querySelector('#diagnosis-options .option.selected');
  const selectedTests = Array.from(document.querySelectorAll('#test-options .option.selected')).map(e => e.textContent);
  const selectedMeds = Array.from(document.querySelectorAll('#medication-options .option.selected')).map(e => e.textContent);

  if (!chosenDiag) {
    alert('Selecione um diagnóstico.');
    return;
  }

  let correct = true;
  if (chosenDiag.textContent !== c.correctDiagnosis) correct = false;

  // Verifica exames corretos
  c.correctTests.forEach(t => {
    if (!selectedTests.includes(t)) correct = false;
  });

  // Verifica medicamentos corretos
  c.correctMeds.forEach(m => {
    if (!selectedMeds.includes(m)) correct = false;
  });

  if (correct) {
    prestige += 10;
    correctCount++;
    alert('Diagnóstico correto!');
  } else {
    errorCount++;
    prestige = Math.max(0, prestige - 5);
    alert('Diagnóstico incorreto.');
  }
  // Atualiza nível
  if (correctCount >= 5 && level === 'Residente') level = 'Titular';
  if (correctCount >= 10 && level === 'Titular') level = 'Pleno';

  currentCaseIndex++;
  loadMetrics();
  caseScreen.classList.add('hidden');
  consultScreen.classList.remove('hidden');
});
