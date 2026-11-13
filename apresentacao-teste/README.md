# Pulso comercial LS Fire (teste)

Esta é uma versão de teste da apresentação: uma página longa e escura, com filtros por divisão, vendedor e período. A apresentação oficial continua sendo a da aba "Apresentação" do painel.

- `pulso-comercial-ls-fire.html` é o arquivo pronto. Abre em qualquer navegador, inclusive sem internet.
- `fonte/modelo.html` traz o layout, os textos e as regras. Título, períodos e limiares ficam no bloco `<script id="config">`, e as cores nas variáveis `:root`.

## Como atualizar com dados novos

1. `node apresentacao-teste/fonte/extrai.js "$PWD/dados/painel-completo.html" apresentacao-teste/fonte/dados.json`
2. `node apresentacao-teste/fonte/build.js apresentacao-teste/fonte`
3. Copie o `fonte/pulso-comercial-ls-fire.html` gerado para cá.
