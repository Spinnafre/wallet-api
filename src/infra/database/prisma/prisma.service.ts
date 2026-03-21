import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  constructor(private readonly logger: PinoLogger) {
    super();
    this.logger.setContext(PrismaService.name);
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.info('Connected to database');
  }

  async onApplicationShutdown() {
    await this.$disconnect();
    this.logger.info('Disconnected from database');
  }
}
