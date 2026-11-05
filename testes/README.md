# Testes automatizados (Playwright + Chromium)

Rodar com: `node testes/<arquivo>.js "$PWD/Painel-Executivo-LS-Fire-2026-10-26.html"`

| Arquivo | O que verifica | Resultado em 31/10/2026 |
|---|---|---|
| periodos.js | comparativos: semana parcial, mês completo, fevereiro, bissexto, trimestres, virada ISO, últimos 7 dias, intervalo | 13/13 |
| regras-criticas.js | deduplicação, prazo não avaliável, acompanhamento do negócio, recorte em tela/relatório/planilha, seções vazias, período específico, fotografia ausente/presente, fechamento e retificação, rateio por dias úteis, versão/conflito/exclusão, JSON antigo, reabertura, base vazia, ausente/zero/negativo | 18/18 |
| central.js | telas × atalhos, ISO, passos, compromissos, reuniões, 7 relatórios, planilha, salvar→reabrir, nova carga, celular | 26/26 |
| totais.js | totais conciliados (pedidos, faturamento, carteira, NFs), filtros, data de referência, bases vazias, celular | 19/19 |
| graficos-interface.js | cascata reconcilia, cascata só com histórico, padrão dos gráficos (título, pergunta, período, unidade, fonte, tabela, nome acessível), Ver tabela, clique e teclado abrem a lista filtrada, mapa de calor, ficha do negócio, cores e tipografia, menu recolhível, botões com ação, 390/768 px | 11/11 |
| revisao-visual.js `<pasta>` | gera os 7 relatórios, mede margens, folhas altas, fonte mínima e salva imagens | 0 fora da margem |

`central.js` e `totais.js` importam as planilhas de 30/10 de `/tmp/lsin/{a,b,c}` (comparativo, faturamento mensal, carteira); ajuste o caminho para rodar em outra máquina.
| clica-tudo.js `[limite] [largura] [escuro]` | percorre as 14 páginas e o topo clicando em cada elemento interativo; registra erros de JavaScript, erros de console, diálogos nativos, cliques sem efeito e texto com contraste abaixo de 3:1 | desktop 315, celular 246, tema escuro 203 cliques: 0 erros, 0 sem efeito, 0 contraste baixo |
| consulta.js | buscas por nome, código de proposta, cidade e frase ("SC acima de 500 mil") na Consulta detalhada | resultados conferidos |
| desfecho-manual.js | registrar perda pelo painel: sai do pipeline e da previsão, alerta, desfazer | ok |
| leitura-celular.js | leitura do relatório no celular, modo claro e escuro do aparelho: contraste e largura | contraste mínimo 4,7:1, sem rolagem lateral |
| versao-separada.js `<Painel.html> <pasta>` | versão em arquivos separados (index.html + styles.css + app.js, Chart.js e SheetJS por CDN) contra o arquivo único: mesmas telas, sem erros, giro no botão de exportação, planilha válida, CSS nos relatórios baixados, "↓ Salvar", tabelas com rolagem lateral e 1ª coluna fixa no celular. Rodar com `LANG=C.UTF-8` | 31/31 (04/11/2026) |
| contratos.js `[Contratos.xlsx OS.xlsx]` | contratos de serviço: importação das planilhas do Omie, vigência com e sem ano, número do contrato, toda OS contada uma vez, meses sem OS, vencimento e renovação no Ploomes, referência no passado, tela, cliques, Excel, capítulo nos relatórios mensal e trimestral, celular. Rodar com `LANG=C.UTF-8` | 25/25 com as bases embutidas (05/11/2026) |
