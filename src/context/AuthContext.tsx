import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

// Student user type (from localStorage, not from Supabase Auth)
export interface StudentUser {
    id: string;
    full_name: string;
    avatar: string | null;
    class_id: string | null;
    class_name: string | null;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    // Student-specific (non-auth users)
    studentUser: StudentUser | null;
    studentSignOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signOut: async () => { },
    studentUser: null,
    studentSignOut: () => { },
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [studentUser, setStudentUser] = useState<StudentUser | null>(null);

    useEffect(() => {
        // Get active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Check for saved student session
        const savedStudent = localStorage.getItem('studentUser');
        if (savedStudent) {
            try {
                setStudentUser(JSON.parse(savedStudent));
            } catch {
                localStorage.removeItem('studentUser');
            }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        // Listen for student session changes via storage events (cross-tab)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'studentUser') {
                if (e.newValue) {
                    try { setStudentUser(JSON.parse(e.newValue)); } catch { /* ignore */ }
                } else {
                    setStudentUser(null);
                }
            }
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const studentSignOut = () => {
        localStorage.removeItem('studentUser');
        localStorage.removeItem('classCode');
        setStudentUser(null);
    };

    const value = {
        session,
        user,
        loading,
        signOut,
        studentUser,
        studentSignOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
