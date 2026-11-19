/* ===== Ações da interface web do GitHub simulado ===== */
function webCreateRepo(name, vis, readme) {
  const full = W.user + '/' + name; if (W.gh[full]) return 'Já existe um repositório ' + full;
  const R = mkRemote(full, { visibility: vis });
  if (readme) R.branches.main = mkCommit('Initial commit', [], { 'README.md': '# ' + name }, 'Aluno');
  W.flags.add('repo-create:' + full); if (vis === 'private') W.flags.add('created-private:' + full);
  return 'Repositório ' + full + ' criado';
}
function webAddFile(full, name, content, msg) {
  const R = W.gh[full]; if (!name) return 'Informe o nome do arquivo';
  const tip = R.branches[R.def]; const tree = tip ? clone(W.obj[tip].tree) : {};
  if (R.protect && R.visibility === 'public' && tip) return 'A main está protegida: crie um ramo e abra um pull request.';
  tree[name] = content;
  R.branches[R.def] = mkCommit(msg || ((tip && name in W.obj[tip].tree ? 'Update ' : 'Create ') + name), tip ? [tip] : [], tree, 'Aluno', { web: true });
  W.flags.add('web-commit:' + full); onRemoteUpdate(R, R.def, 'push');
  return 'Commit criado em ' + R.def;
}
function webSet(full, key, val) {
  const R = W.gh[full];
  const paid = { protect: 'Proteção de branch', reqReview: 'Exigir aprovação', reqChecks: 'Exigir CI', pages: 'GitHub Pages', codeql: 'CodeQL (code scanning)' };
  if (val && R.visibility === 'private' && paid[key]) return paid[key] + ' em repositório privado não está no plano Free (veja o Módulo 7). Torne o repositório público ou use um plano pago.';
  if (key === 'visibility') { R.visibility = val; W.flags.add('visibility:' + full + ':' + val); if (val === 'private') { R.pages = false; } return 'Visibilidade: ' + (val === 'public' ? 'pública' : 'privada'); }
  R[key] = val; if (key === 'protect' && !val) { R.reqReview = false; R.reqChecks = false; }
  if ((key === 'reqReview' || key === 'reqChecks') && val) R.protect = true;
  if (key === 'pages' && val) W.flags.add('pages:' + full);
  return 'Configuração salva';
}
function webCollab(full, who) { const R = W.gh[full]; if (!who) return 'Informe o usuário'; if (!R.collaborators.includes(who)) R.collaborators.push(who); W.flags.add('collab:' + full + ':' + who); return who + ' convidado como colaborador'; }
const LICENCAS = { MIT: 'MIT License\n\nCopyright (c) 2026 Aluno\n\nPermission is hereby granted, free of charge, to any person obtaining a copy...', 'GPL-3.0': 'GNU GENERAL PUBLIC LICENSE\nVersion 3, 29 June 2007\n...', 'CC-BY-4.0': 'Creative Commons Attribution 4.0 International\n...' };
function webLicense(full, kind) { return webAddFile(full, 'LICENSE', LICENCAS[kind], 'Adiciona licença ' + kind); }

/* ===== Conta: cadastro, verificação e login ===== */
const RESERVADOS = ['aluno', 'admin', 'github', 'prof', 'professor', 'root', 'teste'];
function webSignup(user, email, senha) {
  user = (user || '').trim(); email = (email || '').trim();
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(user)) return 'Nome de usuário inválido: use letras, números e hífens (sem espaços, sem começar ou terminar com hífen, até 39 caracteres).';
  if (RESERVADOS.includes(user.toLowerCase())) return 'O nome "' + user + '" já está em uso. Escolha outro (ex.: seu nome-sobrenome).';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'E-mail inválido.';
  if (!(senha.length >= 15 || (senha.length >= 8 && /\d/.test(senha) && /[a-z]/.test(senha)))) return 'Senha fraca: use pelo menos 15 caracteres, ou pelo menos 8 com um número e uma letra minúscula.';
  W.user = user; W.conta = { criada: true, user, email, senha, verificado: false, logado: false, codigo: String(100000 + Math.floor(Math.random() * 900000)), nome: '', bio: '' };
  W.flags.add('signup'); return 'Conta criada! Enviamos um código de verificação para ' + email + '.';
}
function webVerify(code) { if ((code || '').trim() !== W.conta.codigo) return 'Código incorreto. Confira na caixa de entrada.'; W.conta.verificado = true; W.flags.add('verified'); return 'E-mail verificado! Agora entre com seu usuário e senha.'; }
function webLogin(id, senha) {
  const C = W.conta; id = (id || '').trim();
  if ((id !== C.user && id !== C.email) || senha !== C.senha) return 'Usuário ou senha incorretos.';
  C.logado = true; W.flags.add('login'); return 'Bem-vindo, ' + C.user + '!';
}
function webPerfil(nome, bio) { W.conta.nome = (nome || '').trim(); W.conta.bio = (bio || '').trim(); if (W.conta.nome && W.conta.bio) W.flags.add('perfil'); return 'Perfil atualizado'; }
function webLogout() { W.conta.logado = false; W.auth = false; return 'Você saiu da conta.'; }

/* ===== Ajudantes dos exercícios ===== */
function base(o) { W = freshWorld(); W.conta = { criada: true, user: 'aluno', email: 'aluno@profjon.com.br', senha: 'senha-segura-123', verificado: true, logado: true, nome: 'Aluno', bio: '' }; W.gconfig = { 'user.name': 'Aluno', 'user.email': 'aluno@profjon.com.br' }; W.auth = true; W.ghKeys = []; Object.assign(W, o || {}); }
function silent(cmds) { cmds.forEach(c => { run(c); W.cmds.pop(); }); }
function remoteWith(full, commits, opts) { const R = mkRemote(full, opts); if (commits) R.branches.main = mkHistory(commits).pop(); return R; }
const tipOf = full => W.gh[full] && W.gh[full].branches[W.gh[full].def];
const treeOf = full => tipOf(full) ? W.obj[tipOf(full)].tree : {};
const ran = re => W.cmds.some(c => re.test(c));
const fl = f => W.flags.has(f);
const flStart = p => [...W.flags].some(f => f.startsWith(p));
const commitsOn = full => tipOf(full) ? [...ancestors(tipOf(full))].map(x => W.obj[x]) : [];
const mark = () => { W.mark = W.clock; };
const newer = c => c.t > (W.mark || 0);
const noMarkers = t => !Object.values(t).some(v => /^<{7}|^={7}$|^>{7}/m.test(v));

/* ===== Exercícios ===== */
const EXERCICIOS = [
/* ---------- Módulo 1 ---------- */
{ id: '1.1', mod: 1, titulo: 'Criar a conta e entrar no GitHub', foco: 'web',
  intro: 'Tudo começa pela conta. Na aba <b>GitHub</b> ao lado, crie sua conta, confirme o e-mail com o código que chega na caixa de entrada simulada, entre com usuário e senha e complete o perfil.<br><br><b>Dicas de escolha:</b> o nome de usuário aparece em todos os seus links (github.com/<i>usuario</i>), então prefira algo profissional, como nome-sobrenome. Se tiver um e-mail de estudante (escola ou faculdade), use-o: ele permite pedir os benefícios do GitHub Education depois.',
  setup() { base(); W.conta = { criada: false, logado: false }; W.user = ''; W.auth = false; },
  metas: [
    ['Criar a conta (usuário, e-mail e senha forte)', () => fl('signup')],
    ['Verificar o e-mail com o código recebido', () => !!W.conta?.verificado],
    ['Entrar com usuário e senha', () => fl('login')],
    ['Preencher nome e bio no perfil (Conta)', () => fl('perfil')]
  ],
  dicas: ['O nome de usuário aceita letras, números e hífens, sem espaços.', 'Senha forte: 15 caracteres ou mais, ou 8 com pelo menos um número e uma letra minúscula.', 'O código de verificação aparece na "Caixa de entrada" logo abaixo do formulário.', 'Depois de entrar, toque em Conta para preencher o nome e a bio.'],
  solucao: [{ nota: 'Criar conta: usuário maria-silva, e-mail maria@profjon.com.br, senha aprendendo-github-2026', fn: () => webSignup('maria-silva', 'maria@profjon.com.br', 'aprendendo-github-2026') },
    { nota: 'Copiar o código da caixa de entrada e verificar', fn: () => webVerify(W.conta.codigo) },
    { nota: 'Entrar com maria-silva e a senha', fn: () => webLogin('maria-silva', 'aprendendo-github-2026') },
    { nota: 'Conta → nome "Maria Silva" e bio "Aluno do Prof. Jon"', fn: () => webPerfil('Maria Silva', 'Aluno do Prof. Jon') }] },
{ id: '1.2', mod: 1, titulo: 'Conectar o terminal à sua conta', foco: 'term',
  intro: 'Sua conta existe no site. Agora ligue o <b>terminal</b> a ela, para poder enviar código do computador para o GitHub. São duas coisas diferentes:<br>1) dizer ao <b>Git</b> quem você é (nome e e-mail que vão em cada commit; use o <b>mesmo e-mail da conta</b>);<br>2) fazer <b>login no GitHub</b> pelo terminal, para ter permissão de enviar.<br><br>Atenção: <code>aluno@profjon:~$</code> no começo da linha é o usuário do <i>computador</i>. Ele não muda com o login. Quem mostra a conta conectada é o <code>gh auth status</code>.',
  setup() {
    base(); W.auth = false; W.gconfig = {};
    let prev = null; try { const s = (typeof S !== 'undefined' && S.worlds && S.worlds['1.1']) || localStorage.getItem('oficina-github-ex-1.1'); if (s) prev = JSON.parse(s).W.conta; } catch (err) { }
    if (prev && prev.logado) { W.conta = prev; W.user = prev.user; this._origem = 'sua conta do exercício 1.1'; }
    else { this._origem = 'a conta de exemplo (aluno)'; }
  },
  metas: [
    ['Configurar o seu nome no Git (user.name)', () => !!W.gconfig['user.name']],
    ['Configurar o MESMO e-mail da conta (user.email)', () => W.gconfig['user.email'] && W.conta && W.gconfig['user.email'].toLowerCase() === (W.conta.email || '').toLowerCase()],
    ['Fazer login com gh auth login', () => W.auth],
    ['Conferir a conta conectada com gh auth status', () => W.auth && ran(/^gh auth status/)],
    ['Gerar uma chave SSH e cadastrá-la na conta', () => W.ghKeys.some(k => k.type === 'auth')]
  ],
  dicas: ['git config --global user.name "Seu Nome"', 'O e-mail precisa ser o da conta. Veja na aba GitHub → Conta, ou com gh auth status depois do login.', 'gh auth login e depois gh auth status', 'ssh-keygen -t ed25519 e gh ssh-key add ~/.ssh/id_ed25519.pub'],
  solucao() { return ['git config --global user.name "' + (W.conta.nome || 'Seu Nome') + '"', 'git config --global user.email "' + W.conta.email + '"', 'git config --global --list', 'gh auth login', 'gh auth status', 'ssh-keygen -t ed25519', 'gh ssh-key add ~/.ssh/id_ed25519.pub']; } },
{ id: '1.3', mod: 1, titulo: 'Conta blindada e perfil vivo', foco: 'web',
  intro: 'Você acabou de criar sua conta. Antes de tudo, proteja-a. Depois crie o repositório especial com o seu nome de usuário, que vira a página de apresentação do seu perfil.',
  setup() { base(); },
  metas: [
    ['Ativar a autenticação em dois fatores (Conta → Segurança)', () => W.twofa],
    ['Criar o repositório público aluno/aluno', () => W.gh['aluno/aluno']?.visibility === 'public'],
    ['Escrever um README.md com título (#) e uma lista (-)', () => { const t = treeOf('aluno/aluno')['README.md'] || ''; return /^#\s/m.test(t) && /^-\s/m.test(t); }]
  ],
  dicas: ['No painel GitHub, abra a aba Conta para a 2FA.', 'Crie o repositório pelo botão "+ Novo" ou com gh repo create aluno --public.', 'Use "Adicionar arquivo" no painel do repositório. Markdown: # Título e - item.'],
  solucao: [{ nota: 'Conta → ativar 2FA', fn: () => { W.twofa = true; } }, 'gh repo create aluno --public',
    { nota: 'Repositório aluno/aluno → Adicionar arquivo README.md', fn: () => webAddFile('aluno/aluno', 'README.md', '# Olá, eu sou o Aluno\n- Aluno do Prof. Jon\n- Aprendendo GitHub', 'Cria README do perfil') }] },
{ id: '1.4', mod: 1, titulo: 'Diário de bordo', foco: 'web',
  intro: 'Crie o repositório <code>diario</code> e registre o que aprendeu em cada aula, um commit por entrada, tudo pela interface web.',
  setup() { base(); },
  metas: [
    ['Criar o repositório aluno/diario', () => !!W.gh['aluno/diario']],
    ['Fazer pelo menos 3 commits na main', () => commitsOn('aluno/diario').length >= 3],
    ['Escrever mensagens de commit diferentes entre si', () => { const m = commitsOn('aluno/diario').map(c => c.msg); return m.length >= 3 && new Set(m).size === m.length; }]
  ],
  dicas: ['Ao criar pelo painel, marque "com README" para já ter o primeiro commit.', 'Edite o mesmo arquivo diario.md várias vezes: cada "Salvar" é um commit.', 'Mensagens boas dizem o que mudou: "Registra aula 2".'],
  solucao: [{ nota: '+ Novo → diario (público, com README)', fn: () => webCreateRepo('diario', 'public', true) },
    { nota: 'Adicionar arquivo diario.md (Aula 1)', fn: () => webAddFile('aluno/diario', 'diario.md', '# Diário\n- Aula 1: criei minha conta', 'Registra aula 1') },
    { nota: 'Editar diario.md (Aula 2)', fn: () => webAddFile('aluno/diario', 'diario.md', '# Diário\n- Aula 1: criei minha conta\n- Aula 2: aprendi Markdown', 'Registra aula 2') }] },
{ id: '1.5', mod: 1, titulo: 'Público ou privado, colaborador e licença', foco: 'web',
  intro: 'Comece um material como rascunho privado, convide um colega para ajudar e, quando ficar pronto, publique com uma licença que diga o que os outros podem fazer com ele.',
  setup() { base(); },
  metas: [
    ['Criar aluno/apostila como privado', () => fl('created-private:aluno/apostila') || fl('visibility:aluno/apostila:private')],
    ['Convidar o usuário "colega" como colaborador', () => fl('collab:aluno/apostila:colega')],
    ['Tornar o repositório público', () => W.gh['aluno/apostila']?.visibility === 'public'],
    ['Adicionar uma licença (LICENSE)', () => !!treeOf('aluno/apostila')['LICENSE']]
  ],
  dicas: ['Crie com visibilidade privada.', 'Configurações → Colaboradores.', 'Configurações → Visibilidade.', 'Botão "Adicionar licença": para material didático, CC-BY-4.0 é uma ótima escolha.'],
  solucao: ['gh repo create apostila --private', { nota: 'Configurações → Colaboradores → colega', fn: () => webCollab('aluno/apostila', 'colega') },
    'gh repo edit aluno/apostila --visibility public', { nota: 'Adicionar licença → CC-BY-4.0', fn: () => webLicense('aluno/apostila', 'CC-BY-4.0') }] },

/* ---------- Módulo 2 ---------- */
{ id: '2.1', mod: 2, titulo: 'Clonar e reviver o diário', foco: 'term',
  intro: 'Seu diário já está no GitHub. Traga-o para o computador, acrescente uma entrada pelo terminal e envie de volta. Esse é o ciclo completo: clone → editar → add → commit → push.',
  setup() { base(); remoteWith('aluno/diario', [{ msg: 'Initial commit', files: { 'README.md': '# diario' }, author: 'Aluno' }, { msg: 'Registra aula 1', files: { 'diario.md': '# Diário\n- Aula 1: criei minha conta' }, author: 'Aluno' }]); mark(); },
  metas: [
    ['Clonar aluno/diario', () => fl('clone:aluno/diario')],
    ['Ver o estado com git status antes do commit', () => ran(/^git status/)],
    ['Criar um commit novo no terminal', () => W.local && [...ancestors(headId(W.local))].some(x => newer(W.obj[x]))],
    ['Enviar para o GitHub (git push)', () => commitsOn('aluno/diario').some(newer)]
  ],
  dicas: ['git clone https://github.com/aluno/diario', 'echo "- Aula 3: aprendi o terminal" >> diario.md acrescenta uma linha.', 'git add diario.md, git commit -m "..." e git push'],
  solucao: ['git clone https://github.com/aluno/diario', 'cd diario', 'echo "- Aula 3: aprendi clone e push" >> diario.md', 'git status', 'git add diario.md', 'git commit -m "Registra aula 3"', 'git push'] },
{ id: '2.2', mod: 2, titulo: 'Projeto do zero com .gitignore', foco: 'term',
  intro: 'Crie um projeto local, ignore os arquivos de log, crie o repositório no GitHub e envie. O arquivo <code>debug.log</code> deve existir na sua pasta, mas nunca chegar ao GitHub.',
  setup() { base(); },
  metas: [
    ['Iniciar o repositório com git init', () => fl('init')],
    ['Ter um .gitignore que ignore *.log', () => /\*\.log|debug\.log/.test(treeOf('aluno/site')['.gitignore'] || (W.local?.files['.gitignore'] || ''))],
    ['Ter debug.log na pasta, mas fora do repositório', () => W.local?.files['debug.log'] !== undefined && !(W.local && 'debug.log' in W.local.index) && !('debug.log' in treeOf('aluno/site'))],
    ['Enviar index.html e .gitignore para aluno/site', () => 'index.html' in treeOf('aluno/site') && '.gitignore' in treeOf('aluno/site')]
  ],
  dicas: ['git init site cria a pasta e o repositório.', 'echo "*.log" > .gitignore', 'gh repo create site --public, git remote add origin https://github.com/aluno/site.git e git push -u origin main'],
  solucao: ['git init site', 'cd site', 'echo "<h1>Meu site</h1>" > index.html', 'echo "erro 42" > debug.log', 'echo "*.log" > .gitignore', 'git status', 'git add .', 'git commit -m "Primeiro commit"', 'gh repo create site --public', 'git remote add origin https://github.com/aluno/site.git', 'git push -u origin main'] },
{ id: '2.3', mod: 2, titulo: 'Arqueologia: quem quebrou a soma?', foco: 'term',
  intro: 'A calculadora da turma passou a somar errado. Use o histórico para descobrir <b>em qual commit</b> a linha <code>return a - b</code> entrou e responda com o ID dele: <code>responder ID</code>.',
  setup() {
    base(); const ids = mkHistory([
      { msg: 'Cria calculadora', files: { 'calc.js': 'function soma(a, b) {\n  return a + b\n}' }, author: 'Prof. Jonatas' },
      { msg: 'Adiciona subtração', files: { 'calc.js': 'function soma(a, b) {\n  return a + b\n}\nfunction sub(a, b) {\n  return a - b\n}' }, author: 'Carla Lima' },
      { msg: 'Adiciona README', files: { 'README.md': '# Calculadora' }, author: 'Davi Rocha' },
      { msg: 'Refatora funções', files: { 'calc.js': 'function soma(a, b) {\n  return a - b\n}\nfunction sub(a, b) {\n  return a - b\n}' }, author: 'Bia Santos' },
      { msg: 'Adiciona multiplicação', files: { 'calc.js': 'function soma(a, b) {\n  return a - b\n}\nfunction sub(a, b) {\n  return a - b\n}\nfunction mult(a, b) {\n  return a * b\n}' }, author: 'Carla Lima' },
      { msg: 'Corrige README', files: { 'README.md': '# Calculadora da turma' }, author: 'Davi Rocha' }]);
    remoteWith('aluno/calc', null).branches.main = ids[5]; this._bad = ids[3]; cloneInto('aluno/calc'); },
  metas: [
    ['Investigar com git log, git diff, git show ou git blame', () => ran(/^git (log|blame|show|diff)/)],
    ['Responder o ID do commit culpado', () => W.answer && W.answer.length >= 4 && EXERCICIOS.find(e => e.titulo.startsWith('Arqueologia'))._bad.startsWith(W.answer.toLowerCase())]
  ],
  dicas: ['git log --oneline mostra os commits; git log -- calc.js só os que mexeram no arquivo.', 'git show ID mostra o que um commit mudou.', 'Atenção: a subtração legítima também tem "a - b". O bug é a soma.'],
  solucao() { return ['git log --oneline -- calc.js', 'git show HEAD~2', 'responder ' + short(this._bad)]; } },
{ id: '2.4', mod: 2, titulo: 'Desfazer sem medo', foco: 'term',
  intro: 'Três acidentes para consertar: (1) você preparou o arquivo <code>senhas.txt</code> por engano; (2) o último commit tem a mensagem com erro de digitação "Adciona mneu"; (3) o commit "Remove rodapé" foi um erro e precisa ser desfeito.',
  setup() {
    base(); remoteWith('aluno/cardapio', [
      { msg: 'Cria página', files: { 'index.html': '<h1>Cardápio</h1>', 'rodape.html': '<footer>Profjon 2026</footer>' }, author: 'Aluno' }]);
    cloneInto('aluno/cardapio');
    silent(['git rm rodape.html', 'git commit -m "Remove rodapé"', 'echo "<nav>Menu</nav>" > menu.html', 'git add menu.html', 'git commit -m "Adciona mneu"', 'echo "admin: 1234" > senhas.txt', 'git add senhas.txt']); },
  metas: [
    ['Tirar senhas.txt do staging', () => W.local && !('senhas.txt' in W.local.index)],
    ['Corrigir a mensagem para "Adiciona menu"', () => { const c = [...ancestors(headId(W.local))].map(x => W.obj[x]); return c.some(x => x.msg === 'Adiciona menu') && !c.some(x => x.msg === 'Adciona mneu'); }],
    ['Desfazer "Remove rodapé" com git revert', () => fl('revert') && W.local && 'rodape.html' in headTree(W.local)],
    ['Não incluir senhas.txt em nenhum commit', () => W.local && ![...ancestors(headId(W.local))].some(x => 'senhas.txt' in W.obj[x].tree)]
  ],
  dicas: ['git status mostra o comando para despreparar.', 'git commit --amend -m "Adiciona menu" corrige o último commit.', 'git revert cria um commit que desfaz outro. Encontre o ID com git log --oneline.'],
  solucao: ['git status', 'git restore --staged senhas.txt', 'git commit --amend -m "Adiciona menu"', 'git log --oneline', 'git revert HEAD~1'] },
{ id: '2.5', mod: 2, titulo: 'Segredo vazado', foco: 'term',
  intro: 'Você fez um commit (ainda não enviado) com a senha do banco escrita no <code>config.js</code>. Tente o push e veja o GitHub bloquear. Depois tire a senha do <b>histórico</b>: mova-a para um <code>.env</code> ignorado e corrija o commit.',
  setup() {
    base(); remoteWith('aluno/loja', [{ msg: 'Cria loja', files: { 'index.js': "import config from './config.js'" }, author: 'Aluno' }]);
    cloneInto('aluno/loja'); silent(['echo "const password = \'admin123\'" > config.js', 'git add config.js', 'git commit -m "Configura banco"']); },
  metas: [
    ['Ver o push ser bloqueado pelo push protection', () => fl('push-blocked-secret')],
    ['Ignorar o arquivo .env no .gitignore', () => /(^|\n)\.env\b/.test(treeOf('aluno/loja')['.gitignore'] || '')],
    ['Enviar config.js sem a senha (nenhum commit com segredo no GitHub)', () => 'config.js' in treeOf('aluno/loja') && !commitsOn('aluno/loja').some(c => Object.values(c.tree).some(v => SECRET_RE.test(v)))],
    ['Manter .env só na sua máquina', () => W.local?.files['.env'] !== undefined && !('.env' in treeOf('aluno/loja'))]
  ],
  dicas: ['Primeiro git push para ver o bloqueio.', 'echo "DB_PASSWORD=admin123" > .env e echo ".env" > .gitignore', "config.js deve ler a variável: const password = process.env.DB_PASSWORD", 'Como o commit não foi enviado, git commit --amend reescreve-o sem a senha.'],
  solucao: ['git push', 'echo "DB_PASSWORD=admin123" > .env', 'echo ".env" > .gitignore', 'echo "const password = process.env.DB_PASSWORD" > config.js', 'git add config.js .gitignore', 'git commit --amend -m "Configura banco com variável de ambiente"', 'git push'] },

/* ---------- Módulo 3 ---------- */
{ id: '3.1', mod: 3, titulo: 'Primeiro ramo', foco: 'term',
  intro: 'Crie o ramo <code>feature/placar</code>, desenvolva o placar do jogo nele, volte para a <code>main</code>, faça o merge e apague o ramo. Acompanhe tudo no grafo.',
  setup() { base(); remoteWith('aluno/jogo', [{ msg: 'Cria jogo', files: { 'jogo.js': 'iniciarJogo()' }, author: 'Aluno' }]); cloneInto('aluno/jogo'); mark(); },
  metas: [
    ['Criar e entrar no ramo feature/placar', () => ran(/^git (switch -c|checkout -b) feature\/placar/)],
    ['Fazer um commit com placar.js no ramo', () => Object.values(W.obj).some(c => newer(c) && 'placar.js' in c.tree)],
    ['Mesclar na main', () => W.local?.branches.main && 'placar.js' in W.obj[W.local.branches.main].tree],
    ['Apagar o ramo depois do merge', () => W.local && !W.local.branches['feature/placar'] && ran(/feature\/placar/)]
  ],
  dicas: ['git switch -c feature/placar', 'Volte com git switch main e mescle com git merge feature/placar.', 'git branch -d feature/placar'],
  solucao: ['git switch -c feature/placar', 'echo "let pontos = 0" > placar.js', 'git add placar.js', 'git commit -m "Adiciona placar"', 'git switch main', 'git merge feature/placar', 'git branch -d feature/placar'] },
{ id: '3.2', mod: 3, titulo: 'Livro coletivo: seu primeiro pull request', foco: 'term',
  intro: 'A turma escreve um livro juntos. O repositório <code>prof/livro</code> tem a main protegida: tudo entra por PR com aprovação. Escreva o capítulo 2 num ramo, abra o PR, peça a revisão de um colega e faça o merge.',
  setup() { base(); remoteWith('prof/livro', [{ msg: 'Cria livro', files: { 'capitulo-1.md': '# Capítulo 1\nEra uma vez um repositório...' } }], { collaborators: ['aluno'], protect: true, reqReview: true }); cloneInto('prof/livro'); },
  metas: [
    ['Enviar o ramo cap-2 para o GitHub', () => !!W.gh['prof/livro'].branches['cap-2']],
    ['Abrir o pull request', () => fl('pr-create:prof/livro')],
    ['Receber a aprovação do colega', () => W.gh['prof/livro'].prs.some(p => p.approvals.length)],
    ['Mesclar: capitulo-2.md na main do livro', () => 'capitulo-2.md' in treeOf('prof/livro')]
  ],
  dicas: ['git switch -c cap-2, crie capitulo-2.md e faça commit.', 'git push -u origin cap-2 e depois gh pr create --title "Capítulo 2"', 'Simule a revisão com o botão "Colega aprova" no PR ou com o comando colega aprova.', 'gh pr merge'],
  solucao: ['git switch -c cap-2', 'echo "# Capítulo 2\nO commit perdido" > capitulo-2.md', 'git add .', 'git commit -m "Escreve capítulo 2"', 'git push -u origin cap-2', 'gh pr create --title "Capítulo 2" --body "Primeira versão do capítulo"', 'colega aprova', 'gh pr merge'] },
{ id: '3.3', mod: 3, titulo: 'Caça às issues', foco: 'term',
  intro: 'O professor abriu uma issue <code>good first issue</code> no site da turma. Encontre-a, corrija o problema num ramo e abra um PR que <b>feche a issue automaticamente</b> no merge.',
  setup() { base(); const R = remoteWith('prof/site-turma', [{ msg: 'Cria site', files: { 'README.md': '# Ste da Trma', 'index.html': '<h1>Turma 2026</h1>' } }], { collaborators: ['aluno'] }); R.issues.push({ n: 1, title: 'Corrigir título do README', body: 'O título está com dois erros de digitação. Deve ser "Site da Turma".', label: 'good first issue', state: 'open', author: 'prof' }); cloneInto('prof/site-turma'); },
  metas: [
    ['Listar as issues', () => ran(/^gh issue (list|view)/)],
    ['Corrigir o título para "Site da Turma"', () => /# Site da Turma/.test(treeOf('prof/site-turma')['README.md'] || '')],
    ['Fechar a issue #1 pelo PR (Closes #1)', () => fl('issue-closed:1')]
  ],
  dicas: ['gh issue list e gh issue view 1', 'Corrija num ramo próprio, por exemplo fix-titulo.', 'gh pr create --title "Corrige título" --body "Closes #1"'],
  solucao: ['gh issue list', 'gh issue view 1', 'git switch -c fix-titulo', 'echo "# Site da Turma" > README.md', 'git commit -am "Corrige título do README"', 'git push -u origin fix-titulo', 'gh pr create --title "Corrige título do README" --body "Closes #1"', 'gh pr merge'] },
{ id: '3.4', mod: 3, titulo: 'Main intocável', foco: 'term',
  intro: 'Proteja a main do seu repositório público: exija PR e 1 aprovação. Depois tente enviar direto para a main (vai falhar!) e faça do jeito certo.',
  setup() { base(); remoteWith('aluno/app', [{ msg: 'Cria app', files: { 'app.js': 'console.log("v1")' }, author: 'Aluno' }]); cloneInto('aluno/app'); },
  metas: [
    ['Ativar a proteção da main com aprovação obrigatória', () => W.gh['aluno/app'].protect && W.gh['aluno/app'].reqReview],
    ['Ver o push direto na main ser recusado', () => fl('push-rejected-protect')],
    ['Entregar a mudança por um PR aprovado', () => W.gh['aluno/app'].prs.some(p => p.state === 'merged' && p.approvals.length)]
  ],
  dicas: ['Painel GitHub → Configurações → Proteger main + Exigir 1 aprovação.', 'Faça um commit na main e git push: observe o erro GH006.', 'Crie um ramo a partir dali: git switch -c melhoria, envie e abra o PR.'],
  solucao: [{ nota: 'Configurações → Proteger main + Exigir 1 aprovação', fn: () => { webSet('aluno/app', 'protect', true); webSet('aluno/app', 'reqReview', true); } }, 'echo "console.log(\'v2\')" > app.js', 'git commit -am "Atualiza versão"', 'git push', 'git switch -c melhoria', 'git push -u origin melhoria', 'gh pr create --title "Atualiza versão"', 'colega aprova', 'gh pr merge'] },
{ id: '3.5', mod: 3, titulo: 'Fork e contribuição', foco: 'term',
  intro: 'O repositório <code>prof/receitas</code> aceita receitas regionais, mas você não tem permissão de escrita. Faça um fork, contribua no seu fork e abra um PR para o original.',
  setup() { base(); remoteWith('prof/receitas', [{ msg: 'Cria livro de receitas', files: { 'README.md': '# Receitas do Nordeste\nEnvie a sua por pull request!', 'cuscuz.md': '# Cuscuz' } }]); },
  metas: [
    ['Fazer o fork de prof/receitas', () => !!W.gh['aluno/receitas']?.forkOf],
    ['Enviar sua receita para um ramo do seu fork', () => Object.entries(W.gh['aluno/receitas']?.branches || {}).some(([b, id]) => b !== 'main' && Object.keys(W.obj[id].tree).length > 2)],
    ['Abrir o PR para prof/receitas', () => fl('pr-create:prof/receitas')]
  ],
  dicas: ['gh repo fork prof/receitas --clone já clona e configura o upstream.', 'Tentar git push direto no prof/receitas dá "Permissão negada".', 'Do seu fork, gh pr create abre o PR para o original.'],
  solucao: ['gh repo fork prof/receitas --clone', 'git remote -v', 'git switch -c bolo-de-rolo', 'echo "# Bolo de rolo" > bolo-de-rolo.md', 'git add .', 'git commit -m "Adiciona receita de bolo de rolo"', 'git push -u origin bolo-de-rolo', 'gh pr create --title "Receita: bolo de rolo"'] },

/* ---------- Módulo 4 ---------- */
{ id: '4.1', mod: 4, titulo: 'Conflito provocado', foco: 'term',
  intro: 'Você e uma colega mudaram o título do cartaz ao mesmo tempo. Ela enviou primeiro. Seu push vai ser recusado: traga as mudanças dela, resolva o conflito e envie.',
  setup() {
    base(); remoteWith('aluno/cartaz', [{ msg: 'Cria cartaz', files: { 'titulo.txt': 'Feira 2026', 'local.txt': 'Auditório do Profjon' }, author: 'Aluno' }], { collaborators: ['bia'] });
    cloneInto('aluno/cartaz'); silent(['echo "Feira de Tecnologia 2026" > titulo.txt', 'git commit -am "Muda título para Tecnologia"']);
    const R = W.gh['aluno/cartaz']; R.branches.main = mkHistory([{ msg: 'Título com Ciências', files: { 'titulo.txt': 'Feira de Ciências 2026' }, author: 'Bia Santos' }], R.branches.main).pop(); },
  metas: [
    ['Ter o push recusado (fetch first)', () => fl('push-rejected-ff')],
    ['Provocar o conflito com git pull', () => fl('conflict')],
    ['Resolver sem deixar marcadores e enviar um commit de merge', () => { const c = W.obj[tipOf('aluno/cartaz')]; return c.parents.length === 2 && noMarkers(c.tree); }]
  ],
  dicas: ['git push vai falhar: o remoto tem um commit que você não tem.', 'git pull traz o commit e mostra o conflito. Abra com nano titulo.txt ou cat titulo.txt.', 'Escreva a versão final (ex.: "Feira de Ciências e Tecnologia 2026"), git add titulo.txt, git commit e git push.'],
  solucao: ['git push', 'git pull', 'cat titulo.txt', 'echo "Feira de Ciências e Tecnologia 2026" > titulo.txt', 'git add titulo.txt', 'git commit -m "Resolve conflito no título"', 'git push'] },
{ id: '4.2', mod: 4, titulo: 'Limpeza de histórico antes do PR', foco: 'term',
  intro: 'O ramo <code>carrinho</code> tem 3 commits bagunçados ("wip", "wip 2", "ajuste") e a main andou. Junte tudo num commit só, "Adiciona carrinho de compras", e coloque o ramo em cima da main atual.',
  setup() {
    base(); remoteWith('aluno/loja2', [{ msg: 'Cria loja', files: { 'index.html': '<h1>Loja</h1>' }, author: 'Aluno' }]); cloneInto('aluno/loja2');
    silent(['git switch -c carrinho', 'echo "const itens = []" > carrinho.js', 'git add .', 'git commit -m "wip"', 'echo "const itens = []\nfunction add(i) {}" > carrinho.js', 'git commit -am "wip 2"', 'echo "const itens = []\nfunction add(i) { itens.push(i) }" > carrinho.js', 'git commit -am "ajuste"', 'git switch main', 'echo "<h1>Loja Profjon</h1>" > index.html', 'git commit -am "Atualiza título"', 'git switch carrinho']); },
  metas: [
    ['Ter um único commit no ramo carrinho além da main', () => { const L = W.local; if (!L?.branches.carrinho) return false; const M = ancestors(L.branches.main); return [...ancestors(L.branches.carrinho)].filter(x => !M.has(x)).length === 1; }],
    ['Com a mensagem "Adiciona carrinho de compras"', () => W.local?.branches.carrinho && W.obj[W.local.branches.carrinho].msg === 'Adiciona carrinho de compras'],
    ['Com o ramo em cima da ponta da main (rebase)', () => { const L = W.local; return L?.branches.carrinho && W.obj[L.branches.carrinho].parents[0] === L.branches.main; }],
    ['Sem perder o código do carrinho', () => /itens\.push/.test(W.obj[W.local?.branches.carrinho]?.tree['carrinho.js'] || '')]
  ],
  dicas: ['git log --oneline --all ajuda a ver a situação.', 'git reset --soft HEAD~3 desfaz os 3 commits, mas mantém as mudanças preparadas.', 'Depois do commit único, git rebase main.'],
  solucao: ['git log --oneline --all', 'git reset --soft HEAD~3', 'git commit -m "Adiciona carrinho de compras"', 'git rebase main'] },
{ id: '4.3', mod: 4, titulo: 'Rede de segurança: reflog', foco: 'term',
  intro: 'Um colega rodou <code>git reset --hard HEAD~2</code> na sua máquina e os capítulos 4 e 5 "sumiram". Eles não sumiram: recupere-os com o reflog.',
  setup() { base(); W.local = null; silent(['git init apostila', 'echo "# Cap 1" > cap1.md', 'git add .', 'git commit -m "Capítulo 1"', 'echo "# Cap 2" > cap2.md', 'git add .', 'git commit -m "Capítulo 2"', 'echo "# Cap 3" > cap3.md', 'git add .', 'git commit -m "Capítulo 3"', 'echo "# Cap 4" > cap4.md', 'git add .', 'git commit -m "Capítulo 4"', 'echo "# Cap 5" > cap5.md', 'git add .', 'git commit -m "Capítulo 5"', 'git reset --hard HEAD~2']); W.flags.clear(); },
  metas: [
    ['Consultar o git reflog', () => ran(/^git reflog/)],
    ['Recuperar o commit "Capítulo 5" na main', () => W.local?.branches.main && W.obj[W.local.branches.main].msg === 'Capítulo 5'],
    ['Ter cap5.md de volta na pasta', () => W.local?.files['cap5.md'] !== undefined]
  ],
  dicas: ['git log não mostra os capítulos perdidos, mas git reflog mostra.', 'HEAD@{1} é onde o HEAD estava antes do reset.', 'git reset --hard HEAD@{1} (ou o ID do commit "Capítulo 5").'],
  solucao: ['git log --oneline', 'git reflog', 'git reset --hard HEAD@{1}', 'ls'] },
{ id: '4.4', mod: 4, titulo: 'Stash e cherry-pick', foco: 'term',
  intro: 'Você está no meio de uma mudança no <code>estilo.css</code> quando pedem para levar para a main, com urgência, só a correção do login que está no ramo <code>experimento</code>. Guarde o trabalho, copie aquele commit e traga seu trabalho de volta.',
  setup() {
    base(); remoteWith('aluno/portal', [{ msg: 'Cria portal', files: { 'login.js': 'if (senha = digitada) entrar()', 'estilo.css': 'body { color: black }' }, author: 'Aluno' }]); cloneInto('aluno/portal');
    silent(['git switch -c experimento', 'echo "body { color: purple }" > estilo.css', 'git commit -am "Testa cor roxa"', 'echo "if (senhaCorreta(digitada)) entrar()" > login.js', 'git commit -am "Corrige bug do login"', 'echo "// tema escuro" > tema.js', 'git add .', 'git commit -m "Esboço de tema escuro"', 'git switch main', 'echo "body { color: navy }" > estilo.css']);
    this._fix = Object.values(W.obj).find(c => c.msg === 'Corrige bug do login').id; mark(); },
  metas: [
    ['Guardar o trabalho com git stash', () => fl('stash')],
    ['Trazer para a main só o commit "Corrige bug do login"', () => { const L = W.local; if (!L?.branches.main) return false; const t = W.obj[L.branches.main]; return t.msg === 'Corrige bug do login' && /senhaCorreta/.test(t.tree['login.js']) && !('tema.js' in t.tree); }],
    ['Recuperar o trabalho em estilo.css', () => fl('stash-pop') && /navy/.test(W.local?.files['estilo.css'] || '')]
  ],
  dicas: ['git stash guarda o trabalho e limpa a pasta.', 'git log experimento --oneline mostra o ID da correção.', 'git cherry-pick ID e depois git stash pop.'],
  solucao() { return ['git stash', 'git log experimento --oneline', 'git cherry-pick ' + short(this._fix), 'git stash pop', 'git status']; } },
{ id: '4.5', mod: 4, titulo: 'Fork vivo', foco: 'term',
  intro: 'Você fez o fork da apostila do professor há semanas e ele publicou dois capítulos novos. Atualize o seu fork com o original (upstream) antes de contribuir de novo.',
  setup() {
    base(); const R = remoteWith('prof/apostila', [{ msg: 'Cria apostila', files: { 'cap1.md': '# Git' } }]);
    mkRemote('aluno/apostila', { forkOf: 'prof/apostila', branches: clone(R.branches) });
    R.branches.main = mkHistory([{ msg: 'Capítulo 2: ramos', files: { 'cap2.md': '# Ramos' } }, { msg: 'Capítulo 3: PRs', files: { 'cap3.md': '# PRs' } }], R.branches.main).pop();
    cloneInto('aluno/apostila'); },
  metas: [
    ['Adicionar o remoto upstream', () => W.local?.remotes.upstream === 'prof/apostila'],
    ['Buscar as novidades com git fetch upstream', () => fl('fetch:upstream')],
    ['Seu fork no GitHub com os capítulos novos', () => isAnc(tipOf('prof/apostila'), tipOf('aluno/apostila'))]
  ],
  dicas: ['git remote add upstream https://github.com/prof/apostila.git', 'git fetch upstream e git merge upstream/main', 'git push envia para o seu fork (origin).'],
  solucao: ['git remote -v', 'git remote add upstream https://github.com/prof/apostila.git', 'git fetch upstream', 'git merge upstream/main', 'git push'] },

{ id: '4.6', mod: 4, titulo: 'Três pull requests ao mesmo tempo', foco: 'term',
  intro: 'Você mantém o repositório <code>aluno/turma-app</code> e há três PRs abertos: a <b>Ana</b> mudou a linha do título no <code>app.js</code>, o <b>Caio</b> mudou o <code>estilo.css</code> e o <b>seu</b> PR (ramo <code>meu-titulo</code>) mudou o título <i>e</i> a versão no <code>app.js</code>. Mescle na ordem em que chegaram e observe: os de lugares diferentes entram sozinhos; o que mexeu na mesma linha precisa ser resolvido. Acompanhe pela aba GitHub → Pull requests.',
  setup() {
    base(); const app = "const titulo = 'App da Turma'\n\n// configurações gerais\nconst idioma = 'pt-BR'\nconst versao = 1\n\nfunction iniciar() {\n  mostrar(titulo)\n}";
    const R = remoteWith('aluno/turma-app', [{ msg: 'Cria app da turma', files: { 'app.js': app, 'estilo.css': 'body { color: black }', 'README.md': '# App da Turma' }, author: 'Aluno' }], { collaborators: ['ana', 'caio'] });
    const m = R.branches.main;
    R.branches['ana/titulo'] = mkHistory([{ msg: 'Atualiza ano no título', files: { 'app.js': app.replace("'App da Turma'", "'App da Turma 2026'") }, author: 'Ana' }], m).pop();
    R.branches['caio/estilo'] = mkHistory([{ msg: 'Muda cor do texto', files: { 'estilo.css': 'body { color: navy }' }, author: 'Caio' }], m).pop();
    R.branches['meu-titulo'] = mkHistory([{ msg: 'Renomeia app e sobe versão', files: { 'app.js': app.replace("'App da Turma'", "'Portal da Turma'").replace('versao = 1', 'versao = 2') }, author: 'Aluno' }], m).pop();
    [['Atualiza ano no título', 'ana/titulo', 'ana'], ['Muda cor do texto', 'caio/estilo', 'caio'], ['Renomeia app e sobe versão', 'meu-titulo', 'aluno']].forEach(([t, h, au], i) => { const p = { n: i + 1, title: t, body: '', head: h, headRepo: 'aluno/turma-app', base: 'main', repo: 'aluno/turma-app', state: 'open', approvals: [], author: au, checks: null }; R.prs.push(p); });
    cloneInto('aluno/turma-app'); },
  metas: [
    ['Mesclar o PR #1 da Ana (sem conflito)', () => W.gh['aluno/turma-app'].prs[0].state === 'merged'],
    ['Mesclar o PR #2 do Caio: outro arquivo, entra sozinho', () => W.gh['aluno/turma-app'].prs[1].state === 'merged'],
    ['Ver o seu PR #3 bloqueado por conflito (mesma linha do título)', () => fl('pr-conflito:3') || (fl('conflict') && W.gh['aluno/turma-app'].prs[0].state === 'merged')],
    ['Trazer a main para o seu ramo e resolver o conflito', () => fl('conflict') && W.gh['aluno/turma-app'].branches['meu-titulo'] && W.obj[W.gh['aluno/turma-app'].branches['meu-titulo']].parents.length === 2],
    ['Mesclar o seu PR: a main fica com as três contribuições e sem marcadores', () => { const R = W.gh['aluno/turma-app']; const t = treeOf('aluno/turma-app'); return R.prs[2].state === 'merged' && /navy/.test(t['estilo.css']) && /versao = 2/.test(t['app.js']) && noMarkers(t); }]
  ],
  dicas: ['gh pr list mostra os três PRs. Mescle com gh pr merge 1 e gh pr merge 2.', 'gh pr merge 3 vai ser recusado: o título mudou na main depois que você abriu o PR.', 'git switch meu-titulo e git pull origin main trazem a main para o seu ramo. Repare que só a linha do título fica em conflito: a versão (linha 2) e o CSS do Caio entram sozinhos.', 'Escolha o título final, apague os marcadores, git add, git commit, git push e gh pr merge 3.'],
  solucao: ['gh pr list', 'gh pr merge 1', 'gh pr merge 2', 'gh pr merge 3', 'git switch meu-titulo', 'git pull origin main', 'cat app.js', 'nano app.js', { nota: 'No editor: deixe uma só linha de título (ex.: Portal da Turma 2026), apague os marcadores e salve', fn: () => { W.local.files['app.js'] = W.local.files['app.js'].replace(/<<<<<<<[^]*?>>>>>>>[^\n]*/, "const titulo = 'Portal da Turma 2026'"); W.editor = null; } }, 'git add app.js', 'git commit -m "Resolve conflito do título com a main"', 'git push', 'gh pr merge 3'] },

/* ---------- Módulo 5 ---------- */
{ id: '5.1', mod: 5, titulo: 'Pipeline verde', foco: 'term',
  intro: 'Crie um workflow que rode <code>npm test</code> em cada PR. O ramo <code>feature/soma</code> tem um bug: abra o PR, veja o CI falhar, corrija e só faça o merge com o ✓.',
  setup() {
    base(); remoteWith('aluno/calc-ci', [{ msg: 'Cria projeto', files: { 'calc.js': 'export const soma = (a, b) => a + b', 'calc.test.js': 'espera soma(2, 3) === 5' }, author: 'Aluno' }]); cloneInto('aluno/calc-ci');
    silent(['git switch -c feature/soma', 'echo "export const soma = (a, b) => a - b" > calc.js', 'git commit -am "feat: melhora soma"', 'git push -u origin feature/soma', 'git switch main']); W.flags.clear(); },
  metas: [
    ['Ter um workflow com pull_request na main', () => workflows(treeOf('aluno/calc-ci')).some(([k, v]) => /pull_request/.test(v))],
    ['Ver o CI falhar no PR', () => fl('ci-fail')],
    ['Mesclar o PR com o CI passando', () => W.gh['aluno/calc-ci'].prs.some(p => p.state === 'merged' && p.checks === 'ok')]
  ],
  dicas: ['O workflow fica em .github/workflows/ci.yml. Use \\n dentro de aspas para quebrar linhas no echo, ou nano.', 'Depois de enviar o workflow, traga-o para o ramo: git switch feature/soma e git merge main.', 'gh pr checks mostra o resultado. Corrija calc.js, faça push e confira de novo.'],
  solucao: ['echo "on: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test" > .github/workflows/ci.yml', 'git add .', 'git commit -m "ci: roda testes em cada PR"', 'git push', 'git switch feature/soma', 'git merge main', 'git push', 'gh pr create --title "feat: melhora soma"', 'gh pr checks', 'echo "export const soma = (a, b) => a + b" > calc.js', 'git commit -am "fix: corrige soma"', 'git push', 'gh pr checks', 'gh pr merge'] },
{ id: '5.2', mod: 5, titulo: 'Deploy automático no Pages', foco: 'term',
  intro: 'Publique seu portfólio no GitHub Pages e veja o site atualizar sozinho a cada push na main.',
  setup() { base(); remoteWith('aluno/portfolio', [{ msg: 'Cria portfólio', files: { 'index.html': '<h1>Em construção</h1>' }, author: 'Aluno' }]); cloneInto('aluno/portfolio'); },
  metas: [
    ['Ativar o GitHub Pages (Configurações)', () => W.gh['aluno/portfolio'].pages],
    ['Atualizar o index.html e enviar', () => !/Em construção/.test(treeOf('aluno/portfolio')['index.html'] || 'Em construção')],
    ['Ver o site publicado (aba Pages)', () => W.gh['aluno/portfolio'].pages && W.flags.has('viewed-pages')]
  ],
  dicas: ['Painel → Configurações → GitHub Pages.', 'Edite index.html, commit e push.', 'Abra a aba Pages do repositório no painel.'],
  solucao: [{ nota: 'Configurações → ativar GitHub Pages', fn: () => webSet('aluno/portfolio', 'pages', true) }, 'echo "<h1>Portfólio do Aluno</h1><p>Projetos em Flutter e Next.js</p>" > index.html', 'git commit -am "docs: publica portfólio"', 'git push', { nota: 'Abrir a aba Pages', fn: () => W.flags.add('viewed-pages') }] },
{ id: '5.3', mod: 5, titulo: 'Alerta de dependência', foco: 'term',
  intro: 'Ative o Dependabot na sua API. Ele vai encontrar uma versão vulnerável do <code>lodash</code>. Atualize a dependência e confirme que o alerta sumiu.',
  setup() { base(); remoteWith('aluno/api', [{ msg: 'Cria API', files: { 'package.json': '{\n  "dependencies": {\n    "lodash": "4.17.15"\n  }\n}', 'index.js': 'import _ from "lodash"' }, author: 'Aluno' }]); cloneInto('aluno/api'); },
  metas: [
    ['Ativar o Dependabot', () => W.gh['aluno/api'].dependabot],
    ['Atualizar o lodash para 4.17.21 na main', () => /4\.17\.21/.test(treeOf('aluno/api')['package.json'] || '')],
    ['Ficar sem alertas de segurança', () => W.gh['aluno/api'].dependabot && !securityAlerts(W.gh['aluno/api']).length]
  ],
  dicas: ['Configurações → Dependabot. A aba Segurança mostra o alerta.', 'Edite o package.json (nano package.json) trocando a versão.', 'Commit com prefixo fix: e push.'],
  solucao: [{ nota: 'Configurações → ativar Dependabot', fn: () => webSet('aluno/api', 'dependabot', true) }, 'cat package.json', 'echo \'{ "dependencies": { "lodash": "4.17.21" } }\' > package.json', 'git commit -am "fix: atualiza lodash para 4.17.21"', 'git push'] },
{ id: '5.4', mod: 5, titulo: 'Release oficial', foco: 'term',
  intro: 'Faça dois commits seguindo Conventional Commits, marque a versão <code>v1.0.0</code> e publique a release com notas geradas a partir dos commits.',
  setup() { base(); remoteWith('aluno/agenda', [{ msg: 'Cria agenda', files: { 'app.js': 'agenda()' }, author: 'Aluno' }]); cloneInto('aluno/agenda'); mark(); },
  metas: [
    ['Enviar 2 commits com prefixos feat:, fix:, docs: etc.', () => commitsOn('aluno/agenda').filter(c => newer(c) && /^(feat|fix|docs|ci|refactor|test|chore)(\(.+\))?!?: /.test(c.msg)).length >= 2],
    ['Enviar a tag v1.0.0 para o GitHub', () => !!W.gh['aluno/agenda'].tags['v1.0.0'] && (fl('push-tag:v1.0.0') || fl('push-tags'))],
    ['Publicar a release v1.0.0', () => fl('release:v1.0.0')]
  ],
  dicas: ['git commit -m "feat: adiciona lembretes"', 'git tag v1.0.0 e git push origin v1.0.0', 'gh release create v1.0.0 --generate-notes'],
  solucao: ['echo "lembretes()" > lembretes.js', 'git add .', 'git commit -m "feat: adiciona lembretes"', 'echo "# Agenda\nApp de agenda da turma" > README.md', 'git add .', 'git commit -m "docs: cria README"', 'git push', 'git tag v1.0.0', 'git push origin v1.0.0', 'gh release create v1.0.0 --generate-notes'] },

/* ---------- Módulo 6 ---------- */
{ id: '6.1', mod: 6, titulo: 'Detetive de bugs: git bisect', foco: 'term',
  intro: 'Depois de 10 commits, a soma quebrou e o <code>npm test</code> falha. Use o <code>git bisect</code> para achar o primeiro commit ruim, na mão ou com <code>git bisect run npm test</code>.',
  setup() {
    base(); const msgs = ['Cria calculadora', 'Adiciona testes', 'Adiciona subtração', 'Melhora README', 'Adiciona multiplicação', 'Adiciona divisão', 'Refatora soma', 'Adiciona potência', 'Corrige README', 'Adiciona raiz'];
    let calc = 'const soma = (a, b) => a + b'; const list = msgs.map((m, i) => {
      const f = {}; if (i === 1) f['calc.test.js'] = 'espera soma(2, 3) === 5';
      if (i === 6) calc = calc.replace('a + b', 'a - b'); if ([2, 4, 5, 6, 7, 9].includes(i)) { calc += '\n// ' + m; f['calc.js'] = calc; } if (i === 0) f['calc.js'] = calc; if (i === 3 || i === 8) f['README.md'] = '# Calc v' + i;
      return { msg: m, files: f, author: ['Ana', 'Bia Santos', 'Carla Lima', 'Davi Rocha'][i % 4] }; });
    const ids = mkHistory(list); remoteWith('aluno/calc-bisect', null).branches.main = ids[9]; this._bad = ids[6]; this._first = ids[1]; cloneInto('aluno/calc-bisect'); },
  metas: [
    ['Confirmar o bug com npm test', () => ran(/^npm test/)],
    ['Encontrar o primeiro commit ruim com o bisect', () => fl('bisect-found:' + EXERCICIOS.find(e => e.id === '6.1')._bad)],
    ['Encerrar com git bisect reset', () => fl('bisect-reset') && !W.local?.bisect]
  ],
  dicas: ['git bisect start e depois git bisect bad (o atual está ruim).', 'O commit "Adiciona testes" é bom: pegue o ID dele com git log --oneline.', 'git bisect run npm test faz o resto sozinho.'],
  solucao() { return ['npm test', 'git log --oneline', 'git bisect start', 'git bisect bad', 'git bisect good ' + short(this._first), 'git bisect run npm test', 'git bisect reset']; } },
{ id: '6.2', mod: 6, titulo: 'Porteiro automático: hook pre-commit', foco: 'term',
  intro: 'Crie um hook <code>pre-commit</code> que recuse commits com <code>console.log</code> esquecido. Teste o bloqueio e depois faça o commit limpo.',
  setup() { base(); remoteWith('aluno/blog', [{ msg: 'Cria blog', files: { 'index.js': 'export const blog = true' }, author: 'Aluno' }]); cloneInto('aluno/blog'); mark(); },
  metas: [
    ['Criar .git/hooks/pre-commit com a regra "proibir console.log"', () => /proibir\s+console\.log/.test(W.local?.files['.git/hooks/pre-commit'] || '')],
    ['Ver o hook barrar um commit', () => fl('hook-blocked')],
    ['Commitar post.js sem console.log', () => W.local && Object.values(W.obj).some(c => newer(c) && 'post.js' in c.tree && !/console\.log/.test(c.tree['post.js']) && ancestors(headId(W.local)).has(c.id))]
  ],
  dicas: ['echo "proibir console.log" > .git/hooks/pre-commit (no Git real, o hook é um script de shell).', "echo 'console.log(\"teste\")' > post.js, git add e tente o commit.", 'Remova o console.log, git add de novo e faça o commit.'],
  solucao: ['echo "proibir console.log" > .git/hooks/pre-commit', 'echo \'console.log("teste")\' > post.js', 'git add post.js', 'git commit -m "feat: cria post"', 'echo "export const post = \'Olá\'" > post.js', 'git add post.js', 'git commit -m "feat: cria post"'] },
{ id: '6.3', mod: 6, titulo: 'Commit verificado', foco: 'term',
  intro: 'Assine seus commits com uma chave SSH para ganhar o selo <b>Verified</b> no GitHub.',
  setup() { base(); remoteWith('aluno/notas', [{ msg: 'Cria notas', files: { 'notas.md': '# Notas' }, author: 'Aluno' }]); cloneInto('aluno/notas'); },
  metas: [
    ['Gerar a chave e cadastrá-la como chave de assinatura', () => W.ghKeys.some(k => k.type === 'signing')],
    ['Configurar o Git para assinar (gpg.format, signingkey, gpgsign)', () => cfg('gpg.format') === 'ssh' && !!cfg('user.signingkey') && cfg('commit.gpgsign') === 'true'],
    ['Enviar um commit Verified para a main', () => commitsOn('aluno/notas').some(c => c.signed && W.ghKeys.some(k => k.key === c.key && k.type === 'signing'))]
  ],
  dicas: ['ssh-keygen -t ed25519 e gh ssh-key add ~/.ssh/id_ed25519.pub --type signing', 'git config --global gpg.format ssh, user.signingkey ~/.ssh/id_ed25519.pub e commit.gpgsign true', 'Faça um commit, git log mostra a assinatura, e git push.'],
  solucao: ['ssh-keygen -t ed25519', 'gh ssh-key add ~/.ssh/id_ed25519.pub --type signing', 'git config --global gpg.format ssh', 'git config --global user.signingkey ~/.ssh/id_ed25519.pub', 'git config --global commit.gpgsign true', 'echo "- assinatura configurada" >> notas.md', 'git commit -am "docs: atualiza notas"', 'git log -1', 'git push'] },
{ id: '6.4', mod: 6, titulo: 'Varredura de código com CodeQL', foco: 'term',
  intro: 'Ative o CodeQL no seu repositório público. Ele vai apontar um <code>eval()</code> perigoso. Corrija e confirme que o alerta fechou.',
  setup() { base(); remoteWith('aluno/calc-web', [{ msg: 'Cria calculadora web', files: { 'app.js': 'const entrada = lerCampo()\nconst resultado = eval(entrada)\nmostrar(resultado)' }, author: 'Aluno' }]); cloneInto('aluno/calc-web'); },
  metas: [
    ['Ativar o CodeQL (grátis em público)', () => W.gh['aluno/calc-web'].codeql],
    ['Remover o eval do app.js na main', () => !/eval\s*\(/.test(treeOf('aluno/calc-web')['app.js'] || 'eval(')],
    ['Ficar sem alertas na aba Segurança', () => W.gh['aluno/calc-web'].codeql && !securityAlerts(W.gh['aluno/calc-web']).length]
  ],
  dicas: ['Configurações → CodeQL.', 'Troque o eval por uma função segura, por exemplo calcular(entrada).', 'Commit fix: e push.'],
  solucao: [{ nota: 'Configurações → ativar CodeQL', fn: () => webSet('aluno/calc-web', 'codeql', true) }, 'echo "const entrada = lerCampo()\nconst resultado = calcular(entrada)\nmostrar(resultado)" > app.js', 'git commit -am "fix: remove eval inseguro"', 'git push'] },
{ id: '6.5', mod: 6, titulo: 'Matriz de testes e runner do laboratório', foco: 'term',
  intro: 'Crie um workflow que teste em 3 versões do Node ao mesmo tempo (matriz) e outro que rode numa máquina do laboratório (runner self-hosted, grátis).',
  setup() { base(); remoteWith('aluno/lib', [{ msg: 'Cria biblioteca', files: { 'index.js': 'export default 1' }, author: 'Aluno' }]); cloneInto('aluno/lib'); },
  metas: [
    ['Rodar um workflow em matriz com 3 jobs ou mais', () => W.gh['aluno/lib'].runs.some(r => r.jobs.length >= 3)],
    ['Rodar um workflow em runner self-hosted', () => W.gh['aluno/lib'].runs.some(r => r.selfHosted)]
  ],
  dicas: ['strategy: matrix: node: [20, 22, 24]', 'runs-on: self-hosted', 'Os workflows rodam a cada push. Veja a aba Actions.'],
  solucao: ['echo "on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node: [20, 22, 24]\n    steps:\n      - run: npm test" > .github/workflows/ci.yml', 'echo "on: push\njobs:\n  build:\n    runs-on: self-hosted\n    steps:\n      - run: npm test" > .github/workflows/lab.yml', 'git add .', 'git commit -m "ci: matriz e runner do laboratório"', 'git push'] },
{ id: '6.6', mod: 6, titulo: 'Por dentro do Git: objetos, worktree e submódulo', foco: 'term',
  intro: 'Veja como um commit é guardado por dentro, abra um segundo ramo em outra pasta sem stash (worktree) e inclua a biblioteca de estilos da turma como submódulo.',
  setup() { base(); remoteWith('prof/estilos', [{ msg: 'Cria estilos', files: { 'base.css': 'body { font-family: sans-serif }' } }]); remoteWith('aluno/painel', [{ msg: 'Cria painel', files: { 'index.html': '<main></main>' }, author: 'Aluno' }]); cloneInto('aluno/painel'); },
  metas: [
    ['Inspecionar um commit com git cat-file -p', () => fl('cat-file')],
    ['Criar uma worktree com um ramo novo', () => fl('worktree')],
    ['Adicionar prof/estilos como submódulo e fazer commit', () => W.local && '.gitmodules' in headTree(W.local)]
  ],
  dicas: ['git cat-file -p HEAD', 'git worktree add -b hotfix ../hotfix', 'git submodule add https://github.com/prof/estilos estilos e git commit'],
  solucao: ['git cat-file -p HEAD', 'git worktree add -b hotfix ../hotfix', 'git worktree list', 'git submodule add https://github.com/prof/estilos estilos', 'git commit -m "chore: adiciona estilos como submódulo"'] },
{ id: '6.7', mod: 6, titulo: 'Automação com a API do GitHub', foco: 'term',
  intro: 'Use a API do GitHub para gerar um relatório de contribuições do repositório da turma. Quantos commits a <b>Bia Santos</b> fez em <code>prof/turma</code>? Responda com <code>responder N</code>.',
  setup() { base(); const au = ['Ana', 'Bia Santos', 'Carla Lima', 'Bia Santos', 'Davi Rocha', 'Bia Santos', 'Ana', 'Bia Santos', 'Carla Lima']; remoteWith('prof/turma', au.map((a, i) => ({ msg: 'Atividade ' + (i + 1), files: { ['ativ' + (i + 1) + '.md']: '# ' + (i + 1) }, author: a }))); },
  metas: [
    ['Consultar a API com gh api', () => fl('gh-api')],
    ['Responder corretamente', () => W.answer === '4']
  ],
  dicas: ['gh api repos/prof/turma/contributors', 'Também dá para listar com gh api repos/prof/turma/commits e contar.'],
  solucao: ['gh api repos/prof/turma/contributors', 'responder 4'] }
];

const LAB = { id: 'lab', mod: 0, titulo: 'Laboratório livre', foco: 'term', intro: 'Ambiente livre para experimentar qualquer comando. Já existe o repositório <code>aluno/sandbox</code> clonado e um repositório <code>prof/projeto</code> para fork.', setup() { base(); remoteWith('aluno/sandbox', [{ msg: 'Initial commit', files: { 'README.md': '# Sandbox' }, author: 'Aluno' }]); remoteWith('prof/projeto', [{ msg: 'Cria projeto', files: { 'README.md': '# Projeto da turma' } }]); cloneInto('aluno/sandbox'); }, metas: [], dicas: ['Digite help para ver todos os comandos.'], solucao: [] };

/* ===== Módulo 7: cenários de custo ===== */
const PRECOS = { team: 4, pro: 4, ent: 21, cpPro: 10, cpBiz: 19, secret: 19, code: 30 };
const CENARIOS = [
  { id: 'c1', titulo: 'Projeto open source da turma', texto: '30 alunos mantêm uma biblioteca pública. Querem main protegida com revisão obrigatória, CI em cada PR, CodeQL e site no Pages.', opcoes: ['Free', 'Team para os 30 (US$ 120/mês)', 'Enterprise para os 30 (US$ 630/mês)'], certa: 0, porque: 'Tudo isso é gratuito em repositório público: proteção de branch, Actions com runners padrão, CodeQL e Pages.' },
  { id: 'c2', titulo: 'Startup com código fechado', texto: '5 desenvolvedores, repositórios privados. Precisam de main protegida com aprovação obrigatória e code owners.', opcoes: ['Free', 'Team: 5 × US$ 4 = US$ 20/mês', 'Pro só para o dono: US$ 4/mês'], certa: 1, porque: 'Proteção de branch e code owners em repositórios privados de uma organização exigem o Team, cobrado por usuário. O Pro é individual e não cobre a equipe.' },
  { id: 'c3', titulo: 'Empresa com 200 pessoas e Copilot', texto: '200 desenvolvedores em repositórios privados querem login corporativo (SAML) e Copilot para todos, com políticas centralizadas.', opcoes: ['Team + Copilot Pro individual', 'Enterprise + Copilot Business: 200 × (21 + 19) = US$ 8.000/mês', 'Free + Copilot Free'], certa: 1, porque: 'SAML exige o Enterprise, e a gestão centralizada do Copilot exige o Business ou o Enterprise. Copilot individual não permite políticas da empresa.' },
  { id: 'c4', titulo: 'Repositório privado da disciplina', texto: 'O professor quer um repositório privado com Pages para publicar gabaritos só para a turma, e alunos usando Copilot.', opcoes: ['Pagar Copilot Pro para todos', 'GitHub Education: Pro e Copilot gratuitos para verificados', 'Enterprise'], certa: 1, porque: 'Com o GitHub Education, alunos verificados têm o GitHub Pro e o Copilot Student, e professores o Copilot Pro, sem custo. Lembre-se de que os novos cadastros do Copilot ficaram suspensos a partir de abril de 2026.' }
];
