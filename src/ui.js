/* ===== Interface ===== */
const $ = s => document.querySelector(s);
const S = { explica: true, modo: 'teoria', mod: 1, ex: null, tab: 'arquivos', repo: null, sub: 'codigo', viewFile: null, viewRemote: null, term: [], dica: 0, sol: false, feitos: new Set(), hist: [], hi: -1, m7: {}, calc: { pessoas: 5, plano: 'free', copilot: 'none', secret: false, code: false, edu: false } };
try { S.feitos = new Set(JSON.parse(localStorage.getItem('oficina-github-feitos') || '[]')); } catch (e) { }
const salvar = () => { try { localStorage.setItem('oficina-github-feitos', JSON.stringify([...S.feitos])); } catch (e) { } };
S.worlds = {}; S.lastEx = {}; S.confirmReset = false;
try { const p = JSON.parse(localStorage.getItem('oficina-github-ui') || '{}'); if (p.calc) S.calc = p.calc; if (p.m7) S.m7 = p.m7; if (p.lastEx) S.lastEx = p.lastEx; if (typeof p.explica === 'boolean') S.explica = p.explica; } catch (e) { }
const KEY = 'oficina-github-ex-';
function persistUI() { try { localStorage.setItem('oficina-github-ui', JSON.stringify({ calc: S.calc, m7: S.m7, lastEx: S.lastEx, explica: S.explica })); } catch (e) { } }
function persist() {
  if (!S.ex || !W) return; const ex = curEx(); if (!ex) return;
  const s = JSON.stringify({ v: 2, titulo: ex.titulo, W: Object.assign({}, W, { flags: [...W.flags] }), term: S.term.slice(-300), hist: S.hist.slice(0, 50), extra: Object.fromEntries(Object.entries(ex).filter(([k]) => k.startsWith('_'))) });
  S.worlds[S.ex] = s; try { localStorage.setItem(KEY + S.ex, s); } catch (e) { }
}
function carregar(id) {
  let s = S.worlds[id]; if (!s) { try { s = localStorage.getItem(KEY + id); } catch (e) { } }
  if (!s) return false;
  const exAlvo = id === 'lab' ? LAB : EXERCICIOS.find(e => e.id === id);
  try { const d = JSON.parse(s); if (d.v !== 2 || d.titulo !== exAlvo.titulo) { apagar(id); return false; } W = d.W; W.flags = new Set(d.W.flags || []); S.term = d.term || []; S.hist = d.hist || []; Object.assign(id === 'lab' ? LAB : EXERCICIOS.find(e => e.id === id), d.extra || {}); return true; } catch (e) { return false; }
}
function apagar(id) { delete S.worlds[id]; try { localStorage.removeItem(KEY + id); } catch (e) { } }
const exsDo = m => m === 0 ? [LAB] : EXERCICIOS.filter(e => e.mod === m);
const curEx = () => S.ex === 'lab' ? LAB : EXERCICIOS.find(e => e.id === S.ex);
function toast(t) { document.querySelectorAll('.toast').forEach(x => x.remove()); const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3200); }

function render() {
  $('#bTeoria').setAttribute('aria-pressed', S.modo === 'teoria'); $('#bPratica').setAttribute('aria-pressed', S.modo === 'pratica');
  const mods = MODULOS.map(m => `<button data-act="mod" data-arg="${m.n}" aria-current="${S.mod === m.n}"><span class="dot" style="background:${m.cor}"></span><b>${m.n}</b> ${m.titulo}</button>`);
  if (S.modo === 'teoria') mods.push(`<button data-act="mod" data-arg="8" aria-current="${S.mod === 8}"><span class="dot" style="background:#8c959f"></span>Glossário</button>`);
  if (S.modo === 'pratica') mods.push(`<button data-act="mod" data-arg="0" aria-current="${S.mod === 0}"><span class="dot" style="background:#8c959f"></span>Laboratório livre</button>`);
  $('#mods').innerHTML = mods.join('');
  const total = EXERCICIOS.length + CENARIOS.length, feitos = EXERCICIOS.filter(e => S.feitos.has(e.id)).length + CENARIOS.filter(c => S.feitos.has(c.id)).length;
  $('#progTxt').textContent = feitos + ' de ' + total + ' práticas'; $('#progBar').style.width = (100 * feitos / total) + '%';
  if (S.modo === 'teoria') renderTeoria(); else if (S.mod === 7) renderM7(); else renderPratica();
  const h = S.modo === 'teoria' ? 'teoria-' + S.mod : S.mod === 7 ? 'pratica-7' : 'pratica-' + (S.ex || '').replace('.', '-');
  if (location.hash.slice(1) !== h) history.replaceState(null, '', '#' + h);
}

function renderTeoria() {
  if (S.mod === 8) { $('#main').innerHTML = `<article class="teoria"><div class="kick">Referência</div><h2>Glossário</h2>${TEORIA[8]}<div class="irpratica"><button class="btn" data-act="mod" data-arg="1">Voltar ao Módulo 1</button></div></article>`; window.scrollTo(0, 0); return; }
  if (S.mod === 0) S.mod = 1;
  const m = MODULOS.find(x => x.n === S.mod) || MODULOS[0];
  const n = exsDo(m.n).length;
  $('#main').innerHTML = `<article class="teoria"><div class="kick">Módulo ${m.n} de 7</div><h2>${m.titulo}</h2><p class="small">${m.sub}</p>${TEORIA[m.n]}
  <div class="irpratica"><button class="btn pri" data-act="praticar" data-arg="${m.n}">${m.n === 7 ? 'Praticar: calculadora e cenários' : 'Praticar: ' + n + ' exercícios'} →</button>${m.n < 7 ? `<button class="btn" data-act="mod" data-arg="${m.n + 1}">Próximo módulo</button>` : ''}</div></article>`;
  window.scrollTo(0, 0);
}

/* ---------- prática ---------- */
function abrirEx(id, manter, reiniciar) {
  S.ex = id; const ex = curEx(); S.dica = 0; S.sol = false; S.viewFile = null; S.viewRemote = null; S.confirmReset = false;
  if (ex.mod) { S.lastEx[ex.mod] = id; persistUI(); }
  if (reiniciar) apagar(id);
  if (!reiniciar && carregar(id)) {
    S.term.push({ c: 'info', t: '(seu progresso neste exercício foi restaurado)' });
  } else {
    ex.setup(); W.cmds = []; W.flags.delete('clear');
    S.term = [{ c: 'info', t: 'Oficina GitHub · terminal simulado. Digite help para ver os comandos.' + (W.local ? '\nVocê está em ~/' + W.local.name + ' (ramo ' + (curBranch(W.local) || '?') + ').' : '\nVocê está em ~ (nenhum repositório ainda).') }];
    if (reiniciar) S.term.push({ c: 'info', t: '(exercício reiniciado do zero)' });
  }
  S.repo = W.local?.remotes.origin || Object.keys(W.gh)[0] || null; S.sub = 'codigo';
  S.tab = ex.foco === 'web' ? 'github' : (W.local ? 'arquivos' : 'github');
  if (!manter) renderPratica(); else update();
}
function renderPratica() {
  const lista = exsDo(S.mod);
  if (!S.ex || !lista.some(e => e.id === S.ex)) { abrirEx(lista[0].id, true); }
  $('#main').innerHTML = `<div class="pratica"><aside class="ex" id="exCard"></aside>
  <div class="sim${curEx()?.foco === 'web' ? ' web' : ''}"><section class="term" aria-label="Terminal"><div class="out" id="out" aria-live="polite"></div>
  <div class="dock"><form id="tf" autocomplete="off"><span class="pr" id="prompt"></span><label for="cmd" style="position:absolute;left:-9999px">Comando</label><input id="cmd" spellcheck="false" autocapitalize="off" placeholder="digite um comando…"></form>
  <div class="ajuda" id="ajuda" aria-live="polite"></div>
  <div class="chips"><button type="button" class="tog" data-act="explica" aria-pressed="${S.explica}">Explicações ${S.explica ? 'ligadas' : 'desligadas'}</button>${['git status', 'git add .', 'git commit -m ""', 'git log --oneline --all', 'git push', 'git pull', 'git switch -c ', 'help'].map(c => `<button type="button" data-act="chip" data-arg="${esc(c)}" title="${esc(explicar(c) || '')}">${esc(c)}</button>`).join('')}</div></div></section>
  <section class="painel"><div class="tabs" role="tablist" id="tabs"></div><div class="pbody" id="pbody"></div></section></div></div>`;
  $('#tf').addEventListener('submit', e => { e.preventDefault(); const v = $('#cmd').value; if (!v.trim()) return; S.hist.unshift(v); S.hi = -1; $('#cmd').value = ''; executar(v); $('#cmd').dispatchEvent(new Event('input')); });
  const ajuda = () => { const v = $('#cmd').value; const x = v.trim() ? explicar(v) : null; $('#ajuda').innerHTML = x ? '<b>O que faz:</b> ' + esc(x) : '<span>Digite um comando e veja aqui o que ele faz. Toque nos atalhos abaixo ou use explicar &lt;comando&gt;.</span>'; };
  $('#cmd').addEventListener('input', ajuda); ajuda();
  $('#cmd').addEventListener('keydown', e => { if (e.key === 'ArrowUp') { S.hi = Math.min(S.hist.length - 1, S.hi + 1); if (S.hist[S.hi] !== undefined) $('#cmd').value = S.hist[S.hi]; e.preventDefault(); } if (e.key === 'ArrowDown') { S.hi = Math.max(-1, S.hi - 1); $('#cmd').value = S.hi < 0 ? '' : S.hist[S.hi]; e.preventDefault(); } });
  update();
}
function executar(v) {
  S.term.push({ c: 'cmd', t: promptTxt() + ' ' + v });
  const outs = run(v);
  if (W.flags.has('clear')) { S.term = []; W.flags.delete('clear'); }
  outs.forEach(o => { if (o.t) S.term.push({ c: o.ok ? '' : 'err', t: o.t }); });
  if (S.explica && !/^\s*(explicar|man|help|clear)\b/.test(v)) {
    const partes = splitChain(v); const ex = partes.length === 1 ? explicar(v) : null; const ac = partes.length === 1 ? aconteceu(v, outs) : null;
    if (ex || ac) S.term.push({ c: 'exp', t: (ex ? '↳ O que faz: ' + ex : '') + (ex && ac ? '\n' : '') + (ac ? '↳ Resultado: ' + ac : '') });
  }
  if (W.editor) S.tab = 'arquivos';
  if (/^\s*(gh pr|colega)/.test(v) && W.gh[S.repo]) { S.sub = 'prs'; }
  if (W.local?.remotes.origin && /clone|fork/.test(v)) S.repo = W.local.remotes.origin;
  update();
  if (innerWidth <= 820) { const tm = document.querySelector('.term'); if (tm) tm.scrollIntoView({ block: 'end' }); }
}
function promptTxt() { const L = W.local; if (!L) return 'aluno@profjon:~$'; const b = curBranch(L) || short(headId(L)); return 'aluno@profjon:~/' + L.name + ' (' + b + (L.merge ? '|MERGING' : L.rebase ? '|REBASE' : L.bisect ? '|BISECTING' : '') + ')$'; }
function update() {
  const ex = curEx(); if (!ex || !$('#exCard')) return;
  persist();
  renderExCard(ex);
  const out = $('#out'); if (out) { out.innerHTML = S.term.map(l => l.c === 'cmd' ? `<div class="cmd"><b>${esc(l.t.split('$')[0])}$</b>${esc(l.t.slice(l.t.split('$')[0].length + 1))}</div>` : `<div class="${l.c}">${esc(l.t)}</div>`).join(''); out.scrollTop = out.scrollHeight; }
  if ($('#prompt')) $('#prompt').textContent = promptTxt();
  renderPainel();
}
function renderExCard(ex) {
  const res = ex.metas.map(([t, f]) => { let ok = false; try { ok = !!f(); } catch (e) { } return [t, ok]; });
  const done = res.length && res.every(x => x[1]);
  if (done && !S.feitos.has(ex.id)) { S.feitos.add(ex.id); salvar(); toast('Exercício ' + ex.id + ' concluído!'); render(); return; }
  const sol = typeof ex.solucao === 'function' ? ex.solucao.call(ex) : ex.solucao;
  const lista = exsDo(S.mod);
  $('#exCard').innerHTML = `<div class="exlist">${lista.map(e => `<button data-act="ex" data-arg="${e.id}" aria-current="${e.id === ex.id}" class="${S.feitos.has(e.id) ? 'feito' : ''}">${e.id === 'lab' ? 'livre' : e.id}</button>`).join('')}</div>
  <h2>${ex.titulo}</h2><div class="intro">${ex.intro}</div>
  ${res.length ? `<ul class="metas">${res.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}"><i>${ok ? '✓' : ''}</i><span>${esc(t)}</span></li>`).join('')}</ul>` : ''}
  ${done ? `<div class="parabens">Concluído! ${nextEx(ex) ? `<button class="btn sm" data-act="ex" data-arg="${nextEx(ex)}">Próximo exercício →</button>` : ''}</div>` : ''}
  ${(() => { const g = glossario(sol); return g.length ? `<details class="glos" ${innerWidth > 820 ? 'open' : ''}><summary>Comandos deste exercício (${g.length})</summary><dl>${g.map(([k, v]) => `<dt><button data-act="put" data-arg="${esc(k.includes('…') ? '' : k)}">${esc(k)}</button></dt><dd>${esc(v)}</dd>`).join('')}</dl></details>` : ''; })()}
  <div class="exbtns" style="margin-top:10px"><button class="btn" data-act="dica" ${S.dica >= ex.dicas.length ? 'disabled' : ''}>Dica (${S.dica}/${ex.dicas.length})</button>${sol.length ? `<button class="btn" data-act="sol">${S.sol ? 'Esconder solução' : 'Ver solução'}</button>` : ''}<button class="btn" data-act="reset">Reiniciar exercício</button></div>
  ${S.confirmReset ? `<div class="confirma" role="alertdialog" aria-label="Confirmar reinício"><b>Reiniciar este exercício?</b><span>Tudo o que você fez aqui (comandos, arquivos, commits e repositórios) será apagado e o exercício volta ao começo. Os exercícios já concluídos continuam marcados.</span><div class="exbtns"><button class="btn danger" data-act="resetSim">Sim, reiniciar</button><button class="btn" data-act="resetNao">Cancelar</button></div></div>` : ''}
  ${S.dica ? `<div class="dicas">${ex.dicas.slice(0, S.dica).map(d => `<div>${esc(d)}</div>`).join('')}</div>` : ''}
  ${S.sol ? `<div class="sol"><span class="small">Toque num comando para colocá-lo no terminal.</span>${sol.map((s, i) => typeof s === 'string' ? `<div class="passo"><button data-act="put" data-arg="${esc(s.replace(/\n/g, '\\n'))}"><span class="num">${i + 1}</span>${esc(s.replace(/\n/g, '\\n'))}</button>${explicar(s) ? `<span class="pq2">${esc(explicar(s))}</span>` : ''}</div>` : `<div class="passo"><button class="nota" data-act="nota" data-arg="${i}"><span class="num">${i + 1}</span>⚙ ${esc(s.nota)} · fazer por mim</button><span class="pq2">Este passo é feito no site (aba GitHub). O botão faz por você, se preferir.</span></div>`).join('')}</div>` : ''}`;
}
function nextEx(ex) { const i = EXERCICIOS.indexOf(ex); return EXERCICIOS[i + 1] ? EXERCICIOS[i + 1].id : null; }

/* ---------- painel ---------- */
function renderPainel() {
  const tabs = [['arquivos', 'Arquivos'], ['grafo', 'Grafo de commits'], ['github', 'GitHub']];
  $('#tabs').innerHTML = tabs.map(([k, n]) => `<button role="tab" data-act="tab" data-arg="${k}" aria-selected="${S.tab === k}">${n}</button>`).join('');
  const b = $('#pbody');
  if (S.tab === 'arquivos') b.innerHTML = painelArquivos();
  else if (S.tab === 'grafo') b.innerHTML = painelGrafo();
  else b.innerHTML = painelGitHub();
}
function painelArquivos() {
  let h = '';
  if (W.editor && W.local) {
    h += `<div class="editor"><div class="rhead"><b class="mono">nano ${esc(W.editor)}</b><span class="small">Edite e salve. Em conflitos, apague as linhas &lt;&lt;&lt;&lt;&lt;&lt;&lt;, ======= e &gt;&gt;&gt;&gt;&gt;&gt;&gt;.</span></div><label for="edTxt" class="small">Conteúdo</label><textarea id="edTxt">${esc(W.local.files[W.editor] ?? '')}</textarea><div class="exbtns" style="margin-top:6px"><button class="btn pri" data-act="edSave">Salvar e fechar</button><button class="btn" data-act="edClose">Cancelar</button></div></div>`;
  }
  const L = W.local;
  if (!L) return h + '<p class="small">Nenhum repositório local. Use <code>git clone</code> ou <code>git init</code> no terminal, ou trabalhe pela aba GitHub.</p>';
  const s = status(L), H = headTree(L);
  h += `<div class="headinfo"><span class="pill">~/${esc(L.name)}</span>${curBranch(L) ? `<span class="pill head">HEAD → ${esc(curBranch(L))}</span>` : `<span class="pill bad">HEAD destacado ${short(headId(L))}</span>`}${L.merge ? '<span class="pill bad">merge em andamento</span>' : ''}${L.rebase ? '<span class="pill bad">rebase em andamento</span>' : ''}${L.bisect ? '<span class="pill tag">bisect</span>' : ''}${L.stash.length ? `<span class="pill tag">stash: ${L.stash.length}</span>` : ''}${Object.entries(L.remotes).map(([n, u]) => `<span class="pill rem">${esc(n)} → ${esc(u)}</span>`).join('')}</div>`;
  const work = Object.keys(L.files).filter(tracked).sort();
  const stg = [...s.staged];
  h += `<div class="areas"><div class="area"><h4>Pasta de trabalho</h4>${work.length ? work.map(f => { const st = fileState(L, f); return `<button class="fi" data-act="vf" data-arg="${esc(f)}"><span class="st ${st}">${st}</span><span>${esc(f)}</span></button>`; }).join('') : '<span class="small">vazia</span>'}${s.unstaged.filter(x => x[1] === 'deletado').map(x => `<div class="fi"><span class="st M">D</span><span>${esc(x[0])}</span></div>`).join('')}</div>
  <div class="area"><h4>Staging (preparado)</h4>${stg.length ? stg.map(([f, t]) => `<div class="fi"><span class="st A">${t === 'novo arquivo' ? '+' : t === 'deletado' ? '−' : '~'}</span><span>${esc(f)}</span></div>`).join('') : '<span class="small">nada preparado</span>'}</div>
  <div class="area"><h4>Último commit</h4>${headId(L) ? `<div class="small mono">${short(headId(L))} ${esc(W.obj[headId(L)].msg)}</div>` + Object.keys(H).sort().map(f => `<div class="fi"><span class="st"></span><span>${esc(f)}</span></div>`).join('') : '<span class="small">ainda sem commits</span>'}</div></div>
  <p class="small">U = novo (não monitorado) · M = modificado · A = preparado · C = conflito · I = ignorado pelo .gitignore</p>`;
  if (S.viewFile && L.files[S.viewFile] !== undefined) h += `<div class="rhead"><b class="mono">${esc(S.viewFile)}</b><button class="btn sm" data-act="edit" data-arg="${esc(S.viewFile)}">Editar (nano)</button></div><div class="filev">${esc(L.files[S.viewFile])}</div>`;
  return h;
}
function painelGrafo() {
  const L = W.local;
  if (!L || !headId(L) && !Object.keys(L.remoteRefs).length) return '<p class="small">O grafo aparece depois do primeiro commit no repositório local.</p>';
  const tips = []; if (headId(L)) tips.push(headId(L));
  Object.values(L.branches).forEach(x => tips.push(x)); Object.values(L.remoteRefs).forEach(x => tips.push(x)); Object.values(L.tags).forEach(x => tips.push(x));
  if (L.rebase) tips.push(L.rebase.tip);
  const set = new Set(); tips.forEach(t => ancestors(t).forEach(x => set.add(x)));
  let list = [...set].map(x => W.obj[x]).sort((a, b) => b.t - a.t).slice(0, 28);
  const idx = Object.fromEntries(list.map((c, i) => [c.id, i]));
  const lane = {}; let nl = 0;
  const order = [curBranch(L), 'main', ...Object.keys(L.branches)].filter((v, i, a) => v && a.indexOf(v) === i && L.branches[v]);
  const seeds = [...order.map(b => L.branches[b]), ...Object.values(L.remoteRefs), headId(L)].filter(Boolean);
  seeds.forEach(t => { if (lane[t] !== undefined || idx[t] === undefined) return; const ln = nl++; let x = t; while (x && idx[x] !== undefined && lane[x] === undefined) { lane[x] = ln; x = W.obj[x].parents[0]; } });
  list.forEach(c => { if (lane[c.id] === undefined) lane[c.id] = nl++; });
  const lanes = Math.max(1, nl), X = l => 16 + l * 18, Y = i => 18 + i * 30, tx = X(lanes) + 6;
  const cores = ['#1a7f37', '#0969da', '#8250df', '#bf3989', '#cf222e', '#9a6700'];
  let lines = '', nodes = '';
  list.forEach((c, i) => c.parents.forEach(p => { if (idx[p] === undefined) { lines += `<line x1="${X(lane[c.id])}" y1="${Y(i)}" x2="${X(lane[c.id])}" y2="${Y(i) + 22}" stroke="${cores[lane[c.id] % 6]}" stroke-width="2" stroke-dasharray="3 3"/>`; return; } const x1 = X(lane[c.id]), y1 = Y(i), x2 = X(lane[p]), y2 = Y(idx[p]); lines += x1 === x2 ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cores[lane[c.id] % 6]}" stroke-width="2"/>` : `<path d="M${x1} ${y1} C ${x1} ${y1 + 18}, ${x2} ${y2 - 18}, ${x2} ${y2}" fill="none" stroke="${cores[(c.parents.indexOf(p) ? lane[p] : lane[c.id]) % 6]}" stroke-width="2"/>`; }));
  list.forEach((c, i) => {
    const d = decor(L, c.id).split(', ').filter(Boolean);
    let px = tx; let pills = '';
    d.forEach(t => { const w = t.length * 7.2 + 12; const cls = t.startsWith('HEAD') ? 'head' : t.startsWith('tag:') ? 'tag' : t.includes('/') ? 'rem' : 'br'; const col = { head: '#0969da', tag: '#9a6700', rem: '#cf222e', br: '#0969da' }[cls]; pills += `<rect x="${px}" y="${Y(i) - 9}" width="${w}" height="18" rx="9" fill="${cls === 'head' ? col : 'none'}" stroke="${col}"/><text x="${px + 6}" y="${Y(i) + 4}" style="fill:${cls === 'head' ? '#fff' : col}">${esc(t)}</text>`; px += w + 4; });
    nodes += `<circle cx="${X(lane[c.id])}" cy="${Y(i)}" r="${c.parents.length > 1 ? 6 : 5}" fill="${c.parents.length > 1 ? 'var(--surface)' : cores[lane[c.id] % 6]}" stroke="${cores[lane[c.id] % 6]}" stroke-width="2"/>${pills}<text x="${px}" y="${Y(i) + 4}">${short(c.id)}</text><text class="msg" x="${px + 62}" y="${Y(i) + 4}">${esc(c.msg.length > 46 ? c.msg.slice(0, 45) + '…' : c.msg)}${c.signed ? ' ✔' : ''} · ${esc(c.author)}</text>`;
  });
  const w = 900, h = Y(list.length - 1) + 20;
  return `<p class="small">Mais recente no topo. Círculo vazado = commit de merge. Azul = ramos locais, vermelho = ramos remotos, amarelo = tags.</p><div class="graph"><svg width="${w}" height="${h}" role="img" aria-label="Grafo de commits">${lines}${nodes}</svg></div>`;
}
function painelEntrada() {
  const C = W.conta;
  if (!C.criada) return `<div class="form"><b style="font-size:16px">Criar sua conta no GitHub</b><span class="small">Simulação do cadastro em github.com/signup. Nada é enviado para fora desta página.</span>
    <label class="small" for="suUser">Nome de usuário</label><input id="suUser" autocapitalize="off" placeholder="ex.: maria-silva">
    <label class="small" for="suMail">E-mail</label><input id="suMail" type="email" placeholder="voce@profjon.com.br">
    <label class="small" for="suPass">Senha</label><input id="suPass" type="password" placeholder="15+ caracteres, ou 8+ com número e minúscula">
    <div class="inl"><button class="btn pri" data-act="signup">Criar conta</button></div></div>`;
  if (!C.verificado) return `<div class="form"><b style="font-size:16px">Verifique seu e-mail</b><span class="small">Enviamos um código de 6 dígitos para <b>${esc(C.email)}</b>.</span><label class="small" for="vCode">Código</label><input id="vCode" inputmode="numeric" placeholder="000000"><div class="inl"><button class="btn pri" data-act="verify">Verificar</button></div></div>
    <b style="font-size:13px">Caixa de entrada (simulada) · ${esc(C.email)}</b><div class="box"><div class="row"><span class="grow"><b>GitHub</b> · [GitHub] Confirme seu e-mail<br><span class="small">Olá, ${esc(C.user)}! Seu código de verificação é</span> <b class="mono" style="font-size:16px">${C.codigo}</b></span></div></div>`;
  return `<div class="form"><b style="font-size:16px">Entrar no GitHub</b><label class="small" for="liId">Usuário ou e-mail</label><input id="liId" autocapitalize="off"><label class="small" for="liPass">Senha</label><input id="liPass" type="password"><div class="inl"><button class="btn pri" data-act="login">Entrar</button></div></div>`;
}
function painelGitHub() {
  if (W.conta && !W.conta.logado) return painelEntrada();
  const repos = Object.keys(W.gh);
  let h = `<div class="rhead"><span class="pill">@${W.user}</span><span class="pill ${W.twofa ? 'ok' : 'bad'}">2FA ${W.twofa ? 'ativa' : 'desativada'}</span><button class="btn sm" data-act="gsub" data-arg="conta">Conta</button><button class="btn sm" data-act="gsub" data-arg="novo">+ Novo</button></div>`;
  if (S.sub === 'conta') return h + painelConta();
  if (S.sub === 'novo') return h + `<div class="form"><b>Novo repositório</b><label class="small" for="nrName">Nome</label><input id="nrName" placeholder="ex.: diario"><div class="inl"><label><input type="radio" name="nrVis" value="public" checked> Público</label><label><input type="radio" name="nrVis" value="private"> Privado</label><label><input type="checkbox" id="nrReadme"> com README</label></div><div class="inl"><button class="btn pri" data-act="novoRepo">Criar repositório</button><button class="btn" data-act="gsub" data-arg="codigo">Cancelar</button></div></div>`;
  if (!repos.length) return h + '<p class="small">Você ainda não tem repositórios. Use + Novo ou <code>gh repo create</code>.</p>';
  if (!W.gh[S.repo]) S.repo = repos[0];
  const R = W.gh[S.repo]; const mine = R.owner === W.user || R.collaborators.includes(W.user);
  h += `<div class="gh-repos">${repos.map(r => `<button data-act="repo" data-arg="${r}" aria-current="${r === S.repo}">${r}</button>`).join('')}</div>`;
  h += `<div class="rhead"><h3>${R.full}</h3><span class="pill pub">${R.visibility === 'public' ? 'Público' : 'Privado'}</span>${R.forkOf ? `<span class="pill">fork de ${R.forkOf}</span>` : ''}${R.protect ? '<span class="pill ok">main protegida</span>' : ''}</div>`;
  const al = securityAlerts(R);
  const subs = [['codigo', 'Código'], ['prs', 'Pull requests ' + R.prs.filter(p => p.state === 'open').length], ['issues', 'Issues ' + R.issues.filter(i => i.state === 'open').length], ['actions', 'Actions'], ['seg', 'Segurança' + (al.length ? ' ⚠ ' + al.length : '')], ['pages', 'Pages'], ['config', 'Configurações']];
  h += `<div class="subtabs" role="tablist">${subs.map(([k, n]) => `<button role="tab" data-act="gsub" data-arg="${k}" aria-selected="${S.sub === k}">${n}</button>`).join('')}</div>`;
  const tip = R.branches[R.def], T = tip ? W.obj[tip].tree : {};
  if (S.sub === 'codigo' || !subs.some(s => s[0] === S.sub)) {
    h += `<div class="small" style="margin-bottom:6px">Ramos: ${Object.keys(R.branches).map(b => `<span class="pill br">${esc(b)}</span>`).join(' ') || 'nenhum (repositório vazio)'}${Object.keys(R.tags).length ? ' · Tags: ' + Object.keys(R.tags).map(t => `<span class="pill tag">${esc(t)}</span>`).join(' ') : ''}${R.releases.length ? ' · Release mais recente: <b>' + esc(R.releases[0].tag) + '</b>' : ''}</div>`;
    if (!tip) h += `<div class="box"><div class="row">Repositório vazio. Envie com <code>git push -u origin main</code> ou adicione um arquivo abaixo.</div></div>`;
    else {
      h += `<div class="box">${Object.keys(T).sort().map(f => `<button class="row fi" style="border-radius:0" data-act="vr" data-arg="${esc(f)}"><span>📄</span><span class="grow">${esc(f)}</span></button>`).join('')}</div>`;
      if (S.viewRemote && T[S.viewRemote] !== undefined) h += `<b class="mono">${esc(S.viewRemote)}</b><div class="filev">${esc(T[S.viewRemote])}</div>`;
      if (T['README.md'] && !S.viewRemote) h += `<div class="filev" style="font-family:var(--sans)">${mdLite(T['README.md'])}</div>`;
      const cs = [...ancestors(tip)].map(x => W.obj[x]).sort((a, b) => b.t - a.t).slice(0, 8);
      h += `<b style="font-size:13px">Commits em ${R.def}</b><div class="box">${cs.map(c => `<div class="row"><span class="id">${short(c.id)}</span><span class="grow">${esc(c.msg)}</span>${c.signed && W.ghKeys.some(k => k.key === c.key && k.type === 'signing') ? '<span class="pill ok">Verified</span>' : ''}<span class="small">${esc(c.author)}</span></div>`).join('')}</div>`;
    }
    if (mine) h += `<details class="form"><summary><b>Adicionar ou editar arquivo pela web</b></summary><label class="small" for="wfName">Nome do arquivo</label><input id="wfName" placeholder="README.md"><label class="small" for="wfTxt">Conteúdo</label><textarea id="wfTxt"></textarea><label class="small" for="wfMsg">Mensagem do commit</label><input id="wfMsg" placeholder="Descreva a mudança"><div class="inl"><button class="btn pri" data-act="webCommit">Commit na ${R.def}</button><select id="licSel" aria-label="Licença"><option>MIT</option><option>GPL-3.0</option><option>CC-BY-4.0</option></select><button class="btn" data-act="lic">Adicionar licença</button></div></details>`;
  } else if (S.sub === 'prs') {
    h += R.prs.length ? `<div class="box">${R.prs.slice().reverse().map(p => {
      const st = p.state === 'open' ? '<span class="pill ok">aberto</span>' : p.state === 'merged' ? '<span class="pill" style="color:#8250df;border-color:#8250df">mesclado</span>' : '<span class="pill bad">fechado</span>';
      const ck = p.checks ? `<span class="pill ${p.checks === 'ok' ? 'ok' : 'bad'}">CI ${p.checks === 'ok' ? '✓' : '✗'}</span>` : '';
      const ap = p.approvals.length ? '<span class="pill ok">aprovado</span>' : (R.protect && R.reqReview ? '<span class="pill tag">aguarda revisão</span>' : '');
      const mg = p.state === 'open' ? prMergeable(p) : null;
      return `<div class="row"><span class="id">#${p.n}</span><span class="grow"><b>${esc(p.title)}</b><br><span class="small mono">${esc(p.headRepo.split('/')[0])}:${esc(p.head)} → ${esc(p.base)}</span>${p.checks === 'fail' ? `<br><span class="small" style="color:var(--bad)">${esc(p.checkDetail.results[0].why)}</span>` : ''}${mg && mg.conflicts.length ? `<br><span class="small" style="color:var(--bad)">Conflitos com ${esc(p.base)}: ${esc(mg.conflicts.join(', '))}</span>` : ''}</span>${st}${ck}${ap}${p.state === 'open' ? `<button class="btn sm" data-act="aprova" data-arg="${p.n}">Colega aprova</button><button class="btn sm pri" data-act="merge" data-arg="${p.n}">Mesclar</button><button class="btn sm" data-act="squash" data-arg="${p.n}">Squash</button>` : ''}</div>`;
    }).join('')}</div>` : '<p class="small">Nenhum pull request. Envie um ramo e use <code>gh pr create --title "..."</code>.</p>';
  } else if (S.sub === 'issues') {
    h += R.issues.length ? `<div class="box">${R.issues.map(i => `<div class="row"><span class="id">#${i.n}</span><span class="grow"><b>${esc(i.title)}</b>${i.body ? '<br><span class="small">' + esc(i.body) + '</span>' : ''}</span>${i.label ? `<span class="pill tag">${esc(i.label)}</span>` : ''}<span class="pill ${i.state === 'open' ? 'ok' : ''}">${i.state === 'open' ? 'aberta' : 'fechada'}</span></div>`).join('')}</div>` : '<p class="small">Nenhuma issue.</p>';
    h += `<div class="form"><b>Nova issue</b><label class="small" for="niT">Título</label><input id="niT"><label class="small" for="niL">Label (opcional)</label><input id="niL" placeholder="good first issue"><div class="inl"><button class="btn pri" data-act="novaIssue">Criar issue</button></div></div>`;
  } else if (S.sub === 'actions') {
    h += `<p class="small">${R.visibility === 'public' ? 'Repositório público: minutos de Actions ilimitados nos runners padrão.' : 'Repositório privado: ' + R.minutes + ' de 2.000 minutos grátis usados neste mês (Windows conta 2×, macOS 10×).'}</p>`;
    h += R.runs.length ? `<div class="box">${R.runs.slice(0, 12).map(r => `<div class="row"><span class="pill ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✓' : '✗'}</span><span class="grow"><b>${esc(r.wf)}</b> · ${r.event === 'push' ? 'push em ' : ''}${esc(r.label)} · <span class="id">${short(r.commit)}</span><br><span class="small">${r.jobs.map(j => esc(j)).join(' · ')}${r.selfHosted ? ' · runner self-hosted' : ''}${r.why ? ' · ' + esc(r.why) : ''}</span></span>${r.minutes ? `<span class="small">${r.minutes} min</span>` : ''}</div>`).join('')}</div>` : '<p class="small">Nenhuma execução. Crie um arquivo em <code>.github/workflows/</code> e faça push.</p>';
  } else if (S.sub === 'seg') {
    h += `<div class="box"><div class="row"><span class="grow">Push protection (segredos)</span><span class="pill ${R.pushProtection && R.visibility === 'public' ? 'ok' : ''}">${R.visibility === 'public' ? (R.pushProtection ? 'ativo · grátis em público' : 'desativado') : 'privado: Secret Protection é pago (Módulo 7)'}</span></div><div class="row"><span class="grow">Dependabot</span><span class="pill ${R.dependabot ? 'ok' : ''}">${R.dependabot ? 'ativo' : 'desativado'}</span></div><div class="row"><span class="grow">CodeQL (code scanning)</span><span class="pill ${R.codeql ? 'ok' : ''}">${R.codeql ? 'ativo' : R.visibility === 'public' ? 'desativado' : 'privado: Code Security é pago'}</span></div></div>`;
    h += al.length ? `<b style="font-size:13px">Alertas abertos</b><div class="box">${al.map(a => `<div class="row"><span class="pill bad">${a.kind}</span><span class="grow">${esc(a.text)}<br><span class="small mono">${esc(a.file)}</span></span></div>`).join('')}</div>` : '<p class="small">Nenhum alerta aberto.</p>';
  } else if (S.sub === 'pages') {
    W.flags.add('viewed-pages');
    if (!R.pages) h += '<p class="small">O GitHub Pages está desativado. Ative em Configurações.</p>';
    else if (R.visibility !== 'public') h += '<p class="small">Pages em repositório privado exige plano pago (Módulo 7).</p>';
    else h += `<div class="pages"><p class="small">Publicado em <b class="mono">https://${R.owner}.github.io/${R.name}</b> · atualizado a cada push na ${R.def}</p><iframe sandbox="" title="Site publicado" srcdoc="${esc(T['index.html'] || '<p>Sem index.html na main.</p>')}"></iframe></div>`;
  } else if (S.sub === 'config') {
    if (!mine) h += '<p class="small">Você não é dono nem colaborador deste repositório: as configurações ficam com o dono. Faça um fork para ter o seu.</p>';
    else {
      const priv = R.visibility === 'private';
      const ck = (k, t, d, paid) => `<label class="set"><input type="checkbox" data-act="set" data-arg="${k}" ${R[k] ? 'checked' : ''} ${paid && priv ? 'disabled' : ''}><span><b>${t}</b><br><span class="small">${d}</span>${paid && priv ? '<br><span class="pago">Em repositório privado, isto exige plano pago (Módulo 7).</span>' : ''}</span></label>`;
      h += `<div class="box"><div class="set"><span class="grow"><b>Visibilidade</b><br><span class="small">Público: qualquer pessoa vê. Privado: só você e colaboradores.</span></span><select data-act="vis" aria-label="Visibilidade"><option value="public" ${!priv ? 'selected' : ''}>Público</option><option value="private" ${priv ? 'selected' : ''}>Privado</option></select></div>
      ${ck('protect', 'Proteger a ' + R.def, 'Exige pull request: ninguém envia direto para a ' + R.def + '.', true)}
      ${ck('reqReview', 'Exigir 1 aprovação', 'O PR só pode ser mesclado depois da revisão de outra pessoa.', true)}
      ${ck('reqChecks', 'Exigir CI passando', 'O PR só pode ser mesclado com as verificações em ✓.', true)}
      ${ck('pushProtection', 'Push protection', 'Bloqueia pushes que contenham senhas e tokens.', true)}
      ${ck('dependabot', 'Dependabot', 'Avisa sobre dependências com vulnerabilidades conhecidas.', false)}
      ${ck('codeql', 'CodeQL', 'Varredura de código em busca de vulnerabilidades.', true)}
      ${ck('pages', 'GitHub Pages', 'Publica o site a partir da ' + R.def + '.', true)}</div>
      <div class="form"><b>Colaboradores</b><span class="small">${R.collaborators.length ? R.collaborators.map(esc).join(', ') : 'nenhum'}</span><div class="inl"><label for="colab" class="small">Usuário</label><input id="colab" placeholder="colega"><button class="btn" data-act="colab">Convidar</button></div></div>`;
    }
  }
  return h;
}
function painelConta() {
  const C = W.conta || {};
  return `<div class="form"><b>Perfil público</b><label class="small" for="pfNome">Nome</label><input id="pfNome" value="${esc(C.nome || '')}"><label class="small" for="pfBio">Bio</label><input id="pfBio" value="${esc(C.bio || '')}" placeholder="ex.: Aluno do Prof. Jon"><div class="inl"><button class="btn pri" data-act="perfil">Salvar perfil</button><span class="small">${esc(C.email || '')}</span></div></div>
  <div class="box"><label class="set"><input type="checkbox" data-act="twofa" ${W.twofa ? 'checked' : ''}><span><b>Autenticação em dois fatores (2FA)</b><br><span class="small">Pede um código do app autenticador além da senha. Obrigatória para quem contribui com código.</span></span></label>
  <div class="set"><span><b>Chaves SSH</b><br><span class="small">${W.ghKeys.length ? W.ghKeys.map(k => esc(k.title) + ' (' + (k.type === 'signing' ? 'assinatura' : 'autenticação') + ')').join(', ') : 'Nenhuma. Gere com ssh-keygen e cadastre com gh ssh-key add.'}</span></span></div>
  <div class="set"><span><b>GitHub CLI</b><br><span class="small">${W.auth ? 'Logado no terminal (gh auth login).' : 'Não logado no terminal.'}</span></span></div></div><div class="exbtns"><button class="btn" data-act="gsub" data-arg="codigo">Voltar aos repositórios</button><button class="btn" data-act="logout">Sair da conta</button></div>`;
}
function mdLite(t) { return t.split('\n').map(l => /^### /.test(l) ? '<b>' + esc(l.slice(4)) + '</b>' : /^## /.test(l) ? '<b style="font-size:15px">' + esc(l.slice(3)) + '</b>' : /^# /.test(l) ? '<b style="font-size:18px">' + esc(l.slice(2)) + '</b>' : /^- /.test(l) ? '• ' + esc(l.slice(2)) : esc(l)).join('<br>'); }

/* ---------- módulo 7 ---------- */
function custo() {
  const c = S.calc, n = Math.max(1, +c.pessoas || 1); const linhas = [];
  const plano = { free: 0, pro: PRECOS.pro, team: PRECOS.team * n, ent: PRECOS.ent * n }[c.plano];
  if (c.plano === 'pro') linhas.push(['GitHub Pro (1 pessoa)', c.edu ? 0 : plano]); else if (plano) linhas.push(['GitHub ' + (c.plano === 'team' ? 'Team' : 'Enterprise') + ' × ' + n, plano]);
  const cp = { none: 0, free: 0, pro: PRECOS.cpPro * n, biz: PRECOS.cpBiz * n, ent: 39 * n }[c.copilot];
  if (c.copilot !== 'none') linhas.push(['Copilot ' + { free: 'Free', pro: 'Pro', biz: 'Business', ent: 'Enterprise' }[c.copilot] + (c.copilot !== 'free' ? ' × ' + n : ''), c.edu && (c.copilot === 'pro') ? 0 : cp]);
  if (c.secret) linhas.push(['Secret Protection × ' + n, PRECOS.secret * n]);
  if (c.code) linhas.push(['Code Security × ' + n, PRECOS.code * n]);
  const total = linhas.reduce((s, l) => s + l[1], 0);
  return { linhas, total };
}
function renderM7() {
  const c = S.calc, k = custo(); const fmt = v => 'US$ ' + v.toLocaleString('pt-BR');
  const avisos = [];
  if ((c.secret || c.code) && c.plano === 'free') avisos.push('Secret Protection e Code Security são vendidos para organizações nos planos Team ou Enterprise.');
  if (c.copilot === 'biz' && c.plano === 'free') avisos.push('Desde abril de 2026, novos cadastros do Copilot Business ficaram suspensos para organizações Free e Team: confira a disponibilidade.');
  if (c.copilot === 'ent' && c.plano !== 'ent') avisos.push('O Copilot Enterprise exige o GitHub Enterprise.');
  if (c.edu) avisos.push('Com GitHub Education, o Pro e o Copilot individual saem a US$ 0 para alunos e professores verificados.');
  $('#main').innerHTML = `<div class="m7"><section><h2>Calculadora de custo mensal</h2><p class="small">Monte a combinação e veja o custo. Preços de novembro de 2026, em dólar: confira github.com/pricing.</p>
  <div class="calc"><label for="cPess">Pessoas na equipe<input id="cPess" type="number" min="1" value="${c.pessoas}" data-calc="pessoas"></label>
  <label for="cPlano">Plano do GitHub<select id="cPlano" data-calc="plano">${[['free', 'Free (US$ 0)'], ['pro', 'Pro (US$ 4, individual)'], ['team', 'Team (US$ 4/usuário)'], ['ent', 'Enterprise (US$ 21/usuário)']].map(([v, t]) => `<option value="${v}" ${c.plano === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
  <label for="cCop">Copilot<select id="cCop" data-calc="copilot">${[['none', 'Sem Copilot'], ['free', 'Copilot Free (US$ 0)'], ['pro', 'Copilot Pro (US$ 10/pessoa)'], ['biz', 'Copilot Business (US$ 19/usuário)'], ['ent', 'Copilot Enterprise (US$ 39/usuário)']].map(([v, t]) => `<option value="${v}" ${c.copilot === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
  <label class="ck" for="cSec"><input id="cSec" type="checkbox" data-calc="secret" ${c.secret ? 'checked' : ''}> Secret Protection (US$ 19/committer)</label>
  <label class="ck" for="cCode"><input id="cCode" type="checkbox" data-calc="code" ${c.code ? 'checked' : ''}> Code Security (US$ 30/committer)</label>
  <label class="ck" for="cEdu"><input id="cEdu" type="checkbox" data-calc="edu" ${c.edu ? 'checked' : ''}> Somos verificados no GitHub Education</label></div>
  <div style="margin-top:14px" class="small">Total por mês</div><div class="total">${fmt(k.total)}</div><div class="small">${fmt(k.total * 12)} por ano</div>
  <div class="linhas" style="margin-top:8px">${k.linhas.map(l => `<div><span>${l[0]}</span><span>${fmt(l[1])}</span></div>`).join('') || '<div><span>Tudo no plano Free</span><span>US$ 0</span></div>'}</div>
  ${avisos.map(a => `<div class="pq" style="margin-top:8px;font-size:13px;background:var(--soft);border-radius:6px;padding:7px 10px">${a}</div>`).join('')}
  <h3 style="font-size:15px;margin:18px 0 6px">O que o Free já cobre, sem pagar nada</h3><ul class="small" style="margin:0;padding-left:18px"><li>Repositórios públicos e privados ilimitados, colaboradores ilimitados</li><li>Em público: proteção de branch, Actions sem limite, Pages, CodeQL e push protection</li><li>Em privado: 2.000 min de Actions e 120 h de Codespaces por mês</li><li>Dependabot, issues, Projects, releases e GitHub CLI</li></ul></section>
  <section><h2>Cenários: qual é a escolha certa?</h2><p class="small">Escolha a opção que resolve o caso com o menor custo.</p>${CENARIOS.map(cn => { const r = S.m7[cn.id]; return `<div class="cen"><h3>${cn.titulo}${S.feitos.has(cn.id) ? ' <span class="pill ok">✓</span>' : ''}</h3><div class="small" style="color:var(--ink)">${cn.texto}</div><div class="ops">${cn.opcoes.map((o, i) => `<button data-act="cen" data-arg="${cn.id}:${i}" class="${r !== undefined ? (i === cn.certa ? 'certa' : i === r ? 'errada' : '') : ''}">${o}</button>`).join('')}</div>${r !== undefined ? `<div class="pq">${r === cn.certa ? 'Isso! ' : 'Não é essa. '}${cn.porque}</div>` : ''}</div>`; }).join('')}</section></div>`;
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && t.type !== 'checkbox')) return;
  const a = t.dataset.act, g = t.dataset.arg;
  const R = W && W.gh[S.repo];
  const msg = m => { if (m) toast(m); update(); };
  switch (a) {
    case 'mod': S.mod = +g; if (S.modo === 'pratica' && S.mod !== 7) { const l = S.mod === 0 ? 'lab' : S.lastEx[S.mod]; if (l) abrirEx(l, true); else S.ex = null; } render(); break;
    case 'praticar': S.modo = 'pratica'; S.mod = +g; if (S.mod !== 7) { const l = S.lastEx[S.mod]; if (l && (!S.ex || curEx()?.mod !== S.mod)) abrirEx(l, true); else if (curEx()?.mod !== S.mod) S.ex = null; } render(); break;
    case 'ex': abrirEx(g); render(); break;
    case 'dica': S.dica++; update(); break;
    case 'sol': S.sol = !S.sol; update(); break;
    case 'reset': S.confirmReset = true; update(); break;
    case 'resetNao': S.confirmReset = false; update(); break;
    case 'resetSim': abrirEx(S.ex, false, true); toast('Exercício reiniciado'); break;
    case 'put': if (!g) break; $('#cmd').value = g; $('#cmd').focus(); $('#cmd').dispatchEvent(new Event('input')); break;
    case 'explica': S.explica = !S.explica; t.setAttribute('aria-pressed', S.explica); t.textContent = 'Explicações ' + (S.explica ? 'ligadas' : 'desligadas'); persistUI(); break;
    case 'chip': $('#cmd').value = g; $('#cmd').focus(); $('#cmd').dispatchEvent(new Event('input')); if (g.endsWith('""')) $('#cmd').setSelectionRange(g.length - 1, g.length - 1); break;
    case 'nota': { const ex = curEx(); const sol = typeof ex.solucao === 'function' ? ex.solucao.call(ex) : ex.solucao; const r = sol[+g].fn(); S.term.push({ c: 'info', t: '⚙ ' + sol[+g].nota }); msg(typeof r === 'string' ? r : ''); break; }
    case 'tab': S.tab = g; update(); break;
    case 'gsub': S.sub = g; S.viewRemote = null; update(); break;
    case 'repo': S.repo = g; S.viewRemote = null; if (S.sub === 'conta' || S.sub === 'novo') S.sub = 'codigo'; update(); break;
    case 'vf': S.viewFile = S.viewFile === g ? null : g; update(); break;
    case 'vr': S.viewRemote = S.viewRemote === g ? null : g; update(); break;
    case 'edit': W.editor = g; update(); break;
    case 'edSave': W.local.files[W.editor] = $('#edTxt').value; S.term.push({ c: 'info', t: '(arquivo ' + W.editor + ' salvo)' }); S.viewFile = W.editor; W.editor = null; update(); break;
    case 'edClose': W.editor = null; update(); break;
    case 'signup': { const r = webSignup($('#suUser').value, $('#suMail').value, $('#suPass').value); W.conta.criada ? msg(r) : toast(r); break; }
    case 'verify': { const r = webVerify($('#vCode').value); W.conta.verificado ? msg(r) : toast(r); break; }
    case 'login': { const r = webLogin($('#liId').value, $('#liPass').value); W.conta.logado ? msg(r) : toast(r); break; }
    case 'perfil': msg(webPerfil($('#pfNome').value, $('#pfBio').value)); break;
    case 'logout': S.sub = 'codigo'; msg(webLogout()); break;
    case 'twofa': W.twofa = t.checked; msg(W.twofa ? '2FA ativada: use o app autenticador ao entrar.' : '2FA desativada'); break;
    case 'novoRepo': { const n = $('#nrName').value.trim().replace(/\s+/g, '-'); if (!n) { toast('Informe o nome'); break; } const r = webCreateRepo(n, document.querySelector('input[name=nrVis]:checked').value, $('#nrReadme').checked); S.repo = W.user + '/' + n; S.sub = 'codigo'; msg(r); break; }
    case 'webCommit': msg(webAddFile(S.repo, $('#wfName').value.trim(), $('#wfTxt').value, $('#wfMsg').value.trim())); break;
    case 'lic': msg(webLicense(S.repo, $('#licSel').value)); break;
    case 'set': { const r = webSet(S.repo, g, t.checked); msg(r); break; }
    case 'colab': msg(webCollab(S.repo, $('#colab').value.trim())); break;
    case 'aprova': { const p = R.prs.find(x => x.n === +g); S.term.push({ c: 'info', t: colegaAprova(p) }); update(); break; }
    case 'merge': case 'squash': { const p = R.prs.find(x => x.n === +g); msg(mergePR(p, a === 'squash' ? 'squash' : 'merge')); break; }
    case 'novaIssue': { const tt = $('#niT').value.trim(); if (!tt) { toast('Informe o título'); break; } R.issues.push({ n: R.prs.length + R.issues.length + 1, title: tt, body: '', label: $('#niL').value.trim(), state: 'open', author: W.user }); msg('Issue criada'); break; }
    case 'cen': { const [id, i] = g.split(':'); S.m7[id] = +i; const cn = CENARIOS.find(x => x.id === id); if (+i === cn.certa) { S.feitos.add(id); salvar(); } persistUI(); render(); break; }
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act === 'vis') { webSet(S.repo, 'visibility', t.value); update(); toast('Visibilidade alterada'); }
  if (t.dataset.calc) { S.calc[t.dataset.calc] = t.type === 'checkbox' ? t.checked : t.value; persistUI(); renderM7(); }
});
$('#bTeoria').onclick = () => { S.modo = 'teoria'; if (S.mod === 0) S.mod = 1; render(); };
$('#bPratica').onclick = () => { S.modo = 'pratica'; if (S.mod === 8) S.mod = 1; if (S.mod !== 7) { const cur = curEx(); if (!cur || cur.mod !== S.mod) { const l = S.mod === 0 ? 'lab' : S.lastEx[S.mod]; if (l) abrirEx(l, true); else S.ex = null; } } render(); };
function rota() {
  const h = location.hash.slice(1); let m;
  if ((m = h.match(/^teoria-(\d)$/))) { S.modo = 'teoria'; S.mod = +m[1]; }
  else if (h === 'pratica-7') { S.modo = 'pratica'; S.mod = 7; }
  else if (h === 'pratica-lab') { S.modo = 'pratica'; S.mod = 0; S.ex = 'lab'; abrirEx('lab', true); }
  else if ((m = h.match(/^pratica-(\d)-(\d)$/))) { S.modo = 'pratica'; S.mod = +m[1]; const id = m[1] + '.' + m[2]; if (EXERCICIOS.some(e => e.id === id)) { S.ex = id; abrirEx(id, true); } }
  render();
}
window.addEventListener('hashchange', () => { const want = location.hash.slice(1); const cur = S.modo === 'teoria' ? 'teoria-' + S.mod : S.mod === 7 ? 'pratica-7' : 'pratica-' + (S.ex || '').replace('.', '-'); if (want !== cur) rota(); });
base(); rota();
