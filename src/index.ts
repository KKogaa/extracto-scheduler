import { SchedulerService } from './services/scheduler.service';
import { CONFIG } from './config';

async function main() {
  console.log('\n🕷️  Extracto Scheduler Service\n');
  console.log(`Environment: ${CONFIG.nodeEnv}`);
  console.log(`Fetch API: ${CONFIG.fetchApi.baseUrl}`);
  console.log(`Schedules Dir: ${CONFIG.scheduler.schedulesDir}`);
  console.log(`Timezone: ${CONFIG.scheduler.timezone}`);

  const scheduler = new SchedulerService();
  scheduler.loadSchedules();
  scheduler.registerSchedules();

  const stats = scheduler.getStats();
  console.log(`\n📊 Stats: ${stats.totalSchedules} total, ${stats.enabledSchedules} enabled, ${stats.activeJobs} active\n`);
  console.log('✅ Scheduler running. Ctrl+C to stop.\n');

  // Execute now flag
  if (process.argv[2] === '--execute-now' && process.argv[3]) {
    await scheduler.executeNow(process.argv[3]);
  }
  
  // Run all enabled schedules immediately on startup
  if (process.argv[2] === '--run-on-startup') {
    console.log('🚀 Running all enabled schedules on startup...\n');
    const schedules = Array.from(scheduler['schedules'].values()).filter(s => s.enabled);
    for (const schedule of schedules) {
      await scheduler.executeNow(schedule.id);
    }
    console.log('\n✅ Startup execution complete. Waiting for next scheduled run...\n');
  }

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    scheduler.stopAll();
    console.log('Goodbye! 👋');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(console.error);
