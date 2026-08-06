# Guia de deploy — NOVA Commerce

Este guia leva o projeto do ambiente local até a publicação em produção usando:

- GitHub para versionamento;
- MongoDB Atlas para o banco de dados;
- Render para hospedar o site React e a API Node.js no mesmo serviço;
- Mercado Pago para pagamentos via Pix;
- Google e Microsoft como provedores opcionais de login.

> Nunca publique o arquivo `.env`, senhas, tokens ou chaves privadas no GitHub.

## 1. Pré-requisitos

- Repositório: `https://github.com/turlang/nova-commerce`
- Branch de produção: `main`
- Conta no MongoDB Atlas
- Conta no Render
- Aplicação cadastrada no Mercado Pago
- Node.js 20 ou superior para testes locais

Para receber pagamentos reais, a conta comercial/financeira e os dados bancários devem pertencer ao responsável legal autorizado.

## 2. Confirmar o projeto no GitHub

No PowerShell, dentro de `D:\nova-commerce`, execute:

```powershell
git status -sb
git remote -v
git branch --show-current
```

O resultado esperado é a branch `main`, o remoto `turlang/nova-commerce` e nenhuma alteração pendente.

Quando houver uma atualização futura:

```powershell
git add -A
git commit -m "Atualiza NOVA Commerce"
git push origin main
```

## 3. Criar o MongoDB Atlas

1. Entre no MongoDB Atlas e crie um projeto chamado `nova-commerce`.
2. Crie um cluster.
3. Em **Database Access**, crie um usuário exclusivo para a aplicação, com uma senha forte.
4. Em **Network Access**, autorize o acesso necessário para o Render. Para o primeiro deploy, o Atlas permite usar `0.0.0.0/0`; mantenha usuário e senha fortes e restrinja a rede depois, se a infraestrutura permitir.
5. Em **Connect > Drivers**, copie a URI de conexão.
6. Substitua `<password>` pela senha do usuário e informe o banco `nova_commerce`.

Formato esperado:

```text
mongodb+srv://USUARIO:SENHA@CLUSTER.mongodb.net/nova_commerce?retryWrites=true&w=majority
```

Não coloque essa URI no GitHub. Ela será cadastrada diretamente no Render.

## 4. Criar o serviço no Render

O repositório já contém `render.yaml`.

1. Entre no Render.
2. Selecione **New > Blueprint**.
3. Conecte o GitHub e escolha `turlang/nova-commerce`.
4. Selecione a branch `main`.
5. Confirme a criação do serviço `nova-commerce`.
6. Aguarde o primeiro build. Ele poderá ficar incompleto até as variáveis obrigatórias serem preenchidas.

Configuração prevista:

| Campo | Valor |
|---|---|
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check | `/api/health` |
| Node | 20 ou superior |

## 5. Configurar variáveis no Render

Abra o serviço no Render e acesse **Environment**. Cadastre:

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | URI completa do MongoDB Atlas |
| `JWT_SECRET` | segredo aleatório com pelo menos 32 caracteres |
| `WEB_URL` | URL pública do próprio serviço Render |
| `PUBLIC_API_URL` | URL pública do próprio serviço Render |
| `ADMIN_EMAIL` | e-mail administrativo definitivo |
| `ADMIN_PASSWORD` | senha administrativa forte e exclusiva |
| `MERCADO_PAGO_ACCESS_TOKEN` | token do Mercado Pago |
| `MERCADO_PAGO_WEBHOOK_SECRET` | assinatura secreta do webhook |
| `MERCADO_PAGO_NOTIFICATION_URL` | URL do webhook descrita abaixo |

Exemplo, trocando pelo domínio real fornecido pelo Render:

```text
WEB_URL=https://nova-commerce.onrender.com
PUBLIC_API_URL=https://nova-commerce.onrender.com
MERCADO_PAGO_NOTIFICATION_URL=https://nova-commerce.onrender.com/api/webhooks/mercadopago
```

Gere o `JWT_SECRET` localmente no PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Salve as variáveis e solicite um novo deploy.

## 6. Configurar o Pix no Mercado Pago

Comece com credenciais de teste.

1. Crie ou abra a aplicação do NOVA Commerce no painel de desenvolvedores do Mercado Pago.
2. Copie o **Access Token de teste** para `MERCADO_PAGO_ACCESS_TOKEN` no Render.
3. Cadastre o webhook:

```text
https://SEU-DOMINIO.onrender.com/api/webhooks/mercadopago
```

4. Selecione eventos de pagamento.
5. Copie a assinatura secreta gerada para `MERCADO_PAGO_WEBHOOK_SECRET`.
6. Execute uma compra Pix de teste e confirme a atualização do pedido após a notificação.
7. Somente depois da homologação, troque o Access Token de teste pela credencial de produção.

O backend rejeita tokens vazios ou de exemplo e apresenta uma mensagem clara em vez de criar pedidos inválidos.

## 7. Login com Google — opcional

1. Crie um projeto no Google Cloud Console.
2. Configure a tela de consentimento OAuth.
3. Crie credenciais OAuth do tipo aplicação web.
4. Cadastre a origem e a URL de retorno exibidas/configuradas pelo projeto.
5. Adicione no Render:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Sem essas variáveis, o login por e-mail e senha continua funcionando normalmente.

## 8. Login com Microsoft/Outlook — opcional

1. Registre uma aplicação no Microsoft Entra ID.
2. Configure a URL de redirecionamento web do NOVA Commerce.
3. Gere um segredo da aplicação.
4. Adicione no Render:

```text
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=common
```

## 9. Validação após o deploy

Abra primeiro:

```text
https://SEU-DOMINIO.onrender.com/api/health
```

Resultado esperado:

```json
{"status":"ok","database":"connected"}
```

Depois execute este roteiro:

- [ ] Página inicial abre sem erro no console.
- [ ] Layout funciona em celular, tablet e computador.
- [ ] Catálogo, busca, categorias e detalhes do produto funcionam.
- [ ] Novo cliente consegue se cadastrar e entrar.
- [ ] Um usuário não visualiza carrinho ou pedidos de outro usuário.
- [ ] Administrador consegue entrar usando as variáveis do Render.
- [ ] Cadastro, edição e exclusão de produtos funcionam.
- [ ] Gestão de clientes, estoque, pedidos e cupons funciona.
- [ ] Imagens dos produtos aparecem corretamente.
- [ ] Carrinho persiste e calcula o total correto.
- [ ] Checkout exige autenticação válida.
- [ ] Pix de teste é gerado pelo Mercado Pago.
- [ ] Webhook atualiza o status do pedido.
- [ ] Logout remove a sessão e protege as páginas privadas.
- [ ] `/api/health` informa banco conectado.
- [ ] Nenhum segredo aparece no console, HTML ou GitHub.

## 10. Entrada em produção

Antes de aceitar vendas reais:

- Troque todas as senhas e segredos usados nos testes.
- Use as credenciais de produção do Mercado Pago.
- Cadastre o domínio definitivo em `WEB_URL` e `PUBLIC_API_URL`.
- Atualize o webhook do Mercado Pago para o domínio definitivo.
- Configure HTTPS, política de privacidade, termos, contato e informações da empresa.
- Revise política de troca, devolução, frete e atendimento ao consumidor.
- Faça um pedido real de valor baixo e valide pagamento, estoque, pedido e confirmação.
- Ative monitoramento, alertas e backups do MongoDB Atlas.

## 11. Diagnóstico rápido

### `database: disconnected`

Confira `MONGODB_URI`, senha, usuário e **Network Access** no Atlas.

### Erro de CORS

Confira se `WEB_URL` contém exatamente o domínio usado no navegador, incluindo `https://` e sem caminho adicional.

### `authorization value not present`

O `MERCADO_PAGO_ACCESS_TOKEN` está ausente, inválido ou ainda contém o valor de exemplo.

### Login retorna 401

Limpe a sessão antiga do navegador, entre novamente e confirme que `JWT_SECRET` não foi alterado após a geração do token.

### Serviço abre, mas a API falha

Confira os logs do Render, o endpoint `/api/health` e as variáveis `PUBLIC_API_URL` e `WEB_URL`.

## 12. Atualizações futuras

Depois de testar uma alteração localmente:

```powershell
npm install
npm test
npm run build
git add -A
git commit -m "Descreva a alteração"
git push origin main
```

O Render detectará o novo commit e iniciará outro deploy automaticamente.
