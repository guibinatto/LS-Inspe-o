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
| clica-tudo.js `[limite por página]` | percorre as 14 páginas e o topo clicando em cada elemento interativo; registra erros de JavaScript, erros de console, diálogos nativos e cliques sem efeito | 387 cliques, 0 erros, 0 sem efeito |
| consulta.js | buscas por nome, código de proposta, cidade e frase ("SC acima de 500 mil") na Consulta detalhada | resultados conferidos |
