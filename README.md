# Extracto Scheduler

Cron-based scheduler for automated web scraping with pagination support and MongoDB execution tracking.

## ✅ Features

- **Cron Scheduling** - Run scrapes on schedule (daily, weekly, hourly)
- **JSON Configuration** - Define scraping plans in JSON files
- **Pagination Support** - Automatically scrapes multiple pages
- **Batch Processing** - Submit pages in parallel batches with rate limiting
- **Execution Tracking** - MongoDB history of all scrape executions
- **Template Variables** - Dynamic URL replacement with `{{url}}`

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure
cp .env.example .env
# Edit .env with your settings

# Run in development mode
npm run dev

# Execute a schedule immediately (for testing)
npm run dev -- --execute-now falabella-celulares-12h

# Build for production
npm run build
npm start
```

## 📋 Schedule Configuration

Create JSON files in `src/schedules/` directory:

```json
{
  "id": "falabella-celulares-12h",
  "name": "Falabella Celulares - Every 12 Hours",
  "enabled": true,
  "schedule": "0 */12 * * *",
  "scrapeConfig": {
    "baseUrl": "https://www.falabella.com.pe/.../Celulares",
    "pagination": {
      "enabled": true,
      "startPage": 1,
      "endPage": 157,
      "pageParam": "page"
    },
    "actions": [
      {
        "type": "navigate",
        "url": "{{url}}",
        "waitUntil": "networkidle"
      },
      {
        "type": "getText",
        "selector": "#__NEXT_DATA__",
        "saveTo": "productData"
      }
    ],
    "rateLimit": {
      "delayBetweenPages": 2000,
      "batchSize": 5
    }
  }
}
```

## 🕐 Cron Expressions

- `0 2 * * *` - Every day at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 3 * * 0` - Every Sunday at 3 AM
- `*/30 * * * *` - Every 30 minutes
- `0 0 1 * *` - First day of every month

Use https://crontab.guru to build expressions.

## 📊 How It Works

1. **Load Schedules** - Reads JSON files from `src/schedules/`
2. **Register Cron Jobs** - Creates cron tasks for enabled schedules
3. **Execute on Schedule** - Runs scraping plans at specified times
4. **Submit to Queue** - Sends jobs to fetch-api service
5. **Track Execution** - Records results in MongoDB

## 🔄 Execution Flow

```
Scheduler → Fetch API → Spider Worker → Storage → Products DB
  (Cron)      (Queue)     (Scraping)    (Extract)  (MongoDB)
```

## 📦 Pagination

When `pagination.enabled = true`:

1. Generates URLs for pages `startPage` to `endPage`
2. Replaces `{{url}}` placeholder in actions
3. Submits jobs in batches of `batchSize`
4. Waits `delayBetweenPages` ms between batches
5. Tracks all job IDs

**Example:**
- `startPage: 1, endPage: 20, batchSize: 5`
- Submits 4 batches of 5 pages = 20 total jobs

## 💾 Execution History

All executions stored in `schedule_executions` collection:

```javascript
{
  scheduleId: "falabella-celulares-12h",
  startedAt: ISODate("2026-01-02T02:00:00Z"),
  completedAt: ISODate("2026-01-02T02:05:30Z"),
  status: "success",
  pagesSubmitted: 157,
  pagesFailed: 0,
  jobIds: ["job-123", ...],
  duration: 330000
}
```

Query recent executions:
```bash
db.schedule_executions.find().sort({startedAt: -1}).limit(10)
```

## ⚙️ Environment Variables

```env
FETCH_API_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:30017
MONGODB_DATABASE=extracto
SCHEDULES_DIR=./src/schedules
TIMEZONE=America/Lima
```

## 📝 Adding New Schedules

1. Create JSON file in `src/schedules/`:
```bash
cat > src/schedules/my-schedule.json << EOF
{
  "id": "my-schedule",
  "name": "My Schedule",
  "enabled": true,
  "schedule": "0 3 * * *",
  "scrapeConfig": { ... }
}
EOF
```

2. Restart scheduler service
3. Verify it loaded in logs

## 🧪 Testing

Execute a schedule immediately:

```bash
npm run dev -- --execute-now falabella-celulares-12h
```

Expected output:
```
🚀 Executing: Falabella Celulares - Every 12 Hours
   Processing batch: pages 1-5
     ✅ Page 1: job-abc123
     ✅ Page 2: job-abc124
...
✅ Completed: 157 pages, 0 failed
```

## 📈 Monitoring

### Check Scheduler Logs
```
📂 Loading 1 schedule(s)...
   ✅ Falabella Celulares - Every 12 Hours
   
📅 Registering cron jobs...
   ✅ Falabella Celulares - Every 12 Hours - 0 */12 * * *

✅ Scheduler running
```

### Query Execution Stats
```javascript
db.schedule_executions.aggregate([
  {
    $group: {
      _id: "$scheduleId",
      totalRuns: { $sum: 1 },
      successRate: {
        $avg: { $cond: [{ $eq: ["$status", "success"] }, 100, 0] }
      }
    }
  }
])
```

## 🚨 Troubleshooting

### Schedule not executing
- Check `enabled: true` in JSON
- Verify cron expression
- Check timezone setting

### Jobs not submitting
- Verify Fetch API is running
- Check `FETCH_API_URL` in `.env`
- Review logs for errors

### MongoDB connection failed
- Verify MongoDB is running
- Check `MONGODB_URI`
- Ensure port is accessible

## 📦 Project Structure

```
extracto-scheduler/
├── src/
│   ├── config/
│   │   └── index.ts           # Configuration
│   ├── services/
│   │   ├── scheduler.service.ts      # Cron manager
│   │   ├── executor.service.ts       # Executes plans
│   │   ├── api-client.service.ts     # HTTP client
│   │   └── execution-tracker.service.ts  # MongoDB tracking
│   ├── types/
│   │   └── schedule.types.ts  # TypeScript types
│   ├── schedules/
│   │   └── *.json            # Schedule configs
│   └── index.ts              # Entry point
├── package.json
├── tsconfig.json
└── .env
```

## 🐳 Docker Deployment

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## 🔗 Integration

Works with existing Extracto services:

- **extracto-fetch-api** - Receives scrape requests
- **extracto-spider-worker** - Executes scraping
- **extracto-storage-service** - Stores & extracts products

## 📄 License

MIT

## 👥 Contributing

1. Add new schedule JSON
2. Test with `--execute-now`
3. Enable in production

---

**Made with ❤️ for Extracto Platform**
