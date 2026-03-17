import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import WorkshopHUD from '../components/WorkshopHUD';
import { useWorkshop } from '../WorkshopContext';
import { StationStatus, type GameStation } from '../workshopTypes';
import '../workshop.css';

interface StationCard {
    id: GameStation;
    label: string;
    icon: string;
    color: string;
    accent: string;
    glow: string;
    desc: string;
}

const STATION_CARDS: StationCard[] = [
    { id: 'tires', label: 'Tires', icon: 'tire_repair', color: '#4DA6FF', accent: '#2563EB', glow: 'rgba(77,166,255,0.35)', desc: 'Balance the wheel.' },
    { id: 'bolts', label: 'Bolts', icon: 'build', color: '#A78BFA', accent: '#7C3AED', glow: 'rgba(167,139,250,0.35)', desc: 'Tighten the pattern.' },
    { id: 'wiring', label: 'Wiring', icon: 'cable', color: '#4ADE80', accent: '#16A34A', glow: 'rgba(74,222,128,0.35)', desc: 'Reconnect the circuit.' },
    { id: 'fuel', label: 'Fuel', icon: 'local_gas_station', color: '#FB923C', accent: '#EA580C', glow: 'rgba(251,146,60,0.35)', desc: 'Hit the exact fill line.' },
];

export default function GarageHub() {
    const {
        stations,
        totalStars,
        progressRecords,
        completedStations,
        isWorkshopComplete,
        nextStation,
        resetWorkshop,
    } = useWorkshop();
    const navigate = useNavigate();

    const getStation = (id: GameStation) => stations.find((station) => station.id === id)!;
    const allFixed = isWorkshopComplete;
    const carColor = allFixed ? '#4ADE80' : '#6366F1';
    const carAccent = allFixed ? '#16A34A' : '#4338CA';

    return (
        <div
            className="workshop-screen overflow-hidden"
            style={{
                height: '100dvh',
                width: '100%',
                background: 'linear-gradient(180deg, #4DA6FF 0%, #3B82F6 40%, #E5E7EB 40.5%, #D1D5DB 100%)',
            }}
        >
            <WorkshopHUD title="Garage Hub" icon="garage" />

            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div
                    className="absolute top-0 left-0 w-full h-[40%] opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(#fff 20%, transparent 20%), radial-gradient(#fff 20%, transparent 20%)',
                        backgroundPosition: '0 0, 12px 12px',
                        backgroundSize: '24px 24px',
                    }}
                />
                <motion.div
                    className="absolute pointer-events-none"
                    style={{ left: '8%', top: '5%' }}
                    animate={{ y: [0, -10, 0], rotate: [0, 360] }}
                    transition={{ y: { duration: 4, repeat: Infinity }, rotate: { duration: 12, repeat: Infinity, ease: 'linear' } }}
                >
                    <span className="material-symbols-outlined text-white drop-shadow-lg" style={{ fontSize: 'clamp(36px, 5vw, 72px)', opacity: 0.15, fontVariationSettings: "'FILL' 1, 'wght' 700" }}>settings</span>
                </motion.div>
                <motion.div
                    className="absolute pointer-events-none"
                    style={{ left: '85%', top: '6%' }}
                    animate={{ y: [0, -8, 0], rotate: [0, 360] }}
                    transition={{ y: { duration: 5, repeat: Infinity }, rotate: { duration: 14, repeat: Infinity, ease: 'linear' } }}
                >
                    <span className="material-symbols-outlined text-white drop-shadow-lg" style={{ fontSize: 'clamp(28px, 4vw, 56px)', opacity: 0.12, fontVariationSettings: "'FILL' 1, 'wght' 700" }}>settings</span>
                </motion.div>
                <div className="absolute top-10 left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                <div className="absolute top-[25%] right-[15%] w-64 h-64 bg-blue-300/15 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 h-full flex flex-col items-center justify-between pt-[72px] pb-4 px-4 md:px-8 overflow-hidden">
                <motion.div
                    className="relative flex flex-col items-center flex-shrink"
                    style={{ flex: '1 1 0%', minHeight: 0, maxHeight: '56%' }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div
                        className="relative w-full h-full flex items-center justify-center"
                        style={{ maxWidth: '500px', maxHeight: '240px' }}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <div className="absolute bottom-0 left-[15%] w-[70%] h-[6%] bg-black/15 rounded-[100%] blur-md" />

                        <div
                            className="absolute bottom-[8%] left-[4%] w-[92%] h-[52%] rounded-[clamp(12px,3vw,24px)] overflow-hidden"
                            style={{
                                backgroundColor: carColor,
                                borderBottom: `clamp(3px,0.8vw,6px) solid ${carAccent}`,
                                boxShadow: `0 8px 24px ${carAccent}66, inset 0 3px 0 rgba(255,255,255,0.35)`,
                            }}
                        >
                            <div className="absolute right-0 top-0 w-[30%] h-full" style={{ background: `linear-gradient(to right, transparent, ${carAccent}40)` }} />
                            <div className="absolute top-[42%] left-0 w-full h-[12%]" style={{ background: 'linear-gradient(to right, transparent 5%, white 15%, white 85%, transparent 95%)', opacity: 0.2 }} />
                            <div className="absolute top-[10%] left-[32%] w-[1.5px] h-[78%] bg-black/10 rounded-full" />
                            <div className="absolute top-[10%] left-[56%] w-[1.5px] h-[78%] bg-black/10 rounded-full" />
                            <div className="absolute top-[36%] left-[40%] w-[5%] h-[6%] rounded-full" style={{ backgroundColor: carAccent }} />
                            <div className="absolute right-0 top-[18%] w-[4%] h-[25%] rounded-l-full" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', boxShadow: '0 0 20px rgba(253,224,71,0.5)' }} />
                            <div className="absolute left-0 top-[24%] w-[3%] h-[20%] rounded-r-full" style={{ backgroundColor: '#EF4444', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }} />
                            <div className="absolute right-[1%] bottom-[12%] w-[8%] h-[40%] flex flex-col gap-[2px] justify-center px-[2px]">
                                {[0, 1, 2].map((index) => <div key={index} className="w-full h-[2px] bg-black/15 rounded" />)}
                            </div>
                            <div className="absolute top-0 left-[10%] w-[45%] h-[35%] bg-white/15 rounded-b-full" />
                        </div>

                        <div
                            className="absolute bottom-[50%] left-[18%] w-[48%] h-[42%] rounded-t-[clamp(14px,3vw,32px)]"
                            style={{
                                background: 'linear-gradient(135deg, #BFDBFE99, #93C5FD66)',
                                border: `2.5px solid ${carAccent}`,
                                boxShadow: `inset 0 -3px 8px ${carAccent}33`,
                            }}
                        >
                            <div className="absolute top-[8%] right-[8%] w-[15%] h-[50%] bg-white/25 skew-x-[-15deg] rounded-full" />
                        </div>

                        {[{ pos: 'right-[10%]' }, { pos: 'left-[8%]' }].map((wheel, index) => (
                            <div
                                key={index}
                                className={`absolute bottom-0 ${wheel.pos} rounded-full flex items-center justify-center`}
                                style={{
                                    width: 'clamp(36px, 8vw, 80px)',
                                    height: 'clamp(36px, 8vw, 80px)',
                                    backgroundColor: '#1A1A1A',
                                    border: '3px solid #0F0F0F',
                                    boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
                                }}
                            >
                                <div className="absolute inset-0 rounded-full border-[4px] border-dashed opacity-25" style={{ borderColor: '#333' }} />
                                <div className="w-[45%] h-[45%] rounded-full" style={{ background: 'linear-gradient(135deg, #E2E8F0, #94A3B8)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                                    <div className="w-full h-full rounded-full flex items-center justify-center">
                                        <div className="w-[30%] h-[30%] rounded-full bg-gray-500" />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!allFixed && (
                            <motion.div
                                className="absolute bottom-[4%] -left-[4%] flex gap-1 opacity-40"
                                animate={{ opacity: [0.2, 0.5, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <div className="w-3 h-3 md:w-5 md:h-5 bg-gray-300 rounded-full" />
                                <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-200 rounded-full mt-1" />
                            </motion.div>
                        )}
                    </motion.div>

                    <div className="flex flex-col items-center flex-shrink-0 -mt-1">
                        <div className="h-[clamp(3px,0.5vh,5px)] rounded-full z-20" style={{ width: 'clamp(200px, 40vw, 480px)', backgroundColor: '#B91C1C', boxShadow: '0 3px 6px rgba(0,0,0,0.3)' }} />
                        <div className="border-x-4 md:border-x-6 z-10" style={{ width: 'clamp(32px, 5vw, 80px)', height: 'clamp(40px, 8vh, 100px)', backgroundColor: 'var(--ws-red)', borderColor: '#F87171', boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.15)' }}>
                            <div className="w-[20%] h-full bg-white/20 ml-[15%] rounded-full" />
                        </div>
                        <div className="bg-gray-700 rounded-t-xl border-t-2 border-gray-500 -mt-1 z-0" style={{ width: 'clamp(80px, 15vw, 200px)', height: 'clamp(12px, 1.5vh, 28px)' }} />
                    </div>

                    <motion.div
                        className="mt-1 md:mt-2 px-4 md:px-6 py-1 md:py-2 rounded-full flex items-center gap-2 flex-shrink-0"
                        style={{
                            background: allFixed ? 'linear-gradient(135deg, #4ADE80, #22C55E)' : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                            boxShadow: 'var(--ws-shadow-plastic-card)',
                            border: allFixed ? '3px solid #16A34A' : '3px solid rgba(0,0,0,0.08)',
                        }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <span className="material-symbols-outlined text-base md:text-xl" style={{ color: allFixed ? '#FFF' : 'var(--ws-blue)', fontVariationSettings: "'FILL' 1" }}>
                            {allFixed ? 'verified' : 'directions_car'}
                        </span>
                        <span className={`workshop-heading text-[10px] md:text-sm font-bold uppercase tracking-wider ${allFixed ? 'text-white' : 'text-[var(--ws-dark)]'}`}>
                            {allFixed ? 'Car Ready!' : `${completedStations}/4 repairs complete`}
                        </span>
                    </motion.div>
                </motion.div>

                <div className="w-full max-w-[960px] flex-shrink-0 mt-auto pt-2 md:pt-4 space-y-3 md:space-y-4">
                    <motion.div
                        className="rounded-[22px] px-4 py-3 md:px-5 md:py-4 bg-white/88 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3"
                        style={{ boxShadow: 'var(--ws-shadow-plastic-card)' }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                    >
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="rounded-full bg-slate-100 px-3 py-2">
                                <span className="text-xs uppercase tracking-wider text-slate-400">Repairs</span>
                                <p className="workshop-heading text-lg text-slate-700 leading-none mt-1">{completedStations}/4</p>
                            </div>
                            <div className="rounded-full bg-amber-50 px-3 py-2">
                                <span className="text-xs uppercase tracking-wider text-amber-500">Stars</span>
                                <p className="workshop-heading text-lg text-amber-700 leading-none mt-1">{totalStars}/12</p>
                            </div>
                            <p className="text-sm text-slate-500">
                                {allFixed ? 'Garage complete.' : 'Pick the highlighted repair bay.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {nextStation && !allFixed && (
                                <button
                                    type="button"
                                    onClick={() => navigate(nextStation.route)}
                                    className="rounded-full px-4 py-2 bg-slate-900 text-white workshop-heading text-sm hover:scale-[1.02] transition-transform ws-touch-target"
                                >
                                    Continue
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm('Reset all garage progress and start over?')) {
                                        resetWorkshop();
                                    }
                                }}
                                className="rounded-full px-4 py-2 bg-slate-100 text-slate-700 workshop-heading text-sm border border-slate-200 ws-touch-target"
                            >
                                Reset
                            </button>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 w-full">
                        {STATION_CARDS.map((card, index) => {
                            const station = getStation(card.id);
                            const completed = station.status === StationStatus.COMPLETED;
                            const locked = station.status === StationStatus.LOCKED;
                            const active = nextStation?.id === card.id;
                            const earnedStars = progressRecords.get(card.id)?.starsEarned ?? 0;

                            return (
                                <motion.button
                                    key={card.id}
                                    type="button"
                                    className="relative flex flex-col items-center justify-center gap-1 md:gap-2 rounded-[16px] md:rounded-[20px] p-3 md:p-4 ws-touch-target overflow-hidden"
                                    style={{
                                        background: completed
                                            ? 'linear-gradient(135deg, rgba(74,222,128,0.18), rgba(74,222,128,0.06))'
                                            : active
                                                ? `linear-gradient(135deg, ${card.color}22, rgba(255,255,255,0.95))`
                                                : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
                                        border: completed
                                            ? '2px solid #4ADE80'
                                            : active
                                                ? `2px solid ${card.color}`
                                                : '2px solid rgba(0,0,0,0.06)',
                                        boxShadow: active
                                            ? `0 12px 24px ${card.glow}, inset 0 2px 0 rgba(255,255,255,0.8)`
                                            : completed
                                                ? '0 6px 16px rgba(74,222,128,0.2), inset 0 2px 0 rgba(255,255,255,0.5)'
                                                : '0 6px 16px rgba(0,0,0,0.08), inset 0 2px 0 rgba(255,255,255,0.8)',
                                        opacity: locked ? 0.45 : 1,
                                    }}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: locked ? 0.45 : 1 }}
                                    transition={{ delay: 0.08 * index, duration: 0.4, ease: 'backOut' }}
                                    whileHover={locked ? {} : { y: -4 }}
                                    whileTap={locked ? {} : { scale: 0.97, y: 0 }}
                                    onClick={() => !locked && navigate(station.route)}
                                >
                                    <div className="absolute top-2 right-2">
                                        <span className="material-symbols-outlined text-base" style={{ color: completed ? '#16A34A' : active ? card.accent : '#94A3B8', fontVariationSettings: "'FILL' 1" }}>
                                            {completed ? 'verified' : active ? 'play_circle' : locked ? 'lock' : 'radio_button_checked'}
                                        </span>
                                    </div>

                                    <div
                                        className="relative rounded-full flex items-center justify-center"
                                        style={{
                                            width: 'clamp(40px, 6vw, 56px)',
                                            height: 'clamp(40px, 6vw, 56px)',
                                            background: completed
                                                ? 'linear-gradient(135deg, #4ADE80, #22C55E)'
                                                : `linear-gradient(135deg, ${card.color}, ${card.accent})`,
                                            boxShadow: completed
                                                ? '0 4px 12px rgba(74,222,128,0.4), inset 0 2px 0 rgba(255,255,255,0.3)'
                                                : `0 4px 12px ${card.glow}, inset 0 2px 0 rgba(255,255,255,0.3)`,
                                        }}
                                    >
                                        <div className="absolute top-1 left-[20%] w-[60%] h-[35%] bg-white/25 rounded-b-full" />
                                        <span className="material-symbols-outlined text-white relative z-10 drop-shadow-sm" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', fontVariationSettings: "'FILL' 1" }}>
                                            {completed ? 'check' : card.icon}
                                        </span>
                                    </div>

                                    <span className="workshop-heading font-bold text-[var(--ws-dark)] uppercase tracking-wider leading-tight" style={{ fontSize: 'clamp(10px, 1.2vw, 14px)' }}>
                                        {card.label}
                                    </span>

                                    <span className="text-gray-500 font-medium leading-tight text-center" style={{ fontSize: 'clamp(9px, 1vw, 12px)' }}>
                                        {completed
                                            ? `${earnedStars} star${earnedStars === 1 ? '' : 's'} earned`
                                            : active
                                                ? 'Next repair'
                                                : locked
                                                    ? 'Unlock earlier bays'
                                                    : card.desc}
                                    </span>

                                    <div className="flex items-center gap-1 mt-1">
                                        {[1, 2, 3].map((star) => (
                                            <span
                                                key={star}
                                                className="material-symbols-outlined"
                                                style={{
                                                    fontSize: 'clamp(12px, 1.5vw, 16px)',
                                                    color: star <= earnedStars ? '#F59E0B' : '#D1D5DB',
                                                    fontVariationSettings: "'FILL' 1",
                                                }}
                                            >
                                                star
                                            </span>
                                        ))}
                                    </div>

                                    {locked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-[16px]">
                                            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontVariationSettings: "'FILL' 1" }}>lock</span>
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
