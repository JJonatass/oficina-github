# Oficina GitHub

Simulador educacional para aprender Git e GitHub do zero, no navegador. Cada módulo tem uma parte **teórica** e uma **prática** com exercícios, terminal simulado (`git` e `gh`), visualização dos arquivos, grafo de commits e um GitHub simulado (pull requests, issues, Actions, segurança, Pages e configurações).

## Módulos

1. Fundamentos: conta, terminal, 2FA, README e licenças
2. Git no terminal: as três áreas, commit, push, pull, .gitignore e como desfazer
3. Colaboração: ramos, pull requests, issues, proteção da main e fork
4. Fluxos avançados: conflitos, vários PRs, rebase, reset, stash, cherry-pick e reflog
5. Pro: GitHub Actions, Pages, Dependabot, Conventional Commits e releases
6. Avançado gratuito: bisect, hooks, commits assinados, CodeQL, matriz de CI e API
7. Ferramentas pagas: planos, Copilot, segurança avançada e calculadora de custos

O progresso de cada aluno fica salvo no navegador (localStorage).

## Estrutura

- `index.html`: a página publicada (arquivo único, gerado)
- `src/engine.js`: motor do Git/GitHub simulado
- `src/explica.js`: explicações dos comandos para iniciantes
- `src/teoria.js`: conteúdo teórico e glossário
- `src/exercicios.js`: exercícios, metas e soluções
- `src/ui.js` e `src/shell.html`: interface
- `build.py`: monta o `index.html` a partir de `src/`
- `tests/solucoes.js`: executa a solução de cada exercício e confere as metas

## Como alterar

```bash
python3 build.py        # gera o index.html
node tests/solucoes.js  # confere se todos os exercícios continuam sendo concluídos
```

Prof. Jon · profjon
