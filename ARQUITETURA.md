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
node ferramentas/ploomes_importar.js Painel-Executivo-LS-Fire-2026-10-26.html <pasta>
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
