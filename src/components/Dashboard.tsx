import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Flame, LogOut, Play, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentMetricsApi, type StudentDashboardSummary } from '../services/studentMetricsApi';
import { featureExtractor } from '../utils/tracking/FeatureExtractor';
import { sensorBridge } from '../utils/tracking/SensorBridge';

type DashboardViewport = {
    compact: boolean;
    tight: boolean;
};

type StatCardData = {
    icon: ComponentType<{ size?: number; className?: string }>;
    value: string;
    label: string;
    detail: string;
    color: keyof typeof STAT_COLOR_CLASSES;
    bgColor: string;
};

function getDashboardViewport(): DashboardViewport {
    if (typeof window === 'undefined') {
        return { compact: false, tight: false };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
        // Keep the full dashboard treatment on typical laptop screens.
        compact: width < 980 || height < 680,
        // Only switch to the tight layout on genuinely constrained screens.
        tight: width < 760 || height < 620,
    };
}

const Dashboard = () => {
    const navigate = useNavigate();
    const { studentUser, studentSignOut } = useAuth();
    const displayName = studentUser?.full_name || 'Explorer';
    const [dashboardSummary, setDashboardSummary] = useState<StudentDashboardSummary | null>(null);
    const [viewport, setViewport] = useState<DashboardViewport>(() => getDashboardViewport());

    useEffect(() => {
        sensorBridge.start();
        featureExtractor.start();

        return () => {
            sensorBridge.stop();
            featureExtractor.stop();
        };
    }, []);

    useEffect(() => {
        const updateViewport = () => {
            setViewport(getDashboardViewport());
        };

        updateViewport();
        window.addEventListener('resize', updateViewport);

        return () => {
            window.removeEventListener('resize', updateViewport);
        };
    }, []);

    useEffect(() => {
        if (!studentUser?.id) {
            setDashboardSummary(null);
            return;
        }

        let isActive = true;

        studentMetricsApi
            .getStudentDashboardSummary(studentUser.id)
            .then((summary) => {
                if (isActive) {
                    setDashboardSummary(summary);
                }
            })
            .catch((error) => {
                console.error('Error fetching student dashboard summary:', error);
            });

        return () => {
            isActive = false;
        };
    }, [studentUser?.id]);

    const statCards = buildStatCards(dashboardSummary);

    return (
        <div className="min-h-[100dvh] h-[100dvh] overflow-hidden text-text-dark font-lexend transition-colors duration-300">
            <div className="h-full max-w-6xl mx-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 relative flex flex-col">
                <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] bg-mint-soft/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 z-0 pointer-events-none" />

                <header className={`relative z-10 flex items-center justify-between ${viewport.tight ? 'mb-3' : 'mb-4 lg:mb-5'}`}>
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="group relative cursor-pointer"
                    >
                        <div className={`${viewport.tight ? 'w-11 h-11' : 'w-12 h-12 sm:w-14 sm:h-14'} rounded-full border-4 border-white shadow-sm overflow-hidden bg-primary/30 flex items-center justify-center`}>
                            {studentUser?.avatar ? (
                                <span className={`${viewport.tight ? 'text-2xl' : 'text-3xl'}`}>{studentUser.avatar}</span>
                            ) : (
                                <img
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                    alt="User Avatar"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </motion.button>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`${viewport.tight ? 'size-8' : 'size-9 sm:size-10'} bg-white rounded-full flex items-center justify-center overflow-hidden border border-white shadow-sm`}>
                            <img src="/logo.png" alt="CLALI Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className={`${viewport.tight ? 'text-lg tracking-[0.25em]' : 'text-xl sm:text-2xl tracking-[0.35em]'} font-black text-slate-400 uppercase`}>
                            Clali
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {studentUser && (
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => {
                                    studentSignOut();
                                    navigate('/student-login');
                                }}
                                className={`${viewport.tight ? 'w-10 h-10' : 'w-11 h-11 sm:w-12 sm:h-12'} flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-colors cursor-pointer`}
                                title="Sign Out"
                            >
                                <LogOut size={viewport.tight ? 18 : 20} />
                            </motion.button>
                        )}
                    </div>
                </header>

                <main className={`relative z-10 flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-12 ${viewport.tight ? 'gap-3' : 'gap-4 lg:gap-5'}`}>
                    <section className="col-span-2 lg:col-span-4 min-h-0">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-[2rem] shadow-card h-full relative z-0 flex ${viewport.compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 lg:p-7'} overflow-hidden ${viewport.tight ? 'gap-3' : 'gap-4 lg:gap-5'} items-center justify-between`}
                        >
                            <div className="flex-1 min-w-0">
                                <h2 className={`${viewport.tight ? 'text-2xl' : viewport.compact ? 'text-[2.2rem] sm:text-[2.6rem]' : 'text-3xl sm:text-4xl'} font-black text-slate-700 tracking-tight leading-none mb-2`}>
                                    Hi {displayName}!
                                </h2>
                                <p className={`${viewport.tight ? 'text-sm' : viewport.compact ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} text-slate-500 font-medium`}>
                                    Ready to play and learn?
                                </p>

                                <div className={`mt-3 inline-flex items-center gap-2 ${viewport.tight ? 'px-3 py-1.5 text-xs' : viewport.compact ? 'px-4 py-2 text-base' : 'px-4 py-2 text-sm'} bg-yellow-soft rounded-full shadow-sm border border-yellow-200`}>
                                    <span className="font-bold text-amber-800 tracking-wide">Ready for today</span>
                                </div>
                            </div>

                            {!viewport.tight && (
                                <div className={`${viewport.compact ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-24 h-24 lg:w-28 lg:h-28'} flex-shrink-0 animate-float`}>
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
                                        alt="Mascot"
                                        className="w-full h-full object-contain drop-shadow-xl"
                                    />
                                </div>
                            )}
                        </motion.div>
                    </section>

                    <section className="col-span-2 lg:col-span-8 min-h-0">
                        <ActivityCard
                            title="The Broken Storybook"
                            subtitle="Adaptive story adventure"
                            iconName="auto_stories"
                            background="linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)"
                            accentLeft="BOOK"
                            accentRight="OWL"
                            onClick={() => navigate('/story-demo')}
                            compact={viewport.compact}
                            tight={viewport.tight}
                            fullWidth
                        />
                    </section>

                    <section className="col-span-1 lg:col-span-4 min-h-0">
                        <ActivityCard
                            title="Workshop"
                            subtitle="Fix, build and balance"
                            iconName="engineering"
                            background="linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #4338CA 100%)"
                            accentLeft="GEAR"
                            accentRight="TOOLS"
                            onClick={() => navigate('/workshop')}
                            compact={viewport.compact}
                            tight={viewport.tight}
                        />
                    </section>

                    <section className="col-span-1 lg:col-span-4 min-h-0">
                        <ActivityCard
                            title="Word Factory"
                            subtitle="Build words together"
                            iconName="sort_by_alpha"
                            background="linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)"
                            accentLeft="A"
                            accentRight="B"
                            onClick={() => navigate('/word-factory')}
                            compact={viewport.compact}
                            tight={viewport.tight}
                        />
                    </section>

                    <section className="col-span-2 lg:col-span-4 min-h-0">
                        <div className={`bg-white/80 backdrop-blur-md rounded-[2rem] shadow-card border border-white/60 h-full ${viewport.tight ? 'p-3' : 'p-4 sm:p-5'}`}>
                            <h3 className="sr-only">Your Progress</h3>
                            <div className="grid grid-cols-3 gap-3 h-full">
                                {statCards.map((stat) => (
                                    <StatItem
                                        key={stat.label}
                                        icon={stat.icon}
                                        value={stat.value}
                                        label={stat.label}
                                        detail={stat.detail}
                                        color={stat.color}
                                        bgColor={stat.bgColor}
                                        tight={viewport.tight}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

interface ActivityCardProps {
    title: string;
    subtitle: string;
    iconName: string;
    background: string;
    accentLeft: string;
    accentRight: string;
    onClick: () => void;
    compact: boolean;
    tight: boolean;
    fullWidth?: boolean;
}

const ActivityCard = ({
    title,
    subtitle,
    iconName,
    background,
    accentLeft,
    accentRight,
    onClick,
    compact,
    tight,
    fullWidth = false,
}: ActivityCardProps) => (
    <motion.button
        whileHover={{ scale: 1.015, y: -3 }}
        whileTap={{ scale: 0.985 }}
        onClick={onClick}
        className={`group relative w-full h-full rounded-[2rem] overflow-hidden shadow-card cursor-pointer flex items-center justify-between ${tight ? 'p-3' : compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 lg:p-7'} ${fullWidth ? '' : 'min-h-[8.5rem] sm:min-h-[9.5rem]'}`}
        style={{ background }}
    >
        <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-transparent pointer-events-none" />

        {!tight && (
            <>
                <div className={`absolute ${fullWidth ? 'top-4 right-24' : 'top-3 right-16'} opacity-10 pointer-events-none rotate-12`}>
                    <span className="font-black text-white text-4xl sm:text-5xl tracking-tight">{accentLeft}</span>
                </div>
                <div className={`absolute ${fullWidth ? 'bottom-3 right-44' : 'bottom-2 right-28'} opacity-10 pointer-events-none -rotate-12`}>
                    <span className="font-black text-white text-3xl sm:text-4xl tracking-tight">{accentRight}</span>
                </div>
            </>
        )}

        <div className="relative z-10 text-left flex flex-col justify-center min-w-0 max-w-[62%]">
            <h3 className={`${tight ? 'text-lg' : fullWidth ? compact ? 'text-[2rem] sm:text-[2.35rem]' : 'text-2xl sm:text-3xl' : compact ? 'text-[1.75rem] sm:text-[2.15rem]' : 'text-lg sm:text-2xl'} font-black text-white leading-tight`}>
                {title}
            </h3>
            <p className={`${tight ? 'text-xs mt-1' : compact ? 'text-base sm:text-lg mt-1.5' : 'text-sm sm:text-base mt-1.5'} font-bold text-white/75`}>
                {subtitle}
            </p>
        </div>

        <div className="relative z-10 flex items-center justify-center shrink-0">
            <div
                className={`${tight ? 'w-14 h-14' : compact ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-20 h-20 lg:w-24 lg:h-24'} rounded-full flex items-center justify-center`}
                style={{ background: 'rgba(255,255,255,0.15)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)' }}
            >
                <span
                    className={`${tight ? 'text-3xl' : compact ? 'text-4xl sm:text-5xl' : 'text-5xl'} material-symbols-outlined text-white drop-shadow-lg`}
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                >
                    {iconName}
                </span>
            </div>
        </div>

        <div className={`${tight ? 'right-3 bottom-3 w-9 h-9' : 'right-4 bottom-4 w-10 h-10 sm:w-11 sm:h-11'} absolute rounded-full bg-white/20 flex items-center justify-center shadow-md group-hover:bg-white/30 transition-colors backdrop-blur-sm`}>
            <Play className="text-white ml-0.5" size={tight ? 18 : 20} fill="currentColor" />
        </div>
    </motion.button>
);

interface StatItemProps {
    icon: ComponentType<{ size?: number; className?: string }>;
    value: string;
    label: string;
    detail: string;
    color: keyof typeof STAT_COLOR_CLASSES;
    bgColor: string;
    tight: boolean;
}

const StatItem = ({ icon: Icon, value, label, detail, color, bgColor, tight }: StatItemProps) => (
    <motion.div
        whileHover={{ y: -3 }}
        className={`flex h-full flex-col items-center justify-center bg-white/75 border border-white/60 rounded-[1.5rem] text-center ${tight ? 'px-2 py-3' : 'px-3 py-4'}`}
    >
        <div className={`${tight ? 'w-10 h-10 mb-2' : 'w-11 h-11 sm:w-12 sm:h-12 mb-2.5'} relative flex items-center justify-center ${bgColor} rounded-2xl shadow-inner-light`}>
            <Icon size={tight ? 20 : 22} className={STAT_COLOR_CLASSES[color].icon} />
        </div>
        <span className={`${tight ? 'text-lg' : 'text-2xl sm:text-3xl'} font-black ${STAT_COLOR_CLASSES[color].value}`}>{value}</span>
        <span className={`${tight ? 'text-[10px]' : 'text-xs sm:text-sm'} font-bold text-slate-500 uppercase tracking-wide`}>
            {label}
        </span>
        <p className={`${tight ? 'hidden' : 'mt-1.5 text-xs sm:text-sm'} font-medium text-slate-500 leading-tight`}>
            {detail}
        </p>
    </motion.div>
);

const STAT_COLOR_CLASSES = {
    emerald: { icon: 'text-emerald-600', value: 'text-emerald-700' },
    orange: { icon: 'text-orange-600', value: 'text-orange-700' },
    sky: { icon: 'text-sky-600', value: 'text-sky-700' },
};

function buildStatCards(summary: StudentDashboardSummary | null): StatCardData[] {
    if (!summary) {
        return [
            {
                icon: Flame,
                value: '--',
                label: 'Streak',
                detail: 'Loading activity',
                color: 'orange',
                bgColor: 'bg-orange-100',
            },
            {
                icon: BookOpen,
                value: '--',
                label: 'Sessions',
                detail: 'Checking play history',
                color: 'emerald',
                bgColor: 'bg-mint-soft',
            },
            {
                icon: Target,
                value: '--',
                label: 'Progress',
                detail: 'Fetching results',
                color: 'sky',
                bgColor: 'bg-sky-soft',
            },
        ];
    }

    const streakLabel = summary.currentStreak === 1 ? 'day running' : 'days running';
    const sessionDetail = summary.completedActivities > 0
        ? `${summary.completedActivities} completed activities`
        : formatRelativeTime(summary.lastActive)
            ? `Last active ${formatRelativeTime(summary.lastActive)}`
            : 'Ready for a first session';

    return [
        {
            icon: Flame,
            value: String(summary.currentStreak),
            label: 'Streak',
            detail: summary.currentStreak > 0 ? `${summary.currentStreak} ${streakLabel}` : 'Start a new streak today',
            color: 'orange',
            bgColor: 'bg-orange-100',
        },
        {
            icon: BookOpen,
            value: String(summary.sessionsPlayed),
            label: 'Sessions',
            detail: sessionDetail,
            color: 'emerald',
            bgColor: 'bg-mint-soft',
        },
        summary.averageScore !== null
            ? {
                icon: Target,
                value: `${summary.averageScore}%`,
                label: 'Score',
                detail: `${summary.completedActivities} scored activities`,
                color: 'sky',
                bgColor: 'bg-sky-soft',
            }
            : {
                icon: Target,
                value: String(summary.successCount),
                label: 'Wins',
                detail: summary.successCount > 0
                    ? `${summary.successCount} great moments so far`
                    : formatStateLabel(summary.currentState),
                color: 'sky',
                bgColor: 'bg-sky-soft',
            },
    ];
}

function formatRelativeTime(dateValue: string | null): string | null {
    if (!dateValue) return null;

    const diffMs = Date.now() - new Date(dateValue).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

function formatStateLabel(state: string): string {
    return state
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default Dashboard;
