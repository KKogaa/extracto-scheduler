import type {
  ScrapeSchedule,
  ScrapeConfig,
  Action,
  JobSubmissionResult,
} from '../types/schedule.types';
import { ApiClientService } from './api-client.service';

export class ExecutorService {
  private apiClient: ApiClientService;

  constructor() {
    this.apiClient = new ApiClientService();
  }

  async executeSchedule(schedule: ScrapeSchedule): Promise<void> {
    console.log(`\n🚀 Executing: ${schedule.name}`);
    const startTime = Date.now();
    let pagesSubmitted = 0;
    let pagesFailed = 0;
    
    try {
      const { scrapeConfig } = schedule;
      
      if (scrapeConfig.pagination?.enabled) {
        const result = await this.executePaginatedScrape(scrapeConfig);
        pagesSubmitted = result.submitted;
        pagesFailed = result.failed;
      } else {
        const result = await this.executeSingleScrape(scrapeConfig);
        pagesSubmitted = result ? 1 : 0;
        pagesFailed = result ? 0 : 1;
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Completed in ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Pages submitted: ${pagesSubmitted}`);
      console.log(`   Pages failed: ${pagesFailed}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed: ${msg}`);
    }
  }

  private async executePaginatedScrape(
    config: ScrapeConfig
  ): Promise<{ submitted: number; failed: number }> {
    const { baseUrl, pagination, actions, rateLimit, options } = config;
    const { startPage, endPage, pageParam = 'page' } = pagination!;
    const batchSize = rateLimit.batchSize || 1;
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    
    let submitted = 0;
    let failed = 0;
    
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      console.log(`   Batch ${Math.floor(i / batchSize) + 1}: pages ${batch[0]}-${batch[batch.length - 1]}`);
      
      const results = await Promise.all(
        batch.map(p => this.submitPage(baseUrl, p, pageParam, actions, options))
      );
      
      for (const r of results) {
        if (r.success && r.jobId) {
          submitted++;
          console.log(`     ✅ Page ${r.page}: ${r.jobId}`);
        } else {
          failed++;
          console.error(`     ❌ Page ${r.page}: ${r.error}`);
        }
      }
      
      if (i + batchSize < pages.length) {
        await this.sleep(rateLimit.delayBetweenBatches || rateLimit.delayBetweenPages);
      }
    }
    
    return { submitted, failed };
  }

  private async executeSingleScrape(config: ScrapeConfig): Promise<boolean> {
    const result = await this.apiClient.submitScrapeJob(config.baseUrl, config.actions, config.options);
    
    if (result.success && result.jobId) {
      console.log(`   ✅ Job submitted: ${result.jobId}`);
      return true;
    } else {
      console.error(`   ❌ Job failed: ${result.error}`);
      return false;
    }
  }

  private async submitPage(
    baseUrl: string,
    page: number,
    pageParam: string,
    actions: Action[],
    options?: Record<string, any>
  ): Promise<JobSubmissionResult> {
    const url = `${baseUrl}?${pageParam}=${page}`;
    const processedActions = actions.map(a => {
      const processed = { ...a };
      if (processed.url) processed.url = processed.url.replace(/{{url}}/g, url);
      return processed;
    });
    const result = await this.apiClient.submitScrapeJob(url, processedActions, options);
    return { ...result, page };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
