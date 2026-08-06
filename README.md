# NOVA Commerce Full-Stack

E-commerce React responsivo com API Express, MongoDB, autenticação JWT, login Google/Microsoft e checkout Pix Mercado Pago.

## Executar

```bash
cp .env.example .env
npm install
npm run dev
```

O front-end abre em `http://localhost:5173` e a API em `http://localhost:3333`.

## Produção

Execute `npm run build` e `npm start`. O servidor entrega a API e o build React na mesma porta. Configure as variáveis descritas em `.env.example`. Consulte `ROTEIRO-VALIDACAO.md` antes de ativar credenciais produtivas.

Para login social, crie aplicações OAuth Web no Google Cloud e Microsoft Entra, preencha as credenciais no ambiente e cadastre as URLs de callback descritas no roteiro. O retorno usa código descartável de dois minutos; o JWT da loja não é colocado na URL.

O checkout recalcula preços e estoque no servidor, cria o pagamento Pix com chave de idempotência e confirma o resultado por webhook assinado. O Mercado Pago recomenda webhooks para receber atualizações em tempo real e permite validar a origem da notificação com a assinatura secreta.
