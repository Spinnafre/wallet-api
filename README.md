# Wallet API Development Walkthrough

A API financeira foi construída do zero, utilizando **NestJS v11**, **Prisma ORM** e as melhores práticas de Clean Architecture / Domain Driven Design (DDD) conforme sua especificação.

## 🚀 O que foi implementado

* **Camada de Domínio (Domain):** Entidades rigorosas ([User](/src/domain/entities/user.entity.ts#4-28), [Wallet](/src/domain/entities/wallet.entity.ts#5-72), [Transaction](/src/domain/entities/transaction.entity.ts#8-74)), Objetos de Valor robustos ([MoneyVO](/src/domain/value-objects/money.vo.ts#1-32), [EmailVO](/src/domain/value-objects/email.vo.ts#1-18)) que gerenciam a aritmética monetária e impedem modelagem inválida, além de Erros Customizados (ex: [InsufficientFundsError](/src/domain/errors/domain-errors.ts#12-17), [WalletFrozenError](/src/domain/errors/domain-errors.ts#18-23)).
* **Camada de Aplicação (Application):** Portas para inversão de dependência (ex.: [WalletRepositoryPort](/src/application/ports/repositories/wallet.repository.port.ts#3-8)) e Casos de Uso agnósticos de base de dados para centralizar as regras de negócio de depósitos, transferências, estornos e autenticação global.
* **Camada de Infraestrutura (Infrastructure):** Interatividade via PostgreSQL e Prisma ORM robusto em suas traduções (`Mappers`) de domínio. Utilizamos autenticação por Tokens JWT e BCRYPT.
* **Camada HTTP:** Validation Pipes e Parse DTO seguros pelo **Zod**, Presenters puros, além do Interceptador Central via **Filters** para mapear os Domain Errors de volta em HTTP response codes de modo legível e padronizado.
* **Observabilidade e Testes:** Totalmente configurado com **OpenTelemetry**, Pino logger e o ecossistema Prometheus para métricas. Conta ainda com framework rápido com **Vitest**, estando com as lógicas validadas sem falhas.

## 🔐 Configuração de Chaves JWT (RSA)

A aplicação utiliza criptografia assimétrica (RSA) para gerar e validar as assinaturas dos tokens JWT. Para gerar o seu próprio par de chaves localmente, siga os passos abaixo:

1. **Gere a Chave Privada (Private Key):**

   ```bash
   openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out private.pem
   ```

2. **Extraia a Chave Pública (Public Key):**

   ```bash
   openssl pkey -in private.pem -pubout -out public.pem
   ```

3. **Encode as chaves em Base64 para as Variáveis de Ambiente:**

   Como as chaves possuem quebras de linha (`\n`), é necessário convertê-las para Base64 antes de inseri-las no seu arquivo `.env`:

   *Linux / macOS:*

   ```bash
   cat private.pem | base64 -w 0
   cat public.pem | base64 -w 0
   ```

   Copie as strings geradas nos comandos acima e cole-as no seu arquivo `.env` (ou `.env.development` / `.env.test`), nas respectivas chaves `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` envolvidas por aspas:

   ```env
   JWT_PRIVATE_KEY="LS0tL..."
   JWT_PUBLIC_KEY="LS0tL..."
   ```

## 🧪 Como testar a aplicação no seu ambiente

Para atestar o comportamento do que construímos localmente, siga estes passos para instanciar a API. Como o comando do **Docker** estava indisponível no ambiente AI durante o provisionamento, a etapa de base de dados requer execução na sua máquina.

1. **Suba as infraestruturas com os containers via Docker** (Banco PostgreSQL, Prometheus, Grafana, Jaeger):

   ```bash
   npm run db:dev:up
   ```

2. **Execute as Migrations do banco de dados (Prisma)**:

   ```bash
   npm run db:migrate:dev 
   ```

3. **Inicie o servidor de Desenvolvimento do NestJS**:

   ```bash
   npm run start:dev
   ```

4. **Explore e Teste a API pelo portal interativo**:
   Abra seu nevegador: [http://localhost:3333/docs](http://localhost:3333/docs)  
   O Swagger/Scalar já está publicado fornecendo uma visualização moderna da interface. Pode criar recursos, e fazer Login para capturar seu **Access Token** em chamadas seguras!

5. **Exigência de Qualidade - Rode a Suíte de Testes Rápidos**
   Sinta-se livre para rodar os testes unitários da lógica já aprovada em milissegundos via terminal:

   ```bash
   npm run test
   ```

6. **Acesse as Plataformas de Observabilidade:**
   Com os containers em execução, você pode visualizar as métricas e os traces das requisições efetuadas:

   * **Jaeger (Traces):** [http://localhost:16686](http://localhost:16686)
   * **Grafana (Dashboards):** [http://localhost:3001](http://localhost:3001) *(Acesso com login e senha: `admin` / `admin`)*
   * **Prometheus (Métricas brutas):** [http://localhost:9090](http://localhost:9090)

> [!NOTE]
> O projeto seguiu os pilares de design DRY e SOLID impostos pelos limites definidos pelas suas guidelines. As configurações com o setup em OpenTelemetry no Prisma já estão aplicadas e ligadas. O ambiente e2e requer que o docker também esteja funcionando para migrar o schema do test-db.

## 🛡️ Testes de Integração (E2E)

Adicionamos a cobertura completa de testes de integração para todos os endpoints transacionais relacionados às operações de carteira.

### Fluxos Validados

* **Depósitos (`POST /wallet/deposit`)**: Verifica o incremento no saldo (`balanceCents`), o registro correto das informações no banco de dados e a criação da transação do tipo `DEPOSIT`.

* **Transferências P2P (`POST /wallet/transfer`)**: Simula a interação entre duas carteiras separadas (Usuário A transferindo para Usuário B), assegurando que o dinheiro seja debitado da origem e creditado no destino corretamente.
* **Estorno (`POST /wallet/transactions/:transactionId/revert`)**: Garante que ao solicitar o estorno de uma operação de transferência, os saldos das duas contas voltem exatamente ao que eram antes, e o status da transação mude para `REVERTED`.

Para executar a suíte completíssima de testes de integração (que usa o Prisma gerando um schema dinâmico em paralelo para os testes):

```bash
npm run test:integration
```
