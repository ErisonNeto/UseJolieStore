# Painel administrativo | Use Jolie

## O que foi criado

O catálogo deixou de depender de cards escritos manualmente no `index.html`.
Agora os produtos ficam no arquivo `products.js`, e o site monta os cards automaticamente.

O painel fica em:

`/admin.html`

Exemplo após o deploy:

`https://seu-dominio.com/admin.html`

## Como o painel publica sem editar código

O painel usa a API do GitHub para:

1. enviar a nova foto para `assets/products/`;
2. atualizar `products.js` com os dados da peça;
3. criar commits na branch `main`;
4. deixar a Vercel fazer o novo deploy automaticamente, se o projeto estiver conectado ao repositório.

## Token do GitHub

Crie um **Fine-grained Personal Access Token** limitado ao repositório `ErisonNeto/UseJolieStore`.

Permissão necessária:

- Repository permissions → **Contents: Read and write**

Não dê permissões extras sem necessidade.

No painel, abra **GitHub** e informe:

- Owner: `ErisonNeto`
- Repository: `UseJolieStore`
- Branch: `main`
- Token: o token criado

Por padrão o token é salvo somente na sessão atual. A opção “Lembrar neste navegador” grava o token no armazenamento local do navegador; use apenas em um computador pessoal e confiável.

## O que pode ser administrado

- nome da peça;
- categoria;
- valor;
- parcelamento e quantidade de parcelas;
- informação “sem juros”;
- descrição;
- variação / estampa;
- cores;
- tamanhos;
- foto;
- texto alternativo da foto;
- legenda personalizada;
- etiqueta rosa, azul ou preta;
- lançamento;
- novo;
- disponível;
- esgotado;
- oculto;
- ordem das peças;
- duplicação de produto para criar outra cor/estampa rapidamente;
- exclusão de produto do catálogo.

## Regra dos lançamentos

Qualquer produto marcado como `Lançamento` aparece automaticamente antes dos demais produtos, independentemente do número usado no campo de ordem.

## Variações

Para uma peça com várias cores/tamanhos e uma única foto, cadastre as opções nos campos Cores e Tamanhos.

Se cada cor ou estampa tiver uma foto diferente, use **Duplicar** e publique uma entrada para cada variação. Assim cada versão terá sua própria foto no catálogo, mantendo o mesmo nome de produto.

## Segurança

O arquivo `admin.html` é público como qualquer página estática, mas ele não contém senha nem token embutido. Sem um token autorizado, ninguém consegue gravar no repositório por meio do painel.

Nunca coloque um token diretamente no código-fonte nem faça commit dele no GitHub.
