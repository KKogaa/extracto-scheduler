import axios, { AxiosInstance } from 'axios';
import { CONFIG } from '../config';
import type { Action, JobSubmissionResult } from '../types/schedule.types';

export class ApiClientService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.fetchApi.baseUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async submitScrapeJob(url: string, actions: Action[], options?: Record<string, any>): Promise<JobSubmissionResult> {
    try {
      const response = await this.client.post(CONFIG.fetchApi.scrapeEndpoint, { url, actions, options });
      return response.data.jobId ? { success: true, jobId: response.data.jobId } : { success: false, error: 'No jobId' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch { return false; }
  }
}
