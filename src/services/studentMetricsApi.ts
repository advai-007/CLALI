import { supabase } from '../utils/supabase';

export interface StudentMetric {
    participant_id: string;
    full_name: string;
    avatar: string | null;
    current_state: string;
    avg_load: number;
    last_active: string;
}

export interface ClassMetrics {
    classId: string;
    className: string;
    studentCount: number;
    avgLoad: number;
    distribution: {
        optimal: number;
        low: number;
        struggling: number;
        critical: number;
    };
    students: StudentMetric[];
}

export const studentMetricsApi = {
    /**
     * Log a student adaptation event to Supabase
     */
    async logAdaptationEvent(userId: string, triggerState: string, actionTaken: string) {
        try {
            const { error } = await supabase
                .from('adaptation_events')
                .insert({
                    user_id: userId,
                    session_id: `session_${Date.now()}`, // Simple fallback session ID
                    trigger_state: triggerState,
                    action_taken: actionTaken
                });
            if (error) throw error;
        } catch (err) {
            console.error('Error logging adaptation event:', err);
        }
    },

    /**
     * Fetch aggregated metrics for all classes of a teacher
     */
    async getTeacherDashboardData(teacherId: string) {
        // 1. Get all classes for this teacher
        const { data: classes, error: classError } = await supabase
            .from('classes')
            .select('id, name')
            .eq('teacher_id', teacherId);

        if (classError) throw classError;

        // 2. For each class, get the latest adaptation events for all students
        const dashboardData = await Promise.all(classes.map(async (cls) => {
            // Get all students in this class
            const { data: students, error: studentError } = await supabase
                .from('users')
                .select('id, full_name, avatar')
                .eq('class_id', cls.id)
                .eq('role', 'student');

            if (studentError) throw studentError;

            // Get latest event for each student
            const studentMetrics = await Promise.all(students.map(async (student) => {
                const { data: latestEvent } = await supabase
                    .from('adaptation_events')
                    .select('trigger_state, created_at')
                    .eq('user_id', student.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                // Map trigger_state to a load score (roughly)
                const state = latestEvent?.trigger_state || 'NORMAL';
                let load = 1.0; // Normal
                if (state.includes('REDUCED')) load = 3.0;
                if (state.includes('GUIDED')) load = 5.0;
                if (state.includes('MAX')) load = 8.0;

                return {
                    participant_id: student.id,
                    full_name: student.full_name || 'Unknown',
                    avatar: student.avatar,
                    current_state: state,
                    avg_load: load,
                    last_active: latestEvent?.created_at || 'Never'
                };
            }));

            const studentCount = students.length;
            const avgLoad = studentMetrics.length > 0
                ? studentMetrics.reduce((acc, s) => acc + s.avg_load, 0) / studentMetrics.length
                : 0;

            const distribution = {
                optimal: studentMetrics.filter(s => s.avg_load <= 2).length,
                low: studentMetrics.filter(s => s.avg_load > 2 && s.avg_load <= 4).length,
                struggling: studentMetrics.filter(s => s.avg_load > 4 && s.avg_load <= 6).length,
                critical: studentMetrics.filter(s => s.avg_load > 6).length
            };

            return {
                classId: cls.id,
                className: cls.name,
                studentCount,
                avgLoad: Number(avgLoad.toFixed(1)),
                distribution,
                students: studentMetrics
            };
        }));

        return dashboardData;
    },

    /**
     * Fetch detailed logs and history for a specific student
     */
    async getStudentDetails(studentId: string) {
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

        // 3. Aggregate metrics
        const sessions = new Set(events.map(e => e.session_id)).size;

        // Calculate average duration (very rough estimate based on event spans)
        let totalDurationMs = 0;
        const sessionGroups: Record<string, any[]> = {};
        events.forEach(e => {
            if (!sessionGroups[e.session_id]) sessionGroups[e.session_id] = [];
            sessionGroups[e.session_id].push(new Date(e.created_at).getTime());
        });

        Object.values(sessionGroups).forEach(times => {
            if (times.length > 1) {
                totalDurationMs += Math.max(...times) - Math.min(...times);
            }
        });

        const avgDurationMin = sessions > 0 ? (totalDurationMs / sessions) / 60000 : 0;

        // Adaptation rate
        const adaptations = events.filter(e => e.action_taken !== 'NONE' && !e.trigger_state.includes('SUCCESS') && !e.trigger_state.includes('ERROR')).length;

        return {
            student,
            stats: {
                totalSessions: sessions,
                avgDuration: Math.round(avgDurationMin),
                adaptationCount: adaptations,
                difficultyElevated: Math.round((events.filter(e => e.trigger_state.includes('GUIDED') || e.trigger_state.includes('REDUCED')).length / (events.length || 1)) * 100)
            },
            logs: events.map(e => ({
                id: e.id,
                time: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                ampm: new Date(e.created_at).toLocaleTimeString([], { hour12: true }).split(' ')[1],
                type: e.trigger_state,
                description: e.action_taken === 'NONE' ? 'State update' : e.action_taken,
                isCritical: e.trigger_state.includes('MAX') || e.trigger_state.includes('CRITICAL')
            }))
        };
    }
};
