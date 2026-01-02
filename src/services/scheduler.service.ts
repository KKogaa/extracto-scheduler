import cron from 'node-cron';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { ScrapeSchedule } from '../types/schedule.types';
import { CONFIG } from '../config';
import { ExecutorService } from './executor.service';

export class SchedulerService {
  private schedules: Map<string, ScrapeSchedule> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private executor: ExecutorService;

  constructor() {
    this.executor = new ExecutorService();
  }

  loadSchedules(): void {
    const files = readdirSync(CONFIG.scheduler.schedulesDir).filter(f => f.endsWith('.json'));
    console.log(`\n📂 Loading ${files.length} schedule(s)...`);
    for (const file of files) {
      try {
        const content = readFileSync(join(CONFIG.scheduler.schedulesDir, file), 'utf-8');
        const schedule: ScrapeSchedule = JSON.parse(content);
        this.schedules.set(schedule.id, schedule);
        console.log(`   ✅ ${schedule.name}`);
      } catch (e) {
        console.error(`   ❌ ${file}`);
      }
    }
  }

  registerSchedules(): void {
    console.log('\n📅 Registering cron jobs...\n');
    for (const [id, schedule] of this.schedules) {
      if (schedule.enabled && cron.validate(schedule.schedule)) {
        const task = cron.schedule(schedule.schedule, () => {
          this.executor.executeSchedule(schedule).catch(console.error);
        }, { scheduled: true, timezone: CONFIG.scheduler.timezone });
        this.cronJobs.set(id, task);
        console.log(`   ✅ ${schedule.name} - ${schedule.schedule}`);
      } else if (!schedule.enabled) {
        console.log(`   ⏸️  ${schedule.name} (disabled)`);
      }
    }
  }

  async executeNow(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`);
    await this.executor.executeSchedule(schedule);
  }

  stopAll(): void {
    for (const task of this.cronJobs.values()) task.stop();
    this.cronJobs.clear();
  }

  getStats() {
    return {
      totalSchedules: this.schedules.size,
      enabledSchedules: Array.from(this.schedules.values()).filter(s => s.enabled).length,
      activeJobs: this.cronJobs.size,
    };
  }
}
