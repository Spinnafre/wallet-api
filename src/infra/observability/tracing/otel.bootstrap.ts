import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { env } from '@config/env';

const traceExporter = new OTLPTraceExporter({
  url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
});

export const otelSDK = new NodeSDK({
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

export function bootstrapOtel() {
  try {
    otelSDK.start();
    console.log('OpenTelemetry SDK started successfully');
  } catch (error) {
    console.error('Error initializing OpenTelemetry SDK', error);
  }
}

process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down successfully'))
    .catch((error) => console.log('Error shutting down OpenTelemetry SDK', error));
});
