# Especificação Técnica — API RESTful de Carteira Financeira (NestJS)

> **Instrução para a IA:** Leia esta especificação integralmente antes de escrever qualquer linha de código. Siga a ordem das seções. Em caso de dúvida, prefira a abordagem mais explícita descrita aqui em vez de inferir. Ao finalizar cada seção, valide mentalmente se os critérios de aceite foram cumpridos antes de prosseguir.

---

## 1. Visão Geral do Projeto

### 1.1 Objetivo

Desenvolver uma API RESTful para um sistema de **carteira financeira digital**, permitindo que usuários se registrem, façam login, depositem dinheiro, realizem transferências entre carteiras e revertam transações quando necessário.

### 1.2 Princípios Fundamentais

- **Clean Architecture + Ports & Adapters:** nenhuma camada de domínio conhece detalhes de infraestrutura.
- **TDD como fluxo de desenvolvimento:** escreva o teste antes da implementação. Meta mínima: **80% de cobertura** (unitário + integração).
- **Clean Code:** funções com responsabilidade única, nomes significativos, sem duplicação.
- **Observabilidade de produção:** logs estruturados (Pino), métricas (Prometheus), tracing distribuído (OpenTelemetry + Jaeger), visualização (Grafana).
- **Zero `console.log`:** todo registro deve passar pelo Pino e ser encaminhado ao OpenTelemetry Collector.

---

## 2. Stack de Tecnologias

| Camada | Tecnologia | Versão mínima |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Linguagem | TypeScript | 5.x |
| Framework | NestJS | 10.x |
| ORM | Prisma | 5.x |
| Banco de dados | PostgreSQL | 16 |
| Validação | Zod (integrado a DTOs via pipes) | 3.x |
| Testes | Vitest | 1.x |
| Logs | Pino + pino-http | latest |
| Métricas | nestjs-prometheus | latest |
| Tracing | @opentelemetry/sdk-node | latest |
| Coletor OTel | OpenTelemetry Collector | latest |
| Visualização traces | Jaeger | latest |
| Visualização dashboards | Grafana | latest |
| Documentação API | Scalar + OpenAPI (swagger) | latest |
| Linter | ESLint | 8.x |
| Formatter | Prettier | 3.x |
| Git hooks | Husky + lint-staged | latest |
| Dev runner | TSX | latest |
| Path aliases | tsconfig-paths | latest |
| Containerização | Docker + Docker Compose | latest |

---

## 3. Estrutura de Diretórios

A IA **deve** criar exatamente esta estrutura. Nenhum arquivo de lógica de negócio deve existir fora de `src/`.

```
.
├── .husky/
│   ├── pre-commit        # lint-staged
│   └── pre-push          # testes unitários
├── .vscode/
│   └── launch.json       # configurações de debugger (ver seção 8)
├── docker/
│   ├── otel-collector-config.yml
│   ├── prometheus.yml
│   └── grafana/
│       └── provisioning/
│           ├── datasources/
│           └── dashboards/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── main.ts                  # bootstrap + graceful shutdown
│   ├── app.module.ts
│   ├── config/                  # variáveis de ambiente tipadas com Zod
│   │   └── env.ts
│   ├── domain/                  # entidades ricas, value objects, erros de domínio
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── wallet.entity.ts
│   │   │   └── transaction.entity.ts
│   │   ├── value-objects/
│   │   │   ├── money.vo.ts
│   │   │   └── email.vo.ts
│   │   └── errors/
│   │       ├── insufficient-funds.error.ts
│   │       ├── wallet-frozen.error.ts
│   │       └── transaction-not-found.error.ts
│   ├── application/             # casos de uso (ports + use-cases)
│   │   ├── ports/
│   │   │   ├── repositories/
│   │   │   │   ├── user.repository.port.ts
│   │   │   │   ├── wallet.repository.port.ts
│   │   │   │   └── transaction.repository.port.ts
│   │   │   └── services/
│   │   │       └── hash.service.port.ts
│   │   └── use-cases/
│   │       ├── auth/
│   │       │   ├── register-user.use-case.ts
│   │       │   └── authenticate-user.use-case.ts
│   │       ├── wallet/
│   │       │   ├── deposit.use-case.ts
│   │       │   ├── transfer.use-case.ts
│   │       │   └── revert-transaction.use-case.ts
│   │       └── shared/
│   │           └── get-balance.use-case.ts
│   ├── infra/                   # adapters de infraestrutura
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.service.ts
│   │   │   │   └── repositories/
│   │   │   │       ├── prisma-user.repository.ts
│   │   │   │       ├── prisma-wallet.repository.ts
│   │   │   │       └── prisma-transaction.repository.ts
│   │   │   └── mappers/
│   │   │       ├── user.mapper.ts
│   │   │       ├── wallet.mapper.ts
│   │   │       └── transaction.mapper.ts
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── wallet.controller.ts
│   │   │   ├── dtos/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── register.dto.ts
│   │   │   │   │   └── login.dto.ts
│   │   │   │   └── wallet/
│   │   │   │       ├── deposit.dto.ts
│   │   │   │       ├── transfer.dto.ts
│   │   │   │       └── revert-transaction.dto.ts
│   │   │   ├── presenters/
│   │   │   │   ├── user.presenter.ts
│   │   │   │   ├── wallet.presenter.ts
│   │   │   │   └── transaction.presenter.ts
│   │   │   └── pipes/
│   │   │       └── zod-validation.pipe.ts
│   │   ├── auth/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── bcrypt-hash.service.ts
│   │   └── observability/
│   │       ├── logger/
│   │       │   ├── pino-logger.module.ts
│   │       │   └── pino-logger.service.ts
│   │       ├── metrics/
│   │       │   └── prometheus.module.ts
│   │       └── tracing/
│   │           └── otel.bootstrap.ts   # inicializado ANTES do NestJS
│   └── shared/
│       ├── decorators/
│       │   └── current-user.decorator.ts
│       └── filters/
│           └── domain-exception.filter.ts
├── test/
│   ├── unit/
│   │   ├── use-cases/
│   │   └── domain/
│   ├── integration/
│   │   ├── setup/
│   │   │   └── global-setup.ts   # cria/apaga schema UUID por suite
│   │   └── wallet/
│   │       ├── deposit.e2e-spec.ts
│   │       ├── transfer.e2e-spec.ts
│   │       └── revert.e2e-spec.ts
│   └── factories/                # builders de entidades para testes
├── .env.example
├── .env.development
├── .env.test
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── tsconfig.json
├── tsconfig.paths.json
├── vitest.config.ts
├── vitest.integration.config.ts
└── package.json
```

---

## 4. Modelagem de Domínio

### 4.1 Entidades Ricas

Todas as entidades devem encapsular regras de negócio e nunca expor estado mutável diretamente.

#### `User`
```typescript
// Campos: id (UUID), email (EmailVO), passwordHash, createdAt, updatedAt
// Métodos: static create(...), verifyPassword(plain): boolean
```

#### `Wallet`
```typescript
// Campos: id (UUID), userId, balance (MoneyVO), frozen (boolean), createdAt, updatedAt
// Métodos:
//   credit(amount: MoneyVO): void  — lança WalletFrozenError se frozen === true
//   debit(amount: MoneyVO): void   — lança InsufficientFundsError | WalletFrozenError
//   freeze(): void
```

#### `Transaction`
```typescript
// Campos: id (UUID), type ('DEPOSIT'|'TRANSFER'), status ('PENDING'|'COMPLETED'|'REVERTED'),
//         sourceWalletId (nullable), targetWalletId, amount (MoneyVO), revertedAt (nullable), createdAt
// Métodos: revert(): void — muda status para REVERTED e define revertedAt
```

#### Value Objects

- **`MoneyVO`**: encapsula `number` (cents/integer), impede valores negativos, operações `add`, `subtract`, `isGreaterThan`.
- **`EmailVO`**: valida formato RFC 5322 no construtor.

#### Erros de Domínio

Todos estendem uma `DomainError` base com `code: string` e `message: string`. O `DomainExceptionFilter` global os mapeia para HTTP responses.

| Classe | HTTP Status |
|---|---|
| `InsufficientFundsError` | 422 |
| `WalletFrozenError` | 422 |
| `TransactionNotFoundError` | 404 |
| `UserAlreadyExistsError` | 409 |
| `InvalidCredentialsError` | 401 |

---

## 5. Banco de Dados (Prisma + PostgreSQL)

### 5.1 Schema Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  wallet       Wallet?
}

model Wallet {
  id                  String        @id @default(uuid())
  userId              String        @unique
  balanceCents        Int           @default(0)
  frozen              Boolean       @default(false)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  user                User          @relation(fields: [userId], references: [id])
  sentTransactions    Transaction[] @relation("SourceWallet")
  receivedTransactions Transaction[] @relation("TargetWallet")
}

model Transaction {
  id             String            @id @default(uuid())
  type           TransactionType
  status         TransactionStatus @default(PENDING)
  sourceWalletId String?
  targetWalletId String
  amountCents    Int
  revertedAt     DateTime?
  createdAt      DateTime          @default(now())
  sourceWallet   Wallet?           @relation("SourceWallet", fields: [sourceWalletId], references: [id])
  targetWallet   Wallet            @relation("TargetWallet", fields: [targetWalletId], references: [id])
}

enum TransactionType {
  DEPOSIT
  TRANSFER
}

enum TransactionStatus {
  PENDING
  COMPLETED
  REVERTED
}
```

### 5.2 Regras de Migração

- Usar `prisma migrate dev` em desenvolvimento.
- Usar `prisma migrate deploy` em produção (via entrypoint do container).
- Nunca editar arquivos de migration já aplicados; criar novas migrations para alterações.

---

## 6. Camada de Aplicação — Casos de Uso

Cada caso de uso recebe suas dependências via construtor (injeção de interfaces/ports), nunca classes concretas.

### 6.1 `RegisterUserUseCase`

**Input:** `{ email: string; password: string }`

**Fluxo:**
1. Verificar se email já existe via `UserRepository.findByEmail`.
2. Se existir → lançar `UserAlreadyExistsError`.
3. Criar `EmailVO` (valida formato).
4. Hash da senha via `HashServicePort.hash`.
5. Criar entidade `User` via `User.create(...)`.
6. Persistir via `UserRepository.save`.
7. Criar entidade `Wallet` com `balanceCents = 0`.
8. Persistir via `WalletRepository.save`.
9. Retornar `User`.

### 6.2 `AuthenticateUserUseCase`

**Input:** `{ email: string; password: string }`

**Fluxo:**
1. Buscar usuário por email.
2. Se não encontrado → `InvalidCredentialsError`.
3. Verificar senha via `HashServicePort.compare`.
4. Se inválida → `InvalidCredentialsError`.
5. Gerar JWT com payload `{ sub: user.id, email }`.
6. Retornar `{ accessToken: string }`.

### 6.3 `DepositUseCase`

**Input:** `{ walletId: string; amountCents: number }` (autenticado)

**Fluxo:**
1. Buscar carteira via `WalletRepository.findById`.
2. Se saldo atual for negativo → lançar `WalletFrozenError` com mensagem específica ("saldo negativo, carteira congelada").
3. Chamar `wallet.credit(MoneyVO.of(amountCents))` — isso também verifica `frozen`.
4. Criar `Transaction` com `type = DEPOSIT`, `status = PENDING`.
5. Persistir transação e carteira atomicamente (Prisma `$transaction`).
6. Atualizar `Transaction.status = COMPLETED`.
7. Retornar `Transaction`.

> **Regra crítica:** Se `wallet.balanceCents < 0` **antes** do crédito, nenhum depósito deve ser aceito. A flag `frozen` deve ser definida automaticamente quando o saldo fica negativo (isso pode acontecer por reversão de transação).

### 6.4 `TransferUseCase`

**Input:** `{ sourceWalletId: string; targetWalletId: string; amountCents: number }` (autenticado)

**Fluxo:**
1. Buscar carteira de origem e destino.
2. Chamar `sourceWallet.debit(amount)` — lança `InsufficientFundsError` ou `WalletFrozenError`.
3. Chamar `targetWallet.credit(amount)`.
4. Criar `Transaction` com `type = TRANSFER`, `status = PENDING`.
5. Persistir carteiras e transação atomicamente.
6. Atualizar status para `COMPLETED`.
7. Retornar `Transaction`.

### 6.5 `RevertTransactionUseCase`

**Input:** `{ transactionId: string }` (autenticado — apenas o dono da carteira envolvida)

**Fluxo:**
1. Buscar transação por ID.
2. Se não encontrada → `TransactionNotFoundError`.
3. Se `status !== COMPLETED` → lançar `InvalidOperationError` ("somente transações completadas podem ser revertidas").
4. Chamar `transaction.revert()`.
5. **Se DEPOSIT:** debitar o valor da carteira alvo. Se o débito resultar em saldo negativo, definir `wallet.frozen = true`.
6. **Se TRANSFER:** debitar da carteira alvo, creditar na carteira de origem. Se qualquer carteira ficar negativa, congelar.
7. Persistir tudo atomicamente.
8. Retornar `Transaction`.

---

## 7. Camada HTTP — Controllers, DTOs e Presenters

### 7.1 Rotas da API

| Método | Rota | Guard | Descrição |
|---|---|---|---|
| POST | `/auth/register` | público | Registrar usuário |
| POST | `/auth/login` | público | Autenticar usuário |
| POST | `/wallet/deposit` | JWT | Depositar valor |
| POST | `/wallet/transfer` | JWT | Transferir para outro usuário |
| POST | `/wallet/revert/:transactionId` | JWT | Reverter transação |
| GET | `/wallet/balance` | JWT | Consultar saldo atual |
| GET | `/wallet/transactions` | JWT | Listar histórico de transações |

### 7.2 DTOs com Zod

Cada DTO deve exportar:
1. Um **schema Zod** para validação.
2. Um **type TypeScript** inferido do schema.
3. Ser usado pelo `ZodValidationPipe` global.

Exemplo de padrão:

```typescript
// deposit.dto.ts
import { z } from 'zod';

export const DepositSchema = z.object({
  amountCents: z
    .number({ required_error: 'amountCents é obrigatório' })
    .int('Deve ser inteiro (cents)')
    .positive('Deve ser positivo'),
});

export type DepositDto = z.infer<typeof DepositSchema>;
```

### 7.3 ZodValidationPipe

Implementar um `PipeTransform` global que recebe o schema Zod como parâmetro e lança `BadRequestException` com os erros formatados se a validação falhar.

### 7.4 Presenters

Presenters formatam a saída das entidades de domínio para objetos JSON. Nunca expor `passwordHash`.

```typescript
// user.presenter.ts
export class UserPresenter {
  static toHttp(user: User) {
    return { id: user.id, email: user.email.value, createdAt: user.createdAt };
  }
}
```

---

## 8. Autenticação — JWT

- Usar `@nestjs/jwt` e `@nestjs/passport` com estratégia `passport-jwt`.
- O token deve ter expiração de **24h** (configurável via variável de ambiente `JWT_EXPIRES_IN`).
- O payload do token: `{ sub: string (userId), email: string, iat: number, exp: number }`.
- O decorator `@CurrentUser()` extrai o usuário autenticado do request.
- Senhas armazenadas com **bcrypt** (salt rounds: 12, configurável).

---

## 9. Observabilidade

### 9.1 Logs Estruturados (Pino)

- Instalar `nestjs-pino` e `pino-http`.
- **Proibido** usar `console.log` em qualquer ponto do código. Use o `Logger` injetável do NestJS configurado para usar Pino como transport.
- Campos obrigatórios em todo log: `timestamp`, `level` (INFO/ERROR/WARN/DEBUG), `context` (nome do módulo/classe), `traceId` (extraído do contexto OpenTelemetry ativo).
- Logs de erro devem incluir `stack` e campos extras do erro de domínio.
- Em produção (`NODE_ENV=production`): saída JSON pura (sem pretty-print).
- Em desenvolvimento: usar `pino-pretty` para legibilidade.
- Todos os logs gerados pelo Pino devem ser **exportados para o OpenTelemetry Collector** via `pino-opentelemetry-transport` ou configuração de exporter customizado.

### 9.2 Métricas (Prometheus via `nestjs-prometheus`)

Configurar os seguintes contadores/histogramas:

| Métrica | Tipo | Descrição |
|---|---|---|
| `http_requests_total` | Counter | Total de requisições por método, rota e status |
| `http_request_duration_seconds` | Histogram | Latência por rota |
| `wallet_deposits_total` | Counter | Total de depósitos realizados |
| `wallet_transfers_total` | Counter | Total de transferências |
| `wallet_reversions_total` | Counter | Total de reversões |
| `nodejs_memory_heap_used_bytes` | Gauge | Uso de heap (padrão do prom-client) |

Expor endpoint `/metrics` (não autenticado, apenas acessível internamente).

### 9.3 Tracing (OpenTelemetry + Jaeger)

- O arquivo `src/infra/observability/tracing/otel.bootstrap.ts` **deve ser importado como primeiro statement** do `main.ts`, antes de qualquer import NestJS.
- Usar `@opentelemetry/sdk-node` com auto-instrumentação para:
  - HTTP requests (`@opentelemetry/instrumentation-http`)
  - Express/NestJS (`@opentelemetry/instrumentation-express`)
  - Prisma queries (via `@prisma/instrumentation`)
- Exporter: **OTLP gRPC** apontando para o OpenTelemetry Collector (`OTEL_EXPORTER_OTLP_ENDPOINT`).
- O Collector encaminha traces para o **Jaeger** e métricas para o **Prometheus**.
- Nomear o serviço via `OTEL_SERVICE_NAME=financial-wallet-api`.

### 9.4 Configuração docker-compose.yml para Observabilidade

```yaml
# Inclua os serviços abaixo no docker-compose.yml principal

services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yml"]
    volumes:
      - ./docker/otel-collector-config.yml:/etc/otel-collector-config.yml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8889:8889"   # Prometheus scrape endpoint do coletor
    depends_on:
      - jaeger
      - prometheus

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "14250:14250"  # gRPC

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - ./docker/grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - prometheus
      - jaeger
```

---

## 10. Setup do Projeto

### 10.1 Variáveis de Ambiente

Criar `.env.example` com todas as variáveis obrigatórias. Usar Zod para validar o env no bootstrap:

```
# App
NODE_ENV=development
PORT=3000
APP_NAME=financial-wallet-api

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wallet_db

# Auth
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12

# OpenTelemetry
OTEL_SERVICE_NAME=financial-wallet-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc

# Logging
LOG_LEVEL=info
```

### 10.2 Scripts do `package.json`

```json
{
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "start:dev": "tsx watch src/main.ts",
    "start:debug": "tsx watch --inspect src/main.ts",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest --config vitest.config.ts",
    "test:coverage": "vitest run --coverage --config vitest.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:integration:watch": "vitest --config vitest.integration.config.ts",
    "db:dev:up": "docker compose --profile dev up -d",
    "db:test:up": "docker compose --profile test up -d",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### 10.3 TSConfig e Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@domain/*": ["./src/domain/*"],
      "@application/*": ["./src/application/*"],
      "@infra/*": ["./src/infra/*"],
      "@shared/*": ["./src/shared/*"],
      "@config/*": ["./src/config/*"],
      "@test/*": ["./test/*"]
    }
  }
}
```

Registrar `tsconfig-paths/register` no bootstrap de testes e no script de dev.

### 10.4 ESLint e Prettier

`.eslintrc.js` deve incluir:
- `@typescript-eslint/recommended`
- `no-console: error` (proibir console.log explicitamente via lint)
- Regra `import/no-cycle` para detectar dependências circulares entre camadas

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### 10.5 Husky

```bash
# .husky/pre-commit
npx lint-staged

# .husky/pre-push
npm run test
```

`lint-staged` configurado em `package.json`:
```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

---

## 11. Testes

### 11.1 Testes Unitários

- Localização: `test/unit/`
- Ferramentas: Vitest + mocks manuais das interfaces (ports).
- **Cada caso de uso deve ter 100% dos seus fluxos testados**, incluindo:
  - Caminho feliz.
  - Todos os erros de domínio possíveis.
  - Comportamento em condições de borda (saldo zerado, carteira congelada etc.).
- Entidades de domínio devem ter testes para cada método e invariante.
- Usar `vitest.config.ts` com `environment: 'node'` e sem banco de dados.

### 11.2 Testes de Integração (E2E)

- Localização: `test/integration/`
- Ferramentas: Vitest + Supertest + container PostgreSQL em tmpfs.
- Usar `vitest.integration.config.ts` com `globalSetup` apontando para `test/integration/setup/global-setup.ts`.

**`global-setup.ts` deve:**
1. Gerar um UUID único para o schema: `const schemaId = randomUUID()`.
2. Criar o schema no banco de testes: `CREATE SCHEMA IF NOT EXISTS "schema_${schemaId}"`.
3. Rodar migrations do Prisma naquele schema: `DATABASE_URL` com `?schema=schema_${schemaId}`.
4. Expor o `DATABASE_URL` customizado via `process.env` para os testes.
5. No `teardown`: executar `DROP SCHEMA "schema_${schemaId}" CASCADE`.

**Cada arquivo de teste de integração deve:**
- Subir a aplicação NestJS completa com `NestFactory.create`.
- Usar uma instância de Supertest apontando para o app.
- Testar o fluxo completo via HTTP, incluindo headers, status codes e corpo da resposta.
- Limpar dados específicos do teste (não o schema inteiro — isso é feito apenas no teardown global).

### 11.3 Cobertura Mínima

| Tipo | Mínimo |
|---|---|
| Statements | 80% |
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |

Configurar `coverage` no `vitest.config.ts` com `provider: 'v8'` e `thresholds` para falhar o CI se não atingir.

---

## 12. Docker Compose Completo

```yaml
# docker-compose.yml

services:
  # ──────────── Bancos de Dados ────────────

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: wallet
      POSTGRES_PASSWORD: wallet
      POSTGRES_DB: wallet_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    profiles: ["dev", "prod"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wallet"]
      interval: 5s
      timeout: 5s
      retries: 5

  test-db:
    image: postgres:16
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: testdb
    tmpfs:
      - /var/lib/postgresql/data:size=1G
    ports:
      - "5433:5432"
    profiles: ["test"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ──────────── Observabilidade ────────────

  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yml"]
    volumes:
      - ./docker/otel-collector-config.yml:/etc/otel-collector-config.yml
    ports:
      - "4317:4317"
      - "4318:4318"
      - "8889:8889"
    depends_on:
      - jaeger
      - prometheus
    profiles: ["dev", "prod"]

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14250:14250"
    profiles: ["dev", "prod"]

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    profiles: ["dev", "prod"]

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - ./docker/grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - prometheus
      - jaeger
    profiles: ["dev", "prod"]

volumes:
  postgres_data:
```

---

## 13. Debugger VSCode

Criar `.vscode/launch.json` com as seguintes configurações:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "🚀 API: Dev (watch + debug)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["tsx", "watch", "--inspect-brk", "src/main.ts"],
      "envFile": "${workspaceFolder}/.env.development",
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "🧪 Tests: Unit (debug)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": [
        "vitest",
        "--config",
        "vitest.config.ts",
        "--reporter=verbose"
      ],
      "envFile": "${workspaceFolder}/.env.test",
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "🔗 Tests: Integration (debug)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": [
        "vitest",
        "--config",
        "vitest.integration.config.ts",
        "--reporter=verbose"
      ],
      "envFile": "${workspaceFolder}/.env.test",
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 14. Graceful Shutdown

No `src/main.ts`, após o `app.listen(...)`, adicionar:

```typescript
const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

for (const signal of signals) {
  process.on(signal, async () => {
    logger.log(`Sinal ${signal} recebido. Encerrando aplicação...`);
    await app.close();
    process.exit(0);
  });
}
```

Habilitar também `app.enableShutdownHooks()` para que NestJS notifique os módulos (PrismaService deve implementar `OnApplicationShutdown` e chamar `$disconnect()`).

---

## 15. Documentação da API (OpenAPI + Scalar)

- Usar `@nestjs/swagger` para decorar controllers e DTOs com metadados OpenAPI.
- Configurar o Scalar como UI no endpoint `/docs`.
- Disponibilizar os dados JSON em `/docs-json`.
- Todos os endpoints devem ter:
  - `@ApiOperation({ summary: '...' })`
  - `@ApiResponse` para cada status code possível (200, 201, 400, 401, 404, 409, 422)
  - `@ApiBody` com o schema do DTO
  - `@ApiBearerAuth()` nas rotas protegidas
- O schema deve ser gerado automaticamente a partir das classes DTO + decorators.

---

## 16. Critérios de Aceite por Feature

### Registro de Usuário
- [ ] Retorna `201` com dados do usuário (sem `passwordHash`) ao criar com sucesso.
- [ ] Retorna `409` se email já cadastrado.
- [ ] Retorna `400` com erros de validação se campos inválidos.
- [ ] Carteira criada automaticamente com `balance = 0` na criação do usuário.

### Login
- [ ] Retorna `200` com `accessToken` (JWT válido) ao autenticar com sucesso.
- [ ] Retorna `401` com credenciais incorretas.

### Depósito
- [ ] Retorna `201` com dados da transação ao depositar.
- [ ] Retorna `422` se carteira estiver congelada (saldo negativo).
- [ ] Retorna `401` sem token JWT.
- [ ] Saldo é atualizado corretamente.

### Transferência
- [ ] Retorna `201` com dados da transação ao transferir.
- [ ] Retorna `422` se saldo insuficiente.
- [ ] Retorna `422` se carteira de origem congelada.
- [ ] Saldo de origem decrementado e destino incrementado atomicamente.

### Reversão
- [ ] Retorna `200` com transação revertida.
- [ ] Retorna `404` se transação não encontrada.
- [ ] Retorna `422` se transação já revertida ou não completada.
- [ ] Se reversão resultar em saldo negativo, carteira é congelada.

---

## 17. Ordem de Implementação Recomendada

A IA deve seguir esta sequência para garantir que as fundações estejam corretas antes das camadas superiores:

1. **Setup inicial:** `package.json`, `tsconfig.json`, ESLint, Prettier, Husky.
2. **Docker Compose:** banco de dados dev + test + serviços de observabilidade.
3. **Schema Prisma** e primeira migration.
4. **Domínio:** Value Objects → Entidades → Erros de Domínio (com testes unitários).
5. **Ports (interfaces):** repositórios e serviços.
6. **Casos de uso** (com testes unitários usando mocks dos ports).
7. **Adapters de infraestrutura:** PrismaService + repositórios concretos.
8. **Setup de observabilidade:** Pino → OpenTelemetry bootstrap → Prometheus.
9. **Camada HTTP:** DTOs + ZodValidationPipe + controllers + presenters.
10. **Autenticação:** JWT strategy + guard.
11. **Testes de integração** para todos os fluxos.
12. **Documentação OpenAPI + Scalar.**
13. **Graceful Shutdown.**
14. **VSCode launch.json.**
15. **README.md** com instruções de execução.

---

## 18. README.md (Conteúdo Obrigatório)

O README deve conter, no mínimo:

- Pré-requisitos (Node.js 20, Docker, Docker Compose)
- Como clonar e instalar dependências
- Como configurar variáveis de ambiente (copiar `.env.example`)
- Como subir o ambiente de desenvolvimento:
  ```bash
  docker compose --profile dev up -d
  npm run db:migrate
  npm run start:dev
  ```
- Como rodar testes unitários e de integração
- URLs dos serviços:
  - API: `http://localhost:3000`
  - Documentação: `http://localhost:3000/docs`
  - Jaeger: `http://localhost:16686`
  - Prometheus: `http://localhost:9090`
  - Grafana: `http://localhost:3001` (admin/admin)
- Diagrama de arquitetura (ASCII ou Mermaid)

---

*Fim da especificação. Versão 1.0.0 — revisada para desenvolvimento com IA.*