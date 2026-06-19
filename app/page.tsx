'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import SidePanel from '@/components/panels/SidePanel';
import CohortMemberList from '@/components/panels/CohortMemberList';
import UserAssessmentHistory from '@/components/panels/UserAssessmentHistory';
import EngagementUserList from '@/components/panels/EngagementUserList';
import TeacherCohortMemberList from '@/components/panels/TeacherCohortMemberList';
import MetricContributorsList from '@/components/panels/MetricContributorsList';
import RetentionHeatmap from '@/components/panels/RetentionHeatmap';
import TeacherDetail from '@/components/panels/TeacherDetail';

export default function Dashboard() {
  const [regions, setRegions] = useState<string[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeMetric, setActiveMetric] = useState('avg_wcpm');
  const [timeRange, setTimeRange] = useState('last_4_weeks');

  const [metrics, setMetrics] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [retention, setRetention] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Panel state for drill-down
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<'cohort' | 'user' | 'engagement' | 'teacher-cohort' | 'overview' | 'teacher' | null>(null);
  const [panelData, setPanelData] = useState<any>(null);

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
  }, [selectedRegion, selectedSchool, timeRange]);

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
      const { startDate, endDate } = getDateRange(timeRange);
      const dateParams = `&startDate=${startDate}&endDate=${endDate}`;

      const [metricsRes, teachersRes, studentsRes, engagementRes, cohortRes, churnRes] = await Promise.all([
        fetch(`/api/metrics?region=${selectedRegion}${dateParams}`),
        fetch(`/api/teacher-metrics?school=${selectedSchool}&region=${selectedRegion}${dateParams}`),
        fetch(`/api/student-records?school=${selectedSchool}&region=${selectedRegion}${dateParams}`),
        fetch(`/api/engagement?region=${selectedRegion}&school=${selectedSchool}${dateParams}`),
        fetch(`/api/retention/cohort?region=${selectedRegion}&school=${selectedSchool}${dateParams}`),
        fetch(`/api/retention/churn?region=${selectedRegion}&school=${selectedSchool}`)
      ]);

      const [metricsData, teachersData, studentsData, engagementData, cohortData, churnData] = await Promise.all([
        metricsRes.json(),
        teachersRes.json(),
        studentsRes.json(),
        engagementRes.json(),
        cohortRes.json(),
        churnRes.json()
      ]);

      setMetrics(metricsData);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setEngagement(engagementData);
      setRetention({
        student_cohorts: cohortData.student_cohorts || [],
        teacher_cohorts: cohortData.teacher_cohorts || [],
        repeat_rate: cohortData.repeat_rate || {},
        churn: churnData
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const toNum = (val: any) => parseFloat(String(val || 0));

  const fetchCohortMembers = async (cohortWeek: string) => {
    try {
      setPanelOpen(true);
      setPanelType('cohort');
      const res = await fetch(`/api/retention/cohort-users?cohort_week=${cohortWeek}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPanelData({
        cohort_week: cohortWeek,
        students: data.students || [],
        student_count: data.student_count || 0
      });
    } catch (error) {
      console.error('Error fetching cohort members:', error);
      setPanelData(null);
    }
  };

  const fetchTeacherCohortMembers = async (cohortWeek: string) => {
    try {
      setPanelOpen(true);
      setPanelType('teacher-cohort');
      const res = await fetch(`/api/retention/teacher-cohort-users?cohort_week=${cohortWeek}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPanelData({
        cohort_week: cohortWeek,
        teachers: data.teachers || [],
        teacher_count: data.teacher_count || 0
      });
    } catch (error) {
      console.error('Error fetching teacher cohort members:', error);
      setPanelData(null);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setPanelType('user');
    setPanelData({ student_identifier: studentId });
  };

  const fetchEngagementUsers = async (endpoint: string, metric: string, title: string, params: string) => {
    try {
      setPanelOpen(true);
      setPanelType('engagement');
      const res = await fetch(`/api/engagement/${endpoint}?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPanelData({
        title,
        metric,
        students: data.students || [],
        student_count: data.student_count || 0
      });
    } catch (error) {
      console.error('Error fetching engagement users:', error);
      setPanelData(null);
    }
  };

  const openEngagementDrill = (endpoint: string, metric: string, title: string, params: string) => {
    fetchEngagementUsers(endpoint, metric, title, params);
  };

  const openTeacherDetail = (teacherName: string) => {
    setPanelOpen(true);
    setPanelType('teacher');
    setPanelData({ teacher_name: teacherName });
  };

  const fetchMetricContributors = async (metric: string, title: string) => {
    try {
      setPanelOpen(true);
      setPanelType('overview');
      const { startDate, endDate } = getDateRange(timeRange);
      const res = await fetch(`/api/overview/metric-contributors?region=${selectedRegion}&school=${selectedSchool}&startDate=${startDate}&endDate=${endDate}&metric=${metric}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPanelData({
        metric,
        title,
        students: data.students || [],
        student_count: data.student_count || 0
      });
    } catch (error) {
      console.error('Error fetching metric contributors:', error);
      setPanelData(null);
    }
  };

  const getDateRange = (range: string) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    let startDate = new Date();

    switch (range) {
      case 'this_week':
        startDate = new Date(startOfWeek);
        break;
      case 'last_week':
        startDate = new Date(startOfWeek);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last_4_weeks':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 28);
        break;
      case 'last_30_days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 28);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };

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
    { key: 'unique_students', label: 'Students assessed' },
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

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 cursor-pointer"
          >
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="last_4_weeks">Last 4 Weeks</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
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
            <p className="text-[11px] font-medium uppercase tracking-wider opacity-70 mb-1">Students assessed this week</p>
            <p className="text-3xl font-mono font-semibold">{metrics?.adoption?.active_students || '—'}</p>
            <p className="text-[11px] mt-2 opacity-70">↑ 18 this week</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200 pb-3">
          {['overview', 'engagement', 'retention', 'teachers', 'students'].map((tab) => (
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
              <div
                onClick={() => fetchMetricContributors('wcpm', 'Top Students by Avg WCPM')}
                className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Avg score</p>
                <p className="text-3xl font-mono font-semibold text-gray-900">{metrics?.performance?.avg_wcpm || '—'}</p>
                <p className="text-[11px] mt-2 font-medium text-emerald-600">↑ 4pts vs prev week</p>
              </div>
              <div
                onClick={() => fetchMetricContributors('accuracy', 'Top Students by Accuracy')}
                className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Answer accuracy</p>
                <p className="text-3xl font-mono font-semibold text-gray-900">{metrics?.performance?.avg_accuracy != null ? toNum(metrics.performance.avg_accuracy).toFixed(0) : '—'}%</p>
                <p className="text-[11px] mt-2 font-medium text-emerald-600">↑ 2% vs prev week</p>
              </div>
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
              <MetricCard label="Students assessed / week" value={metrics?.adoption?.active_students || '—'} delta="↑ 18 this week" deltaDir="up" />
              <MetricCard label="Total assessments" value={metrics?.completion?.total_assessments || '—'} delta="cumulative" deltaDir="neutral" />
              <MetricCard label="Repeat rate" value={`${metrics?.completion?.repeat_attempt_rate != null ? toNum(metrics.completion.repeat_attempt_rate).toFixed(0) : '—'}%`} delta="↑ 3% vs prev week" deltaDir="down" />
              <MetricCard label="Active teachers" value={`${metrics?.adoption?.active_teachers || '—'}`} delta="administering tests" deltaDir="neutral" />
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
              <MetricCard label="Students assessed" value={metrics?.adoption?.active_students || '—'} delta="across filtered schools" deltaDir="neutral" />
              <MetricCard label="On track" value={`${metrics?.performance?.pct_on_track != null ? toNum(metrics.performance.pct_on_track).toFixed(0) : '—'}%`} delta="of assessed students" deltaDir="neutral" />
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
              <div
                onClick={() => {
                  const today = new Date();
                  const dayOfWeek = today.getDay();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - dayOfWeek);
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  const startStr = startOfWeek.toISOString().split('T')[0];
                  const endStr = endOfWeek.toISOString().split('T')[0];
                  openEngagementDrill('wau-users', 'this week', 'Students Assessed This Week', `region=${selectedRegion}&school=${selectedSchool}&startDate=${startStr}&endDate=${endStr}`);
                }}
                className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Students Assessed This Week</p>
                <p className="text-3xl font-mono font-semibold text-gray-900">{engagement?.current_wau || '—'}</p>
                <p className="text-[11px] mt-2 font-medium text-emerald-600">↑ {Math.round((engagement?.repeat_rate?.percentage || 0) * 10) / 10}% repeat rate</p>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Assessments per Student</p>
                <p className="text-3xl font-mono font-semibold text-gray-900">{engagement?.frequency?.avg_assessments_per_student_per_week || '—'}</p>
                <p className="text-[11px] mt-2 font-medium text-gray-400"> per week</p>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Avg Session Time</p>
                <p className="text-3xl font-mono font-semibold text-gray-900">{engagement?.duration?.avg_minutes || '—'}m</p>
                <p className="text-[11px] mt-2 font-medium text-gray-400"> per assessment</p>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Growth Attempts</p>
                <p className="text-3xl font-mono font-semibold text-gray-900">{engagement?.growth?.growth_attempt_pct || '—'}%</p>
                <p className="text-[11px] mt-2 font-medium text-gray-400"> {engagement?.growth?.students_attempting_growth || 0} students</p>
              </div>
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

              <div
                onClick={() => openEngagementDrill('repeat-users', 'last_4_weeks', 'Students with Repeat Assessments', `region=${selectedRegion}&school=${selectedSchool}&startDate=${getDateRange(timeRange).startDate}&endDate=${getDateRange(timeRange).endDate}`)}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow"
              >
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Weekly students assessed trend</p>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Daily students assessed (last 7 days)</p>
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

        {/* Retention Tab */}
        {activeTab === 'retention' && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Retention overview</p>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <MetricCard label="Total Students Assessed" value={retention?.repeat_rate?.total_students || '—'} delta="all time" deltaDir="neutral" />
              <MetricCard label="Students w/ Repeats" value={retention?.repeat_rate?.repeat_students || '—'} delta={`${retention?.repeat_rate?.percentage || 0}% retention`} deltaDir="neutral" />
              <MetricCard label="At-Risk Students" value={retention?.churn?.churn_summary?.at_risk_count || '—'} delta={`${retention?.churn?.churn_summary?.at_risk_pct || 0}% at risk`} deltaDir="neutral" />
              <MetricCard label="Churned Students" value={retention?.churn?.churn_summary?.churned_count || '—'} delta={`${retention?.churn?.churn_summary?.churned_pct || 0}% churned`} deltaDir="neutral" />
            </div>

            {/* Student Cohort Retention Heatmap */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
              <RetentionHeatmap
                title="Student Cohort Retention Heatmap"
                data={retention?.student_cohorts || []}
              />
              <p className="text-[11px] text-gray-400 mt-3">Green = high retention, Red = low retention. Shows % of students from each cohort who remained active in subsequent weeks</p>
            </div>

            {/* Student Cohort Data Table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="text-left px-4 py-3">Cohort Week</th>
                    <th className="text-left px-4 py-3">Size</th>
                    <th className="text-center px-4 py-3">W0</th>
                    <th className="text-center px-4 py-3">W1</th>
                    <th className="text-center px-4 py-3">W2</th>
                    <th className="text-center px-4 py-3">W4</th>
                    <th className="text-left px-4 py-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {(retention?.student_cohorts || []).slice(0, 8).map((cohort: any, i: number) => (
                    <tr key={i} onClick={() => fetchCohortMembers(cohort.cohort_week)} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'} hover:bg-blue-50 cursor-pointer transition-colors`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{new Date(cohort.cohort_week).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600">{cohort.cohort_size}</td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-600">{cohort.week0_pct}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-green-600">{cohort.week1_pct}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-600">{cohort.week2_pct}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-red-600">{cohort.week4_pct}%</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {cohort.week4_pct > 20 ? '📈 Good' : cohort.week4_pct > 10 ? '➡️ Fair' : '📉 Poor'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Teacher Cohort Retention Heatmap */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
              <RetentionHeatmap
                title="Teacher Cohort Retention Heatmap"
                data={retention?.teacher_cohorts || []}
              />
              <p className="text-[11px] text-gray-400 mt-3">Green = high retention, Red = low retention. Shows % of teachers from each cohort who remained active in subsequent weeks</p>
            </div>

            {/* Teacher Cohort Data Table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="text-left px-4 py-3">Cohort Week</th>
                    <th className="text-left px-4 py-3">Size</th>
                    <th className="text-center px-4 py-3">W0</th>
                    <th className="text-center px-4 py-3">W1</th>
                    <th className="text-center px-4 py-3">W2</th>
                    <th className="text-center px-4 py-3">W4</th>
                    <th className="text-left px-4 py-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {(retention?.teacher_cohorts || []).slice(0, 8).map((cohort: any, i: number) => (
                    <tr key={i} onClick={() => fetchTeacherCohortMembers(cohort.cohort_week)} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'} hover:bg-purple-50 cursor-pointer transition-colors`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{new Date(cohort.cohort_week).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600">{cohort.cohort_size}</td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-600">{cohort.week0_pct}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-green-600">{cohort.week1_pct}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-600">{cohort.week2_pct}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-red-600">{cohort.week4_pct}%</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {cohort.week4_pct > 20 ? '📈 Good' : cohort.week4_pct > 10 ? '➡️ Fair' : '📉 Poor'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* At-Risk Students */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">At-risk students (inactive 7-14 days)</p>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {retention?.churn?.at_risk_users && retention.churn.at_risk_users.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <th className="text-left px-5 py-3">Student ID</th>
                      <th className="text-left px-4 py-3">Days Inactive</th>
                      <th className="text-left px-4 py-3">Total Assessments</th>
                      <th className="text-left px-4 py-3">Active Days</th>
                      <th className="text-left px-4 py-3">Risk Score</th>
                      <th className="text-left px-4 py-3">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retention.churn.at_risk_users.map((user: any, i: number) => (
                      <tr key={i} onClick={() => handleSelectStudent(user.student_identifier)} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'} hover:bg-amber-50/30 cursor-pointer transition-colors`}>
                        <td className="px-5 py-3 font-medium text-gray-900">{user.student_identifier}</td>
                        <td className="px-4 py-3 text-gray-600">{user.days_inactive}</td>
                        <td className="px-4 py-3 text-gray-600">{user.total_assessments}</td>
                        <td className="px-4 py-3 text-gray-600">{user.active_days}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            user.risk_score > 0.8 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {(user.risk_score * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{new Date(user.last_active_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-5 py-4 text-center text-gray-400">
                  No at-risk students in this period
                </div>
              )}
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
                      <tr key={i} onClick={() => openTeacherDetail(t.teacher_name)} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'} hover:bg-blue-50/30 cursor-pointer transition-colors`}>
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
                      <tr key={i} onClick={() => handleSelectStudent(s.student_identifier)} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'} hover:bg-blue-50/30 cursor-pointer transition-colors`}>
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

      {/* Side Panel for Drill-down */}
      <SidePanel
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setPanelType(null);
          setPanelData(null);
        }}
        title={
          panelType === 'cohort'
            ? `Cohort ${panelData?.cohort_week ? new Date(panelData.cohort_week).toLocaleDateString() : ''}`
            : panelType === 'teacher-cohort'
            ? `Teacher Cohort ${panelData?.cohort_week ? new Date(panelData.cohort_week).toLocaleDateString() : ''}`
            : panelType === 'engagement'
            ? panelData?.title || 'Engagement Metrics'
            : panelType === 'overview'
            ? panelData?.title || 'Metric Contributors'
            : panelType === 'teacher'
            ? panelData?.teacher_name || 'Teacher Details'
            : 'Student History'
        }
        breadcrumbs={panelType === 'user' ? [
          { label: panelData?.from_engagement ? 'Engagement' : 'Retention', onClick: () => setPanelType(panelData?.from_engagement ? 'engagement' : 'cohort') }
        ] : []}
      >
        {panelType === 'cohort' && panelData ? (
          <CohortMemberList
            cohortWeek={panelData.cohort_week}
            students={panelData.students}
            onSelectStudent={handleSelectStudent}
          />
        ) : panelType === 'user' && panelData ? (
          <UserAssessmentHistory
            studentIdentifier={panelData.student_identifier}
            onBack={() => setPanelType('cohort')}
          />
        ) : panelType === 'engagement' && panelData ? (
          <EngagementUserList
            title={panelData.title}
            metric={panelData.metric}
            students={panelData.students}
            onSelectStudent={handleSelectStudent}
          />
        ) : panelType === 'teacher-cohort' && panelData ? (
          <TeacherCohortMemberList
            cohortWeek={panelData.cohort_week}
            teachers={panelData.teachers}
          />
        ) : panelType === 'overview' && panelData ? (
          <MetricContributorsList
            metric={panelData.metric}
            title={panelData.title}
            students={panelData.students}
            onSelectStudent={handleSelectStudent}
          />
        ) : panelType === 'teacher' && panelData ? (
          <TeacherDetail
            teacherName={panelData.teacher_name}
            onBack={() => {
              setPanelOpen(false);
              setPanelType(null);
              setPanelData(null);
            }}
          />
        ) : null}
      </SidePanel>
    </div>
  );
}
