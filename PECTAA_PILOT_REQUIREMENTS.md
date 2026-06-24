# PECTAA Pilot - Implementation Requirements

**For:** Rumi Platform (Agentic Flow)  
**Project:** PECTAA 3-Loop Feedback Model  
**Timeline:** July 20 deadline for 3-loop workflow complete, Sept 1 pilot launch  
**Status:** 3-loop workflow in progress

---

## 1. The Problem We're Solving

We're running a 50-school pilot in Rawalpindi to prove that AI-powered reading assessment + teacher coaching improves classroom practice.

**The pilot tracks 3 interconnected loops over 8 weeks:**

### Loop 1: Daily Assessment (Week 1 onwards)
- Teacher records 5-7 randomly selected students reading
- AI returns ASER level + WCPM for each student
- Measure: Time taken, student coverage, data accuracy

### Loop 2: Weekly Gap Analysis (Week 2 onwards)
- AI analyzes all week's assessments
- Identifies common reading gaps
- Generates 2-3 actionable tips for the teacher
- Measure: Teachers who read tips, gaps identified, tip quality

### Loop 3: Weekly Coaching (Week 3 onwards)
- Teacher records 1 class session
- AI analyzes if teacher is applying the tips
- Returns coaching feedback
- Measure: Teachers who submit, practice change observed

---

## 2. What We Need to Measure (Success Metrics)

**These 7 metrics prove the pilot works:**

1. **Time per assessment** (Loop 1)
   - Target: ≤3 min per student
   - Currently: Manual collection
   - Need: Auto-measure from timestamps

2. **Student profiles generated** (Loop 1)
   - Target: 100% of class assessed by Week 4
   - Currently: Manual count
   - Need: Auto-count from database

3. **Gap reports engagement** (Loop 2)
   - Target: ≥70% teachers read weekly tips
   - Currently: Manual check
   - Need: Auto-track when teacher opens report

4. **Coaching adoption** (Loop 3)
   - Target: ≥60% teachers submit class recordings by Week 3
   - Currently: Manual tracking
   - Need: Auto-count submissions

5. **Practice change observed** (Loop 3 → Outcome)
   - Target: ≥72% of teachers showing classroom practice change
   - Currently: Manual observation
   - Need: AI auto-detects if tips are applied in class recording

6. **Teacher retention** (All Loops)
   - Target: ≥60% still active Week 1→8
   - Currently: Manual count
   - Need: Auto-track active/dropped status per week

7. **All 3 loops active** (Integration)
   - Target: ≥50% teachers active on all 3 loops by Week 4
   - Currently: Manual validation
   - Need: Auto-flag when teacher completes all 3 in a week

---

## 3. The Data Flow (High Level)

```
WEEK 1-8 PILOT:

Week 1: Loop 1 only (assessment habit)
  Teacher submits assessments daily
  → Store timestamps + results
  → Dashboard: "Avg time per assessment: 2.8 min"

Week 2+: Loop 1 + Loop 2 (gap analysis)
  Assessments + gap analysis + tips
  → Track when teacher opens tips
  → Dashboard: "64% teachers opened gap report"

Week 3+: All 3 loops (coaching feedback)
  Teacher submits class recording
  → AI analyzes if tips applied
  → Dashboard: "72% showing practice changes"

Weekly aggregation for 50 schools, 100 teachers, 8 weeks
```

---

## 4. What Rumi Needs to Do

**Build/Enable the 3-loop infrastructure:**

### Phase 1: Data Collection (Required by July 20)
- [ ] Loop 1: Store assessment timestamps (created_at, completed_at)
- [ ] Loop 1: Track which students assessed per teacher per week
- [ ] Loop 2: Store when teacher opens gap analysis report
- [ ] Loop 2: Generate 2-3 actionable tips per week
- [ ] Loop 3: Store when teacher submits class recording
- [ ] Loop 3: Auto-analyze if teacher applied tips from previous week

### Phase 2: Dashboard Integration (July 20-Sept 1)
- [ ] Query all 7 success metrics in real-time
- [ ] Display per-school, per-teacher, per-week
- [ ] Tehsil-wise filtering
- [ ] Alert when metrics fall below target

### Phase 3: Data Persistence (Sept 1+)
- [ ] Store all 8 weeks of data for impact study
- [ ] Compile final report Oct 2025 for PECTAA

---

## 5. Key Constraints

**Timeline:**
- June 1: Product fixes + random selection feature shipped
- July 20: 3-loop workflow complete + dashboard ready for testing
- Aug 1-31: Final testing + refinements
- Sept 1: Pilot starts (Week 1: Loop 1 only)
- Sept 8: Week 2 starts (Loop 1 + Loop 2)
- Sept 15: Week 3 starts (All 3 loops)
- Oct 24: Pilot ends

**Capacity:**
- 50 schools
- 100 teachers
- 8 weeks of data
- Real-time dashboard updates
- No latency >2 min

**Failures:**
- If recording analysis fails → alert + retry
- If metrics calculation fails → manual verification option
- If dashboard doesn't update → alert Haya immediately

---

## 6. Success = These Metrics Live & Accurate by July 20

When Rumi demo shows:

```
✓ Avg assessment time: 2.8 min (Loop 1)
✓ Student coverage: 42/45 (93%) (Loop 1)
✓ Teachers who opened gap report: 32/50 (64%) (Loop 2)
✓ Coaching sessions submitted: 28/50 (56%) (Loop 3)
✓ Practice changes detected: 18/25 (72%) (Loop 3)
✓ Teachers active all 3 loops: 23/50 (46%) (All loops)
✓ Retention rate: 48/50 (96%) (All weeks)
✓ Dashboard updates in <2 min
```

→ We're ready to launch Sept 1

---

## 7. Questions for Rumi

1. **3-loop workflow status:** When will Loops 1, 2, 3 be complete?
2. **Recording analysis:** Can you auto-detect if coaching tips are applied? Current capability?
3. **Real-time queries:** Can dashboard query 7 metrics with <2 sec response?
4. **Data persistence:** Will all 8 weeks of pilot data be stored for impact analysis?
5. **Failover:** What happens if analysis fails? Alert + retry?

---

## 8. What We're NOT Asking For

❌ Detailed technical spec (Rumi figures it out)  
❌ Database schema design (Rumi designs it)  
❌ API endpoints (Rumi creates them)  
❌ Frontend code (we handle dashboard)  

---

## 9. What We ARE Asking For

✅ **Tell Rumi:**
- The 3-loop problem
- The 7 success metrics to measure
- The July 20 deadline (6 weeks before pilot launch)
- The 50 schools × 8 weeks scope
- That practice change detection is critical

✅ **Rumi figures out:**
- How to store/track/measure everything
- How to scale to 50 teachers
- How to make it real-time
- Self-heal if anything breaks

---

## Next Steps

1. **Share this doc** with Rumi team
2. **Ask:** "Can you implement 3-loop tracking + 7 success metrics by July 20?"
3. **Await response** on feasibility + timeline
4. **If yes:** They build, we build dashboard
5. **If no:** Use Phase 1 only (basic data collection) until July 20

---

**Contact:** Haya Abid (haya.abid@taleemabad.com)  
**Deadline:** July 20, 2025 

