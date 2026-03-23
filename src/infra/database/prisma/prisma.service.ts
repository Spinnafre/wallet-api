import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error' | 'info' | 'warn'>
  implements OnModuleInit, OnApplicationShutdown
{
  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,
  ) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    // Escutando eventos do Prisma e enviando para o Pino
    this.$on('query', (e) => {
      this.logger.debug({ duration: `${e.duration}ms` }, e.query);
    });

    this.$on('error', (e) => this.logger.error(e.message));
    this.$on('info', (e) => this.logger.info(e.message));
    this.$on('warn', (e) => this.logger.warn(e.message));

    await this.$connect();

    this.logger.info('Connected to database');
  }

  async onApplicationShutdown() {
    await this.$disconnect();
    this.logger.info('Disconnected from database');
  }
}
