# Use Jolie + Supabase

Projeto Supabase: `UseJolie`
Região: São Paulo (`sa-east-1`)

## O que já está configurado
- tabela `products`
- autenticação Supabase Auth
- tabela de administradores autorizados
- Storage público `product-images`
- RLS: visitantes leem catálogo publicado; somente admins autenticados alteram produtos e imagens
- catálogo inicial migrado para o banco
- painel `/admin.html` com login, upload de foto, cadastro, edição, duplicação e exclusão

## Primeiro acesso da administradora
O e-mail precisa ser inserido na tabela `admin_allowed_emails` antes do cadastro. Depois ela acessa `/admin.html`, informa o mesmo e-mail, cria uma senha em **Criar primeiro acesso** e confirma o e-mail recebido.

Nunca coloque `service_role` no navegador. O site usa somente a publishable key, protegida pelas políticas RLS.
