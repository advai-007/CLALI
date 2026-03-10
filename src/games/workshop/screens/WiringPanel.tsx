/* eslint-disable react-hooks/refs */
import { useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import WorkshopHUD from '../components/WorkshopHUD';
import VictoryModal from '../components/VictoryModal';
import FeedbackToast from '../components/FeedbackToast';
import HintOverlay from '../components/HintOverlay';
import { useWorkshop } from '../WorkshopContext';
import { useInteractionMonitor } from '../useInteractionMonitor';
import { AdaptiveState, POSITIVE_MESSAGES, ENCOURAGE_MESSAGES } from '../workshopTypes';
import '../workshop.css';

// ─── Wire Definitions ───────────────────────────────────────────────
interface WireDef {
    id: string;
    color: string;
    hexColor: string;
    label: string;
}

const WIRES: WireDef[] = [
    { id: 'red', color: 'var(--ws-red)', hexColor: '#FF5C5C', label: 'A' },
    { id: 'blue', color: 'var(--ws-blue)', hexColor: '#4DA6FF', label: 'B' },
    { id: 'yellow', color: 'var(--ws-yellow)', hexColor: '#FFD93D', label: 'C' },
    { id: 'green', color: 'var(--ws-green)', hexColor: '#4ADE80', label: 'D' },
    { id: 'purple', color: 'var(--ws-purple)', hexColor: '#A78BFA', label: 'E' },
];

export default function WiringPanel() {
    const { adaptiveState, sendAdaptive, completeStation } = useWorkshop();
    const monitor = useInteractionMonitor();

    const [connections, setConnections] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        WIRES.forEach(w => initial[w.id] = false);
        return initial;
    });
    const [destOrder] = useState<WireDef[]>(() => [...WIRES].sort(() => {

        return Math.random() - 0.5;
    }));
    const [activeDrag, setActiveDrag] = useState<string | null>(null);
    const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [taskStartTime] = useState(() => Date.now());

    const sourceRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const destRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const boardRef = useRef<HTMLDivElement | null>(null);

    const completedCount = Object.values(connections).filter(Boolean).length;
    const totalWires = WIRES.length;

    const hintText = useMemo(() => {
        if (adaptiveState === AdaptiveState.NORMAL) return undefined;
        const nextWire = WIRES.find((w) => !connections[w.id]);
        if (!nextWire) return undefined;
        if (adaptiveState === AdaptiveState.GUIDED) return `Connect the ${nextWire.id} wire to the glowing ${nextWire.id} port!`;
        return 'Match each wire color to its matching port!';
    }, [adaptiveState, connections]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((p) => p + 1);
    }, []);

    const getCenter = (el: HTMLElement | null): { x: number; y: number } | null => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const handleSourcePointerDown = useCallback((wireId: string) => {
        if (connections[wireId]) return;
        setActiveDrag(wireId);
        monitor.recordInteraction();
        const center = getCenter(sourceRefs.current[wireId]);
        if (center) setDragPos(center);
    }, [connections, monitor]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!activeDrag) return;
        setDragPos({ x: e.clientX, y: e.clientY });
    }, [activeDrag]);

    const handlePointerUp = useCallback(() => {
        if (!activeDrag || !dragPos) { setActiveDrag(null); setDragPos(null); return; }

        // Check if near any destination
        let matched = false;
        for (const wire of WIRES) {
            const destEl = destRefs.current[wire.id];
            if (!destEl) continue;
            const center = getCenter(destEl);
            if (!center) continue;
            if (Math.hypot(dragPos.x - center.x, dragPos.y - center.y) < 60) {
                if (wire.id === activeDrag) {
                    // Correct match
                    setConnections((prev) => ({ ...prev, [wire.id]: true }));
                    monitor.recordCorrectAction();
                    sendAdaptive({ type: 'CORRECT_ACTION' });

                    showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');
                    matched = true;

                    const newCount = completedCount + 1;
                    if (newCount >= totalWires) {
                        setTimeout(() => setShowVictory(true), 800);
                    }
                } else {
                    // Wrong match
                    monitor.recordIncorrectAction();
                    sendAdaptive({ type: 'INCORRECT_ACTION' });
                    setErrorCount((p) => p + 1);

                    showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');
                    if (monitor.shouldEscalate()) sendAdaptive({ type: 'DIFFICULTY_DETECTED' });
                    matched = true;
                }
                break;
            }
        }

        if (!matched) {
            // Dropped in empty space
        }

        setActiveDrag(null);
        setDragPos(null);
    }, [activeDrag, dragPos, completedCount, totalWires, monitor, sendAdaptive, showFeedback]);

    const handleComplete = useCallback(() => {
        const duration = Date.now() - taskStartTime;
        const stars = errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1;
        completeStation('wiring', {
            taskDuration: duration,
            errorCount,
            adaptationStateUsed: adaptiveState,
            hintCount: adaptiveState !== AdaptiveState.NORMAL ? 1 : 0,
            starsEarned: stars,
        });
    }, [errorCount, adaptiveState, completeStation, taskStartTime]);

    // SVG line helpers
    const getSvgLine = (fromId: string, toId: string): { x1: number; y1: number; x2: number; y2: number } | null => {
        const boardEl = boardRef.current;
        const fromEl = sourceRefs.current[fromId];
        const toEl = destRefs.current[toId];
        if (!boardEl || !fromEl || !toEl) return null;
        const boardRect = boardEl.getBoundingClientRect();
        const fromCenter = getCenter(fromEl);
        const toCenter = getCenter(toEl);
        if (!fromCenter || !toCenter) return null;
        return {
            x1: fromCenter.x - boardRect.left,
            y1: fromCenter.y - boardRect.top,
            x2: toCenter.x - boardRect.left,
            y2: toCenter.y - boardRect.top,
        };
    };

    const getDragLine = (): { x1: number; y1: number; x2: number; y2: number } | null => {
        if (!activeDrag || !dragPos) return null;
        const boardEl = boardRef.current;
        const fromEl = sourceRefs.current[activeDrag];
        if (!boardEl || !fromEl) return null;
        const boardRect = boardEl.getBoundingClientRect();
        const fromCenter = getCenter(fromEl);
        if (!fromCenter) return null;
        return {
            x1: fromCenter.x - boardRect.left,
            y1: fromCenter.y - boardRect.top,
            x2: dragPos.x - boardRect.left,
            y2: dragPos.y - boardRect.top,
        };
    };

    return (
        <div
            className="workshop-screen flex flex-col select-none overflow-hidden"
            style={{ height: '100dvh', backgroundColor: 'var(--ws-base-grey)' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <WorkshopHUD title="Wiring Panel" icon="cable" currentStars={completedCount} maxStars={totalWires} />

            <main className="flex-grow flex items-center justify-center p-4 pt-24 relative overflow-hidden">
                {/* Background dots */}
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '32px 32px' }} />

                {/* Circuit Board */}
                <div
                    ref={boardRef}
                    className="relative w-full max-w-4xl rounded-3xl p-6 sm:p-8 md:p-12 z-10 mx-auto border-b-8 border-gray-800"
                    style={{ backgroundColor: 'var(--ws-dark)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}
                >
                    {/* Screws */}
                    {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                        <div key={i} className={`absolute ${pos} w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-400 border border-gray-500 flex items-center justify-center`} style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                            <div className="w-3 sm:w-4 h-0.5 sm:h-1 bg-gray-300 rounded-full" style={{ transform: `rotate(${45 * (i % 2 === 0 ? 1 : -1)}deg)` }} />
                        </div>
                    ))}

                    {/* SVG Wires Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
                        <defs>
                            <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        {/* Connected wires */}
                        {WIRES.map((wire) => {
                            if (!connections[wire.id]) return null;

                            const line = getSvgLine(wire.id, wire.id);
                            if (!line) return null;
                            return (
                                <g key={`wire-${wire.id}`}>
                                    <line {...line} stroke={wire.hexColor} strokeWidth="12" strokeLinecap="round" filter="url(#wire-glow)" opacity="0.8" />
                                    <line {...line} stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                                </g>
                            );
                        })}
                        {/* Active drag wire */}
                        {activeDrag && (() => {

                            const line = getDragLine();
                            const wire = WIRES.find((w) => w.id === activeDrag);
                            if (!line || !wire) return null;
                            return (
                                <g>
                                    <line {...line} stroke={wire.hexColor} strokeWidth="12" strokeLinecap="round" opacity="0.7" className="drop-shadow-lg" />
                                    <circle cx={line.x2} cy={line.y2} r="12" fill={wire.hexColor} stroke="white" strokeWidth="3" />
                                </g>
                            );
                        })()}
                    </svg>

                    {/* Board Content */}
                    <div className="flex flex-col md:flex-row justify-between items-center h-full gap-8 relative z-20">
                        {/* Source Sockets (Left) */}
                        <div className="flex flex-row md:flex-col gap-8 sm:gap-12">
                            {WIRES.map((wire) => {
                                const isConnected = connections[wire.id];
                                return (
                                    <div key={`src-${wire.id}`} className="flex items-center gap-3">
                                        <motion.div
                                            ref={(el) => { sourceRefs.current[wire.id] = el; }}
                                            className={`relative w-18 h-18 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center ws-touch-target ${isConnected ? '' : 'cursor-grab active:cursor-grabbing'}`}
                                            style={{
                                                backgroundColor: '#1f2937',
                                                boxShadow: 'var(--ws-shadow-plastic-down)',
                                                border: `8px solid ${wire.hexColor}`,
                                                opacity: isConnected ? 0.5 : 1,
                                            }}
                                            whileTap={isConnected ? {} : { scale: 0.95 }}
                                            onPointerDown={() => handleSourcePointerDown(wire.id)}
                                        >
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black/40 rounded-full flex items-center justify-center" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                                                <span className="material-symbols-outlined text-2xl sm:text-3xl" style={{ color: wire.hexColor, opacity: isConnected ? 1 : 0.5 }}>
                                                    {isConnected ? 'check' : 'bolt'}
                                                </span>
                                            </div>
                                        </motion.div>
                                        <span className="text-white/50 font-bold text-sm sm:text-lg hidden md:block select-none">INPUT {wire.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Center: Fuse Box */}
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[120px] sm:min-h-[200px] pointer-events-none">
                            <div className="bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-700 w-24 sm:w-32 md:w-48 flex flex-col items-center gap-3 sm:gap-4" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                                <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest workshop-heading">Fuse Box</span>
                                <div className="w-6 sm:w-8 md:w-12 h-24 sm:h-32 md:h-48 bg-white/10 rounded-full border-2 border-white/20 relative overflow-hidden backdrop-blur-sm" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                                    <div className="absolute top-0 w-full h-5 sm:h-6 bg-gradient-to-b from-gray-300 to-gray-500" />
                                    <div className="absolute bottom-0 w-full h-5 sm:h-6 bg-gradient-to-t from-gray-300 to-gray-500" />
                                    {completedCount >= totalWires && (
                                        <div className="absolute inset-0 bg-[var(--ws-green)]/30 animate-pulse" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: completedCount >= totalWires ? 'var(--ws-green)' : 'var(--ws-red)', boxShadow: `0 0 8px ${completedCount >= totalWires ? 'rgba(74,222,128,0.8)' : 'rgba(239,68,68,0.8)'}` }} />
                                    <span className="text-[10px] font-bold uppercase" style={{ color: completedCount >= totalWires ? 'var(--ws-green)' : '#F87171' }}>
                                        {completedCount >= totalWires ? 'Online' : 'Fault'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Destination Sockets (Right) */}
                        <div className="flex flex-row md:flex-col gap-8 sm:gap-12">
                            {/* Shuffled order for challenge */}
                            {destOrder.map((wire) => {
                                const isConnected = connections[wire.id];
                                const shouldGlow = !isConnected && (
                                    (adaptiveState === AdaptiveState.GUIDED && activeDrag === wire.id) ||
                                    (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY && activeDrag === wire.id)
                                );

                                return (
                                    <div key={`dest-${wire.id}`} className="flex items-center gap-3 flex-row-reverse">
                                        <div
                                            ref={(el) => { destRefs.current[wire.id] = el; }}
                                            className={`relative w-18 h-18 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center ws-touch-target transition-all duration-300`}
                                            style={{
                                                backgroundColor: '#1f2937',
                                                boxShadow: isConnected
                                                    ? `0 0 30px ${wire.hexColor}66`
                                                    : shouldGlow
                                                        ? `0 0 40px ${wire.hexColor}99`
                                                        : 'var(--ws-shadow-plastic-down)',
                                                border: `8px solid ${wire.hexColor}`,
                                                transform: shouldGlow ? 'scale(1.05)' : 'scale(1)',
                                                outline: shouldGlow ? `4px solid ${wire.hexColor}` : 'none',
                                            }}
                                        >
                                            <div
                                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
                                                style={{
                                                    backgroundColor: isConnected ? `${wire.hexColor}33` : 'rgba(0,0,0,0.4)',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                                                    border: isConnected ? `2px solid ${wire.hexColor}4D` : 'none',
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-2xl sm:text-3xl animate-pulse" style={{ color: wire.hexColor, opacity: isConnected ? 1 : 0.5 }}>
                                                    {isConnected ? 'check' : 'bolt'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-white/50 font-bold text-sm sm:text-lg hidden md:block select-none">PORT {WIRES.indexOf(wire) + 1}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 text-center pointer-events-none">
                        <p className="text-gray-500 font-bold text-xs sm:text-sm uppercase tracking-widest opacity-40">Main Circuit Board v2.0</p>
                    </div>
                </div>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />
            <HintOverlay adaptiveState={adaptiveState} hintText={hintText} showGhostHand={adaptiveState === AdaptiveState.GUIDED && !!activeDrag} />
            <VictoryModal isOpen={showVictory} starsEarned={errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1} title="Wires Connected!" subtitle="System fully operational." nextRoute="/workshop/fuel" onNext={handleComplete} />
        </div>
    );
}
