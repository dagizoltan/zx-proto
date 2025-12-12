import { z } from 'zod';

export const LogSchema = z.object({
  id: z.string().uuid(),
  level: z.string(),
  message: z.string(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  trace_id: z.string().optional()
});

export const TraceSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string(),
  spanName: z.string(),
  duration: z.number(),
  success: z.boolean(),
  error: z.string().optional(),
  timestamp: z.string().datetime()
});

export const MetricSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  value: z.union([z.number(), z.string()]),
  tags: z.record(z.any()).optional(),
  timestamp: z.string().datetime()
});
