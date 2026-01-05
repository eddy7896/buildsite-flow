import { z } from 'zod';

export interface SystemMetrics {
  totalAgencies: number;
  activeAgencies: number;
  totalUsers: number;
  activeUsers: number;
  subscriptionPlans: {
    basic: number;
    pro: number;
    enterprise: number;
  };
  revenueMetrics: {
    mrr: number;
    arr: number;
  };
  usageStats: {
    totalProjects: number;
    totalInvoices: number;
    totalClients: number;
    totalAttendanceRecords: number;
  };
  systemHealth: {
    uptime: string;
    responseTime: number;
    errorRate: number;
  };
}

export interface AgencySummary {
  id: string;
  name: string;
  domain: string | null;
  subscription_plan: string | null;
  max_users: number | null;
  is_active: boolean;
  created_at: string;
  user_count?: number;
  project_count?: number;
  invoice_count?: number;
  maintenance_mode?: boolean;
  maintenance_message?: string | null;
}

export interface SystemMetricsResponse {
  metrics: SystemMetrics;
  agencies: AgencySummary[];
}

// Zod schemas for runtime validation
export const SystemMetricsSchema = z.object({
  totalAgencies: z.number(),
  activeAgencies: z.number(),
  totalUsers: z.number(),
  activeUsers: z.number(),
  subscriptionPlans: z.object({
    basic: z.number(),
    pro: z.number(),
    enterprise: z.number(),
  }),
  revenueMetrics: z.object({
    mrr: z.number(),
    arr: z.number(),
  }),
  usageStats: z.object({
    totalProjects: z.number(),
    totalInvoices: z.number(),
    totalClients: z.number(),
    totalAttendanceRecords: z.number(),
  }),
  systemHealth: z.object({
    uptime: z.string(),
    responseTime: z.number(),
    errorRate: z.number(),
  }),
});

export const AgencySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.union([z.string(), z.null()]),
  subscription_plan: z.union([z.string(), z.null()]),
  max_users: z.union([z.number(), z.null()]),
  is_active: z.boolean(),
  created_at: z.string(),
  user_count: z.number().optional().default(0),
  project_count: z.number().optional().default(0),
  invoice_count: z.number().optional().default(0),
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.union([z.string(), z.null()]).optional(),
});

export const SystemMetricsResponseSchema = z.object({
  metrics: SystemMetricsSchema,
  agencies: z.array(AgencySummarySchema),
});

