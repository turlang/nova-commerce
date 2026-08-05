# NOVA Commerce

Protótipo funcional de e-commerce premium para validação visual e dos fluxos principais.

## Executar

```bash
npm install
npm run dev
```

Inclui vitrine, catálogo com busca/filtros/ordenação, detalhes de produto, carrinho persistente durante a sessão, checkout demonstrativo, login demonstrativo e painel administrativo responsivo.

## Próxima conexão de produção

O front-end está desacoplado para receber uma API NestJS. Antes de vendas reais, conecte PostgreSQL/Prisma, Redis, armazenamento S3, gateway de pagamentos, serviço de frete e autenticação OAuth. Valores do carrinho devem ser recalculados na API; nunca confie nos totais do navegador.
