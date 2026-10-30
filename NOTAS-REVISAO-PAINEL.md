# Revisão do Painel Executivo LS Fire — relatório gerencial comercial

Arquivo: `Painel-Executivo-LS-Fire-2026-10-26.html` (HTML único; bases, metas, carteira e configurações preservadas).
Referência dos números abaixo: **ano 2026, até 30/10/2026**, sem filtros.

---

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
