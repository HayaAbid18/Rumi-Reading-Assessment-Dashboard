# Rumi Reading Dashboard

An interactive web dashboard for tracking reading assessment progress across regions, schools, and teachers in the Rumi platform.

## Features

- 📊 **Multi-level Analytics**: View data at region, school, teacher, and individual student levels
- 📈 **WCPM Trend Charts**: Track words correct per minute trends over time
- 📉 **Benchmark Distribution**: Visualize reading level distributions (below, at, above benchmark)
- 🎯 **Performance Metrics**: Monitor key reading indicators:
  - Words Correct Per Minute (WCPM)
  - Letters Correct Per Minute (LCPM)
  - Comprehension Scores
  - On-track percentage
  - Percentile rankings
- 🗺️ **Region Filtering**: Filter data by region (Islamabad, Rawalpindi, Lahore, etc.)
- 📋 **Detailed Tables**: Drill down into teacher, school, and individual assessment data

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Charts**: Recharts
- **Database**: PostgreSQL (Supabase)
- **API**: Next.js API routes

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Database credentials (see `.env.local`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (already configured in `.env.local`):
```
DATABASE_URL=postgresql://analyst.jlpenspfdcwxkopaidys:RumiAnalyst2026secure@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Dashboard Navigation

1. **Header Filter**: Select a region to filter all data
2. **Tabs**: Switch between overview, teachers, schools, and individual students views

### Overview Tab
- Metric cards showing summary statistics
- Weekly WCPM trend chart
- Benchmark status distribution pie chart

### Teachers Tab
- Table of all teachers with their assessment counts and performance metrics
- Sort by number of assessments, average WCPM, or on-track percentage

### Schools Tab
- Aggregated performance by school
- Compare schools within the selected region

### Students Tab
- Individual reading assessment records
- Detailed breakdown including:
  - Grade level and language
  - Passage type
  - All reading metrics (WCPM, LCPM, comprehension)
  - Benchmark status
  - Assessment date

## Database Queries

The dashboard connects to the Rumi PostgreSQL database with these key tables:

- `users` - Teacher profiles (with school_name)
- `reading_assessments` - Individual reading test results
- `student_lists` - Teacher's student lists
- `students` - Student information

### Key Metrics Calculated

- **WCPM (Words Correct Per Minute)**: Primary reading fluency metric
- **Comprehension Score**: Reading comprehension test results
- **Benchmark Status**: Below, At, or Above grade-level benchmark
- **On Track**: Boolean indicator of meeting reading expectations
- **Percentile**: National percentile ranking

## Architecture

```
rumi-dashboard/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/                  # Data API endpoints
│       ├── regions/          # GET distinct regions
│       ├── overview/         # GET region aggregates
│       ├── teachers/         # GET teacher metrics
│       ├── schools/          # GET school metrics
│       ├── students/         # GET student records
│       ├── wcpm-trend/       # GET WCPM trends
│       └── benchmark/        # GET benchmark distribution
├── components/
│   ├── filters/              # Region filter component
│   ├── cards/                # Metric cards
│   ├── charts/               # Recharts components
│   └── tables/               # Data tables
├── lib/
│   └── db.ts                 # PostgreSQL pool
└── .env.local                # Environment variables
```

## Performance Notes

- The database uses port 6543 (transaction pooler) for reliability
- Queries are optimized with LIMIT clauses for large datasets
- Region filtering uses ILIKE pattern matching on school_name
- Materialized views are available for pre-computed aggregates

## Troubleshooting

### Database Connection Errors
- Verify `.env.local` has correct DATABASE_URL
- Check network connectivity to AWS endpoint
- Ensure SSL mode is set to `require`

### Empty Data
- Confirm the database has reading assessment records
- Check that date filters aren't excluding data
- Verify is_test_user filtering is working correctly

### Slow Dashboard
- Region filtering limits the result set
- Use the Tables to view top performers (sorted by count)
- Check browser dev tools for slow API calls

## Future Enhancements

- [ ] Student progress tracking over time
- [ ] Reading level benchmarks by grade and language
- [ ] Teacher comparison reports
- [ ] Export data to CSV/PDF
- [ ] Custom date range filtering
- [ ] Drill-down from region → school → teacher → student
- [ ] Reading improvement predictions

## License

Internal use only - Rumi platform
