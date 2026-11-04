# Painel Executivo LS Fire — versão em arquivos separados

Gerada com `node ferramentas/separar.js` a partir do arquivo único
`Painel-Executivo-LS-Fire-2026-10-26.html`, que **continua sendo a fonte**. Para mudar
o painel, altere o arquivo único e gere de novo; não edite estes arquivos à mão.

| Arquivo | Conteúdo |
|---|---|
| `index.html` | estrutura das telas e as bases embutidas (`seed-dados`, `seed-config`) |
| `styles.css` | todo o CSS do painel (tokens claro/escuro, componentes, impressão, celular) |
| `app.js` | toda a lógica: leitura das planilhas, motor de indicadores, telas, gráficos, relatórios, exportações |

Chart.js 4.4.1 e SheetJS 0.18.5 vêm de CDN (cdnjs, com jsDelivr de reserva), nas mesmas
versões do arquivo único.

## Quando usar cada versão

- **Arquivo único**: para abrir com dois cliques, mandar por e-mail, usar sem internet e
  publicar no Claude. O "↓ Salvar" gera uma cópia completa.
- **Arquivos separados**: para hospedar num servidor/intranet e manter o código. Precisa
  de internet (CDN) e dos três arquivos na mesma pasta. O "↓ Salvar" gera um novo
  `index.html` com os dados atualizados; coloque-o no lugar do antigo, junto de
  `styles.css` e `app.js`.
- Abrindo direto do disco (`file://`), os relatórios em HTML baixados levam o CSS por
  referência ao `styles.css` local. Servida por http(s), o CSS vai embutido no arquivo.
