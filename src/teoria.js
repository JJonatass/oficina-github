/* ===== Parte teórica ===== */
const MODULOS = [
  { n: 1, titulo: 'Fundamentos', sub: 'Git, GitHub, conta e primeiro repositório', cor: '#1f883d' },
  { n: 2, titulo: 'Git no terminal', sub: 'As três áreas, commit, push e pull', cor: '#0969da' },
  { n: 3, titulo: 'Colaboração', sub: 'Ramos, pull requests, issues e fork', cor: '#8250df' },
  { n: 4, titulo: 'Fluxos avançados', sub: 'Conflitos, rebase, reset, stash e reflog', cor: '#bf3989' },
  { n: 5, titulo: 'Pro', sub: 'Actions, Pages, Dependabot e releases', cor: '#cf222e' },
  { n: 6, titulo: 'Avançado gratuito', sub: 'bisect, hooks, assinatura, CodeQL, matriz', cor: '#9a6700' },
  { n: 7, titulo: 'Ferramentas pagas', sub: 'Planos, Copilot e segurança avançada', cor: '#57606a' }
];

/* ---------- pequenos componentes ---------- */
const objetivos = itens => `<div class="objetivos"><b>Neste módulo você vai aprender</b><ul>${itens.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
const resumo = itens => `<div class="resumo"><b>Resumo do módulo</b><ul>${itens.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
const quiz = qs => `<h3>Teste rápido</h3><p class="small">Pense na resposta antes de tocar para conferir.</p><div class="quiz">${qs.map(([p, r]) => `<details><summary>${p}</summary><p>${r}</p></details>`).join('')}</div>`;
const saida = (titulo, linhas) => `<div class="saida"><div class="saida-t">${titulo}</div>${linhas.map(([l, n]) => `<div class="sl"><code>${l || '&nbsp;'}</code>${n ? `<span>${n}</span>` : ''}</div>`).join('')}</div>`;
const erros = lista => `<table class="erros"><tr><th>Mensagem ou situação</th><th>O que significa e o que fazer</th></tr>${lista.map(([m, f]) => `<tr><td><code>${m}</code></td><td>${f}</td></tr>`).join('')}</table>`;
const analogia = t => `<div class="analogia"><b>Analogia</b>${t}</div>`;

const DIAG_AREAS = `<figure class="diag"><svg viewBox="0 0 640 170" role="img" aria-label="As quatro áreas: pasta de trabalho, staging, repositório local e GitHub">
<g class="dbox"><rect x="4" y="30" width="140" height="70" rx="8"/><text x="74" y="60" text-anchor="middle" class="dt">Pasta de</text><text x="74" y="78" text-anchor="middle" class="dt">trabalho</text></g>
<g class="dbox"><rect x="168" y="30" width="140" height="70" rx="8"/><text x="238" y="60" text-anchor="middle" class="dt">Staging</text><text x="238" y="78" text-anchor="middle" class="ds">(preparado)</text></g>
<g class="dbox"><rect x="332" y="30" width="140" height="70" rx="8"/><text x="402" y="60" text-anchor="middle" class="dt">Repositório</text><text x="402" y="78" text-anchor="middle" class="ds">local (.git)</text></g>
<g class="dbox gh"><rect x="496" y="30" width="140" height="70" rx="8"/><text x="566" y="60" text-anchor="middle" class="dt">GitHub</text><text x="566" y="78" text-anchor="middle" class="ds">(remoto: origin)</text></g>
<g class="darr"><path d="M144 55 H166"/><path d="M308 55 H330"/><path d="M472 55 H494"/><path d="M494 80 H472"/></g>
<text x="155" y="22" text-anchor="middle" class="dc">git add</text><text x="320" y="22" text-anchor="middle" class="dc">git commit</text><text x="484" y="22" text-anchor="middle" class="dc">git push</text>
<text x="484" y="122" text-anchor="middle" class="dc">git pull / fetch</text>
<text x="74" y="150" text-anchor="middle" class="ds">onde você edita</text><text x="238" y="150" text-anchor="middle" class="ds">o que vai no próximo commit</text><text x="402" y="150" text-anchor="middle" class="ds">histórico no seu PC</text><text x="566" y="150" text-anchor="middle" class="ds">cópia na nuvem</text>
</svg><figcaption>O caminho de uma mudança: você edita, prepara, grava no histórico e envia para o GitHub.</figcaption></figure>`;

const DIAG_RAMOS = `<figure class="diag"><svg viewBox="0 0 640 150" role="img" aria-label="Ramo feature saindo da main e voltando com merge">
<g class="dline"><path d="M30 50 H600"/><path d="M190 50 C 230 50, 230 110, 270 110 H420 C 460 110, 470 50, 510 50"/></g>
<g class="dnode"><circle cx="60" cy="50" r="10"/><circle cx="130" cy="50" r="10"/><circle cx="190" cy="50" r="10"/><circle cx="350" cy="50" r="10"/><circle cx="510" cy="50" r="12" class="merge"/></g>
<g class="dnode alt"><circle cx="290" cy="110" r="10"/><circle cx="350" cy="110" r="10"/><circle cx="410" cy="110" r="10"/></g>
<text x="608" y="55" class="dt">main</text><text x="290" y="140" text-anchor="middle" class="dt">feature/placar</text>
<text x="510" y="28" text-anchor="middle" class="dc">merge</text><text x="190" y="28" text-anchor="middle" class="dc">ramo criado aqui</text><text x="350" y="28" text-anchor="middle" class="ds">colega mexeu na main</text>
</svg><figcaption>O ramo nasce de um commit da main, recebe seus próprios commits e volta com um merge.</figcaption></figure>`;

const DIAG_CICLO = `<figure class="diag"><svg viewBox="0 0 640 120" role="img" aria-label="Ciclo de vida de um arquivo">
<g class="dbox"><rect x="4" y="30" width="135" height="50" rx="8"/><text x="71" y="60" text-anchor="middle" class="dt">Não monitorado</text></g>
<g class="dbox"><rect x="168" y="30" width="135" height="50" rx="8"/><text x="235" y="60" text-anchor="middle" class="dt">Preparado</text></g>
<g class="dbox"><rect x="332" y="30" width="135" height="50" rx="8"/><text x="399" y="60" text-anchor="middle" class="dt">Commitado</text></g>
<g class="dbox"><rect x="496" y="30" width="135" height="50" rx="8"/><text x="563" y="60" text-anchor="middle" class="dt">Modificado</text></g>
<g class="darr"><path d="M139 55 H166"/><path d="M303 55 H330"/><path d="M467 55 H494"/><path d="M563 80 V100 H235 V82"/></g>
<text x="152" y="22" text-anchor="middle" class="dc">add</text><text x="316" y="22" text-anchor="middle" class="dc">commit</text><text x="480" y="22" text-anchor="middle" class="dc">você edita</text><text x="400" y="114" text-anchor="middle" class="dc">git add de novo</text>
</svg><figcaption>Todo arquivo passa por esses estados. O git status diz em qual estado cada um está.</figcaption></figure>`;

const DIAG_FORK = `<figure class="diag"><svg viewBox="0 0 640 250" role="img" aria-label="Fluxo do fork: original, seu fork e seu computador">
<g class="dbox"><rect x="20" y="20" width="220" height="64" rx="8"/><text x="130" y="46" text-anchor="middle" class="dt">prof/receitas</text><text x="130" y="66" text-anchor="middle" class="ds">original (do professor)</text></g>
<g class="dbox gh"><rect x="400" y="20" width="220" height="64" rx="8"/><text x="510" y="46" text-anchor="middle" class="dt">aluno/receitas</text><text x="510" y="66" text-anchor="middle" class="ds">seu fork (na sua conta)</text></g>
<g class="dbox"><rect x="400" y="170" width="220" height="64" rx="8"/><text x="510" y="196" text-anchor="middle" class="dt">Seu computador</text><text x="510" y="216" text-anchor="middle" class="ds">clone do seu fork</text></g>
<g class="darr"><path d="M240 40 H398"/><path d="M490 84 V168"/><path d="M530 168 V86"/><path d="M398 68 H242"/><path d="M130 84 V200 H398"/></g>
<text x="320" y="32" text-anchor="middle" class="dc">1. fork</text>
<text x="482" y="130" text-anchor="end" class="dc">2. clone</text><text x="538" y="130" class="dc">3. push</text>
<text x="320" y="62" text-anchor="middle" class="dc" dy="22">4. pull request</text>
<text x="200" y="192" text-anchor="middle" class="dc">fetch upstream (atualizar)</text>
</svg><figcaption>O fork fica na sua conta; você clona o fork, envia para ele (origin) e propõe ao original por pull request. O original é o upstream.</figcaption></figure>`;

const TEORIA = {
/* =============================== 1 =============================== */
1: `
${objetivos(['Qual problema o Git resolve e por que todo programador usa', 'A diferença entre Git (programa) e GitHub (site)', 'O vocabulário básico: repositório, commit, histórico, remoto', 'Criar a conta, conectar o terminal e proteger o acesso', 'Escrever um README em Markdown e compartilhar um projeto'])}
<h3>O problema: "trabalho_final_v3_AGORA_VAI.docx"</h3>
<p>Quem nunca salvou um arquivo como <i>trabalho_final</i>, depois <i>trabalho_final_v2</i>, depois <i>trabalho_final_v2_corrigido</i>? Esse método tem três problemas: você não sabe o que mudou entre uma versão e outra, não consegue voltar com segurança e, quando duas pessoas mexem ao mesmo tempo, alguém perde o trabalho do outro.</p>
<p>O <b>Git</b> resolve isso. Ele é um <b>sistema de controle de versão</b>: guarda cada versão do projeto com a data, o autor e uma explicação do que mudou. Você pode ver o histórico inteiro, comparar versões e voltar a qualquer ponto.</p>
${analogia('Pense nos <i>pontos de salvamento</i> de um videogame. Antes da parte difícil, você salva. Se der errado, volta para aquele ponto. Cada <b>commit</b> do Git é um ponto de salvamento do seu projeto, e você escolhe quando criar cada um.')}
<h3>Git e GitHub não são a mesma coisa</h3>
<table class="cmp"><tr><th></th><th>Git</th><th>GitHub</th></tr>
<tr><td>O que é</td><td>Um programa instalado no seu computador</td><td>Um site (serviço na nuvem) que guarda repositórios Git</td></tr>
<tr><td>Funciona sem internet?</td><td>Sim, tudo fica no seu computador</td><td>Não, é online</td></tr>
<tr><td>Para que serve</td><td>Guardar o histórico de versões</td><td>Hospedar o histórico, compartilhar e colaborar: pull requests, issues, revisão, automação, sites</td></tr>
<tr><td>Quem fez</td><td>Linus Torvalds, em 2005, para o Linux</td><td>Empresa criada em 2008, hoje parte da Microsoft</td></tr>
<tr><td>Alternativas</td><td>Mercurial, SVN (pouco usados hoje)</td><td>GitLab, Bitbucket, Gitea</td></tr></table>
<p>Na prática, você usa os dois juntos: o Git no computador para trabalhar e o GitHub para guardar uma cópia na nuvem e colaborar.</p>
<h3>Vocabulário básico</h3>
<div class="cards">
<div class="card"><b>Repositório (repo)</b>A pasta do projeto <i>mais</i> todo o histórico de versões. Pode estar no seu PC (local) ou no GitHub (remoto).</div>
<div class="card"><b>Commit</b>Um ponto de salvamento: a "fotografia" de todos os arquivos num momento, com autor, data e mensagem.</div>
<div class="card"><b>Histórico</b>A sequência de commits, do primeiro ao mais recente. Mostra a evolução do projeto.</div>
<div class="card"><b>Remoto</b>Uma cópia do repositório em outro lugar, normalmente o GitHub. O remoto padrão se chama <code>origin</code>.</div>
<div class="card"><b>Clone</b>Baixar um repositório do GitHub para o seu computador, com todo o histórico.</div>
<div class="card"><b>Push e pull</b><i>Push</i> envia seus commits para o GitHub. <i>Pull</i> traz os commits dos outros para o seu PC.</div>
<div class="card"><b>README.md</b>O arquivo de apresentação do repositório. O GitHub mostra o conteúdo dele na página principal do projeto.</div>
<div class="card"><b>Público e privado</b>Repositório público: qualquer pessoa vê. Privado: só você e quem você convidar.</div>
</div>
<h3>Passo 1: criar a conta</h3>
<ol>
<li>Acesse <b>github.com/signup</b>.</li>
<li><b>Nome de usuário:</b> ele aparece em todos os seus links (github.com/<i>usuario</i>) e vai para o seu currículo. Prefira algo profissional, como <code>maria-silva</code>. São aceitos letras, números e hífens, sem espaços.</li>
<li><b>E-mail:</b> se tiver um e-mail de estudante (escola ou faculdade), use-o. Ele dá direito aos benefícios do GitHub Education, como Copilot, GitHub Pro e o Student Developer Pack.</li>
<li><b>Senha:</b> pelo menos 15 caracteres, ou pelo menos 8 com um número e uma letra minúscula. Não reutilize a senha de outro site.</li>
<li><b>Verificação:</b> o GitHub envia um código para o e-mail. Sem verificar, você não consegue criar repositórios.</li>
<li><b>Perfil:</b> coloque nome, foto e uma bio curta. Recrutadores olham o perfil do GitHub como um portfólio.</li>
</ol>
<h3>Passo 2: preparar o computador</h3>
<p>O <b>terminal</b> é a janela onde você digita comandos em vez de clicar. No Windows, use o <i>Git Bash</i> (vem com o Git) ou o PowerShell. No Mac, o app <i>Terminal</i>. No Linux, o terminal do sistema. Nesta oficina o terminal é simulado, mas os comandos são os mesmos.</p>
<ul>
<li><b>Instalar o Git:</b> baixe em git-scm.com. Para conferir, digite <code>git --version</code>. No Windows, o instalador traz também o <b>Git Bash</b>, o terminal recomendado para este curso (veja o Módulo 2).</li>
<li><b>Instalar o GitHub CLI (gh):</b> baixe em cli.github.com. É o GitHub dentro do terminal.</li>
</ul>
<h3>Passo 3: conectar o terminal à sua conta</h3>
<p>São duas configurações <b>diferentes</b>, e as duas são necessárias:</p>
<pre># 1) Quem assina os commits (use o MESMO e-mail da conta)
git config --global user.name "Maria Silva"
git config --global user.email "maria@profjon.com.br"

# 2) Permissão para enviar código para a sua conta
gh auth login
gh auth status      # confere qual conta está conectada</pre>
<ul>
<li>O <b>user.name e o user.email</b> são gravados em cada commit. Se o e-mail for igual ao da conta, o GitHub mostra sua foto e seu perfil ao lado dos commits.</li>
<li>O <b>gh auth login</b> prova ao GitHub que é você. Sem ele (ou uma chave SSH), o <code>git push</code> é recusado: o GitHub não aceita mais senha no terminal desde 2021.</li>
<li>O <code>aluno@profjon:~$</code> no começo da linha é o usuário do <b>computador</b>, não a sua conta do GitHub. Ele não muda com o login.</li>
</ul>
<h3>Passo 4: proteger a conta com 2FA</h3>
<p>A <b>autenticação em dois fatores</b> pede, além da senha, um código de 6 dígitos que muda a cada 30 segundos num app autenticador do celular (Google Authenticator, Microsoft Authenticator, 1Password e outros). Mesmo que alguém descubra sua senha, não entra sem o celular.</p>
<ul>
<li>O GitHub exige 2FA de quem contribui com código.</li>
<li>Ao ativar, guarde os <b>códigos de recuperação</b> num lugar seguro. Se perder o celular, são eles que devolvem o acesso.</li>
</ul>
<h3>Conhecendo a página de um repositório</h3>
<table class="cmd">
<tr><td>Code</td><td>Os arquivos, o README, o botão verde <i>Code</i> (para copiar a URL de clone) e o número de commits</td></tr>
<tr><td>Issues</td><td>Lista de tarefas, bugs e ideias do projeto</td></tr>
<tr><td>Pull requests</td><td>Propostas de mudança esperando revisão</td></tr>
<tr><td>Actions</td><td>Automações: testes e publicação automáticos</td></tr>
<tr><td>Settings</td><td>Visibilidade, colaboradores, proteção de ramos, Pages (só para o dono)</td></tr>
</table>
<h3>Markdown: o formato do README</h3>
<p>Markdown é texto simples com alguns símbolos que viram formatação. À esquerda o que você escreve, à direita o resultado:</p>
<table class="cmp"><tr><th>Você escreve</th><th>Aparece como</th></tr>
<tr><td><code># Meu projeto</code></td><td><b style="font-size:18px">Meu projeto</b> (título)</td></tr>
<tr><td><code>## Como usar</code></td><td><b>Como usar</b> (subtítulo)</td></tr>
<tr><td><code>**importante**</code></td><td><b>importante</b></td></tr>
<tr><td><code>*itálico*</code></td><td><i>itálico</i></td></tr>
<tr><td><code>- item</code></td><td>• item (lista)</td></tr>
<tr><td><code>[site](https://github.com)</code></td><td><a href="https://github.com">site</a> (link)</td></tr>
<tr><td><code>\`git status\`</code></td><td><code>git status</code> (código)</td></tr></table>
<p>Um bom README responde: o que é o projeto, como instalar ou usar, quem fez e qual é a licença.</p>
<h3>Perfil vivo</h3>
<p>Se você criar um repositório com <b>exatamente o mesmo nome do seu usuário</b> (por exemplo <code>maria-silva/maria-silva</code>), o README dele aparece no topo do seu perfil. É a sua página de apresentação.</p>
<h3>Compartilhar: visibilidade, colaboradores e licença</h3>
<ul>
<li><b>Visibilidade:</b> comece privado enquanto é rascunho e torne público quando estiver pronto. Dá para trocar a qualquer momento em Settings.</li>
<li><b>Colaboradores:</b> pessoas convidadas que podem <i>escrever</i> no repositório (fazer push). Para quem não é colaborador, existe o <i>fork</i> (Módulo 3).</li>
<li><b>Licença:</b> sem licença, a lei diz que ninguém pode reutilizar seu trabalho, mesmo sendo público.</li>
</ul>
<table class="cmp"><tr><th>Licença</th><th>Na prática</th><th>Quando usar</th></tr>
<tr><td>MIT</td><td>Qualquer um usa, modifica e vende, desde que mantenha o crédito</td><td>Código que você quer que todos usem</td></tr>
<tr><td>GPL-3.0</td><td>Pode usar e modificar, mas quem distribuir uma versão modificada precisa manter o código aberto</td><td>Quando você quer garantir que derivados continuem livres</td></tr>
<tr><td>CC-BY-4.0</td><td>Pode copiar e adaptar, citando o autor</td><td>Textos, apostilas, imagens e material didático</td></tr></table>
${erros([['Username is not available', 'Alguém já usa esse nome. Tente variações com sobrenome ou hífen.'], ['Password is too weak / found in a data breach', 'A senha é curta ou já vazou em outro site. Crie uma nova, longa e exclusiva.'], ['Não chegou o e-mail de verificação', 'Confira o spam e se o e-mail foi digitado certo. Dá para reenviar em Settings → Emails.'], ['Support for password authentication was removed', 'Você tentou usar a senha da conta no terminal. Faça gh auth login ou use chave SSH.']])}
${resumo(['Git guarda versões no seu computador; GitHub guarda uma cópia na nuvem e permite colaborar.', 'Commit é um ponto de salvamento; repositório é o projeto com todo o histórico.', 'Depois de criar a conta: git config (nome e e-mail), gh auth login e 2FA.', 'README.md em Markdown apresenta o projeto; a licença diz o que os outros podem fazer com ele.'])}
${quiz([['Se o GitHub sair do ar, você perde o histórico do projeto que está no seu computador?', 'Não. O Git guarda o histórico completo na pasta .git do seu computador. O GitHub é uma cópia remota.'], ['Qual é a diferença entre git config user.email e gh auth login?', 'O user.email só diz quem é o autor dos commits (pode ser qualquer texto). O gh auth login prova ao GitHub que você tem permissão para enviar código para a conta.'], ['Um repositório é público, mas não tem licença. Posso copiar o código para o meu projeto?', 'Legalmente, não. Sem licença, todos os direitos ficam com o autor. Ver não é o mesmo que poder reutilizar.']])}
<div class="free">Gratuito: conta, repositórios públicos e privados ilimitados, colaboradores ilimitados, 2FA, Git e GitHub CLI.</div>`,

/* =============================== 2 =============================== */
2: `
${objetivos(['Os comandos básicos do terminal para andar entre pastas e ver arquivos', 'As três áreas do Git e o caminho de uma mudança até o GitHub', 'Ler a saída do git status sem medo', 'Fazer commits com boas mensagens e consultar o histórico', 'Usar o .gitignore, desfazer erros e não vazar senhas'])}
<h3>Sobrevivendo no terminal</h3>
<p>Antes do Git, alguns comandos do próprio terminal. Você vai usá-los o tempo todo:</p>
<table class="cmd">
<tr><td>pwd</td><td>Mostra em qual pasta você está ("print working directory")</td></tr>
<tr><td>ls</td><td>Lista os arquivos da pasta. <code>ls -a</code> mostra também os ocultos, que começam com ponto</td></tr>
<tr><td>cd pasta</td><td>Entra numa pasta. <code>cd ..</code> volta uma pasta</td></tr>
<tr><td>mkdir nome</td><td>Cria uma pasta</td></tr>
<tr><td>cat arquivo</td><td>Mostra o conteúdo de um arquivo</td></tr>
<tr><td>echo "texto" &gt; arquivo</td><td>Escreve o texto no arquivo, apagando o que havia</td></tr>
<tr><td>echo "texto" &gt;&gt; arquivo</td><td>Acrescenta o texto no final do arquivo</td></tr>
</table>
<p>Dicas: a seta ↑ repete comandos anteriores, e a tecla Tab completa nomes de arquivos (no terminal real).</p>
<h3>E no Windows?</h3>
<p>Os comandos <code>git</code> e <code>gh</code> são iguais em todos os sistemas. Já os comandos do próprio terminal mudam conforme o terminal que você abre no Windows:</p>
<table class="cmp"><tr><th>Comando</th><th>Linux e Mac</th><th>Git Bash</th><th>PowerShell</th><th>Prompt (cmd)</th></tr>
<tr><td><code>ls</code></td><td>✓</td><td>✓</td><td>✓ (apelido)</td><td>✗ use <code>dir</code></td></tr>
<tr><td><code>ls -a</code></td><td>✓</td><td>✓</td><td>✗ use <code>ls -Force</code></td><td>✗ use <code>dir /a</code></td></tr>
<tr><td><code>pwd</code></td><td>✓</td><td>✓</td><td>✓</td><td>✗ use <code>cd</code> sozinho</td></tr>
<tr><td><code>cd pasta</code>, <code>cd ..</code></td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td><code>mkdir</code></td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td><code>cat arquivo</code></td><td>✓</td><td>✓</td><td>✓ (apelido)</td><td>✗ use <code>type</code></td></tr>
<tr><td><code>touch arquivo</code></td><td>✓</td><td>✓</td><td>✗ use <code>New-Item arquivo</code></td><td>✗</td></tr>
<tr><td><code>echo "x" &gt; arquivo</code></td><td>✓</td><td>✓</td><td>⚠ ver abaixo</td><td>⚠ grava as aspas no arquivo</td></tr></table>
<div class="alerta"><b>Cuidado com o echo no Windows:</b> no PowerShell que vem com o Windows (versão 5.1), o <code>&gt;</code> grava o arquivo em UTF-16. Um <code>.gitignore</code> ou um workflow <code>.yml</code> gravado assim pode simplesmente não funcionar. No cmd, as aspas vão parar dentro do arquivo.</div>
<p><b>Recomendação do curso: no Windows, use o Git Bash.</b> Ele é instalado junto com o Git (git-scm.com): depois de instalar, clique com o botão direito numa pasta e escolha <i>Open Git Bash here</i>, ou procure "Git Bash" no menu Iniciar. Com ele, todos os comandos desta oficina funcionam exatamente como no Linux e no Mac. No VS Code dá para escolher o Git Bash como terminal padrão (seta ao lado do + do terminal → Git Bash).</p>
<h3>As três áreas (mais o GitHub)</h3>
${DIAG_AREAS}
${analogia('Imagine que você vai enviar fotos pelo correio. A <b>pasta de trabalho</b> é a sua mesa, cheia de fotos. O <b>staging</b> é a caixa: você escolhe quais fotos colocar nela. O <b>commit</b> é fechar a caixa e colar uma etiqueta dizendo o que tem dentro; ela vai para o seu armário (o repositório local). O <b>push</b> é levar as caixas ao correio, que é o GitHub.')}
<p>Por que existe o staging? Porque nem tudo que você mudou deve entrar no mesmo commit. Se você corrigiu um bug e também mudou o visual, pode fazer dois commits separados, cada um com sua explicação.</p>
<h3>O ciclo de vida de um arquivo</h3>
${DIAG_CICLO}
<h3>Começando: clone ou init?</h3>
<table class="cmp"><tr><th>Situação</th><th>Comando</th></tr>
<tr><td>O projeto já existe no GitHub</td><td><code>git clone URL</code>: baixa tudo e já configura o remoto <code>origin</code></td></tr>
<tr><td>O projeto está só no seu computador</td><td><code>git init</code> na pasta, depois cria o repositório no GitHub (<code>gh repo create</code>) e liga os dois (<code>git remote add origin URL</code>)</td></tr></table>
<h3>Lendo o git status</h3>
<p>É o comando mais importante para iniciantes: ele não muda nada e diz exatamente o que está acontecendo. Use antes e depois de cada passo.</p>
${saida('$ git status', [['No ramo main', 'Você está no ramo main'], ["Seu ramo está à frente de 'origin/main' por 1 commit.", 'Há 1 commit seu que ainda não foi enviado: falta git push'], ['', ''], ['Mudanças a serem submetidas:', 'Área de STAGING: vai entrar no próximo commit'], ['        modificado: index.html', ''], ['', ''], ['Mudanças não preparadas para submissão:', 'Mudou, mas ainda NÃO está no staging: falta git add'], ['        modificado: estilo.css', ''], ['', ''], ['Arquivos não monitorados:', 'Arquivos novos que o Git nunca guardou'], ['        logo.png', '']])}
<h3>O commit e a mensagem</h3>
<p>Cada commit recebe um <b>ID</b> (hash) de 40 caracteres, como <code>a1b2c3d4e5…</code>. Normalmente usamos só os 7 primeiros (<code>a1b2c3d</code>). O commit guarda os arquivos, o autor, a data, a mensagem e quem é o commit anterior (o "pai"). É assim que o Git monta a linha do tempo.</p>
<p>A mensagem é para o seu "eu do futuro" e para a equipe. Regras simples:</p>
<table class="cmp"><tr><th>Ruim</th><th>Bom</th><th>Por quê</th></tr>
<tr><td>"ajustes"</td><td>"Corrige cálculo do frete para o Nordeste"</td><td>Diz o que mudou e onde</td></tr>
<tr><td>"asdf"</td><td>"Adiciona tela de login"</td><td>Verbo no presente, como uma ordem</td></tr>
<tr><td>"mudei um monte de coisa"</td><td>Dois commits: "Corrige bug do login" e "Muda cor do botão"</td><td>Um assunto por commit</td></tr></table>
<h3>Consultando o histórico</h3>
<table class="cmd">
<tr><td>git log --oneline</td><td>Um commit por linha: ID curto e mensagem</td></tr>
<tr><td>git log --oneline --all</td><td>Inclui todos os ramos, inclusive os do GitHub (origin/...)</td></tr>
<tr><td>git show ID</td><td>O que um commit mudou, linha por linha</td></tr>
<tr><td>git diff</td><td>O que você mudou e ainda não preparou</td></tr>
<tr><td>git diff --staged</td><td>O que está preparado para o próximo commit</td></tr>
<tr><td>git blame arquivo</td><td>Quem escreveu cada linha e em qual commit</td></tr>
</table>
${saida('$ git log --oneline', [['3f2a1c9 (HEAD -> main, origin/main) Registra aula 3', 'Mais recente. HEAD = onde você está. origin/main = como está no GitHub'], ['b71e044 Registra aula 2', ''], ['09cd5e2 Initial commit', 'O primeiro commit do projeto']])}
${saida('$ git diff', [['diff --git a/diario.md b/diario.md', 'Arquivo comparado'], ['-- Aula 2: aprendi Markdown', 'Linha com - foi removida (versão antiga)'], ['+- Aula 2: aprendi Markdown e commits', 'Linha com + foi adicionada (versão nova)']])}
<h3>Enviando e recebendo</h3>
<table class="cmd">
<tr><td>git push</td><td>Envia seus commits para o GitHub</td></tr>
<tr><td>git push -u origin main</td><td>Primeiro envio de um ramo: o <code>-u</code> liga o ramo local ao do GitHub, e depois basta <code>git push</code></td></tr>
<tr><td>git pull</td><td>Traz os commits do GitHub e junta com os seus</td></tr>
<tr><td>git fetch</td><td>Só baixa as novidades, sem mexer nos seus arquivos</td></tr>
<tr><td>git remote -v</td><td>Mostra para onde o push e o pull apontam</td></tr>
</table>
<p>Regra de convivência: <b>sempre faça git pull antes de começar a trabalhar</b>. Assim você parte da versão mais nova e evita conflitos.</p>
<h3>.gitignore: o que NÃO deve ir para o repositório</h3>
<p>É um arquivo de texto na raiz do projeto, com um padrão por linha. Tudo que combina com esses padrões é ignorado pelo <code>git add</code>.</p>
<pre># logs e temporários
*.log
# dependências (são baixadas de novo com npm install / flutter pub get)
node_modules/
build/
# segredos: NUNCA vão para o GitHub
.env</pre>
<p>O site gitignore.io gera arquivos prontos para cada linguagem (Node, Flutter, Python...).</p>
<h3>Desfazer: qual comando usar?</h3>
<table class="cmp"><tr><th>Situação</th><th>Comando</th><th>Perde algo?</th></tr>
<tr><td>Editei um arquivo e quero voltar à última versão salva</td><td><code>git restore arquivo</code></td><td>Sim, a edição</td></tr>
<tr><td>Dei git add num arquivo por engano</td><td><code>git restore --staged arquivo</code></td><td>Não</td></tr>
<tr><td>Errei a mensagem do último commit (ainda não enviei)</td><td><code>git commit --amend -m "nova"</code></td><td>Não</td></tr>
<tr><td>Esqueci um arquivo no último commit (ainda não enviei)</td><td><code>git add arquivo</code> e <code>git commit --amend --no-edit</code></td><td>Não</td></tr>
<tr><td>Um commit antigo, já enviado, estava errado</td><td><code>git revert ID</code></td><td>Não: cria um commit que desfaz o outro</td></tr></table>
<div class="alerta"><b>Senha no código:</b> se você fez commit de uma senha ou token, apagar o arquivo num commit novo <b>não resolve</b>, porque ela continua no histórico e qualquer um pode ver. Se ainda não enviou, corrija com <code>--amend</code>. Se já enviou, <b>troque a senha imediatamente</b>. Use arquivos <code>.env</code> (ignorados) para guardar segredos.</div>
${erros([['fatal: not a git repository', 'Você não está dentro de um repositório. Use cd para entrar na pasta do projeto, ou git init para criar um.'], ['nothing to commit, working tree clean', 'Não há mudanças. Você não editou nada ou já fez o commit.'], ['nothing added to commit but untracked files present', 'Há mudanças, mas você não deu git add.'], ['Author identity unknown / Please tell me who you are', 'Falta configurar git config --global user.name e user.email.'], ['! [rejected] main -> main (fetch first)', 'O GitHub tem commits que você não tem. Faça git pull e depois git push.'], ['The current branch has no upstream branch', 'Primeiro push do ramo: use git push -u origin nome-do-ramo.']])}
${resumo(['O caminho é sempre: editar → git add → git commit → git push.', 'git status mostra em que área cada arquivo está. Use sempre.', 'Mensagens de commit curtas, com verbo, um assunto por commit.', 'git pull antes de começar; .gitignore para logs, dependências e segredos.', 'Para desfazer: restore (arquivo), --amend (último commit não enviado), revert (commit já enviado).'])}
${quiz([['Fiz git commit, mas o arquivo não apareceu no GitHub. Por quê?', 'O commit fica só no seu computador. Falta o git push.'], ['Mudei três arquivos e quero que só dois entrem no próximo commit. Como?', 'Dê git add apenas nos dois arquivos e faça o commit. O terceiro fica fora do staging.'], ['O que acontece com um arquivo listado no .gitignore quando eu faço git add .?', 'Ele é ignorado, a não ser que já estivesse sendo monitorado antes de entrar no .gitignore.']])}
<div class="free">Gratuito: Git e GitHub CLI são gratuitos.</div>`,

/* =============================== 3 =============================== */
3: `
${objetivos(['O que é um ramo e por que trabalhar em ramos', 'Como o merge junta o trabalho (fast-forward e commit de merge)', 'O ciclo do pull request, da criação ao merge', 'Usar issues para organizar tarefas e fechá-las automaticamente', 'Proteger a main e contribuir com projetos de outras pessoas via fork'])}
<h3>Ramos: linhas paralelas de trabalho</h3>
<p>Um <b>ramo</b> (branch) é uma linha do tempo paralela. Você cria um ramo para cada tarefa, trabalha nele à vontade e, quando estiver pronto, junta de volta na <code>main</code>. Enquanto isso, a <code>main</code> continua estável e funcionando.</p>
${analogia('É como escrever um capítulo num rascunho separado em vez de mexer direto no livro que está na gráfica. Quando o rascunho fica bom, você o junta ao livro.')}
${DIAG_RAMOS}
<p>Por dentro, um ramo é só uma <b>etiqueta que aponta para um commit</b>. Criar ramos é instantâneo e não copia arquivos. O <b>HEAD</b> é outra etiqueta: indica em qual ramo você está agora. Quando você faz um commit, a etiqueta do ramo atual avança para ele.</p>
<table class="cmd">
<tr><td>git branch</td><td>Lista os ramos; o atual tem *</td></tr>
<tr><td>git switch -c nome</td><td>Cria um ramo a partir de onde você está e muda para ele</td></tr>
<tr><td>git switch nome</td><td>Muda para outro ramo (os arquivos da pasta mudam junto!)</td></tr>
<tr><td>git merge nome</td><td>Traz os commits de "nome" para o ramo atual</td></tr>
<tr><td>git branch -d nome</td><td>Apaga um ramo que já foi mesclado</td></tr>
</table>
<p>Convenção de nomes: <code>feature/login</code> (funcionalidade nova), <code>fix/frete</code> (correção), <code>docs/readme</code> (documentação). Sem espaços nem acentos.</p>
<h3>Os dois tipos de merge</h3>
<div class="cards">
<div class="card"><b>Fast-forward</b>A main não mudou desde que o ramo foi criado. O Git só "avança a etiqueta" da main até o último commit do ramo. Nenhum commit novo é criado.</div>
<div class="card"><b>Commit de merge</b>Os dois lados andaram. O Git cria um commit especial com <i>dois pais</i>, que junta as duas linhas. Se as duas mudaram a mesma linha, há conflito (Módulo 4).</div>
</div>
<h3>Pull request (PR): pedir para juntar</h3>
<p>Em equipe, ninguém faz merge direto na main. Você envia o seu ramo para o GitHub e abre um <b>pull request</b>, um pedido de "por favor, puxem minhas mudanças para a main". O PR é onde a equipe <b>vê o que mudou, comenta, testa e aprova</b>.</p>
<div class="fluxo"><span>1. git switch -c ramo</span>→<span>2. commits</span>→<span>3. git push -u origin ramo</span>→<span>4. gh pr create</span>→<span>5. revisão</span>→<span>6. merge</span>→<span>7. git switch main e git pull</span></div>
<p>A página de um PR tem:</p>
<table class="cmd">
<tr><td>Conversation</td><td>Descrição, comentários e o resultado das verificações</td></tr>
<tr><td>Commits</td><td>A lista de commits do ramo</td></tr>
<tr><td>Files changed</td><td>O diff: linhas removidas em vermelho e adicionadas em verde. O revisor comenta linha por linha</td></tr>
<tr><td>Checks</td><td>Testes automáticos (Módulo 5)</td></tr>
</table>
<p>Uma boa descrição de PR responde: <b>o que</b> mudou, <b>por que</b>, <b>como testar</b> e qual issue resolve.</p>
<pre>## O que muda
Adiciona o placar no canto superior da tela.

## Como testar
Rode o jogo e faça 3 pontos: o placar deve mostrar 3.

Closes #12</pre>
<p>O revisor pode <b>comentar</b>, <b>aprovar</b> (Approve) ou <b>pedir mudanças</b> (Request changes). Se pedirem mudanças, você faz novos commits no mesmo ramo e dá push: o PR se atualiza sozinho.</p>
<h3>Três formas de mesclar um PR</h3>
<table class="cmp"><tr><th>Botão</th><th>O que faz</th><th>Quando usar</th></tr>
<tr><td>Create a merge commit</td><td>Mantém todos os commits do ramo e cria um commit de merge</td><td>Quando o histórico do ramo é importante</td></tr>
<tr><td>Squash and merge</td><td>Junta todos os commits do ramo em um só</td><td>Ramos com muitos commits pequenos ("wip", "ajuste")</td></tr>
<tr><td>Rebase and merge</td><td>Coloca os commits em linha reta, sem commit de merge</td><td>Quando a equipe prefere histórico linear</td></tr></table>
<h3>Issues: a lista de tarefas do projeto</h3>
<p>Uma <b>issue</b> registra um bug, uma tarefa ou uma ideia. Ela tem título, descrição, comentários, <b>labels</b> (etiquetas como <code>bug</code>, <code>good first issue</code>), <b>assignees</b> (responsáveis) e um número (#12).</p>
<ul>
<li>Escrever <code>Closes #12</code>, <code>Fixes #12</code> ou <code>Resolves #12</code> na descrição do PR fecha a issue automaticamente quando o PR é mesclado.</li>
<li>O <b>GitHub Projects</b> organiza issues e PRs num quadro Kanban (A fazer, Fazendo, Feito).</li>
<li>Bom título de issue: "Botão de login não responde no celular". Ruim: "não funciona".</li>
</ul>
<h3>Proteger a main</h3>
<p>Em Settings → Branches você cria uma regra para a <code>main</code>: <i>exigir pull request</i> e <i>exigir 1 aprovação</i>. A partir daí ninguém envia direto para a main, nem o dono. Tudo passa por PR e revisão. É o padrão em empresas.</p>
<h3>Fork: contribuir com o projeto de outra pessoa</h3>
<p>Num repositório do GitHub, só o <b>dono</b> e os <b>colaboradores</b> convidados podem fazer <code>git push</code>. Se você não é um deles e tenta enviar, recebe "Permissão negada". Então como contribuir com o projeto de outra pessoa, ou com um projeto open source?</p>
<p>A resposta é o <b>fork</b>: uma <b>cópia do repositório de outra pessoa feita para dentro da SUA conta</b> no GitHub. Nessa cópia você tem permissão total. Ela continua "lembrando" de onde veio, e é por isso que dá para propor as suas mudanças de volta ao original com um pull request.</p>
${analogia('É como receber a apostila do professor. Você não pode escrever no original, então tira uma cópia (o fork), faz as suas correções nela e entrega as páginas sugeridas (o pull request). O professor decide se incorpora ao original.')}
${DIAG_FORK}
<h3>Fork, clone e ramo: três coisas diferentes</h3>
<table class="cmp"><tr><th></th><th>Onde fica</th><th>Para quê</th><th>Comando</th></tr>
<tr><td><b>Fork</b></td><td>Na sua conta do GitHub</td><td>Ter uma cópia sua de um projeto que não é seu</td><td><code>gh repo fork</code> ou botão <i>Fork</i></td></tr>
<tr><td><b>Clone</b></td><td>No seu computador</td><td>Trabalhar nos arquivos localmente</td><td><code>git clone</code></td></tr>
<tr><td><b>Ramo</b></td><td>Dentro de um mesmo repositório</td><td>Separar uma tarefa da main</td><td><code>git switch -c</code></td></tr></table>
<p>Na prática, você usa os três juntos: faz o fork, clona o <i>seu fork</i> e cria um ramo para a tarefa.</p>
<h3>Quando usar colaborador e quando usar fork</h3>
<table class="cmp"><tr><th></th><th>Colaborador</th><th>Fork</th></tr>
<tr><td>Permissão</td><td>Foi convidado e pode fazer push no repositório</td><td>Não tem permissão no original; trabalha na própria cópia</td></tr>
<tr><td>Situação típica</td><td>Equipe pequena, projeto da empresa, grupo da turma</td><td>Open source, turma inteira contribuindo com o repositório do professor</td></tr>
<tr><td>Como contribui</td><td>Ramo no próprio repositório + PR</td><td>Ramo no fork + PR do fork para o original</td></tr>
<tr><td>Risco para o original</td><td>Pode estragar a main se ela não estiver protegida</td><td>Nenhum: o original só muda quando o dono aceita o PR</td></tr></table>
<h3>Passo a passo</h3>
<ol>
<li><b>Fazer o fork.</b> No site: abra o repositório original e clique em <i>Fork</i> (canto superior direito). No terminal: <code>gh repo fork prof/receitas --clone</code>, que já faz o fork, baixa para o PC e configura os remotos.</li>
<li><b>Criar um ramo:</b> <code>git switch -c bolo-de-rolo</code>.</li>
<li><b>Fazer as mudanças</b> e os commits: <code>git add .</code> e <code>git commit -m "Adiciona receita de bolo de rolo"</code>.</li>
<li><b>Enviar para o SEU fork:</b> <code>git push -u origin bolo-de-rolo</code>.</li>
<li><b>Abrir o pull request para o original:</b> <code>gh pr create --title "Receita: bolo de rolo"</code>. No site, o GitHub mostra o botão <i>Compare &amp; pull request</i> no seu fork.</li>
<li><b>Aguardar a revisão.</b> Se pedirem mudanças, faça novos commits no mesmo ramo e dê push: o PR se atualiza.</li>
</ol>
<h3>origin e upstream</h3>
<p>Depois do <code>gh repo fork --clone</code>, o seu repositório local tem dois remotos. Confira com <code>git remote -v</code>:</p>
${saida('$ git remote -v', [['origin    https://github.com/aluno/receitas.git', 'O SEU fork: para onde você faz push'], ['upstream  https://github.com/prof/receitas.git', 'O original: de onde você busca novidades']])}
<p>Se você fez o fork pelo site e clonou com <code>git clone</code>, o upstream não existe ainda. Cadastre uma vez: <code>git remote add upstream https://github.com/prof/receitas.git</code>.</p>
<h3>O fork não se atualiza sozinho</h3>
<p>Quando o dono acrescenta coisas no original, o seu fork fica para trás. Antes de começar uma contribuição nova, atualize:</p>
<pre>git switch main
git fetch upstream          # baixa as novidades do original
git merge upstream/main     # junta na sua main local
git push                    # atualiza o seu fork no GitHub</pre>
<p>No site existe o botão <i>Sync fork</i>, e no terminal o <code>gh repo sync</code>, que fazem o mesmo quando você não tem mudanças próprias na main.</p>
<h3>Exemplo na turma</h3>
<p>O professor cria <code>prof/receitas</code> e protege a main. Cada um dos 30 alunos faz o fork, cria um ramo com a sua receita e abre um PR. O professor revisa, comenta e aceita. Ninguém precisa ser colaborador, e ninguém consegue estragar o repositório principal. É exatamente assim que funcionam os grandes projetos open source, como o Flutter e o VS Code.</p>
<h3>Outros usos do fork</h3>
<ul><li><b>Ponto de partida:</b> fazer o fork de um projeto (ou de um template de portfólio) e seguir em outra direção, sem nunca mandar PR.</li>
<li><b>Experimentar sem medo:</b> testar mudanças grandes num projeto alheio sem afetar ninguém.</li></ul>
<div class="alerta"><b>Confusões comuns:</b> mudanças no seu fork <b>não</b> aparecem no original até o PR ser aceito. Apagar o seu fork <b>não</b> afeta o original. E o fork <b>não</b> recebe as novidades do original sozinho: é preciso sincronizar.</div>
${erros([['error: Your local changes would be overwritten by checkout', 'Você tem mudanças sem commit e tentou trocar de ramo. Faça commit (ou stash) antes.'], ["error: the branch 'x' is not fully merged", 'O ramo tem commits que não estão na main. Mescle antes ou use -D se quiser mesmo apagar.'], ['GH006: Protected branch update failed', 'A main está protegida. Crie um ramo, envie e abra um PR.'], ['Permission denied (403) ao fazer push', 'Você não é colaborador do repositório. Faça um fork.']])}
${resumo(['Ramo é uma etiqueta que aponta para um commit; HEAD indica onde você está.', 'Trabalhe sempre num ramo; a main fica estável.', 'PR = pedido de merge com revisão; "Closes #n" fecha a issue no merge.', 'Proteção da main obriga tudo a passar por PR.', 'Sem permissão de escrita? Fork, ramo, push no fork e PR para o original.'])}
${quiz([['Criei o ramo feature/x, fiz 2 commits e voltei para a main. Os arquivos novos sumiram da pasta. Perdi o trabalho?', 'Não. Eles estão no ramo feature/x. Ao trocar de ramo, a pasta mostra os arquivos daquele ramo. Volte com git switch feature/x.'], ['Recebi um pedido de mudanças no meu PR. Preciso abrir outro PR?', 'Não. Faça os commits no mesmo ramo e dê git push: o PR se atualiza.'], ['Qual a diferença entre colaborador e fork?', 'O colaborador tem permissão de escrita no repositório. Quem não tem faz um fork (cópia na própria conta) e propõe mudanças por PR.']])}
<div class="free">Gratuito: ramos, PRs, issues, Projects e fork. A proteção de ramo é grátis em repositório <b>público</b>. Em privado, exige plano pago (veja o Módulo 7).</div>`,

/* =============================== 4 =============================== */
4: `
${objetivos(['Por que conflitos acontecem e como resolvê-los com calma', 'A diferença entre merge e rebase, e quando usar cada um', 'Os três tipos de reset e a diferença para o revert', 'Guardar trabalho com stash, copiar commits com cherry-pick e recuperar com reflog', 'Fazer uma boa revisão de código e escolher um fluxo de trabalho'])}
<h3>Conflito de merge: não é erro, é uma pergunta</h3>
<p>O Git junta sozinho mudanças em arquivos diferentes, ou em linhas afastadas do mesmo arquivo. Quando duas pessoas mudam <b>a mesma linha</b> (ou linhas vizinhas), ele não tem como saber qual versão é a certa. Então para e pergunta a você. Isso é um conflito.</p>
${saida('titulo.txt durante o conflito', [['&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD', 'Início: a SUA versão'], ['Feira de Tecnologia 2026', ''], ['=======', 'Divisória'], ['Feira de Ciências 2026', 'A versão que veio de fora (colega)'], ['&gt;&gt;&gt;&gt;&gt;&gt;&gt; origin/main', 'Fim do bloco em conflito']])}
<p><b>Passo a passo para resolver:</b></p>
<ol>
<li><code>git status</code> mostra os arquivos em conflito ("modificado por ambos").</li>
<li>Abra cada arquivo e decida o texto final: a sua versão, a do colega ou uma combinação das duas.</li>
<li><b>Apague as três linhas de marcadores</b> (<code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>, <code>=======</code>, <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code>).</li>
<li><code>git add arquivo</code> para dizer "resolvido".</li>
<li><code>git commit</code> para concluir o merge, e depois <code>git push</code>.</li>
</ol>
<p>Desistiu no meio? <code>git merge --abort</code> volta tudo para antes. Para ter menos conflitos: faça <code>git pull</code> com frequência, commits pequenos e combine com a equipe quem mexe em qual arquivo.</p>
<h3>Vários pull requests ao mesmo tempo</h3>
<p>Numa equipe, é normal ter vários PRs abertos juntos. O Git não compara o arquivo inteiro: ele compara <b>trecho por trecho</b>, linha a linha. Por isso, na maior parte das vezes, o trabalho de todos é juntado sozinho.</p>
<table class="cmp"><tr><th>Situação</th><th>O que acontece</th></tr>
<tr><td>Cada um mexeu num arquivo diferente</td><td>Tudo entra sozinho, sem conflito</td></tr>
<tr><td>Mesmo arquivo, linhas distantes (ex.: topo e fim)</td><td>Tudo entra sozinho: o Git junta as duas mudanças no mesmo arquivo</td></tr>
<tr><td>Mesmo arquivo, <b>linhas vizinhas</b></td><td>Costuma dar conflito: o Git não tem certeza de que as mudanças combinam</td></tr>
<tr><td>Mesma linha</td><td>Conflito: alguém precisa decidir</td></tr></table>
<p><b>Como acontece na prática</b>, com três PRs abertos (Ana, Bia e Caio):</p>
<ol>
<li>O primeiro PR mesclado entra normalmente. Quem chega primeiro nunca tem conflito.</li>
<li>Cada PR seguinte é comparado com a main <b>já atualizada</b>. Se mexeu em outros lugares, o GitHub mostra <i>This branch has no conflicts</i> e o merge junta tudo.</li>
<li>Se mexeu nas mesmas linhas de algo que já entrou, o PR mostra <i>This branch has conflicts that must be resolved</i> e o botão de merge fica bloqueado. Nada do que já foi mesclado se perde.</li>
<li>O autor do PR em conflito traz a main para o próprio ramo, resolve e envia de novo:</li>
</ol>
<pre>git switch meu-ramo
git pull origin main     # o conflito aparece aqui, só nas linhas disputadas
# edite o arquivo, decida a versão final e apague os marcadores
git add arquivo
git commit
git push                 # o PR se atualiza e o merge é liberado</pre>
<p>Para conflitos simples, o GitHub também tem o botão <i>Resolve conflicts</i>, que abre um editor no navegador. Se três pessoas mexeram na mesma linha, isso acontece duas vezes: o segundo resolve contra o primeiro, e o terceiro contra o resultado dos dois.</p>
<div class="alerta"><b>Sem conflito não quer dizer que funciona.</b> Se a Ana renomeia a função <code>calcular()</code> para <code>somar()</code> e o Caio, em outro arquivo, chama <code>calcular()</code>, o Git junta tudo sem reclamar, porque são linhas diferentes. Mas o programa quebra. É o <i>conflito lógico</i>, e é para pegá-lo que servem os testes automáticos rodando em cada PR (Módulo 5).</div>
<p><b>Para ter menos conflitos:</b> PRs pequenos e mesclados rápido, tarefas divididas por arquivo ou por tela, e <code>git pull origin main</code> no seu ramo antes de abrir o PR.</p>
<h3>Merge ou rebase?</h3>
<p>Os dois integram o trabalho de outro ramo no seu, de jeitos diferentes:</p>
<div class="cards">
<div class="card"><b>merge</b>Junta as duas linhas com um commit de merge. O histórico mostra exatamente o que aconteceu, inclusive o "desvio". É seguro sempre.</div>
<div class="card"><b>rebase</b>Pega os seus commits e os <i>reaplica</i> em cima da ponta do outro ramo, como se você tivesse começado agora. O histórico fica em linha reta, mas seus commits ganham IDs novos.</div>
</div>
<div class="alerta"><b>Regra de ouro:</b> nunca faça rebase de commits que outras pessoas já baixaram. Como o rebase troca os IDs, o histórico dos colegas fica diferente do seu. Use rebase só no seu ramo, antes de abrir o PR.</div>
<h3>Reset: voltar o ramo para trás</h3>
<p>O <code>git reset</code> move a etiqueta do ramo para um commit anterior. A diferença entre os modos é o que acontece com as mudanças dos commits "desfeitos":</p>
<table class="cmp"><tr><th>Modo</th><th>Histórico</th><th>Staging</th><th>Pasta de trabalho</th><th>Uso típico</th></tr>
<tr><td>--soft</td><td>volta</td><td>mantém as mudanças preparadas</td><td>mantém</td><td>Juntar vários commits em um</td></tr>
<tr><td>--mixed (padrão)</td><td>volta</td><td>esvazia</td><td>mantém</td><td>Refazer os commits de outro jeito</td></tr>
<tr><td>--hard</td><td>volta</td><td>esvazia</td><td><b>apaga as mudanças</b></td><td>Jogar tudo fora e voltar a um ponto</td></tr></table>
<p><code>HEAD~1</code> significa "um commit antes do atual"; <code>HEAD~3</code>, três antes.</p>
<h3>Reset ou revert?</h3>
<table class="cmp"><tr><th></th><th>git reset</th><th>git revert</th></tr>
<tr><td>Como desfaz</td><td>Volta o ramo e "esconde" os commits</td><td>Cria um commit NOVO com o contrário das mudanças</td></tr>
<tr><td>Muda o histórico?</td><td>Sim</td><td>Não, só acrescenta</td></tr>
<tr><td>Use quando</td><td>Os commits ainda NÃO foram enviados</td><td>Os commits JÁ estão no GitHub</td></tr></table>
<h3>Ferramentas de resgate</h3>
<div class="cards">
<div class="card"><b>git stash</b>Guarda numa "gaveta" o trabalho que ainda não está pronto e deixa a pasta limpa. Útil quando surge uma urgência. <code>git stash pop</code> traz tudo de volta.</div>
<div class="card"><b>git cherry-pick ID</b>Copia um único commit de outro ramo para o atual. Útil para levar só uma correção, sem o resto do ramo.</div>
<div class="card"><b>git reflog</b>O diário do HEAD: registra cada commit, troca de ramo e reset. Um commit "perdido" por reset aparece aqui, e <code>git reset --hard ID</code> o traz de volta.</div>
</div>
${saida('$ git reflog', [['4b1d2e0 HEAD@{0}: reset: moving to HEAD~2', 'O reset que "apagou" os commits'], ['9e8f7a6 HEAD@{1}: commit: Capítulo 5', 'Aqui está o commit perdido!'], ['c3d4e5f HEAD@{2}: commit: Capítulo 4', '']])}
<p>Recuperar: <code>git reset --hard HEAD@{1}</code> (ou o ID <code>9e8f7a6</code>).</p>
<h3>HEAD destacado</h3>
<p>Se você fizer <code>git switch --detach ID</code> (ou o bisect fizer isso por você), o HEAD aponta direto para um commit, sem ramo. Dá para olhar e testar à vontade. Se quiser guardar o que fizer ali, crie um ramo: <code>git switch -c nome</code>.</p>
<h3>Mantendo um fork atualizado</h3>
<p>O seu fork não se atualiza sozinho quando o original muda. Cadastre o original como <code>upstream</code> e traga as novidades:</p>
<pre>git remote add upstream https://github.com/dono/projeto.git   # uma vez
git fetch upstream
git merge upstream/main
git push                                                       # atualiza o fork no GitHub</pre>
<h3>Revisão de código</h3>
<ul><li>O PR faz o que a issue pede, e só isso?</li><li>Dá para entender o código sem explicação? Os nomes são claros?</li><li>Há código repetido, testes faltando ou alguma senha no meio?</li><li>Etiqueta: comente o código, não a pessoa. Prefira "o que acha de…?" a "faça assim". Elogie o que está bom.</li></ul>
<h3>Fluxos de trabalho</h3>
<table class="cmp"><tr><th>Fluxo</th><th>Como funciona</th><th>Para quem</th></tr>
<tr><td>GitHub Flow</td><td>Só a main é permanente. Cada tarefa vira um ramo curto, PR e merge</td><td>A maioria dos projetos e das turmas</td></tr>
<tr><td>Git Flow</td><td>Ramos fixos main e develop, mais ramos de feature, release e hotfix</td><td>Produtos com versões planejadas (apps nas lojas)</td></tr></table>
${erros([['CONFLICT (content): Merge conflict in arquivo', 'Duas versões mudaram a mesma linha. Edite o arquivo, apague os marcadores, git add e git commit.'], ['You have not concluded your merge (MERGE_HEAD exists)', 'Há um merge pela metade. Termine (add + commit) ou cancele com git merge --abort.'], ['Fiz reset --hard e perdi commits', 'Calma: git reflog mostra o ID; git reset --hard ID recupera.'], ["You are in 'detached HEAD' state", 'Você está num commit, fora de qualquer ramo. Volte com git switch main ou crie um ramo.']])}
${resumo(['Conflito = mesma linha mudada pelos dois lados; você decide, apaga os marcadores, add e commit.', 'merge preserva o histórico; rebase deixa em linha reta, mas só em ramos só seus.', 'reset para o que não foi enviado; revert para o que já está no GitHub.', 'stash guarda, cherry-pick copia um commit, reflog recupera o "perdido".'])}
${quiz([['Dei git pull e apareceu um conflito. O que eu NÃO posso esquecer antes do git add?', 'Apagar as linhas com <<<<<<<, ======= e >>>>>>>. Se ficarem, elas vão para o commit e quebram o arquivo.'], ['Um commit com bug já está na main do GitHub e a equipe já baixou. reset ou revert?', 'revert. Ele cria um commit novo que desfaz o erro sem reescrever o histórico dos colegas.'], ['Estou no meio de uma tarefa e pedem uma correção urgente em outro ramo. O que faço com o trabalho pela metade?', 'git stash para guardar, troca de ramo, faz a correção, volta e git stash pop.']])}
<div class="free">Gratuito: tudo neste módulo.</div>`,

/* =============================== 5 =============================== */
5: `
${objetivos(['O que é CI/CD e por que automatizar testes', 'Ler e escrever um workflow do GitHub Actions linha por linha', 'Publicar um site com o GitHub Pages', 'Usar o Dependabot para manter as dependências seguras', 'Versionar o projeto com Conventional Commits, tags e releases'])}
<h3>CI/CD: o robô que testa e publica</h3>
<p><b>CI</b> (integração contínua) significa testar o projeto automaticamente a cada mudança. <b>CD</b> (entrega contínua) significa publicar automaticamente o que passou nos testes. No GitHub, quem faz isso é o <b>GitHub Actions</b>: a cada push ou PR, um computador do GitHub baixa o projeto, roda os comandos que você definiu e mostra ✓ ou ✗.</p>
${analogia('É como ter um colega incansável que, a cada entrega, roda todos os testes e avisa na hora se algo quebrou, antes que chegue ao usuário.')}
<h3>Anatomia de um workflow</h3>
<p>Workflows são arquivos <b>YAML</b> na pasta <code>.github/workflows/</code>. No YAML, a <b>indentação (espaços) faz parte da sintaxe</b>: um espaço a mais ou a menos quebra o arquivo.</p>
${saida('.github/workflows/ci.yml', [['name: Testes', 'Nome que aparece na aba Actions'], ['on: [push, pull_request]', 'QUANDO roda: a cada push e a cada PR'], ['jobs:', 'A lista de tarefas'], ['  test:', 'Nome da tarefa'], ['    runs-on: ubuntu-latest', 'Em qual máquina: Linux do GitHub'], ['    steps:', 'Os passos, em ordem'], ['      - uses: actions/checkout@v4', 'Passo pronto: baixa o código do repositório'], ['      - uses: actions/setup-node@v4', 'Passo pronto: instala o Node.js'], ['        with: { node-version: 22 }', 'Configuração do passo'], ['      - run: npm install', 'Comando seu: instala dependências'], ['      - run: npm test', 'Comando seu: roda os testes. Se falhar, o workflow fica ✗']])}
<p>Para Flutter, troque o setup por <code>subosito/flutter-action</code> e os comandos por <code>flutter pub get</code> e <code>flutter test</code>. Os passos prontos (<code>uses</code>) ficam no GitHub Marketplace; confira lá a versão mais recente de cada um.</p>
<h3>Verificações no pull request</h3>
<p>Com <code>pull_request</code> no <code>on</code>, cada PR mostra o resultado do workflow. Na regra de proteção da main dá para marcar <i>exigir que as verificações passem</i>: aí o botão de merge só libera com ✓. Assim nenhum código com teste quebrado chega à main.</p>
<h3>GitHub Pages: site de graça</h3>
<p>O Pages publica um site <b>estático</b> (HTML, CSS, JavaScript, sem servidor) direto do repositório, no endereço <code>usuario.github.io/repositorio</code>.</p>
<ol><li>Settings → Pages.</li><li>Escolha o ramo (geralmente <code>main</code>) e a pasta (raiz ou <code>/docs</code>).</li><li>Em um ou dois minutos o site está no ar. Cada push na main atualiza o site.</li></ol>
<p>Ótimo para portfólio, documentação e projetos web de turma. Um repositório chamado <code>usuario.github.io</code> vira o site principal da sua conta.</p>
<h3>Dependabot: dependências seguras</h3>
<p>Quase todo projeto usa bibliotecas de terceiros (dependências), listadas em arquivos como <code>package.json</code> ou <code>pubspec.yaml</code>. Às vezes descobre-se uma falha de segurança numa versão. O Dependabot faz duas coisas:</p>
<ul><li><b>Alertas:</b> avisa na aba Security quando uma dependência sua tem vulnerabilidade conhecida e diz para qual versão atualizar.</li>
<li><b>Atualizações:</b> abre PRs sozinho atualizando as versões, se você criar o arquivo abaixo.</li></ul>
<pre># .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"     # ou "pub" para Flutter
    directory: "/"
    schedule:
      interval: "weekly"</pre>
<h3>Versões: SemVer, Conventional Commits, tags e releases</h3>
<p>O <b>versionamento semântico</b> usa três números: <b>MAIOR.MENOR.CORREÇÃO</b>.</p>
<table class="cmp"><tr><th>Mudança</th><th>Exemplo</th><th>Versão</th></tr>
<tr><td>Correção de bug, nada muda para quem usa</td><td>fix: corrige cálculo</td><td>1.0.0 → 1.0.1</td></tr>
<tr><td>Funcionalidade nova, sem quebrar o que existia</td><td>feat: adiciona lembretes</td><td>1.0.1 → 1.1.0</td></tr>
<tr><td>Mudança que quebra compatibilidade</td><td>feat!: muda formato da API</td><td>1.1.0 → 2.0.0</td></tr></table>
<p><b>Conventional Commits</b> é a convenção de começar a mensagem com o tipo: <code>feat:</code>, <code>fix:</code>, <code>docs:</code>, <code>ci:</code>, <code>refactor:</code>, <code>test:</code>. Com isso, ferramentas conseguem gerar as notas da versão automaticamente.</p>
<ul><li>Uma <b>tag</b> é uma etiqueta fixa num commit, como <code>v1.0.0</code>. Diferente do ramo, ela não anda.</li>
<li>Uma <b>release</b> é a página da versão no GitHub: título, notas do que mudou e arquivos para baixar (o APK do app, por exemplo).</li></ul>
<pre>git tag v1.0.0
git push origin v1.0.0
gh release create v1.0.0 --generate-notes</pre>
${erros([['Invalid workflow file / You have an error in your yaml syntax', 'Problema de indentação ou de dois-pontos no YAML. Confira os espaços (use espaços, nunca tab).'], ['O workflow não rodou', 'O arquivo não está em .github/workflows/ ou o "on" não inclui o evento (push / pull_request).'], ['Merge bloqueado: "Required status check is failing"', 'O CI falhou. Abra a aba Actions, leia o log do passo em vermelho, corrija e dê push.'], ['Site do Pages dá 404', 'Confira em Settings → Pages o ramo e a pasta, e se existe um index.html nela.']])}
${resumo(['Actions roda comandos automaticamente em push e PR; o resultado aparece como ✓ ou ✗.', 'Workflow = YAML em .github/workflows/ com on (quando), jobs (o quê) e steps (passos).', 'Pages publica sites estáticos de graça em repositório público.', 'Dependabot avisa sobre dependências vulneráveis e pode atualizar sozinho.', 'feat/fix nas mensagens, versão MAIOR.MENOR.CORREÇÃO, tag e release.'])}
${quiz([['Meu workflow tem "on: push". Ele roda quando alguém abre um PR?', 'Só se o PR for de um ramo do mesmo repositório que recebeu push. Para rodar em todo PR, inclua pull_request no on.'], ['A versão atual é 2.3.1 e eu corrigi um bug. Qual é a próxima?', '2.3.2 (só a CORREÇÃO sobe).'], ['Qual a diferença entre uma tag e um ramo?', 'O ramo anda a cada commit; a tag fica parada para sempre no commit em que foi criada.']])}
<div class="free">Gratuito: em repositórios públicos, Actions com runners padrão não tem limite de minutos, e Pages e Dependabot são grátis. Em privados são 2.000 minutos de Actions por mês, e o Pages exige plano pago.</div>`,

/* =============================== 6 =============================== */
6: `
${objetivos(['Encontrar o commit que introduziu um bug com git bisect', 'Automatizar verificações locais com hooks', 'Assinar commits para provar a autoria', 'Usar a segurança automática gratuita (CodeQL e push protection)', 'Escalar o CI com matriz, runner próprio e workflows reutilizáveis', 'Entender como o Git guarda os dados por dentro'])}
<h3>git bisect: o detetive de bugs</h3>
<p>Algo funcionava há 200 commits e agora não funciona. Testar commit por commit levaria horas. O <b>bisect</b> faz uma <b>busca binária</b>: testa o commit do meio, descarta metade dos suspeitos e repete. Com 200 commits, bastam cerca de 8 testes (2⁸ = 256).</p>
<pre>git bisect start
git bisect bad              # o commit atual tem o bug
git bisect good a1b2c3d     # este commit antigo funcionava
# o Git pula para o meio; você testa e responde:
git bisect good             # ou: git bisect bad
# ... repete até ele dizer "X is the first bad commit"
git bisect reset            # volta para onde estava</pre>
<p>Se existe um teste automático que detecta o bug, o Git faz tudo sozinho: <code>git bisect run npm test</code>.</p>
<h3>Hooks: verificações automáticas no seu PC</h3>
<p>Hooks são scripts na pasta <code>.git/hooks/</code> que o Git executa em certos momentos. O mais usado é o <b>pre-commit</b>, que roda antes de cada commit: se ele terminar com erro, o commit é recusado.</p>
<pre>#!/bin/sh
# .git/hooks/pre-commit (no Git real)
if git diff --cached | grep -q "console.log"; then
  echo "Remova os console.log antes do commit"
  exit 1
fi</pre>
<p>No simulador, a regra é escrita de forma simplificada: <code>proibir console.log</code>. Hooks não vão para o GitHub. Para compartilhar com a equipe, usam-se ferramentas como Husky (JavaScript) ou pre-commit (Python).</p>
<h3>Commits assinados (Verified)</h3>
<p>O <code>user.name</code> é só um texto: qualquer pessoa pode configurar o seu nome e fazer commits "como você". A <b>assinatura</b> usa a sua chave privada para provar que o commit saiu do seu computador. O GitHub mostra o selo <b>Verified</b>.</p>
<pre>git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
gh ssh-key add ~/.ssh/id_ed25519.pub --type signing</pre>
<h3>Segurança automática (grátis em repositório público)</h3>
<div class="cards">
<div class="card"><b>CodeQL (code scanning)</b>Analisa o código-fonte procurando padrões perigosos: injeção de SQL, uso de <code>eval</code> com dados do usuário, e outros. Os alertas aparecem na aba Security.</div>
<div class="card"><b>Secret scanning e push protection</b>Procuram tokens, chaves e senhas. Com push protection, o push que contém um segredo é bloqueado antes de chegar ao GitHub.</div>
</div>
<h3>Actions avançado</h3>
<pre>jobs:
  test:
    strategy:
      matrix:
        node: [20, 22, 24]        # cria 3 jobs, um por versão, em paralelo
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with: { node-version: \${{ matrix.node }} }
      - run: npm test</pre>
<ul><li><b>Matriz:</b> testa o mesmo código em várias versões ou sistemas de uma vez.</li>
<li><b>Runner self-hosted:</b> <code>runs-on: self-hosted</code> roda numa máquina sua (do laboratório, por exemplo). Não consome minutos do GitHub.</li>
<li><b>Workflow reutilizável:</b> um workflow com <code>on: workflow_call</code> pode ser chamado por outros repositórios, evitando copiar o mesmo YAML.</li></ul>
<h3>Por dentro do Git</h3>
<p>O Git guarda tudo como <b>objetos</b> na pasta <code>.git</code>, cada um identificado pelo hash do seu conteúdo:</p>
<table class="cmd">
<tr><td>blob</td><td>O conteúdo de um arquivo</td></tr>
<tr><td>tree</td><td>Uma pasta: lista de nomes apontando para blobs e outras trees</td></tr>
<tr><td>commit</td><td>Aponta para uma tree (a "foto"), para o(s) pai(s), autor, data e mensagem</td></tr>
</table>
<p>Como o ID é calculado a partir do conteúdo, mudar qualquer coisa num commit antigo muda o ID dele e o de todos os seguintes. Por isso o histórico é tão confiável, e por isso o rebase gera IDs novos. Veja um commit por dentro com <code>git cat-file -p HEAD</code>.</p>
<h3>Mais duas ferramentas</h3>
<table class="cmd">
<tr><td>git worktree add -b hotfix ../hotfix</td><td>Abre outro ramo em outra pasta ao mesmo tempo. Dá para corrigir um bug sem largar o que você está fazendo</td></tr>
<tr><td>git submodule add URL pasta</td><td>Inclui outro repositório dentro deste, preso numa versão. Quem clona precisa de <code>git submodule update --init</code></td></tr>
<tr><td>gh api repos/dono/repo/commits</td><td>Consulta a API do GitHub e devolve JSON, para relatórios e automações</td></tr>
</table>
${resumo(['bisect acha o commit culpado em poucos passos; bisect run automatiza com um teste.', 'Hooks verificam antes do commit; assinatura prova a autoria (Verified).', 'Em público: CodeQL e push protection de graça.', 'Matriz testa várias versões; self-hosted roda na sua máquina.', 'Commit → tree → blobs, tudo identificado por hash.'])}
${quiz([['Com 1.000 commits suspeitos, quantos testes o bisect precisa, no máximo?', 'Cerca de 10, porque 2¹⁰ = 1.024.'], ['Por que um hook pre-commit não protege a equipe inteira?', 'Porque a pasta .git/hooks não vai para o GitHub. Cada pessoa precisa instalar, por isso existem ferramentas como Husky.'], ['Se eu mudar a mensagem de um commit antigo, o ID dele muda?', 'Sim, e o de todos os commits depois dele, porque o ID é calculado a partir do conteúdo, que inclui o pai.']])}
<div class="free">Gratuito: tudo aqui, desde que em repositório público ou rodando localmente.</div>`,

/* =============================== 7 =============================== */
7: `
${objetivos(['O que muda entre os planos Free, Pro, Team e Enterprise', 'Os planos do Copilot e o que está incluído', 'Quando a segurança avançada é paga', 'Como a cota de Actions e Codespaces é consumida', 'O que o GitHub Education oferece de graça'])}
<p class="lead">O plano Free cobre a trilha inteira. Os planos pagos fazem diferença principalmente em <b>repositórios privados de equipes</b>, em <b>IA</b> e em <b>segurança avançada</b>. Preços em dólar, de novembro de 2026: confira github.com/pricing antes de cada turma.</p>
<h3>Termos que aparecem nos preços</h3>
<div class="cards">
<div class="card"><b>Por usuário/mês</b>Cada pessoa da organização conta, mesmo quem quase não usa.</div>
<div class="card"><b>Committer ativo</b>Quem fez commit nos repositórios cobertos nos últimos 90 dias.</div>
<div class="card"><b>Minutos de Actions</b>Tempo de máquina usado pelos workflows. Em privado, Windows conta 2× e macOS 10×.</div>
<div class="card"><b>Horas de núcleo (Codespaces)</b>Uma máquina de 2 núcleos por 1 hora consome 2 horas de núcleo.</div>
</div>
<h3>Planos do GitHub</h3>
<table class="cmp">
<tr><th>Plano</th><th>Preço</th><th>O que muda em relação ao Free</th></tr>
<tr><td>Free</td><td>US$ 0</td><td>Repositórios ilimitados, 2.000 min de Actions e 120 h de Codespaces por mês. Proteção de ramo, revisores obrigatórios, Wiki e Pages só em repositório público.</td></tr>
<tr><td>Pro</td><td>US$ 4/mês</td><td>Para uma pessoa: proteção de ramo, draft PRs e Wiki/Pages em repositório privado; 3.000 min de Actions, 180 h de Codespaces e suporte por e-mail.</td></tr>
<tr><td>Team</td><td>US$ 4/usuário/mês</td><td>Para organizações: os mesmos recursos de repositório privado para a equipe, code owners, vários revisores e Codespaces pago pela organização.</td></tr>
<tr><td>Enterprise</td><td>US$ 21/usuário/mês</td><td>Login corporativo (SAML/SCIM), repositórios internos, regras de deploy em privados e 50.000 min de Actions.</td></tr>
</table>
<h3>Copilot</h3>
<table class="cmp">
<tr><th>Plano</th><th>Preço</th><th>Diferença</th></tr>
<tr><td>Free</td><td>US$ 0</td><td>Cota limitada de sugestões de código e de chat por mês.</td></tr>
<tr><td>Student / Pro para professores</td><td>US$ 0 com GitHub Education</td><td>Sugestões ilimitadas e mais créditos de IA. Novos cadastros ficaram suspensos a partir de abril de 2026: confirme a situação.</td></tr>
<tr><td>Pro / Pro+ / Max</td><td>US$ 10 / 39 / 100 por mês</td><td>Mais créditos de IA, mais modelos e agentes.</td></tr>
<tr><td>Business / Enterprise</td><td>US$ 19 / 39 por usuário/mês</td><td>Gestão centralizada e políticas para empresas.</td></tr>
</table>
<p>Atenção: desde junho de 2026, o code review feito pelo Copilot consome créditos de IA <i>e</i> minutos de Actions.</p>
<h3>Segurança avançada (repositórios privados)</h3>
<table class="cmp">
<tr><th>Produto</th><th>Preço</th><th>No Free</th></tr>
<tr><td>Secret Protection</td><td>US$ 19 por committer ativo/mês</td><td>Push protection e secret scanning grátis em público.</td></tr>
<tr><td>Code Security</td><td>US$ 30 por committer ativo/mês</td><td>CodeQL grátis em público; Copilot Autofix e campanhas de segurança são pagos.</td></tr>
</table>
<h3>Uso além da cota</h3>
<ul><li><b>Actions em privado:</b> passou dos 2.000 minutos, cobra-se por minuto. Runners maiores são sempre pagos.</li>
<li><b>Codespaces:</b> as horas grátis são da conta pessoal. No Classroom, o uso é cobrado da organização da turma.</li>
<li><b>Limite de gastos em US$ 0:</b> o serviço para quando a cota acaba, sem gerar cobrança. Configure isso na organização da turma.</li></ul>
<h3>Como decidir</h3>
<ol><li>O projeto pode ser público? Então quase tudo é gratuito.</li><li>É privado e só seu? GitHub Pro (ou Education).</li><li>É privado e de uma equipe que precisa de proteção e revisão? Team.</li><li>A empresa exige login corporativo e auditoria? Enterprise.</li><li>IA e segurança avançada são somas à parte: avalie pelo número de pessoas.</li></ol>
<h3>GitHub Education</h3>
<p>Alunos verificados recebem de graça o GitHub Pro e o Student Developer Pack. Professores e alunos verificados também recebem o Copilot (Pro para professores, Student para alunos), e o GitHub Classroom é gratuito. Na prática, boa parte da tabela acima custa zero para a turma.</p>
${resumo(['Free cobre tudo em repositório público e o básico em privado.', 'Pro é individual; Team é por usuário numa organização; Enterprise para empresas grandes.', 'Copilot e segurança avançada são cobrados à parte.', 'GitHub Education zera boa parte dos custos para turmas.'])}
${quiz([['Uma equipe de 5 pessoas com repositório privado quer exigir revisão antes do merge. Qual plano?', 'Team: 5 × US$ 4 = US$ 20 por mês. O Pro é individual e não cobre a organização.'], ['Um projeto open source quer CodeQL. Precisa pagar?', 'Não. CodeQL é gratuito em repositório público.']])}`,

/* =============================== Glossário =============================== */
8: `
<p class="lead">Os termos que aparecem na trilha, em ordem alfabética.</p>
<dl class="glossario">
${[
['2FA', 'Autenticação em dois fatores: senha mais um código do celular.'],
['Actions', 'Automação do GitHub que roda comandos a cada push, PR ou horário.'],
['branch (ramo)', 'Linha paralela de trabalho. Por dentro, uma etiqueta que aponta para um commit.'],
['checkout / switch', 'Trocar de ramo ou de commit.'],
['CI/CD', 'Integração e entrega contínuas: testar e publicar automaticamente.'],
['clone', 'Cópia completa de um repositório remoto no seu computador.'],
['collaborator', 'Pessoa com permissão de escrita num repositório.'],
['commit', 'Ponto de salvamento: a foto do projeto com autor, data, mensagem e pai.'],
['conflito', 'Quando duas versões mudam a mesma linha e o Git pede que você decida.'],
['diff', 'A diferença entre duas versões: linhas removidas (-) e adicionadas (+).'],
['fetch', 'Baixar as novidades do remoto sem mexer nos seus arquivos.'],
['fork', 'Cópia de um repositório de outra pessoa na sua conta.'],
['.gitignore', 'Lista de arquivos e padrões que o Git deve ignorar.'],
['hash / ID', 'Identificador único de um commit, calculado a partir do conteúdo.'],
['HEAD', 'Onde você está agora: normalmente o ramo atual.'],
['hook', 'Script que o Git executa automaticamente em certos momentos, como antes do commit.'],
['issue', 'Registro de tarefa, bug ou ideia, com número (#12), labels e responsáveis.'],
['main', 'O ramo principal do projeto (antigamente chamado master).'],
['Markdown', 'Formato de texto com símbolos simples para títulos, listas e links. Usado no README.'],
['merge', 'Juntar o trabalho de um ramo em outro.'],
['origin', 'Nome padrão do remoto de onde você clonou (o seu repositório no GitHub).'],
['Pages', 'Hospedagem gratuita de sites estáticos a partir de um repositório.'],
['pull', 'Trazer commits do remoto e juntar com os seus (fetch + merge).'],
['pull request (PR)', 'Pedido para juntar um ramo em outro, com revisão e discussão.'],
['push', 'Enviar seus commits para o remoto.'],
['rebase', 'Reaplicar seus commits em cima de outro ponto, deixando o histórico linear.'],
['reflog', 'Diário local de tudo que o HEAD fez; recupera commits "perdidos".'],
['release', 'Página de uma versão publicada, com notas e arquivos.'],
['remoto', 'Cópia do repositório em outro lugar, como o GitHub.'],
['repositório', 'Projeto com todo o histórico de versões.'],
['reset', 'Mover o ramo para outro commit (soft, mixed ou hard).'],
['revert', 'Criar um commit que desfaz outro, sem apagar histórico.'],
['SSH', 'Forma de autenticação com par de chaves (privada no PC, pública no GitHub).'],
['staging', 'Área de preparação: o que entra no próximo commit.'],
['stash', 'Gaveta temporária para mudanças ainda não commitadas.'],
['tag', 'Etiqueta fixa num commit, normalmente uma versão (v1.0.0).'],
['upstream', 'O repositório original de onde você fez fork; ou o ramo remoto ligado ao seu ramo local.'],
['YAML', 'Formato de configuração baseado em indentação, usado nos workflows.']
].map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}
</dl>`
};
