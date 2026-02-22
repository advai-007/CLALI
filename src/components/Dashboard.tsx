import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { Settings, BookOpen, Calculator, Play, Flame, Trophy, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sensorBridge } from '../utils/tracking/SensorBridge';
import { featureExtractor, type ExtractedFeatures } from '../utils/tracking/FeatureExtractor';

const Dashboard = () => {
    const navigate = useNavigate();
    const [debugFeatures, setDebugFeatures] = useState<ExtractedFeatures | null>(null);

    useEffect(() => {
        // Connect bridge to extractor
        const bridgeUnsub = sensorBridge.subscribe(featureExtractor.processRawData);

        // Connect extractor to our debug UI
        const featureUnsub = featureExtractor.subscribe((features) => {
            setDebugFeatures(features);
        });

        // Start them up
        sensorBridge.start();
        featureExtractor.start();

        return () => {
            bridgeUnsub();
            featureUnsub();
            sensorBridge.stop();
            featureExtractor.stop();
        };
    }, []);
    return (
        <div className="min-h-screen text-text-dark font-lexend transition-colors duration-300 overflow-x-hidden">
            <div className="max-w-4xl mx-auto px-6 py-8 min-h-screen flex flex-col relative">

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
                        <div className="w-14 h-14 rounded-full border-4 border-white shadow-sm overflow-hidden bg-primary/30">
                            {/* Placeholder Avatar */}
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                alt="User Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </motion.button>

                    <div className="text-center">
                        <h1 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Clali</h1>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-primary hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
                    >
                        <Settings size={24} />
                    </motion.button>
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
                                <h2 className="text-4xl md:text-5xl font-black text-slate-700 tracking-tight mb-2">Hi Student!</h2>
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
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">

                        {/* Reading Card */}
                        <ModuleCard
                            title="Reading Time"
                            subtitle="Let's explore stories!"
                            icon={BookOpen}
                            bgColor="bg-mint-soft"
                            textColor="text-teal-900"
                            iconColor="text-emerald-500"
                            buttonColor="text-emerald-500"
                            onClick={() => navigate('/reading')}
                        />

                        {/* Math Card */}
                        <ModuleCard
                            title="Math Fun"
                            subtitle="Solve challenges!"
                            icon={Calculator}
                            bgColor="bg-yellow-soft"
                            textColor="text-amber-900"
                            iconColor="text-amber-500"
                            buttonColor="text-amber-500"
                        />

                        {/* Quick Play (Wide) */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="col-span-1 md:col-span-2 group relative w-full h-48 rounded-[2rem] overflow-hidden bg-sky-soft shadow-card flex items-center justify-between p-8 px-10 cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent pointer-events-none" />

                            <div className="relative z-10 text-left flex flex-col justify-center h-full max-w-[50%]">
                                <h3 className="text-3xl font-black text-blue-900 leading-tight mb-2">Quick Play</h3>
                                <p className="text-lg font-bold text-blue-800/60">5-minute brain challenge!</p>
                            </div>

                            <div className="relative z-10 flex items-center justify-center h-full pr-8">
                                <Trophy size={100} className="text-blue-500 drop-shadow-xl opacity-80" strokeWidth={1.5} />
                            </div>

                            <div className="absolute right-8 bottom-8 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md group-hover:bg-blue-100 transition-colors">
                                <Play className="text-blue-500 ml-1" size={24} fill="currentColor" />
                            </div>
                        </motion.button>
                    </section>

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

                {/* Metrics Debug Panel (Bottom Left) */}
                {debugFeatures && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-6 left-6 z-50 bg-slate-900/90 text-green-400 font-mono text-xs p-5 rounded-2xl shadow-float backdrop-blur-md border border-slate-700 pointer-events-none transition-all w-72"
                    >
                        <div className="flex items-center gap-2 mb-3 text-white border-b border-slate-700 pb-2">
                            <Activity size={16} className="text-emerald-400" />
                            <span className="font-bold tracking-wider">TRACKING DEBUG</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-y-2 text-sm">
                            <span className="text-slate-400">Idle Status</span>
                            <span className={debugFeatures.isIdle ? 'text-orange-400' : 'text-emerald-400'}>{debugFeatures.isIdle ? 'IDLE' : 'ACTIVE'}</span>

                            <span className="text-slate-400">Tab Visible</span>
                            <span className={debugFeatures.isVisible ? 'text-emerald-400' : 'text-orange-400'}>{debugFeatures.isVisible ? 'YES' : 'NO'}</span>

                            <span className="text-slate-400">Frantic Taps</span>
                            <span className={debugFeatures.franticTaps > 0 ? 'text-orange-400 font-bold' : ''}>{debugFeatures.franticTaps}</span>

                            <span className="text-slate-400">Scroll YoYo</span>
                            <span className={debugFeatures.scrollYoYoCount > 0 ? 'text-orange-400 font-bold' : ''}>{debugFeatures.scrollYoYoCount}</span>

                            <span className="text-slate-400">Max Hold</span>
                            <span>{debugFeatures.touchHoldDuration}ms</span>

                            <span className="text-slate-400">Motion Mag</span>
                            <span>{debugFeatures.motionMagnitude.toFixed(2)}</span>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// Sub-components for cleaner file

interface ModuleCardProps {
    title: string;
    subtitle: string;
    icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    bgColor: string;
    textColor: string;
    iconColor: string;
    buttonColor: string;
    onClick?: () => void;
}

const ModuleCard = ({ title, subtitle, icon: Icon, bgColor, textColor, iconColor, buttonColor, onClick }: ModuleCardProps) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative w-full h-64 rounded-[2rem] overflow-hidden ${bgColor} shadow-card hover:shadow-float flex flex-col justify-between p-6 cursor-pointer border-4 border-transparent hover:border-white/50 transition-all`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />

        <div className="relative z-10 flex justify-center items-center h-2/3">
            <Icon size={120} className={`${iconColor} drop-shadow-md opacity-80 group-hover:scale-110 transition-transform duration-300`} strokeWidth={1.5} />
        </div>

        <div className="relative z-10 flex items-end justify-between w-full mt-2">
            <div className="text-left">
                <h3 className={`text-2xl font-black ${textColor} leading-tight`}>{title}</h3>
                <p className={`text-sm font-bold ${textColor} opacity-70 mt-1`}>{subtitle}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md group-hover:bg-white/80 transition-colors shadow-pop group-hover:shadow-none group-hover:translate-y-[2px]">
                <Play className={`${buttonColor} ml-1`} size={24} fill="currentColor" />
            </div>
        </div>
    </motion.button>
);

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
