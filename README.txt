USE JOLIE | SITE OFICIAL
========================

Arquivos principais:
- index.html  -> estrutura semântica e conteúdo
- styles.css -> identidade visual + responsividade desktop/tablet/mobile
- script.js  -> busca, filtros, favoritos, sacola, dialogs e WhatsApp
- assets/    -> fotos reais da loja

Configuração atual:
Instagram: https://www.instagram.com/usejoliie/
WhatsApp: 559180880527

Principais melhorias desta versão:
- Layout responsivo revisado para desktop, tablet e celular.
- CSS refatorado com variáveis, componentes reutilizáveis e breakpoints organizados.
- HTML semântico com header/main/section/article/figure/nav/footer e headings lógicos.
- Atributos alt, aria, focus e dialogs revisados para acessibilidade.
- Imagens com dimensões definidas para reduzir layout shift.
- Lançamentos ficam automaticamente no topo do catálogo.
- JavaScript sem duplicação do catálogo: busca lê os dados diretamente dos cards do HTML.
- Event delegation para filtros, produtos e sacola.
- Tratamento seguro do localStorage.
- Correções de aria-hidden/aria-expanded ao alternar sacola, busca e menu.
- Focus trap, Escape para fechar e restauração de foco nos dialogs.
- Ticker contínuo sem salto visual.
- Quick add sempre acessível em dispositivos touch.
- Suporte a prefers-reduced-motion.

Para publicar:
Basta substituir os arquivos do projeto pelos desta pasta e realizar o deploy normalmente.

PAINEL ADMINISTRATIVO
---------------------
O catálogo agora é gerenciado pelo arquivo products.js.
Acesse admin.html para cadastrar, editar, duplicar ou remover peças sem editar o código manualmente.

O painel publica alterações diretamente no repositório GitHub usando um Fine-grained Personal Access Token com permissão Contents: Read and write no repositório UseJolieStore.

Leia ADMIN_SETUP.md antes de usar pela primeira vez.
