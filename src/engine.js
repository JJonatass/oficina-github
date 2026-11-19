/* ===== Motor Git + GitHub simulado ===== */
let W;
const SECRET_RE = /(ghp_[A-Za-z0-9]{6,}|(senha|password|token)\s*[=:]\s*["'][^"']{3,}["']|AKIA[0-9A-Z]{8,})/i;
function npmTest(tree) {
  const bad = Object.entries(tree).find(([k, v]) => !k.startsWith('.github/') && /FALHA/.test(v));
  if (bad) return { ok: false, why: 'teste falhou em ' + bad[0] };
  if (tree['calc.test.js'] && /a\s*-\s*b/.test(tree['calc.js'] || '')) return { ok: false, why: 'calc.test.js: esperado soma(2,3) = 5, recebido -1' };
  return { ok: true, why: '' };
}

function freshWorld() {
  return {
    user: 'aluno', auth: false, twofa: false, ghKeys: [], localKeys: [],
    obj: {}, clock: 100, gh: {}, local: null, gconfig: {},
    flags: new Set(), answer: null, cmds: [], editor: null
  };
}

const clone = o => JSON.parse(JSON.stringify(o));
const short = id => id ? id.slice(0, 7) : '';
function newId() { let id; do { id = Array.from({ length: 40 }, () => '0123456789abcdef'[Math.random() * 16 | 0]).join(''); } while (W.obj[id]); return id; }
const sameTree = (a, b) => JSON.stringify(sortObj(a)) === JSON.stringify(sortObj(b));
function sortObj(o) { const r = {}; Object.keys(o || {}).sort().forEach(k => r[k] = o[k]); return r; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- objetos ---------- */
function mkCommit(msg, parents, tree, author, extra) {
  const id = newId();
  W.obj[id] = Object.assign({ id, msg, parents: parents.filter(Boolean), tree: clone(tree), author: author || 'Aluno', t: ++W.clock, signed: false }, extra || {});
  return id;
}
function mkHistory(list, start) {
  // list: [{msg, files:{nome:conteudo|null}, author}] -> ids
  let parent = start || null, tree = start ? clone(W.obj[start].tree) : {};
  const ids = [];
  list.forEach(c => {
    Object.entries(c.files || {}).forEach(([k, v]) => { if (v === null) delete tree[k]; else tree[k] = v; });
    parent = mkCommit(c.msg, parent ? [parent] : [], tree, c.author || 'Prof. Jonatas', c.extra);
    ids.push(parent);
  });
  return ids;
}
function ancestors(id) {
  const s = new Set(); const st = id ? [id] : [];
  while (st.length) { const x = st.pop(); if (!x || s.has(x)) continue; s.add(x); (W.obj[x]?.parents || []).forEach(p => st.push(p)); }
  return s;
}
const isAnc = (a, b) => !a || ancestors(b).has(a);
function mergeBase(a, b) {
  const A = ancestors(a); let best = null;
  ancestors(b).forEach(x => { if (A.has(x) && (!best || W.obj[x].t > W.obj[best].t)) best = x; });
  return best;
}
/* merge de 3 vias linha a linha (como o diff3 do Git) */
function lcsPairs(a, b) {
  const n = a.length, m = b.length, dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const p = []; let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { p.push([i, j]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
  return p;
}
function hunks(base, other) {
  const p = lcsPairs(base, other).concat([[base.length, other.length]]); const h = []; let pb = 0, po = 0;
  p.forEach(([bi, oj]) => { if (bi > pb || oj > po) h.push({ s: pb, e: bi, lines: other.slice(po, oj) }); pb = bi + 1; po = oj + 1; });
  return h;
}
function mergeLines(b, o, t, labelO, labelT) {
  const B = b.split('\n'), O = o.split('\n'), T = t.split('\n');
  const all = hunks(B, O).map(h => ({ ...h, side: 'o' })).concat(hunks(B, T).map(h => ({ ...h, side: 't' }))).sort((x, y) => x.s - y.s || x.e - y.e);
  const out = []; let pos = 0, conflict = false, k = 0;
  while (k < all.length) {
    const g = [all[k]]; let gs = all[k].s, ge = all[k].e; k++;
    while (k < all.length && all[k].s <= ge && !(all[k].s === ge && all[k].e === ge && g.every(x => x.e < ge))) { g.push(all[k]); ge = Math.max(ge, all[k].e); k++; }
    while (pos < gs) out.push(B[pos++]);
    const ver = side => { const hs = g.filter(x => x.side === side); if (!hs.length) return null; const r = []; let p2 = gs; hs.forEach(h => { while (p2 < h.s) r.push(B[p2++]); r.push(...h.lines); p2 = h.e; }); while (p2 < ge) r.push(B[p2++]); return r; };
    const vo = ver('o'), vt = ver('t');
    if (!vo) out.push(...vt); else if (!vt) out.push(...vo);
    else if (vo.join('\n') === vt.join('\n')) out.push(...vo);
    else { conflict = true; out.push('<<<<<<< ' + (labelO || 'HEAD'), ...vo, '=======', ...vt, '>>>>>>> ' + (labelT || 'outro')); }
    pos = ge;
  }
  while (pos < B.length) out.push(B[pos++]);
  return { text: out.join('\n'), conflict };
}
function merge3(base, ours, theirs, labelO, labelT) {
  const out = {}, conflicts = [];
  const keys = new Set([...Object.keys(base || {}), ...Object.keys(ours || {}), ...Object.keys(theirs || {})]);
  keys.forEach(k => {
    const b = base?.[k], o = ours?.[k], t = theirs?.[k];
    let r;
    if (o === t) r = o; else if (o === b) r = t; else if (t === b) r = o;
    else if (o !== undefined && t !== undefined) { const m = mergeLines(b ?? '', o, t, labelO, labelT); r = m.text; if (m.conflict) conflicts.push(k); }
    else { conflicts.push(k); r = `<<<<<<< ${labelO || 'HEAD'}\n${o ?? ''}\n=======\n${t ?? ''}\n>>>>>>> ${labelT || 'outro'}`; }
    if (r !== undefined) out[k] = r;
  });
  return { tree: out, conflicts };
}

/* ---------- repositórios ---------- */
function mkRemote(full, opts) {
  const [owner, name] = full.split('/');
  W.gh[full] = Object.assign({
    full, owner, name, visibility: 'public', branches: {}, def: 'main', prs: [], issues: [], runs: [], releases: [], tags: {},
    protect: false, reqReview: false, reqChecks: false, pushProtection: true, dependabot: false, codeql: false, pages: false,
    collaborators: [], forkOf: null, minutes: 0, description: ''
  }, opts || {});
  return W.gh[full];
}
function newLocal(name) {
  return { name, files: {}, index: {}, head: { type: 'branch', name: 'main' }, branches: {}, remoteRefs: {}, remotes: {}, config: {}, reflog: [], stash: [], tags: {}, merge: null, rebase: null, bisect: null, upstream: {} };
}
function cloneInto(full, remoteName) {
  const R = W.gh[full]; const L = newLocal(R.name);
  L.remotes[remoteName || 'origin'] = full;
  Object.entries(R.branches).forEach(([b, id]) => L.remoteRefs[(remoteName || 'origin') + '/' + b] = id);
  const tip = R.branches[R.def];
  L.head = { type: 'branch', name: R.def };
  if (tip) { L.branches[R.def] = tip; L.files = clone(W.obj[tip].tree); L.index = clone(W.obj[tip].tree); L.upstream[R.def] = 'origin/' + R.def; }
  L.reflog.unshift({ id: tip, msg: 'clone: from https://github.com/' + full });
  W.local = L; return L;
}
const headId = (L = W.local) => L.head.type === 'branch' ? L.branches[L.head.name] : L.head.id;
const headTree = L => { const h = headId(L); return h ? W.obj[h].tree : {}; };
function cfg(key) { const L = W.local; return (L && L.config[key] !== undefined) ? L.config[key] : W.gconfig[key]; }

function resolve(L, rev) {
  if (!rev) return null;
  let m = rev.match(/^(.+?)(~(\d*)|\^+)$/);
  if (m) {
    let id = resolve(L, m[1]); if (!id) return null;
    const n = m[2].startsWith('~') ? (m[3] === '' ? 1 : +m[3]) : m[2].length;
    for (let i = 0; i < n; i++) { id = W.obj[id]?.parents[0]; if (!id) return null; }
    return id;
  }
  if (rev === 'HEAD' || rev === '@') return headId(L);
  m = rev.match(/^HEAD@\{(\d+)\}$/); if (m) return L.reflog[+m[1]]?.id || null;
  if (L.branches[rev]) return L.branches[rev];
  if (L.remoteRefs[rev]) return L.remoteRefs[rev];
  if (L.tags[rev]) return L.tags[rev];
  if (/^[0-9a-f]{4,40}$/.test(rev)) { const hits = Object.keys(W.obj).filter(k => k.startsWith(rev)); if (hits.length === 1) return hits[0]; }
  return null;
}

/* ---------- status ---------- */
function ignored(L, path) {
  const gi = (L.files['.gitignore'] || '').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
  const base = path.split('/').pop();
  return gi.some(p => {
    if (p.endsWith('/')) return path.startsWith(p);
    if (p.includes('*')) { const re = new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'); return re.test(base) || re.test(path); }
    return path === p || base === p || path.startsWith(p + '/');
  });
}
const tracked = p => !p.startsWith('.git/');
function status(L) {
  const H = headTree(L), I = L.index, F = L.files;
  const staged = [], unstaged = [], untracked = [], conflicted = (L.merge || L.rebase)?.conflicts?.filter(f => !(f in I && I[f] === F[f] && !/^<{7}/m.test(F[f] || ''))) || [];
  new Set([...Object.keys(H), ...Object.keys(I)]).forEach(k => { if (H[k] !== I[k]) staged.push([k, !(k in H) ? 'novo arquivo' : !(k in I) ? 'deletado' : 'modificado']); });
  new Set([...Object.keys(I), ...Object.keys(F)]).forEach(k => {
    if (!tracked(k) || conflicted.includes(k)) return;
    if (!(k in I)) { if (!ignored(L, k)) untracked.push(k); }
    else if (I[k] !== F[k]) unstaged.push([k, !(k in F) ? 'deletado' : 'modificado']);
  });
  return { staged, unstaged, untracked, conflicted };
}
function fileState(L, k) {
  const s = status(L);
  if (s.conflicted.includes(k)) return 'C';
  if (s.untracked.includes(k)) return 'U';
  if (ignored(L, k) && !(k in L.index)) return 'I';
  const st = s.staged.find(x => x[0] === k), un = s.unstaged.find(x => x[0] === k);
  if (un) return 'M'; if (st) return 'A'; return '';
}

/* ---------- terminal ---------- */
function tokenize(s) {
  const out = []; let cur = '', q = null, has = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; else if (c === '\\' && q === '"' && s[i + 1] === 'n') { cur += '\n'; i++; } else cur += c; continue; }
    if (c === '"' || c === "'") { q = c; has = true; continue; }
    if (c === ' ' || c === '\t') { if (cur || has) { out.push(cur); cur = ''; has = false; } continue; }
    if (c === '>') { if (cur || has) { out.push(cur); cur = ''; has = false; } if (s[i + 1] === '>') { out.push('>>'); i++; } else out.push('>'); continue; }
    cur += c;
  }
  if (cur || has) out.push(cur);
  return out;
}
function splitChain(s) {
  const parts = []; let cur = '', q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; cur += c; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '&' && s[i + 1] === '&') { parts.push(cur); cur = ''; i++; continue; }
    if (c === ';') { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur); return parts.map(x => x.trim()).filter(Boolean);
}
class GitErr extends Error { }
const fail = m => { throw new GitErr(m); };
const needRepo = () => { if (!W.local) fail('fatal: não é um repositório git (nem nenhum dos diretórios pais): .git\nDica: use git init ou git clone.'); return W.local; };

function run(line) {
  W.cmds.push(line.trim());
  const outs = [];
  for (const part of splitChain(line)) {
    try { const o = exec(tokenize(part)); if (o) outs.push({ t: o, ok: true }); }
    catch (e) { if (e instanceof GitErr) { outs.push({ t: e.message, ok: false }); break; } else { console.error(e); outs.push({ t: 'erro interno do simulador: ' + e.message, ok: false }); break; } }
  }
  return outs;
}

function exec(a) {
  if (!a.length) return '';
  const [c, ...r] = a;
  const redir = a.indexOf('>') >= 0 ? a.indexOf('>') : a.indexOf('>>');
  if (c === 'echo') {
    if (redir < 0) return a.slice(1).join(' ');
    const txt = a.slice(1, redir).join(' '), file = a[redir + 1]; if (!file) fail('bash: erro de sintaxe');
    const L = needRepo(); const app = a[redir] === '>>';
    L.files[file] = app && L.files[file] !== undefined ? (L.files[file] ? L.files[file] + '\n' : '') + txt : txt;
    return '';
  }
  switch (c) {
    case 'help': case 'ajuda': return HELP;
    case 'clear': case 'cls': W.flags.add('clear'); return '';
    case 'pwd': return W.local ? '/home/aluno/' + W.local.name : '/home/aluno';
    case 'cd': if (!r[0] || r[0] === '..' || r[0] === '~') return ''; if (W.local && r[0].replace(/\/$/, '') === W.local.name) return ''; fail('bash: cd: ' + r[0] + ': Arquivo ou diretório inexistente');
    case 'mkdir': return '';
    case 'ls': { const L = needRepo(); const ks = Object.keys(L.files).filter(k => tracked(k) && (r.includes('-a') || !k.startsWith('.'))).sort(); return ks.join('\n') || '(pasta vazia)'; }
    case 'cat': {
      if (r[0] === '~/.ssh/id_ed25519.pub') { if (!W.localKeys.length) fail('cat: ~/.ssh/id_ed25519.pub: Arquivo inexistente. Gere com ssh-keygen -t ed25519'); return 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI' + W.localKeys[0] + ' aluno@profjon'; }
      const L = needRepo(); if (!r[0] || L.files[r[0]] === undefined) fail('cat: ' + (r[0] || '') + ': Arquivo ou diretório inexistente'); return L.files[r[0]];
    }
    case 'touch': { const L = needRepo(); r.forEach(f => { if (L.files[f] === undefined) L.files[f] = ''; }); return ''; }
    case 'rm': { const L = needRepo(); r.filter(x => !x.startsWith('-')).forEach(f => { if (L.files[f] === undefined) fail("rm: não foi possível remover '" + f + "'"); delete L.files[f]; }); return ''; }
    case 'mv': { const L = needRepo(); if (L.files[r[0]] === undefined) fail('mv: ' + r[0] + ' não existe'); L.files[r[1]] = L.files[r[0]]; delete L.files[r[0]]; return ''; }
    case 'nano': case 'code': case 'vim': { const L = needRepo(); if (!r[0]) fail('informe o arquivo: nano arquivo.txt'); W.editor = r[0]; if (L.files[r[0]] === undefined) L.files[r[0]] = ''; return '(editor aberto acima do terminal — salve para voltar)'; }
    case 'explicar': case 'man': { const q = a.slice(1).join(' ').trim(); if (!q) return 'uso: explicar <comando>   ex.: explicar git add .'; return (typeof explicar === 'function' && explicar(q)) || 'Não tenho explicação para "' + q + '". Digite help para ver os comandos.'; }
    case 'responder': W.answer = r.join(' ').trim(); return 'Resposta registrada: ' + W.answer;
    case 'ssh-keygen': { const k = Math.random().toString(36).slice(2, 10); W.localKeys = [k]; return 'Generating public/private ed25519 key pair.\nYour identification has been saved in ~/.ssh/id_ed25519\nYour public key has been saved in ~/.ssh/id_ed25519.pub'; }
    case 'colega': {
      if (r[0] !== 'aprova') fail('uso: colega aprova [número do PR]  (simula a revisão de um colega)');
      const all = Object.values(W.gh).flatMap(R => R.prs.filter(p => p.state === 'open'));
      const p = r[1] ? all.find(x => x.n === +r[1]) : all.slice(-1)[0]; if (!p) fail('Nenhum PR aberto para o colega revisar.');
      return colegaAprova(p);
    }
    case 'git': return git(r);
    case 'gh': return gh(r);
    case 'npm': if (r[0] === 'test') { const L = needRepo(); const t = npmTest(L.files); W.flags.add('npm-test'); if (!t.ok) fail('✗ ' + t.why); return '✓ todos os testes passaram'; } return 'npm: no simulador só existe npm test';
    default: fail(c + ': comando não encontrado. Digite help para ver os comandos.');
  }
}

const HELP = `Comandos do simulador
Arquivos: ls, cat, echo "texto" > arq, echo "linha" >> arq, nano arq, touch, rm, mv
Git: init, config, status, add, commit, log, diff, show, blame, branch, switch, checkout,
     merge, rebase, restore, reset, revert, stash, cherry-pick, tag, remote, clone,
     fetch, pull, push, reflog, bisect
GitHub CLI: gh auth login, gh repo create|clone|fork|view|edit, gh pr create|list|view|merge|review,
     gh issue create|list|close, gh release create, gh ssh-key add, gh api
Outros: ssh-keygen -t ed25519, npm test, colega aprova, responder <valor>, explicar <comando>, clear
Encadeie comandos com && .

Não sabe o que um comando faz? Digite explicar <comando>, por exemplo: explicar git push`;

/* ---------- git ---------- */
function opt(r, ...names) { for (const n of names) { const i = r.indexOf(n); if (i >= 0) return r[i + 1]; } return undefined; }
function has(r, ...names) { return names.some(n => r.includes(n)); }
function curBranch(L) { return L.head.type === 'branch' ? L.head.name : null; }
function setHead(L, id, msg) {
  if (L.head.type === 'branch') L.branches[L.head.name] = id; else L.head.id = id;
  L.reflog.unshift({ id, msg });
}
function checkoutTree(L, tree) { L.files = Object.assign(Object.fromEntries(Object.entries(L.files).filter(([k]) => !tracked(k))), clone(tree)); L.index = clone(tree); }
function dirtyFiles(L) { const s = status(L); return [...s.staged.map(x => x[0]), ...s.unstaged.map(x => x[0])]; }

function doCommit(L, msg, parents, tree, opts) {
  const signed = cfg('commit.gpgsign') === 'true' && cfg('gpg.format') === 'ssh' && !!cfg('user.signingkey') && W.localKeys.length > 0;
  const id = mkCommit(msg, parents, tree, cfg('user.name'), { email: cfg('user.email'), signed, key: signed ? W.localKeys[0] : null });
  return id;
}

function git(r) {
  const [sub, ...a] = r;
  if (!sub) return 'uso: git <comando> [<args>]';
  if (sub === '--version' || sub === 'version') return 'git version 2.47.0 (simulador)';
  if (sub === 'init') {
    const name = a[0] || (W.local ? W.local.name : 'projeto');
    if (W.local && !a[0] && Object.keys(W.local.branches).length) return 'Repositório Git existente reinicializado';
    const L = newLocal(name);
    if (W.local && !a[0]) L.files = W.local.files;
    W.local = L; W.flags.add('init');
    return 'Repositório Git vazio inicializado em /home/aluno/' + name + '/.git/';
  }
  if (sub === 'config') {
    const g = has(a, '--global'); const args = a.filter(x => !x.startsWith('--'));
    if (has(a, '--list', '-l')) { const all = Object.assign({}, W.gconfig, W.local?.config || {}); return Object.entries(all).map(([k, v]) => k + '=' + v).join('\n') || '(vazio)'; }
    const [k, ...v] = args; if (!k) fail('uso: git config [--global] chave valor');
    if (!v.length) { const val = cfg(k); if (val === undefined) fail(''); return val; }
    if (g || !W.local) W.gconfig[k] = v.join(' '); else W.local.config[k] = v.join(' ');
    return '';
  }
  if (sub === 'clone') {
    const url = a.find(x => !x.startsWith('-')); if (!url) fail('uso: git clone <url>');
    const full = url.replace(/^(https:\/\/github\.com\/|git@github\.com:)/, '').replace(/\.git$/, '');
    if (!W.gh[full]) fail("fatal: repositório '" + url + "' não encontrado");
    if (W.gh[full].visibility === 'private' && W.gh[full].owner !== W.user && !W.gh[full].collaborators.includes(W.user)) fail('fatal: repositório não encontrado (é privado e você não tem acesso)');
    cloneInto(full); W.flags.add('clone:' + full);
    return "Clonando em '" + W.gh[full].name + "'...\nremote: Enumerating objects: done.\nRecebendo objetos: 100%, concluído.";
  }
  const L = needRepo();
  switch (sub) {
    case 'status': {
      const s = status(L), b = curBranch(L);
      let o = b ? 'No ramo ' + b : 'HEAD destacado em ' + short(L.head.id);
      if (L.bisect) o += '\nVocê está fazendo bisect.';
      if (b && L.upstream[b] && L.remoteRefs[L.upstream[b]]) {
        const loc = L.branches[b], rem = L.remoteRefs[L.upstream[b]];
        const ahead = [...ancestors(loc)].filter(x => !ancestors(rem).has(x)).length, behind = [...ancestors(rem)].filter(x => !ancestors(loc).has(x)).length;
        o += '\n' + (ahead && behind ? `Seu ramo e '${L.upstream[b]}' divergiram (${ahead} e ${behind} commits diferentes).` : ahead ? `Seu ramo está à frente de '${L.upstream[b]}' por ${ahead} commit(s). (use "git push")` : behind ? `Seu ramo está atrás de '${L.upstream[b]}' por ${behind} commit(s). (use "git pull")` : `Seu ramo está atualizado com '${L.upstream[b]}'.`);
      }
      if (!headId(L)) o += '\n\nAinda não há commits';
      if (L.merge || L.rebase) o += '\n\n' + (L.merge ? 'Você tem caminhos não mesclados (merge em andamento).\n  (corrija os conflitos, use "git add" e depois "git commit")' : 'Rebase em andamento.\n  (corrija os conflitos, "git add" e "git rebase --continue")');
      if (s.conflicted.length) o += '\n\nCaminhos não mesclados:\n' + s.conflicted.map(f => '\tmodificado por ambos: ' + f).join('\n');
      if (s.staged.length) o += '\n\nMudanças a serem submetidas:\n  (use "git restore --staged <arquivo>" para despreparar)\n' + s.staged.map(([f, t]) => '\t' + t + ': ' + f).join('\n');
      if (s.unstaged.length) o += '\n\nMudanças não preparadas para submissão:\n  (use "git add <arquivo>" para preparar)\n' + s.unstaged.map(([f, t]) => '\t' + t + ': ' + f).join('\n');
      if (s.untracked.length) o += '\n\nArquivos não monitorados:\n  (use "git add <arquivo>" para incluir)\n' + s.untracked.map(f => '\t' + f).join('\n');
      if (!s.staged.length && !s.unstaged.length && !s.untracked.length && !s.conflicted.length) o += '\n\nnada para submeter, árvore de trabalho limpa';
      return o;
    }
    case 'add': {
      if (!a.length) fail('Nada especificado, nada adicionado.\nDica: git add <arquivo> ou git add .');
      const all = has(a, '.', '-A', '--all');
      const targets = all ? new Set([...Object.keys(L.files), ...Object.keys(L.index)]) : new Set(a.filter(x => !x.startsWith('-')));
      let ign = [];
      targets.forEach(f => {
        if (!tracked(f)) return;
        if (!(f in L.files) && !(f in L.index)) fail("fatal: o caminho '" + f + "' não corresponde a nenhum arquivo");
        if (!(f in L.index) && ignored(L, f)) { if (!all) ign.push(f); return; }
        if (f in L.files) L.index[f] = L.files[f]; else delete L.index[f];
      });
      if (ign.length) return 'Os seguintes caminhos são ignorados pelo .gitignore:\n' + ign.join('\n') + '\nUse -f se quiser mesmo adicioná-los.';
      return '';
    }
    case 'rm': { const cached = has(a, '--cached'); a.filter(x => !x.startsWith('-')).forEach(f => { if (!(f in L.index)) fail("fatal: '" + f + "' não é monitorado"); delete L.index[f]; if (!cached) delete L.files[f]; }); return ''; }
    case 'commit': {
      if (!cfg('user.name') || !cfg('user.email')) fail('Diga-me quem você é.\n\nExecute\n  git config --global user.email "voce@exemplo.com"\n  git config --global user.name "Seu Nome"');
      let msg = opt(a, '-m', '--message');
      if (has(a, '-a', '-am')) { Object.keys(L.index).forEach(f => { if (f in L.files) L.index[f] = L.files[f]; else delete L.index[f]; }); if (a.includes('-am')) msg = a[a.indexOf('-am') + 1]; }
      const amend = has(a, '--amend');
      if (L.merge) {
        const s = status(L); if (s.conflicted.length) fail('error: não é possível fazer commit com arquivos não mesclados:\n' + s.conflicted.join('\n') + '\nCorrija, use git add e tente de novo.');
        if (Object.values(L.index).some(v => /^<{7} /m.test(v))) fail('Ainda há marcadores de conflito (<<<<<<<) em arquivos preparados. Edite-os antes do commit.');
        const id = doCommit(L, msg || L.merge.msg, [headId(L), L.merge.theirs], L.index);
        setHead(L, id, 'commit (merge): ' + (msg || L.merge.msg)); L.merge = null; W.flags.add('merge-commit');
        return `[${curBranch(L)} ${short(id)}] ${msg || W.obj[id].msg}`;
      }
      if (L.rebase) fail('Rebase em andamento: use git rebase --continue');
      if (!msg && !(amend && has(a, '--no-edit'))) fail('Abortando commit devido à mensagem vazia.\nUse: git commit -m "mensagem"');
      const hook = L.files['.git/hooks/pre-commit'];
      if (hook) {
        for (const line of hook.split('\n')) {
          const m = line.trim().match(/^proibir\s+(.+)$/); if (!m) continue;
          const word = m[1].replace(/^["']|["']$/g, '');
          const bad = Object.entries(L.index).find(([k, v]) => tracked(k) && v.includes(word) && (headTree(L)[k] !== v));
          if (bad) { W.flags.add('hook-blocked'); fail(`hook pre-commit: commit recusado — "${word}" encontrado em ${bad[0]}`); }
        }
      }
      if (amend) {
        const h = headId(L); if (!h) fail('fatal: não há commit para corrigir');
        const old = W.obj[h];
        const id = doCommit(L, msg || old.msg, old.parents, L.index);
        setHead(L, id, 'commit (amend): ' + (msg || old.msg)); W.flags.add('amend');
        return `[${curBranch(L) || 'HEAD destacado'} ${short(id)}] ${msg || old.msg}`;
      }
      if (sameTree(L.index, headTree(L)) && !has(a, '--allow-empty')) {
        const s = status(L);
        fail('No ramo ' + (curBranch(L) || '?') + '\n' + (s.unstaged.length || s.untracked.length ? 'nada adicionado ao commit, mas há arquivos modificados ou não monitorados (use "git add")' : 'nada para submeter, árvore de trabalho limpa'));
      }
      const first = !headId(L);
      const id = doCommit(L, msg, [headId(L)], L.index);
      setHead(L, id, (first ? 'commit (inicial): ' : 'commit: ') + msg);
      const n = Object.keys(L.index).filter(k => headTree(L) !== undefined).length;
      return `[${curBranch(L) || 'HEAD destacado'}${first ? ' (root-commit)' : ''} ${short(id)}] ${msg}` + (W.obj[id].signed ? '\n(commit assinado com chave SSH)' : '');
    }
    case 'log': {
      const all = has(a, '--all'), one = has(a, '--oneline'), graph = has(a, '--graph');
      const n = +(opt(a, '-n') || (a.find(x => /^-\d+$/.test(x)) || '').slice(1)) || 50;
      const fileArg = a.indexOf('--') >= 0 ? a[a.indexOf('--') + 1] : null;
      const startRev = a.find(x => !x.startsWith('-') && resolve(L, x));
      let seeds = all ? [...Object.values(L.branches), ...Object.values(L.remoteRefs), headId(L)] : [startRev ? resolve(L, startRev) : headId(L)];
      seeds = seeds.filter(Boolean); if (!seeds.length) fail("fatal: o ramo atual '" + (curBranch(L) || '') + "' ainda não tem commits");
      const set = new Set(); seeds.forEach(s => ancestors(s).forEach(x => set.add(x)));
      let list = [...set].map(x => W.obj[x]).sort((x, y) => y.t - x.t);
      if (fileArg) list = list.filter(c => (c.tree[fileArg] ?? null) !== ((c.parents[0] ? W.obj[c.parents[0]].tree[fileArg] : undefined) ?? null));
      list = list.slice(0, n);
      return list.map(c => {
        const dec = decor(L, c.id);
        if (one) return (graph ? '* ' : '') + short(c.id) + (dec ? ' (' + dec + ')' : '') + ' ' + c.msg;
        return 'commit ' + c.id + (dec ? ' (' + dec + ')' : '') + (c.parents.length > 1 ? '\nMerge: ' + c.parents.map(short).join(' ') : '') + '\nAutor: ' + c.author + (c.email ? ' <' + c.email + '>' : '') + (c.signed ? '\nAssinatura: chave SSH ' + (W.ghKeys.some(k => k.key === c.key && k.type === 'signing') ? '(Verified no GitHub)' : '(não cadastrada no GitHub)') : '') + '\n\n    ' + c.msg + '\n';
      }).join('\n');
    }
    case 'show': {
      const id = resolve(L, a[0] || 'HEAD'); if (!id) fail('fatal: revisão desconhecida: ' + a[0]);
      const c = W.obj[id], p = c.parents[0] ? W.obj[c.parents[0]].tree : {};
      return 'commit ' + c.id + '\nAutor: ' + c.author + '\n\n    ' + c.msg + '\n\n' + diffTrees(p, c.tree);
    }
    case 'diff': {
      if (has(a, '--staged', '--cached')) return diffTrees(headTree(L), L.index) || '';
      const revs = a.filter(x => !x.startsWith('-'));
      if (revs.length === 2) { const x = resolve(L, revs[0]), y = resolve(L, revs[1]); if (!x || !y) fail('fatal: revisão desconhecida'); return diffTrees(W.obj[x].tree, W.obj[y].tree); }
      if (revs.length === 1 && resolve(L, revs[0])) return diffTrees(W.obj[resolve(L, revs[0])].tree, wtTracked(L));
      return diffTrees(L.index, Object.fromEntries(Object.entries(L.files).filter(([k]) => k in L.index))) || '';
    }
    case 'blame': {
      const f = a.find(x => !x.startsWith('-')); const h = headId(L); if (!f || !h || W.obj[h].tree[f] === undefined) fail('fatal: o arquivo ' + (f || '') + ' não existe em HEAD');
      const chain = []; let x = h; while (x) { chain.unshift(x); x = W.obj[x].parents[0]; }
      return W.obj[h].tree[f].split('\n').map(line => {
        let who = chain[chain.length - 1];
        for (let i = chain.length - 1; i >= 0; i--) { const lines = (W.obj[chain[i]].tree[f] || '').split('\n'); if (lines.includes(line)) who = chain[i]; else break; }
        const c = W.obj[who]; return short(c.id) + ' (' + c.author.padEnd(14) + ') ' + line;
      }).join('\n');
    }
    case 'branch': {
      if (has(a, '-d', '-D')) {
        const b = a.find(x => !x.startsWith('-')); if (!L.branches[b]) fail("error: ramo '" + b + "' não encontrado");
        if (b === curBranch(L)) fail("error: não é possível apagar o ramo '" + b + "' em uso");
        if (a.includes('-d') && !isAnc(L.branches[b], headId(L)) && !Object.values(L.remoteRefs).some(t => isAnc(L.branches[b], t))) fail("error: o ramo '" + b + "' não foi totalmente mesclado. Use -D para forçar.");
        delete L.branches[b]; return 'Ramo ' + b + ' apagado.';
      }
      if (has(a, '-m')) { const [o, n] = a.filter(x => !x.startsWith('-')).length === 2 ? a.filter(x => !x.startsWith('-')) : [curBranch(L), a.filter(x => !x.startsWith('-'))[0]]; L.branches[n] = L.branches[o]; delete L.branches[o]; if (curBranch(L) === o) L.head.name = n; if (L.upstream[o]) { L.upstream[n] = L.upstream[o]; delete L.upstream[o]; } return ''; }
      const names = a.filter(x => !x.startsWith('-'));
      if (!names.length) {
        let o = Object.keys(L.branches).sort().map(b => (b === curBranch(L) ? '* ' : '  ') + b);
        if (!curBranch(L)) o.unshift('* (HEAD destacado em ' + short(L.head.id) + ')');
        if (has(a, '-a', '-r')) o = (a.includes('-r') ? [] : o).concat(Object.keys(L.remoteRefs).sort().map(x => '  remotes/' + x));
        return o.join('\n');
      }
      if (!headId(L)) fail("fatal: não é um nome de objeto válido: 'main' (faça o primeiro commit)");
      if (L.branches[names[0]]) fail("fatal: o ramo '" + names[0] + "' já existe");
      L.branches[names[0]] = names[1] ? resolve(L, names[1]) : headId(L); return '';
    }
    case 'switch': case 'checkout': {
      if (sub === 'checkout' && a[0] === '--') { a.slice(1).forEach(f => { if (!(f in L.index)) fail('erro: ' + f + ' não está no índice'); L.files[f] = L.index[f]; }); return ''; }
      const create = has(a, '-b', '-c', '-B'); const names = a.filter(x => !x.startsWith('-'));
      let target = names[0]; if (!target) fail('uso: git ' + sub + ' <ramo>');
      if (target === '-') { const prev = L.reflog.find(e => /moving from (\S+) to/.test(e.msg)); target = prev ? prev.msg.match(/moving from (\S+) to/)[1] : target; }
      if (create) {
        if (L.branches[target] && !a.includes('-B')) fail("fatal: já existe um ramo chamado '" + target + "'");
        const start = names[1] ? resolve(L, names[1]) : headId(L);
        if (!start && headId(L)) fail('fatal: ponto de partida inválido');
        const from = curBranch(L) || short(headId(L));
        if (start) L.branches[target] = start;
        if (names[1] && L.remoteRefs[names[1]]) L.upstream[target] = names[1];
        if (start && start !== headId(L)) { if (dirtyFiles(L).length) fail('error: suas alterações locais seriam sobrescritas. Faça commit ou stash antes.'); checkoutTree(L, W.obj[start].tree); }
        L.head = { type: 'branch', name: target }; L.reflog.unshift({ id: start, msg: 'checkout: moving from ' + from + ' to ' + target });
        return "Mudou para o novo ramo '" + target + "'";
      }
      if (sub === 'checkout' && !L.branches[target] && !resolve(L, target) && (target in L.index || target in L.files)) { names.forEach(f => L.files[f] = L.index[f]); return 'Atualizado 1 caminho a partir do índice'; }
      let id, branch = null;
      if (L.branches[target]) { id = L.branches[target]; branch = target; }
      else if (L.remoteRefs['origin/' + target]) { id = L.remoteRefs['origin/' + target]; L.branches[target] = id; L.upstream[target] = 'origin/' + target; branch = target; }
      else { id = resolve(L, target); if (!id) fail("erro: a especificação de caminho '" + target + "' não corresponde a nenhum arquivo conhecido pelo git"); if (sub === 'switch' && !has(a, '--detach')) fail('fatal: um ramo é esperado; use --detach para ir a um commit'); }
      const dirty = dirtyFiles(L), T = W.obj[id].tree, H = headTree(L);
      const clash = dirty.filter(f => T[f] !== H[f]);
      if (clash.length) fail('error: Suas alterações locais nos arquivos a seguir seriam sobrescritas pelo checkout:\n\t' + clash.join('\n\t') + '\nFaça commit ou stash das alterações antes de trocar de ramo.');
      const keepW = {}, keepI = {}; dirty.forEach(f => { if (f in L.files) keepW[f] = L.files[f]; if (f in L.index) keepI[f] = L.index[f]; });
      const st = status(L).untracked; const keepU = {}; st.forEach(f => keepU[f] = L.files[f]);
      const from = curBranch(L) || short(headId(L));
      checkoutTree(L, T); Object.assign(L.files, keepW, keepU); Object.assign(L.index, keepI);
      L.head = branch ? { type: 'branch', name: branch } : { type: 'detached', id };
      L.reflog.unshift({ id, msg: 'checkout: moving from ' + from + ' to ' + target });
      return branch ? "Mudou para o ramo '" + branch + "'" : "Nota: mudando para '" + target + "'.\nVocê está em 'HEAD destacado'. Pode olhar e experimentar; para manter mudanças crie um ramo com git switch -c <nome>.\nHEAD agora está em " + short(id) + ' ' + W.obj[id].msg;
    }
    case 'merge': {
      if (has(a, '--abort')) { if (!L.merge) fail('fatal: não há merge para abortar'); checkoutTree(L, headTree(L)); L.merge = null; return 'Merge abortado.'; }
      if (L.merge) fail('error: merge em andamento. Resolva os conflitos ou use git merge --abort');
      const name = a.find(x => !x.startsWith('-')); const theirs = resolve(L, name); if (!theirs) fail('merge: ' + name + ' - não é algo que possamos mesclar');
      return doMerge(L, theirs, name, has(a, '--no-ff'), opt(a, '-m'));
    }
    case 'rebase': return doRebase(L, a);
    case 'restore': {
      const staged = has(a, '--staged', '-S'); const src = opt(a, '--source', '-s');
      const files = a.filter((x, i) => !x.startsWith('-') && a[i - 1] !== '--source' && a[i - 1] !== '-s');
      if (!files.length) fail('fatal: você deve informar caminho(s) para restaurar');
      const H = src ? W.obj[resolve(L, src)].tree : headTree(L);
      (files[0] === '.' ? Object.keys({ ...L.files, ...L.index }) : files).forEach(f => {
        if (staged) { if (f in H) L.index[f] = H[f]; else delete L.index[f]; }
        else if (src) { if (f in H) L.files[f] = H[f]; else delete L.files[f]; }
        else { if (!(f in L.index)) { if (files[0] !== '.') fail("erro: a especificação de caminho '" + f + "' não corresponde a nenhum arquivo conhecido pelo git"); return; } L.files[f] = L.index[f]; }
      });
      W.flags.add(staged ? 'restore-staged' : 'restore'); return '';
    }
    case 'reset': {
      const mode = has(a, '--hard') ? 'hard' : has(a, '--soft') ? 'soft' : 'mixed';
      const args = a.filter(x => !x.startsWith('-'));
      if (args.length && !resolve(L, args[0]) && (args[0] in L.index || args[0] in headTree(L))) { args.forEach(f => { const H = headTree(L); if (f in H) L.index[f] = H[f]; else delete L.index[f]; }); return 'Mudanças despreparadas após o reset:\n' + args.join('\n'); }
      const id = resolve(L, args[0] || 'HEAD'); if (!id) fail("fatal: argumento ambíguo '" + args[0] + "': revisão desconhecida");
      setHead(L, id, 'reset: moving to ' + (args[0] || 'HEAD'));
      if (mode !== 'soft') L.index = clone(W.obj[id].tree);
      if (mode === 'hard') { checkoutTree(L, W.obj[id].tree); L.merge = null; }
      W.flags.add('reset-' + mode);
      return mode === 'hard' ? 'HEAD agora está em ' + short(id) + ' ' + W.obj[id].msg : '';
    }
    case 'revert': {
      if (dirtyFiles(L).length) fail('error: suas alterações locais seriam sobrescritas pelo revert.');
      const id = resolve(L, a.find(x => !x.startsWith('-')) || 'HEAD'); if (!id) fail('fatal: revisão inválida');
      const c = W.obj[id]; const parent = c.parents[0] ? W.obj[c.parents[0]].tree : {};
      const m = merge3(c.tree, headTree(L), parent, 'HEAD', 'revert');
      if (m.conflicts.length) { L.files = Object.assign({}, L.files, m.tree); L.merge = { theirs: headId(L), msg: 'Revert "' + c.msg + '"', conflicts: m.conflicts }; fail('error: não foi possível reverter ' + short(id) + ' — conflito em ' + m.conflicts.join(', ')); }
      checkoutTree(L, m.tree); const nid = doCommit(L, 'Revert "' + c.msg + '"', [headId(L)], m.tree); setHead(L, nid, 'revert: ' + c.msg); W.flags.add('revert');
      return `[${curBranch(L)} ${short(nid)}] Revert "${c.msg}"`;
    }
    case 'cherry-pick': {
      if (dirtyFiles(L).length) fail('error: suas alterações locais seriam sobrescritas pelo cherry-pick. Faça commit ou stash.');
      const id = resolve(L, a[0]); if (!id) fail('fatal: revisão inválida: ' + a[0]);
      const c = W.obj[id]; const parent = c.parents[0] ? W.obj[c.parents[0]].tree : {};
      const m = merge3(parent, headTree(L), c.tree, 'HEAD', short(id));
      if (m.conflicts.length) { L.files = Object.assign({}, L.files, m.tree); L.merge = { theirs: headId(L), msg: c.msg, conflicts: m.conflicts, single: true }; fail('error: conflito ao aplicar ' + short(id) + ' em ' + m.conflicts.join(', ')); }
      checkoutTree(L, m.tree); const nid = doCommit(L, c.msg, [headId(L)], m.tree); setHead(L, nid, 'cherry-pick: ' + c.msg); W.flags.add('cherry-pick');
      return `[${curBranch(L)} ${short(nid)}] ${c.msg}`;
    }
    case 'stash': {
      const op = a[0] && !a[0].startsWith('-') ? a[0] : 'push';
      if (op === 'push' || op === 'save') {
        const s = status(L); const inclU = has(a, '-u', '--include-untracked');
        if (!s.staged.length && !s.unstaged.length && !(inclU && s.untracked.length)) return 'Não há mudanças locais para salvar';
        const w = Object.fromEntries(Object.entries(L.files).filter(([k]) => tracked(k) && (k in L.index || (inclU && !ignored(L, k)))));
        L.stash.unshift({ base: headId(L), work: w, msg: 'WIP em ' + (curBranch(L) || 'HEAD') + ': ' + (W.obj[headId(L)]?.msg || '') });
        const keep = Object.fromEntries(Object.entries(L.files).filter(([k]) => !(k in w)));
        checkoutTree(L, headTree(L)); Object.assign(L.files, keep); W.flags.add('stash');
        return 'Diretório de trabalho salvo: ' + L.stash[0].msg;
      }
      if (op === 'list') return L.stash.map((s, i) => 'stash@{' + i + '}: ' + s.msg).join('\n');
      if (op === 'drop') { if (!L.stash.length) fail('Nenhum stash encontrado.'); L.stash.shift(); return 'stash@{0} descartado'; }
      if (op === 'pop' || op === 'apply') {
        if (!L.stash.length) fail('Nenhum stash encontrado.');
        const s = L.stash[0]; const base = s.base ? W.obj[s.base].tree : {};
        const m = merge3(base, wtTracked(L), s.work, 'atualizado', 'stash');
        if (m.conflicts.length) { L.files = Object.assign({}, L.files, m.tree); fail('CONFLITO ao aplicar o stash em ' + m.conflicts.join(', ') + '. O stash foi mantido.'); }
        Object.assign(L.files, m.tree); if (op === 'pop') L.stash.shift(); W.flags.add('stash-pop');
        return 'Mudanças do stash aplicadas.' + (op === 'pop' ? ' Descartado stash@{0}.' : '');
      }
      fail('git stash: subcomando desconhecido ' + op);
    }
    case 'tag': {
      const names = a.filter(x => !x.startsWith('-')); const msgIdx = a.indexOf('-m'); const real = names.filter(x => msgIdx < 0 || x !== a[msgIdx + 1]);
      if (has(a, '-d')) { delete L.tags[real[0]]; return "Tag '" + real[0] + "' apagada"; }
      if (!real.length) return Object.keys(L.tags).sort().join('\n');
      if (L.tags[real[0]]) fail("fatal: tag '" + real[0] + "' já existe");
      L.tags[real[0]] = real[1] ? resolve(L, real[1]) : headId(L); W.flags.add('tag'); return '';
    }
    case 'remote': {
      if (!a.length) return Object.keys(L.remotes).join('\n');
      if (a[0] === '-v') return Object.entries(L.remotes).map(([n, u]) => n + '\thttps://github.com/' + u + '.git (fetch)\n' + n + '\thttps://github.com/' + u + '.git (push)').join('\n');
      if (a[0] === 'add') {
        const [, n, url] = a; if (!n || !url) fail('uso: git remote add <nome> <url>'); if (L.remotes[n]) fail('error: o remoto ' + n + ' já existe');
        L.remotes[n] = url.replace(/^(https:\/\/github\.com\/|git@github\.com:)/, '').replace(/\.git$/, ''); W.flags.add('remote-add:' + n); return '';
      }
      if (a[0] === 'remove' || a[0] === 'rm') { delete L.remotes[a[1]]; Object.keys(L.remoteRefs).forEach(k => { if (k.startsWith(a[1] + '/')) delete L.remoteRefs[k]; }); return ''; }
      if (a[0] === 'set-url') { L.remotes[a[1]] = a[2].replace(/^(https:\/\/github\.com\/|git@github\.com:)/, '').replace(/\.git$/, ''); return ''; }
      fail('git remote: subcomando desconhecido');
    }
    case 'fetch': {
      const names = has(a, '--all') ? Object.keys(L.remotes) : [a.find(x => !x.startsWith('-')) || 'origin'];
      let o = [];
      names.forEach(n => {
        const full = L.remotes[n]; if (!full) fail("fatal: '" + n + "' não parece ser um repositório git");
        const R = W.gh[full]; if (!R) fail('fatal: repositório não encontrado');
        Object.entries(R.branches).forEach(([b, id]) => { if (L.remoteRefs[n + '/' + b] !== id) o.push('   ' + short(L.remoteRefs[n + '/' + b] || '') + '..' + short(id) + '  ' + b + ' -> ' + n + '/' + b); L.remoteRefs[n + '/' + b] = id; });
        W.flags.add('fetch:' + n);
      });
      return o.length ? 'De https://github.com/' + L.remotes[names[0]] + '\n' + o.join('\n') : '';
    }
    case 'pull': {
      const b = curBranch(L); if (!b) fail('Você não está em um ramo.');
      const remote = a.find(x => !x.startsWith('-')) || (L.upstream[b] ? L.upstream[b].split('/')[0] : 'origin');
      const rb = a.filter(x => !x.startsWith('-'))[1] || (L.upstream[b] ? L.upstream[b].split('/').slice(1).join('/') : b);
      if (!L.remotes[remote]) fail("fatal: '" + remote + "' não parece ser um repositório git");
      git(['fetch', remote]);
      const ref = remote + '/' + rb; const theirs = L.remoteRefs[ref]; if (!theirs) fail('fatal: não foi possível encontrar a ref remota ' + rb);
      W.flags.add('pull');
      if (has(a, '--rebase')) return doRebase(L, [ref]);
      return doMerge(L, theirs, ref, false, "Merge branch '" + rb + "' of github.com:" + L.remotes[remote]);
    }
    case 'push': return doPush(L, a);
    case 'reflog': return L.reflog.slice(0, 30).map((e, i) => short(e.id) + ' HEAD@{' + i + '}: ' + e.msg).join('\n');
    case 'bisect': return doBisect(L, a);
    case 'worktree': {
      if (a[0] === 'list') return '/home/aluno/' + L.name + '  ' + short(headId(L)) + ' [' + (curBranch(L) || 'destacado') + ']' + (L.worktrees || []).map(w => '\n/home/aluno/' + w.path + '  ' + short(L.branches[w.branch]) + ' [' + w.branch + ']').join('');
      if (a[0] === 'add') {
        const nb = opt(a, '-b'); const rest = a.slice(1).filter((x, i, arr) => !x.startsWith('-') && arr[i - 1] !== '-b');
        const path = rest[0], br = nb || rest[1]; if (!path || !br) fail('uso: git worktree add <pasta> <ramo> | git worktree add -b <novo> <pasta>');
        if (nb) L.branches[nb] = headId(L); else if (!L.branches[br]) fail('fatal: ramo inválido: ' + br);
        if (br === curBranch(L)) fail("fatal: '" + br + "' já está em uso nesta árvore de trabalho");
        L.worktrees = (L.worktrees || []).concat([{ path: path.replace(/^\.\.\//, ''), branch: br }]); W.flags.add('worktree');
        return "Preparando a árvore de trabalho (ramo '" + br + "') em " + path;
      }
      if (a[0] === 'remove') { L.worktrees = (L.worktrees || []).filter(w => w.path !== a[1].replace(/^\.\.\//, '')); return ''; }
      fail('git worktree: use add, list ou remove');
    }
    case 'cat-file': {
      const id = resolve(L, a.find(x => !x.startsWith('-'))); if (!id) fail('fatal: nome de objeto inválido');
      const c = W.obj[id]; W.flags.add('cat-file');
      if (has(a, '-t')) return 'commit';
      return 'tree ' + id.split('').reverse().join('').slice(0, 40) + '\n' + c.parents.map(p => 'parent ' + p).join('\n') + (c.parents.length ? '\n' : '') + 'author ' + c.author + ' <' + (c.email || 'sem-email') + '>\n\n' + c.msg + '\n\n(arquivos na árvore: ' + Object.keys(c.tree).join(', ') + ')';
    }
    case 'submodule': {
      if (a[0] === 'add') { const url = a[1]; const full = (url || '').replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, ''); if (!W.gh[full]) fail('fatal: repositório não encontrado'); const p = a[2] || W.gh[full].name; L.files['.gitmodules'] = '[submodule "' + p + '"]\n\tpath = ' + p + '\n\turl = https://github.com/' + full + '.git'; L.files[p + '/.submodule'] = 'Submódulo em ' + short(W.gh[full].branches[W.gh[full].def]) + ' de ' + full; L.index['.gitmodules'] = L.files['.gitmodules']; L.index[p + '/.submodule'] = L.files[p + '/.submodule']; W.flags.add('submodule'); return "Clonando em '/home/aluno/" + L.name + '/' + p + "'..."; }
      if (a[0] === 'update' || a[0] === 'status') return 'Submódulos sincronizados.';
      fail('git submodule: use add, status ou update');
    }
    case 'help': return HELP;
    default: fail("git: '" + sub + "' não é um comando git (ou não existe no simulador). Veja 'help'.");
  }
}
function wtTracked(L) { return Object.fromEntries(Object.entries(L.files).filter(([k]) => tracked(k) && (k in L.index || !ignored(L, k)))); }
function decor(L, id) {
  const d = [];
  if (headId(L) === id) d.push(L.head.type === 'branch' ? 'HEAD -> ' + L.head.name : 'HEAD');
  Object.entries(L.branches).forEach(([b, x]) => { if (x === id && !(L.head.type === 'branch' && L.head.name === b)) d.push(b); });
  Object.entries(L.remoteRefs).forEach(([b, x]) => { if (x === id) d.push(b); });
  Object.entries(L.tags).forEach(([b, x]) => { if (x === id) d.push('tag: ' + b); });
  return d.join(', ');
}
function diffTrees(A, B) {
  const out = [];
  new Set([...Object.keys(A || {}), ...Object.keys(B || {})]).forEach(k => {
    if (!tracked(k) || A[k] === B[k]) return;
    const al = A[k] === undefined ? [] : A[k].split('\n'), bl = B[k] === undefined ? [] : B[k].split('\n');
    out.push('diff --git a/' + k + ' b/' + k + (A[k] === undefined ? '\nnovo arquivo' : B[k] === undefined ? '\narquivo apagado' : ''));
    al.filter(x => !bl.includes(x)).forEach(x => out.push('-' + x));
    bl.filter(x => !al.includes(x)).forEach(x => out.push('+' + x));
  });
  return out.join('\n');
}
function doMerge(L, theirs, name, noff, msg) {
  const ours = headId(L);
  if (!ours) { L.branches[curBranch(L)] = theirs; checkoutTree(L, W.obj[theirs].tree); return 'Fast-forward'; }
  if (isAnc(theirs, ours)) return 'Já está atualizado.';
  const clash = dirtyFiles(L);
  if (clash.length) fail('error: Suas alterações locais seriam sobrescritas pelo merge:\n\t' + clash.join('\n\t') + '\nFaça commit ou stash antes.');
  if (isAnc(ours, theirs) && !noff) {
    setHead(L, theirs, 'merge ' + name + ': Fast-forward'); checkoutTree(L, W.obj[theirs].tree); W.flags.add('ff');
    return 'Atualizando ' + short(ours) + '..' + short(theirs) + '\nFast-forward\n' + diffStat(W.obj[ours].tree, W.obj[theirs].tree);
  }
  const base = mergeBase(ours, theirs);
  const m = merge3(base ? W.obj[base].tree : {}, W.obj[ours].tree, W.obj[theirs].tree, 'HEAD', name);
  msg = msg || "Merge branch '" + name + "'" + (curBranch(L) && curBranch(L) !== 'main' ? " into " + curBranch(L) : '');
  if (m.conflicts.length) {
    const clean = Object.fromEntries(Object.entries(m.tree).filter(([k]) => !m.conflicts.includes(k)));
    L.index = clean; m.conflicts.forEach(k => { if (k in W.obj[ours].tree) L.index[k] = W.obj[ours].tree[k]; });
    L.files = Object.assign(Object.fromEntries(Object.entries(L.files).filter(([k]) => !tracked(k))), m.tree);
    L.merge = { theirs, msg, conflicts: m.conflicts }; W.flags.add('conflict');
    fail(m.conflicts.map(f => 'CONFLITO (conteúdo): conflito de merge em ' + f).join('\n') + '\nMerge automático falhou; corrija os conflitos e faça commit do resultado.\nDica: abra o arquivo (nano ' + m.conflicts[0] + '), apague os marcadores <<<<<<< ======= >>>>>>>, depois git add e git commit.');
  }
  checkoutTree(L, m.tree); const id = doCommit(L, msg, [ours, theirs], m.tree); setHead(L, id, 'merge ' + name + ': Merge made by the ort strategy.'); W.flags.add('merge-commit');
  return "Merge made by the 'ort' strategy.\n" + diffStat(W.obj[ours].tree, m.tree);
}
function diffStat(A, B) { const ch = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(k => A[k] !== B[k]); return ch.map(k => ' ' + k + ' | ' + (A[k] === undefined ? 'novo' : B[k] === undefined ? 'apagado' : 'alterado')).join('\n') + '\n ' + ch.length + ' arquivo(s) alterado(s)'; }

function doRebase(L, a) {
  if (has(a, '--abort')) { if (!L.rebase) fail('Nenhum rebase em andamento.'); L.branches[L.rebase.branch] = L.rebase.orig; L.head = { type: 'branch', name: L.rebase.branch }; checkoutTree(L, W.obj[L.rebase.orig].tree); L.rebase = null; return 'Rebase abortado.'; }
  if (has(a, '--continue')) {
    if (!L.rebase) fail('Nenhum rebase em andamento.');
    const s = status(L); if (s.conflicted.length) fail('Você ainda tem conflitos em: ' + s.conflicted.join(', '));
    if (Object.values(L.index).some(v => /^<{7} /m.test(v))) fail('Ainda há marcadores de conflito em arquivos preparados.');
    const c = W.obj[L.rebase.cur];
    const nid = doCommit(L, c.msg, [L.rebase.tip], L.index); L.rebase.tip = nid; L.rebase.conflicts = null;
    return continueRebase(L);
  }
  if (has(a, '-i', '--interactive')) fail('O rebase interativo abre um editor de texto que o simulador não tem.\nPara juntar (squash) os últimos N commits use:\n  git reset --soft HEAD~N && git commit -m "mensagem única"');
  const b = curBranch(L); if (!b) fail('Você precisa estar em um ramo para fazer rebase.');
  if (dirtyFiles(L).length) fail('error: não é possível fazer rebase: você tem alterações não submetidas. Faça commit ou stash.');
  const ontoName = a.find(x => !x.startsWith('-')); const onto = resolve(L, ontoName); if (!onto) fail('fatal: upstream inválido ' + ontoName);
  const ours = headId(L); if (isAnc(ours, onto)) { setHead(L, onto, 'rebase: fast-forward'); checkoutTree(L, W.obj[onto].tree); return 'Fast-forward: ' + b + ' agora aponta para ' + short(onto); }
  if (isAnc(onto, ours)) return 'O ramo atual ' + b + ' já está atualizado.';
  const A = ancestors(onto); const todo = []; let x = ours;
  while (x && !A.has(x)) { todo.unshift(x); x = W.obj[x].parents[0]; }
  L.rebase = { branch: b, orig: ours, tip: onto, todo, cur: null, conflicts: null, ontoName };
  L.reflog.unshift({ id: onto, msg: 'rebase (start): checkout ' + ontoName });
  W.flags.add('rebase');
  return continueRebase(L);
}
function continueRebase(L) {
  const R = L.rebase;
  while (R.todo.length) {
    const id = R.todo.shift(); const c = W.obj[id]; R.cur = id;
    const parent = c.parents[0] ? W.obj[c.parents[0]].tree : {};
    const m = merge3(parent, W.obj[R.tip].tree, c.tree, 'HEAD', short(id) + ' (' + c.msg + ')');
    if (m.conflicts.length) {
      L.head = { type: 'detached', id: R.tip }; L.index = Object.fromEntries(Object.entries(m.tree).filter(([k]) => !m.conflicts.includes(k)));
      m.conflicts.forEach(k => { if (k in W.obj[R.tip].tree) L.index[k] = W.obj[R.tip].tree[k]; });
      L.files = Object.assign(Object.fromEntries(Object.entries(L.files).filter(([k]) => !tracked(k))), m.tree); R.conflicts = m.conflicts; W.flags.add('conflict');
      fail('CONFLITO (conteúdo): conflito de merge em ' + m.conflicts.join(', ') + '\nerror: não foi possível aplicar ' + short(id) + ' ' + c.msg + '\nResolva, use git add e git rebase --continue (ou git rebase --abort).');
    }
    if (sameTree(m.tree, W.obj[R.tip].tree)) continue;
    R.tip = doCommit(L, c.msg, [R.tip], m.tree);
  }
  L.branches[R.branch] = R.tip; L.head = { type: 'branch', name: R.branch }; checkoutTree(L, W.obj[R.tip].tree);
  L.reflog.unshift({ id: R.tip, msg: 'rebase (finish): refs/heads/' + R.branch + ' onto ' + R.ontoName });
  L.rebase = null; W.flags.add('rebase-done');
  return 'Rebase e atualização de refs/heads/' + R.branch + ' concluídos com sucesso.';
}

function doBisect(L, a) {
  const op = a[0];
  if (op === 'start') { L.bisect = { orig: curBranch(L) || headId(L), bad: null, good: [], steps: 0 }; return 'Bisect iniciado. Marque um commit ruim (git bisect bad) e um bom (git bisect good <commit>).'; }
  const B = L.bisect; if (!B) fail('Você não está fazendo bisect. Use git bisect start');
  if (op === 'reset') {
    const o = B.orig; L.bisect = null; const id = L.branches[o] ? L.branches[o] : o;
    checkoutTree(L, W.obj[id].tree); L.head = L.branches[o] ? { type: 'branch', name: o } : { type: 'detached', id }; W.flags.add('bisect-reset');
    return 'Bisect encerrado. Voltou para ' + (L.branches[o] ? "o ramo '" + o + "'" : short(id)) + '.';
  }
  if (op === 'bad' || op === 'good') {
    const id = resolve(L, a[1] || 'HEAD'); if (!id) fail('revisão inválida');
    if (op === 'bad') B.bad = id; else B.good.push(id);
    B.steps++;
    if (!B.bad || !B.good.length) return op === 'bad' ? 'Ok, agora marque um commit bom: git bisect good <commit>' : 'Ok, agora marque o commit ruim: git bisect bad [commit]';
    const G = new Set(); B.good.forEach(g => ancestors(g).forEach(x => G.add(x)));
    const cand = []; let x = B.bad; while (x && !G.has(x)) { cand.unshift(x); x = W.obj[x].parents[0]; }
    if (cand.length === 1) { B.found = cand[0]; W.flags.add('bisect-found:' + cand[0]); const c = W.obj[cand[0]]; return short(c.id) + ' é o primeiro commit ruim\nAutor: ' + c.author + '\n\n    ' + c.msg + '\n\n' + diffTrees(c.parents[0] ? W.obj[c.parents[0]].tree : {}, c.tree) + '\n\nUse git bisect reset para voltar.'; }
    const mid = cand[Math.floor((cand.length - 1) / 2)];
    checkoutTree(L, W.obj[mid].tree); L.head = { type: 'detached', id: mid };
    const left = cand.length - 1; return `Bisect: ${Math.max(0, Math.floor(left / 2))} revisões restantes depois desta (cerca de ${Math.ceil(Math.log2(left + 1))} passos)\n[${short(mid)}] ${W.obj[mid].msg}\nTeste este commit (ex.: cat ou npm test) e responda git bisect good ou git bisect bad.`;
  }
  if (op === 'run') {
    if (!B.bad || !B.good.length) fail('Marque antes um commit bom e um ruim.');
    const outs = []; let guard = 0;
    while (!B.found && guard++ < 20) { const t = npmTest(L.files); outs.push((t.ok ? 'good ' : 'bad ') + short(headId(L)) + '  (npm test ' + (t.ok ? 'passou' : 'falhou') + ')'); outs.push(doBisect(L, [t.ok ? 'good' : 'bad'])); }
    W.flags.add('bisect-run'); return outs.join('\n');
  }
  if (op === 'log') return 'bad: ' + short(B.bad) + '\ngood: ' + B.good.map(short).join(', ');
  fail('git bisect: use start, bad, good, reset');
}

function doPush(L, a) {
  if (!W.auth && !W.ghKeys.some(k => k.type === 'auth')) fail('remote: Support for password authentication was removed.\nfatal: Falha na autenticação.\nDica: autentique com gh auth login ou cadastre uma chave SSH (ssh-keygen + gh ssh-key add).');
  const force = has(a, '--force', '-f', '--force-with-lease');
  const setUp = has(a, '-u', '--set-upstream');
  const args = a.filter(x => !x.startsWith('-'));
  const b = curBranch(L);
  let remote = args[0] || (b && L.upstream[b] ? L.upstream[b].split('/')[0] : 'origin');
  if (!L.remotes[remote]) fail("fatal: '" + remote + "' não parece ser um repositório git\nDica: git remote add origin https://github.com/" + W.user + '/' + L.name + '.git');
  const R = W.gh[L.remotes[remote]]; if (!R) fail('remote: Repositório não encontrado. Crie-o antes (gh repo create).');
  if (R.owner !== W.user && !R.collaborators.includes(W.user)) fail('remote: Permissão negada para ' + W.user + ' em ' + R.full + '.\nDica: faça um fork (gh repo fork) e envie para o seu fork.');
  if (has(a, '--tags')) { Object.entries(L.tags).forEach(([t, id]) => R.tags[t] = id); W.flags.add('push-tags'); return 'Para https://github.com/' + R.full + '.git\n' + Object.keys(L.tags).map(t => ' * [nova tag]  ' + t + ' -> ' + t).join('\n'); }
  let refs = args.slice(1);
  if (!refs.length) { if (!b) fail('fatal: você não está em um ramo'); if (!L.upstream[b] && !setUp) fail('fatal: O ramo atual ' + b + ' não tem um ramo upstream.\nPara enviar e definir o remoto como upstream, use\n\n    git push --set-upstream ' + remote + ' ' + b); refs = [L.upstream[b] ? L.upstream[b].split('/').slice(1).join('/') : b]; }
  const out = ['Para https://github.com/' + R.full + '.git'];
  for (let ref of refs) {
    let [src, dst] = ref.includes(':') ? ref.split(':') : [ref, ref];
    if (L.tags[src] && !L.branches[src]) { R.tags[dst] = L.tags[src]; W.flags.add('push-tag:' + src); out.push(' * [nova tag]         ' + src + ' -> ' + dst); continue; }
    if (src === 'HEAD') src = b;
    const id = resolve(L, src); if (!id) fail('error: src refspec ' + src + ' não corresponde a nenhum ramo');
    const cur = R.branches[dst];
    if (cur && !isAnc(cur, id) && !force) { W.flags.add('push-rejected-ff'); fail(out[0] + '\n ! [rejeitado]        ' + src + ' -> ' + dst + ' (fetch first)\nerror: falha ao enviar algumas referências\nDica: o remoto tem commits que você não tem localmente. Integre com git pull antes de enviar.'); }
    if (R.protect && dst === R.def && (R.owner === W.user || R.collaborators.includes(W.user)) && R.visibility === 'public') { W.flags.add('push-rejected-protect'); fail(out[0] + '\nremote: error: GH006: Protected branch update failed for refs/heads/' + dst + '.\nremote: Mudanças precisam ser feitas por pull request.\n ! [remote rejected] ' + src + ' -> ' + dst + ' (protected branch hook declined)\nDica: crie um ramo, envie e abra um PR (gh pr create).'); }
    const fresh = [...ancestors(id)].filter(x => !ancestors(cur).has(x));
    if (R.pushProtection && R.visibility === 'public') {
      for (const cid of fresh) { const c = W.obj[cid]; const hit = Object.entries(c.tree).find(([k, v]) => SECRET_RE.test(v) && !(c.parents[0] && W.obj[c.parents[0]].tree[k] === v && !fresh.includes(c.parents[0]) && false)); if (hit) { W.flags.add('push-blocked-secret'); fail(out[0] + '\nremote: error: GH013: Repository rule violations found for refs/heads/' + dst + '.\nremote: — Push Protection: segredo detectado —\nremote:   commit: ' + short(cid) + '  arquivo: ' + hit[0] + '\nremote: Remova o segredo do HISTÓRICO (não basta apagar em um commit novo).\n ! [remote rejected] ' + src + ' -> ' + dst + ' (push declined due to secret)'); } }
    }
    if (cur && !isAnc(cur, id) && force) W.flags.add('force-push');
    R.branches[dst] = id; L.remoteRefs[remote + '/' + dst] = id;
    if (setUp && L.branches[src]) L.upstream[src] = remote + '/' + dst;
    out.push(cur ? (cur === id ? ' = [atualizado]  ' + src + ' -> ' + dst : '   ' + short(cur) + '..' + short(id) + '  ' + src + ' -> ' + dst) : ' * [novo ramo]      ' + src + ' -> ' + dst);
    if (setUp) out.push("Ramo '" + src + "' configurado para acompanhar '" + remote + '/' + dst + "'.");
    W.flags.add('push:' + R.full + ':' + dst);
    onRemoteUpdate(R, dst, 'push');
  }
  return out.join('\n');
}

/* ---------- GitHub: CI, segurança, PRs ---------- */
function workflows(tree) { return Object.entries(tree).filter(([k]) => /^\.github\/workflows\/.+\.ya?ml$/.test(k)); }
function runCI(R, tree, event, commit, label) {
  const wfs = workflows(tree).filter(([k, v]) => event === 'push' ? /\bpush\b/.test(v) : /pull_request/.test(v));
  if (!wfs.length) return null;
  const t = npmTest(tree);
  const results = wfs.map(([k, v]) => {
    let jobs = ['test'];
    const mm = v.match(/matrix:[\s\S]*?(\w+):\s*\[([^\]]+)\]/);
    if (mm) jobs = mm[2].split(',').map(s => mm[1] + ' ' + s.trim().replace(/['"]/g, ''));
    const selfHosted = /runs-on:\s*self-hosted/.test(v);
    const ro = (v.match(/runs-on:\s*(\S+)/) || [])[1] || ''; const mult = ro.includes('macos') ? 10 : ro.includes('windows') ? 2 : 1;
    const minutes = selfHosted || R.visibility === 'public' ? 0 : 2 * jobs.length * mult;
    return { wf: k.split('/').pop(), jobs, ok: t.ok, why: t.why, selfHosted, minutes };
  });
  results.forEach(x => { R.minutes += x.minutes; R.runs.unshift({ event, commit, label, ...x }); });
  return { ok: results.every(x => x.ok), results };
}
function onRemoteUpdate(R, branch, event) {
  const tip = R.branches[branch]; if (!tip) return;
  runCI(R, W.obj[tip].tree, 'push', tip, branch);
  Object.values(W.gh).forEach(B => B.prs.filter(p => p.state === 'open' && p.headRepo === R.full && p.head === branch).forEach(p => { p.headTip = tip; recheckPR(p); }));
}
function recheckPR(p) {
  const base = W.gh[p.repo]; const head = W.gh[p.headRepo]; const ht = head.branches[p.head]; if (!ht) return;
  const r = runCI(base, W.obj[ht].tree, 'pull_request', ht, 'PR #' + p.n);
  p.checks = r ? (r.ok ? 'ok' : 'fail') : null; p.checkDetail = r; if (r) W.flags.add('ci-' + p.checks);
}
function prMergeable(p) {
  const R = W.gh[p.repo], ht = W.gh[p.headRepo].branches[p.head], bt = R.branches[p.base];
  const base = mergeBase(bt, ht); const m = merge3(base ? W.obj[base].tree : {}, bt ? W.obj[bt].tree : {}, W.obj[ht].tree);
  return { ...m, ht, bt };
}
function securityAlerts(R) {
  const tip = R.branches[R.def]; const tree = tip ? W.obj[tip].tree : {}; const al = [];
  if (R.dependabot) {
    const pj = tree['package.json'] || ''; const m = pj.match(/"lodash"\s*:\s*"[\^~]?4\.17\.(\d+)"/);
    if (m && +m[1] < 21) al.push({ kind: 'Dependabot', text: 'lodash 4.17.' + m[1] + ' tem vulnerabilidade de poluição de protótipo. Atualize para 4.17.21.', file: 'package.json' });
  }
  if (R.codeql && R.visibility === 'public') Object.entries(tree).forEach(([k, v]) => { if (/\.(js|ts)$/.test(k) && /\beval\s*\(/.test(v)) al.push({ kind: 'CodeQL', text: 'Uso de eval() com entrada do usuário permite execução de código (injeção).', file: k }); });
  return al;
}
function closeRefs(R, text) { (text.match(/(closes|fixes|resolve[s]?|fecha|corrige)\s+#(\d+)/ig) || []).forEach(x => { const n = +x.match(/#(\d+)/)[1]; const is = R.issues.find(i => i.n === n); if (is) { is.state = 'closed'; W.flags.add('issue-closed:' + n); } }); }
function mergePR(p, method) {
  const R = W.gh[p.repo];
  if (p.state !== 'open') return 'O PR #' + p.n + ' não está aberto.';
  if (R.protect && R.reqReview && !p.approvals.length) return 'Merge bloqueado: a proteção da ' + R.def + ' exige 1 aprovação de revisor.';
  if (R.protect && R.reqChecks && p.checks !== 'ok') return 'Merge bloqueado: as verificações obrigatórias (CI) precisam passar.';
  const m = prMergeable(p);
  if (m.conflicts.length) W.flags.add('pr-conflito:' + p.n);
  if (m.conflicts.length) return 'Este ramo tem conflitos com ' + p.base + ' (' + m.conflicts.join(', ') + '). Atualize o ramo localmente (git pull origin ' + p.base + '), resolva e envie de novo.';
  const msg = method === 'squash' ? p.title + ' (#' + p.n + ')' : 'Merge pull request #' + p.n + ' from ' + W.gh[p.headRepo].owner + '/' + p.head;
  const parents = method === 'squash' ? [m.bt] : [m.bt, m.ht];
  const id = mkCommit(msg, parents, m.tree, W.user === p.author ? 'Aluno' : W.user);
  R.branches[p.base] = id; p.state = 'merged'; p.method = method || 'merge'; W.flags.add('pr-merged:' + R.full);
  closeRefs(R, p.title + ' ' + (p.body || ''));
  onRemoteUpdate(R, p.base, 'push');
  return 'Pull request #' + p.n + ' mesclado (' + (method || 'merge') + ') em ' + R.full + ':' + p.base + '.';
}

/* ---------- gh ---------- */
function gh(r) {
  const [g, s, ...a] = r;
  const L = W.local;
  const curRepo = () => { if (!L) fail('Nenhum repositório local. Clone ou crie um.'); const f = L.remotes.origin; if (!f || !W.gh[f]) fail('Nenhum remoto origin configurado para este repositório.'); return W.gh[f]; };
  const needAuth = () => { if (!W.auth) fail('Para usar o gh, faça login primeiro: gh auth login'); };
  if (g === 'auth') {
    if (s === 'login') {
      if (W.conta && !W.conta.criada) fail('Você ainda não tem conta no GitHub. Crie primeiro (exercício 1.1).');
      if (W.conta && !W.conta.verificado) fail('Verifique o e-mail da conta antes de entrar.');
      const cod = Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      W.auth = true; W.flags.add('gh-login');
      return '? Onde você usa o GitHub? GitHub.com\n? Protocolo preferido para o Git: HTTPS\n? Como autenticar? Login com o navegador\n\n! Copie o código: ' + cod + '\nAbrindo github.com/login/device no navegador...\n(no simulador o navegador confirma sozinho com a conta ' + W.user + ')\n\n✓ Autenticação concluída.\n✓ Git configurado para usar HTTPS com a sua conta.\n✓ Logado como ' + W.user;
    }
    if (s === 'status') return W.auth ? 'github.com\n  ✓ Logado como ' + W.user + (W.conta?.email ? ' (' + W.conta.email + ')' : '') + '\n  - Protocolo do Git: https\n  - 2FA: ' + (W.twofa ? 'ativada' : 'DESATIVADA (ative na aba GitHub → Conta)') : 'Você não está logado em nenhuma conta. Use gh auth login';
    if (s === 'logout') { W.auth = false; return 'Desconectado.'; }
  }
  if (g === 'ssh-key' && s === 'add') {
    needAuth(); if (!W.localKeys.length) fail('arquivo de chave não encontrado. Gere com ssh-keygen -t ed25519');
    const type = opt(a, '--type') === 'signing' ? 'signing' : 'auth';
    if (W.ghKeys.some(k => k.key === W.localKeys[0] && k.type === type)) return 'Esta chave já está cadastrada (' + type + ').';
    W.ghKeys.push({ key: W.localKeys[0], type, title: opt(a, '--title', '-t') || 'notebook' }); return '✓ Chave pública adicionada à sua conta como chave de ' + (type === 'signing' ? 'assinatura' : 'autenticação');
  }
  if (g === 'ssh-key' && s === 'list') return W.ghKeys.map(k => k.title + '\t' + k.type + '\tssh-ed25519 …' + k.key).join('\n') || 'Nenhuma chave';
  needAuth();
  if (g === 'repo') {
    if (s === 'create') {
      const name = a.find(x => !x.startsWith('-')) || (L && L.name); if (!name) fail('informe o nome: gh repo create nome --public');
      const full = W.user + '/' + name; if (W.gh[full]) fail('GraphQL: Name already exists on this account (' + full + ')');
      const vis = has(a, '--private') ? 'private' : has(a, '--public') ? 'public' : null; if (!vis) fail('Informe --public ou --private');
      const R = mkRemote(full, { visibility: vis, owner: W.user }); if (vis === 'private') W.flags.add('created-private:' + full);
      let o = '✓ Repositório ' + full + ' criado (' + (vis === 'public' ? 'público' : 'privado') + ')\nhttps://github.com/' + full;
      if (a.some(x => x.startsWith('--source')) && L) { L.remotes.origin = full; o += '\n✓ Remoto origin adicionado'; if (has(a, '--push')) o += '\n' + doPush(L, ['-u', 'origin', curBranch(L) || 'main']); }
      W.flags.add('repo-create:' + full); return o;
    }
    if (s === 'clone') { const full = a[0]; return git(['clone', 'https://github.com/' + full]); }
    if (s === 'fork') {
      const src = a.find(x => !x.startsWith('-')) || (L && L.remotes.origin); if (!src || !W.gh[src]) fail('repositório não encontrado: ' + src);
      const S = W.gh[src]; const full = W.user + '/' + S.name;
      if (!W.gh[full]) { mkRemote(full, { forkOf: src, branches: clone(S.branches), visibility: S.visibility, owner: W.user, tags: clone(S.tags) }); }
      let o = '✓ Fork criado: ' + full;
      if (has(a, '--clone')) { cloneInto(full); W.local.remotes.upstream = src; Object.entries(S.branches).forEach(([b, id]) => W.local.remoteRefs['upstream/' + b] = id); o += "\nClonado em '" + S.name + "'\n✓ Remoto upstream adicionado apontando para " + src; }
      W.flags.add('fork:' + src); return o;
    }
    if (s === 'view') { const R = a[0] ? W.gh[a[0]] : curRepo(); if (!R) fail('não encontrado'); return R.full + ' (' + (R.visibility === 'public' ? 'público' : 'privado') + ')' + (R.forkOf ? '\nfork de ' + R.forkOf : '') + '\nramos: ' + Object.keys(R.branches).join(', ') + '\nPRs abertos: ' + R.prs.filter(p => p.state === 'open').length + '  Issues abertas: ' + R.issues.filter(i => i.state === 'open').length; }
    if (s === 'edit') { const R = a[0] && !a[0].startsWith('-') ? W.gh[a[0]] : curRepo(); const v = opt(a, '--visibility'); if (v) { R.visibility = v === 'private' ? 'private' : 'public'; W.flags.add('visibility:' + R.full + ':' + R.visibility); } const d = opt(a, '--description'); if (d) R.description = d; return '✓ Repositório ' + R.full + ' atualizado'; }
    if (s === 'sync') { const R = curRepo(); if (!R.forkOf) fail('Este repositório não é um fork.'); const S = W.gh[R.forkOf]; const st = S.branches[S.def], ft = R.branches[R.def]; if (!isAnc(ft, st)) fail('O fork tem commits que o original não tem; sincronize localmente (fetch upstream + merge).'); R.branches[R.def] = st; W.flags.add('sync'); return '✓ ' + R.full + ':' + R.def + ' sincronizado com ' + S.full; }
  }
  if (g === 'pr') {
    if (s === 'create') {
      const title = opt(a, '--title', '-t'); if (!title) fail('informe --title "..."');
      const R0 = curRepo(); const base = W.gh[opt(a, '--repo', '-R') || R0.forkOf || R0.full]; if (!base) fail('repositório base não encontrado');
      const head = opt(a, '--head', '-H') || curBranch(L); const hr = R0;
      if (!hr.branches[head]) fail('Ramo ' + head + ' não existe em ' + hr.full + '. Envie antes: git push -u origin ' + head);
      const b = opt(a, '--base', '-B') || base.def;
      if (hr === base && head === b) fail('O ramo de origem e o de destino são iguais (' + b + '). Crie um ramo para a mudança.');
      if (base.prs.some(p => p.state === 'open' && p.head === head && p.headRepo === hr.full)) fail('Já existe um PR aberto para ' + head);
      const p = { n: base.prs.length + base.issues.length + 1, title, body: opt(a, '--body', '-b') || '', head, headRepo: hr.full, base: b, repo: base.full, state: 'open', approvals: [], author: W.user, draft: has(a, '--draft'), checks: null };
      if (p.draft && base.visibility === 'private') fail('Draft PRs em repositório privado não estão no plano Free (veja o Módulo 7). Crie sem --draft ou use repositório público.');
      base.prs.push(p); recheckPR(p); W.flags.add('pr-create:' + base.full);
      return 'Criando pull request para ' + base.full + ':' + b + ' a partir de ' + hr.owner + ':' + head + '\n✓ https://github.com/' + base.full + '/pull/' + p.n + (p.checks ? '\nVerificações: ' + (p.checks === 'ok' ? '✓ passaram' : '✗ falharam — ' + p.checkDetail.results[0].why) : '');
    }
    const R = (opt(a, '--repo', '-R') && W.gh[opt(a, '--repo', '-R')]) || (() => { const r0 = curRepo(); return r0.forkOf && W.gh[r0.forkOf].prs.length ? W.gh[r0.forkOf] : r0; })();
    const n = +(a.find(x => /^\d+$/.test(x)) || (R.prs.filter(p => p.state === 'open').slice(-1)[0] || {}).n);
    const p = R.prs.find(x => x.n === n);
    if (s === 'list') return R.prs.filter(x => x.state === 'open').map(x => '#' + x.n + '\t' + x.title + '\t' + x.head + (x.checks ? '\t' + (x.checks === 'ok' ? '✓' : '✗') : '')).join('\n') || 'Nenhum PR aberto em ' + R.full;
    if (!p) fail('PR não encontrado');
    if (s === 'view') return '#' + p.n + ' ' + p.title + ' [' + p.state + ']\n' + p.headRepo.split('/')[0] + ':' + p.head + ' → ' + p.base + '\nAprovações: ' + (p.approvals.join(', ') || 'nenhuma') + '\nCI: ' + (p.checks || 'sem workflow') + (p.body ? '\n\n' + p.body : '');
    if (s === 'checks') { if (!p.checkDetail) return 'Nenhuma verificação para este PR (não há workflow com pull_request).'; return p.checkDetail.results.map(x => x.jobs.map(j => (x.ok ? '✓ ' : '✗ ') + x.wf + ' / ' + j).join('\n')).join('\n') + (p.checks === 'fail' ? '\n' + p.checkDetail.results[0].why : ''); }
    if (s === 'review') { if (has(a, '--approve')) { if (p.author === W.user) fail('Você não pode aprovar o seu próprio pull request. Peça a um colega (botão "Colega aprova").'); } return 'ok'; }
    if (s === 'merge') { const res = mergePR(p, has(a, '--squash', '-s') ? 'squash' : has(a, '--rebase', '-r') ? 'rebase' : 'merge'); if (/bloqueado|conflitos|não está/.test(res)) fail(res); if (has(a, '--delete-branch', '-d')) delete W.gh[p.headRepo].branches[p.head]; return '✓ ' + res; }
    if (s === 'close') { p.state = 'closed'; return '✓ PR #' + p.n + ' fechado'; }
  }
  if (g === 'issue') {
    const R = (opt(a, '--repo', '-R') && W.gh[opt(a, '--repo', '-R')]) || curRepo();
    if (s === 'create') { const t = opt(a, '--title', '-t'); if (!t) fail('informe --title'); const i = { n: R.prs.length + R.issues.length + 1, title: t, body: opt(a, '--body', '-b') || '', label: opt(a, '--label', '-l') || '', state: 'open', author: W.user }; R.issues.push(i); W.flags.add('issue-create'); return '✓ https://github.com/' + R.full + '/issues/' + i.n; }
    if (s === 'list') return R.issues.filter(i => i.state === 'open').map(i => '#' + i.n + '\t' + i.title + (i.label ? '\t[' + i.label + ']' : '')).join('\n') || 'Nenhuma issue aberta';
    if (s === 'view') { const i = R.issues.find(x => x.n === +a[0]); if (!i) fail('issue não encontrada'); return '#' + i.n + ' ' + i.title + ' [' + i.state + ']' + (i.label ? ' [' + i.label + ']' : '') + '\n\n' + i.body; }
    if (s === 'close') { const i = R.issues.find(x => x.n === +a[0]); if (!i) fail('issue não encontrada'); i.state = 'closed'; return '✓ Issue #' + i.n + ' fechada'; }
  }
  if (g === 'release' && s === 'create') {
    const R = curRepo(); const tag = a.find(x => !x.startsWith('-')); if (!tag) fail('informe a tag: gh release create v1.0.0');
    if (!R.tags[tag]) { if (L.tags[tag]) fail('A tag ' + tag + ' existe só localmente. Envie antes: git push origin ' + tag); R.tags[tag] = R.branches[R.def]; }
    const prev = R.releases[0]; const since = prev ? ancestors(R.tags[prev.tag]) : new Set();
    const notes = opt(a, '--notes', '-n') || (has(a, '--generate-notes') ? [...ancestors(R.tags[tag])].filter(x => !since.has(x)).map(x => W.obj[x]).sort((x, y) => y.t - x.t).map(c => '- ' + c.msg).join('\n') : '');
    R.releases.unshift({ tag, title: opt(a, '--title') || tag, notes, commit: R.tags[tag] }); W.flags.add('release:' + tag);
    return '✓ Release ' + tag + ' publicada\nhttps://github.com/' + R.full + '/releases/tag/' + tag + (notes ? '\n\n' + notes : '');
  }
  if (g === 'api') {
    const path = s || ''; W.flags.add('gh-api');
    let m = path.match(/^\/?repos\/([^/]+\/[^/]+)\/commits$/);
    if (m) { const R = W.gh[m[1]]; if (!R) fail('{"message":"Not Found","status":"404"}'); const list = [...ancestors(R.branches[R.def])].map(x => W.obj[x]).sort((x, y) => y.t - x.t); return JSON.stringify(list.map(c => ({ sha: short(c.id), author: c.author, message: c.msg })), null, 1); }
    m = path.match(/^\/?repos\/([^/]+\/[^/]+)\/contributors$/);
    if (m) { const R = W.gh[m[1]]; if (!R) fail('{"message":"Not Found"}'); const cnt = {}; ancestors(R.branches[R.def]).forEach(x => { const au = W.obj[x].author; cnt[au] = (cnt[au] || 0) + 1; }); return JSON.stringify(Object.entries(cnt).sort((x, y) => y[1] - x[1]).map(([login, contributions]) => ({ login, contributions })), null, 1); }
    m = path.match(/^\/?repos\/([^/]+\/[^/]+)$/);
    if (m) { const R = W.gh[m[1]]; if (!R) fail('{"message":"Not Found"}'); return JSON.stringify({ full_name: R.full, private: R.visibility === 'private', fork: !!R.forkOf, default_branch: R.def, open_issues: R.issues.filter(i => i.state === 'open').length }, null, 1); }
    if (/^\/?user$/.test(path)) return JSON.stringify({ login: W.user, two_factor_authentication: W.twofa }, null, 1);
    fail('gh api: no simulador use repos/DONO/REPO, repos/DONO/REPO/commits, repos/DONO/REPO/contributors ou user');
  }
  fail('gh: comando não suportado no simulador. Veja help.');
}

function colegaAprova(p) {
  if (!p.approvals.includes('colega')) p.approvals.push('colega');
  W.flags.add('approved:' + p.n);
  return '👀 colega revisou o PR #' + p.n + ' e aprovou: "Ficou ótimo, pode mesclar!"';
}
