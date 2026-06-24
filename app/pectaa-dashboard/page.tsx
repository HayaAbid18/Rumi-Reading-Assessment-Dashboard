'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Dummy data for the pilot
const TEHSILS = ['All Tehsils', 'Rawalpindi City', 'Gujar Khan', 'Kahuta', 'Kallar Syedan', 'Murree'];

const DUMMY_SCHOOLS = [
  { id: 1, name: 'Govt Primary Rawalpindi', tehsil: 'Rawalpindi City', teachers: 2, loop1_pct: 98, loop2_pct: 70, loop3_pct: 60, all3_pct: 53, retention: 96 },
  { id: 2, name: 'Liberty School', tehsil: 'Rawalpindi City', teachers: 3, loop1_pct: 96, loop2_pct: 68, loop3_pct: 58, all3_pct: 50, retention: 96 },
  { id: 3, name: 'Al-Huda Academy', tehsil: 'Rawalpindi City', teachers: 2, loop1_pct: 94, loop2_pct: 65, loop3_pct: 55, all3_pct: 45, retention: 92 },
  { id: 4, name: 'Rising Star Public', tehsil: 'Rawalpindi City', teachers: 2, loop1_pct: 88, loop2_pct: 60, loop3_pct: 50, all3_pct: 38, retention: 84 },
  { id: 5, name: 'Gujar Khan Primary', tehsil: 'Gujar Khan', teachers: 2, loop1_pct: 94, loop2_pct: 65, loop3_pct: 55, all3_pct: 48, retention: 94 },
  { id: 6, name: 'Kahuta Model School', tehsil: 'Kahuta', teachers: 2, loop1_pct: 92, loop2_pct: 60, loop3_pct: 50, all3_pct: 42, retention: 88 },
];

const DUMMY_TEACHERS = [
  { id: 1, name: 'Ali Ahmad', school: 'Govt Primary Rawalpindi', tehsil: 'Rawalpindi City', loop1_time: 2.6, loop1_done: true, loop2_opened: true, loop2_done: true, loop3_submitted: true, loop3_done: true, practice_change: true, retention: true },
  { id: 2, name: 'Fatima Hassan', school: 'Liberty School', tehsil: 'Rawalpindi City', loop1_time: 2.8, loop1_done: true, loop2_opened: true, loop2_done: true, loop3_submitted: true, loop3_done: true, practice_change: true, retention: true },
  { id: 3, name: 'Ahmed Khan', school: 'Al-Huda Academy', tehsil: 'Rawalpindi City', loop1_time: 3.2, loop1_done: true, loop2_opened: false, loop2_done: false, loop3_submitted: false, loop3_done: false, practice_change: false, retention: true },
  { id: 4, name: 'Zainab Ali', school: 'Rising Star Public', tehsil: 'Rawalpindi City', loop1_time: 4.1, loop1_done: true, loop2_opened: false, loop2_done: false, loop3_submitted: false, loop3_done: false, practice_change: false, retention: false },
  { id: 5, name: 'Hassan Muhammad', school: 'Gujar Khan Primary', tehsil: 'Gujar Khan', loop1_time: 2.9, loop1_done: true, loop2_opened: true, loop2_done: true, loop3_submitted: true, loop3_done: true, practice_change: true, retention: true },
];

const WEEKLY_METRICS = [
  { week: 'W1', time: 4.5, adoption: 40, retention: 100 },
  { week: 'W2', time: 3.8, adoption: 65, retention: 98 },
  { week: 'W3', time: 2.8, adoption: 72, retention: 96 },
];

export default function PectaaDashboard() {
  const [selectedTehsil, setSelectedTehsil] = useState('All Tehsils');
  const [activeTab, setActiveTab] = useState('overview');

  const filteredSchools = selectedTehsil === 'All Tehsils'
    ? DUMMY_SCHOOLS
    : DUMMY_SCHOOLS.filter(s => s.tehsil === selectedTehsil);

  const filteredTeachers = selectedTehsil === 'All Tehsils'
    ? DUMMY_TEACHERS
    : DUMMY_TEACHERS.filter(t => t.tehsil === selectedTehsil);

  // Calculate aggregated metrics
  const metrics = useMemo(() => {
    const teachers = filteredTeachers;
    const schools = filteredSchools;

    return {
      avgTime: (teachers.reduce((sum, t) => sum + t.loop1_time, 0) / teachers.length).toFixed(1),
      studentCoverage: 93,
      gapReportPct: Math.round((teachers.filter(t => t.loop2_opened).length / teachers.length) * 100),
      coachingPct: Math.round((teachers.filter(t => t.loop3_submitted).length / teachers.length) * 100),
      practiceChangePct: Math.round((teachers.filter(t => t.practice_change).length / teachers.filter(t => t.loop3_submitted).length || 0) * 100),
      all3LoopsPct: Math.round((teachers.filter(t => t.loop1_done && t.loop2_done && t.loop3_done).length / teachers.length) * 100),
      retentionPct: Math.round((teachers.filter(t => t.retention).length / teachers.length) * 100),
      totalSchools: schools.length,
      totalTeachers: teachers.length,
      activeSchools: schools.filter(s => s.retention >= 85).length,
    };
  }, [filteredTeachers, filteredSchools]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">🎯 PECTAA Pilot Dashboard</h1>
          <p className="text-sm text-gray-500">Week 3 of 8 | All 3 Loops Active</p>
        </div>

        {/* Tehsil Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {TEHSILS.map(tehsil => (
            <button
              key={tehsil}
              onClick={() => setSelectedTehsil(tehsil)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTehsil === tehsil
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              📍 {tehsil}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 pb-3">
          {['overview', 'schools', 'teachers', 'analytics', 'weekly'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 font-medium text-sm transition-all ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-600 text-white rounded-xl p-4">
                <p className="text-sm opacity-80 mb-1">Schools in {selectedTehsil}</p>
                <p className="text-3xl font-bold">{metrics.totalSchools}</p>
                <p className="text-xs mt-2 opacity-70">{metrics.activeSchools} active</p>
              </div>
              <div className="bg-green-600 text-white rounded-xl p-4">
                <p className="text-sm opacity-80 mb-1">Teachers</p>
                <p className="text-3xl font-bold">{metrics.totalTeachers}</p>
                <p className="text-xs mt-2 opacity-70">All engaged</p>
              </div>
              <div className="bg-purple-600 text-white rounded-xl p-4">
                <p className="text-sm opacity-80 mb-1">Retention Rate</p>
                <p className="text-3xl font-bold">{metrics.retentionPct}%</p>
                <p className="text-xs mt-2 opacity-70">Target: ≥60%</p>
              </div>
            </div>

            {/* Success Metrics */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">📊 Success Metrics (Week 3)</h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Loop 1 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">Loop 1: Assessment</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Avg Time</span>
                      <span className="font-bold text-blue-600">{metrics.avgTime} min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: `${(3 / 5) * 100}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-500">Target: ≤3 min ✓</p>
                  </div>
                </div>

                {/* Loop 2 */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-2">Loop 2: Gap Analysis</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Teachers Engaged</span>
                      <span className="font-bold text-green-600">{metrics.gapReportPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: `${metrics.gapReportPct}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-500">Target: ≥70% ⚠</p>
                  </div>
                </div>

                {/* Loop 3 - Adoption */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-orange-900 mb-2">Loop 3: Coaching</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Submissions</span>
                      <span className="font-bold text-orange-600">{metrics.coachingPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{width: `${metrics.coachingPct}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-500">Target: ≥60% ⚠</p>
                  </div>
                </div>

                {/* Loop 3 - Practice Change */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-900 mb-2">Practice Change</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Observed (AI)</span>
                      <span className="font-bold text-red-600">{metrics.practiceChangePct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{width: `${metrics.practiceChangePct}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-500">Target: ≥72% ✓</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All 3 Loops Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold mb-4">🎯 Teachers Active on All 3 Loops</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-purple-600">{metrics.all3LoopsPct}%</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-purple-600 h-4 rounded-full" style={{width: `${metrics.all3LoopsPct}%`}}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Target by Week 4: ≥50%</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SCHOOLS TAB */}
        {activeTab === 'schools' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">School</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Teachers</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">L1</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">L2</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">L3</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">All 3</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school, idx) => (
                  <tr key={school.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{school.name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{school.teachers}</td>
                    <td className="px-4 py-3 text-center text-blue-600 font-semibold">{school.loop1_pct}%</td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold">{school.loop2_pct}%</td>
                    <td className="px-4 py-3 text-center text-orange-600 font-semibold">{school.loop3_pct}%</td>
                    <td className="px-4 py-3 text-center text-purple-600 font-semibold">{school.all3_pct}%</td>
                    <td className="px-4 py-3 text-center">
                      {school.retention >= 90 ? '✓ On track' : school.retention >= 85 ? '⚠ Monitor' : '✗ At risk'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TEACHERS TAB */}
        {activeTab === 'teachers' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Teacher</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">School</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">L1 Time</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">L1✓</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">L2✓</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">L3✓</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Practice Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher, idx) => (
                  <tr key={teacher.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{teacher.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{teacher.school}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-700">{teacher.loop1_time}m</td>
                    <td className="px-4 py-3 text-center">{teacher.loop1_done ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-center">{teacher.loop2_done ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-center">{teacher.loop3_done ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      {teacher.practice_change ? <span className="text-green-600 font-semibold">Yes ✓</span> : <span className="text-gray-400">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold mb-4">📈 Time Savings Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={WEEKLY_METRICS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="week" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="time" stroke="#3B82F6" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2">Target ≤3 min achieved! 🎯</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold mb-4">📊 Loop Adoption Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={WEEKLY_METRICS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="week" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="adoption" stroke="#10B981" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2">All 3 loops ramping up as expected</p>
            </div>
          </div>
        )}

        {/* WEEKLY TAB */}
        {activeTab === 'weekly' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Week 3 Summary</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">✓ Loop 1: Assessment</p>
                <p className="text-sm text-gray-600">{metrics.totalTeachers} teachers submitted {Math.round(metrics.totalTeachers * 7)} assessments • Avg time: {metrics.avgTime}m (target ≤3m)</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">⚠ Loop 2: Gap Analysis</p>
                <p className="text-sm text-gray-600">{metrics.gapReportPct}% teachers opened gap report (target ≥70%) • Common gaps: word-recognition, fluency</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">⚠ Loop 3: Coaching</p>
                <p className="text-sm text-gray-600">{metrics.coachingPct}% teachers submitted class recordings (target ≥60%) • {metrics.practiceChangePct}% showing practice changes</p>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-900">💡 Action: Personal outreach to {Math.round(metrics.totalTeachers * 0.4)} teachers not yet on coaching to boost adoption by Week 4</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
