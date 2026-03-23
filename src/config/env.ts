import 'dotenv/config';

import z from 'zod';
import { fromError } from 'zod-validation-error';

const envModes = ['development', 'production', 'test'];
type Duration = `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`;

const envSchema = z.object({
  APP_NAME: z.string(),
  JWT_SECRET: z.string(),
  JWT_PUBLIC_KEY: z.string().nonempty(),
  JWT_PRIVATE_KEY: z.string().nonempty(),
  JWT_EXPIRES_IN: z.string().min(1) as z.ZodType<Duration>,
  BCRYPT_SALT_ROUNDS: z.coerce.number().positive(),
  OTEL_SERVICE_NAME: z.string(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url(),
  OTEL_EXPORTER_OTLP_PROTOCOL: z.enum(['http', 'grpc']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
  DATABASE_URL: z.url(),
  CLIENT_ORIGIN: z.url(),
  PORT: z.coerce.number().positive(),
  NODE_ENV: z.enum(envModes).default('development'),
});

export type IEnv = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(fromError(parsedEnv.error));
  process.exit(1);
}

export const env: IEnv = parsedEnv.data;

export async function validate(config: Record<string, unknown>) {
  const validatedConfig = await envSchema.safeParseAsync(config);

  if (!validatedConfig.success) {
    console.log('ERRO VALIDAÇÃO');
    throw new Error(z.prettifyError(validatedConfig.error));
  }

  return validatedConfig;
}
