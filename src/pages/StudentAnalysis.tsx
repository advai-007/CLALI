import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentMetricsApi, type ClassMetrics, type StudentDetails } from '../services/studentMetricsApi';
import TeacherSidebar from '../components/TeacherSidebar';
import { useTheme } from '../context/ThemeContext';

// ─── Colors ────────────────────────────────────────────────────────
const STATE_COLORS: Record<string, { bg: string, text: string, dot: string, timeline: string }> = {
    calm: { 
        bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
        text: 'text-emerald-700 dark:text-emerald-400', 
        dot: 'bg-emerald-400',
        timeline: 'bg-emerald-400'
    },
    mildstress: { 
        bg: 'bg-amber-100 dark:bg-amber-900/30', 
        text: 'text-amber-700 dark:text-amber-400', 
        dot: 'bg-amber-400',
        timeline: 'bg-amber-400'
    },
    highstress: { 
        bg: 'bg-rose-100 dark:bg-rose-900/30', 
        text: 'text-rose-700 dark:text-rose-400', 
        dot: 'bg-rose-500',
        timeline: 'bg-rose-500'
    },
    distracted: { 
        bg: 'bg-blue-100 dark:bg-blue-900/30', 
        text: 'text-blue-700 dark:text-blue-400', 
        dot: 'bg-blue-400',
        timeline: 'bg-blue-400'
    },
    disengaged: { 
        bg: 'bg-purple-100 dark:bg-purple-900/30', 
        text: 'text-purple-700 dark:text-purple-400', 
        dot: 'bg-purple-400',
        timeline: 'bg-purple-400'
    },
    success: { 
        bg: 'bg-emerald-500', 
        text: 'text-white', 
        dot: 'bg-emerald-500',
        timeline: 'bg-emerald-500'
    },
    error: { 
        bg: 'bg-rose-500', 
        text: 'text-white', 
        dot: 'bg-rose-500',
        timeline: 'bg-rose-500'
    },
    adaptation: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-400',
        dot: 'bg-indigo-500',
        timeline: 'bg-indigo-500'
    },
    other: { 
        bg: 'bg-slate-100 dark:bg-slate-700', 
        text: 'text-slate-600 dark:text-slate-300', 
        dot: 'bg-slate-400',
        timeline: 'bg-slate-400'
    }
};

// ─── Helpers ───────────────────────────────────────────────────────
function logBadgeStyle(category: string) {
    return STATE_COLORS[category]?.bg + ' ' + STATE_COLORS[category]?.text || 'bg-slate-100 text-slate-600';
}

function logDotColor(category: string) {
    return STATE_COLORS[category]?.dot || 'bg-slate-400';
}

function engagementColor(level: string) {
    if (level === 'High') return 'text-emerald-600 dark:text-emerald-400';
    if (level === 'Medium') return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
}

// ─── Component ─────────────────────────────────────────────────────
const StudentAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Data State
    const [classes, setClasses] = useState<ClassMetrics[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [students, setStudents] = useState<ClassMetrics['students']>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const requestedStudentId = searchParams.get('studentId');
    const requestedClassId = searchParams.get('classId');

    const syncSearchParams = (classId?: string | null, studentId?: string | null) => {
        const nextParams = new URLSearchParams();
        if (classId) nextParams.set('classId', classId);
        if (studentId) nextParams.set('studentId', studentId);
        setSearchParams(nextParams, { replace: true });
    };

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const dashboardData = await studentMetricsApi.getTeacherDashboardData(user.id);
                setClasses(dashboardData);

                if (dashboardData.length === 0) {
                    setSelectedClassId(null);
                    setStudents([]);
                    setSelectedStudentId(null);
                    setStudentDetails(null);
                    syncSearchParams(null, null);
                    return;
                }

                const targetClass =
                    dashboardData.find((cls) => cls.classId === requestedClassId) ??
                    dashboardData.find((cls) =>
                        cls.students.some((student) => student.participant_id === requestedStudentId)
                    ) ??
                    dashboardData[0];

                setSelectedClassId(targetClass.classId);
                setStudents(targetClass.students);

                const targetStudent =
                    targetClass.students.find((student) => student.participant_id === requestedStudentId) ??
                    targetClass.students[0];

                if (!targetStudent) {
                    setSelectedStudentId(null);
                    setStudentDetails(null);
                    syncSearchParams(targetClass.classId, null);
                    return;
                }

                setSelectedStudentId(targetStudent.participant_id);
                syncSearchParams(targetClass.classId, targetStudent.participant_id);
                const details = await studentMetricsApi.getStudentDetails(targetStudent.participant_id);
                setStudentDetails(details);
            } catch (error) {
                console.error('Error fetching student analysis data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [requestedClassId, requestedStudentId, user]);

    const handleClassChange = async (classId: string) => {
        const cls = classes.find(c => c.classId === classId);
        if (cls) {
            setSelectedClassId(classId);
            setStudents(cls.students);
            if (cls.students.length > 0) {
                await handleStudentSelect(cls.students[0].participant_id, classId);
            } else {
                setSelectedStudentId(null);
                setStudentDetails(null);
                syncSearchParams(classId, null);
            }
        }
    };

    const handleStudentSelect = async (studentId: string, classIdOverride?: string) => {
        try {
            const nextClassId = classIdOverride ?? selectedClassId;
            setSelectedStudentId(studentId);
            if (nextClassId) {
                setSelectedClassId(nextClassId);
            }
            setLoading(true);
            syncSearchParams(nextClassId, studentId);
            const details = await studentMetricsApi.getStudentDetails(studentId);
            setStudentDetails(details);
            setIsSearchOpen(false);
            setSearchQuery('');
        } catch (error) {
            console.error('Error fetching student details:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const selectedClass = classes.find(c => c.classId === selectedClassId);
    const hasNoClasses = !loading && classes.length === 0;
    const hasNoStudentsInClass = !loading && !!selectedClassId && students.length === 0;

    if (!user) return null;

    // ── State breakdown bars (real data) ──────────────────────────
    const breakdown = studentDetails?.stats.stateBreakdown;
    const totalBreakdown = breakdown
        ? Object.values(breakdown).reduce((a, b) => a + b, 0)
        : 0;

    const breakdownItems = breakdown ? [
        { key: 'calm',       label: 'Calm',       color: STATE_COLORS.calm.dot, count: breakdown.calm },
        { key: 'mildstress', label: 'Mild Stress', color: STATE_COLORS.mildstress.dot,  count: breakdown.mildstress },
        { key: 'highstress', label: 'High Stress', color: STATE_COLORS.highstress.dot,    count: breakdown.highstress },
        { key: 'distracted', label: 'Distracted',  color: STATE_COLORS.distracted.dot,   count: breakdown.distracted },
        { key: 'disengaged', label: 'Disengaged',  color: STATE_COLORS.disengaged.dot, count: breakdown.disengaged },
    ] : [];

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 min-h-screen">
            <div className="flex h-screen overflow-hidden">
                {/* ── Sidebar ── */}
                <TeacherSidebar />

                <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background-dark/50 p-4 md:p-8">
                    {/* ── Header ── */}
                    <header className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-40 rounded-2xl mb-6 md:mb-8 shadow-sm gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto w-full md:w-auto no-scrollbar">
                                {classes.map(cls => (
                                    <button
                                        key={cls.classId}
                                        onClick={() => handleClassChange(cls.classId)}
                                        className={`px-3 md:px-4 py-1.5 text-[11px] md:text-xs font-semibold rounded-md transition-all whitespace-nowrap ${selectedClassId === cls.classId
                                            ? 'bg-white dark:bg-slate-700 shadow-sm text-[#3b82f6]'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                    >
                                        {cls.className}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end">
                            {/* Student Search */}
                            <div className="relative flex-1 md:flex-none">
                                <div className={`flex items-center bg-transparent border-2 ${isSearchOpen ? 'border-[#3b82f6]' : 'border-transparent'} rounded-[20px] px-3 py-1.5 w-full md:w-64 transition-all z-50 relative bg-white dark:bg-card-dark ${!isSearchOpen && 'hover:bg-slate-50 dark:hover:bg-slate-800'} ${searchQuery || isSearchOpen ? 'shadow-sm' : ''}`}>
                                    <span className={`material-icons-round text-lg mr-2 ${isSearchOpen ? 'text-[#3b82f6]' : 'text-slate-400'}`}>search</span>
                                    <input
                                        className="bg-transparent border-none outline-none w-full text-sm dark:text-white placeholder-slate-400"
                                        placeholder="Search student..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchOpen(true)}
                                        onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                                    />
                                </div>
                                {isSearchOpen && (
                                    <div className="absolute top-full right-0 md:left-0 mt-2 w-[280px] md:w-[340px] bg-white dark:bg-card-dark rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden z-[100]">
                                        <div className="p-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Matching Students</div>
                                            <div className="space-y-1">
                                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                                    <div
                                                        key={student.participant_id}
                                                        onClick={() => handleStudentSelect(student.participant_id)}
                                                        className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors border ${selectedStudentId === student.participant_id
                                                            ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'}`}
                                                    >
                                                        <div className="relative shrink-0">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl overflow-hidden">
                                                                {student.avatar
                                                                    ? <span>{student.avatar}</span>
                                                                    : <span className="material-icons-round text-slate-400">person</span>
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-800 dark:text-white">{student.full_name}</div>
                                                            <div className="text-[11px] text-[#3b82f6] font-medium">{selectedClass?.className || 'Student'}</div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="p-4 text-center text-xs text-slate-400">No students found</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200 dark:border-slate-800">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-bold dark:text-white">{user.user_metadata?.full_name || 'Teacher'}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{user.user_metadata?.role || 'Educator'}</div>
                                </div>
                                <img alt="Avatar" className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                                    src={user.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Teacher'}`} />
                            </div>
                        </div>
                    </header>

                    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
                            </div>
                        ) : studentDetails ? (
                            <>
                                {/* ── Stats Cards ── */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                    {[
                                        {
                                            label: 'Total Sessions',
                                            value: studentDetails.stats.totalSessions,
                                            unit: '',
                                            icon: 'schedule',
                                            color: 'blue',
                                            sub: studentDetails.stats.recentActivity ? 'Active today' : 'No recent activity',
                                            subColor: studentDetails.stats.recentActivity ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400',
                                        },
                                        {
                                            label: 'Avg. Duration',
                                            value: studentDetails.stats.avgDuration,
                                            unit: 'min',
                                            icon: 'timer',
                                            color: 'emerald',
                                            sub: 'Target: 20 min',
                                            subColor: 'text-slate-500 dark:text-slate-400',
                                        },
                                        {
                                            label: 'Success / Error',
                                            value: `${studentDetails.stats.successCount} / ${studentDetails.stats.errorCount}`,
                                            unit: '',
                                            icon: 'sports_score',
                                            color: 'amber',
                                            sub: `${studentDetails.stats.difficultyElevated}% in elevated state`,
                                            subColor: 'text-slate-500 dark:text-slate-400',
                                        },
                                        {
                                            label: 'Adaptations',
                                            value: studentDetails.stats.adaptationCount,
                                            unit: '',
                                            icon: 'auto_fix_high',
                                            color: 'purple',
                                            sub: 'Dynamic support',
                                            subColor: 'text-emerald-600 dark:text-emerald-400',
                                        },
                                    ].map(card => (
                                        <div key={card.label} className={`p-4 md:p-5 rounded-2xl border shadow-sm group hover:-translate-y-1 hover:shadow-md transition-all duration-300
                                            ${card.color === 'blue' ? 'bg-blue-50/80 dark:bg-blue-900/10 border-blue-100/50 dark:border-blue-800/30' : ''}
                                            ${card.color === 'emerald' ? 'bg-emerald-50/80 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-800/30' : ''}
                                            ${card.color === 'amber' ? 'bg-amber-50/80 dark:bg-amber-900/10 border-amber-100/50 dark:border-amber-800/30' : ''}
                                            ${card.color === 'purple' ? 'bg-purple-50/80 dark:bg-purple-900/10 border-purple-100/50 dark:border-purple-800/30' : ''}
                                        `}>
                                            <div className="flex justify-between items-start mb-3 md:mb-4">
                                                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</span>
                                                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform
                                                    ${card.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
                                                    ${card.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : ''}
                                                    ${card.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : ''}
                                                    ${card.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''}
                                                `}>
                                                    <span className="material-icons-round text-lg md:text-xl">{card.icon}</span>
                                                </div>
                                            </div>
                                            <div className="text-xl md:text-2xl font-bold mb-1 dark:text-white">
                                                {card.value}{card.unit && <span className="text-xs md:text-sm font-medium text-slate-500 ml-1">{card.unit}</span>}
                                            </div>
                                            <div className={`text-[9px] md:text-[10px] font-bold ${card.subColor}`}>{card.sub}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                                        {/* ── Analysis Panel ── */}
                                        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
                                            <div className="p-5 md:p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                                <div>
                                                    <h2 className="text-lg md:text-xl font-bold dark:text-white">Analysis: {studentDetails.student.full_name}</h2>
                                                    <p className="text-[11px] md:text-xs text-slate-400 font-medium mt-1">Real-time Adaptation Events · {studentDetails.stats.totalSessions} Sessions Total</p>
                                                </div>
                                            </div>
                                            <div className="p-5 md:p-6">
                                                {/* Quick stat widgets */}
                                                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] transition-all duration-300">
                                                        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Event</div>
                                                        <div className="text-sm md:text-lg font-bold truncate dark:text-white">{studentDetails.logs[0]?.type?.replace(/_/g,' ') || 'N/A'}</div>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] transition-all duration-300">
                                                        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">State Efficiency</div>
                                                        <div className={`text-sm md:text-lg font-bold ${studentDetails.stats.adaptationCount > 5 ? 'text-[#3b82f6]' : 'text-emerald-500'}`}>
                                                            {studentDetails.stats.adaptationCount > 5 ? 'Adaptive' : 'Optimal'}
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] transition-all duration-300">
                                                        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Engagement</div>
                                                        <div className={`text-sm md:text-lg font-bold ${engagementColor(studentDetails.stats.engagementLevel)}`}>
                                                            {studentDetails.stats.engagementLevel}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Interaction Timeline */}
                                                <div className="mb-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                                                    <h3 className="text-xs md:text-sm font-bold dark:text-slate-200">Session Evolution (Latest 20 Events)</h3>
                                                    <div className="flex flex-wrap items-center justify-center gap-3 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">
                                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Calm</div>
                                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Stress</div>
                                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> High</div>
                                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Adapt</div>
                                                    </div>
                                                </div>
                                                <div className="h-12 md:h-14 flex rounded-xl overflow-hidden mb-2 shadow-inner border border-slate-100 dark:border-slate-800">
                                                    {studentDetails.logs.slice(0, 20).reverse().map((log) => {
                                                        let color = STATE_COLORS[log.stateCategory]?.timeline || STATE_COLORS.other.timeline;
                                                        
                                                        if (log.description !== 'State update' && 
                                                           (log.stateCategory === 'calm' || log.stateCategory === 'other' || log.stateCategory === 'distracted')) {
                                                            color = STATE_COLORS.adaptation.timeline;
                                                        }

                                                        return (
                                                            <div
                                                                key={log.id}
                                                                className={`h-full flex-1 border-r border-white/10 dark:border-black/10 ${color}`}
                                                                title={`${log.time}: ${log.type}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-300 dark:text-slate-500 px-1 uppercase tracking-tighter">
                                                    <span>Earliest</span>
                                                    <span>Progression Map</span>
                                                    <span>Latest</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── State Distribution (Real Data) ── */}
                                        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 md:p-6 hover:shadow-lg transition-all duration-300">
                                            <h2 className="text-base md:text-lg font-bold mb-5 md:mb-6 dark:text-white">Adaptation State Prevalence</h2>
                                            {totalBreakdown > 0 ? (
                                                <div className="space-y-4">
                                                    {breakdownItems.map(item => {
                                                        const pct = Math.round((item.count / totalBreakdown) * 100);
                                                        return (
                                                            <div key={item.key}>
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                                                        <span className="text-[13px] md:text-sm font-semibold dark:text-slate-300">{item.label}</span>
                                                                    </div>
                                                                    <span className="text-[13px] md:text-sm font-bold dark:text-white">{item.count} <span className="text-[10px] md:text-xs text-slate-400 font-normal">({pct}%)</span></span>
                                                                </div>
                                                                <div className="w-full h-1.5 md:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${item.color} transition-all duration-700`}
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                                                    No biometric data points recorded for this student.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Adaptation Log ── */}
                                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px] lg:h-full lg:max-h-[calc(100vh-12rem)]">
                                        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                            <h2 className="text-base md:text-lg font-bold dark:text-white">Recent Log</h2>
                                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#3b82f6] text-[9px] md:text-[10px] font-bold rounded uppercase tracking-wider">Live</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-3 md:px-4 pb-4 pt-2 no-scrollbar">
                                            <div className="flex px-3 py-2 mb-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-white/95 dark:bg-card-dark/95 backdrop-blur-sm z-10 rounded-lg">
                                                <div className="w-16 md:w-20 shrink-0">Time</div>
                                                <div>Event & Action</div>
                                            </div>
                                            <div className="space-y-2">
                                                {studentDetails.logs.length > 0 ? studentDetails.logs.map((log) => (
                                                    <div
                                                        key={log.id}
                                                        className={`flex rounded-xl p-3 shadow-sm border transition-all group
                                                            ${log.isCritical
                                                                ? 'bg-rose-50/50 dark:bg-rose-900/20 border-rose-200/50 dark:border-rose-700/50'
                                                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <div className="w-16 md:w-20 shrink-0">
                                                            <div className={`text-[11px] md:text-xs font-bold ${log.isCritical ? 'text-rose-600 dark:text-rose-400' : 'dark:text-slate-300'}`}>{log.time}</div>
                                                            <div className="text-[8px] md:text-[9px] text-slate-400 uppercase">{log.ampm}</div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${logDotColor(log.stateCategory)}`}></div>
                                                                <span className={`text-[11px] md:text-xs font-bold truncate ${log.isCritical ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-100 group-hover:text-[#3b82f6]'} transition-colors`}>
                                                                    {log.type.replace(/_/g, ' ')}
                                                                </span>
                                                            </div>
                                                            {log.description !== 'State update' && (
                                                                <span className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-bold ${logBadgeStyle(log.stateCategory)}`}>
                                                                    {log.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="p-8 text-center text-xs text-slate-400">No interaction events logged yet</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                            <button className="w-full py-2.5 text-xs font-bold text-[#3b82f6] hover:bg-[#3b82f6]/5 dark:hover:bg-[#3b82f6]/10 rounded-xl transition-colors border border-[#3b82f6]/20">
                                                Export Analysis
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : hasNoClasses ? (
                            <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-card-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <span className="material-icons-round text-4xl text-slate-300 mb-4">school</span>
                                <p className="text-slate-600 dark:text-slate-300 font-medium">No class data available yet</p>
                                <p className="text-sm text-slate-400 mt-2">Classes will appear here once created.</p>
                            </div>
                        ) : hasNoStudentsInClass ? (
                            <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-card-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <span className="material-icons-round text-4xl text-slate-300 mb-4">group_off</span>
                                <p className="text-slate-600 dark:text-slate-300 font-medium">No students in this class</p>
                                <p className="text-sm text-slate-400 mt-2">Add students to begin monitoring.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-card-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <span className="material-icons-round text-4xl text-slate-300 mb-4">person_search</span>
                                <p className="text-slate-500 font-medium">Select a student</p>
                                <p className="text-sm text-slate-400 mt-2">Pick a student to view detailed biometric analysis.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentAnalysis;
