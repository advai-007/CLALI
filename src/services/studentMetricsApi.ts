import { supabase } from '../utils/supabase';

export interface StudentMetric {
    participant_id: string;
    full_name: string;
    avatar: string | null;
    current_state: string;
    avg_load: number;
    last_active: string;
    recentEventCount: number;
}

export interface ClassMetrics {
    classId: string;
    className: string;
    studentCount: number;
    avgLoad: number;
    recentEventCount: number;
    distribution: {
        optimal: number;
        low: number;
        struggling: number;
        critical: number;
    };
    students: StudentMetric[];
}

export interface StudentDetails {
    student: {
        id: string;
        full_name: string | null;
        avatar: string | null;
        class_id: string | null;
    };
    stats: {
        totalSessions: number;
        avgDuration: number;
        adaptationCount: number;
        difficultyElevated: number;
        successCount: number;
        errorCount: number;
        engagementLevel: 'High' | 'Medium' | 'Low';
        recentActivity: boolean;
        stateBreakdown: {
            calm: number;
            mildstress: number;
            highstress: number;
            distracted: number;
            disengaged: number;
        };
    };
    logs: {
        id: string;
        time: string;
        ampm: string;
        type: string;
        description: string;
        isCritical: boolean;
        stateCategory: 'calm' | 'mildstress' | 'highstress' | 'distracted' | 'disengaged' | 'success' | 'error' | 'other';
    }[];
}

export interface StudentDashboardSummary {
    currentStreak: number;
    sessionsPlayed: number;
    completedActivities: number;
    averageScore: number | null;
    successCount: number;
    lastActive: string | null;
    currentState: string;
}

/** Map a trigger_state string to a numeric cognitive load score */
function stateToLoad(state: string): number {
    const s = state.toLowerCase();
    if (s === 'calm' || s === 'normal_layout') return 1.0;
    if (s === 'success') return 2.0;
    if (s === 'mildstress') return 4.0;
    if (s === 'distracted') return 5.0;
    if (s === 'highstress') return 7.5;
    if (s === 'disengaged') return 8.0;
    if (s === 'error') return 6.0;
    return 3.0; // default / unknown
}

/** Classify a trigger_state string into a display category */
function categorizeState(state: string): 'calm' | 'mildstress' | 'highstress' | 'distracted' | 'disengaged' | 'success' | 'error' | 'other' {
    const s = state.toLowerCase();
    if (s === 'calm' || s === 'normal_layout') return 'calm';
    if (s === 'success') return 'success';
    if (s === 'error') return 'error';
    if (s === 'mildstress') return 'mildstress';
    if (s === 'highstress') return 'highstress';
    if (s === 'distracted') return 'distracted';
    if (s === 'disengaged') return 'disengaged';
    
    // Fallbacks
    if (s.includes('high') && s.includes('stress')) return 'highstress';
    if (s.includes('stress')) return 'mildstress';
    if (s.includes('distract')) return 'distracted';
    if (s.includes('disengage')) return 'disengaged';
    
    return 'other';
}

function dateKeyFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function dateKey(dateValue: string): string {
    return dateKeyFromDate(new Date(dateValue));
}

function calculateCurrentStreak(dateValues: string[]): number {
    if (dateValues.length === 0) return 0;

    const uniqueDays = Array.from(new Set(dateValues.map(dateKey)))
        .sort((a, b) => b.localeCompare(a));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mostRecent = new Date(`${uniqueDays[0]}T00:00:00`);
    const daysSinceMostRecent = Math.round((today.getTime() - mostRecent.getTime()) / 86400000);

    if (daysSinceMostRecent > 1) {
        return 0;
    }

    let streak = 0;
    let expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - daysSinceMostRecent);

    for (const day of uniqueDays) {
        const expectedKey = dateKeyFromDate(expectedDate);
        if (day !== expectedKey) {
            break;
        }

        streak += 1;
        expectedDate.setDate(expectedDate.getDate() - 1);
    }

    return streak;
}

export const studentMetricsApi = {
    /**
     * Log a student adaptation event to Supabase.
     * sessionId should be passed by the caller (stable per game session).
     */
    async logAdaptationEvent(
        userId: string,
        triggerState: string,
        actionTaken: string,
        sessionId?: string
    ) {
        try {
            const { error } = await supabase
                .from('adaptation_events')
                .insert({
                    user_id: userId,
                    session_id: sessionId ?? `session_${Date.now()}`,
                    trigger_state: triggerState,
                    action_taken: actionTaken
                });
            if (error) throw error;
        } catch (err) {
            console.error('Error logging adaptation event:', err);
        }
    },

    /**
     * Fetch aggregated metrics for all classes of a teacher.
     * Includes recentEventCount (events in the last 24h) per class.
     */
    async getTeacherDashboardData(teacherId: string): Promise<ClassMetrics[]> {
        // 1. Get all classes for this teacher
        const { data: classes, error: classError } = await supabase
            .from('classes')
            .select('id, name')
            .eq('teacher_id', teacherId);

        if (classError) throw classError;
        if (!classes || classes.length === 0) return [];

        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 2. For each class, build metrics
        const dashboardData = await Promise.all(classes.map(async (cls) => {
            // Get all students in this class
            const { data: students, error: studentError } = await supabase
                .from('users')
                .select('id, full_name, avatar')
                .eq('class_id', cls.id)
                .eq('role', 'student');

            if (studentError) throw studentError;
            if (!students) return null;

            // Get student metrics (latest event + recent event count)
            const studentMetrics: StudentMetric[] = await Promise.all(students.map(async (student) => {
                const { data: latestEvent } = await supabase
                    .from('adaptation_events')
                    .select('trigger_state, created_at')
                    .eq('user_id', student.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                let recentCount = 0;
                try {
                    const { count, error: recentCountError } = await supabase
                        .from('adaptation_events')
                        .select('id', { count: 'exact' })
                        .eq('user_id', student.id)
                        .gte('created_at', since24h)
                        .limit(1);

                    if (recentCountError) throw recentCountError;
                    recentCount = count ?? 0;
                } catch (err) {
                    console.warn(`Failed to fetch recent adaptation count for student ${student.id}:`, err);
                }

                const state = latestEvent?.trigger_state || 'CALM';
                const load = stateToLoad(state);

                return {
                    participant_id: student.id,
                    full_name: student.full_name || 'Unknown',
                    avatar: student.avatar,
                    current_state: state,
                    avg_load: load,
                    last_active: latestEvent?.created_at || 'Never',
                    recentEventCount: recentCount ?? 0,
                };
            }));

            const studentCount = students.length;
            const avgLoad = studentMetrics.length > 0
                ? studentMetrics.reduce((acc, s) => acc + s.avg_load, 0) / studentMetrics.length
                : 0;
            const totalRecentEvents = studentMetrics.reduce((acc, s) => acc + s.recentEventCount, 0);

            const distribution = {
                optimal: studentMetrics.filter(s => s.avg_load <= 2).length,
                low: studentMetrics.filter(s => s.avg_load > 2 && s.avg_load <= 4).length,
                struggling: studentMetrics.filter(s => s.avg_load > 4 && s.avg_load <= 6).length,
                critical: studentMetrics.filter(s => s.avg_load > 6).length,
            };

            return {
                classId: cls.id,
                className: cls.name,
                studentCount,
                avgLoad: Number(avgLoad.toFixed(1)),
                recentEventCount: totalRecentEvents,
                distribution,
                students: studentMetrics,
            };
        }));

        return dashboardData.filter((d): d is ClassMetrics => d !== null);
    },

    async getStudentDashboardSummary(studentId: string): Promise<StudentDashboardSummary> {
        const [{ data: progress, error: progressError }, { data: events, error: eventError }] = await Promise.all([
            supabase
                .from('learning_progress')
                .select('session_id, completed_at, score, total_questions')
                .eq('student_id', studentId)
                .order('completed_at', { ascending: false }),
            supabase
                .from('adaptation_events')
                .select('session_id, created_at, trigger_state, action_taken')
                .eq('user_id', studentId)
                .order('created_at', { ascending: false }),
        ]);

        if (progressError) throw progressError;
        if (eventError) throw eventError;

        const progressRows = progress || [];
        const eventRows = events || [];

        const sessionIds = new Set<string>();
        progressRows.forEach((row) => sessionIds.add(row.session_id));
        eventRows.forEach((row) => sessionIds.add(row.session_id));

        const activityDates = [
            ...progressRows.map((row) => row.completed_at).filter((value): value is string => Boolean(value)),
            ...eventRows.map((row) => row.created_at),
        ];

        const scoredActivities = progressRows.filter((row) => row.total_questions > 0);
        const averageScore = scoredActivities.length > 0
            ? Math.round(
                scoredActivities.reduce((total, row) => total + (row.score / row.total_questions) * 100, 0) /
                scoredActivities.length
            )
            : null;
        const latestProgressAt = progressRows.find((row) => row.completed_at)?.completed_at ?? null;

        const successCount = eventRows.filter((row) => row.trigger_state === 'SUCCESS').length;

        return {
            currentStreak: calculateCurrentStreak(activityDates),
            sessionsPlayed: sessionIds.size,
            completedActivities: progressRows.length,
            averageScore,
            successCount,
            lastActive: eventRows[0]?.created_at ?? latestProgressAt,
            currentState: eventRows[0]?.trigger_state ?? 'CALM',
        };
    },

    /**
     * Fetch detailed logs and history for a specific student.
     * Returns richer stats including stateBreakdown, successCount, errorCount.
     */
    async getStudentDetails(studentId: string): Promise<StudentDetails> {
        // 1. Get student basic info
        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('id, full_name, avatar, class_id')
            .eq('id', studentId)
            .single();

        if (studentError) throw studentError;

        // 2. Get all adaptation events for this student
        const { data: events, error: eventError } = await supabase
            .from('adaptation_events')
            .select('*')
            .eq('user_id', studentId)
            .order('created_at', { ascending: false });

        if (eventError) throw eventError;
        const eventsArr = events || [];

        // 3. Aggregate session metrics
        const sessions = new Set(eventsArr.map(e => e.session_id)).size;

        let totalDurationMs = 0;
        const sessionGroups: Record<string, number[]> = {};
        eventsArr.forEach(e => {
            if (!sessionGroups[e.session_id]) sessionGroups[e.session_id] = [];
            sessionGroups[e.session_id].push(new Date(e.created_at).getTime());
        });
        Object.values(sessionGroups).forEach(times => {
            if (times.length > 1) {
                totalDurationMs += Math.max(...times) - Math.min(...times);
            }
        });
        const avgDurationMin = sessions > 0 ? (totalDurationMs / sessions) / 60000 : 0;

        // 4. State breakdown (count each state)
        const stateBreakdown = {
            calm: eventsArr.filter(e => e.trigger_state.toLowerCase() === 'calm').length,
            mildstress: eventsArr.filter(e => e.trigger_state.toLowerCase() === 'mildstress').length,
            highstress: eventsArr.filter(e => e.trigger_state.toLowerCase() === 'highstress').length,
            distracted: eventsArr.filter(e => e.trigger_state.toLowerCase() === 'distracted').length,
            disengaged: eventsArr.filter(e => e.trigger_state.toLowerCase() === 'disengaged').length,
        };

        // 5. Success / error counts
        const successCount = eventsArr.filter(e => e.trigger_state === 'SUCCESS').length;
        const errorCount = eventsArr.filter(e => e.trigger_state === 'ERROR').length;

        // 6. Adaptation count (non-trivial interventions)
        const adaptations = eventsArr.filter(e =>
            e.action_taken !== 'NONE' &&
            e.action_taken !== 'NORMAL_LAYOUT' &&
            !e.trigger_state.includes('SUCCESS') &&
            !e.trigger_state.includes('ERROR')
        ).length;

        // 7. Difficulty elevated %
        const difficultyElevated = Math.round(
            (eventsArr.filter(e =>
                e.trigger_state.includes('HIGHSTRESS') ||
                e.trigger_state.includes('MILDSTRESS') ||
                e.trigger_state.includes('DISTRACTED') ||
                e.trigger_state.includes('DISENGAGED')
            ).length / (eventsArr.length || 1)) * 100
        );

        // 8. Engagement level
        const total = successCount + errorCount;
        const successRate = total > 0 ? successCount / total : 0.5;
        const engagementLevel: 'High' | 'Medium' | 'Low' =
            successRate >= 0.7 ? 'High' : successRate >= 0.4 ? 'Medium' : 'Low';

        // 9. Recent activity (any event in the last 7 days)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentActivity = eventsArr.some(e => new Date(e.created_at).getTime() > sevenDaysAgo);

        return {
            student,
            stats: {
                totalSessions: sessions,
                avgDuration: Math.round(avgDurationMin),
                adaptationCount: adaptations,
                difficultyElevated,
                successCount,
                errorCount,
                engagementLevel,
                recentActivity,
                stateBreakdown,
            },
            logs: eventsArr.map(e => ({
                id: e.id,
                time: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                ampm: new Date(e.created_at).toLocaleTimeString([], { hour12: true }).split(' ')[1] || '',
                type: e.trigger_state,
                description: (!e.action_taken || e.action_taken === 'NONE' || e.action_taken === 'NORMAL_LAYOUT')
                    ? 'State update'
                    : e.action_taken.replace(/\+/g, ' · ').replace(/_/g, ' ').toLowerCase(),
                isCritical: e.trigger_state.includes('HIGHSTRESS') || e.trigger_state.includes('DISENGAGED'),
                stateCategory: categorizeState(e.trigger_state),
            })),
        };
    }
};
