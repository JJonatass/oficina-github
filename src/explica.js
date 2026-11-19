/* ===== Explicações dos comandos para iniciantes ===== */
function explicar(linha) {
  const t = tokenize((linha || '').trim()); if (!t.length) return null;
  const [c, s, ...r] = t; const rest = [s, ...r].filter(Boolean);
  const pos = (c === 'git' || c === 'gh' ? r : rest).filter(x => x && !x.startsWith('-'));
  const tem = (...o) => o.some(x => rest.includes(x));
  const arg = i => pos[i] ? '"' + pos[i] + '"' : '';
  const red = t.indexOf('>') >= 0 ? '>' : t.indexOf('>>') >= 0 ? '>>' : null;
  if (c === 'echo') {
    if (!red) return 'Mostra um texto na tela.';
    const f = t[t.indexOf(red) + 1] || 'arquivo';
    return red === '>>' ? `Acrescenta uma linha no final de ${f} (cria o arquivo se não existir). É como abrir o arquivo e escrever embaixo do que já tem.` : `Escreve o texto dentro de ${f}, substituindo todo o conteúdo anterior. Se o arquivo não existe, ele é criado.`;
  }
  const simples = {
    help: 'Lista todos os comandos que este simulador entende.', clear: 'Limpa a tela do terminal (não apaga nada do projeto).',
    pwd: 'Mostra em qual pasta você está agora.', ls: 'Lista os arquivos da pasta atual. Com -a mostra também os ocultos, como .gitignore.',
    cd: `Entra na pasta ${arg(0) || 'indicada'}. Os comandos seguintes passam a valer dentro dela.`,
    cat: `Mostra o conteúdo do arquivo ${arg(0)} na tela, sem alterar nada.`, touch: `Cria o arquivo vazio ${arg(0)}.`,
    rm: `Apaga o arquivo ${arg(0)} da pasta. O Git vai perceber como "deletado".`, mv: `Move ou renomeia ${arg(0)} para ${arg(1)}.`,
    nano: `Abre ${arg(0)} num editor de texto para você mudar o conteúdo.`, code: `Abre ${arg(0)} num editor de texto.`, mkdir: 'Cria uma pasta.',
    'ssh-keygen': 'Gera um par de chaves SSH: a privada fica só no seu computador e a pública (.pub) você cadastra no GitHub. É uma forma de provar quem você é sem digitar senha.',
    responder: 'Registra a sua resposta para o exercício.',
    colega: 'Simula um colega da turma revisando e aprovando o seu pull request.',
    npm: 'Roda os testes automáticos do projeto (npm test). Se algum falhar, você sabe que há um bug.'
  };
  if (c !== 'git' && c !== 'gh') return simples[c] || null;
  if (c === 'git') {
    switch (s) {
      case undefined: return 'Git é o programa que guarda o histórico do projeto. Ele sempre vem seguido de uma ação: git status, git add…';
      case 'init': return 'Transforma a pasta em um repositório Git: a partir daqui o Git passa a guardar o histórico dela (cria a pasta oculta .git).' + (pos[0] ? ` Aqui ele também cria a pasta ${arg(0)}.` : '');
      case 'config': if (tem('--list', '-l')) return 'Mostra todas as configurações do Git.';
        if (/user\.name/.test(linha)) return 'Diz ao Git o seu nome. Ele aparece como autor em todos os seus commits. Com --global vale para todos os projetos deste computador.';
        if (/user\.email/.test(linha)) return 'Diz ao Git o seu e-mail. O GitHub usa esse e-mail para ligar os commits à sua conta.';
        if (/gpg\.format/.test(linha)) return 'Diz ao Git para assinar commits usando chave SSH (em vez de GPG).';
        if (/signingkey/.test(linha)) return 'Diz ao Git qual chave usar para assinar os commits.';
        if (/gpgsign/.test(linha)) return 'Liga a assinatura automática: todo commit passa a sair assinado.';
        return 'Lê ou altera uma configuração do Git.';
      case 'status': return 'Mostra a situação do projeto: em qual ramo você está, quais arquivos mudaram, o que já está preparado para o commit e se você está à frente ou atrás do GitHub. Não muda nada, então use sempre que tiver dúvida.';
      case 'add': return (pos[0] === '.' || tem('-A', '--all')) ? 'Prepara TODAS as mudanças da pasta para o próximo commit (coloca na área de staging). Pense em "colocar na caixa antes de fechar o pacote".' : `Prepara ${pos.join(', ')} para o próximo commit (área de staging). Só o que está preparado entra no commit.`;
      case 'commit': if (tem('--amend')) return 'Refaz o último commit: troca a mensagem e/ou inclui o que está preparado agora. Use só em commits que ainda NÃO foram enviados com push.';
        return 'Grava uma "fotografia" de tudo que está preparado, com a mensagem entre aspas explicando o que mudou. O commit fica no histórico do seu computador; para ir ao GitHub ainda falta o push.' + (tem('-a', '-am') ? ' O -a prepara automaticamente os arquivos já monitorados que foram modificados.' : '');
      case 'log': return 'Mostra o histórico de commits, do mais novo para o mais antigo.' + (tem('--oneline') ? ' --oneline resume cada commit em uma linha (ID curto + mensagem).' : '') + (tem('--all') ? ' --all inclui todos os ramos, até os remotos.' : '') + (rest.includes('--') ? ' -- arquivo filtra só os commits que mexeram nele.' : '');
      case 'show': return `Mostra os detalhes de um commit (${pos[0] || 'HEAD'}): autor, mensagem e exatamente quais linhas ele mudou.`;
      case 'diff': return tem('--staged', '--cached') ? 'Mostra as linhas que já estão preparadas para o commit.' : 'Mostra linha por linha o que mudou e ainda não foi preparado. Linhas com - saíram e linhas com + entraram.';
      case 'blame': return `Mostra, para cada linha de ${arg(0)}, quem escreveu e em qual commit. Ótimo para investigar a origem de um bug.`;
      case 'clone': return 'Baixa um repositório do GitHub para o seu computador, com todos os arquivos e todo o histórico. Também já configura o "origin", o apelido do endereço no GitHub.';
      case 'remote': if (pos[0] === 'add') return `Cria um apelido (${arg(1)}) para um endereço no GitHub. "origin" é o seu repositório; "upstream" costuma ser o original de onde você fez fork.`;
        return 'Lista os remotos, os endereços no GitHub ligados a este repositório.' + (tem('-v') ? ' O -v mostra as URLs completas.' : '');
      case 'push': if (pos[1] && /^v\d/.test(pos[1])) return `Envia a tag ${arg(1)} para o GitHub.`;
        return 'Envia os seus commits do computador para o GitHub.' + (tem('-u', '--set-upstream') ? ' O -u liga o ramo local ao remoto, e nas próximas vezes basta git push.' : '') + ' Se alguém enviou algo antes de você, o push é recusado e você precisa fazer git pull primeiro.';
      case 'pull': return 'Traz do GitHub os commits que você ainda não tem e junta com os seus (é um fetch seguido de um merge). Pode gerar conflito se vocês mudaram as mesmas linhas.';
      case 'fetch': return `Baixa as novidades do remoto ${pos[0] || 'origin'} SEM mexer nos seus arquivos. Depois você decide se quer juntar (merge).`;
      case 'branch': if (tem('-d', '-D')) return `Apaga o ramo ${arg(0)}. Com -d o Git só deixa se ele já foi mesclado.`;
        return pos[0] ? `Cria o ramo ${arg(0)} apontando para o commit atual, mas não muda para ele.` : 'Lista os ramos. O asterisco (*) marca o ramo em que você está.';
      case 'switch': case 'checkout':
        if (s === 'checkout' && rest[0] === '--') return 'Descarta as alterações do arquivo, voltando à versão preparada.';
        return tem('-c', '-b') ? `Cria o ramo ${arg(0)} e já muda para ele. Ramo é uma linha paralela de trabalho: o que você fizer aqui não afeta a main.` : `Muda para o ramo ${arg(0) || '(indicado)'}: os arquivos da pasta passam a ser os daquele ramo.`;
      case 'merge': if (tem('--abort')) return 'Cancela o merge em andamento e volta ao estado de antes.';
        return `Traz para o ramo atual os commits de ${arg(0)}. Se só um lado andou, é "fast-forward" (o ponteiro avança). Se os dois andaram, cria um commit de merge, e se mudaram a mesma linha dá conflito.`;
      case 'rebase': if (tem('--continue')) return 'Continua o rebase depois de você resolver o conflito e dar git add.'; if (tem('--abort')) return 'Cancela o rebase e volta tudo como estava.';
        return `Reaplica os commits do seu ramo em cima da ponta de ${arg(0)}, deixando o histórico em linha reta. Use só em ramos que ninguém mais baixou.`;
      case 'restore': return tem('--staged', '-S') ? `Tira ${arg(0)} da área de preparação. O conteúdo do arquivo continua igual, só não vai mais entrar no commit.` : `Descarta as mudanças de ${arg(0)} que não foram preparadas, voltando o arquivo à última versão salva. Cuidado: o que você escreveu se perde.`;
      case 'reset': if (tem('--soft')) return `Move o ramo para ${pos[0] || 'HEAD'}, mas mantém as mudanças dos commits desfeitos já preparadas. Útil para juntar vários commits em um.`;
        if (tem('--hard')) return `Move o ramo para ${pos[0] || 'HEAD'} e APAGA as alterações da pasta. Os commits "somem" do log, mas ainda dá para recuperar com git reflog.`;
        return `Move o ramo para ${pos[0] || 'HEAD'} e tira as mudanças do staging, mas mantém os arquivos como estão.`;
      case 'revert': return `Cria um commit NOVO que desfaz as mudanças de ${pos[0] || 'HEAD'}. É a forma segura de desfazer algo que já foi enviado, porque não apaga histórico.`;
      case 'cherry-pick': return `Copia só o commit ${arg(0)} (de outro ramo) para o ramo atual.`;
      case 'stash': if (pos[0] === 'pop') return 'Traz de volta o trabalho guardado no stash e o remove da gaveta.'; if (pos[0] === 'list') return 'Lista o que está guardado no stash.';
        return 'Guarda numa "gaveta" as mudanças que você ainda não commitou e deixa a pasta limpa. Depois git stash pop traz tudo de volta.';
      case 'tag': return pos[0] ? `Marca o commit atual com o nome ${arg(0)}, normalmente um número de versão.` : 'Lista as tags (marcas de versão).';
      case 'reflog': return 'Mostra o diário de tudo que o HEAD fez: commits, trocas de ramo, resets. É a rede de segurança para achar commits "perdidos".';
      case 'bisect': return { start: 'Inicia a busca binária pelo commit que introduziu um bug.', bad: 'Marca o commit atual (ou o indicado) como ruim, com o bug.', good: `Marca ${arg(1) || 'o commit'} como bom, sem o bug. O Git pula para o meio do caminho.`, run: 'Deixa o Git testar sozinho cada commit com o comando indicado (por exemplo npm test) até achar o culpado.', reset: 'Encerra o bisect e volta para o ramo onde você estava.' }[pos[0]] || 'Busca binária no histórico para achar o commit que introduziu um bug.';
      case 'worktree': return pos[0] === 'add' ? 'Abre outro ramo em outra pasta ao mesmo tempo, sem precisar de stash nem trocar de ramo.' : 'Lista ou gerencia as pastas de trabalho extras.';
      case 'cat-file': return 'Mostra por dentro como o Git guarda um objeto: um commit aponta para uma árvore de arquivos, para os pais e para o autor.';
      case 'submodule': return 'Coloca outro repositório dentro deste, numa versão fixa. É útil para bibliotecas compartilhadas.';
      case 'rm': return tem('--cached') ? `Para de monitorar ${arg(0)}, mas mantém o arquivo na pasta.` : `Apaga ${arg(0)} e já prepara a remoção para o commit.`;
      default: return null;
    }
  }
  const sub = s + ' ' + (r[0] || '');
  const gx = {
    'auth login': 'Faz login na sua conta do GitHub pelo terminal. Depois disso push, pull e os comandos gh funcionam sem pedir senha.',
    'auth status': 'Mostra se você está logado no GitHub e com qual conta.',
    'repo create': `Cria um repositório novo no GitHub (na nuvem) chamado ${arg(1)}. --public: qualquer pessoa vê; --private: só você e convidados.`,
    'repo clone': 'Baixa um repositório do GitHub para o computador (igual ao git clone).',
    'repo fork': 'Cria uma cópia do repositório de outra pessoa na SUA conta. Com --clone também baixa a cópia e configura o upstream apontando para o original.',
    'repo view': 'Mostra um resumo do repositório no GitHub.', 'repo edit': 'Altera configurações do repositório, por exemplo a visibilidade (pública ou privada).', 'repo sync': 'Atualiza o seu fork com as novidades do original.',
    'pr create': 'Abre um pull request: um pedido para juntar o seu ramo à main. É ali que a equipe revisa e comenta antes do merge.',
    'pr list': 'Lista os pull requests abertos.', 'pr view': 'Mostra os detalhes de um pull request.', 'pr checks': 'Mostra o resultado dos testes automáticos (CI) do pull request: ✓ passou, ✗ falhou.',
    'pr merge': 'Mescla o pull request na main do GitHub. Se a main estiver protegida, precisa da aprovação e/ou do CI passando.', 'pr review': 'Registra uma revisão no pull request (aprovar ou pedir mudanças).',
    'issue list': 'Lista as issues abertas: tarefas, bugs e ideias do projeto.', 'issue view': 'Mostra os detalhes de uma issue.', 'issue create': 'Cria uma issue para registrar uma tarefa ou um bug.', 'issue close': 'Fecha uma issue.',
    'release create': `Publica uma release (versão oficial) a partir da tag ${arg(1)}. --generate-notes monta as notas com as mensagens dos commits.`,
    'ssh-key add': 'Cadastra a sua chave pública SSH na conta do GitHub.' + (tem('signing') ? ' Com --type signing ela serve para assinar commits (selo Verified).' : ' Assim o GitHub reconhece o seu computador.'),
    'api repos/': 'Consulta a API do GitHub e recebe os dados em JSON, o formato usado em automações e relatórios.'
  };
  if (s === 'api') return gx['api repos/'];
  return gx[sub.trim()] || (s ? 'Comando do GitHub CLI: faz no terminal o que você faria no site do GitHub.' : 'GitHub CLI: usa o GitHub pelo terminal.');
}

/* Resumo do que aconteceu depois de rodar (contextual) */
function aconteceu(linha, outs) {
  if (outs.some(o => !o.ok)) return 'O comando não foi concluído. Leia a mensagem em vermelho: o Git quase sempre diz o motivo e o que fazer.';
  const t = tokenize(linha.trim()); const [c, s] = t; const L = W.local;
  if (c !== 'git') return null;
  if (s === 'add' && L) { const n = status(L).staged.length; return n + ' arquivo(s) agora preparado(s). Veja a coluna "Staging" na aba Arquivos.'; }
  if (s === 'commit' && L && headId(L)) return 'Novo commit ' + short(headId(L)) + ' criado no ramo ' + (curBranch(L) || 'atual') + '. Ele está só no seu computador até você fazer git push.';
  if (s === 'push') return 'Agora o GitHub tem os seus commits. Confira na aba GitHub.';
  if ((s === 'switch' || s === 'checkout') && L && curBranch(L)) return 'Você está no ramo ' + curBranch(L) + '. Veja o HEAD no grafo.';
  if (s === 'clone' && L) return 'Pasta ~/' + L.name + ' criada com o projeto. Os próximos comandos já valem dentro dela.';
  if (s === 'init' && L) return 'Repositório pronto. Ainda não há commits: crie arquivos, git add e git commit.';
  return null;
}

/* Glossário: comandos únicos usados numa lista de passos */
function glossario(passos) {
  const vistos = new Map();
  passos.filter(p => typeof p === 'string').forEach(p => {
    const t = tokenize(p); if (!t.length) return;
    let chave = t[0] === 'git' || t[0] === 'gh' ? t.slice(0, t[0] === 'gh' ? 3 : 2).filter(x => !x.startsWith('-') && !/^["']|\//.test(x)).join(' ') : t[0];
    if (t[0] === 'echo') chave = t.includes('>>') ? 'echo "…" >> arquivo' : 'echo "…" > arquivo';
    if (t[0] === 'git' && t[1] === 'commit' && t.includes('--amend')) chave = 'git commit --amend';
    if (t[0] === 'git' && t[1] === 'config') chave = 'git config ' + (t.find(x => /\./.test(x) && !x.startsWith('-')) || '');
    if (t[0] === 'git' && t[1] === 'bisect') chave = 'git bisect ' + (t[2] || '');
    if (t[0] === 'git' && t[1] === 'reset') chave = 'git reset ' + (t.find(x => /^--(soft|hard)$/.test(x)) || '');
    if (t[0] === 'git' && t[1] === 'restore' && t.includes('--staged')) chave = 'git restore --staged';
    if (t[0] === 'git' && t[1] === 'stash' && t[2] === 'pop') chave = 'git stash pop';
    if (t[0] === 'git' && (t[1] === 'switch' || t[1] === 'checkout') && t.some(x => x === '-c' || x === '-b')) chave = 'git ' + t[1] + ' -c';
    if (!vistos.has(chave.trim())) vistos.set(chave.trim(), explicar(p));
  });
  return [...vistos.entries()].filter(([k, v]) => v);
}
