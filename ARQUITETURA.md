# Painel Comercial LS Fire — arquitetura atual e evolução

## 1. Papel de cada sistema

| Sistema | Responsável por | O painel faz com isso |
|---|---|---|
| **Ploomes** | Negócios (oportunidades), propostas, interações/atividades | Importa (export .xlsx), não altera |
| **ERP e controles oficiais** | Pedidos (Controle de Pedidos, Comparativo de Pedidos), faturamento (Comparativo Faturamento, notas fiscais), saldo a faturar (Carteira) | Importa; o total oficial do mês prevalece sobre a soma dos registros e a diferença fica explícita |
| **Painel** | Consolidação, indicadores, previsões, inspeção do pipeline, reuniões, compromissos, próximos passos, ações, metas por período, fechamentos | Calcula e registra; nunca sobrescreve o dado importado |

### Natureza de cada informação

| Tipo | Exemplos | Onde aparece |
|---|---|---|
| Importada | negócio, interação, proposta, pedido, nota, saldo | bases em Dados → Bases |
| Calculada | divisão, vínculos carteira↔pedido e proposta↔negócio, indicadores | sempre com critério e confiança |
| Estimativa | valor ponderado, previsão de pedidos e de faturamento | marcada como estimativa nos cartões |
| Correção manual | valores corrigidos, vínculos manuais, duplicidade retirada, probabilidade ajustada | Dados → Fontes e correções |
| Registro do painel | passos, ações, reuniões, compromissos, metas por período, fechamentos, cargas | versão, data e histórico |

A tabela de fonte oficial por objeto e campo fica em Dados e configurações → Fontes e correções.

## 2. Camadas no arquivo HTML

O app continua sendo um único HTML que funciona offline. As camadas estão separadas por bloco de código:

1. **Importação** — `receber`, `detectar`, `linhaCabecalho`, `lerComparativo`: reconhecem cada planilha pelos títulos das colunas, em qualquer aba.
2. **Normalização** — `construir`, `num`, `data`: tratam datas impossíveis, números ambíguos e linhas de total.
3. **Modelo de dados** — `M` (bases normalizadas), `F` (recorte ativo) e `CFG` (configuração e registros).
4. **Regras de negócio**:
   - `vendasConsolidadas`: pedidos de várias fontes sem duplicar.
   - `conciliacao`: oficial × registros.
   - `negDaProposta` e os vínculos da carteira.
   - Política de probabilidade.
   - `dedupInter`: só remove linha idêntica ou com o mesmo ID.
5. **Indicadores**:
   - `contexto(P, fx)` monta o contexto: período, referência, pessoa, divisão, filtros, versões das bases e políticas.
   - `indicadores(ctx)` calcula a partir desse contexto, sem alterar variáveis globais.
   - `DIC_IND` e `DIC_META` formam o dicionário.
6. **Histórico**:
   - **Cargas**: `snapGarantir`, imutáveis.
   - **Fotografia por data**: `fotoAte`. Nunca usa uma carga posterior à data.
   - **Mudanças entre fotografias**: `mudancas(a, P, b)`.
   - **Fechamentos**: `fechamentoRegistrar`, com retificação.
7. **Persistência**:
   - Versão por registro editável: `versionar`.
   - Junção com detecção de conflito e histórico da resolução: `mesclar`.
   - Exclusões registradas: `excluirReg`.
   - Validação na importação de JSON e aviso quando a gravação falha.
8. **Interface** — `VISTA.*`, `cardG`, `tab`, listas de origem (`regLista`/`abrirLista`) e formulários (`formModal`).
9. **Relatórios** — `REL_MODELOS` define os 7 modelos; `gerarRelatorio(opt)` faz paginação real com cabeçalho repetido; `relcPlanilha` gera a planilha com o mesmo contexto.
10. **Integrações** — e-mail (mailto), artifact (Salvar no Claude). Sem chamadas externas.

## 3. Limites do modelo atual (local)

- Cada cópia do HTML tem a sua própria base de registros. A troca de arquivos e de JSON não é a solução definitiva para uso por várias pessoas: serve apenas para juntar cópias sem perder nada.
- Não há login: "quem registrou" é um campo de texto.
- As cargas só existem quando alguém importa um export. Não há captura automática nem data exata de cada alteração.
- Não há envio nem geração agendada de relatórios.

## 4. Evolução para uso compartilhado (proposta)

| Componente | Proposta |
|---|---|
| Backend | API REST pequena (Node ou Python) com as regras de `indicadores(ctx)` portadas em módulo testável |
| Banco | PostgreSQL. Tabelas de cargas (`carga`, `carga_registro`), registros do painel com versão (`acao`, `passo`, `reuniao`, `compromisso_versao`, `meta_periodo`, `fechamento`) e trilha de auditoria (`evento`) |
| Autenticação | SSO corporativo (Microsoft 365 / Entra ID), que já é usado pela LS Fire |
| Permissões | Diretoria (tudo), supervisão (equipe), vendedor (a própria carteira), engenharia (fila e propostas) |
| Concorrência | Controle otimista por versão (`ver`) com resolução registrada, a mesma regra que o painel já usa localmente |
| Histórico centralizado | Cargas automáticas diárias do Ploomes (API) e do ERP, com data de extração. Mudanças passam a ter a data observada de cada carga |
| Agendamento | Relatórios semanais e mensais gerados no servidor e enviados por e-mail |
| Backup | Backup diário do banco e retenção dos fechamentos |

### Migração sem parar o uso

1. Exportar o JSON do painel (histórico e registros) e importar no banco.
2. Servir o mesmo HTML lendo da API em vez do `CFG` local, sem mudar as telas.
3. Ligar as cargas automáticas.
4. Ligar login e permissões.
5. Ligar o agendamento.

## 5. Dependências externas para fechar lacunas

| Lacuna | O que habilita |
|---|---|
| Export de **Tarefas** do Ploomes (data prevista, conclusão, status, usuário executor) | Atividades planejadas × realizadas, cumprimento de prazo e executor real |
| Campo **próxima atividade** no export de negócios | "Sem próximo passo" sem depender de registro no painel |
| **ID, horário e usuário** no export de interações | Deduplicação por identificador e atribuição ao executor |
| Na **engenharia**: data da solicitação, prazo acordado, data de entrega, tempo aguardando informação, motivo de revisão | Cumprimento de prazo e tempo de elaboração separado do tempo de espera |
| **Data de extração** nos exports | Cobertura declarada de cada carga, em vez da inferência pela última atualização |

## Contratos de serviço (05/11/2026)

- **Bases**: `contratos` (Omie · Contratos por Cliente: vigência, situação, valor) e `os` (Omie · OS por Cliente: uma linha por ordem de serviço, com nº do contrato de venda, vigência e previsão de faturamento). Detecção: `ordem de servico` + `total do servico` → `os`.
- **Motor** `contratosModelo()`: uma OS pertence a um contrato quando o número dela está na base de contratos ou alguma OS com esse número traz a vigência; as demais são avulsas (toda OS conta uma vez). Vigência sem ano (`05/01 ~ 04/01/27`) é deduzida com a primeira OS como âncora e marcada como aproximada. OS incluídas depois da data de referência ficam fora.
- **Alertas**: sem OS no mês esperado (cadência observada; o mês corrente não conta), meses sem OS nos últimos 12, vencimento em até 90 dias, renovação sem negócio aberto no Ploomes (vence em até 60 dias — `CTR_RENOV`; vencidos há até 120 dias continuam na lista).
- **Ploomes**: vínculo pelo nome do cliente (exato; senão 12 primeiras letras) — o número do contrato do Omie não existe no Ploomes.
- **Tela** `contratos`, capítulo "Contratos de serviço" nos relatórios (mensal, trimestral, diretoria, financeiro), Excel `contratosExcel()`.
- **Controle de Pedidos (ITM)**: pedido da família ITM é contrato vendido. Liga ao contrato do Omie do mesmo cliente com início até 150 dias do pedido (traz valor vendido e consumo); sem ele vira contrato presumido (`PV <nº>`), vigência de 12 meses a partir do pedido — ou o nº de parcelas, quando a OS foi faturada de uma vez e parcelada (6+), caso em que não se espera OS todo mês — com as OS de serviço do cliente na vigência. OS parcelada 6+ vezes sem pedido também vira contrato (`OS <nº>`). Renovação e encerrados: janela de 120 dias.

## Relatórios por tema (05/11/2026)

`REL_TEMAS` (tPIP, tRES, tPRO, tCAR, tCTR, tCLI, tVEN, tATV) entram em `REL_MODELOS` com `tema:true`: seções explícitas (desmarcáveis), `off` = seções longas fora por padrão (inspeção das oportunidades), sem narrativa de abertura e com um capítulo por tela em vez da ordem editorial de `REL_CAPS`.

## Apresentação (09/11/2026)

Aba `apresentacao` (Apoio). `apresDados()` reúne os números do período e dos filtros (SEQ e SPV pelo próprio motor, com `render` suspenso para não entrar em ciclo); `apresentacaoHTML(op)` monta um documento próprio — capa, 10 capítulos e metodologia, CSS e script isolados — mostrado num iframe (`srcdoc`), em tela cheia (`apresTelaCheia`, fecha com Esc ou saindo da tela cheia) ou baixado (`apresBaixar`). `op.fragmento` gera a versão para publicar como página do Claude.

## Olhar da SEQ (10/11/2026)
`seqDados()` mede três hipóteses para a queda de pedidos da SEQ. A janela recente vai do 1º dia do mês anterior até a referência, contra as mesmas datas do ano anterior.

- **Concentração:** os 5 maiores negócios abertos pesam no pipeline ≥40% (explica em parte) ou ≥60% (explica).
- **Propostas paradas:** os negócios com proposta apresentada sem FUP há mais de `CFG.fupDias` são ≥35% (em parte) ou ≥50% (explica). A régua de FUP é a mesma da apresentação (`fupNegocios()`).
- **Preço:** a parte do valor perdido desde o início da base de propostas é ≥25% (em parte) ou ≥40% (explica).

A seção `res-seq` fica em Resultados e metas e nos relatórios que já levam `res-spv`. O capítulo `seq` da apresentação entra nos modelos Anual, Trimestral, Mensal e Personalizada e sai quando o filtro está só em SPV.

## Ploomes pela API (12/11/2026)

`ferramentas/ploomes_coletar.py` lê o Ploomes pela API, só com GET, usando um usuário de integração de perfil leitura. Ele grava as mesmas planilhas do export manual, com o prefixo `API-Ploomes_`:
- negócios;
- propostas: cabeçalho de todas as revisões e itens;
- empresas;
- interações;
- vendas.

Em seguida, `ferramentas/ploomes_importar.js` importa essas planilhas pelo importador normal do painel e fixa a referência em hoje.

**Onde fica a chave:** é a User-Key do usuário de integração. Na sessão cloud, ela fica nos segredos de rede do ambiente e o proxy a injeta nas chamadas. Em outra máquina, use a variável `PLOOMES_USER_KEY`. A chave nunca entra no código nem no painel.

**Diferenças em relação ao export manual:**
- **Interações:** a planilha da API traz o ID de cada interação. A deduplicação passa a ser pelo ID, e por isso e-mails diferentes do mesmo cliente no mesmo dia não colapsam mais em um só.
- **Usuário que registrou a interação:** não é exportado. Os e-mails sincronizados aparecem com o dono da integração como criador. A atribuição continua sendo: dono do negócio e, sem negócio, dono da conta.

**Selo na tela:** a barra "Bases" mostra o selo API nas bases que vieram por esse caminho.

**Uso:**
```
python3 -I ferramentas/ploomes_coletar.py <pasta>
node ferramentas/ploomes_importar.js dados/painel-completo.html <pasta>
```

## Botão "↻ Ploomes" (12/11/2026)

**O que faz:** no painel publicado no claude.ai, o botão aciona a tarefa "Atualizar painel pelo Ploomes" (`trig_01Gnfu1KEQotBL5ReXgpS7DV`). A tarefa não tem horário: só roda quando é acionada.

**Como aciona:** pelo conector Claude Code Remote, usando a capacidade `mcp` do artefato com o login de quem clica.

**O que a tarefa faz:**
1. Abre uma sessão no ambiente "LS-Inspe-o (Ploomes)", que guarda a chave de leitura.
2. Roda `ploomes_coletar.py`, `ploomes_importar.js`, os testes e `publicaveis.js`.
3. Confere se houve salvamento pela página. Se houver, não publica.
4. Republica o painel e a apresentação nos mesmos links.
5. Faz commit e push na branch e envia uma notificação no fim.

**Quando não aparece:** fora do claude.ai (arquivo baixado) ou sem o conector, o botão fica oculto.

## Dados fora do git (13/11/2026)

O repositório guarda **só o código**. `Painel-Executivo-LS-Fire.html` vai para o git com `seed-dados` vazio e `seed-config` `{}`; aberto assim, o painel vem vazio e pede importação.

**Onde ficam os dados de clientes:**
- no painel publicado (privado) no claude.ai, que é a fonte oficial;
- numa cópia local em `dados/` (ignorada pelo git).

**Montar o painel completo** (código atual + dados):
```
node ferramentas/dados.js extrair <painel publicado.html> dados/painel-dados.json
node ferramentas/dados.js injetar Painel-Executivo-LS-Fire.html dados/painel-dados.json dados/painel-completo.html
```

**Toda atualização** (manual ou pelo botão):
1. Lê o painel publicado.
2. Extrai os dados dele.
3. Injeta esses dados no código do repositório.
4. Importa o Ploomes, testa e republica.

Como os dados de partida são sempre os do painel publicado, um salvamento feito pela página nunca é perdido.

**O que não pode ir para o git**, nem para o histórico: planilhas (`*.xlsx`, `*.csv`), `versao-separada/` (gerada com dados), `evidencias/` (capturas com dados) e `apresentacao-teste/` com dados.

## Produtos e mix

Aba `produtos` (`VISTA.produtos`, funções `prd*`). Três fontes:

- **Famílias:** pedidos do período (`F.vendas`), pela família do Controle de Pedidos (`solucao` → `CAT_NOME`).
- **Itens e curva ABC:** linhas de item das ordens de venda do ERP (`M.omie`). A mesma venda aparece em várias OVs (a do pedido, a reemissão e as de faturamento/medição, cada uma com o item e "quantidade 1"): `prdBase` conta cada produto uma vez por projeto (campo departamento do ERP; sem ele, o pedido do cliente; OV sem nenhum dos dois, do mesmo cliente e produto de um projeto, entra nele), com a OV de maior valor e a data da primeira. Caso Irricom: 9 containers e R$ 5,7 mi somando OVs → 3 e R$ 3,4 mi. O ERP rateia o item em parcelas (quantidade 1/3 em três linhas); somar por produto dá o total, e as unidades são exibidas arredondadas.
- **Cotado × ganho e faixas:** itens das propostas (`M.propostas`), só a revisão mais recente de cada proposta e só itens com valor.

`prdAnalisa` lê o código do produto (`CMB LSF <acionamento> <tipo> <modelo> … <norma>`); descrições livres são lidas por palavras-chave. Curva ABC: A até 80% do valor (o item que cruza a linha ainda é A), B até 95%, C o resto. Relatório por tema `tPRD`. Teste: `testes/produtos.js`.

**Motores vendidos** (seção `prd-mot`): `prdConjuntos` lê do código um bloco por conjunto — `<tipo> <modelo da bomba> <HP> <rpm/100> [RD|TR] <painel> [norma]` (RD radiador, TR trocador de calor; 22M = 220 V mono, 38T/44T = 380/440 V tri); skid/container trazem um bloco por letra do acionamento (DEJ = diesel, elétrica, jockey). `prdMotoresObs` tira marca e modelo da descrição do item no ERP ("Motor Diesel Clarke, modelo DR8H-UFAA40"; ignora "painel para motor diesel …"), na ordem em que aparecem, por tipo. Jockey é monobloco (motor integrado). Sem descrição, a marca fica "não descrita no ERP".

**Catálogo de motores padronizados** (base importada `motoresCat`, planilha "Motores Padronizados LS Fire"; fica nos dados do painel publicado, nunca no git — tem preços). Na importação sai a coluna do escopo em HTML para o Ploomes. `prdCasaCatalogo` casa cada motor DIESEL vendido em camadas: modelo (comercial, código ou ficha; "Deemas" do ERP = De Maas, Baudouin = Weichai) → variante do modelo (sufixo diferente) → marca + potência ±3% / rotação ±150 rpm → sugestão só por potência e rotação quando o ERP não traz marca nem modelo. Marca ou modelo que não está no catálogo fica "fora do catálogo" (não é forçado). A ficha completa abre ao clicar no motor. "Situação no ERP" diz se a venda foi faturada (inclusive em medições).

**Ranking dos motores e curva ABC** (`prdMotorId`): motor = marca + modelo + potência, identificado pelo modelo (a marca vem da descrição, do mesmo modelo em outra venda ou do catálogo). Sem marca nem modelo no ERP, o motor é **inferido** quando todos os motores descritos com a mesma potência, rotação e acionamento são um só (ex.: 483 HP @1800 diesel → Baudouin 6M16G308/6); senão fica "marca não descrita", com a sugestão do catálogo no nome. Curva ABC por unidades ou pelo valor do conjunto rateado entre os motores dele. Em `prdBase`, quantidade fracionada (o ERP rateou o item em parcelas por várias OVs do projeto) soma; quantidade inteira repetida (reemissão/medição) vale uma vez.

## Omie pela API (somente leitura)

`ferramentas/omie_coletar.py`: lê pedidos de venda (com itens), clientes, produtos, projetos, vendedores, notas, OS e contratos. Chaves só pelas variáveis de ambiente `OMIE_APP_KEY` / `OMIE_APP_SECRET` (o Omie exige a chave no corpo da requisição, por isso não usa segredo de rede); host `app.omie.com.br` liberado no ambiente. Só chama métodos da lista `PERMITIDOS` (Listar…/Consultar…); qualquer outro é recusado antes de sair. A chave é a mesma da integração Ploomes ↔ Omie (webhook): trocar a chave exige atualizar também o Ploomes. Saída em `omie-coleta/` (fora do git). `ferramentas/omie_para_planilha.py` converte a coleta na planilha de itens de venda com os cabeçalhos do export manual (base `omie`, uma linha por item, cancelados fora, valor cheio — o export manual repetia o item por departamento do rateio com valor proporcional). `ploomes_importar.js` importa também `API-Omie_*.xlsx`; a tarefa do botão ↻ ("Atualizar painel pelo Ploomes e Omie") coleta o Omie como passo opcional. Validação 2026: contando cada produto uma vez por projeto, R$ 35,8 mi (Controle: R$ 36,7 mi); a API traz 19 OVs que faltavam no export.

## Verificações de cadastro (18/11/2026)
Aba **Verificações** (bloco Análise): o que falta ou está errado nos cadastros, para o comercial corrigir.
Nada é corrigido pelo painel — ele só lê.
- Regras em `VER_REGRAS`: cada uma tem cadastro (`cad`), área (Fiscal, Comercial, Processo, Painel),
  título, por que importa (`p`), teste (`f(registro, contexto)`) e o que corrigir (`c`, texto ou função).
- Registros em `verRegistros()`: negócios (criados em 12 meses ou abertos), clientes com negócio,
  propostas (última revisão, 12 meses), OVs do Omie (12 meses, itens juntos), cadastro de produtos
  do Omie (ativos), impostos de cada item de OV e linhas do Controle de Pedidos (12 meses).
- Padrões aprendidos dos próprios dados em `verContexto()`: NCM dominante (4 dígitos) e prefixo de
  descrição dominante ("CMB LSF") por família, quando 60% ou mais da família segue o padrão.
- Três visões: por regra (clique abre a lista com CSV), por registro (tudo o que corrigir num negócio,
  pedido ou produto) e por responsável. Filtros: sistema, área, responsável.
- Bases novas `omieProdutos` e `omieFiscal` vêm de `ferramentas/omie_para_planilha.py`
  (API-Omie_Produtos.xlsx e API-Omie_Fiscal.xlsx), reconhecidas por `detectar` pelas colunas
  "Vendido (OVs)" e "NCM do Cadastro". Sem elas, as seções do Omie mostram "aguardando a base".
- Teste: `testes/verificacoes.js` (registros sintéticos, sem dados de clientes).

## Gestão de contratos e serviços recorrentes (18/11/2026)
Menu próprio **Gestão → Contratos e serviços recorrentes** (tela `gestao`), separado do dashboard
**Análise → Contratos de serviço**. Abas: Todos · ITM e manutenção · Locação · Indicadores.
- Locações: pedidos da família REN no Controle e OVs do Omie com categoria Locação (`gcLocacoes`);
  entrega, devolução prevista/realizada, local, aluguel mensal e caução na ficha.
- Equipamentos (`ctrEquip`): tipo, fabricante, modelo, nº de série, ano, potência, rotação, vazão,
  pressão, tensão, norma, TAG/local, instalação, patrimônio, horímetro, situação. Sugestões automáticas
  (`gcSugestoes`) a partir dos itens da OV, da proposta/PTC no Ploomes e do que já foi vendido ao
  cliente no Omie: o código do produto vira bomba + motor + painel; nº de série a equipe completa.
- Ficha de cada contrato: o automático vem do Omie (vigência, parcela, OS faturadas e a faturar), do
  Controle de Pedidos (valor vendido, PTC, pedido do cliente) e do Ploomes (dono da conta); a equipe
  preenche no painel valor contratado, meses, reajuste, renovação, periodicidade de visita, responsável,
  contato, objeto. O que a ficha informa prevalece, e cada valor mostra a origem.
- Visitas (data, tipo, situação, técnico, o que foi feito, pendências, relatório em PDF) e anexos
  (contrato, aditivo, proposta/PTC, pedido de compra, ART).
- Onde fica: banco do painel publicado (capacidade `db` do Claude: coleções `contratos/<id>`,
  `ctrVisitas`, `ctrAnexos`) e arquivos no armazenamento dele (`assets`). Sobrevive às atualizações
  automáticas. Anexar é só para Editor/dono; preencher, para quem pode alterar o painel. O arquivo
  baixado (↓ Salvar) não tem banco: mostra só o automático.
- Indicadores: ativos e receita mensal, saldo contratual, cumprimento de visitas (realizadas ÷
  esperadas pela periodicidade), visitas atrasadas, relatórios pendentes, vencimentos 30/60/90,
  faturamento × prazo decorrido (desvio), cadastro incompleto. Entram no relatório do tema Contratos.
- Teste: `testes/gestao-contratos.js` (banco simulado em memória).

- Sem redundância: na ficha, o que já vem dos sistemas fica num bloco à parte ("Já vem
  automaticamente"), com o valor à mostra; em branco mantém o automático (`gcFormFicha`).
- Equipamentos iguais (`gcMesmoModelo`): mesmo grupo (motor/bomba/painel), mesmo modelo sem
  espaços e traços, marca e potência sem contradição. `gcPropostas` sugere o que falta a partir dos
  iguais e, para motor diesel, do catálogo de motores (só pelo modelo). Ao salvar um equipamento, o
  painel pergunta se completa os iguais ("Reconheci que…"); vazios vêm marcados, divergentes
  desmarcados; nada é gravado sem confirmação. Série, ano, TAG, vazão, pressão e situação nunca são
  copiados. A origem de cada valor completado fica em `fontes`.

## Preenchimento por toque e base instalada (19/11/2026)
- `formModal` aceita `tipo:'chips'` (escolha única) e `tipo:'checks'` (várias): botões de marcar no
  lugar de listas e digitação. Usado em toda a gestão (tipo, situação, reajuste, mês, renovação,
  periodicidade, tipo e situação do equipamento, tipo de anexo) e no checklist da visita
  (`GC_VFEITO`: o que foi feito na visita, em caixas de marcar).
- **Gestão → Base instalada e oportunidades** (`VISTA.baseinst`, `biModelo`): pedidos de equipamento
  do Controle (2025+) e vendas conquistadas do Histórico OMIE antes de 2025, por cliente (`biChave`:
  duas primeiras palavras do nome, sem LTDA/SA/DE…), contra os contratos ativos de ITM/manutenção da
  Gestão e os negócios SPV abertos no Ploomes. KPIs: base, com contrato (cobertura), oportunidades,
  potencial anual estimado (oportunidades × mediana anual dos contratos ativos), completam 1 ano em
  90 dias. Andamento de cada oportunidade em `baseOport/<cliente>`. Alerta na Central de supervisão.

## Duas visões: Como estamos × Para onde vamos (19/11/2026)
- Aba Apresentação abre com dois cartões: **Como estamos** (Anual, Trimestral, Mensal, Semanal,
  Personalizada — com os capítulos novos *Anos anteriores* e *Contratos em execução*) e **Para onde
  vamos** (modelo `futuro` e Previsões curta): cenários do ano, pipeline, previsão, contratos, base
  instalada, o que os estudos apontam e rotas.
- `futuroDados()`: cenários (ritmo = mesma conta da tela Resultados; realizado + previsão ponderada
  até dezembro; se tudo que está elegível fechar), anos anteriores, estudos (famílias, estados,
  segmentos, curva A), base instalada e **rotas** — regras sobre os indicadores do painel, cada uma
  com número, porquê, ação, quem e valor em jogo (sem fator de conversão inventado); a meta vem
  primeiro quando falta. `rotaPlano(i)` leva a rota para o plano de ação.
- Tela Gestão → Base instalada e oportunidades traz também cenários e rotas; relatório por tema
  "Base instalada e oportunidades" (tOPO).
- `ferramentas/publicaveis.js` gera também `apresentacao-futuro-ls-fire.html`.
- Teste: `testes/futuro.js`.

## Roteiro de ligação e anexos dos sistemas (19/11/2026)
- **Gestão → Base instalada**: botão "📞 Roteiro de ligação" (geral) e 📞 por cliente (`rotAbrir`):
  preparação, abertura, perguntas (o cliente dá os parâmetros), o que oferecer, casos reais sem nome
  de cliente (sem manutenção; manutenção por terceiro não autorizado — certificado de garantia itens
  C.b, C.e, C.j, D; manual MQ 03; NFPA 25), objeções com "pergunte / argumente", fechamento com
  data, e-mail e WhatsApp de follow-up. "↓ HTML" baixa o roteiro para usar fora do painel.
- **Anexos (só nomes dos arquivos)**: Omie `geral/anexo ListarAnexo` por venda, contrato e OS
  (`omie_coletar.py coletar <pasta> anexos`, planilha API-Omie_Anexos.xlsx, base `omieAnexos`);
  Ploomes `Deals $expand=Attachments` (coluna "Anexos do Negócio"). A ficha do contrato lista os
  documentos já anexados nos sistemas e o cadastro os considera (sem pedir de novo). Verificações:
  "OV sem nenhum documento anexado" e "Venda ganha sem documento anexado no Ploomes".

## Olhar da SPV: o que, para quem e onde

Em Resultados e metas, depois de "Serviços (SPV): antes e depois da Amanda", a seção
`secSpvVolume()` (dados em `spvVolume()`) faz o estudo de volume da SPV no período:

- **o que**: cada item das propostas da SPV vira um tipo pela descrição (`spvTipo`, tabela
  `SPV_TIPOS`: serviços — inspeção/ITM, manutenção, testes, adequação, treinamento, locação,
  documentação; peças — peças de bomba, painéis e elétrica, motor diesel e consumíveis,
  válvulas, instrumentos, tanques, equipamentos completos). Uma proposta conta uma vez em cada
  tipo. "O que mais vendemos" usa os itens do Omie das ordens de venda dos pedidos da SPV;
- **para quem**: segmento do negócio (ou do cadastro do cliente) — negócios criados no
  período, propostas, pedidos e conversão;
- **onde**: região e estado da obra (ou do cliente) das propostas, negócios e pedidos;
- cruzamento segmento × tipo mais pedido × região e as peças mais pedidas.
Clientes fora do estudo da SPV (`spvForaDe`) ficam fora. Teste: `testes/spv-volume.js`.

## Condições de pagamento

`secCondPag()` (dados em `condPagDados()`), em Resultados e metas, estuda como os pedidos foram fechados:

- **condição negociada** (Ploomes, campo condição de pagamento do negócio), lida por `condPagInfo(texto)`:
  sinal = % na emissão/envio do pedido (entrada, no ato); antecipação = % antes do faturamento por marcos
  (DTC/DTE, APE, embarque, seguro garantia, "N dias depois do pedido"); o resto é pago no faturamento ou
  depois (DDL, prazo médio ponderado). Tipos em `CP_TIPOS`. O `n.sinalPct` do negócio usa a mesma leitura
  (antes pegava o primeiro % do texto, e "100% 30 DDL" virava sinal de 100%);
- **condição registrada no Omie**: `ferramentas/omie_para_planilha.py` grava `API-Omie_Parcelas.xlsx`
  (uma linha por OV não cancelada: código da condição, nº de parcelas e "percentual|dias|vencimento; ...").
  O painel reconhece como a base `omieParcelas`; `cpOmie()` calcula o prazo médio ponderado e a parte que
  vence antes da previsão de faturamento. O botão ↻ importa a planilha junto com as outras do Omie.
Teste: `testes/condicoes-pagamento.js`.

Política de probabilidade: "Em negociação" passou de 60% para 20% (pedido da diretoria, 19/11/2026).

## Resultados e metas em abas

`VISTA.resultados` monta todas as seções como antes e `resOrganizar()` as reparte em abas
(`RES_ABAS`: visão geral, indicadores, composição, SEQ, SPV, pagamento) pelo `data-sid` (`resGrupo`).
Só a aba ativa vai para a tela; o relatório (`REL_GERANDO`) recebe todas, na ordem das abas.
`irPara('resultados', sid)` abre a aba da seção. A aba escolhida fica no navegador (localStorage).
As condições de pagamento aparecem separadas em SEQ e SPV (`cpResumo`, `cpResumoOV`).

## Atualização pelo Ploomes e Omie (botão ↻ e horários)

A tarefa agendada roda nos dias úteis às 5h52 (modo completo) e 11h52 (modo rápido) de Brasília, e
quando alguém clica em ↻ (modo rápido, fora da madrugada). Ela chama `ferramentas/atualizar.sh`:
- coleta Ploomes e Omie ao mesmo tempo;
- `omie_coletar.py` busca as bases do Omie em paralelo (o Omie não aceita o mesmo método duas vezes ao
  mesmo tempo, então as páginas de uma base seguem uma a uma); os anexos começam assim que pedidos,
  OS e contratos terminam;
- modo rápido: anexos incrementais (`--anexos-anteriores`, com a base omieAnexos do painel publicado)
  e testes rápidos (`fumaca`, `futuro`, `condicoes-pagamento`, `produtos`, cerca de 20 s);
- modo completo: todos os anexos e também `apresentacao` e `clica-tudo`.
Tempo medido em 19/11/2026: coleta de 16 min → 4,2 min; script inteiro em 4,6 min (antes, ~30 min no total).
