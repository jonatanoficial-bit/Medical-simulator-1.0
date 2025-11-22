# Simulador Médico: Pronto‑Socorro – Design detalhado de um jogo de tela AAA

Este documento descreve em detalhes o design de um jogo de simulação médica de alta qualidade.  O jogador assume o papel de um médico socorrista em um pronto‑socorro e deve diagnosticar e tratar pacientes com diferentes doenças.  O design foi pensado para ser usado por alunos de medicina e usuários leigos; apresenta conteúdo baseado em evidências médicas (citados abaixo) e traz mecânicas de gamificação para tornar a experiência educativa envolvente.

## Tela inicial e capa

* **Capa do jogo:** a tela de abertura apresenta a arte de capa com o título “Simulador Médico: Pronto‑Socorro”.  A imagem transmite a atmosfera de um pronto‑socorro e lembra uma vitrine da Steam ou da Xbox Cloud.  Ela inclui um médico com jaleco e estetoscópio em frente a leitos hospitalares e um botão destacado de “Iniciar” para começar o jogo.  Abaixo, a arte da capa gerada para o projeto:

| Capa do jogo |
| --- |
| ![Capa do jogo]({{file-4UEsRJU6X6kgiESg6krYaa}}) |

* **Aviso educacional:** logo na capa é exibido um aviso claro informando que o jogo tem finalidade educativa e de simulação.  É explicado que, apesar de basear‑se em casos reais, não substitui consulta médica e pode abordar situações graves em que decisões erradas levam à morte do paciente.  O aviso também orienta que todo conteúdo segue evidências médicas atuais e recomendações de emergência.

* **Botão “Iniciar”:** leva o jogador à tela de configuração do avatar.

## Tela de criação do médico

Na segunda tela o usuário insere seu **nome** e escolhe um **avatar** de médico.  Para proporcionar representatividade, o jogo oferece avatares de diferentes gêneros e etnias, cada um com aparência profissional e realista.  Exemplo de avatares:

| Avatar | Descrição |
| --- | --- |
| ![Médico afrodescendente com barba]({{file-8jH5CfGrtxYRbArWeJYohT}}) | Médico de pele escura com barba aparada e estetoscópio. |
| ![Médico asiático com óculos]({{file-2V5EL5TVj5BCukGaonCo8v}}) | Médico de origem asiática com jaleco e gravata. |
| ![Médica caucasiana]({{file-JhNawA4UXKaeSyJJSV3WmM}}) | Médica caucasiana de cabelo castanho usando jaleco e estetoscópio. |
| ![Médica negra]({{file-2WmoPMktE4h2KSikFpKDus}}) | Médica negra com cabelo afro e jaleco branco. |
| ![Médico com bigode]({{file-1yVZk2k2p9eby1h86pU8gR}}) | Médico caucasiano com bigode e gravata. |
| ![Médica asiática]({{file-TTRqtGJLRYq9LkZVFfPG1Z}}) | Médica de origem asiática com cabelo preto e jaleco. |

O jogador escolhe um destes avatares e digita o seu nome.  O avatar aparecerá em várias telas e no consultório do médico.

## Tela de introdução (diretor do hospital)

Após escolher o avatar, o usuário assiste a uma cena em que o **diretor do hospital** dá as boas‑vindas.  A fala do diretor é apresentada com animação de máquina de escrever sobre um fundo que mostra a recepção de um pronto‑socorro.  O diretor explica que há muitas emergências chegando, reforça a importância do trabalho do médico e pede para que o jogador assuma seu posto rapidamente.  Esta tela contém botões “Continuar” e “Manual de ajuda” (descrito a seguir).

## Consultório e sistema de pontuação

Na tela seguinte o jogador entra em seu **consultório**.  Essa sala funciona como **hub** de gestão de casos e exibe:

* **Avatar do médico:** o avatar escolhido aparece no canto da tela, junto com o nome do jogador.
* **Barra de progresso e ranking:** indicadores de experiência representados por barras de **prestígio**, **acertos** e **erros**.  O jogador começa como **Médico Residente**, avança para **Médico Titular** e depois para **Médico Pleno**.  Cada acerto gera pontos de experiência; erros diminuem o prestígio.  No final de cada caso, uma pontuação geral é somada.  O ranking determina quais casos serão apresentados – residentes tratam quadros simples (virose, lesões leves), titulares recebem casos moderados (apendicite, pneumonia) e plenos lidam com emergências graves (infarto, sepse, AVC).
* **Botão “Próximo caso”:** quando acionado, apresenta um novo paciente com queixa diferente.  Um medidor de **tempo** alerta sobre a urgência – atraso no diagnóstico pode agravar o caso.
* **Botão de salvamento:** permite salvar o progresso a qualquer momento.  O jogo registra o nível, pontuação e lista de casos resolvidos; ao retornar, o jogador continua do último ponto salvo.

## Tela de atendimento ao paciente

A cada caso o jogador é direcionado a uma nova tela com:

* **Foto do paciente** (adultos, idosos ou crianças).  Devido a limitações de geração de imagens no momento, estes retratos serão implementados em atualizações futuras.
* **Ficha clínica inicial:** apresenta dados como idade, sexo, sinais vitais e queixa principal.  Os casos se baseiam em doenças reais.  Por exemplo:
  * **Dor torácica:** pode indicar infarto, embolia pulmonar ou causa gastrointestinal.  As emergências cardíacas apresentam sintomas como dor no peito que irradia para braço ou mandíbula, náuseas, sudorese e falta de ar【482781908539946†L74-L89】.  Podem ser pedidos exames como **troponina**, eletrocardiograma e radiografia; um nível elevado de troponina confirma necrose cardíaca【482781908539946†L116-L129】.
  * **Acidente vascular cerebral (AVC):** caracterizado por súbita dormência, dificuldade de falar, desequilíbrio ou dor de cabeça intensa【269000937213989†L166-L183】.  Diagnóstico exige tomografia ou ressonância para diferenciar AVC isquêmico de hemorrágico【269000937213989†L187-L199】.
  * **Apendicite:** dor abdominal no quadrante inferior direito, náusea, febre e perda de apetite【444673304963015†L85-L104】.  Exames incluem hemograma, urina e imagens (ultrassom, tomografia)【444673304963015†L124-L130】; tratamento é cirúrgico.
  * **Pneumonia:** febre, calafrios, tosse com secreção, falta de ar e dor no peito【281069182206124†L174-L185】.  Radiografia de tórax confirma infiltrados e guiará o uso de antibióticos.
  * **Sepse:** resposta extrema a uma infecção que provoca frequência cardíaca e respiratória elevadas, confusão, dor intensa, febre ou pele fria【791147757917122†L104-L144】.  O tratamento exige antibióticos e reposição de fluidos【791147757917122†L152-L176】.
  * **Reação anafilática:** alergia grave com dor abdominal, dificuldade respiratória, erupções cutâneas, tontura e inchaço【542702646941164†L117-L131】.  A prioridade é administrar **epinefrina** e manter vias aéreas【542702646941164†L146-L165】.
  * **Hipoglicemia e cetoacidose diabética:** quando a glicemia está abaixo de 70 mg/dL ocorrem tremores, sudorese, irritabilidade e confusão【676829659752032†L74-L90】.  A cetoacidose diabética provoca respiração rápida, desidratação, dor abdominal, náuseas e hálito frutado【698168437305199†L74-L96】【698168437305199†L129-L146】; exige insulina intravenosa, reposição de fluidos e monitorização de eletrólitos【698168437305199†L154-L166】.
  * **Outras queixas comuns:** dor abdominal aguda, cefaleia, dispneia e dor generalizada são frequentes nas emergências【909935618115746†L28-L33】.  Nestas situações o manual sugere abordagem sistemática para descartar causas graves como ruptura de aneurisma, obstrução intestinal ou meningite【590345359644114†L503-L516】【590345359644114†L518-L579】【590345359644114†L539-L624】.

* **Perguntas interativas:** o jogador pode fazer perguntas ao paciente (ex.: “Quando a dor começou?”, “Já teve esta sensação antes?”, “Tomou remédios?”) para refinar o diagnóstico.  O sistema de IA responde com base na história programada.
* **Botões de ações:**
  * **Solicitar exames:** lista exames de acordo com a suspeita clínica.  Por exemplo, o **ultrassom** usa ondas sonoras e não gera radiação, sendo útil para avaliar abdome e gestantes【508977314759332†L74-L85】; a **tomografia computadorizada** utiliza raios X para obter cortes transversais e detecta fraturas, tumores ou hemorragias【43177640717310†L107-L118】; a **ressonância magnética** usa magnetos e ondas de rádio, sem radiação ionizante, para visualizar tecidos moles【108508445175458†L74-L80】; o **raio X** mostra ossos como brancos e ar como preto, sendo usado para detectar fraturas e pneumonia【22059461559130†L105-L116】.
  * **Dar diagnóstico:** após interpretar a anamnese e os exames, o jogador escolhe o diagnóstico a partir de uma lista.  Se acertar, ganha pontos; se errar, o caso pode evoluir e exigir tratamento de complicações.  O game engine calcula a probabilidade de cura ou óbito conforme a precisão e a rapidez na decisão.
  * **Prescrever medicação:** lista medicamentos reais e doses de acordo com protocolos.  Por exemplo, analgesia para dor abdominal, nitroglicerina para síndrome coronariana, antibióticos específicos para pneumonias, reposição de fluidos na sepse e administração imediata de adrenalina em anafilaxia.  O jogador deve considerar alergias, interações e contraindicações.
  * **Encaminhar para cirurgia ou UTI:** em casos como apendicite, obstrução intestinal ou septicemia, o botão envia o paciente para o bloco cirúrgico ou unidade de terapia intensiva.  O resultado depende da indicação correta e do tempo.

## Manual de ajuda e conteúdo educativo

Todos os menus incluem um botão de **Ajuda** que abre um manual completo.  Este manual explica:

* **Abordagem inicial (ABCDE):** avaliação de vias aéreas, respiração, circulação, estado neurológico e exposição.  Ensina a reconhecer sinais de emergência listados pela MedlinePlus (dor no peito, dificuldade respiratória, sangramento, desmaios, convulsões e reações alérgicas)【710842143668091†L88-L106】.
* **Principais doenças e fisiopatologia:** oferece capítulos sobre infarto, AVC, sepse, pneumonia, apendicite, choques, doenças metabólicas e intoxicações.  Inclui diagramas anatômicos e fluxogramas de condutas.  Os textos utilizam informações das fontes citadas para garantir veracidade.
* **Interpretação de exames:** mostra exemplos de radiografias, tomografias, ultrassons e ressonâncias, explicando o que cada modalidade revela, suas indicações e limitações【508977314759332†L74-L85】【43177640717310†L107-L118】【108508445175458†L74-L80】.
* **Farmacologia básica:** descreve classes de medicamentos usadas no pronto‑socorro (analgésicos, antibióticos, antieméticos, antiarrítmicos, vasopressores), doses usuais e efeitos adversos.  Reforça a importância do uso responsável.
* **Classificação e triagem:** orienta como priorizar pacientes com base na gravidade; fundamentado nos principais sistemas de triagem de emergência.
* **Glossário e referências:** lista termos médicos e referências bibliográficas utilizadas no jogo, com links para artigos médicos originais e guidelines internacionais.

O manual pode ser consultado a qualquer momento sem penalizar o tempo do jogador.  Assim, estudantes de medicina podem revisar procedimentos e leigos podem aprender conceitos durante o jogo.

## Sistema de progressão e ranking

O jogo contém três **níveis de carreira**:

1. **Médico Residente:** início do jogo; apresenta quadros simples como dor de garganta, infecções virais leves, entorses e pequenos traumas.  A pontuação exige coletar histórico e examinar sem solicitar exames desnecessários.
2. **Médico Titular:** libera casos de média complexidade, por exemplo apendicite, colecistite, pneumonias e diabéticos com hipoglicemia.  O jogador deve interpretar exames de imagem e laboratoriais e escolher terapias adequadas.
3. **Médico Pleno:** nível avançado com emergências graves como infarto agudo do miocárdio, AVC, sepse, choque anafilático e politrauma.  A margem de erro é pequena e o tempo crítico; decisões erradas podem resultar em morte.  Uma vez concluído, o jogador pode acessar um modo “casos raros” com situações menos frequentes (aneurisma cerebral, síndrome de Marfan, envenenamentos).  Leva‑se cerca de um mês de jogo contínuo para completar todos os casos, garantindo longevidade.

A **pontuação** é calculada com base em:

* **Precisão diagnóstica:** acertos valem pontos de conhecimento; erros retiram pontos.
* **Rapidez:** quanto mais rápido o jogador diagnostica e trata, maior a pontuação.
* **Eficiência:** uso racional de exames; pedir exames desnecessários penaliza a pontuação.
* **Desfecho:** a cura do paciente gera bônus; óbito gera perda de prestígio.

Um **ranking global** mostra a posição do jogador em relação a outros (pode ser local ou online).  O ranking incentiva a repetição de casos e a busca por excelência.

## Sistema de salvamento

O progresso do jogo é salvo automaticamente ao fim de cada caso.  Há também slots de salvamento manual para o usuário gravar o estado atual (nível, pontuação, casos concluídos).  Ao carregar um jogo salvo, o jogador retorna ao consultório com suas barras de experiência intactas.  O sistema previne perda de progresso em casos longos.

## Considerações finais

O **Simulador Médico: Pronto‑Socorro** é pensado como uma experiência AAA para consoles ou PC.  Combina gráficos de alta qualidade com conteúdo médico realista e ajuda detalhada.  A diversidade de avatares torna o jogo inclusivo, enquanto o sistema de progressão e ranking oferece motivação contínua.  Ao basear‑se em literatura médica confiável – como descrições de emergências graves (infarto【482781908539946†L74-L89】, AVC【269000937213989†L166-L183】, apendicite【444673304963015†L85-L104】, pneumonia【281069182206124†L174-L185】, sepse【791147757917122†L104-L144】, anafilaxia【542702646941164†L117-L131】 e distúrbios metabólicos【676829659752032†L74-L90】【698168437305199†L74-L96】) – o jogo atende a finalidade educativa de ensinar reconhecimento de sintomas, uso apropriado de exames e terapêutica baseada em evidências.
