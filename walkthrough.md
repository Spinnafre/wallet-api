# Wallet API Development Walkthrough

A API financeira foi construída do zero, utilizando **NestJS v11**, **Prisma ORM** e as melhores práticas de Clean Architecture / Domain Driven Design (DDD) conforme sua especificação.

## 🚀 O que foi implementado

* **Camada de Domínio (Domain):** Entidades rigorosas ([User](/src/domain/entities/user.entity.ts#4-28), [Wallet](/src/domain/entities/wallet.entity.ts#5-72), [Transaction](/src/domain/entities/transaction.entity.ts#8-74)), Objetos de Valor robustos ([MoneyVO](/src/domain/value-objects/money.vo.ts#1-32), [EmailVO](/src/domain/value-objects/email.vo.ts#1-18)) que gerenciam a aritmética monetária e impedem modelagem inválida, além de Erros Customizados (ex: [InsufficientFundsError](/src/domain/errors/domain-errors.ts#12-17), [WalletFrozenError](/src/domain/errors/domain-errors.ts#18-23)).
* **Camada de Aplicação (Application):** Portas para inversão de dependência (ex.: [WalletRepositoryPort](/src/application/ports/repositories/wallet.repository.port.ts#3-8)) e Casos de Uso agnósticos de base de dados para centralizar as regras de negócio de depósitos, transferências, estornos e autenticação global.
* **Camada de Infraestrutura (Infrastructure):** Interatividade via PostgreSQL e Prisma ORM robusto em suas traduções (`Mappers`) de domínio. Utilizamos autenticação por Tokens JWT e BCRYPT.
* **Camada HTTP:** Validation Pipes e Parse DTO seguros pelo **Zod**, Presenters puros, além do Interceptador Central via **Filters** para mapear os Domain Errors de volta em HTTP response codes de modo legível e padronizado.
* **Observabilidade e Testes:** Totalmente configurado com **OpenTelemetry**, Pino logger e o ecossistema Prometheus para métricas. Conta ainda com framework rápido com **Vitest**, estando com as lógicas validadas sem falhas.

## 🧪 Como testar a aplicação no seu ambiente

Para atestar o comportamento do que construímos localmente, siga estes passos para instanciar a API. Como o comando do **Docker** estava indisponível no ambiente AI durante o provisionamento, a etapa de base de dados requer execução na sua máquina.

1. **Suba as infraestruturas com os containers via Docker** (Banco PostgreSQL, Prometheus, Grafana, Jaeger):

   ```bash
   npm run db:dev:up
   ```

2. **Execute as Migrations do banco de dados (Prisma)**:

   ```bash
   npx prisma migrate dev --name init
   ```

3. **Inicie o servidor de Desenvolvimento do NestJS**:

   ```bash
   npm run start:dev
   ```

4. **Explore e Teste a API pelo portal interativo**:
   Abra seu nevegador: [http://localhost:3000/docs](http://localhost:3000/docs)  
   O Swagger/Scalar já está publicado fornecendo uma visualização moderna da interface. Pode criar recursos, e fazer Login para capturar seu **Access Token** em chamadas seguras!

5. **Exigência de Qualidade - Rode a Suíte de Testes Rapidos**
   Sinta-se livre para rodar os testes unitários da lógica já aprovada em milisegundos via terminal:

   ```bash
   npm run test
   ```

> [!NOTE]
> O projeto seguiu os pilares de design DRY e SOLID impostos pelos limites definidos pelas suas guidelines. As configurações com o setup em OpenTelemetry no Prisma já estão aplicadas e ligadas. O ambiente e2e requer que o docker também esteja funcionando para migrar o schema do test-db.
