# Revisão do Painel Executivo LS Fire — relatório gerencial comercial

Arquivo: `Painel-Executivo-LS-Fire.html` (só o código; os dados ficam fora do git — ver ARQUITETURA.md, "Dados fora do git").
Referência dos números abaixo: **ano 2026, até 30/10/2026**, sem filtros.

---

## Rodada de 31/10/2026 (3) — reformulação visual, gráficos e infográficos

### 0. Referências
Nenhuma das cinco referências (SAP Business One, Salesforce Trailhead, IBM Carbon — dashboards e gráficos, Atlassian — cores) pôde ser consultada: os domínios não resolvem na rede desta sessão (learning.sap.com, trailhead.salesforce.com, carbondesignsystem.com e atlassian.design precisam ser liberados nas configurações de rede do ambiente). Foram aplicados os princípios conhecidos dessas fontes:
- SAP: visão geral com indicadores, gráficos e listas com detalhe;
- Salesforce: mudanças do pipeline por categoria;
- Carbon: um gráfico por pergunta, com título, eixos a partir de zero e tabela alternativa;
- Atlassian: paleta categórica fixa, cores de estado separadas das categorias e sem depender só de cor.

### 1. Diagnóstico visual (medido antes de alterar)
- **Contraste:**
  - texto secundário com 3,1:1 sobre branco (mínimo 4,5:1);
  - texto branco sobre o laranja da marca com 3,3:1;
  - laranja da marca (usado também como cor do SEQ) contra o vermelho de "crítico": 1,3:1, ou seja, indistinguíveis.
- **SEQ e SPV:** coloridos com laranja e marrom, as mesmas cores da marca e muito próximas das cores de alerta.
- **Tipografia:** números em fonte monoespaçada e texto em Arial, misturados.
- **Cabeçalho:** cerca de 10 controles; o menu lateral não recolhia; os gráficos tinham animação.
- **Gráficos:** não informavam a pergunta respondida, só alguns tinham fonte e unidade, e nenhum oferecia tabela.

### 2. Sistema visual implementado
- **Cores (tokens):**
  - fundo #F3F4F6, superfícies brancas, texto #1F2328, secundário #4A5462, terciário #5E6977 (5,6:1);
  - ação principal #C2410C (texto branco com 5,2:1); laranja #FF6600 só como marca;
  - séries de dados em ardósia e azul;
  - SEQ #2F6FB3 e SPV #7E52B8, fixas em todas as páginas e sem significado de bom ou ruim;
  - estados: favorável #18794A, atenção #9A5B00, crítico #C0281C;
  - paleta categórica de 6 cores sem verde e sem vermelho.
- **Tipografia:** fontes do sistema (Segoe UI, Inter, Roboto, Arial), sem download. Números tabulares. Texto de 14 px, tabelas de 12,5 px, indicadores de 28 px.
- **Forma:** arredondamento de 6 px, sem sombras, bordas discretas, espaçamento em múltiplos de 4. Foco visível; animação desligada e preferência por movimento reduzido respeitada.
- **Estrutura:**
  - menu em ROTINA, ANÁLISE e APOIO, recolhível no computador e com menu de página no celular;
  - Engenharia de aplicação volta a ser página própria;
  - cabeçalho com "Relatórios" e "Salvar"; e-mail, relatório livre e importação foram para o menu "Mais".

### 3. Central de supervisão (nova composição)
1. **Contexto:** página, período, referência, pessoa, divisão e situação de cada base (dias desde a importação, com indicador de cor).
2. **Seis indicadores prioritários**, cada um abrindo a lista de origem, mais quatro alertas secundários.
3. **Execução e resultado nas últimas 8 semanas ISO**, em duas escalas separadas, ao lado da lista de negócios para intervenção (com pontuação e motivo).
4. **Painéis "Agenda da semana", "Compromissos em aberto", "Ações vencidas" e "Bloqueadores e apoio"**, cada um respondendo a uma pergunta.
5. **Infográficos** de distribuição das pendências e de situação das ações (a situação é atual, não um fluxo histórico).
6. **Supervisão por pessoa:** tabela e mapa de calor pessoa × semana, alternando entre interações, propostas e pedidos.
7. **Fila da engenharia** por faixa de espera.

### 4. Gráficos e infográficos (dados reais)
| | Gráfico | Onde |
|---|---|---|
| A | Realizado × meta (bullet: barra a partir de zero e traço da meta) por SEQ, SPV e total, com diferença e atingimento | Resultados |
| B | Evolução: pedidos por semana (colunas) e acumulado × meta (linha, existente) | Central, Resultados |
| C | Cascata do pipeline entre cargas: cada negócio em uma única categoria, início + movimentos = fim, ajuste explícito. Só aparece com duas cargas | Pipeline |
| D | Distribuição por etapa (valor) e mediana de dias na etapa | Pipeline |
| E | Previsão por mês: integral, ponderado e declarado lado a lado (não se somam) | Pipeline |
| F | Interações por semana por tipo (existente) e clientes distintos | Atividades, Central |
| G | Mapa de calor pessoa × semana, uma métrica por vez | Central |
| H | Envelhecimento por faixa (tempo na etapa ou idade), com mediana | Pipeline |
| I–K | Perdas por motivo, Pareto de clientes, carteira por mês de entrega (existentes, agora com "Ver tabela" e CSV) | Propostas, Clientes, Carteira |
| L | Fila de cotação por faixa de espera e analista (espera declarada como aproximação) | Engenharia, Central |
| Infográficos | Ficha do negócio, com caminho oportunidade → proposta → pedido e linha do tempo; faixa de pendências; situação das ações | Central, listas, inspeção |

Todo gráfico novo traz título, pergunta, período, unidade, legenda, fonte, marca de parcial ou estimado, "Ver tabela" e CSV, e o clique abre a lista com o filtro escrito ("Filtro: …"). Os gráficos antigos ganharam "Ver tabela" e CSV gerados a partir dos mesmos números desenhados.

### 5. Relatórios
- Cada modelo abre com um "Resumo do período" próprio, em frases diretas e só com dados:
  - semanal: execução, mudanças, pendências e próximos compromissos;
  - mensal: resultado, comparação, variações observadas por vendedor (sem atribuir causa) e recuperação;
  - trimestral: previsibilidade e gargalos;
  - anual: concentração e planejamento.
- Variação percentual é omitida quando a base é desproporcional (ex.: R$ 2,2 mi contra R$ 12 mil).
- **Paginação:**
  - gráficos lado a lado viram uma coluna;
  - grades, listas de painel e a metodologia são divididas;
  - título de seção não fica sozinho no pé da folha;
  - resultado nos 7 modelos: 0 elementos fora da margem e 0 folhas mais altas que A4, menor fonte de 8,5 px.

### 6. Mudanças nos indicadores
Nenhum total mudou nesta rodada (pedidos 2026 R$ 36.730.682,39, faturamento R$ 47.373.343,28, carteira R$ 31.561.097,75, interações 675). Novos indicadores visuais:
- distribuição das pendências: cada negócio em uma única faixa;
- cascata com reconciliação exata;
- previsão com três medidas separadas.

### 7. Testes executados
Ver `testes/README.md`. Resultados finais da rodada:
- períodos 13/13;
- gráficos e interface 11/11;
- regras críticas 18/18;
- Central 26/26;
- totais 19/19.

Revisão visual em `evidencias/` (páginas dos 7 relatórios) e `evidencias/telas/` (desktop, tablet e celular).

### 8. Limitações restantes
- A cascata, as previsões adiadas e as mudanças entre cargas dependem da segunda importação do export de negócios.
- A ficha da pessoa e alguns gráficos antigos ainda usam o desenho anterior dentro do novo tema; o padrão completo (pergunta, fonte, período) está nos gráficos novos.
- "Executor", tarefas planejadas e prazo da engenharia continuam dependendo de campos que não estão nos exports (ver `ARQUITETURA.md`).

---

## Rodada de 31/10/2026 (2) — base confiável, supervisão e preparação para uso compartilhado

### 1. Diagnóstico (antes de alterar)

Problemas confirmados no código, com teste, antes de corrigir:

- **Período anterior equivalente errado:**
  - a semana parcial 26–28/10 comparava com 23–25/10;
  - setembro completo comparava com 01–30/08, sem o 31/08;
  - a S53/2026 era comparada com a S01/2026.
- **Passo concluído sem prazo** aparecia como "no prazo".
- **Planilha de detalhamento** exportava o plano, os passos, os compromissos e as reuniões de todos, ignorando o filtro.
- **Agenda, prioridades e plano** não respeitavam o filtro de pessoa e divisão.
- **Cálculo de outros períodos** trocava temporariamente a variável global de período (`PER`) dentro de `propsNoPeriodo`.
- **Junção navegador × arquivo** descartava a versão mais nova quando o ID já existia.
- **Prioridade e follow-up** contavam uma interação genérica com a conta como acompanhamento do negócio.
- **"Executor" das interações** era, na verdade, o dono da carteira.
- **Rateio por dias úteis:** era declarado na tela, mas dentro do mês o cálculo usava dias corridos.
- **Pontos facultativos** (carnaval, Corpus Christi) eram tratados como feriados obrigatórios.
- **Relatórios prontos:**
  - desmarcar todas as seções restaurava o padrão sem avisar;
  - os rótulos mostravam IDs internos (ex.: "sup-topo");
  - não havia como escolher um período específico.
- **Avaliação da previsão** contava negócios ganhos antes do início do período e chamava de "real" o valor congelado.

Totais registrados antes e depois, sem alteração:
- pedidos de 2026: R$ 36.730.682,39;
- faturamento de 2026: R$ 47.373.343,28;
- carteira: R$ 31.561.097,75;
- interações: 675 (após remover linhas idênticas).

### 2. Correções por etapa

**Etapa 1 — datas, filtros, persistência e integridade**
- **Períodos:**
  - completo × completo; parcial × mesmo trecho; últimos 7 dias × os 7 anteriores; intervalo × intervalo do mesmo tamanho logo antes;
  - semana do ano anterior pela mesma semana ISO; um ano sem S53 mostra "indisponível".
- **Filtros:** um único recorte (`noRecorte`) para passos, ações, compromissos, reuniões e interações. É usado na tela e na planilha.
- **Persistência:**
  - versão e data de atualização por registro editável;
  - na junção vale a versão mais recente, e a outra fica registrada em "Conflitos";
  - exclusões ficam marcadas e não "ressuscitam";
  - JSON importado é validado e não sobrescreve nada;
  - falha de gravação no navegador gera aviso.
- **Deduplicação:**
  - só remove linhas idênticas em todas as colunas, ou com o mesmo ID quando a coluna existir;
  - casos suspeitos (mesma conta, dia e tipo com conteúdo diferente) ficam sinalizados e não são removidos;
  - modo configurável e lista de exclusões com motivo em Dados → Bases.
  - Correção encontrada pelo teste: o campo "ID original" casava com a coluna "Cidade" (que contém "id"); restringido a nomes exatos.
- **Responsáveis:** "Interações vinculadas à carteira" no lugar de execução pessoal. Acompanhamento do negócio só conta interação registrada no próprio negócio.
- **Passos:** "Concluído — prazo não avaliável" quando falta prazo ou data de conclusão.

**Etapa 2 — motor, histórico e fechamentos**
- **Motor de indicadores:** `indicadores(contexto)` recebe período, referência, pessoa, divisão, filtros, versões das bases e políticas, e devolve o próprio contexto. Não troca mais variáveis globais.
- **Três contextos temporais separados:** movimento do período; posição no encerramento (pela fotografia da data, nunca uma carga posterior, com a defasagem informada); pendência atual.
- **Cabeçalho do quadro de indicadores:** período, referência, fotografia usada, data de geração, versão das regras e cobertura.
- **Fechamentos:** guardam contexto, metas, regras, indicadores, fontes, pedidos, compromissos e ações. É possível abrir, comparar com a apuração atual, regerar o relatório, baixar a planilha e criar uma retificação; o fechamento original é preservado.
- **Metas:** meta esperada até a referência e meta integral. O rateio por dias úteis passou a valer de verdade dentro do mês. Calendário configurável, com pontos facultativos opcionais.
- **Dicionário:** ID, numerador, denominador, tratamento de ausência e versão da regra (v2026.11-2).

**Etapa 3 — supervisão, previsões e relatórios**
- **Central de supervisão, área "Exige atenção":** atividades vencidas, sem próximo passo, sem interação recente (no próprio negócio), propostas atrasadas, previsões vencidas, previsões adiadas (entre cargas), ações vencidas, contas importantes sem acompanhamento e negócios críticos.
- **Central de supervisão, área "Compromissos":** o que ficou combinado, responsável, prazo, situação, bloqueador, apoio e a justificativa da reprogramação.
- **Avaliação das previsões:**
  - só conta negócio ganho dentro do período;
  - mostra a antecedência do registro e marca o registro retrospectivo, que exige justificativa;
  - separa: % de negócios previstos que fecharam, comprometido associado aos ganhos, valor real dos pedidos (pelo PTC; sem pedido vinculado, o valor do negócio, identificado) e desvio financeiro.
- **Ficha da engenharia:** a solicitação é declarada como aproximação; prazo acordado e bloqueios aparecem como indisponíveis, com os campos necessários; a revisão não é tratada como erro.
- **Relatórios:**
  - período específico, além dos atalhos;
  - nomes amigáveis nas seções;
  - seleção vazia gera aviso e não gera nada;
  - "voltar ao padrão" é explícito;
  - pessoa da engenharia recorta pelo analista;
  - no relatório individual, a ficha abre o relatório.

**Etapa 4 — interface:** cartões de alerta reorganizados (grade automática) e seletor de pessoa com vendedores e engenharia separados. Sem rolagem horizontal da página em 390 e 768 px.

**Etapa 5 — arquitetura:** `ARQUITETURA.md` descreve o papel de cada sistema, as camadas, os limites do modelo local, a proposta de backend (PostgreSQL, SSO, permissões, concorrência otimista, cargas automáticas, agendamento, backup) e o caminho de migração.

### 3. Mudanças nos indicadores e motivos

| Indicador | Mudança | Motivo |
|---|---|---|
| Comparativo do período anterior | semana parcial, mês completo e S53 corrigidos | regra de comparação |
| Posição de períodos encerrados | agora indisponível sem fotografia (antes não era exibida ou usava a atual) | não apresentar a posição de hoje como encerramento |
| Negócios sem interação / prioridade de intervenção | 213 dos 227 abertos estão sem interação no próprio negócio há mais de 14 dias; antes, uma interação com a conta reduzia esse número e a pontuação | só conta interação registrada no próprio negócio |
| Meta de semana ou dia com rateio por dias úteis | passa a usar dias úteis também dentro do mês | o método declarado não coincidia com o cálculo |
| Dias úteis | carnaval e Corpus Christi deixam de ser descontados por padrão | ponto facultativo não é obrigatório em todas as unidades |
| Confiabilidade da previsão | ganho fora do período deixa de contar; valor real separado do congelado | regra de avaliação |
| Interações (675) | sem mudança no total; deixou de haver risco de juntar registros diferentes | regra de identidade |

### 4. Testes executados

- **Períodos:** 13 casos, incluindo os obrigatórios (26–28/10 × 19–21/10; setembro × agosto com 31/08; virada ISO; fevereiro; ano bissexto; trimestres de 90, 91 e 92 dias).
- **Regras críticas:** 18 casos:
  - deduplicação;
  - prazo não avaliável e acompanhamento do negócio;
  - recorte na tela, no relatório individual e na planilha;
  - seções vazias e período específico;
  - posição sem e com fotografia;
  - fechamento e retificação;
  - rateio por dias úteis e pontos facultativos;
  - versão, conflito e exclusão;
  - JSON antigo;
  - reabertura do arquivo;
  - base vazia, ausente, zero e negativo.
- **Baterias anteriores:** Central (26) e validação geral (19).
- **Revisão visual:** 7 modelos de relatório, sem nenhum elemento fora da margem, sem folha esticada, fonte mínima de 8,5 px e cabeçalhos repetidos. Imagens na pasta `evidencias/`.

### 5. Limitações restantes

- O pipeline tem uma única carga (26/10). Comparações históricas e previsões adiadas começam na próxima importação.
- Sem export de Tarefas, ID, horário e usuário das interações, não há agenda planejada, executor nem deduplicação por ID.
- Engenharia: faltam data da solicitação, prazo acordado, data de entrega e motivo da revisão.
- Uso compartilhado exige backend (ver `ARQUITETURA.md`); HTML + JSON servem só para uso local e para juntar cópias.
- Telas antigas (por exemplo, partes de Resultados e Desempenho da equipe) ainda têm cálculos próprios, que conferem com o motor nos totais testados. A migração completa para o motor está na lista de próximos passos.

### 6. Próximos passos de arquitetura

Ver `ARQUITETURA.md`, seção 4: API e banco com cargas automáticas, SSO, permissões, concorrência otimista, agendamento e backup.

---

## Rodada de 31/10/2026 — Central de acompanhamento, supervisão e gestão comercial

### 1. Aplicação: navegação e páginas
| Grupo | Página | O que responde |
|---|---|---|
| Rotina | **Central de supervisão** (nova, página inicial) | quem precisa agir, em qual negócio, por qual motivo, até quando |
| Rotina | Visão executiva | resultado, meta, desvios; o plano aparece só em resumo |
| Execução | **Atividades e follow-up** (nova) | interações realizadas, clientes contatados, cobertura do pipeline, próximos passos |
| Execução | Pipeline e inspeção | posição de cada negócio, mudanças entre cargas, previsão e compromisso |
| Execução | Propostas e engenharia | as duas antigas páginas, em abas, sem duplicar |
| Resultado | Resultados e metas | quadro de indicadores do período × anterior equivalente × ano anterior × meta; evolução |
| Resultado | Desempenho por pessoa | ficha individual (reunião 1:1) + equipe com contexto |
| Resultado | Carteira e faturamento · Clientes e mercado | sem mudança de cálculo |
| Gestão | **Reuniões e planos de ação** (nova) | reuniões, compromissos anteriores, ações, reprogramações |
| Gestão | **Central de relatórios** (nova) | 7 modelos prontos + planilha |
| Apoio | Consulta detalhada · Dados e configurações | + critérios, histórico/snapshots, dicionário, dependências |

**Períodos**: diário, semanal (ISO, segunda a domingo), últimos 7 dias (separado da semana-calendário), mensal, trimestral (civil), anual, acumulado e intervalo; atalhos Hoje, Esta semana, Semana anterior, Últimos 7 dias, Este mês, Mês anterior, Este trimestre, Trimestre anterior, Este ano, Ano anterior. "Hoje" no fuso America/Sao_Paulo. Comparações: período anterior equivalente (mesmo trecho quando o período está em andamento) e mesmo período do ano anterior (mesma semana ISO para semanas).

**Central de supervisão**: 6 alertas clicáveis (pendências críticas, atividades vencidas, sem próximo passo, propostas atrasadas, previsões vencidas, ações gerenciais vencidas), agenda da semana, situação por vendedor (cada número abre a lista; o nome abre a ficha), fila da engenharia, negócios que precisam de intervenção com pontuação 0–100 e o motivo, compromissos da última reunião e prioridades da semana. Pontuação = pesos configuráveis × valor, prazo/proximidade do fechamento, tempo sem atividade, reincidência (adiamentos observados e compromisso não cumprido) e importância da conta (conta A = 80% dos pedidos em 24 meses).

**Próximo passo**: o export do Ploomes não traz a próxima tarefa; o painel permite registrar o passo (texto, responsável, prazo). Situações: planejado, vencido (não conclui sozinho), reprogramado (com justificativa obrigatória), concluído no prazo / com atraso, cancelado.

**Inspeção do pipeline**: por negócio — cliente, responsável, valor, etapa e dias, última interação (do negócio ou da conta), próxima atividade, fechamento previsto, categoria, pendências e mudanças desde a carga de referência (novos, ganhos, perdidos, valor ↑/↓, avanço/recuo, previsão trazida/levada/adiada, troca de responsável).

**Previsão e compromisso**: realizado · previsão calculada (política de probabilidade) · declarada pelo vendedor (evidência, bloqueador, próxima ação, data) · revisão da supervisão (justificativa obrigatória, nunca substitui a do vendedor) · cenário potencial. Cada registro é uma versão imutável. Confiabilidade medida só com compromissos encerrados e valores congelados.

**Reuniões**: tipo, data, período, participantes, pessoa, indicadores capturados ao abrir (congelados), decisões, bloqueadores, apoio, status e ações. A reunião seguinte do mesmo tipo/pessoa mostra automaticamente a situação das ações da anterior. Ação só conclui por ato explícito; reprogramação de prazo exige justificativa e fica no histórico.

**Metas por período**: resultado, atividade, prazo e qualidade cadastral; semanal, mensal, trimestral ou anual; escopo empresa, divisão ou pessoa; vigência. Sem meta explícita, rateio da meta maior por dias corridos ou dias úteis (feriados nacionais + carnaval e Corpus Christi), com o método escrito. Alterar meta exige justificativa; mudar metas anuais de ano encerrado também.

### 2. Relatórios prontos (Central de relatórios)
A) Acompanhamento diário · B) Supervisão semanal da equipe · C) Reunião individual do vendedor · D) Acompanhamento semanal da engenharia · E) Fechamento mensal comercial · F) Revisão trimestral · G) Consolidado anual. O usuário escolhe modelo, período (atalho), pessoa e divisão e gera; personalizar seções é opcional e as preferências ficam salvas. Saída em HTML/PDF (texto selecionável) e **planilha .xlsx** com Resumo, Pedidos, Negócios abertos (pendências, mudanças, pontuação), Interações, Propostas, Plano, Próximos passos, Compromissos e Reuniões. Fotografias de períodos encerrados podem ser congeladas.

### 3. Histórico e snapshots
Cada carga diferente do export de negócios vira uma fotografia imutável (data da carga, data efetiva = última atualização no arquivo, fonte, id, cliente, responsável, divisão, valor, etapa, previsão, categoria, situação). **Só existe uma carga até hoje (26/10/2026)** — conferido em todo o histórico do repositório —, por isso as comparações mostram: "Comparação histórica indisponível. Acompanhamento iniciado em 26/10/2026." Diferenças entre cargas são "mudanças observadas entre cargas"; negócio ausente numa carga nova **não** vira perdido. Exportar/Importar JSON junta históricos de cópias diferentes sem sobrescrever nada.

### 4. Correção que afeta números
| Indicador | Antes | Depois | Motivo |
|---|---|---|---|
| Interações registradas (todo o painel) | 2.619 | **675** | 1.944 linhas **idênticas** no export (ex.: 334 registros "Simples" iguais de um cliente num mesmo dia). Contadas uma vez; o número de repetidas aparece em Dados → Bases. Afeta atividades por vendedor, visitas e follow-ups das telas antigas. |
| Indicadores fora da cobertura da base | 0 | **sem base** | Novas oportunidades e propostas antes de 06/07/2026 e interações antes de 11/05/2026 aparecem como indisponíveis, não como zero. |
Pedidos (R$ 36.730.682,39), faturamento (R$ 47.373.343,28), carteira e demais números da rodada anterior não mudaram.

### 5. Dependências e limitações
- **Exige servidor, não simulado**: sincronização entre usuários, login/permissões, agendamento de relatórios e e-mails, captura automática das cargas do Ploomes/ERP.
- **Persistência**: registros ficam no navegador e no arquivo ao usar ↓ Salvar.
- **Atividades**: o export não identifica quem executou nem traz tarefas planejadas. Campos necessários: export de Tarefas (data prevista, conclusão, status, usuário).
- **Engenharia**: faltam data da solicitação, prazo acordado, data de entrega, tempo aguardando informação e motivo de revisão; o cumprimento de prazo aparece como indisponível e revisão não é tratada como erro.

### 6. Validações realizadas (Chromium automatizado)
26 verificações novas aprovadas, além das 19 anteriores (que continuam aprovadas):
- 13 telas × 10 atalhos sem erro.
- Semana ISO na virada do ano: S53/2026 = 28/12/2026–03/01/2027; 01/01/2026 cai na S01 (29/12/2025–04/01/2026).
- 4º trimestre civil correto; últimos 7 dias separados da semana-calendário.
- Mês parcial comparado com o mesmo trecho; semana com a semana ISO anterior e a mesma semana do ano anterior.
- Indicadores do período batem com os pedidos e o faturamento do painel.
- Conversão anual = Σ ganhos ÷ Σ decididos dos meses.
- Aviso de histórico indisponível exibido.
- Próximo passo vencido e reprogramação: sem justificativa é recusada; com justificativa, registrada.
- Compromisso do vendedor e revisão da supervisão ficam em versões separadas; a revisão exige justificativa.
- A reunião seguinte mostra as ações da anterior; ação não conclui sozinha.
- Os 7 relatórios gerados sem nada fora da margem; planilha .xlsx gerada.
- Salvar → reabrir (sem cache do navegador) preserva cargas, passos, compromissos, reuniões e plano.
- Uma nova carga simulada vira snapshot e detecta valor, previsão e responsável; o ausente não vira perdido.
- Sem rolagem horizontal em 390 px e 768 px.

---

## Rodada de 30/10/2026 — planilhas de 30/10 e lacunas da especificação

### A. Alterações no painel interativo
- **Menu** agrupado em VISÃO GERAL (Visão executiva; Resultados e metas), PERSPECTIVAS (Pipeline e previsão de pedidos; Carteira e previsão de faturamento), EFICIÊNCIA COMERCIAL (Propostas e conversão; Desempenho comercial; Engenharia de aplicação), MERCADO (Clientes e mercado) e APOIO (Consulta detalhada; Dados e configurações).
- **Cartões de indicador** agora trazem o tipo (*movimento no período*, *posição na data* ou *estimativa*), a **fonte resumida**, o período e a condição (parcial, estimado, não disponível).
- **Visão executiva**: novo cartão *Faturamento realizado*; faixa de **alertas de consistência** (conciliação oficial × pedidos, carteira × notas fiscais, carteira sem vínculo, vínculos ambíguos) com link para o detalhe.
- **SEQ × SPV**: os valores de pedidos, pipeline, previsão ponderada e saldo a faturar são **clicáveis** e abrem os registros (com CSV). Nota explícita: SEQ/SPV não são as futuras divisões Fire, Water e Industry.
- **Destaques e riscos**: cada item tem constatação, **evidência numérica**, impacto, ação sugerida, critério e **link para o detalhe**. Novos temas: *sem avanço registrado* (parados na etapa), *propostas além do prazo* (fila de cotação acima do SLA) e *divergência entre fontes*. A ordem considera materialidade (R$) e urgência. **Critérios configuráveis** em Dados e configurações → *Critérios dos alertas*.
- **Plano de ação**: campo *Origem (indicador/registro)*; filtros por responsável, prioridade, status e prazo; destaque de ações **vencidas** e **próximas do vencimento**; texto explícito sobre onde fica guardado (navegador + arquivo ao salvar). Recomendações automáticas e decisões do gestor ficam em blocos separados.
- **Resultados e metas**: desvio em R$ e % no cartão da meta; novo cartão **Esforço necessário** (quanto falta por mês para a meta anual, comparado com a média mensal realizada).
- **Carteira e previsão de faturamento**: nova seção **Faturamento realizado** (oficial por mês × ano anterior, notas fiscais clicáveis por mês, conferência NF × oficial) e quadro **Carteira × notas fiscais — a conferir**.
- **Definições** visíveis em Propostas (negócio, proposta, revisão, item, pedido; win rate só com decididos — abertos não são perdas), Engenharia (critério de atribuição: o analista não é responsável pela venda) e Clientes (novo, recorrente, reativado; UF do cliente × UF da obra).
- **Clientes**: a identidade do cliente passou a ser o nome completo normalizado; nomes parecidos **não são mais juntados** (antes juntava pelas duas primeiras palavras).
- **Data de referência salva no arquivo**: o painel salvo guarda a referência (30/10/2026) e, aberto em outro dia, continua lendo os números naquela data, com aviso e botão "Usar a data de hoje". Ao importar planilhas novas, volta automaticamente para hoje.
- **Importação**: lê o *Comparativo de Pedidos e Faturamento* (abas de pedidos e faturamento), a nova base *Notas fiscais emitidas* (relatório mensal; reimportar o mesmo mês não duplica — chave NF + série) e procura a aba e a linha de cabeçalho reconhecidas (a Carteira de 30/10 tem uma aba vazia antes; o Faturamento Mensal tem uma linha de título antes do cabeçalho).

### B. Alterações no relatório exportado (HTML/PDF)
- Diretoria, Equipe e Financeiro incluem a faixa de alertas da Visão executiva; Diretoria e Financeiro incluem **Faturamento realizado**.
- Destaques/riscos saem com evidência e a referência do detalhe ("detalhe: aba → seção").
- Tabelas largas: compactação em dois passos e, como último recurso, largura fixa com quebra de texto. Verificado: **nenhum elemento passa da margem** em Diretoria (39 p.), Financeiro (23 p.), Equipe (76 p.) e Completo (106 p.).

### C. Correções e mudanças que afetam números
| Indicador (2026 até 30/10) | Antes | Depois | Motivo |
|---|---|---|---|
| Pedidos recebidos | R$ 36.593.136 | **R$ 36.730.682,39** | Outubro passa a usar a planilha oficial de 30/10 (R$ 2.400.544,66), que é da própria data de referência; antes usava a soma dos pedidos do mês (R$ 2.262.998,52). Bate com o total do Comparativo. |
| Diferença de conciliação | R$ 153.810 | **R$ 291.357** | + R$ 137.546 de outubro (oficial − pedidos lançados). |
| Saldo a faturar | R$ 30.067.900,57 (carteira de 23/10 transcrita de imagem) | **R$ 31.561.097,75** (53 pedidos, carteira de 30/10) | Carteira nova; original R$ 33.337.760,13, faturado R$ 1.776.662,38. |
| Faturamento realizado | não disponível | **R$ 47.373.343,28** (out parcial: R$ 6.271.562,79 em 22 NFs) | Comparativo Faturamento + notas fiscais. 2025: R$ 32.450.135,03. |
| Pedidos 2025 (referência) | R$ 31.554.769,80 | R$ 31.554.769,80 | Conferido: o Comparativo confirma os valores já cadastrados. |
| Clientes: recompra × sem compra anterior | junção por 2 primeiras palavras | nome completo normalizado | Pode mover clientes de "recompra" para "sem compra anterior" quando eram unidades diferentes com nome parecido. |

Regra nova para o mês em curso: a planilha oficial só vale se for **da própria data de referência**. Com a referência em 15/10, por exemplo, outubro volta para a soma dos pedidos até 15/10 (R$ 34.342.040,65 no ano) e o faturamento de outubro passa a ser a soma das notas até 15/10.

### D. Premissas e limitações
- O Comparativo de Faturamento e as notas fiscais **não têm vendedor nem divisão**: com filtro de vendedor/divisão o faturamento oficial não se aplica e o painel avisa.
- Detalhe nota a nota existe só para **outubro/2026** (único relatório mensal recebido); os demais meses têm só o total oficial.
- **AGEO Leste — PV 500127**: a NF 1662 (23/10, R$ 1.702.829,70) substituiu a NF 1651, mas a carteira de 30/10 ainda mostra o saldo integral e faturado zero. O painel **aponta** a divergência; não corrige nenhum dos lados — confirmar com o financeiro.
- 22 pedidos da carteira de 30/10 (R$ 2,54 mi, incluindo ordens de serviço) não têm correspondente no Controle de Pedidos: ficam sem vendedor, divisão e data de entrega.
- *Esforço necessário* divide o que falta igualmente pelos meses inteiros restantes (o mês em curso conta como já em andamento).
- *Sem avanço registrado* usa o tempo na etapa do Ploomes (não há data do último follow-up no export).
- Responsáveis e prazos do plano de ação nunca são preenchidos automaticamente; o plano começa vazio.

### E. Validações realizadas (Chromium automatizado, 30/10/2026)
19 de 19 verificações aprovadas:
1. Pedidos 2026 = R$ 36.730.682,39 (Comparativo); 2. diferença de conciliação explicada; 3. faturamento 2026 = R$ 47.373.343,28; 4. carteira = R$ 31.561.097,75 em 53 pedidos; 5. NFs de outubro = R$ 6.271.562,79 em 22 notas; 6. pedidos 2025 = R$ 31.554.769,80; 7. faturamento 2025 = R$ 32.450.135,03; 8. divergência AGEO carteira × NF detectada; 9. todas as telas × 4 modos de período × SEQ/SPV/vendedor sem erro de script; 10. com filtro de vendedor, os totais oficiais não se aplicam; 11. ano 2025 fechado; 12. anos 2024/2025 sem erro; 13–14. referência 15/10 (pedidos e faturamento recalculados até a data); 15. salvar → reabrir preserva plano (origem, responsável, prazo), critérios, dados e referência; 16. reimportar o mesmo mês de NF não duplica; 17. bases vazias abrem todas as telas; 18–19. sem rolagem horizontal em 390 px e 768 px.
Relatório: 0 elementos fora da margem nos 4 públicos.

---

## Rodada anterior

## 1. Lista objetiva das alterações

**Organização (abas)** — menu em blocos:
- **Gestão:** Visão executiva · Resultados e metas · Pipeline e previsão de pedidos · Carteira e faturamento.
- **Comercial:** Propostas e conversão · Desempenho comercial · Engenharia de aplicação · Clientes e mercado.
- **Consulta:** Consulta detalhada.
- **Dados:** Dados e configurações.

Para onde foi o conteúdo das abas antigas:
- "Equipe" virou **Desempenho comercial**, só com vendedores. Os blocos de analistas foram para **Engenharia de aplicação**.
- "Win rate & Perdas" entrou em **Propostas e conversão**.
- "Previsão" foi dividida em **Pipeline e previsão de pedidos** e **Carteira e faturamento**.
- Os IDs antigos das abas continuam funcionando, inclusive em configurações salvas.

**Visão executiva (nova).** Seis cards, cada um com valor, unidade, período, base de comparação e condição (parcial, sem meta, aproximação):
- pedidos recebidos;
- atingimento da meta;
- variação contra o período equivalente;
- previsão de pedidos no horizonte;
- saldo a faturar;
- conversão dos negócios decididos.

Depois dos cards:
- gráfico do acumulado realizado × meta × ano anterior;
- tabela gerencial **SEQ × SPV** (pedidos, meta, atingimento, diferença, variação, pipeline elegível, previsão ponderada, saldo a faturar, linha "Sem divisão identificada" e linha "Diferença de conciliação");
- até 5 destaques e até 5 riscos, cada um com constatação, impacto, ação sugerida e critério;
- **plano de ação** editável (prioridade, tema, evidência, ação, responsável, prazo, status e observações). Usa seletores; responsável e prazo nunca são preenchidos automaticamente. É gravado com "↓ Salvar".

Saíram da primeira tela os velocímetros, o termômetro e as roscas que repetiam os mesmos indicadores.

**Período e referência (contexto único)**
- **Data de referência** editável no topo, que é o "hoje" de todo o painel. Registros posteriores a ela ficam fora.
- Recortes: **Ano inteiro, Mês, Acumulado até a referência e Intervalo**.
- **Período equivalente** = as mesmas datas um ano antes: mês parcial × mesmo trecho, acumulado × acumulado, ano fechado × ano fechado.
- Série mensal com **zero confirmado ≠ sem dado ≠ futuro**, considerando a cobertura conhecida das vendas.
- **Projeção por ritmo** com a premissa escrita e separada da previsão das oportunidades.
- **Metas mensais** opcionais (Dados → Metas). Sem elas, a premissa "meta anual dividida igualmente pelos 12 meses" é declarada onde a meta aparece.
- Filtro de cliente, família, região, etapa etc. → "**Sem meta compatível**", em vez de comparar com a meta da empresa.

**Conciliação dos valores**
- Cada pedido mantém o **valor original**.
- O total da empresa segue a planilha oficial nos meses **fechados** e a soma dos pedidos no mês em curso.
- A **diferença de conciliação** aparece em linha própria e não é distribuída entre vendedores, clientes ou produtos.
- O ajuste proporcional antigo continua disponível (Dados → Conciliação, modo "ajustado") e é rotulado como **estimativa**.
- O modo "maior entre fontes" deixou de ser aplicado.
- Cards, gráficos, detalhes e CSV usam o mesmo valor.

**Pipeline e previsão de pedidos**
- Separação entre pipeline bruto, horizonte, valor ponderado, sem previsão, previsão vencida e parados.
- Fica explícito que o pipeline é **posição de carteira**.
- **Política única de probabilidade**, pela classificação do negócio, editável. Cada classe mostra valor integral, probabilidade, ponderado e critério.
- "Garantido" passou a se chamar **"Alta confiança — aguardando pedido"**.
- **Cobertura da meta** calculada só com oportunidades elegíveis até dezembro (com e sem parados).
- A distribuição por estágio é rotulada como **estoque, não conversão**. A conversão histórica entre etapas aparece como "informação insuficiente".
- Negócio aberto cuja proposta já é pedido no Controle (mesmo código e mesmo cliente) **sai do pipeline**. Coincidência só de código é listada para revisão.

**Carteira e faturamento (nova aba)**
- Valor original, já faturado, saldo, entregas vencidas, pedidos sem previsão, sem vínculo, contratos recorrentes (sem cronograma, não alocados num mês) e "sem divisão identificada".
- Previsão de faturamento pelo mês de **entrega**, declarada como aproximação.
- Vínculo de cada pedido com critério e confiança.
- Sem a Carteira carregada, avisa que o valor exibido é o **integral, não o saldo**.
- `aFaturar()` agora aplica os mesmos filtros das outras análises (divisão, vendedor e dimensões).

**Dados e configurações (nova aba).** Subseções:
- **Bases e cobertura:** data de geração, data de referência, data de importação, último registro e cobertura conhecida.
- **Validação da importação:** datas impossíveis e números ambíguos.
- **Metas:** inclui a distribuição mensal.
- **Probabilidades.**
- **Conciliação:** modo de valor, divergências com a planilha oficial, possíveis duplicidades mantidas na soma e vendas fora da soma.
- **Vínculos:** revisão manual das propostas ambíguas e dos vínculos inferidos da carteira.
- **Dicionários:** dimensões, colunas reconhecidas na importação e sinônimos de origem.
- **Glossário:** reescrito com as seis medidas distintas.
- **Exportação.**

**Relatório**
- Seções selecionadas por **ID estável** (`data-sid`), e não pelo começo do título.
- **Ordem editorial própria:** síntese → resultados → desvios → pipeline → carteira → equipes → clientes → plano de ação → metodologia e anexos.
- Aba marcada manualmente **entra inteira**, mesmo fora da seleção do público.
- Sem redução a 55% e sem `overflow:hidden`: blocos e tabelas são **divididos entre folhas**, com o cabeçalho da tabela repetido.
- Síntese limitada a 18 linhas por tabela, com aviso. Tabelas de até 80 linhas vão completas para o anexo; as maiores, para a exportação.
- Página de **metodologia e premissas** e sumário na capa.
- Versão de **leitura para celular** (HTML contínuo, texto selecionável).
- Se a montagem falhar, o painel volta ao estado anterior.

**Layout**
- Cabeçalho com três ações principais (Relatório, E-mail, Salvar) e menu "⋯ Mais".
- No celular: filtros recolhíveis, controles maiores para toque e nenhuma rolagem horizontal da página.
- Aviso quando um filtro não se aplica a uma base usada pela aba.

---

## 2. Correções que afetaram indicadores (antes → depois)

| Indicador (2026 até 30/10) | Antes | Depois | Por quê |
|---|---|---|---|
| Pedidos recebidos — total da empresa | R$ 36,59 mi | **R$ 36,59 mi** (inalterado) | Planilha oficial nos meses fechados + pedidos em outubro. |
| Soma da composição (divisão/vendedor/cliente) | R$ 36,59 mi (valores multiplicados pelo fator do mês) | **R$ 36,44 mi** + diferença de conciliação **R$ 153.810** em linha própria | Valor original de cada pedido. |
| Fábio Dalagnolo | R$ 22,80 mi | **R$ 22,33 mi** | Sem fator proporcional. |
| Lucas Marcius / Guilherme Binatto | R$ 4,30 / 2,77 mi | **R$ 4,57 / 2,87 mi** | Idem. |
| SPV (soma dos pedidos) | R$ 5,12 mi | **R$ 4,96 mi** | Idem. |
| Propostas ganhas | 67 (R$ 16,03 mi) | **64 (R$ 13,26 mi)** | 9 propostas ligavam-se ao negócio ganho de clientes com vários negócios. Agora ficam sem vínculo (ambíguas) e podem ser revisadas em Dados → Vínculos. Ex.: Braskem 10285 (R$ 1,88 mi), Floripa House 10138, Eco Safety 10165. |
| Propostas em aberto / perdidas | 250 / 30 | **254 / 29** | Idem. |
| Propostas com analista | 322 (R$ 185,79 mi) | **313 (R$ 173,99 mi)** | Idem. |
| Pipeline ponderado | R$ 51,81 mi (probabilidade por etapa 5–80%) | **R$ 36,20 mi** | Política única por classificação do negócio, a mesma da previsão. |
| Previsão de pedidos | R$ 7,96 mi ("out–dez", contava 1–29/10 como futuro) | **R$ 6,89 mi** (30/10 a 31/12) | O horizonte começa na data de referência. |
| Previsão vencida | 20 negócios, R$ 4,20 mi | **35 negócios, R$ 7,37 mi** | "Vencida" = data anterior à referência (antes: anterior ao mês corrente). |
| Carteira — entrega vencida | R$ 7,87 mi | **R$ 7,74 mi** (contratos fora) | 2 pedidos ambíguos deixaram de herdar a data de outro pedido; contratos recorrentes não entram como atraso. |
| Carteira ligada ao Controle | 36 de 45 | **34 de 45** (com critério e confiança) | 2 vínculos ambíguos deixaram de ser escolhidos automaticamente. |
| Win rate (decididos) | 185 decididos; 61% em R$ | **186 decididos; 60% em R$** (64% em quantidade, igual) | A perda do Ploomes passou a ser datada pela última atualização (aproximação declarada; 53 perdas), e não pela criação. |
| Meta até a referência | R$ 49,81 mi | **R$ 49,84 mi** | Distribuição por meses (dia a dia no mês) em vez de dias do ano. |
| Projeção (por ritmo) | R$ 44,08 mi | **R$ 44,05 mi** | Idem, sobre o total oficial. |
| Ordem do funil | "Aprovação cadastral" e "Aprovação técnica" iam para o fim | **Na posição correta** | Padrões das etapas sem `norm()` aplicado ao regex. |
| Itens de proposta por categoria | Todo "bomba…" = conjunto motobomba | Bomba avulsa, bomba jockey, conjunto, skid, container, motor, painel, locação, serviços, peças | Classificação revista. |

Outras correções sem efeito nos números atuais (protegem contra erros futuros):
- `jaNoPed` sem o `dd<=10` sem cliente;
- `cobertoPorVnd` exige valor;
- prefixos ambíguos em `empPorNome`;
- `ovDaVenda` não escolhe quando há várias OVs;
- valor negativo não vira positivo em `catsDaVenda`;
- `renderAtual()` inexistente;
- colisão das duas `funilEtapas`;
- chave de cache de `fatoresOficiais` (passou a usar o conteúdo, não o tamanho);
- caches refeitos após importação e configuração;
- referência à tela inexistente "entrega";
- datas impossíveis e números ambíguos na importação.

---

## 3. Premissas e limitações restantes

- **Probabilidades** convencionais (100/60/50/25/10/20%), não estatística histórica: a base de decididos do Ploomes começa em jul/2026. Ajuste com a diretoria em Dados → Probabilidades.
- **Meta mensal** não cadastrada: a meta anual é dividida igualmente por 12 (premissa exibida).
- **Faturamento realizado mensal: não disponível.** Nenhuma base de notas fiscais por mês foi carregada; o "já faturado" é só o parcial da carteira.
- **Previsão de faturamento** usa a data de entrega do Controle como aproximação. Contratos recorrentes não têm cronograma e não são alocados.
- **Data de referência no passado** corta registros por data, mas a situação dos negócios (aberto, ganho, etapa) é a do último export: não dá para reconstruir o pipeline de uma data passada.
- **Conversão entre etapas** não pode ser calculada (o export não traz o histórico de etapas).
- **Perdas do Ploomes** não têm data de desfecho; usam a última atualização (aproximação marcada).
- **Vínculos inferidos** (cliente, valor) são marcados com confiança. Os ambíguos (27 itens de proposta, 2 da carteira) ficam sem vínculo até revisão manual.
- **Carteira de 23/10/2026** transcrita da imagem enviada (o total confere: R$ 30.067.900,57). Substitua pelo arquivo real em Dados → Importação.
- **PDF por imagem** precisa de internet na primeira vez e não tem texto selecionável. Para texto selecionável, use "Imprimir" do navegador (arquivo local) ou a versão de leitura em HTML.
- **Possíveis duplicidades:** nenhuma nas bases atuais. A lista aparece em Dados → Conciliação quando houver.

---

## 4. Validações efetivamente realizadas (Chromium, automatizado)

26 de 26 checagens aprovadas, sem erros de página ou de console:

1. **Totais cruzados**
   - total oficial = soma dos pedidos + diferença (36.593.136 = 36.439.326 + 153.810);
   - divisões + sem divisão = soma;
   - soma por vendedor = soma (nenhum valor ajustado);
   - meses da conciliação = total;
   - card = total oficial;
   - pipeline bruto = tabela de política (128.741.698);
   - previsão = soma por divisão (6.887.313);
   - saldo = soma por divisão = original − faturado (30.067.901);
   - detalhe e CSV = gráfico.
2. **Períodos**
   - mês parcial out/26 × 01–30/10/2025;
   - mês fechado set/26 usa a planilha;
   - acumulado × acumulado;
   - intervalo cortando meses não usa a planilha nos meses cortados;
   - ano histórico 2025 com 12 meses oficiais e meta "Não disponível".
3. **Filtros:** com SEQ, sem total oficial e com a meta SEQ; com UF, "Sem meta compatível".
4. **Data de referência** fixada em 15/09: corta vendas e interações; setembro vira mês em curso; voltar a "hoje" restaura os números.
5. **Casos de borda**
   - vínculos ambíguos não ligados;
   - valor negativo mantém o sinal;
   - venda com valor igual de outro cliente é mantida;
   - sem Carteira, limitação declarada;
   - **todas as bases vazias**: as 10 abas abrem sem erro.
6. **Caches:** mudança de probabilidade refaz a previsão; vínculo manual liga e desliga.
7. **Filtros combinados** (SPV + vendedor + UF) nas 10 abas.
8. **Exportações:** CSV, Excel dos vendedores e Excel da consulta.
9. **Relatórios**
   - diretoria 35 páginas, financeiro 22, equipe 81, completo 110;
   - **0 folhas com conteúdo além da borda**, 0 reduções;
   - tabelas continuadas com cabeçalho repetido;
   - falha simulada devolve o painel ao estado anterior;
   - leitura para celular (390 px) sem rolagem lateral, com os 9 capítulos.
10. **Telas:** celular 390 px, tablet 820 px e desktop 1440 px nas 10 abas, sem rolagem horizontal da página.
11. **Salvar → reabrir:** preserva plano de ação, metas mensais, probabilidades e vínculos manuais.
