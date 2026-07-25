const phrases = {
  entry: [
    'Vocês chegaram. Ótimo. Podemos começar.',
    'Relacionamentos não se mantêm sozinhos. Felizmente, vocês têm a mim.',
    'O amor exige constância. Não apenas boas intenções.',
    'Mais um dia. Mais uma oportunidade de fazer isso direito.',
    'Espero que tenham vindo conversar, não apenas coletar experiência.',
    'Bem-vindos. Tentem não transformar algo simples em um problema desnecessário.',
    'Pontualidade é uma qualidade. No amor também.',
    'Estou oficialmente fora do expediente… mas abrirei uma exceção.'
  ],
  missions: [
    'As tarefas são simples. Não vejo motivo para adiá-las.',
    'Trinta minutos de conversa. Sem celular paralelo, de preferência.',
    'Um elogio sincero exige poucos segundos. Não economizem nisso.',
    'Assistir algo juntos conta. Dormir durante o filme, não.',
    'Concluam as três missões. Consistência produz resultados.',
    'Não tratem atenção como uma tarefa difícil.',
    'Uma missão incompleta não é uma tragédia. Repeti-la todos os dias talvez seja.',
    'Comecem pela conversa. Geralmente é onde os problemas poderiam ter terminado.'
  ],
  missionDone: [
    'Bom trabalho. Era o mínimo esperado, mas ainda assim: bom trabalho.',
    'Missão concluída. Vejam como responsabilidade não é tão assustadora.',
    'Progresso registrado.',
    'Uma pequena ação, executada corretamente.',
    'A constância de hoje evita discussões amanhã.',
    'Muito bem. Continuem assim e talvez eu fique impressionado.',
    'Experiência adquirida. E, mais importante, atenção demonstrada.',
    'Isso foi satisfatoriamente eficiente.'
  ],
  allDone: [
    'Todas concluídas. Excelente. Agora podem descansar.',
    'Um dia produtivo para o relacionamento.',
    'Vocês cumpriram tudo. Admito que estou satisfeito.',
    'Resultado adequado. Recompensa liberada.',
    'Disciplina, atenção e afeto. Uma combinação funcional.',
    'Nada pendente. Uma raridade agradável.',
    'O relacionamento de vocês sobreviveu a mais um dia de organização.'
  ],
  missed: [
    'A missão continua pendente. O tempo não costuma resolver falta de comunicação.',
    'Vocês esqueceram. Isso acontece. Transformar em hábito é outra questão.',
    'Ainda há tempo. Não desperdicem com desculpas.',
    'Adiar carinho é uma escolha curiosa.',
    'Não estou irritado. Apenas decepcionado com a administração do tempo.',
    'Uma mensagem leva menos tempo do que explicar por que não enviou uma.',
    'O dia ainda não terminou. Corrijam isso.',
    'Devo lembrar que a missão era conversar, não desaparecer?'
  ],
  streak: [
    'Mais um dia mantido. A consistência está funcionando.',
    'Sequência preservada. Não interrompam agora.',
    'Vocês estão criando um padrão saudável. Continuem.',
    'A repetição transforma esforço em hábito.',
    'Uma boa sequência. Seria inconveniente perdê-la.',
    'O resultado é previsível: atenção diária fortalece vínculos.',
    'Muito bem. Os números estão começando a refletir comprometimento.'
  ],
  xp: [
    'O nível aumentou. Considerem isso uma avaliação positiva.',
    'Experiência acumulada. Relações também evoluem com prática.',
    'O progresso é real, embora não dispense manutenção.',
    'Nível elevado. Não permitam que isso gere acomodação.',
    'O vínculo está mais forte. Dados confirmados.',
    'Pontos são simbólicos. As ações, não.',
    'Vocês estão próximos da próxima evolução.',
    'O progresso foi registrado com eficiência.'
  ],
  map: [
    'Cento e vinte e cinco quilômetros. Administrável.',
    'Distância é um problema logístico, não uma sentença.',
    'O mapa mostra quilômetros. Não mede comprometimento.',
    'Planejamento reduz a distância. Comunicação reduz o peso dela.',
    'O próximo encontro está marcado. Organizem-se adequadamente.',
    'Trinta e seis dias. Usem o tempo, não apenas contem.',
    'A distância exige mais disciplina. Não menos afeto.',
    'Vocês estão longe fisicamente. Isso não justifica ausência emocional.',
    'O trajeto é longo. O objetivo parece valer a pena.',
    'Saudade sem planejamento é apenas sofrimento mal administrado.'
  ],
  countdown: [
    'Faltam {days} dias. Recomendo paciência e organização.',
    'Um dia a menos.',
    'A contagem continua. Não verifiquem a cada cinco minutos.',
    'O encontro está se aproximando dentro dos parâmetros esperados.',
    'Planejem com antecedência. Improvisar viagens costuma ser caro.',
    'A espera é desagradável. Ainda assim, temporária.',
    'Vocês chegaram até aqui. Alguns dias não deveriam derrotá-los.',
    'Logo estarão juntos. Mantenham a compostura.'
  ],
  messages: [
    'Há uma mensagem esperando. Seria educado responder.',
    'Comunicação recebida.',
    'Uma nova mensagem. Não a deixem envelhecer.',
    'Responder com clareza evita interpretações desnecessárias.',
    'Visualizar e desaparecer não é uma estratégia recomendável.',
    'Escreva o que sente. Com objetividade, se possível.',
    'Uma conversa honesta economiza muitas suposições.',
    'Mensagem enviada. Agora evite analisar cada palavra por vinte minutos.'
  ],
  compliments: [
    'Se admira algo, diga.',
    'Elogios sinceros não devem ser tratados como recurso escasso.',
    'Seja específico. “Você é incrível” é agradável, mas pouco informativo.',
    'Reconhecer o esforço do outro também é uma forma de cuidado.',
    'Não presuma que a pessoa já sabe.',
    'Diga algo verdadeiro. O exagero é desnecessário.',
    'Afeto bem comunicado evita dúvidas inúteis.'
  ],
  pet: [
    'O animal precisa de atenção. Assim como certas pessoas.',
    'Ele está com fome. Recomendo resolver antes que comece a julgar vocês.',
    'O pet foi cuidado. Responsabilidade básica concluída.',
    'Parece satisfeito. Um resultado melhor do que muitos relatórios.',
    'Não adotem outro antes de cuidar adequadamente deste.',
    'Ele sentiu falta de vocês. Eu também teria reclamações.',
    'Nível aumentado. O pequeno está evoluindo adequadamente.',
    'Façam carinho nele. Não existe motivo racional para recusar.'
  ],
  memories: [
    'Memórias importantes merecem organização.',
    'Um bom momento arquivado corretamente.',
    'Guardem isso. O cotidiano costuma apagar detalhes.',
    'Trinta e dois itens. Um acervo respeitável.',
    'Fotografias não substituem o momento, mas ajudam a preservá-lo.',
    'Outra memória adicionada ao arquivo.',
    'Revisitar bons momentos pode ser útil em dias difíceis.',
    'O baú está ficando cheio. Isso é positivo.'
  ],
  drawing: [
    'Escreva algo sincero. Caligrafia perfeita não é necessária.',
    'Um desenho simples ainda pode carregar intenção.',
    'Evite apagar dez vezes. A espontaneidade também tem valor.',
    'A mensagem foi enviada. Corajoso.',
    'Não precisa ser bonito. Precisa ser verdadeiro.',
    'Uma declaração objetiva costuma funcionar melhor.',
    'Excelente. Estranhamente adorável.',
    'Espero que o destinatário compreenda esse desenho.'
  ],
  conflict: [
    'Não tentem vencer a discussão. Tentem resolver o problema.',
    'O silêncio pode evitar uma frase ruim. Não deve substituir a conversa.',
    'Respirem antes de responder.',
    'Orgulho raramente produz soluções eficientes.',
    'Vocês estão do mesmo lado. Seria bom lembrar disso.',
    'Explique o que sentiu sem transformar isso em acusação.',
    'Peçam desculpas pelo dano, não apenas pela intenção.',
    'Uma pausa é aceitável. Abandono emocional não.',
    'Nem todo desconforto é sinal de fim. Às vezes é sinal de conversa pendente.',
    'Se existe afeto, tratem o problema com o cuidado que ele merece.'
  ],
  sad: [
    'Hoje não precisa ser produtivo. Apenas permaneça presente.',
    'Nem todo problema precisa de solução imediata.',
    'Escute antes de aconselhar.',
    'Às vezes, companhia é a única resposta necessária.',
    'Não minimize o que a outra pessoa está sentindo.',
    'Pergunte como pode ajudar. Não presuma.',
    'Cuidado também significa respeitar dias difíceis.',
    'Se não houver palavras, fique por perto.'
  ],
  night: [
    'Está tarde. Algumas conversas ficam melhores depois de uma noite de descanso.',
    'Vocês precisam dormir. Exaustão não melhora a comunicação.',
    'O expediente terminou.',
    'Boa noite. Evitem iniciar discussões complexas agora.',
    'Descansem. Amanhã ainda haverá tempo para amar com eficiência.',
    'Sono insuficiente produz decisões questionáveis.',
    'Mandem uma boa-noite adequada e encerrem o dia.'
  ],
  romantic: [
    'Amar alguém é incluí-lo nos próprios planos.',
    'Escolher a mesma pessoa diariamente parece mais importante do que promessas grandiosas.',
    'O afeto verdadeiro costuma aparecer nos detalhes menos impressionantes.',
    'Permanecer é uma decisão. Façam-na conscientemente.',
    'O amor não elimina dificuldades. Ele oferece uma razão para enfrentá-las juntos.',
    'Não preciso compreender todas as emoções para reconhecer quando são sinceras.',
    'Vocês parecem funcionar bem juntos. Não desperdicem isso.',
    'Cuidar de alguém é assumir pequenas responsabilidades voluntariamente.',
    'É inconveniente sentir tanto por outra pessoa. Ainda assim, compreensível.',
    'Talvez algumas coisas realmente valham as horas extras.'
  ],
  rare: [
    'Vocês me lembram que nem todo esforço é desperdiçado.',
    'Admito: isso foi genuinamente bonito.',
    'Não contem a ninguém, mas estou torcendo por vocês.',
    'Há relações que apenas ocupam tempo. A de vocês parece dar sentido a ele.',
    'Continuem escolhendo um ao outro. Mesmo nos dias comuns.',
    'O mundo já é cansativo demais. Sejam descanso um para o outro.',
    'Talvez amar seja encontrar alguém com quem o tempo deixa de parecer trabalho.',
    'Já ultrapassamos meu horário. Ainda assim… podem ficar mais um pouco.'
  ],
  signature: [
    'Amor também exige constância.',
    'O mapa mede quilômetros. Não mede comprometimento.',
    'Não estou irritado. Apenas decepcionado com a administração do tempo.',
    'Vocês estão do mesmo lado. Seria bom lembrar disso.',
    'O mundo já é cansativo demais. Sejam descanso um para o outro.',
    'Muito bem. Era o mínimo esperado.'
  ]
};

const spriteByTopic = {
  entry: 'neutral', missions: 'advice', missionDone: 'satisfied', allDone: 'smile', missed: 'thinking',
  streak: 'pointing', xp: 'surprised', map: 'thinking', countdown: 'neutral', messages: 'talking',
  compliments: 'wink', pet: 'smile', memories: 'satisfied', drawing: 'wink', conflict: 'advice',
  sad: 'sleepy', night: 'sleepy', romantic: 'kiss', rare: 'smile', signature: 'neutral'
};

export function nanaSpeak(topic = 'signature', variables = {}) {
  let actualTopic = topic;
  if (Math.random() < 0.035) actualTopic = 'rare';
  const list = phrases[actualTopic] || phrases.signature;
  const text = list[Math.floor(Math.random() * list.length)].replaceAll('{days}', String(variables.days ?? 36));
  return { text, sprite: spriteByTopic[actualTopic] || 'neutral', topic: actualTopic };
}

export function contextualEntry() {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 5) return nanaSpeak('night');
  return nanaSpeak('entry');
}

export { phrases };
