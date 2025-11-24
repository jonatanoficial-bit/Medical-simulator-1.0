/* ============================
   SIMULADOR MÉDICO – PRONTO SOCORRO
   script.js
   ============================ */

/* ==== AVATARES DO MÉDICO ==== */

const avatars = [
  { id: 'avatar1', name: 'Doutor 1', src: 'images/avatar1.png' },
  { id: 'avatar2', name: 'Doutor 2', src: 'images/avatar2.png' },
  { id: 'avatar3', name: 'Doutora 1', src: 'images/avatar3.png' },
  { id: 'avatar4', name: 'Doutora 2', src: 'images/avatar4.png' },
  { id: 'avatar5', name: 'Doutor 3', src: 'images/avatar5.png' },
  { id: 'avatar6', name: 'Doutora 3', src: 'images/avatar6.png' }
];

// Avatar de paciente (masculino/feminino) – você já cria essas imagens
function getPatientImage(gender) {
  if (gender === 'F') return 'images/patient_female.png';
  return 'images/patient_male.png';
}

/* =======================================
   CASOS CLÍNICOS (COM ESPECIALIDADES)
   =======================================

   Modelo de caso para você copiar/colar mais tarde:

   {
     specialty: 'Cardiologia',
     gender: 'M', // ou 'F'
     patientName: 'Nome',
     symptoms: 'Sintomas principais.',
     history: 'História clínica (comorbidades, tempo de sintomas etc.).',
     diagnoses: ['Diagnóstico A', 'Diagnóstico B', 'Diagnóstico C'],
     correctDiagnosis: 'Diagnóstico A',
     tests: ['Exame 1', 'Exame 2', 'Exame 3'],
     correctTests: ['Exame 1', 'Exame 3'],
     testResults: {
       'Exame 1': 'Resultado detalhado...',
       'Exame 2': 'Resultado...',
       'Exame 3': 'Resultado...'
     },
     medications: ['Medicação 1', 'Medicação 2', 'Medicação 3'],
     correctMeds: ['Medicação 1', 'Medicação 3']
   }

*/

const cases = [
  /* ===== CARDIOLOGIA ===== */
  {
    specialty: 'Cardiologia',
    gender: 'M',
    patientName: 'José Almeida',
    symptoms: 'Dor no peito intensa, sudorese e falta de ar.',
    history: '58 anos, hipertenso e fumante. Dor iniciou há 30 minutos e irradia para o braço esquerdo.',
    diagnoses: ['Infarto agudo do miocárdio', 'Pneumonia', 'Crise de ansiedade'],
    correctDiagnosis: 'Infarto agudo do miocárdio',
    tests: ['ECG', 'Exame de sangue (troponina)', 'Raio X de tórax'],
    correctTests: ['ECG', 'Exame de sangue (troponina)'],
    testResults: {
      'ECG': 'Supradesnível de ST em derivações inferiores.',
      'Exame de sangue (troponina)': 'Troponina significativamente elevada.',
      'Raio X de tórax': 'Sem alterações significativas.'
    },
    medications: ['AAS', 'Clopidogrel', 'Morfina', 'Oxigênio'],
    correctMeds: ['AAS', 'Clopidogrel', 'Oxigênio']
  },
  {
    specialty: 'Cardiologia',
    gender: 'M',
    patientName: 'Carlos Pereira',
    symptoms: 'Dor torácica em aperto aos esforços, alívio em repouso.',
    history: '50 anos, tabagista, dislipidêmico. Dor há 2 meses, piorando.',
    diagnoses: ['Angina estável', 'Refluxo gastroesofágico', 'Costocondrite'],
    correctDiagnosis: 'Angina estável',
    tests: ['ECG em repouso', 'Teste ergométrico', 'Perfil lipídico'],
    correctTests: ['ECG em repouso', 'Teste ergométrico'],
    testResults: {
      'ECG em repouso': 'Alterações discretas de repolarização.',
      'Teste ergométrico': 'Isquemia miocárdica desencadeada ao esforço.',
      'Perfil lipídico': 'LDL elevado.'
    },
    medications: ['AAS', 'Nitrato sublingual', 'Estatina'],
    correctMeds: ['AAS', 'Nitrato sublingual', 'Estatina']
  },
  {
    specialty: 'Cardiologia',
    gender: 'F',
    patientName: 'Camila Duarte',
    symptoms: 'Dor torácica em aperto, desencadeada por esforço físico.',
    history: '42 anos, sedentária, sobrepeso, pai com infarto precoce.',
    diagnoses: ['Angina estável', 'Ansiedade', 'Pericardite'],
    correctDiagnosis: 'Angina estável',
    tests: ['ECG em repouso', 'Teste ergométrico'],
    correctTests: ['ECG em repouso', 'Teste ergométrico'],
    testResults: {
      'ECG em repouso': 'Alterações discretas de ST.',
      'Teste ergométrico': 'Desnível de ST durante esforço.'
    },
    medications: ['AAS', 'Nitrato sublingual', 'Betabloqueador'],
    correctMeds: ['AAS', 'Nitrato sublingual', 'Betabloqueador']
  },
  {
    specialty: 'Cardiologia',
    gender: 'M',
    patientName: 'Lucas Andrade',
    symptoms: 'Dor de cabeça súbita intensa, vômitos e sonolência.',
    history: 'Hipertenso mal controlado, não toma medicação há semanas.',
    diagnoses: ['AVC hemorrágico', 'Enxaqueca', 'Crise hipertensiva sem lesão'],
    correctDiagnosis: 'AVC hemorrágico',
    tests: ['TC de crânio', 'Pressão arterial'],
    correctTests: ['TC de crânio'],
    testResults: {
      'TC de crânio': 'Sangramento intracerebral em região gangliobasal.',
      'Pressão arterial': 'Valores persistentemente elevados.'
    },
    medications: ['Controle rigoroso da pressão', 'Suporte em UTI'],
    correctMeds: ['Controle rigoroso da pressão', 'Suporte em UTI']
  },

  /* ===== PNEUMO / INFECTO ===== */
  {
    specialty: 'Pneumologia / Infectologia',
    gender: 'F',
    patientName: 'Maria Fernanda Silva',
    symptoms: 'Febre, tosse com catarro e dor ao respirar fundo.',
    history: 'Quadro iniciado há 3 dias, com cansaço e perda de apetite.',
    diagnoses: ['Pneumonia', 'Tuberculose', 'Asma'],
    correctDiagnosis: 'Pneumonia',
    tests: ['Raio X de tórax', 'Hemograma', 'Oximetria'],
    correctTests: ['Raio X de tórax', 'Hemograma'],
    testResults: {
      'Raio X de tórax': 'Infiltrado pulmonar em lobo inferior direito.',
      'Hemograma': 'Leucocitose com desvio à esquerda.',
      'Oximetria': 'Saturação em 93% em ar ambiente.'
    },
    medications: ['Amoxicilina', 'Ceftriaxona', 'Hidratação venosa'],
    correctMeds: ['Amoxicilina', 'Hidratação venosa']
  },
  {
    specialty: 'Pneumologia / Infectologia',
    gender: 'M',
    patientName: 'Rafael Batista',
    symptoms: 'Tosse crônica, emagrecimento e sudorese noturna.',
    history: 'Ex-morador de rua, vive em abrigo; tosse há mais de 1 mês.',
    diagnoses: ['Tuberculose pulmonar', 'Pneumonia', 'Bronquite crônica'],
    correctDiagnosis: 'Tuberculose pulmonar',
    tests: ['Raio X de tórax', 'Baciloscopia de escarro (BAAR)'],
    correctTests: ['Raio X de tórax', 'Baciloscopia de escarro (BAAR)'],
    testResults: {
      'Raio X de tórax': 'Infiltrados em ápice pulmonar com cavitações.',
      'Baciloscopia de escarro (BAAR)': 'Positiva para bacilos álcool-ácido resistentes.'
    },
    medications: ['Rifampicina', 'Isoniazida', 'Pirazinamida', 'Etambutol'],
    correctMeds: ['Rifampicina', 'Isoniazida', 'Pirazinamida', 'Etambutol']
  },
  {
    specialty: 'Pneumologia / Infectologia',
    gender: 'M',
    patientName: 'Bruno Ferreira',
    symptoms: 'Febre, tosse seca, perda de olfato e paladar.',
    history: 'Contato recente com colega com COVID-19.',
    diagnoses: ['COVID-19', 'Gripe comum', 'Alergia respiratória'],
    correctDiagnosis: 'COVID-19',
    tests: ['Teste PCR', 'Raio X de tórax', 'Hemograma'],
    correctTests: ['Teste PCR', 'Raio X de tórax'],
    testResults: {
      'Teste PCR': 'Positivo para SARS-CoV-2.',
      'Raio X de tórax': 'Infiltrados em vidro fosco bilaterais.',
      'Hemograma': 'Linfopenia.'
    },
    medications: ['Suporte com hidratação', 'Antipirético', 'Oxigênio se necessário'],
    correctMeds: ['Suporte com hidratação', 'Antipirético', 'Oxigênio se necessário']
  },
  {
    specialty: 'Pneumologia / Infectologia',
    gender: 'M',
    patientName: 'Pedro Carvalho',
    symptoms: 'Febre alta, dor de cabeça, dor atrás dos olhos e manchas vermelhas pelo corpo.',
    history: 'Mora em área endêmica para dengue; sintomas há 3 dias.',
    diagnoses: ['Dengue', 'Zika', 'COVID-19'],
    correctDiagnosis: 'Dengue',
    tests: ['Hemograma', 'Plaquetas', 'Teste rápido para dengue'],
    correctTests: ['Hemograma', 'Plaquetas', 'Teste rápido para dengue'],
    testResults: {
      'Hemograma': 'Hemoconcentração e leucopenia.',
      'Plaquetas': 'Trombocitopenia moderada.',
      'Teste rápido para dengue': 'Positivo.'
    },
    medications: ['Soro venoso', 'Paracetamol'],
    correctMeds: ['Soro venoso', 'Paracetamol']
  },

  /* ===== GASTRO / ABDOMINAL ===== */
  {
    specialty: 'Cirurgia Geral / Abdome',
    gender: 'M',
    patientName: 'Carlos Pontes',
    symptoms: 'Dor abdominal intensa no quadrante inferior direito, febre e náuseas.',
    history: 'Dor iniciou há 8 horas e vem piorando lentamente.',
    diagnoses: ['Apendicite aguda', 'Gastrite', 'Cólica renal'],
    correctDiagnosis: 'Apendicite aguda',
    tests: ['Hemograma', 'Ultrassom abdominal', 'Tomografia abdominal'],
    correctTests: ['Hemograma', 'Ultrassom abdominal'],
    testResults: {
      'Hemograma': 'Leucocitose com desvio à esquerda.',
      'Ultrassom abdominal': 'Apendice espessado com líquido ao redor.',
      'Tomografia abdominal': 'Inflamação periapendicular evidente.'
    },
    medications: ['Dipirona', 'Ceftriaxona', 'Metronidazol'],
    correctMeds: ['Dipirona', 'Ceftriaxona', 'Metronidazol']
  },
  {
    specialty: 'Gastroenterologia',
    gender: 'M',
    patientName: 'André Lima',
    symptoms: 'Dor epigástrica em queimação, pior à noite e em jejum.',
    history: 'Uso crônico de anti-inflamatórios, etilista.',
    diagnoses: ['Úlcera gástrica', 'Gastrite leve', 'Refluxo'],
    correctDiagnosis: 'Úlcera gástrica',
    tests: ['Endoscopia digestiva alta', 'Hemograma'],
    correctTests: ['Endoscopia digestiva alta', 'Hemograma'],
    testResults: {
      'Endoscopia digestiva alta': 'Lesão ulcerada em antro gástrico.',
      'Hemograma': 'Anemia leve.'
    },
    medications: ['Inibidor de bomba de prótons (IBP)', 'Suspender AINE', 'Sucralfato'],
    correctMeds: ['Inibidor de bomba de prótons (IBP)', 'Suspender AINE', 'Sucralfato']
  },
  {
    specialty: 'Gastroenterologia',
    gender: 'M',
    patientName: 'Paulo Ribeiro',
    symptoms: 'Vômitos com sangue, dor em queimação no estômago, fraqueza.',
    history: 'Uso crônico de anti-inflamatórios, etilista social.',
    diagnoses: ['Úlcera gástrica hemorrágica', 'Gastrite simples', 'Pancreatite'],
    correctDiagnosis: 'Úlcera gástrica hemorrágica',
    tests: ['Endoscopia digestiva alta', 'Hemograma'],
    correctTests: ['Endoscopia digestiva alta', 'Hemograma'],
    testResults: {
      'Endoscopia digestiva alta': 'Lesão ulcerada com sangramento ativo.',
      'Hemograma': 'Anemia moderada.'
    },
    medications: ['IBP intravenoso', 'Suspender AINE', 'Transfusão se necessário'],
    correctMeds: ['IBP intravenoso', 'Suspender AINE', 'Transfusão se necessário']
  },
  {
    specialty: 'Clínica Médica',
    gender: 'M',
    patientName: 'Eduardo Reis',
    symptoms: 'Vômitos, diarreia aquosa e tontura.',
    history: 'Ingestão de alimento suspeito em restaurante de rua há 12 horas.',
    diagnoses: ['Gastroenterite infecciosa', 'Intoxicação medicamentosa', 'Apendicite'],
    correctDiagnosis: 'Gastroenterite infecciosa',
    tests: ['Hemograma', 'Ionograma'],
    correctTests: ['Hemograma', 'Ionograma'],
    testResults: {
      'Hemograma': 'Hemoconcentração leve.',
      'Ionograma': 'Sódio e potássio discretamente alterados.'
    },
    medications: ['Soro venoso', 'Antiemético (ondansetrona)', 'Antibiótico'],
    correctMeds: ['Soro venoso', 'Antiemético (ondansetrona)']
  },

  /* ===== ENDOCRINO / METABÓLICO ===== */
  {
    specialty: 'Endocrinologia',
    gender: 'M',
    patientName: 'Felipe Souza',
    symptoms: 'Sudorese fria, tremores, confusão e fome intensa.',
    history: 'Diabético em uso de insulina; refeição atrasada.',
    diagnoses: ['Hipoglicemia', 'Hiperglicemia', 'Crise de ansiedade'],
    correctDiagnosis: 'Hipoglicemia',
    tests: ['Glicemia capilar'],
    correctTests: ['Glicemia capilar'],
    testResults: {
      'Glicemia capilar': '45 mg/dL.'
    },
    medications: ['Glicose oral', 'Glicose venosa', 'Insulina'],
    correctMeds: ['Glicose oral', 'Glicose venosa']
  },
  {
    specialty: 'Endocrinologia',
    gender: 'M',
    patientName: 'Ricardo Souza',
    symptoms: 'Respiração rápida, sede intensa, dor abdominal e hálito cetônico.',
    history: 'Diabetes tipo 1; parou insulina há 2 dias.',
    diagnoses: ['Cetoacidose diabética', 'Hipoglicemia', 'Gastrite'],
    correctDiagnosis: 'Cetoacidose diabética',
    tests: ['Glicemia capilar', 'Gasometria arterial', 'Cetonúria', 'Eletrólitos'],
    correctTests: ['Glicemia capilar', 'Gasometria arterial', 'Cetonúria', 'Eletrólitos'],
    testResults: {
      'Glicemia capilar': 'Acima de 400 mg/dL.',
      'Gasometria arterial': 'pH baixo com bicarbonato reduzido.',
      'Cetonúria': 'Altos níveis de corpos cetônicos.',
      'Eletrólitos': 'Potássio alterado.'
    },
    medications: ['Insulina intravenosa', 'Soro venoso', 'Reposição de potássio'],
    correctMeds: ['Insulina intravenosa', 'Soro venoso', 'Reposição de potássio']
  },
  {
    specialty: 'Endocrinologia',
    gender: 'F',
    patientName: 'Bruna Teixeira',
    symptoms: 'Palpitações, perda de peso, tremores e intolerância ao calor.',
    history: 'Sintomas há alguns meses, sem tratamento.',
    diagnoses: ['Tireotoxicose (hipertireoidismo)', 'Crise de pânico', 'Anemia'],
    correctDiagnosis: 'Tireotoxicose (hipertireoidismo)',
    tests: ['TSH', 'T4 livre', 'ECG'],
    correctTests: ['TSH', 'T4 livre', 'ECG'],
    testResults: {
      'TSH': 'Suprimido.',
      'T4 livre': 'Elevado.',
      'ECG': 'Taquicardia sinusal.'
    },
    medications: ['Betabloqueador', 'Antitireoidiano', 'Ansiolítico isolado'],
    correctMeds: ['Betabloqueador', 'Antitireoidiano']
  },

  /* ===== NEUROLOGIA ===== */
  {
    specialty: 'Neurologia',
    gender: 'M',
    patientName: 'João Batista',
    symptoms: 'Febre alta, dor de cabeça intensa e rigidez de nuca.',
    history: 'Sintomas iniciados há 24 horas, em piora progressiva.',
    diagnoses: ['Meningite bacteriana', 'Enxaqueca', 'Sinusite'],
    correctDiagnosis: 'Meningite bacteriana',
    tests: ['Tomografia de crânio', 'Punção lombar', 'Hemocultura'],
    correctTests: ['Punção lombar', 'Hemocultura'],
    testResults: {
      'Tomografia de crânio': 'Sem sinais de hipertensão intracraniana grave.',
      'Punção lombar': 'Líquor turvo, com aumento de leucócitos e proteínas.',
      'Hemocultura': 'Bactéria gram-positiva isolada.'
    },
    medications: ['Antibiótico intravenoso precoce', 'Corticosteroide', 'Analgésico'],
    correctMeds: ['Antibiótico intravenoso precoce', 'Corticosteroide']
  },
  {
    specialty: 'Neurologia',
    gender: 'M',
    patientName: 'Marcos Vieira',
    symptoms: 'Tontura intensa, sensação de que tudo gira, náuseas.',
    history: 'Sintomas surgem ao virar a cabeça; sem déficits neurológicos.',
    diagnoses: ['Vertigem periférica (labirintite)', 'AVC', 'Hipotensão'],
    correctDiagnosis: 'Vertigem periférica (labirintite)',
    tests: ['Avaliação clínica', 'Manobra de Dix-Hallpike', 'Audiometria'],
    correctTests: ['Avaliação clínica', 'Manobra de Dix-Hallpike'],
    testResults: {
      'Avaliação clínica': 'Sem sinais de déficit focal.',
      'Manobra de Dix-Hallpike': 'Vertigem e nistagmo compatíveis com vertigem posicional.',
      'Audiometria': 'Perda auditiva leve em alta frequência.'
    },
    medications: ['Antivertiginoso', 'Antiemético', 'Antibiótico'],
    correctMeds: ['Antivertiginoso', 'Antiemético']
  },

  /* ===== TRAUMA / ORTOPEDIA ===== */
  {
    specialty: 'Ortopedia / Trauma',
    gender: 'F',
    patientName: 'Vitória Silva',
    symptoms: 'Dor intensa em punho após queda, incapacidade de apoiar a mão.',
    history: 'Queda ao tropeçar; nega outras queixas.',
    diagnoses: ['Fratura distal de rádio', 'Entorse de punho', 'Luxação de ombro'],
    correctDiagnosis: 'Fratura distal de rádio',
    tests: ['Raio X de punho'],
    correctTests: ['Raio X de punho'],
    testResults: {
      'Raio X de punho': 'Fratura distal de rádio com desvio.'
    },
    medications: ['Imobilização', 'Analgesia simples', 'Gesso ou tala'],
    correctMeds: ['Imobilização', 'Analgesia simples', 'Gesso ou tala']
  },
  {
    specialty: 'Ortopedia / Trauma',
    gender: 'M',
    patientName: 'Felipe Nunes',
    symptoms: 'Dor forte e súbita no joelho após salto.',
    history: 'Jogador amador de basquete.',
    diagnoses: ['Ruptura de ligamento cruzado', 'Entorse leve', 'Artrite séptica'],
    correctDiagnosis: 'Ruptura de ligamento cruzado',
    tests: ['Exame físico ortopédico', 'Ressonância magnética'],
    correctTests: ['Exame físico ortopédico', 'Ressonância magnética'],
    testResults: {
      'Exame físico ortopédico': 'Teste de gaveta anterior positivo.',
      'Ressonância magnética': 'Ruptura de ligamento cruzado anterior.'
    },
    medications: ['Imobilização inicial', 'Analgesia', 'Encaminhar para ortopedia'],
    correctMeds: ['Imobilização inicial', 'Analgesia', 'Encaminhar para ortopedia']
  },

  /* ===== URO / NÉFRO ===== */
  {
    specialty: 'Urologia / Nefrologia',
    gender: 'F',
    patientName: 'Letícia Moura',
    symptoms: 'Dor lombar intensa irradiando para a virilha, dificuldade para ficar parada.',
    history: 'Início súbito há 2 horas, sem febre.',
    diagnoses: ['Cólica renal', 'Apendicite', 'Infecção urinária'],
    correctDiagnosis: 'Cólica renal',
    tests: ['Urina tipo 1', 'Ultrassom de rins e vias urinárias'],
    correctTests: ['Urina tipo 1', 'Ultrassom de rins e vias urinárias'],
    testResults: {
      'Urina tipo 1': 'Hemácias em grande quantidade, sem leucócitos significativos.',
      'Ultrassom de rins e vias urinárias': 'Cálculo em ureter distal direito com discreta dilatação.'
    },
    medications: ['Anti-inflamatório (cetoprofeno)', 'Hidratação', 'Analgesia forte'],
    correctMeds: ['Anti-inflamatório (cetoprofeno)', 'Hidratação']
  },
  {
    specialty: 'Urologia / Infectologia',
    gender: 'F',
    patientName: 'Aline Torres',
    symptoms: 'Dor ao urinar, urgência miccional e urina turva.',
    history: 'Sintomas iniciaram há 24 horas; diz beber pouca água.',
    diagnoses: ['Infecção urinária baixa (cistite)', 'Cólica renal', 'Vaginite'],
    correctDiagnosis: 'Infecção urinária baixa (cistite)',
    tests: ['Urina tipo 1', 'Urocultura'],
    correctTests: ['Urina tipo 1'],
    testResults: {
      'Urina tipo 1': 'Leucócitos numerosos, nitrito positivo.',
      'Urocultura': 'Coleta enviada para análise.'
    },
    medications: ['Nitrofurantoína', 'Hidratação oral'],
    correctMeds: ['Nitrofurantoína', 'Hidratação oral']
  },

  /* ===== OBSTETRÍCIA / GINECO ===== */
  {
    specialty: 'Ginecologia / Obstetrícia',
    gender: 'F',
    patientName: 'Patrícia Nunes',
    symptoms: 'Dor pélvica intensa, sangramento vaginal e tontura.',
    history: 'Atraso menstrual de 6 semanas, relações sem proteção.',
    diagnoses: ['Gravidez ectópica rota', 'Abortamento incompleto', 'Cólica menstrual'],
    correctDiagnosis: 'Gravidez ectópica rota',
    tests: ['Beta-hCG', 'Ultrassom transvaginal', 'Hemograma'],
    correctTests: ['Beta-hCG', 'Ultrassom transvaginal', 'Hemograma'],
    testResults: {
      'Beta-hCG': 'Positivo em valores compatíveis com gestação.',
      'Ultrassom transvaginal': 'Massa anexial e líquido livre em cavidade.',
      'Hemograma': 'Anemia e sinais de perda sanguínea.'
    },
    medications: ['Estabilização hemodinâmica', 'Preparar para cirurgia', 'Analgésico'],
    correctMeds: ['Estabilização hemodinâmica', 'Preparar para cirurgia']
  },

  /* ===== PSIQUIATRIA / EMOCIONAL ===== */
  {
    specialty: 'Psiquiatria / Clínica',
    gender: 'F',
    patientName: 'Viviane Lopes',
    symptoms: 'Ansiedade intensa, palpitações, falta de ar e sensação de morte iminente.',
    history: 'Situação de estresse extremo no trabalho, sem doença cardíaca prévia.',
    diagnoses: ['Crise de pânico', 'Infarto agudo do miocárdio', 'Arritmia'],
    correctDiagnosis: 'Crise de pânico',
    tests: ['ECG', 'Oximetria', 'Anamnese detalhada'],
    correctTests: ['ECG', 'Anamnese detalhada'],
    testResults: {
      'ECG': 'Sem alterações isquêmicas.',
      'Oximetria': 'Saturação normal.',
      'Anamnese detalhada': 'Sintomas típicos de crise de pânico sem outros achados.'
    },
    medications: ['Benzodiazepínico em dose baixa', 'Encaminhamento para psicoterapia'],
    correctMeds: ['Benzodiazepínico em dose baixa', 'Encaminhamento para psicoterapia']
  }
];

/* ==== ESTADO DO JOGO ==== */

let playerName = '';
let selectedAvatar = null;
let currentCaseIndex = 0;

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

/* ==== ELEMENTOS ==== */

const startScreen = document.getElementById('start-screen');
const nameScreen = document.getElementById('name-screen');
const directorScreen = document.getElementById('director-screen');
const consultScreen = document.getElementById('consult-screen');
const caseScreen = document.getElementById('case-screen');
const examScreen = document.getElementById('exam-screen');
const helpPopup = document.getElementById('help-popup');

/* ==== SALVAMENTO DO JOGO (localStorage) ==== */

function saveGameState() {
  if (!selectedAvatar) return;

  const data = {
    playerName,
    selectedAvatarId: selectedAvatar.id,
    currentCaseIndex,
    prestige,
    correctCases,
    wrongCases,
    diagCorrect,
    diagWrong,
    testsCorrect,
    testsWrong,
    medsCorrect,
    medsWrong,
    level
  };

  try {
    localStorage.setItem('medicalSimulatorSave', JSON.stringify(data));
  } catch (e) {
    console.error('Erro ao salvar jogo:', e);
  }
}

function loadGameState() {
  const raw = localStorage.getItem('medicalSimulatorSave');
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);

    playerName = data.playerName || '';
    currentCaseIndex = data.currentCaseIndex || 0;
    prestige = data.prestige || 0;
    correctCases = data.correctCases || 0;
    wrongCases = data.wrongCases || 0;
    diagCorrect = data.diagCorrect || 0;
    diagWrong = data.diagWrong || 0;
    testsCorrect = data.testsCorrect || 0;
    testsWrong = data.testsWrong || 0;
    medsCorrect = data.medsCorrect || 0;
    medsWrong = data.medsWrong || 0;
    level = data.level || 'Residente';

    if (data.selectedAvatarId) {
      selectedAvatar = avatars.find(a => a.id === data.selectedAvatarId) || avatars[0];
    } else {
      selectedAvatar = avatars[0];
    }

    startScreen.classList.add('hidden');
    nameScreen.classList.add('hidden');
    directorScreen.classList.add('hidden');
    caseScreen.classList.add('hidden');
    examScreen.classList.add('hidden');
    consultScreen.classList.remove('hidden');

    document.getElementById('doctor-avatar').src = selectedAvatar.src;
    updateMetrics();

    return true;
  } catch (e) {
    console.error('Erro ao carregar jogo salvo:', e);
    return false;
  }
}

/* ==== INÍCIO DO JOGO ==== */

document.getElementById('start-button').addEventListener('click', () => {
  startScreen.classList.add('hidden');
  nameScreen.classList.remove('hidden');
  populateAvatars();
});

/* ==== SELEÇÃO DE AVATAR ==== */

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

/* ==== TEXTO DO DIRETOR (MÁQUINA DE ESCREVER) ==== */

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
  saveGameState();
});

/* ==== POP-UP DE AJUDA ==== */

document.getElementById('help-button').addEventListener('click', () => {
  helpPopup.classList.remove('hidden');
});

document.getElementById('close-help').addEventListener('click', () => {
  helpPopup.classList.add('hidden');
});

/* ==== CONSULTÓRIO – PRÓXIMO CASO ==== */

document.getElementById('next-case').addEventListener('click', () => {
  if (currentCaseIndex >= cases.length) {
    alert('Você atendeu todos os casos disponíveis nesta versão.');
    return;
  }
  const c = cases[currentCaseIndex];
  showCase(c);
  consultScreen.classList.add('hidden');
  caseScreen.classList.remove('hidden');
});

/* ==== EXIBIR CASO ==== */

function showCase(c) {
  document.getElementById('patient-name').textContent = c.patientName;
  document.getElementById('patient-specialty').textContent =
    'Especialidade principal: ' + (c.specialty || 'Clínica Geral');
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

/* ==== TELA DE EXAME ==== */

function getExamBackground(examName) {
  const lower = examName.toLowerCase();
  if (lower.includes('raio x') || lower.includes('radiografia')) {
    return 'images/xray.jpg';
  }
  if (lower.includes('ressonância') || lower.includes('angiotomografia') || lower.includes('rm')) {
    return 'images/mri.jpg';
  }
  return 'images/labs.jpg';
}

function openExamScreen(examName, resultText) {
  document.getElementById('exam-background').src = getExamBackground(examName);
  document.getElementById('exam-title').textContent = examName;
  document.getElementById('exam-result').textContent = resultText;

  caseScreen.classList.add('hidden');
  examScreen.classList.remove('hidden');
}

document.getElementById('back-to-case').addEventListener('click', () => {
  examScreen.classList.add('hidden');
  caseScreen.classList.remove('hidden');
});

/* ==== FINALIZAR CASO ==== */

document.getElementById('finalize-case').addEventListener('click', () => {
  const c = cases[currentCaseIndex];

  const chosenDiagEl = document.querySelector('#diagnosis-options .option.selected');
  if (!chosenDiagEl) {
    alert('Selecione um diagnóstico antes de finalizar.');
    return;
  }
  const chosenDiag = chosenDiagEl.textContent;

  const selectedTests = Array.from(
    document.querySelectorAll('#test-options .option.selected')
  ).map(e => e.textContent);

  const selectedMeds = Array.from(
    document.querySelectorAll('#medication-options .option.selected')
  ).map(e => e.textContent);

  const diagIsCorrect = chosenDiag === c.correctDiagnosis;
  const testsIsCorrect = compareSets(selectedTests, c.correctTests);
  const medsIsCorrect = compareSets(selectedMeds, c.correctMeds);

  if (diagIsCorrect) diagCorrect++; else diagWrong++;
  if (testsIsCorrect) testsCorrect++; else testsWrong++;
  if (medsIsCorrect) medsCorrect++; else medsWrong++;

  if (diagIsCorrect) prestige += 10; else prestige -= 5;
  if (testsIsCorrect) prestige += 5; else prestige -= 3;
  if (medsIsCorrect) prestige += 5; else prestige -= 3;
  if (prestige < 0) prestige = 0;

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

  if (prestige >= 60) level = 'Pleno';
  else if (prestige >= 30) level = 'Titular';
  else level = 'Residente';

  updateMetrics();
  saveGameState();

  currentCaseIndex++;
  caseScreen.classList.add('hidden');
  consultScreen.classList.remove('hidden');
});

/* ==== FUNÇÕES AUXILIARES ==== */

function compareSets(selected, correct) {
  if (!Array.isArray(selected) || !Array.isArray(correct)) return false;
  if (selected.length !== correct.length) return false;
  return correct.every(item => selected.includes(item));
}

function updateMetrics() {
  document.getElementById('prestige').textContent = prestige;
  document.getElementById('correct-cases').textContent = correctCases;
  document.getElementById('wrong-cases').textContent = wrongCases;
  document.getElementById('level').textContent = level;
  document.getElementById('diag-stats').textContent = `${diagCorrect} / ${diagWrong}`;
  document.getElementById('test-stats').textContent = `${testsCorrect} / ${testsWrong}`;
  document.getElementById('med-stats').textContent = `${medsCorrect} / ${medsWrong}`;
}

/* ==== CARREGAR JOGO SALVO AO ABRIR ==== */

window.addEventListener('load', () => {
  const hasSave = localStorage.getItem('medicalSimulatorSave');
  if (hasSave) {
    const cont = confirm('Existe um jogo salvo. Deseja continuar de onde parou?');
    if (cont) {
      const ok = loadGameState();
      if (!ok) {
        localStorage.removeItem('medicalSimulatorSave');
      }
    } else {
      localStorage.removeItem('medicalSimulatorSave');
    }
  }
});
