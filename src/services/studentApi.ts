import { supabase } from '../utils/supabase';

// Types for the student login flow
export interface ClassInfo {
    id: string;
    name: string;
    class_code: string;
    teacher_id: string;
}

export interface StudentInfo {
    id: string;
    full_name: string;
    avatar: string | null;
    secret_icon: string | null;
}

/**
 * Look up a class by its class code.
 * Returns the class info or null if not found.
 */
export async function getClassByCode(code: string): Promise<ClassInfo | null> {
    const { data, error } = await supabase
        .from('classes')
        .select('id, name, class_code, teacher_id')
        .eq('class_code', code.toUpperCase())
        .single();

    if (error || !data) return null;
    return data as ClassInfo;
}

/**
 * Fetch all students belonging to a specific class.
 */
export async function getStudentsByClassId(classId: string): Promise<StudentInfo[]> {
    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar, secret_icon')
        .eq('role', 'student')
        .eq('class_id', classId)
        .order('full_name');

    if (error || !data) return [];
    return data as StudentInfo[];
}
