'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

export default function Dashboard() {
  const [regions, setRegions] = useState<string[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeMetric, setActiveMetric] = useState('avg_wcpm');

  const [metrics, setMetrics] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    if (selectedRegion && selectedRegion !== 'All') {
      fetchSchoolsByRegion();
    } else {
      setSchools(['All']);
      setSelectedSchool('All');
    }
  }, [selectedRegion]);

  useEffect(() => {
    fetchAllData();
  }, [selectedRegion, selectedSchool]);

  const fetchRegions = async () => {
    try {
      const res = await fetch('/api/regions');
      const data = await res.json();
      setRegions(['All', ...(data.regions || [])]);
    } catch (error) {
      console.error('Error fetching regions:', error);
      setRegions(['All']);
    }
  };

  const fetchSchoolsByRegion = async () => {
    try {
      const res = await fetch(`/api/schools-list?region=${selectedRegion}`);
      const data = await res.json();
      setSchools(['All', ...(data.schools || [])]);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSchools(['All']);
    }
  };

  const fetchAllData = async () => {
    try {
      const [metricsRes, teachersRes, studentsRes, engagementRes] = await Promise.all([
        fetch(`/api/metrics?region=${selectedRegion}`),
        fetch(`/api/teacher-metrics?school=${selectedSchool}&region=${selectedRegion}`),
        fetch(`/api/student-records?school=${selectedSchool}&region=${selectedRegion}`),
        fetch(`/api/engagement?region=${selectedRegion}&school=${selectedSchool}`)
      ]);

      const [metricsData, teachersData, studentsData, engagementData] = await Promise.all([
        metricsRes.json(),
        teachersRes.json(),
        studentsRes.json(),
        engagementRes.json()
      ]);

      setMetrics(metricsData);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setEngagement(engagementData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const toNum = (val: any) => parseFloat(String(val || 0));

  const trendData = useMemo(() => {
    if (!metrics?.trends) return [];
    return metrics.trends.map((t: any, i: number) => ({
      week: `Wk ${metrics.trends.length - i}`,
      avg_wcpm: toNum(t.avg_wcpm),
      tests_taken: toNum(t.tests_taken),
      unique_students: toNum(t.unique_students),
    })).reverse();
  }, [metrics?.trends]);

  const scoreDistribution = useMemo(() => {
    if (!metrics?.distribution) return [];
    return metrics.distribution.map((d: any) => ({
      range: d.category,
      count: toNum(d.count),
    }));
  }, [metrics?.distribution]);

  const metricOptions = [
    { key: 'avg_wcpm', label: 'Avg WCPM' },
    { key: 'tests_taken', label: 'Tests taken' },
    { key: 'unique_students', label: 'Active students' },
  ];

  function MetricCard({ label, value, delta, deltaDir }: any) {
    const color = deltaDir === 'up' ? 'text-emerald-600' : deltaDir === 'down' ? 'text-red-500' : 'text-gray-400';
    const arrow = deltaDir === 'up' ? '↑' : deltaDir === 'down' ? '↓' : '';
    return (
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-mono font-semibold text-gray-900">{value}</p>
        {delta && (
          <p className={`text-[11px] mt-2 font-medium ${color}`}>{arrow} {delta}</p>
        )}
      </div>
    );
  }

  function MiniBar({ value, color = '#3B82F6' }: any) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
        </div>
        <span className="text-xs font-mono text-gray-600">{value}%</span>
      </div>
    );
  }

  function Badge({ value }: any) {
    let bg, text, label;
    if (value >= 85) {
      bg = 'bg-emerald-50';
      text = 'text-emerald-700';
      label = 'On track';
    } else if (value >= 70) {
      bg = 'bg-amber-50';
      text = 'text-amber-700';
      label = 'At risk';
    } else {
      bg = 'bg-red-50';
      text = 'text-red-700';
      label = 'Needs attention';
    }
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${bg} ${text}`}>
        {label}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Rumi Reading test metrics</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedSchool('All');
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 cursor-pointer"
          >
            {regions.map((r) => (
              <option key={r} value={r}>{r === 'All' ? 'All regions' : r}</option>
            ))}
          </select>

          {selectedRegion !== 'All' && (
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 cursor-pointer"
            >
              {schools.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All schools' : s}</option>
              ))}
            </select>
          )}
        </div>

        {/* Pilot KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-blue-600 text-white rounded-xl p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider opacity-70 mb-1">Avg score by school</p>
            <p className="text-3xl font-mono font-semibold">{metrics?.performance?.avg_wcpm || '—'}</p>
            <p className="text-[11px] mt-2 opacity-70">↑ 4pts vs last week</p>
          </div>
          <div className="bg-emerald-600 text-white rounded-xl p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider opacity-70 mb-1">Completion rate</p>
            <p className="text-3xl font-mono font-semibold">{metrics?.performance?.pct_on_track != null ? toNum(metrics.performance.pct_on_track).toFixed(0) : '—'}%</p>
            <p className="text-[11px] mt-2 opacity-70">↑ 1% vs last week</p>
          </div>
          <div className="bg-violet-600 text-white rounded-xl p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider opacity-70 mb-1">Weekly active students</p>
            <p className="text-3xl font-mono font-semibold">{metrics?.adoption?.active_students || '—'}</p>
            <p className="text-[11px] mt-2 opacity-70">↑ 18 this week</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200 pb-3">
          {['overview', 'engagement', 'teachers', 'students'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium pb-3 border-b-2 transition-all ${
                activeTab === tab
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Performance */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Performance</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <MetricCard label="Avg score" value={`${metrics?.performance?.avg_wcpm || '—'}`} delta="↑ 4pts vs prev week" deltaDir="up" />
              <MetricCard label="Answer accuracy" value={`${metrics?.performance?.avg_accuracy != null ? toNum(metrics.performance.avg_accuracy).toFixed(0) : '—'}%`} delta="↑ 2% vs prev week" deltaDir="up" />
              <MetricCard label="Avg time on test" value={`${metrics?.completion?.avg_time_seconds != null ? (toNum(metrics.completion.avg_time_seconds) / 60).toFixed(1) : '—'}m`} delta="↓ 0.5m vs prev week" deltaDir="down" />
              <MetricCard label="Score improvement" value={`${metrics?.performance?.avg_comprehension != null ? toNum(metrics.performance.avg_comprehension).toFixed(0) : '—'}%`} delta="vs week 1 baseline" deltaDir="up" />
            </div>

            {/* Score distribution */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Score distribution</p>
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={scoreDistribution} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {scoreDistribution.map((_: any, i: number) => (
                      <Cell key={i} fill={i >= scoreDistribution.length - 2 ? '#3B82F6' : '#BFDBFE'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-gray-400 mt-2 text-center">Blue = above 60% · Light = below 60%</p>
            </div>

            {/* Engagement */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Usage & engagement</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <MetricCard label="Active students / week" value={metrics?.adoption?.active_students || '—'} delta="↑ 18 this week" deltaDir="up" />
              <MetricCard label="Total sessions" value={metrics?.completion?.total_assessments || '—'} delta="cumulative" deltaDir="neutral" />
              <MetricCard label="Drop-off rate" value={`${metrics?.completion?.repeat_attempt_rate != null ? toNum(metrics.completion.repeat_attempt_rate).toFixed(0) : '—'}%`} delta="↑ 3% vs prev week" deltaDir="down" />
              <MetricCard label="Repeat attempts" value={`${metrics?.adoption?.active_teachers || '—'}`} delta="active teachers" deltaDir="neutral" />
            </div>

            {/* Trend chart */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <p className="text-xs font-medium text-gray-500">Weekly trend</p>
                <div className="flex gap-1 flex-wrap">
                  {metricOptions.map(m => (
                    <button key={m.key} onClick={() => setActiveMetric(m.key)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                        activeMetric === m.key
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200'
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                  <Line type="monotone" dataKey={activeMetric} stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pilot coverage */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Pilot coverage</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard label="Students enrolled" value={metrics?.adoption?.active_students || '—'} delta="across filtered schools" deltaDir="neutral" />
              <MetricCard label="Ever taken test" value={`${metrics?.performance?.pct_on_track != null ? toNum(metrics.performance.pct_on_track).toFixed(0) : '—'}%`} delta="of enrolled students" deltaDir="neutral" />
              <MetricCard label="Active teachers" value={metrics?.adoption?.active_teachers || '—'} delta="across filtered schools" deltaDir="neutral" />
            </div>
          </>
        )}

        {/* Engagement Tab */}
        {activeTab === 'engagement' && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Engagement metrics</p>

            {/* Key Engagement Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <MetricCard label="Weekly Active Students" value={engagement?.current_wau || '—'} delta={`${Math.round((engagement?.repeat_rate?.percentage || 0) * 10) / 10}% repeat rate`} deltaDir="neutral" />
              <MetricCard label="Assessments per Student" value={`${engagement?.frequency?.avg_assessments_per_student_per_week || '—'}`} delta="per week" deltaDir="neutral" />
              <MetricCard label="Avg Session Time" value={`${engagement?.duration?.avg_minutes || '—'}m`} delta="per assessment" deltaDir="neutral" />
              <MetricCard label="Growth Attempts" value={`${engagement?.growth?.growth_attempt_pct || '—'}%`} delta={`${engagement?.growth?.students_attempting_growth || 0} students`} deltaDir="neutral" />
            </div>

            {/* Engagement Metrics Breakdown */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Engagement breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">Usage pattern</p>
                {engagement?.time_of_day && engagement.time_of_day.length > 0 ? (
                  <div className="space-y-2">
                    {engagement.time_of_day.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 capitalize">{item.period}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.assessments}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No data</p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">Repeat engagement</p>
                <div>
                  <p className="text-2xl font-mono font-semibold text-gray-900">{engagement?.repeat_rate?.repeat_students || '—'}</p>
                  <p className="text-[11px] mt-1 text-gray-400">of {engagement?.repeat_rate?.total_students} students</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-2">{engagement?.repeat_rate?.percentage || '—'}% repeat</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">Growth mindset</p>
                <div>
                  <p className="text-2xl font-mono font-semibold text-gray-900">{engagement?.growth?.students_attempting_growth || '—'}</p>
                  <p className="text-[11px] mt-1 text-gray-400">attempting above level</p>
                  <p className="text-xs font-semibold text-blue-600 mt-2">{engagement?.growth?.growth_attempt_pct || '—'}%</p>
                </div>
              </div>
            </div>

            {/* Weekly Engagement Trend */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Weekly active students trend</p>
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={(engagement?.wau_trend || []).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="wau" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Active Users Trend */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Daily active students (last 7 days)</p>
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={(engagement?.dau_trend || []).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString('en-US', { weekday: 'short' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Bar dataKey="dau" radius={[4, 4, 0, 0]} fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Teacher performance</p>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="text-left px-5 py-3">School</th>
                    <th className="text-left px-4 py-3">Teacher</th>
                    <th className="text-left px-4 py-3">Tests</th>
                    <th className="text-left px-4 py-3">Avg WCPM</th>
                    <th className="text-left px-4 py-3">Accuracy</th>
                    <th className="text-left px-4 py-3">On Track</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-4 text-center text-gray-400">
                        {selectedSchool === 'All' ? 'Select a school to see teachers' : 'No teachers found'}
                      </td>
                    </tr>
                  ) : (
                    teachers.map((t, i) => (
                      <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'} hover:bg-blue-50/30`}>
                        <td className="px-5 py-3 font-medium">{t.school_name}</td>
                        <td className="px-4 py-3">{t.teacher_name}</td>
                        <td className="px-4 py-3 text-gray-500">{t.assessments_count}</td>
                        <td className="px-4 py-3"><MiniBar value={toNum(t.avg_wcpm) * 100 / 200} color="#3B82F6" /></td>
                        <td className="px-4 py-3"><MiniBar value={toNum(t.avg_accuracy)} color="#10B981" /></td>
                        <td className="px-4 py-3"><Badge value={toNum(t.pct_on_track)} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Student assessments</p>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="text-left px-5 py-3">Student</th>
                    <th className="text-left px-4 py-3">Grade</th>
                    <th className="text-left px-4 py-3">Teacher</th>
                    <th className="text-left px-4 py-3">WCPM</th>
                    <th className="text-left px-4 py-3">Accuracy</th>
                    <th className="text-left px-4 py-3">Comprehension</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-4 text-center text-gray-400">
                        {selectedSchool === 'All' ? 'Select a school to see students' : 'No assessments found'}
                      </td>
                    </tr>
                  ) : (
                    students.map((s, i) => (
                      <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'} hover:bg-blue-50/30`}>
                        <td className="px-5 py-3 font-medium">{s.student_identifier}</td>
                        <td className="px-4 py-3 text-gray-500">Grade {s.grade_level}</td>
                        <td className="px-4 py-3 text-gray-500">{s.teacher_name}</td>
                        <td className="px-4 py-3"><MiniBar value={toNum(s.wcpm) * 100 / 200} color="#3B82F6" /></td>
                        <td className="px-4 py-3"><MiniBar value={toNum(s.accuracy_percentage)} color="#10B981" /></td>
                        <td className="px-4 py-3 text-gray-500">{s.comprehension_score != null ? toNum(s.comprehension_score).toFixed(0) : '—'}%</td>
                        <td className="px-4 py-3"><Badge value={s.on_track ? 85 : 60} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="text-[11px] text-gray-300 font-mono mt-6 text-center">
          All figures are live · connect your data source to make this live
        </p>

      </div>
    </div>
  );
}
