import { useEffect } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calculator, Play, Flame, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sensorBridge } from '../utils/tracking/SensorBridge';
import { featureExtractor } from '../utils/tracking/FeatureExtractor';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { studentUser, studentSignOut } = useAuth();
    // Derive display name — checks live context, then raw localStorage, then friendly fallback
    const displayName = studentUser?.full_name || 'Explorer';

    useEffect(() => {
        // Start bridge for background adaptation logging
        sensorBridge.start();
        featureExtractor.start();

        return () => {
            sensorBridge.stop();
            featureExtractor.stop();
        };
    }, []);

    return (
        <div className="text-text-dark font-lexend transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-6 py-8 relative">

                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-mint-soft/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 z-0 pointer-events-none" />

                {/* Header */}
                <header className="relative z-10 flex items-center justify-between mb-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="group relative cursor-pointer"
                    >
                        <div className="w-14 h-14 rounded-full border-4 border-white shadow-sm overflow-hidden bg-primary/30 flex items-center justify-center">
                            {studentUser?.avatar ? (
                                <span className="text-3xl">{studentUser.avatar}</span>
                            ) : (
                                <img
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                    alt="User Avatar"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </motion.button>

                    <div className="text-center">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-white rounded-full flex items-center justify-center overflow-hidden border border-white shadow-sm">
                            <img src="/logo.png" alt="CLALI Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Clali</h1>
                    </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {studentUser && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { studentSignOut(); navigate('/student-login'); }}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-colors cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut size={20} />
                            </motion.button>
                        )}

                    </div>
                </header>

                <main className="relative z-10 flex-grow flex flex-col gap-8">

                    {/* Welcome Section */}
                    <section className="flex flex-col md:flex-row items-center justify-center gap-6 relative">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-card w-full max-w-2xl mx-auto relative z-0 flex items-center justify-between overflow-visible"
                        >
                            <div className="flex-1 pr-4">
                                <h2 className="text-4xl md:text-5xl font-black text-slate-700 tracking-tight mb-2">Hi {displayName}!</h2>
                                <p className="text-lg text-slate-500 font-medium">Ready to play and learn?</p>

                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-soft rounded-full shadow-sm border border-yellow-200">
                                    <span className="text-xl animate-bounce">🌟</span>
                                    <span className="font-bold text-amber-800 text-sm tracking-wide">Great Focus Today!</span>
                                </div>
                            </div>

                            <div className="relative w-32 h-32 md:w-48 md:h-48 -my-8 -mr-4 flex-shrink-0 animate-float">
                                {/* Placeholder for Owl/Mascot */}
                                <img
                                    src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
                                    alt="Mascot"
                                    className="w-full h-full object-contain drop-shadow-xl"
                                />
                            </div>
                        </motion.div>
                    </section>

                    {/* Module Grid */}
                    <div className="grid grid-cols-1 mb-8 w-full max-w-4xl mx-auto">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/story-demo')}
                            className="group relative w-full h-48 rounded-[2rem] overflow-hidden shadow-card flex items-center justify-between p-8 px-10 cursor-pointer"
                            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-transparent pointer-events-none" />
                            {/* Floating decorative UI elements */}
                            <div className="absolute top-4 right-24 opacity-15 pointer-events-none rotate-12">
                                <span className="font-lexend text-white text-7xl font-bold tracking-tighter">📖</span>
                            </div>
                            <div className="absolute bottom-2 right-48 flex opacity-15 pointer-events-none -rotate-12">
                                <span className="font-lexend text-white text-6xl font-bold tracking-tighter">🦉</span>
                            </div>

                            <div className="relative z-10 text-left flex flex-col justify-center h-full max-w-[55%]">
                                <h3 className="text-4xl font-black text-white leading-tight mb-2 drop-shadow-sm font-lexend">The Broken Storybook</h3>
                                <p className="text-lg font-bold text-white/80">Adaptive Story Experience</p>
                            </div>

                            <div className="relative z-10 flex items-center justify-center h-full pr-4">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)' }}>
                                    <span className="material-symbols-outlined text-white text-5xl md:text-6xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>
                                        auto_stories
                                    </span>
                                </div>
                            </div>

                            <div className="absolute right-8 bottom-8 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-md group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                                <Play className="text-white ml-1" size={24} fill="currentColor" />
                            </div>
                        </motion.button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">

                        {/* Workshop Game */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/workshop')}
                            className="col-span-1 md:col-span-1 group relative w-full h-48 rounded-[2rem] overflow-hidden shadow-card flex items-center justify-between p-8 px-10 cursor-pointer"
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #4338CA 100%)' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-transparent pointer-events-none" />
                            {/* Floating gear decorations */}
                            <div className="absolute top-4 right-24 opacity-10 pointer-events-none">
                                <span className="material-symbols-outlined text-white text-7xl" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
                            </div>
                            <div className="absolute bottom-2 right-48 opacity-10 pointer-events-none rotate-45">
                                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>build</span>
                            </div>

                            <div className="relative z-10 text-left flex flex-col justify-center h-full max-w-[55%]">
                                <h3 className="text-3xl font-black text-white leading-tight mb-2">Mechanic Workshop</h3>
                                <p className="text-base font-bold text-white/60">Fix gears, balance tires & more!</p>
                            </div>

                            <div className="relative z-10 flex items-center justify-center h-full pr-4">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)' }}>
                                    <span className="material-symbols-outlined text-white text-5xl md:text-6xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>
                                        engineering
                                    </span>
                                </div>
                            </div>

                            <div className="absolute right-8 bottom-8 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-md group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                                <Play className="text-white ml-1" size={24} fill="currentColor" />
                            </div>
                        </motion.button>

                        {/* Word Factory Game */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/word-factory')}
                            className="col-span-1 md:col-span-1 group relative w-full h-48 rounded-[2rem] overflow-hidden shadow-card flex items-center justify-between p-8 px-10 cursor-pointer"
                            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-transparent pointer-events-none" />
                            {/* Floating letter decorations */}
                            <div className="absolute top-4 right-24 opacity-15 pointer-events-none rotate-12">
                                <span className="font-black text-white text-7xl tracking-tighter">A</span>
                            </div>
                            <div className="absolute bottom-2 right-48 opacity-15 pointer-events-none -rotate-12">
                                <span className="font-black text-white text-6xl tracking-tighter">B</span>
                            </div>

                            <div className="relative z-10 text-left flex flex-col justify-center h-full max-w-[55%]">
                                <h3 className="text-3xl font-black text-white leading-tight mb-2">Word Factory</h3>
                                <p className="text-base font-bold text-white/60">Drag & drop letters to spell!</p>
                            </div>

                            <div className="relative z-10 flex items-center justify-center h-full pr-4">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)' }}>
                                    <span className="material-symbols-outlined text-white text-5xl md:text-6xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>
                                        sort_by_alpha
                                    </span>
                                </div>
                            </div>

                            <div className="absolute right-8 bottom-8 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-md group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                                <Play className="text-white ml-1" size={24} fill="currentColor" />
                            </div>
                        </motion.button>
                    </div>

                    {/* Stats Row - Glassmorphic Cards */}
                    <section className="mt-4 w-full max-w-2xl mx-auto">
                        <h3 className="sr-only">Your Progress</h3>
                        <div className="flex justify-around items-end gap-4">
                            <StatItem icon={BookOpen} value="5" label="Stories" color="emerald" bgColor="bg-mint-soft" />
                            <StatItem icon={Calculator} value="32" label="Math" color="amber" bgColor="bg-yellow-soft" />
                            <StatItem icon={Flame} value="3" label="Days" color="orange" bgColor="bg-orange-100" />
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

// Sub-components for cleaner file

interface StatItemProps {
    icon: ComponentType<{ size?: number; className?: string }>;
    value: string;
    label: string;
    color: string;
    bgColor: string;
}

const StatItem = ({ icon: Icon, value, label, color, bgColor }: StatItemProps) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="flex flex-col items-center group cursor-pointer bg-white/70 backdrop-blur-md p-4 rounded-3xl shadow-card hover:shadow-float transition-all w-1/3 border border-white/50"
    >
        <div className={`relative w-14 h-14 flex items-center justify-center ${bgColor} rounded-2xl shadow-inner-light mb-2`}>
            <Icon size={28} className={`text-${color}-600`} />
        </div>
        <div className="text-center">
            <span className={`block text-2xl font-black text-${color}-700`}>{value}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        </div>
    </motion.div>
);

export default Dashboard;
