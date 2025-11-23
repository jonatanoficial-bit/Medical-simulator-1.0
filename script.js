/* Dados do jogo */

// Avatares (use os arquivos que estão em images/)
const avatars = [
  { id: 'avatar1', name: 'Doutor 1', src: 'images/avatar1.png' },
  { id: 'avatar2', name: 'Doutor 2', src: 'images/avatar2.png' },
  { id: 'avatar3', name: 'Doutora 1', src: 'images/avatar3.png' },
  { id: 'avatar4', name: 'Doutora 2', src: 'images/avatar4.png' },
  { id: 'avatar5', name: 'Doutor 3', src: 'images/avatar5.png' },
  { id: 'avatar6', name: 'Doutora 3', src: 'images/avatar6.png' }
];

// Mapeamento de exames para imagens de fundo
const examBackgrounds = {
  'ECG': 'labs.jpg',
  'Raio X de tórax': 'xray.jpg',
  'Raio X de braço': 'xray.jpg',
  'Tomografia abdominal': 'mri.jpg',
  'Tomografia de crânio': 'mri.jpg',
  'Ultrassom abdominal': 'mri.jpg',
  'Ultrassom renal': 'mri.jpg',
  'TC de crânio': 'mri.jpg',
  'Gasometria arterial': 'labs.jpg',
  'Glicemia capilar': 'labs.jpg',
  'Exame de sangue': 'labs.jpg',
  'Exame de urina': 'labs.jpg',
  'Hemograma': 'labs.jpg',
  'Hemocultura': 'labs.jpg',
  'Lactato sérico': 'labs.jpg',
  'Teste PCR': 'labs.jpg',
  'Endoscopia digestiva alta': 'labs.jpg',
  'Angiotomografia pulmonar': 'mri.jpg',
  'Audiometria': 'labs.jpg',
  'Avaliação clínica': 'labs.jpg',
  'Ressonância magnética': 'mri.jpg'
};

// Casos clínicos. Utilize "patient_male.png" ou "patient_female.png" como avatares genéricos para pacientes.
const cases = [
  {
    patientName: 'José Almeida',
    patientImage: 'images/patient_male.png',
    symptoms: 'Dor no peito, sudorese, falta de ar.',
    history: 'Hipertenso e fumante; dor começou há 30 minutos.',
    diagnoses: ['Infarto agudo do miocárdio', 'Pneumonia', 'Colecistite'],
    correctDiagnosis: 'Infarto agudo do miocárdio',
    tests: ['ECG', 'Raio X de tórax', 'Tomografia abdominal', 'Exame de sangue'],
    correctTests: ['ECG', 'Exame de sangue'],
    testResults: {
      'ECG': 'Mostra supradesnível do segmento ST.',
      'Raio X de tórax': 'Sem alterações significativas.',
      'Tomografia abdominal': 'Sem alterações.',
      'Exame de sangue': 'Troponina elevada.'
    },
    medications: ['Aspirina', 'Nitroglicerina', 'Amoxicilina', 'Morfina'],
    correctMeds: ['Aspirina', 'Nitroglicerina']
  },
  {
    patientName: 'Maria dos Santos',
    patientImage: 'images/patient_female.png',
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
    patientName: 'Carlos Pereira',
    patientImage: 'images/patient_male.png',
    symptoms: 'Dor abdominal intensa no quadrante inferior direito, febre leve.',
    history: 'Início súbito; sem doenças prévias; náuseas e perda de apetite.',
    diagnoses: ['Apendicite', 'Cólica Renal', 'Gastrite'],
    correctDiagnosis: 'Apendicite',
    tests: ['Ultrassom abdominal', 'Tomografia abdominal', 'Exame de urina'],
    correctTests: ['Ultrassom abdominal', 'Tomografia abdominal'],
    testResults: {
      'Ultrassom abdominal': 'Apendice inflamado com diâmetro aumentado.',
      'Tomografia abdominal': 'Inflamação periapendicular.',
      'Exame de urina': 'Sem alterações.'
    },
    medications: ['Ceftriaxona', 'Metamizol', 'Hidratação intravenosa'],
    correctMeds: ['Ceftriaxona', 'Hidratação intravenosa']
  },
  {
    patientName: 'Ana Oliveira',
    patientImage: 'images/patient_female.png',
    symptoms: 'Dor de cabeça súbita, dificuldade para falar, paralisia facial à direita.',
    history: 'Hipertensa; tomou medicamento pela manhã; sem traumas recentes.',
    diagnoses: ['Acidente vascular cerebral (AVC)', 'Enxaqueca', 'Hipoglicemia'],
    correctDiagnosis: 'Acidente vascular cerebral (AVC)',
    tests: ['TC de crânio', 'ECG', 'Glicemia capilar'],
    correctTests: ['TC de crânio', 'Glicemia capilar'],
    testResults: {
      'TC de crânio': 'Área hipodensa compatível com AVC isquêmico.',
      'ECG': 'Fibrilação atrial.',
      'Glicemia capilar': 'Nível de glicose normal.'
    },
    medications: ['AAS', 'Anticoagulante', 'Insulina'],
    correctMeds: ['AAS', 'Anticoagulante']
  },
  {
    patientName: 'Ricardo Souza',
    patientImage: 'images/patient_male.png',
    symptoms: 'Sede extrema, urina frequente, dor abdominal, respiração rápida.',
    history: 'Portador de diabetes tipo 1; não aplicou insulina há 2 dias.',
    diagnoses: ['Cetoacidose diabética', 'Hipoglicemia', 'Gastrite'],
    correctDiagnosis: 'Cetoacidose diabética',
    tests: ['Glicemia capilar', 'Gasometria arterial', 'Hemograma', 'Cetonúria'],
    correctTests: ['Glicemia capilar', 'Gasometria arterial', 'Cetonúria'],
    testResults: {
      'Glicemia capilar': 'Acima de 350 mg/dL.',
      'Gasometria arterial': 'pH baixo, bicarbonato reduzido.',
      'Hemograma': 'Hematócrito elevado.',
      'Cetonúria': 'Presença de corpos cetônicos.'
    },
    medications: ['Insulina IV', 'Reposição de potássio', 'Soro fisiológico', 'Metoclopramida'],
    correctMeds: ['Insulina IV', 'Reposição de potássio', 'Soro fisiológico']
  },
  {
    patientName: 'Fernanda Lima',
    patientImage: 'images/patient_female.png',
    symptoms: 'Febre alta, tremores, respiração rápida, confusão mental.',
    history: 'Infecção urinária recente não tratada adequadamente.',
    diagnoses: ['Sepse', 'Gripe', 'Desidratação'],
    correctDiagnosis: 'Sepse',
    tests: ['Hemocultura', 'Hemograma', 'Gasometria arterial', 'Lactato sérico'],
    correctTests: ['Hemocultura', 'Hemograma', 'Lactato sérico'],
    testResults: {
      'Hemocultura': 'Crescimento de bactéria gram-negativa.',
      'Hemograma': 'Leucocitose com desvio à esquerda.',
      'Gasometria arterial': 'Acidose metabólica.',
      'Lactato sérico': 'Elevado.'
    },
    medications: ['Antibiótico de amplo espectro', 'Vasopressor', 'Soro fisiológico', 'Ibuprofeno'],
    correctMeds: ['Antibiótico de amplo espectro', 'Vasopressor', 'Soro fisiológico']
  },
  {
    patientName: 'Cláudio Menezes',
    patientImage: 'images/patient_male.png',
    symptoms: 'Tosse seca, febre, perda de olfato e paladar.',
    history: 'Sintomas iniciaram há 4 dias; contato com caso positivo de COVID-19.',
    diagnoses: ['COVID-19', 'Pneumonia viral', 'Alergia respiratória'],
    correctDiagnosis: 'COVID-19',
    tests: ['Teste PCR', 'Hemograma', 'Raio X de tórax'],
    correctTests: ['Teste PCR', 'Raio X de tórax'],
    testResults: {
      'Teste PCR': 'Positivo.',
      'Hemograma': 'Linfopenia.',
      'Raio X de tórax': 'Vidro fosco bilateral.'
    },
    medications: ['Analgesia leve', 'Antivirais', 'Hidratação oral', 'Corticóide sistêmico'],
    correctMeds: ['Analgesia leve', 'Hidratação oral', 'Corticóide sistêmico']
  },
  {
    patientName: 'Sônia Braga',
    patientImage: 'images/patient_female.png',
    symptoms: 'Dor lombar intensa, hematuria, náuseas.',
    history: 'Episódios prévios de cólica renal; sem febre.',
    diagnoses: ['Cólica renal por cálculo', 'Pielonefrite', 'Apendicite'],
    correctDiagnosis: 'Cólica renal por cálculo',
    tests: ['Ultrassom renal', 'Tomografia abdominal', 'Exame de urina'],
    correctTests: ['Ultrassom renal', 'Exame de urina'],
    testResults: {
      'Ultrassom renal': 'Cálculo em ureter distal.',
      'Tomografia abdominal': 'Cálculo ureteral evidenciado.',
      'Exame de urina': 'Hemácias numerosas.'
    },
    medications: ['Hidratação intravenosa', 'Analgesia (Diclofenaco)', 'Antibiótico', 'Tansulosina'],
    correctMeds: ['Hidratação intravenosa', 'Analgesia (Diclofenaco)', 'Tansulosina']
  },
  {
    patientName: 'Luciana Barros',
    patientImage: 'images/patient_female.png',
    symptoms: 'Rash cutâneo, urticária, dificuldade para respirar, inchaço em lábios.',
    history: 'Ingestão de camarão há 30 minutos; sem histórico de alergias graves.',
    diagnoses: ['Reação alérgica grave (anafilaxia)', 'Dermatite', 'Bronquite'],
    correctDiagnosis: 'Reação alérgica grave (anafilaxia)',
    tests: ['Oximetria', 'Exame de sangue', 'Gasometria arterial'],
    correctTests: ['Oximetria', 'Gasometria arterial'],
    testResults: {
      'Oximetria': 'Saturação de O2 em 88%.',
      'Exame de sangue': 'Histamina elevada.',
      'Gasometria arterial': 'Hipoxemia.'
    },
    medications: ['Adrenalina IM', 'Antihistamínico', 'Corticóide sistêmico', 'Insulina'],
    correctMeds: ['Adrenalina IM', 'Antihistamínico', 'Corticóide sistêmico']
  },
  {
    patientName: 'Paulo Ribeiro',
    patientImage: 'images/patient_male.png',
    symptoms: 'Náuseas, vômito com sangue, dor epigástrica em queimação.',
    history: 'Hábito de consumir álcool; uso de anti-inflamatórios; jejum prolongado.',
    diagnoses: ['Úlcera gástrica', 'Gastrite', 'Pancreatite'],
    correctDiagnosis: 'Úlcera gástrica',
    tests: ['Endoscopia digestiva alta', 'Exame de fezes', 'Ultrassom abdominal'],
    correctTests: ['Endoscopia digestiva alta'],
    testResults: {
      'Endoscopia digestiva alta': 'Lesão ulcerada no antro gástrico.',
      'Exame de fezes': 'Positivo para sangue oculto.',
      'Ultrassom abdominal': 'Normal.'
    },
    medications: ['Omeprazol', 'Sucralfato', 'Hidratação oral', 'Antibiótico'],
    correctMeds: ['Omeprazol', 'Sucralfato']
  },
  {
    patientName: 'Vitória Silva',
    patientImage: 'images/patient_female.png',
    symptoms: 'Queda, dor intensa no braço, deformidade visível.',
    history: 'Sofreu queda ao escorregar; sem doenças prévias.',
    diagnoses: ['Fratura de rádio', 'Luxação de ombro', 'Contusão'],
    correctDiagnosis: 'Fratura de rádio',
    tests: ['Raio X de braço', 'Ressonância magnética', 'Hemograma'],
    correctTests: ['Raio X de braço'],
    testResults: {
      'Raio X de braço': 'Fratura transversal em rádio distal.',
      'Ressonância magnética': 'Confirma fratura sem lesões adicionais.',
      'Hemograma': 'Normal.'
    },
    medications: ['Imobilização', 'Analgesia (Paracetamol)', 'Antibiótico', 'AAS'],
    correctMeds: ['Imobilização', 'Analgesia (Paracetamol)']
  },
  {
    patientName: 'Felipe Souza',
    patientImage: 'images/patient_male.png',
    symptoms: 'Fome, fraqueza, sudorese fria, confusão mental.',
    history: 'Diabético tipo 2; tomou insulina pela manhã, sem café da manhã.',
    diagnoses: ['Hipoglicemia', 'Hiperglicemia', 'Hipotensão'],
    correctDiagnosis: 'Hipoglicemia',
    tests: ['Glicemia capilar', 'ECG', 'Hemograma'],
    correctTests: ['Glicemia capilar'],
    testResults: {
      'Glicemia capilar': '50 mg/dL.',
      'ECG': 'Normal.',
      'Hemograma': 'Normal.'
    },
    medications: ['Glicose oral', 'Glicose IV', 'Adrenalina', 'Insulina'],
    correctMeds: ['Glicose oral', 'Glicose IV']
  },
  {
    patientName: 'Roberta Pereira',
    patientImage: 'images/patient_female.png',
    symptoms: 'Dificuldade para respirar, chiado no peito, tosse seca.',
    history: 'Crises anteriores de asma; utiliza broncodilatador frequentemente.',
    diagnoses: ['Crise asmática', 'Pneumonite química', 'Bronquite crônica'],
    correctDiagnosis: 'Crise asmática',
    tests: ['Oximetria', 'Gasometria arterial', 'Raio X de tórax'],
    correctTests: ['Oximetria', 'Gasometria arterial'],
    testResults: {
      'Oximetria': 'Saturação de O2 em 90%.',
      'Gasometria arterial': 'CO2 elevado, pH baixo.',
      'Raio X de tórax': 'Sem infiltrado.'
    },
    medications: ['Salbutamol inalatório', 'Corticóide inalatório', 'Antibiótico', 'Loratadina'],
    correctMeds: ['Salbutamol inalatório', 'Corticóide inalatório']
  },
  {
    patientName: 'Marcos Vieira',
    patientImage: 'images/patient_male.png',
    symptoms: 'Vertigem intensa, náuseas, nistagmo, zumbido.',
    history: 'Sem histórico de trauma; relatando sintoma ao girar a cabeça.',
    diagnoses: ['Labirintite', 'AVC', 'Infecção de ouvido'],
    correctDiagnosis: 'Labirintite',
    tests: ['Avaliação clínica', 'Ressonância magnética', 'Audiometria'],
    correctTests: ['Avaliação clínica', 'Audiometria'],
    testResults: {
      'Avaliação clínica': 'Testes de Dix-Hallpike positivos para vertigem.',
      'Ressonância magnética': 'Sem alterações significativas.',
      'Audiometria': 'Perda auditiva leve em alta frequência.'
    },
    medications: ['Meclizina', 'Dimenidrinato', 'Antibiótico', 'Glicose IV'],
    correctMeds: ['Meclizina', 'Dimenidrinato']
  },
  {
    patientName: 'Helena Castro',
    patientImage: 'images/patient_female.png',
    symptoms: 'Dor torácica aguda ao inspirar profundamente, falta de ar, ansiedade.',
    history: 'Recém saída de cirurgia abdominal; toma anticoagulante.',
    diagnoses: ['Embolia pulmonar', 'Pneumotórax', 'Costocondrite'],
    correctDiagnosis: 'Embolia pulmonar',
    tests: ['Angiotomografia pulmonar', 'Raio X de tórax', 'D-dímero'],
    correctTests: ['Angiotomografia pulmonar', 'D-dímero'],
    testResults: {
      'Angiotomografia pulmonar': 'Obstrução parcial de artéria pulmonar.',
      'Raio X de tórax': 'Sem colapso pulmonar.',
      'D-dímero': 'Elevado.'
    },
    medications: ['Heparina', 'Oxigênio suplementar', 'Morfina', 'Omeprazol'],
    correctMeds: ['Heparina', 'Oxigênio suplementar']
  }
];

/* Variáveis de estado */
let playerName = '';
let selectedAvatar = null;
let prestige = 0;
let correctCount = 0;
let errorCount = 0;
let level = 'Residente';
let currentCaseIndex = 0;

// Métricas específicas
let correctDiagnosisCount = 0;
let correctProceduresCount = 0;
let correctMedicationCount = 0;

/* Elementos da DOM */
const startScreen = document.getElementById('start-screen');
const nameScreen = document.getElementById('name-screen');
const directorScreen = document.getElementById('director-screen');
const consultScreen = document.getElementById('consult-screen');
const caseScreen = document.getElementById('case-screen');
const helpModal = document.getElementById('help-modal');
const examScreen = document.getElementById('exam-screen');
const examBg = document.getElementById('exam-bg');
const examNameEl = document.getElementById('exam-name');
const examResultEl = document.getElementById('exam-result');

document.getElementById('start-button').addEventListener('click', () => {
  startScreen.classList.add('hidden');
  nameScreen.classList.remove('hidden');
  populateAvatars();
});

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

function loadMetrics() {
  document.getElementById('prestige').textContent = prestige;
  document.getElementById('correct').textContent = correctCount;
  document.getElementById('errors').textContent = errorCount;
  document.getElementById('level').textContent = level;
  document.getElementById('diag-correct').textContent = correctDiagnosisCount;
  document.getElementById('exam-correct').textContent = correctProceduresCount;
  document.getElementById('med-correct').textContent = correctMedicationCount;
}

document.getElementById('help-button').addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});
document.getElementById('close-help').addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

document.getElementById('next-case').addEventListener('click', () => {
  if (currentCaseIndex >= cases.length) {
    alert('Parabéns! Você atendeu todos os casos disponíveis.');
    return;
  }
  consultScreen.classList.add('hidden');
  caseScreen.classList.remove('hidden');
  displayCase(cases[currentCaseIndex]);
});

function showExamScreen(testName, result) {
  examNameEl.textContent = testName;
  examResultEl.textContent = result;
  // define background
  const bgFile = examBackgrounds[testName] || 'labs.jpg';
  examBg.src = 'images/' + bgFile;
  caseScreen.classList.add('hidden');
  examScreen.classList.remove('hidden');
}

document.getElementById('back-to-case').addEventListener('click', () => {
  examScreen.classList.add('hidden');
  caseScreen.classList.remove('hidden');
});

// Exibe o caso atual
function displayCase(c) {
  // salva referência ao caso atual para uso no exame
  window.currentDisplayedCase = c;
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
      // se já está selecionado, alterna
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
      } else {
        btn.classList.add('selected');
        showExamScreen(test, c.testResults[test]);
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

  // Avaliação
  let diagnosisCorrect = false;
  let procedureCorrect = false;
  let medicationCorrect = false;

  if (chosenDiag.textContent === c.correctDiagnosis) {
    diagnosisCorrect = true;
  }
  // Procedimentos: todos exames corretos e nenhum extra
  const correctSet = new Set(c.correctTests);
  if (selectedTests.length === c.correctTests.length && selectedTests.every(t => correctSet.has(t))) {
    procedureCorrect = true;
  }
  // Medicações: todas medicações corretas e nenhuma extra
  const correctMedsSet = new Set(c.correctMeds);
  if (selectedMeds.length === c.correctMeds.length && selectedMeds.every(m => correctMedsSet.has(m))) {
    medicationCorrect = true;
  }
  // Pontuação e contadores
  if (diagnosisCorrect) {
    prestige += 5;
    correctDiagnosisCount++;
    correctCount++;
  } else {
    errorCount++;
  }
  if (procedureCorrect) {
    prestige += 3;
    correctProceduresCount++;
  } else {
    errorCount++;
  }
  if (medicationCorrect) {
    prestige += 2;
    correctMedicationCount++;
  } else {
    errorCount++;
  }
  // Atualiza nível com base no prestígio
  if (prestige >= 60) {
    level = 'Pleno';
  } else if (prestige >= 30) {
    level = 'Titular';
  }
  currentCaseIndex++;
  loadMetrics();
  caseScreen.classList.add('hidden');
  consultScreen.classList.remove('hidden');
});