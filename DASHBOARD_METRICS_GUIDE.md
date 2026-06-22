# Reading Assessment Dashboard - Metrics & Calculations Guide

Complete documentation of every metric, card, and graph in the Rumi Reading Assessment Dashboard.

---

## TOP LEVEL KPIs (Header Cards)

### 1. Avg Score by School
**What it shows:** Average WCPM (Words Correct Per Minute) across all assessments in selected region/school/time range

**Calculation:**
```sql
AVG(ra.wcpm)
FROM reading_assessments ra
WHERE ra.status = 'completed' AND region filter AND school filter AND date range
```

**Data source:** `reading_assessments.wcpm` column  
**Important notes:**
- WCPM measures reading speed and accuracy
- Higher is better
- Null values are excluded from average
- Filters apply: region, school, date range, language, internal users

---

### 2. Completion Rate
**What it shows:** Percentage of assessments where students scored "on track" (met grade-level benchmark)

**Calculation:**
```sql
COUNT(CASE WHEN ra.on_track = true THEN 1 END) / COUNT(*) * 100
FROM reading_assessments ra
WHERE ra.status = 'completed'
```

**Data source:** `reading_assessments.on_track` boolean column  
**Important notes:**
- "On track" is determined at assessment time based on WCPM vs. grade-level benchmark
- Includes all completed assessments regardless of language or passage type
- Filters apply: region, school, date range

---

### 3. Students Assessed This Week
**What it shows:** Count of unique students who took at least one assessment in the current week

**Calculation:**
```sql
COUNT(DISTINCT ra.student_identifier)
FROM reading_assessments ra
WHERE ra.status = 'completed' 
  AND DATE_TRUNC('week', ra.created_at) = DATE_TRUNC('week', CURRENT_DATE)
```

**Data source:** `reading_assessments.student_identifier`  
**Important notes:**
- Week starts on Sunday (Sunday = day 0)
- Counts unique students (if one student took 3 tests, counts as 1)
- Real-time (current week)

---

## OVERVIEW TAB

### Performance Section

#### % Students On Track
**What it shows:** Percentage of assessments where students scored "on track" (met grade-level benchmark)  
**Calculation:** `COUNT(CASE WHEN ra.on_track = true THEN 1 END) / COUNT(*) * 100`  
**Range:** 0-100%

#### Answer Accuracy
**What it shows:** Average accuracy percentage across all assessments  
**Calculation:** `AVG(ra.accuracy_percentage)`  
**Range:** 0-100%  

#### Avg Time on Test
**What it shows:** Average minutes spent per assessment  
**Calculation:** `(ra.completed_at - ra.created_at) / 60`  
**Data source:** Difference between `completed_at` and `created_at`  

#### Score Improvement
**What it shows:** Average comprehension score percentage  
**Calculation:** `AVG(ra.comprehension_score)`  
**Range:** 0-100%  

---

### Score Distribution Chart
**What it shows:** Bar chart bucketing students by accuracy percentage ranges

**Buckets:**
- 0-20%
- 20-40%
- 40-60%
- 60-80%
- 80-100%

**Calculation:**
```sql
COUNT(*) 
FROM reading_assessments ra
GROUP BY CASE 
  WHEN accuracy_percentage < 20 THEN '0-20%'
  WHEN accuracy_percentage < 40 THEN '20-40%'
  ...
END
```

**Visual coding:** Blue = 80%+, Light blue = below 60%

---

### Usage & Engagement Cards

#### Students Assessed / Week
**Calculation:** Count of unique students per week  
**Filters:** Region, school, date range  

#### Total Assessments
**What it shows:** Cumulative count of all assessments ever taken  
**Calculation:** `COUNT(ra.id) WHERE ra.status = 'completed'`  

#### Repeat Rate
**What it shows:** Percentage of students who took more than one assessment  
**Calculation:**
```sql
COUNT(DISTINCT student_id WITH assessments > 1) / COUNT(DISTINCT student_id) * 100
```

#### Active Teachers
**What it shows:** Count of unique teachers who conducted assessments  
**Calculation:** `COUNT(DISTINCT ra.user_id)`  

---

### Weekly Trend Chart
**What it shows:** Line chart of a selectable metric over the past 4-8 weeks

**Selectable metrics:**
1. **Avg WCPM** - Average reading speed over time
2. **Tests Taken** - Total assessment count per week
3. **Students Assessed** - Unique student count per week

**Calculation (example for Avg WCPM):**
```sql
DATE_TRUNC('week', ra.created_at) as week,
AVG(ra.wcpm) as metric
FROM reading_assessments ra
GROUP BY week
ORDER BY week DESC
```

---

### Pilot Coverage

#### Students Assessed
**Calculation:** Count of unique students in selected filters

#### On Track %
**Calculation:** Percentage of assessments with `on_track = true`

#### Active Teachers
**Calculation:** Count of unique teachers in selected filters

---

## ENGAGEMENT TAB

### Key Engagement Metrics

#### Students Assessed This Week
**Calculation:** `COUNT(DISTINCT student_identifier)` for current week  
**Drill-down:** Click to see list of all students active this week with their metrics

#### Assessments Per Student
**What it shows:** Average number of assessments each student took in the period  
**Calculation:** `SUM(assessments) / COUNT(DISTINCT students)`

#### Avg Session Time
**What it shows:** Average minutes spent per assessment  
**Calculation:** `AVG((completed_at - created_at) / 60)`

#### Growth Attempts
**What it shows:** Percentage of assessments where student attempted above-grade-level passage  
**Calculation:** `COUNT(CASE WHEN passage_level > grade_level) / COUNT(*) * 100`

---

### Engagement Breakdown

#### Usage Pattern
**What it shows:** Assessment count by time of day  
**Buckets:**
- Morning (6am-12pm)
- Afternoon (12pm-6pm)
- Evening (6pm-12am)
- Night (12am-6am)

**Calculation:**
```sql
EXTRACT(HOUR FROM ra.created_at) to bucket
```

#### Repeat Engagement
**What it shows:** Number and percentage of students with multiple assessments  
**Calculation:**
```sql
COUNT(DISTINCT ra.student_identifier 
  WHERE ra.student_identifier IN 
    (SELECT student_identifier FROM reading_assessments 
     GROUP BY student_identifier HAVING COUNT(*) > 1))
```
**Drill-down:** Click to see all students with repeat assessments

#### Growth Mindset
**What it shows:** Count and percentage of students attempting above-level assessments  
**Calculation:** Count of unique students with `passage_level > grade_level`

---

### Weekly Students Assessed Trend
**What it shows:** Line chart of unique students per week (last 8 weeks)

**Calculation:**
```sql
DATE_TRUNC('week', ra.created_at) as week,
COUNT(DISTINCT student_identifier) as wau
FROM reading_assessments ra
GROUP BY week
ORDER BY week
```

**Note:** WAU = Weekly Active Users

---

### Daily Students Assessed (Last 7 Days)
**What it shows:** Bar chart of unique students per day (last 7 days)

**Calculation:**
```sql
DATE(ra.created_at) as day,
COUNT(DISTINCT student_identifier) as dau
FROM reading_assessments ra
WHERE ra.created_at >= CURRENT_DATE - 7 days
GROUP BY day
```

**Note:** DAU = Daily Active Users

---

## RETENTION TAB

### Key Metrics

#### Total Students Assessed
**Calculation:** Distinct count of all students in database

#### Students w/ Repeats
**What it shows:** Count and percentage of students with 2+ assessments  
**Calculation:**
```sql
COUNT(DISTINCT student_id) WHERE student_id IN (
  SELECT student_identifier 
  FROM reading_assessments 
  GROUP BY student_identifier 
  HAVING COUNT(*) > 1
)
```

#### At-Risk Students
**Definition:** Students inactive for 7-14 days (but not yet churned)  
**Calculation:**
```sql
COUNT(DISTINCT student_identifier)
WHERE last_assessment_date >= CURRENT_DATE - 14 days
  AND last_assessment_date < CURRENT_DATE - 7 days
```

#### Churned Students
**Definition:** Students inactive for 14+ days  
**Calculation:**
```sql
COUNT(DISTINCT student_identifier)
WHERE last_assessment_date < CURRENT_DATE - 14 days
```

---

### Student Cohort Retention Heatmap
**What it shows:** Cohort-based retention analysis showing what % of students from each starting cohort remain active in subsequent weeks

**Key concepts:**
- **Cohort Week (rows):** Week when student took their FIRST assessment
- **Retention Windows (columns):** Week 0, Week 1, Week 2, Week 4
- **Color coding:** Green (high) → Red (low)

**Calculation example (Week 0):**
```sql
WITH student_cohorts AS (
  SELECT student_identifier,
    DATE_TRUNC('week', MIN(created_at))::date as cohort_week
  FROM reading_assessments
  GROUP BY student_identifier
)
SELECT cohort_week,
  COUNT(DISTINCT student_identifier) as week0_users,
  100.0 * COUNT(*) / 
    (SELECT COUNT(*) FROM student_cohorts WHERE cohort_week = sc.cohort_week) as week0_pct
FROM student_cohorts sc
GROUP BY cohort_week
```

**Color scale:**
- 80%+ = Green
- 60-79% = Light Green
- 40-59% = Yellow
- 20-39% = Orange
- <20% = Red

---

### Teacher Cohort Retention Heatmap
**Same concept as Student Cohort but for teachers**

**Calculation:** Teachers grouped by week of first assessment, tracked for retention

---

### At-Risk Students Table
**What it shows:** List of students who haven't assessed in 7-14 days with metrics

**Columns:**
- **Student ID:** Student identifier
- **Days Inactive:** Days since last assessment
- **Total Assessments:** Lifetime count
- **Active Days:** Days on which student took at least one assessment
- **Risk Score:** 0-1 score indicating churn risk
- **Last Active:** Date of last assessment

**Risk Score calculation:**
```
risk_score = (days_inactive / 14) * 0.5 + (1 - frequency_ratio) * 0.5
```
Where `frequency_ratio = active_days / total_days_since_first`

---

## TEACHERS TAB

### Teacher Performance Table
**What it shows:** List of all teachers with their assessment administration metrics

**Columns:**
- **School:** Teacher's school
- **Teacher:** Teacher name
- **Tests:** Total assessments administered
- **Avg WCPM:** Average WCPM of students they taught
- **Accuracy:** Average accuracy of their students
- **On Track %:** Percentage of their students on-track

**Calculation per teacher:**
```sql
SELECT u.id, u.teacher_name, u.school_name,
  COUNT(DISTINCT ra.id) as tests,
  AVG(ra.wcpm) as avg_wcpm,
  AVG(ra.accuracy_percentage) as avg_accuracy,
  100.0 * COUNT(CASE WHEN ra.on_track THEN 1 END) / COUNT(*) as pct_on_track
FROM users u
LEFT JOIN reading_assessments ra ON ra.user_id = u.id
GROUP BY u.id
```

**Drill-down:** Click teacher to see their detail panel with all students they've assessed

---

## STUDENTS TAB

### Student Assessments Table
**What it shows:** Latest assessment for each student (most recent per student)

**Columns:**
- **Student:** Student identifier
- **Grade:** Grade level
- **Teacher:** Teacher name (who administered most recent test)
- **WCPM:** Words per minute (from latest assessment)
- **Accuracy:** Accuracy % (from latest assessment)
- **Comprehension:** Comprehension score % (from latest assessment)
- **Status:** On-track badge (green) or not (red)

**Drill-down:** Click student to see full assessment history with all previous tests

---

## DATA FILTERING & SCOPE

All metrics (except "Students Assessed This Week") are affected by:

1. **Region filter:** User-selectable region or "All regions"
2. **School filter:** User-selectable school (only if region is selected) or "All schools"
3. **Time range filter:** 
   - This Week
   - Last Week
   - Last 4 Weeks
   - Last 30 Days
4. **Language filter:** 
   - All languages (default)
   - Urdu
   - English
   - Applies to aggregated metrics and trend charts
5. **Exclude users filter:**
   - Select specific users to exclude from all metrics
   - Shows all active users from the database
   - Selection persists across page reloads (saved in browser)
   - Applies to all tabs and all metrics
   - Useful for excluding test accounts or specific users from analysis

**Exception:** "Students Assessed This Week" always shows current calendar week regardless of time range filter.

---

## DENOMINATOR FORMAT

Absolute count cards throughout the dashboard show values in the format: **count/total (percentage)**

Examples:
- **Students assessed / week:** "47/120 (39%)" = 47 students out of 120 total students this week (39%)
- **Students w/ Repeats:** "34/120 (28%)" = 34 students with multiple assessments out of 120 total students (28%)
- **Growth mindset:** "18/120 (15%)" = 18 students attempting above-level assessments out of 120 total students (15%)

This provides context for absolute numbers and makes it easy to understand the size of each segment relative to the total population.

---

## IMPORTANT NOTES

### Null & Missing Values
- Null WCPM values are excluded from WCPM averages
- Null accuracy values are excluded from accuracy averages
- Null comprehension scores are excluded from comprehension averages
- Missing language values display as "—" in tables

### Time Zone
- All timestamps are stored in UTC
- Charts display based on server timezone
- Dashboard filters use DATE_TRUNC for week boundaries

### Data Quality
- Only assessments with `status = 'completed'` are included
- Test users are filtered out with `COALESCE(is_test_user, false) = false`
- Deleted assessments are not included

### Performance Considerations
- Student Cohort Retention is pre-computed and cached
- Weekly trend data covers 8-week lookback
- Tables show top 1000 rows (paginated if needed)

---

## CALCULATION DEPENDENCIES

```
At-Risk Count
  ↓
  └─ Last Assessment Date
      ↓
      └─ reading_assessments table

Retention Heatmap
  ↓
  └─ Cohort Week (first assessment date)
  └─ Subsequent Activity (presence in later weeks)
      ↓
      └─ reading_assessments.created_at

Weekly Trend
  ↓
  └─ DATE_TRUNC('week', created_at)
  └─ Metric aggregation per week
```

---

## SUMMARY TABLE

| Metric | Source | Aggregation | Filters | Real-time |
|--------|--------|-------------|---------|-----------|
| Avg WCPM | reading_assessments.wcpm | AVG | R,S,D | Yes |
| Accuracy | reading_assessments.accuracy_percentage | AVG | R,S,D | Yes |
| On Track % | reading_assessments.on_track | COUNT/TOTAL | R,S,D | Yes |
| Cohort Retention | student_identifier, created_at | GROUP BY week | None | Cached |
| At-Risk Count | last_assessment_date | COUNT | R,S | Yes |
| Churned Count | last_assessment_date | COUNT | R,S | Yes |
| WAU | student_identifier | DISTINCT COUNT | R,S,D | Yes |
| DAU | student_identifier | DISTINCT COUNT | R,S,D | Yes |

*R = Region filter, S = School filter, D = Date range filter*
