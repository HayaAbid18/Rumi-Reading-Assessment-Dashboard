# PECTAA Pilot Database Schema Specification

**Created for:** Rumi Platform  
**Pilot:** PECTAA Pilot Study (50 Schools, Rawalpindi, Sept-Oct 2025)  
**Purpose:** Store and track 3-loop feedback model data

---

## Tables to Create

### 1. `pectaa_schools`
Enrollment and metadata for pilot schools

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary key |
| school_name | VARCHAR | Yes | School name |
| district | VARCHAR | Yes | Rawalpindi |
| province | VARCHAR | Yes | Punjab |
| enrolled_date | DATE | No | When school enrolled |
| pilot_start_date | DATE | Yes | Sept 1, 2025 |
| pilot_end_date | DATE | Yes | Oct 24, 2025 |
| status | VARCHAR | Yes | active / completed / dropped (default: active) |
| created_at | TIMESTAMP | Yes | Auto-set to NOW() |

---

### 2. `pectaa_teachers`
Teacher enrollment in pilot

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary key |
| user_id | UUID | Yes | Foreign key → users.id |
| school_id | UUID | Yes | Foreign key → pectaa_schools.id |
| enrolled_date | DATE | Yes | When teacher enrolled |
| onboarding_date | DATE | Yes | Aug 23-30, 2025 |
| status | VARCHAR | Yes | active / retained / dropped (default: active) |
| weeks_active | INT | No | Tracks weeks 1-8 |
| created_at | TIMESTAMP | Yes | Auto-set to NOW() |
| updated_at | TIMESTAMP | Yes | Auto-set to NOW(), update on change |

---

### 3. `pectaa_gap_analysis`
**Loop 2 Data** - Weekly gap analysis and instructional tips

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary key |
| teacher_id | UUID | Yes | Foreign key → pectaa_teachers.id |
| school_id | UUID | Yes | Foreign key → pectaa_schools.id |
| pectaa_week | INT | Yes | Week 1-8 |
| gap_report_generated_at | TIMESTAMP | Yes | When AI generated report |
| identified_gaps | TEXT[] | No | Array of gap categories (e.g., ["word-recognition", "fluency"]) |
| instructional_tips | TEXT[] | No | Array of 2-3 tips |
| teacher_opened_at | TIMESTAMP | No | When teacher viewed report |
| teacher_engaged | BOOLEAN | No | Did teacher interact? (default: false) |
| created_at | TIMESTAMP | Yes | Auto-set to NOW() |

---

### 4. `pectaa_coaching`
**Loop 3 Data** - Weekly coaching feedback

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary key |
| teacher_id | UUID | Yes | Foreign key → pectaa_teachers.id |
| school_id | UUID | Yes | Foreign key → pectaa_schools.id |
| pectaa_week | INT | Yes | Week 1-8 |
| class_recording_submitted_at | TIMESTAMP | Yes | When teacher sent class recording |
| class_recording_url | VARCHAR | No | Link to recording (WhatsApp/storage) |
| coaching_feedback | TEXT | No | AI-generated feedback |
| feedback_provided_at | TIMESTAMP | No | When AI provided feedback |
| teacher_reviewed_at | TIMESTAMP | No | When teacher viewed feedback |
| teacher_engaged | BOOLEAN | No | Did teacher read? (default: false) |
| practice_change_observed | BOOLEAN | No | Did teaching practice change? (default: false) |
| created_at | TIMESTAMP | Yes | Auto-set to NOW() |

---

### 5. `pectaa_loop_status`
Track which loops are active each week

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary key |
| teacher_id | UUID | Yes | Foreign key → pectaa_teachers.id |
| school_id | UUID | Yes | Foreign key → pectaa_schools.id |
| pectaa_week | INT | Yes | Week 1-8 |
| loop1_active | BOOLEAN | Yes | Loop 1 active? (always true from Week 1) |
| loop2_active | BOOLEAN | Yes | Loop 2 active? (true from Week 2) |
| loop3_active | BOOLEAN | Yes | Loop 3 active? (true from Week 3) |
| loop1_completed | BOOLEAN | No | Did teacher complete Loop 1 this week? |
| loop2_completed | BOOLEAN | No | Did teacher complete Loop 2 this week? |
| loop3_completed | BOOLEAN | No | Did teacher complete Loop 3 this week? |
| all_loops_active | BOOLEAN | No | All 3 loops completed this week? (default: false) |
| created_at | TIMESTAMP | Yes | Auto-set to NOW() |

---

### 6. `pectaa_weekly_engagement`
Summary of teacher engagement each week

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary key |
| teacher_id | UUID | Yes | Foreign key → pectaa_teachers.id |
| school_id | UUID | Yes | Foreign key → pectaa_schools.id |
| pectaa_week | INT | Yes | Week 1-8 |
| assessments_count | INT | No | How many assessments recorded (Loop 1) |
| avg_assessment_time_seconds | INT | No | Average time per assessment (target: ≤180 sec) |
| students_assessed | INT | No | Unique students assessed (target: full class by Week 4) |
| gap_report_opened | BOOLEAN | No | Did teacher open gap report? (Loop 2) (default: false) |
| gap_report_read_at | TIMESTAMP | No | When did teacher read it? |
| coaching_session_submitted | BOOLEAN | No | Did teacher submit class recording? (Loop 3) (default: false) |
| coaching_feedback_read | BOOLEAN | No | Did teacher read feedback? (default: false) |
| days_active | INT | No | How many days was teacher active this week? |
| still_active | BOOLEAN | No | Is teacher still in pilot after this week? (default: true) |
| created_at | TIMESTAMP | Yes | Auto-set to NOW() |

---

### 7. `pectaa_metrics_weekly`
Aggregated metrics for dashboard (summary per week)

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary key |
| pectaa_week | INT | Yes | Week 1-8 |
| total_schools | INT | No | How many schools in pilot? |
| total_teachers | INT | No | How many teachers in pilot? |
| active_teachers | INT | No | How many teachers active this week? |
| assessments_count | INT | No | Total assessments across all teachers |
| avg_time_per_assessment | NUMERIC | No | Average time per assessment (seconds) |
| student_profiles_generated | INT | No | Total student profiles created |
| gap_reports_generated | INT | No | How many gap reports generated? |
| gap_reports_opened | INT | No | How many teachers opened reports? |
| coaching_sessions_submitted | INT | No | How many coaching sessions submitted? |
| coaching_feedback_opened | INT | No | How many teachers read feedback? |
| teacher_retention_pct | NUMERIC | No | % of teachers still active |
| created_at | TIMESTAMP | Yes | Auto-set to NOW() |

---

### 8. Update to `reading_assessments` Table
Add PECTAA-specific columns to existing table

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| pectaa_pilot | BOOLEAN | No | Is this a PECTAA assessment? (default: false) |
| pectaa_week | INT | No | Which week of pilot (1-8)? |
| is_random_selection | BOOLEAN | No | Was this from random 5-7 selection? (default: false) |
| assessment_time_seconds | INT | No | How long did assessment take? |

---

## Relationships (Foreign Keys)

```
pectaa_schools (standalone)
├── pectaa_teachers.school_id → pectaa_schools.id
├── pectaa_gap_analysis.school_id → pectaa_schools.id
├── pectaa_coaching.school_id → pectaa_schools.id
├── pectaa_loop_status.school_id → pectaa_schools.id
└── pectaa_weekly_engagement.school_id → pectaa_schools.id

users (existing table)
└── pectaa_teachers.user_id → users.id

pectaa_teachers (center point)
├── pectaa_gap_analysis.teacher_id → pectaa_teachers.id
├── pectaa_coaching.teacher_id → pectaa_teachers.id
├── pectaa_loop_status.teacher_id → pectaa_teachers.id
└── pectaa_weekly_engagement.teacher_id → pectaa_teachers.id

reading_assessments (existing table)
└── Add columns: pectaa_pilot, pectaa_week, is_random_selection, assessment_time_seconds
```

---

## Data Flow Example

**Week 1:**
1. Teacher records 6 students
   - → Data saved in `reading_assessments` (pectaa_pilot=true, pectaa_week=1)
   - → `pectaa_weekly_engagement` created: assessments_count=6, avg_assessment_time_seconds=150

**Week 2:**
1. Gap analysis generated
   - → `pectaa_gap_analysis` row created: identified_gaps=["word-recognition"], instructional_tips=[tip1, tip2]
   - → Teacher opens report at 2:30pm
   - → `pectaa_gap_analysis.teacher_opened_at` = 2:30pm, teacher_engaged=true

2. Teacher records 7 more students
   - → `reading_assessments` updated for Week 2
   - → `pectaa_weekly_engagement` created for Week 2

**Week 3:**
1. Teacher records class session
   - → `pectaa_coaching` row created with recording_url
   - → AI provides feedback
   - → `pectaa_coaching.coaching_feedback` populated

---

## Success Metrics to Calculate

From these tables, dashboard will query:

| Metric | Source | Query |
|--------|--------|-------|
| Time per assessment | `pectaa_weekly_engagement.avg_assessment_time_seconds` | Should be ≤180 sec |
| Students assessed | `pectaa_weekly_engagement.students_assessed` | Should reach full class by Week 4 |
| Gap report engagement | `pectaa_gap_analysis.teacher_engaged` count | Target: ≥70% |
| Coaching adoption | `pectaa_coaching.teacher_engaged` count | Target: ≥60% by Week 3 |
| Teacher retention | `pectaa_teachers.status` = 'active' / 'dropped' | Target: ≥60% through Week 8 |
| All 3 loops active | `pectaa_loop_status.all_loops_active` = true | Target: ≥50% by Week 4 |

---

## Notes for Implementation

1. **All IDs are UUIDs** (auto-generate with gen_random_uuid())
2. **All timestamps auto-set to NOW()** on creation
3. **Array fields** (identified_gaps, instructional_tips) should allow NULL
4. **Foreign keys** should enforce referential integrity
5. **Indexes recommended on:** teacher_id, school_id, pectaa_week (for fast dashboard queries)
6. **No data retention needed** - keep all 8 weeks of data for impact study

---

**Questions for Rumi team:** 
- Can you create these 7 tables + update reading_assessments?
- Timeline: When can they be ready? (Needed by August 20 for dashboard testing)
