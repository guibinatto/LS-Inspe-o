# Testes do Painel Executivo

Rode tudo com um comando. A saída é 1 se algum teste falhar:

```
LANG=C.UTF-8 node testes/todos.js
```

## Duas bases, ambas fora do git porque têm dados de clientes

| Base | Arquivo de dados | O que testa |
|---|---|---|
| **Base de teste** | `dados/base-teste.json` (dados congelados de 26/10/2026; "hoje" fixo em 10/11/2026 pelo atributo `data-hoje-teste`) | Números conhecidos: regras críticas, totais, central, contratos, gráficos. Montada por `ferramentas/base-de-teste.py`. |
| **Painel completo** | `dados/painel-dados.json` (dados do painel publicado) | Apresentação, capa, clique em todas as telas, períodos, versão separada. Montado por `ferramentas/dados.js injetar`. |

As planilhas usadas por alguns testes ficam em `dados/fixtures/`. Cada teste grava seus temporários numa pasta própria (`os.tmpdir()`).

Sem a pasta `dados/`, os testes que dependem dela aparecem como **PULADO**. Peça a cópia a quem mantém o painel; ela não vai para o repositório.

Para rodar um teste isolado: `LANG=C.UTF-8 node testes/<nome>.js <arquivo.html>`.
