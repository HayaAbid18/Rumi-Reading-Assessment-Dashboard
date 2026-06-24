# RUMI Recording Analysis Feature - Technical Specification

**For:** Rumi Platform Team  
**Project:** PECTAA Pilot - Practice Change Detection  
**Date:** 2025-06-24  
**Priority:** HIGH (Required by Aug 20 for dashboard testing)

---

## 1. Overview

**What:** Automated AI analysis of teacher class recordings to detect if weekly coaching tips are being applied in classroom practice.

**Why:** PECTAA pilot needs to measure H3 hypothesis: "Teachers who receive gap analysis + coaching show observable practice change by Week 6"

**When:** Teacher submits class recording → AI analyzes → Result auto-saves to database → Dashboard shows real-time

**Impact:** Converts manual observation into real-time automated metric for 50 teachers across 8 weeks

---

## 2. User Flow

```
WEEK 2:
  AI generates 2-3 coaching tips
  Stores in: pectaa_gap_analysis.instructional_tips[]
  Example: ["use-word-by-word-reading", "ask-comprehension-questions"]

WEEK 3:
  Teacher submits class recording via WhatsApp
  Rumi receives recording (webhook)
  
  → AI ANALYSIS STARTS:
     1. Transcribe audio
     2. Extract teacher instructions
     3. Check each tip from Week 2
     4. Flag: Applied? Yes/No
     5. Calculate score: tips_applied / total_tips * 100
     6. Generate feedback

  → RESULT STORED:
     pectaa_coaching.practice_change_observed = true/false
     pectaa_coaching.practice_change_score = 67
     pectaa_coaching.tips_applied_list = ["use-word-by-word-reading", "ask-comprehension-questions"]
     pectaa_coaching.coaching_feedback = "You applied 2 of 3 tips..."

WEEK 4:
  Teacher sees feedback + score
  Dashboard shows: "18/25 teachers (72%) showing practice changes"
```

---

## 3. Technical Requirements

### 3.1 Input

**Source:** Class recording from teacher

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| recording_url | String | pectaa_coaching.class_recording_url | WhatsApp media URL or S3 URL |
| recording_duration | Integer | Audio metadata | Seconds |
| week_tips | Array[String] | pectaa_gap_analysis.instructional_tips[*] | Tips from PREVIOUS week |
| teacher_id | UUID | pectaa_coaching.teacher_id | For tracking |
| pectaa_week | Integer | pectaa_coaching.pectaa_week | Week 1-8 |

### 3.2 Processing

**AI Analysis Steps:**

```
1. Audio Transcription
   Input: recording_url
   Output: transcribed_text (teacher's voice)
   Tool: Rumi's existing speech-to-text (already works for student assessments)

2. Extract Teaching Actions
   Input: transcribed_text
   Output: teaching_patterns = [
     "used word-by-word reading strategy",
     "asked comprehension questions",
     "praised student effort",
     "modeled fluent reading",
     ...
   ]
   Method: NLP pattern matching against known pedagogical strategies

3. Match Against Tips
   Input: teaching_patterns, week_tips
   Logic:
     FOR EACH tip in week_tips:
       IF tip_text IN teaching_patterns:
         tips_applied.append(tip)
   Output: tips_applied = ["use-word-by-word-reading", "ask-comprehension-questions"]

4. Calculate Practice Change Score
   Input: tips_applied, week_tips
   Formula: (tips_applied.length / week_tips.length) * 100
   Output: practice_change_score = 67

5. Generate Feedback
   Input: tips_applied, week_tips, teaching_patterns
   Output: coaching_feedback = "You applied 2 of 3 tips this week:
     ✓ Word-by-word reading - great job keeping students engaged
     ✓ Comprehension questions - students answered well
     → Next week: focus on praising effort over ability"
   Tone: Encouraging + actionable
```

### 3.3 Output (Database Storage)

**Table:** `pectaa_coaching`

Add these columns:

```sql
ALTER TABLE pectaa_coaching ADD COLUMN (
  practice_change_observed BOOLEAN DEFAULT false,
  -- true = tips applied, false = not applied
  
  practice_change_score NUMERIC(3,1),
  -- 0-100, percentage of tips applied
  -- Example: 2 tips applied / 3 tips total = 66.7
  
  tips_applied_list TEXT[],
  -- Array of tip IDs that were detected
  -- Example: ["use-word-by-word-reading", "ask-comprehension-questions"]
  
  tips_analysis_detail JSONB,
  -- Detailed analysis per tip (optional, for debugging)
  -- Example: {
  --   "use-word-by-word-reading": {
  --     "detected": true,
  --     "evidence": "teacher said 'let's read word by word'",
  --     "frequency": 3
  --   },
  --   "ask-comprehension-questions": {
  --     "detected": true,
  --     "evidence": "asked questions 4 times in lesson",
  --     "frequency": 4
  --   },
  --   "praise-effort": {
  --     "detected": false,
  --     "evidence": null,
  --     "frequency": 0
  --   }
  -- }
  
  ai_analysis_timestamp TIMESTAMP DEFAULT NOW(),
  -- When analysis was completed
  
  analysis_status VARCHAR DEFAULT 'pending',
  -- pending / completed / failed
  
  analysis_error TEXT
  -- Error message if analysis failed
);
```

---

## 4. API Specification

### 4.1 Webhook (Rumi → Backend)

**Event:** Teacher submits class recording via WhatsApp

**Trigger:** Recording received + stored in pectaa_coaching table

**Endpoint:** `POST /api/pectaa/analyze-recording`

**Payload:**
```json
{
  "pectaa_coaching_id": "uuid-123",
  "teacher_id": "uuid-456",
  "pectaa_week": 3,
  "recording_url": "s3://rumi-recordings/...",
  "recording_duration_seconds": 1200,
  "week_tips": [
    "use-word-by-word-reading",
    "ask-comprehension-questions",
    "praise-effort-not-ability"
  ]
}
```

### 4.2 Analysis Service Response

**Endpoint:** Analysis completes asynchronously

**Callback:** Updates `pectaa_coaching` table with results

**Response Structure:**
```json
{
  "pectaa_coaching_id": "uuid-123",
  "practice_change_observed": true,
  "practice_change_score": 66.7,
  "tips_applied_list": [
    "use-word-by-word-reading",
    "ask-comprehension-questions"
  ],
  "tips_analysis_detail": {
    "use-word-by-word-reading": {
      "detected": true,
      "evidence": "Teacher said: 'let's read word by word'",
      "frequency": 3
    },
    "ask-comprehension-questions": {
      "detected": true,
      "evidence": "Asked 4 comprehension questions",
      "frequency": 4
    },
    "praise-effort-not-ability": {
      "detected": false,
      "evidence": null,
      "frequency": 0
    }
  },
  "coaching_feedback": "You applied 2 of 3 tips this week! Great use of word-by-word reading and comprehension questions. Next week, try praising student effort over ability.",
  "analysis_timestamp": "2025-09-17T10:30:00Z",
  "analysis_status": "completed"
}
```

---

## 5. Integration Points

### 5.1 With Existing Rumi Features

**Already available (re-use):**
- ✅ Speech-to-text (used for student assessments)
- ✅ AI text analysis (used for gap analysis)
- ✅ Feedback generation (used for coaching)
- ✅ WhatsApp integration (receiving recordings)

**New:** Just apply these to class recordings instead of student recordings

### 5.2 With PECTAA Dashboard

**Dashboard queries this data:**

```sql
-- Real-time practice change metric
SELECT 
  pectaa_week,
  COUNT(CASE WHEN practice_change_observed = true THEN 1 END) as teachers_showing_change,
  ROUND(AVG(practice_change_score), 1) as avg_practice_change_score,
  ARRAY_AGG(DISTINCT tips_applied) as most_applied_tips
FROM pectaa_coaching
WHERE pectaa_week = 3
GROUP BY pectaa_week;

-- Expected result:
-- week | teachers_showing_change | avg_score | most_applied_tips
-- 3    | 18                      | 67.2      | ["word-by-word", "comprehension-q"]
```

---

## 6. Success Criteria

**Measurement:**

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Recording analysis accuracy | ≥80% | Spot-check 10% of analyses manually |
| Processing time | <10 min | Recording submitted → feedback delivered |
| Availability | ≥99% | No failed analyses due to system errors |
| Dashboard lag | <2 min | Recording analyzed → metric updates |

**Testing:**

```
Test Week 1 (Aug 20-27):
├─ 5 teachers submit test recordings
├─ AI analyzes each
├─ Manual verification: Did AI detect tips correctly?
├─ Fix issues before pilot starts Sept 1

Test Week 3 (Sept 15-21):
├─ 50 teachers submitting real recordings
├─ Dashboard shows real-time practice change
├─ Compare AI scores vs manual observation (spot check 5%)
└─ Validate H3 hypothesis
```

---

## 7. Dependencies & Timeline

**Prerequisites (must be done first):**
- ✅ pectaa_* database tables created (already spec'd)
- ✅ Gap analysis feature returns tips array (already built for Loop 2)
- ✅ Recording webhook receives class sessions (WhatsApp integration)

**This Feature Development:**
- **Start:** June 24
- **Complete:** August 15
- **Testing:** August 16-20
- **Go-live:** September 1 (pilot Week 1)

**Risk:** If not ready by Aug 20, manual verification needed for pilot (less ideal but won't block pilot)

---

## 8. Success Looks Like

**Aug 20 Test:**
```
Teacher submits 15-min class recording Thursday 3pm
  ↓
AI analyzes by Friday 9am (analysis_status = "completed")
  ↓
Teacher sees feedback: "You applied 2/3 tips (67%)"
  ↓
Dashboard shows: "5/5 test teachers analyzed ✓"
```

**Sept 15 (Real Pilot - Week 3):**
```
50 teachers submit class recordings over the week
  ↓
AI analyzes all by end of week
  ↓
Dashboard shows:
  • 18/25 teachers showing practice changes (72%)
  • Avg practice change score: 67%
  • Most applied: word-by-word reading (72%), comprehension Q's (60%)
  ↓
H3 hypothesis tracking: ON TRACK ✓
```

---

## 9. Questions for Rumi Team

1. **Transcription accuracy:** Current speech-to-text model accuracy on Urdu/English mixed classroom audio?
2. **Processing time:** How long for 15-20 min audio analysis? Acceptable <10 min?
3. **Feedback generation:** Can coaching feedback be personalized per teacher + per week's tips?
4. **Scaling:** Can this handle 50 concurrent submissions if teachers submit around same time?
5. **Storage:** Where are recordings stored? S3 cost implications?
6. **Fallback:** If analysis fails, what happens? Queue for retry or manual intervention?

---

## 10. Appendix: Example Tips Library

**Pedagogical tips that AI should detect:**

```
Category: Reading Instruction
├─ "use-word-by-word-reading"
├─ "model-fluent-reading"
├─ "ask-comprehension-questions"
├─ "use-phonics-strategy"
└─ "pre-teach-vocabulary"

Category: Student Engagement
├─ "call-on-multiple-students"
├─ "give-wait-time"
├─ "use-pair-reading"
└─ "encourage-participation"

Category: Feedback
├─ "praise-effort-not-ability"
├─ "provide-corrective-feedback"
├─ "use-positive-reinforcement"
└─ "give-specific-praise"

Category: Classroom Management
├─ "establish-reading-routines"
├─ "minimize-distractions"
├─ "manage-time-effectively"
└─ "use-clear-instructions"
```

AI should match transcribed teaching patterns to these categories.

---

## Contact

**For questions:** Haya Abid (haya.abid@taleemabad.com)

**Timeline is critical:** Aug 20 deadline for dashboard testing before Sept 1 pilot launch.
