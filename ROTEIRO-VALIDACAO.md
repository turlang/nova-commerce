# Roteiro de validação — NOVA Commerce

## 1. Preparação

- Copie `.env.example` para `.env`.
- Configure um MongoDB local ou MongoDB Atlas.
- Use inicialmente credenciais de teste do Mercado Pago.
- Defina `MERCADO_PAGO_NOTIFICATION_URL` com uma URL HTTPS pública terminando em `/api/webhooks/mercadopago`.
- No painel Mercado Pago, configure o mesmo webhook para o evento `payment` e copie a assinatura secreta.
- Execute `npm install`, `npm run build` e `npm run dev`.
- Confirme `GET http://localhost:3333/api/health` com banco `connected`.
- Em desenvolvimento, a API aceita o Vite em `localhost`, `127.0.0.1` e endereços privados das faixas `192.168.x.x`, `10.x.x.x` e `172.16-31.x.x`. Em produção, somente os domínios declarados em `WEB_URL` são permitidos.
- Se `VITE_API_URL` estiver vazio, o React usa automaticamente o hostname aberto no navegador e a porta `3333`. Assim, `http://192.168.1.102:5173` consulta `http://192.168.1.102:3333/api`, sem misturar IP de rede com `localhost`.

## 2. Responsividade

Validar em 320, 375, 768, 1024, 1440 e 1920 pixels:

- menu sem sobreposição;
- textos e imagens sem estouro horizontal;
- catálogo em uma, duas e quatro colunas conforme a tela;
- modal de produto rolável;
- carrinho, formulário de entrega, QR Code e painel utilizáveis por toque;
- navegação completa pelo teclado e foco visível.

## 3. Conta do cliente

1. Criar uma conta com nome, e-mail e senha de 8 ou mais caracteres.
2. Repetir o cadastro e confirmar bloqueio do e-mail duplicado.
3. Sair e entrar com a conta criada.
4. Tentar senha incorreta e confirmar mensagem genérica.
5. Recarregar a página e confirmar recuperação da sessão.
6. Entrar com Google e confirmar retorno para a loja já autenticado.
7. Entrar com Microsoft usando Outlook/Hotmail e confirmar o mesmo fluxo.
8. Usar no provedor o mesmo e-mail de uma conta local e confirmar que não é criado um cliente duplicado.
9. Cancelar a autorização no provedor e confirmar retorno seguro sem sessão.
10. Reutilizar o código temporário de retorno e confirmar que a API o rejeita.
11. Adicionar itens com um cliente, sair e entrar com outro cliente; confirmar que o carrinho anterior não aparece.

### URLs OAuth

- Google: `{PUBLIC_API_URL}/api/auth/google/callback`
- Microsoft: `{PUBLIC_API_URL}/api/auth/microsoft/callback`

Cadastre exatamente essas URLs nos painéis dos provedores. Em produção, todas devem usar HTTPS.

## 4. Catálogo e carrinho

1. Testar busca, categorias e ordenação.
2. Abrir detalhes de cada produto.
3. Adicionar dois produtos ao carrinho.
4. Aumentar, reduzir e remover quantidades.
5. Confirmar frete de R$ 24,90 abaixo de R$ 299 e grátis acima desse valor.
6. Confirmar que o total usado pelo pagamento é recalculado pela API.

## 5. Pix Mercado Pago — ambiente de teste

1. Entrar com uma conta de cliente.
2. Preencher o endereço completo.
3. Gerar o Pix apenas uma vez e verificar QR Code e código copia e cola.
4. Confirmar no MongoDB um pedido `awaiting_payment`.
5. Simular/realizar o pagamento de teste conforme a conta de teste do Mercado Pago.
6. Confirmar recebimento do webhook com HTTP 200.
7. Confirmar mudança do pedido para `paid`, preenchimento de `paidAt` e baixa única do estoque.
8. Reenviar a mesma notificação e confirmar que não ocorre nova baixa.
9. Testar pagamento rejeitado/cancelado e confirmar o estado correspondente.

## 6. Administração

1. Entrar com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
2. Confirmar que cliente comum recebe HTTP 403 nas rotas administrativas.
3. Criar e alterar produto.
4. Verificar métricas de clientes, produtos, pedidos e receita.
5. Confirmar que produto sem estoque não pode ser vendido.
6. Cadastrar um produto pelo painel e confirmar que aparece no catálogo.
7. Abrir Clientes, bloquear uma conta de teste e confirmar que ela perde o acesso.
8. Abrir Pedidos e confirmar cliente, total e status de cada compra.
9. Alterar o andamento de um pedido e confirmar persistência após recarregar a página.

## 7. Segurança e produção

- Não publicar `.env` ou tokens no GitHub.
- Trocar todas as credenciais de teste pelas produtivas somente após validação.
- Usar senha administrativa exclusiva e forte.
- Permitir no MongoDB Atlas somente a origem do servidor de produção.
- Confirmar HTTPS, CORS com o domínio real e webhook assinado.
- Realizar backup e restauração do MongoDB.
- Fazer uma compra real de valor baixo, confirmar pagamento, estoque e pedido e depois efetuar o reembolso de validação.

## Critério de liberação

Liberar vendas somente quando todos os itens acima passarem e a compra real controlada for confirmada de ponta a ponta.
