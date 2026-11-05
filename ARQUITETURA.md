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
- **Alertas**: sem OS no mês esperado (cadência observada; o mês corrente não conta), meses sem OS nos últimos 12, vencimento em até 90 dias, renovação sem negócio aberto no Ploomes (vencimento em até 180 dias).
- **Ploomes**: vínculo pelo nome do cliente (exato; senão 12 primeiras letras) — o número do contrato do Omie não existe no Ploomes.
- **Tela** `contratos`, capítulo "Contratos de serviço" nos relatórios (mensal, trimestral, diretoria, financeiro), Excel `contratosExcel()`.
