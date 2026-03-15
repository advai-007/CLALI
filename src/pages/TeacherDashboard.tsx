import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { studentMetricsApi, type ClassMetrics } from '../services/studentMetricsApi';

// ─── Helpers ───────────────────────────────────────────────────────
function formatLastActive(dateStr: string): string {
    if (dateStr === 'Never') return 'Never';
    const ms = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
}

function stateColor(state: string) {
    const s = state.toLowerCase();
    if (s === 'calm') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (s === 'mildstress') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (s === 'highstress') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (s === 'distracted') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (s === 'disengaged') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
}

function loadDotColor(load: number) {
    if (load <= 2) return 'text-emerald-500';
    if (load <= 4) return 'text-blue-500';
    if (load <= 6) return 'text-amber-500';
    return 'text-red-500';
}

// ─── Component ─────────────────────────────────────────────────────
const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { signOut, user } = useAuth();
    const [isDark, setIsDark] = useState(false);
    const [teacherName, setTeacherName] = useState('');
    const [classData, setClassData] = useState<ClassMetrics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                const { data: profile } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                if (profile) setTeacherName(profile.full_name || '');

                const data = await studentMetricsApi.getTeacherDashboardData(user.id);
                setClassData(data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    // ── Aggregations ──────────────────────────────────────────────
    const totalStudents = classData.reduce((acc, cls) => acc + cls.studentCount, 0);
    const totalRecentEvents = classData.reduce((acc, cls) => acc + cls.recentEventCount, 0);
    const allStudents = classData.flatMap(cls => cls.students);

    const overallDistribution = classData.reduce(
        (acc, cls) => {
            acc.optimal += cls.distribution.optimal;
            acc.low += cls.distribution.low;
            acc.struggling += cls.distribution.struggling;
            acc.critical += cls.distribution.critical;
            return acc;
        },
        { optimal: 0, low: 0, struggling: 0, critical: 0 }
    );

    const interventionQueue = allStudents.filter(s => s.avg_load > 6).slice(0, 6);
    const activeAdaptations = allStudents.filter(
        s => !['calm', 'CALM'].includes(s.current_state) && s.recentEventCount > 0
    ).length;

    // State distribution across all students for adaptation breakdown
    const stateCounts = allStudents.reduce(
        (acc, s) => {
            const key = s.current_state.toLowerCase();
            if (key in acc) acc[key as keyof typeof acc]++;
            return acc;
        },
        { calm: 0, mildstress: 0, highstress: 0, distracted: 0, disengaged: 0 }
    );

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 font-display min-h-screen">
            <div className="flex h-screen overflow-hidden">
                {/* ── Sidebar ── */}
                <aside className="w-20 bg-[#0c1427] flex flex-col items-center py-6 gap-8 z-50">
                    <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <span className="material-icons-round">psychology</span>
                    </div>
                    <nav className="flex flex-col gap-6 flex-1">
                        <button
                            className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white hover:bg-[#3b82f6] hover:shadow-lg hover:shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/teacher-dashboard')}
                            title="Dashboard"
                        >
                            <span className="material-icons-round">dashboard</span>
                        </button>
                        <button
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/student-analysis')}
                            title="Student Analysis"
                        >
                            <span className="material-icons-round">groups</span>
                        </button>
                        <button
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/class-management')}
                            title="Class Management"
                        >
                            <span className="material-icons-round">assignment</span>
                        </button>
                        <button
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/add-student')}
                            title="Add Student"
                        >
                            <span className="material-icons-round">person_add</span>
                        </button>
                    </nav>
                    <div className="flex flex-col gap-6">
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20 hover:scale-110 active:scale-95 transition-all duration-300"
                        >
                            <span className="material-icons-round">logout</span>
                        </button>
                        <img
                            alt="Profile Avatar"
                            className="w-10 h-10 rounded-xl object-cover border-2 border-slate-700 hover:border-[#3b82f6] hover:scale-110 cursor-pointer transition-all duration-300"
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher"
                        />
                    </div>
                </aside>

                {/* ── Main ── */}
                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -z-10"></div>

                    {/* Header */}
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold dark:text-white">
                                Welcome back, {teacherName || 'Teacher'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Real-time cognitive load monitoring across all your classes.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-card-light dark:bg-card-dark shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-300"
                                onClick={() => setIsDark(!isDark)}
                            >
                                <span className="material-icons-round hover:rotate-12 transition-transform duration-300">
                                    {isDark ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>
                        </div>
                    </header>

                    {/* ── Summary Stats Bar ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            {
                                label: 'Total Students',
                                value: totalStudents,
                                icon: 'group',
                                color: 'blue',
                                sub: `across ${classData.length} class${classData.length !== 1 ? 'es' : ''}`,
                            },
                            {
                                label: 'Events Today',
                                value: totalRecentEvents,
                                icon: 'timeline',
                                color: 'emerald',
                                sub: 'adaptation events (24h)',
                            },
                            {
                                label: 'Active Adaptations',
                                value: activeAdaptations,
                                icon: 'auto_fix_high',
                                color: 'amber',
                                sub: 'students in non-calm state',
                            },
                            {
                                label: 'Need Attention',
                                value: overallDistribution.critical + overallDistribution.struggling,
                                icon: 'warning',
                                color: 'rose',
                                sub: 'struggling or critical load',
                            },
                        ].map(stat => (
                            <div
                                key={stat.label}
                                className={`bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                        ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                                        ${stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                                        ${stat.color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                                        ${stat.color === 'rose' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : ''}
                                    `}>
                                        <span className="material-icons-round text-lg">{stat.icon}</span>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                <div className="text-[11px] text-slate-400">{stat.sub}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-12 gap-6">

                        {/* ── Student Snapshot Table ── */}
                        <div className="col-span-12 xl:col-span-8 bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg">Student Snapshot</h2>
                                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#3b82f6] text-[10px] font-bold rounded uppercase tracking-wider">Live</span>
                                </div>
                                <button
                                    onClick={() => navigate('/student-analysis')}
                                    className="text-xs font-semibold text-[#3b82f6] hover:underline flex items-center gap-1"
                                >
                                    Full Analysis <span className="material-icons-round text-sm">arrow_forward</span>
                                </button>
                            </div>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left min-w-[560px]">
                                    <thead className="text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="pb-3 font-semibold">Student</th>
                                            <th className="pb-3 font-semibold">Class</th>
                                            <th className="pb-3 font-semibold text-center">State</th>
                                            <th className="pb-3 font-semibold text-center">Events Today</th>
                                            <th className="pb-3 font-semibold text-right">Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                                        {allStudents.length > 0 ? allStudents.slice(0, 8).map((student) => {
                                            const cls = classData.find(c => c.students.some(s => s.participant_id === student.participant_id));
                                            return (
                                                <tr
                                                    key={student.participant_id}
                                                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                    onClick={() => navigate('/student-analysis')}
                                                >
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-base overflow-hidden shrink-0">
                                                                {student.avatar
                                                                    ? <span className="text-lg">{student.avatar}</span>
                                                                    : <span className="material-icons-round text-slate-400 text-lg">person</span>
                                                                }
                                                            </div>
                                                            <span className="font-semibold group-hover:text-[#3b82f6] transition-colors">{student.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-slate-500 text-xs">{cls?.className || '—'}</td>
                                                    <td className="py-3 text-center">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${stateColor(student.current_state)}`}>
                                                            {student.current_state.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className={`font-bold text-sm ${student.recentEventCount > 0 ? 'text-[#3b82f6]' : 'text-slate-400'}`}>
                                                            {student.recentEventCount}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right text-xs text-slate-500">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <span className={`material-icons-round text-xs ${loadDotColor(student.avg_load)}`}>circle</span>
                                                            {formatLastActive(student.last_active)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-slate-400">No students found in your classes.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Cognitive Load Overview ── */}
                        <div className="col-span-12 xl:col-span-4 bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                            <h2 className="font-bold text-lg mb-6">Cognitive Load Overview</h2>
                            <div className="flex flex-col gap-6 items-center">
                                <div className="relative w-36 h-36 shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path className="stroke-current text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" />
                                        <path className="stroke-current text-emerald-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                                            strokeDasharray={`${(overallDistribution.optimal / (totalStudents || 1)) * 100}, 100`}
                                            strokeLinecap="round" strokeWidth="3" />
                                        <path className="stroke-current text-blue-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                                            strokeDasharray={`${(overallDistribution.low / (totalStudents || 1)) * 100}, 100`}
                                            strokeDashoffset={-((overallDistribution.optimal / (totalStudents || 1)) * 100)}
                                            strokeLinecap="round" strokeWidth="3" />
                                        <path className="stroke-current text-amber-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                                            strokeDasharray={`${(overallDistribution.struggling / (totalStudents || 1)) * 100}, 100`}
                                            strokeDashoffset={-(((overallDistribution.optimal + overallDistribution.low) / (totalStudents || 1)) * 100)}
                                            strokeLinecap="round" strokeWidth="3" />
                                        <path className="stroke-current text-red-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                                            strokeDasharray={`${(overallDistribution.critical / (totalStudents || 1)) * 100}, 100`}
                                            strokeDashoffset={-(((overallDistribution.optimal + overallDistribution.low + overallDistribution.struggling) / (totalStudents || 1)) * 100)}
                                            strokeLinecap="round" strokeWidth="3" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold">{totalStudents}</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Students</span>
                                    </div>
                                </div>
                                <div className="w-full space-y-3">
                                    {[
                                        { label: 'Optimal', count: overallDistribution.optimal, color: 'bg-emerald-400' },
                                        { label: 'Normal', count: overallDistribution.low, color: 'bg-blue-400' },
                                        { label: 'Struggling', count: overallDistribution.struggling, color: 'bg-amber-400' },
                                        { label: 'Critical', count: overallDistribution.critical, color: 'bg-red-400' },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                            <span className="text-slate-500 text-sm flex-1">{item.label}</span>
                                            <span className="font-bold">{item.count}</span>
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${item.color}`}
                                                    style={{ width: `${((item.count / (totalStudents || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Adaptation Type Breakdown ── */}
                        <div className="col-span-12 lg:col-span-6 bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                            <h2 className="font-bold text-lg mb-5">Adaptation State Breakdown</h2>
                            <p className="text-xs text-slate-400 mb-5">Distribution of current adaptation states across all students</p>
                            <div className="space-y-4">
                                {[
                                    { label: 'Calm', key: 'calm', color: 'bg-emerald-400', textColor: 'text-emerald-600 dark:text-emerald-400', desc: 'Normal layout applied' },
                                    { label: 'Mild Stress', key: 'mildstress', color: 'bg-amber-400', textColor: 'text-amber-600 dark:text-amber-400', desc: 'Dyslexic font + read aloud enabled' },
                                    { label: 'High Stress', key: 'highstress', color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400', desc: 'Calming widget shown' },
                                    { label: 'Distracted', key: 'distracted', color: 'bg-blue-400', textColor: 'text-blue-600 dark:text-blue-400', desc: 'Bionic reading + dim inactive' },
                                    { label: 'Disengaged', key: 'disengaged', color: 'bg-purple-400', textColor: 'text-purple-600 dark:text-purple-400', desc: 'Full re-engagement mode' },
                                ].map(item => {
                                    const count = stateCounts[item.key as keyof typeof stateCounts] || 0;
                                    const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                                    return (
                                        <div key={item.key}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                                                    <span className="text-sm font-semibold">{item.label}</span>
                                                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                                                </div>
                                                <span className={`text-sm font-bold ${item.textColor}`}>{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Critical Intervention Queue ── */}
                        <div className="col-span-12 lg:col-span-6 bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-2 mb-5">
                                <h2 className="font-bold text-lg text-red-500">Critical Intervention Queue</h2>
                                <span className="material-icons-round text-red-300 text-lg">warning</span>
                            </div>
                            <div className="space-y-3">
                                {interventionQueue.length > 0 ? interventionQueue.map((student) => (
                                    <div
                                        key={student.participant_id}
                                        className="flex items-center gap-4 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20 hover:shadow-sm transition-all cursor-pointer"
                                        onClick={() => navigate('/student-analysis')}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm border border-red-200 shrink-0">
                                            {student.avatar || <span className="material-icons-round text-slate-400">person</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-red-700 dark:text-red-400 truncate">{student.full_name}</div>
                                            <div className="text-xs text-red-500 font-medium">{student.current_state.replace(/_/g,' ')} · load {student.avg_load.toFixed(1)}</div>
                                        </div>
                                        <div className="text-xs text-slate-400 shrink-0">{formatLastActive(student.last_active)}</div>
                                        <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors shrink-0">
                                            <span className="material-icons-round text-sm">visibility</span>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <span className="material-icons-round text-3xl mb-2 block text-slate-300">check_circle</span>
                                        No students need immediate intervention.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default TeacherDashboard;
