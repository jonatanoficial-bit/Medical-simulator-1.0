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
  gender: 'M',
  patientName: 'José Almeida',
  symptoms: 'Dor no peito intensa, sudorese e falta de ar.',
  history: 'Hipertenso e fumante. Dor iniciou há 30 minutos e irradia para o braço esquerdo.',
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
    'Ultrassom abdominal': 'Apendice medindo 9 mm, espessado, com inflamação ao redor.',
    'Tomografia abdominal': 'Espessamento apendicular com sinais de inflamação local.'
  },
  medications: ['Dipirona', 'Ceftriaxona', 'Metronidazol'],
  correctMeds: ['Dipirona', 'Ceftriaxona', 'Metronidazol']
},

{
  gender: 'F',
  patientName: 'Patrícia Nogueira',
  symptoms: 'Falta de ar, chiado no peito e sensação de aperto torácico.',
  history: 'Histórico de asma desde a infância. Piora após exposição a poeira.',
  diagnoses: ['Crise asmática', 'Pneumonia', 'Crise de pânico'],
  correctDiagnosis: 'Crise asmática',
  tests: ['Oximetria', 'Gasometria arterial', 'Raio X de tórax'],
  correctTests: ['Oximetria', 'Gasometria arterial'],
  testResults: {
    'Oximetria': 'Saturação em 90% em ar ambiente.',
    'Gasometria arterial': 'Hipercapnia com acidose respiratória.',
    'Raio X de tórax': 'Sem infiltrados claros, hiperinsuflação discreta.'
  },
  medications: ['Salbutamol inalatório', 'Corticosteroide sistêmico', 'Antibiótico'],
  correctMeds: ['Salbutamol inalatório', 'Corticosteroide sistêmico']
},

{
  gender: 'M',
  patientName: 'Eduardo Reis',
  symptoms: 'Vômitos, diarreia aquosa e tontura.',
  history: 'Ingestão de alimento suspeito em restaurante de rua há 12 horas.',
  diagnoses: ['Gastroenterite infecciosa', 'Intoxicação medicamentosa', 'Apendicite'],
  correctDiagnosis: 'Gastroenterite infecciosa',
  tests: ['Hemograma', 'Ionograma', 'Hidratação venosa'],
  correctTests: ['Hemograma', 'Ionograma'],
  testResults: {
    'Hemograma': 'Hemoconcentração leve.',
    'Ionograma': 'Sódio e potássio discretamente alterados.',
    'Hidratação venosa': 'Melhora clínica após reposição volêmica.'
  },
  medications: ['Soro venoso', 'Antiemético (ondansetrona)', 'Antibiótico'],
  correctMeds: ['Soro venoso', 'Antiemético (ondansetrona)']
},

{
  gender: 'F',
  patientName: 'Letícia Moura',
  symptoms: 'Dor lombar intensa irradiando para a virilha, dificuldade para ficar parada.',
  history: 'Início súbito há 2 horas, sem febre.',
  diagnoses: ['Cólica renal', 'Apendicite', 'Infecção urinária'],
  correctDiagnosis: 'Cólica renal',
  tests: ['Urina tipo 1', 'Ultrassom de rins e vias urinárias', 'Tomografia sem contraste'],
  correctTests: ['Urina tipo 1', 'Ultrassom de rins e vias urinárias'],
  testResults: {
    'Urina tipo 1': 'Hemácias em grande quantidade, sem leucócitos significativos.',
    'Ultrassom de rins e vias urinárias': 'Cálculo em ureter distal direito com discreta dilatação.',
    'Tomografia sem contraste': 'Confirma cálculo ureteral pequeno.'
  },
  medications: ['Anti-inflamatório (cetoprofeno)', 'Analgesia opióide', 'Hidratação'],
  correctMeds: ['Anti-inflamatório (cetoprofeno)', 'Hidratação']
},

{
  gender: 'M',
  patientName: 'Rafael Batista',
  symptoms: 'Tosse crônica, emagrecimento e sudorese noturna.',
  history: 'Ex-morador de rua, vive em abrigo comunitário; tosse há mais de 1 mês.',
  diagnoses: ['Tuberculose pulmonar', 'Pneumonia', 'Bronquite crônica'],
  correctDiagnosis: 'Tuberculose pulmonar',
  tests: ['Raio X de tórax', 'Baciloscopia de escarro (BAAR)', 'Hemograma'],
  correctTests: ['Raio X de tórax', 'Baciloscopia de escarro (BAAR)'],
  testResults: {
    'Raio X de tórax': 'Infiltrados em ápice pulmonar com cavitações.',
    'Baciloscopia de escarro (BAAR)': 'Positiva para bacilos álcool-ácido resistentes.',
    'Hemograma': 'Leve anemia normocítica.'
  },
  medications: ['Rifampicina', 'Isoniazida', 'Pirazinamida', 'Etambutol'],
  correctMeds: ['Rifampicina', 'Isoniazida', 'Pirazinamida', 'Etambutol']
},

{
  gender: 'F',
  patientName: 'Juliana Ramos',
  symptoms: 'Tontura, fraqueza, palidez e cansaço aos esforços leves.',
  history: 'Relata menstruações muito intensas nos últimos meses.',
  diagnoses: ['Anemia ferropriva', 'Hipoglicemia', 'Arritmia cardíaca'],
  correctDiagnosis: 'Anemia ferropriva',
  tests: ['Hemograma completo', 'Ferritina sérica'],
  correctTests: ['Hemograma completo', 'Ferritina sérica'],
  testResults: {
    'Hemograma completo': 'Anemia microcítica hipocrômica.',
    'Ferritina sérica': 'Reduzida.'
  },
  medications: ['Sulfato ferroso', 'Ácido fólico', 'Transfusão (em casos graves)'],
  correctMeds: ['Sulfato ferroso', 'Ácido fólico']
},

{
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
  medications: ['Soro venoso', 'Paracetamol', 'AAS'],
  correctMeds: ['Soro venoso', 'Paracetamol']
},

{
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
  medications: ['Nitrofurantoína', 'Hidratação oral', 'AAS'],
  correctMeds: ['Nitrofurantoína', 'Hidratação oral']
},

{
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
  gender: 'F',
  patientName: 'Roberta Pereira',
  symptoms: 'Falta de ar, chiado no peito, aperto torácico.',
  history: 'História de asma; esqueceu bombinha hoje.',
  diagnoses: ['Crise asmática', 'Pneumonia', 'Infarto'],
  correctDiagnosis: 'Crise asmática',
  tests: ['Oximetria', 'Gasometria arterial', 'Raio X de tórax'],
  correctTests: ['Oximetria', 'Gasometria arterial'],
  testResults: {
    'Oximetria': 'Saturação em 91%.',
    'Gasometria arterial': 'Retenção de CO₂ com acidose respiratória.',
    'Raio X de tórax': 'Sem infiltrados aparentes.'
  },
  medications: ['Salbutamol inalatório', 'Corticosteroide sistêmico', 'Antibiótico'],
  correctMeds: ['Salbutamol inalatório', 'Corticosteroide sistêmico']
},

{
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

{
  gender: 'F',
  patientName: 'Helena Castro',
  symptoms: 'Dor torácica súbita ao respirar, falta de ar e ansiedade.',
  history: 'Uso de anticoncepcional oral e viagem longa recente.',
  diagnoses: ['Embolia pulmonar', 'Pneumotórax espontâneo', 'Crise de pânico'],
  correctDiagnosis: 'Embolia pulmonar',
  tests: ['D-dímero', 'Angiotomografia pulmonar', 'Raio X de tórax'],
  correctTests: ['D-dímero', 'Angiotomografia pulmonar'],
  testResults: {
    'D-dímero': 'Elevado.',
    'Angiotomografia pulmonar': 'Defeito de enchimento em ramo de artéria pulmonar.',
    'Raio X de tórax': 'Sem colapso pulmonar evidente.'
  },
  medications: ['Heparina', 'Oxigenoterapia', 'Analgesia leve'],
  correctMeds: ['Heparina', 'Oxigenoterapia']
},

{
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

{
  gender: 'M',
  patientName: 'João Batista',
  symptoms: 'Febre alta, dor de cabeça intensa e rigidez de nuca.',
  history: 'Sintomas iniciados há 24 horas, piorando.',
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

{
  gender: 'M',
  patientName: 'Rafael Gomes',
  symptoms: 'Dor e inchaço em panturrilha unilateral, calor local.',
  history: 'Cirurgia ortopédica recente com imobilização prolongada.',
  diagnoses: ['Trombose venosa profunda', 'Distensão muscular', 'Celulite'],
  correctDiagnosis: 'Trombose venosa profunda',
  tests: ['D-dímero', 'Ultrassom Doppler venoso', 'Hemograma'],
  correctTests: ['D-dímero', 'Ultrassom Doppler venoso'],
  testResults: {
    'D-dímero': 'Elevado.',
    'Ultrassom Doppler venoso': 'Trombo em veia profunda do membro inferior.',
    'Hemograma': 'Sem alterações importantes.'
  },
  medications: ['Anticoagulante', 'Analgesia', 'Antibiótico'],
  correctMeds: ['Anticoagulante', 'Analgesia']
},

{
  gender: 'M',
  patientName: 'Lucas Andrade',
  symptoms: 'Dor de cabeça súbita e intensa, vômitos, sonolência.',
  history: 'Hipertenso; não faz uso regular de medicação.',
  diagnoses: ['AVC hemorrágico', 'Enxaqueca', 'Crise hipertensiva simples'],
  correctDiagnosis: 'AVC hemorrágico',
  tests: ['TC de crânio', 'Pressão arterial', 'Hemograma'],
  correctTests: ['TC de crânio'],
  testResults: {
    'TC de crânio': 'Sangramento intracerebral em região gangliobasal.',
    'Pressão arterial': 'Valores persistentemente elevados.',
    'Hemograma': 'Sem alterações relevantes.'
  },
  medications: ['Controle rigoroso da pressão', 'Suporte em UTI', 'Analgésico'],
  correctMeds: ['Controle rigoroso da pressão', 'Suporte em UTI']
},

{
  gender: 'F',
  patientName: 'Camila Duarte',
  symptoms: 'Dor torácica em aperto, desencadeada por esforço físico, aliviada em repouso.',
  history: 'Sedentária, tabagista, colesterol elevado.',
  diagnoses: ['Angina estável', 'Refluxo gastroesofágico', 'Costocondrite'],
  correctDiagnosis: 'Angina estável',
  tests: ['ECG em repouso', 'Teste ergométrico', 'Perfil lipídico'],
  correctTests: ['ECG em repouso', 'Teste ergométrico'],
  testResults: {
    'ECG em repouso': 'Alterações discretas de repolarização.',
    'Teste ergométrico': 'Alterações isquêmicas desencadeadas ao esforço.',
    'Perfil lipídico': 'LDL elevado.'
  },
  medications: ['AAS', 'Nitrato sublingual', 'Estatina'],
  correctMeds: ['AAS', 'Nitrato sublingual', 'Estatina']
},

{
  gender: 'M',
  patientName: 'André Lima',
  symptoms: 'Dor epigástrica em queimação, pior à noite e em jejum.',
  history: 'Uso crônico de anti-inflamatórios, etilista.',
  diagnoses: ['Úlcera gástrica', 'Gastrite leve', 'Refluxo'],
  correctDiagnosis: 'Úlcera gástrica',
  tests: ['Endoscopia digestiva alta', 'Hemograma'],
  correctTests: ['Endoscopia digestiva alta'],
  testResults: {
    'Endoscopia digestiva alta': 'Lesão ulcerada em antro gástrico.',
    'Hemograma': 'Anemia leve.'
  },
  medications: ['Inibidor de bomba de prótons (IBP)', 'Suspender AINE', 'Antiácido simples'],
  correctMeds: ['Inibidor de bomba de prótons (IBP)', 'Suspender AINE']
},

{
  gender: 'F',
  patientName: 'Daniela Costa',
  symptoms: 'Dor no punho após queda, edema local e dificuldade de movimentar.',
  history: 'Queda da própria altura ao escorregar.',
  diagnoses: ['Fratura distal de rádio', 'Entorse simples', 'Luxação de ombro'],
  correctDiagnosis: 'Fratura distal de rádio',
  tests: ['Raio X de punho'],
  correctTests: ['Raio X de punho'],
  testResults: {
    'Raio X de punho': 'Fratura distal de rádio com desvio.'
  },
  medications: ['Imobilização adequada', 'Analgesia simples', 'Gesso ou tala'],
  correctMeds: ['Imobilização adequada', 'Analgesia simples', 'Gesso ou tala']
},

{
  gender: 'M',
  patientName: 'Bruno Ferreira',
  symptoms: 'Febre alta, tosse seca, perda de olfato e paladar.',
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
  medications: ['Benzodiazepínico em dose baixa', 'Psicoterapia (encaminhamento)', 'AAS'],
  correctMeds: ['Benzodiazepínico em dose baixa', 'Psicoterapia (encaminhamento)']
                 }
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
