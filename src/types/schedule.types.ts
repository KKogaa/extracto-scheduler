export interface Action {
  type: string;
  [key: string]: any;
}

export interface PaginationConfig {
  enabled: boolean;
  startPage: number;
  endPage: number;
  pageParam?: string;
}

export interface RateLimitConfig {
  delayBetweenPages: number;
  delayBetweenBatches?: number;
  batchSize?: number;
}

export interface ScrapeConfig {
  baseUrl: string;
  pagination?: PaginationConfig;
  actions: Action[];
  rateLimit: RateLimitConfig;
  options?: Record<string, any>;
}

export interface NotificationConfig {
  enabled: boolean;
  onSuccess?: boolean;
  onFailure?: boolean;
  email?: string;
  webhook?: string;
}

export interface ScrapeSchedule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: string;
  scrapeConfig: ScrapeConfig;
  notifications?: NotificationConfig;
}

export interface ScheduleExecution {
  _id?: any;
  scheduleId: string;
  scheduleName: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'success' | 'failed' | 'partial';
  pagesSubmitted: number;
  pagesFailed: number;
  jobIds: string[];
  duration?: number;
  error?: string;
}

export interface JobSubmissionResult {
  success: boolean;
  jobId?: string;
  error?: string;
  page?: number;
}
