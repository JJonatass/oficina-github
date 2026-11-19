import re
js='\n'.join(open('src/'+f).read() for f in ['engine.js','explica.js','teoria.js','exercicios.js','ui.js'])
assert '</script' not in js.lower()
html=open('src/shell.html').read().replace('/*__JS__*/',js)
open('index.html','w').write(html)
print(len(html))
