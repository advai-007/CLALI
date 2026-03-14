import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { School, Rocket, Users, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';

const RoleSelectionPage = () => {
    const navigate = useNavigate();
    const [hoveredRole, setHoveredRole] = useState<'student' | 'teacher' | null>(null);

    const roles = [
        {
            id: 'student' as const,
            title: "I'm a Student",
            subtitle: "Enter your magic code and start playing games!",
            icon: <Rocket size={48} />,
            color: 'from-cyan-400 to-blue-500',
            bgLight: 'bg-cyan-50',
            borderColor: 'border-cyan-200',
            hoverShadow: 'shadow-cyan-200/50',
            path: '/student-login',
            mascot: '🚀'
        },
        {
            id: 'teacher' as const,
            title: "I'm a Teacher",
            subtitle: "Manage your class, track progress, and setup lessons.",
            icon: <School size={48} />,
            color: 'from-indigo-500 to-purple-600',
            bgLight: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
            hoverShadow: 'shadow-indigo-200/50',
            path: '/login', // Will be updated in App.tsx to point to teacher login
            mascot: '🎓'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#111a21] flex flex-col items-center justify-center p-6 relative overflow-hidden font-display transition-colors duration-300">
            {/* Background Decorative Elements */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12 z-10"
            >
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="size-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 rotate-3">
                        <Users size={28} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">CLALI</h1>
                </div>
                <h2 className="text-xl font-medium text-slate-500 dark:text-slate-400">Choose your journey</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl z-10">
                {roles.map((role, index) => (
                    <motion.button
                        key={role.id}
                        initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        onMouseEnter={() => setHoveredRole(role.id)}
                        onMouseLeave={() => setHoveredRole(null)}
                        onClick={() => navigate(role.path)}
                        className={`relative group flex flex-col overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 text-left border-2 transition-all duration-500 h-[400px] sm:h-[450px] shadow-xl hover:scale-[1.02] ${hoveredRole === role.id
                                ? `${role.borderColor} ${role.hoverShadow} scale-[1.02]`
                                : 'border-transparent shadow-slate-200/50 dark:shadow-black/20'
                            }`}
                    >
                        {/* Gradient Background Decoration */}
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-bl-[100px]`}></div>

                        {/* Icon/Mascot Area */}
                        <div className={`size-24 rounded-[2rem] bg-gradient-to-br ${role.color} flex items-center justify-center text-white shadow-lg mb-8 group-hover:rotate-6 transition-transform duration-500`}>
                            {role.icon}
                        </div>

                        {/* Text Content */}
                        <div className="mt-auto">
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {role.title}
                                </h3>
                                <motion.div
                                    animate={hoveredRole === role.id ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="text-2xl"
                                >
                                    {role.id === 'student' ? <Sparkles className="text-yellow-400" size={24} /> : null}
                                </motion.div>
                            </div>
                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium">
                                {role.subtitle}
                            </p>

                            <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                                <span>Get Started</span>
                                <ChevronRight size={20} />
                            </div>
                        </div>

                        {/* Floating Mascot Emoji for Student */}
                        {role.id === 'student' && (
                            <div className="absolute top-10 right-10 text-6xl opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 pointer-events-none grayscale group-hover:grayscale-0">
                                {role.mascot}
                            </div>
                        )}

                        {role.id === 'teacher' && (
                            <div className="absolute top-10 right-10 text-6xl opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 pointer-events-none grayscale group-hover:grayscale-0">
                                {role.mascot}
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-16 text-slate-400 dark:text-slate-500 text-sm font-medium z-10"
            >
                CLALI Adaptive Learning Platform &copy; 2024
            </motion.div>
        </div>
    );
};

export default RoleSelectionPage;
