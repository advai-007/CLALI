import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAdaptation } from '../hooks/useAdaptation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import type { AdaptationState } from '../logic/adaptationMachine';
import './SpaceCargoLoader.css';

// ─── Responsive gauge direction hook ─────────────────────────────────────────

function useHorizontalGauge() {
    const [horiz, setHoriz] = useState(false);
    useEffect(() => {
        const check = () => {
            const w = window.innerWidth;
            const landscape = window.matchMedia('(orientation: landscape)').matches;
            setHoriz(w < 641 || (w < 900 && !landscape));
        };
        check();
        window.addEventListener('resize', check);
        window.addEventListener('orientationchange', check);
        return () => {
            window.removeEventListener('resize', check);
            window.removeEventListener('orientationchange', check);
        };
    }, []);
    return horiz;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPACE_CARGO_MODULE_SLUG = 'space-cargo-math';
const QUESTIONS_PER_SESSION = 8;
const TIMER_TOTAL = 30;

function getDifficultyStage(state: AdaptationState): 'challenging' | 'standard' | 'assisted' | 'guided' {
    switch (state) {
        case 'calm': return 'challenging';
        case 'mildStress': return 'standard';
        case 'highStress':
        case 'distracted': return 'assisted';
        case 'disengaged': return 'guided';
    }
}

function generateProblem(stage: 'challenging' | 'standard' | 'assisted' | 'guided') {
    const maxTotal = stage === 'challenging' ? 18 : stage === 'guided' ? 5 : 10;
    const total = Math.floor(Math.random() * (maxTotal - 3)) + 4;
    const have = Math.floor(Math.random() * (total - 1)) + 1;
    return { total, have, answer: total - have };
}

const STAGE_PROMPTS: Record<string, { mission: string; hint: string }> = {
    challenging: { mission: 'FUEL UNIT DEFICIT', hint: 'What is the missing number?' },
    standard: { mission: 'CARGO REQUIRED', hint: 'How many more units do you need?' },
    assisted: { mission: 'LOAD THE SHIP', hint: 'Drag cargo blocks into the dock!' },
    guided: { mission: 'FILL THE TANK', hint: 'Tap a block to load it!' },
};


const NARRATIVES: Record<string, string[]> = {
    challenging: [
        'The colony is running out of fuel — calculate the deficit!',
        'Commander, fuel tanks critical! Crunch those numbers!',
        'Mission control needs the shortfall calculated — now!',
        'Space station docking in 30s. Solve the equation!',
        'Elite pilot, calculate the missing fuel units!',
    ],
    standard: [
        'Load the cargo before the airlock closes!',
        'The crew is waiting — how many more blocks?',
        'Fill up the hold — departure is imminent!',
        'Double-check the manifest before launch!',
        'Every block counts. How many do we still need?',
    ],
    assisted: [
        'Drag the cargo blocks into the dock!',
        'The robots need your help — drag those crates!',
        'Slide the cargo into the docking bay!',
        'Fill the hold one block at a time!',
        'Your crew is counting on you — load it up!',
    ],
    guided: [
        'Tap each block to load it aboard!',
        'The magnetic dock is ready — tap away!',
        'One tap, one block — fill the tank!',
        'Easy does it — tap the glowing blocks!',
        'Great job, pilot — keep loading!',
    ],
};

const ALIEN_EMOJI: Record<string, string> = {
    idle: '👾',
    cheer: '🤩',
    shake: '😬',
    wave: '🤖',
};

// ─── SVG Timer Ring ───────────────────────────────────────────────────────────

function TimerRing({ timeLeft, total = TIMER_TOTAL }: { timeLeft: number; total?: number }) {
    const r = 20;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - Math.max(0, timeLeft / total));
    const color = timeLeft <= 7 ? '#f87171' : timeLeft <= 15 ? '#fbbf24' : 'var(--accent)';
    return (
        <div className="scl-timer-ring" role="timer" aria-label={`${timeLeft} seconds remaining`}>
            <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
                <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                <circle
                    cx="26" cy="26" r={r}
                    fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    transform="rotate(-90 26 26)"
                    style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                />
            </svg>
            <span className={`scl-timer-num ${timeLeft <= 7 ? 'urgent' : ''}`}>{timeLeft}</span>
        </div>
    );
}

// ─── Number Pad ───────────────────────────────────────────────────────────────

function NumberPad({ value, onChange, onSubmit, onInput }: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onInput: () => void;
}) {
    const handleKey = (k: string) => {
        onInput();
        if (k === 'DEL') { onChange(value.slice(0, -1)); return; }
        if (k === 'GO') { onSubmit(); return; }
        if (value.length >= 2) return;
        if (k === '0' && value === '') return;
        onChange(value + k);
    };
    const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['DEL', '0', 'GO']];
    return (
        <div className="scl-numpad" role="group" aria-label="Number input pad">
            <div className="scl-numpad-display" aria-live="polite" aria-label={`Input: ${value || 'empty'}`}>
                {value ? <span>{value}</span> : <span className="placeholder">?</span>}
            </div>
            <div className="scl-numpad-grid">
                {keys.map((row, ri) => row.map(k => (
                    <button
                        key={`${ri}-${k}`}
                        className={`scl-numpad-key ${k === 'GO' ? 'go' : ''} ${k === 'DEL' ? 'del' : ''}`}
                        onPointerDown={(e) => { e.preventDefault(); handleKey(k); }}
                        aria-label={k === 'DEL' ? 'Delete' : k === 'GO' ? 'Submit answer' : k}
                        type="button"
                    >
                        {k === 'DEL' ? '⌫' : k === 'GO' ? '▶' : k}
                    </button>
                )))}
            </div>
        </div>
    );
}

// ─── Touch-Draggable Cargo Block ──────────────────────────────────────────────

interface TouchBlockProps {
    emoji: string;
    onDropped: () => void;
    dropZoneRef: React.RefObject<HTMLDivElement | null>;
    magnetic: boolean;
    disabled: boolean;
    onInput: () => void;
}

function TouchBlock({ emoji, onDropped, dropZoneRef, magnetic, disabled, onInput }: TouchBlockProps) {
    const ghostRef = useRef<HTMLDivElement | null>(null);
    const isDragging = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled || magnetic) return;
        e.preventDefault();
        onInput();
        isDragging.current = true;
        const ghost = document.createElement('div');
        ghost.className = 'scl-block-ghost';
        ghost.textContent = emoji;
        Object.assign(ghost.style, {
            position: 'fixed', zIndex: '9999', pointerEvents: 'none',
            fontSize: '2.4rem', opacity: '0.85', transform: 'scale(1.2)', transition: 'none',
        });
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
        const t = e.touches[0];
        ghost.style.left = `${t.clientX - 28}px`;
        ghost.style.top = `${t.clientY - 28}px`;
    }, [disabled, magnetic, emoji, onInput]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current || !ghostRef.current) return;
        e.preventDefault();
        const t = e.touches[0];
        ghostRef.current.style.left = `${t.clientX - 28}px`;
        ghostRef.current.style.top = `${t.clientY - 28}px`;
        if (dropZoneRef.current) {
            const r = dropZoneRef.current.getBoundingClientRect();
            const over = t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
            dropZoneRef.current.classList.toggle('drag-over', over);
        }
    }, [dropZoneRef]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        ghostRef.current?.remove(); ghostRef.current = null;
        dropZoneRef.current?.classList.remove('drag-over');
        const t = e.changedTouches[0];
        if (dropZoneRef.current) {
            const r = dropZoneRef.current.getBoundingClientRect();
            if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) onDropped();
        }
    }, [dropZoneRef, onDropped]);

    return (
        <div
            className={`scl-block cargo ${magnetic ? 'magnet-block' : ''} ${disabled ? 'block-disabled' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onPointerDown={magnetic && !disabled ? (e) => { e.preventDefault(); onInput(); onDropped(); } : undefined}
            role="button"
            aria-label={magnetic ? 'Tap to load cargo' : 'Drag cargo block to the dock'}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onInput(); onDropped(); } }}
        >
            {emoji}
        </div>
    );
}

// ─── SVG: Rocket ─────────────────────────────────────────────────────────────

function RocketSVG({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
                <linearGradient id="rkt-body" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c7d2fe" />
                    <stop offset="45%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
                <linearGradient id="rkt-nose" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e0e7ff" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="rkt-fin" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
                <radialGradient id="rkt-win" cx="38%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#bae6fd" />
                    <stop offset="60%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#075985" />
                </radialGradient>
                <radialGradient id="rkt-shine" cx="30%" cy="25%" r="60%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <filter id="rkt-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
                    <feFlood floodColor="#818cf8" floodOpacity="0.6" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="shadow" />
                    <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            {/* Left fin */}
            <path d="M18 66 L5 88 L18 80 Z" fill="url(#rkt-fin)" />
            {/* Right fin */}
            <path d="M42 66 L55 88 L42 80 Z" fill="url(#rkt-fin)" />
            {/* Body */}
            <rect x="18" y="38" width="24" height="42" rx="5" fill="url(#rkt-body)" />
            {/* Nose cone */}
            <path d="M30 2 C18 18 16 30 16 40 L44 40 C44 30 42 18 30 2 Z" fill="url(#rkt-nose)" />
            {/* Body shine */}
            <rect x="18" y="38" width="24" height="42" rx="5" fill="url(#rkt-shine)" />
            {/* Porthole window */}
            <circle cx="30" cy="56" r="8" fill="url(#rkt-win)" filter="url(#rkt-glow)" />
            <circle cx="27" cy="53" r="2.8" fill="rgba(255,255,255,0.45)" />
            {/* Nozzle */}
            <rect x="21" y="78" width="18" height="5" rx="2.5" fill="#1e1b4b" />
            <rect x="23" y="83" width="14" height="3" rx="1.5" fill="#312e81" />
        </svg>
    );
}

// ─── SVG: Rocket flame (shown on correct answer) ──────────────────────────────

function FlameSVG() {
    return (
        <svg viewBox="0 0 40 54" xmlns="http://www.w3.org/2000/svg" className="scl-flame-svg" aria-hidden>
            <defs>
                <radialGradient id="fl-core" cx="50%" cy="20%" r="70%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="40%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="fl-outer" cx="50%" cy="15%" r="70%">
                    <stop offset="0%" stopColor="#fdba74" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
            </defs>
            <ellipse cx="20" cy="12" rx="9" ry="16" fill="url(#fl-core)" />
            <ellipse cx="13" cy="22" rx="6" ry="13" fill="url(#fl-outer)" opacity="0.75" />
            <ellipse cx="27" cy="22" rx="6" ry="13" fill="url(#fl-outer)" opacity="0.75" />
            <ellipse cx="20" cy="28" rx="5" ry="10" fill="url(#fl-outer)" opacity="0.5" />
        </svg>
    );
}

// ─── SVG: Planet (stage-dependent) ────────────────────────────────────────────

const PLANET_CONFIGS: Record<string, {
    c1: string; c2: string; c3: string; ring?: string; hasRing: boolean;
}> = {
    challenging: { c1: '#a78bfa', c2: '#6d28d9', c3: '#2e1065', ring: '#c4b5fd', hasRing: true },
    standard: { c1: '#60a5fa', c2: '#1d4ed8', c3: '#1e3a8a', hasRing: false },
    assisted: { c1: '#34d399', c2: '#059669', c3: '#064e3b', hasRing: false },
    guided: { c1: '#6b7280', c2: '#374151', c3: '#111827', ring: '#9ca3af', hasRing: true },
};

function PlanetSVG({ stage, className }: { stage: string; className?: string }) {
    const cfg = PLANET_CONFIGS[stage] ?? PLANET_CONFIGS.challenging;
    const id = `pl-${stage}`;
    return (
        <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
                <radialGradient id={`${id}-body`} cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={cfg.c1} />
                    <stop offset="55%" stopColor={cfg.c2} />
                    <stop offset="100%" stopColor={cfg.c3} />
                </radialGradient>
                <radialGradient id={`${id}-shine`} cx="32%" cy="28%" r="55%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <clipPath id={`${id}-clip`}>
                    <circle cx="100" cy="100" r="72" />
                </clipPath>
            </defs>
            {/* Ring behind (only for ringed planets) */}
            {cfg.hasRing && (
                <ellipse cx="100" cy="125" rx="98" ry="22"
                    fill="none" stroke={cfg.ring} strokeWidth="10" opacity="0.35" />
            )}
            {/* Planet body */}
            <circle cx="100" cy="100" r="72" fill={`url(#${id}-body)`} />
            {/* Surface bands */}
            <g clipPath={`url(#${id}-clip)`} opacity="0.18">
                <ellipse cx="100" cy="80" rx="72" ry="14" fill="white" />
                <ellipse cx="100" cy="115" rx="72" ry="10" fill="white" />
            </g>
            {/* Shine */}
            <circle cx="100" cy="100" r="72" fill={`url(#${id}-shine)`} />
            {/* Ring in front */}
            {cfg.hasRing && (
                <ellipse cx="100" cy="125" rx="98" ry="22"
                    fill="none" stroke={cfg.ring} strokeWidth="6" opacity="0.55"
                    strokeDasharray="60 20" />
            )}
        </svg>
    );
}

// ─── SVG: Feedback icons ──────────────────────────────────────────────────────

function CheckIcon() {
    return (
        <svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" className="fb-svg-icon" aria-hidden>
            <defs>
                <radialGradient id="chk-bg" cx="40%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#059669" />
                </radialGradient>
            </defs>
            <circle cx="28" cy="28" r="26" fill="url(#chk-bg)" />
            <circle cx="28" cy="28" r="26" fill="rgba(255,255,255,0.15)" />
            <polyline points="14,28 24,38 42,18" fill="none"
                stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function FlameIcon() {
    return (
        <svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" className="fb-svg-icon" aria-hidden>
            <defs>
                <radialGradient id="fli-bg" cx="40%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#c2410c" />
                </radialGradient>
            </defs>
            <circle cx="28" cy="28" r="26" fill="url(#fli-bg)" />
            <circle cx="28" cy="28" r="26" fill="rgba(255,255,255,0.12)" />
            {/* Flame path */}
            <path d="M28 10 C22 18 18 22 20 30 C16 26 17 20 19 16 C14 22 13 30 18 36 C20 40 24 43 28 44 C32 43 36 40 38 36 C43 30 42 22 37 16 C39 20 40 26 36 30 C38 22 34 18 28 10 Z"
                fill="white" opacity="0.92" />
        </svg>
    );
}

function StarIcon() {
    return (
        <svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" className="fb-svg-icon" aria-hidden>
            <defs>
                <radialGradient id="sti-bg" cx="40%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#d97706" />
                </radialGradient>
            </defs>
            <circle cx="28" cy="28" r="26" fill="url(#sti-bg)" />
            <circle cx="28" cy="28" r="26" fill="rgba(255,255,255,0.15)" />
            <polygon points="28,12 32,23 44,23 34,30 38,42 28,35 18,42 22,30 12,23 24,23"
                fill="white" opacity="0.95" />
        </svg>
    );
}

function MissIcon() {
    return (
        <svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" className="fb-svg-icon" aria-hidden>
            <defs>
                <radialGradient id="mis-bg" cx="40%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#fca5a5" />
                    <stop offset="100%" stopColor="#b91c1c" />
                </radialGradient>
            </defs>
            <circle cx="28" cy="28" r="26" fill="url(#mis-bg)" />
            <circle cx="28" cy="28" r="26" fill="rgba(255,255,255,0.12)" />
            <line x1="18" y1="18" x2="38" y2="38" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="38" y1="18" x2="18" y2="38" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
    );
}

function SwitchIcon() {
    return (
        <svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" className="fb-svg-icon" aria-hidden>
            <defs>
                <radialGradient id="swi-bg" cx="40%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#a5b4fc" />
                    <stop offset="100%" stopColor="#4338ca" />
                </radialGradient>
            </defs>
            <circle cx="28" cy="28" r="26" fill="url(#swi-bg)" />
            <circle cx="28" cy="28" r="26" fill="rgba(255,255,255,0.12)" />
            {/* Gear / switch arrows */}
            <path d="M28 16 A12 12 0 0 1 40 28" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="40,22 44,28 36,28" fill="white" />
            <path d="M28 40 A12 12 0 0 1 16 28" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="16,34 12,28 20,28" fill="white" />
        </svg>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────


export default function SpaceCargoLoader() {
    const navigate = useNavigate();
    const { studentUser } = useAuth();
    const { state: adaptState, override, scores } = useAdaptation({ autoStart: true });
    const horizontalGauge = useHorizontalGauge();

    const stage = getDifficultyStage(adaptState);
    const prompt = STAGE_PROMPTS[stage];

    // ── Core game state ────────────────────────────────────────────────────────
    const [problem, setProblem] = useState(() => generateProblem(stage));
    const [score, setScore] = useState(0);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [answered, setAnswered] = useState(false);
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [gaugeLevel, setGaugeLevel] = useState(0);
    const [sessionDone, setSessionDone] = useState(false);
    const [saving, setSaving] = useState(false);
    const [droppedBlocks, setDroppedBlocks] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);

    // ── Enhancement state ──────────────────────────────────────────────────────
    const [streak, setStreak] = useState(0);
    const [showCombo, setShowCombo] = useState(false);
    const [comboText, setComboText] = useState('');
    const [alienMood, setAlienMood] = useState<'idle' | 'cheer' | 'shake' | 'wave'>('idle');
    const [showFlame, setShowFlame] = useState(false);
    const [showParticles, setShowParticles] = useState(false);
    const [shakeCard, setShakeCard] = useState(false);
    const [narrative, setNarrative] = useState('');
    const [timePanicFired, setTimePanicFired] = useState(false);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const sessionStartRef = useRef(Date.now());
    const moduleIdRef = useRef<string | null>(null);
    const finalStageRef = useRef(stage);
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const streakRef = useRef(0);                  // mirrors streak for callbacks
    const recentResultsRef = useRef<boolean[]>([]); // last 3 question results
    const consecutiveFastRef = useRef(0);
    const questionStartTimeRef = useRef(Date.now());
    const lastInputTimeRef = useRef(Date.now());

    useEffect(() => { finalStageRef.current = stage; }, [stage]);

    // ── Fetch module id ────────────────────────────────────────────────────────
    useEffect(() => {
        supabase.from('learning_modules' as any).select('id')
            .eq('slug', SPACE_CARGO_MODULE_SLUG).single()
            .then(({ data }) => { if (data) moduleIdRef.current = (data as any).id; });
    }, []);

    // ── Pick narrative + reset per-question timers ─────────────────────────────
    useEffect(() => {
        const pool = NARRATIVES[stage] ?? NARRATIVES.standard;
        setNarrative(pool[Math.floor(Math.random() * pool.length)]);
        questionStartTimeRef.current = Date.now();
        lastInputTimeRef.current = Date.now();
        setTimePanicFired(false);
    }, [questionNumber, stage]);

    // ── Adaptation: time panic (challenging / standard) ───────────────────────
    const showTimer = stage === 'challenging' || stage === 'standard';
    useEffect(() => {
        if (!showTimer || answered || sessionDone || timePanicFired) return;
        if (timeLeft <= 7 && timeLeft > 0) {
            setTimePanicFired(true);
            override('mildStress');
            console.info('[adapt] time panic → mildStress');
        }
    }, [timeLeft, showTimer, answered, sessionDone, timePanicFired, override]);

    // ── Adaptation: idle downgrade (assisted / guided) ────────────────────────
    useEffect(() => {
        if (stage !== 'assisted' && stage !== 'guided') return;
        if (answered || sessionDone) return;
        const id = setInterval(() => {
            if (Date.now() - lastInputTimeRef.current > 12000) {
                override('disengaged');
                console.info('[adapt] idle 12 s → disengaged');
                clearInterval(id);
            }
        }, 2000);
        return () => clearInterval(id);
    }, [questionNumber, stage, answered, sessionDone, override]);

    // ── Input idle reset ───────────────────────────────────────────────────────
    const idleReset = useCallback(() => { lastInputTimeRef.current = Date.now(); }, []);

    // ── Next question ──────────────────────────────────────────────────────────
    const nextQuestion = useCallback(() => {
        if (questionNumber >= QUESTIONS_PER_SESSION) { setSessionDone(true); return; }
        const ns = getDifficultyStage(adaptState);
        const changed = ns !== stage;
        setProblem(generateProblem(ns));
        setQuestionNumber(q => q + 1);
        setAnswered(false);
        setLastCorrect(null);
        setInputValue('');
        setDroppedBlocks(0);
        // Only reset the gauge between questions for visual stages (block-drop progress);
        // for timed stages the gauge accumulates across the whole session.
        if (ns === 'assisted' || ns === 'guided') setGaugeLevel(0);
        setWrongAttempts(0);
        setTimeLeft(TIMER_TOTAL);
        if (changed) {
            setAlienMood('wave');
            setTimeout(() => setAlienMood(m => m === 'wave' ? 'idle' : m), 1500);
        }
    }, [questionNumber, adaptState, stage]);

    // ── Handle answer (core + all adaptation triggers) ─────────────────────────
    const handleAnswer = useCallback((userAnswer: number) => {
        if (answered) return;
        const correct = userAnswer === problem.answer;
        const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
        setAnswered(true);
        setLastCorrect(correct);

        // Update rolling results ref
        recentResultsRef.current = [...recentResultsRef.current.slice(-2), correct];

        if (correct) {
            const newScore = score + 1;
            setScore(newScore);
            // Gauge = session progress (fills 1/8 per correct answer)
            // For assisted/guided the block-drop handler controls the gauge;
            // here we only update it for timed stages.
            if (stage !== 'assisted' && stage !== 'guided') {
                setGaugeLevel(Math.round((newScore / QUESTIONS_PER_SESSION) * 100));
            }
            setShowFlame(true);
            setShowParticles(true);
            setAlienMood('cheer');
            setTimeout(() => {
                setShowFlame(false);
                setShowParticles(false);
                setAlienMood(m => m === 'cheer' ? 'idle' : m);
            }, 1800);

            const newStreak = streakRef.current + 1;
            streakRef.current = newStreak;
            setStreak(newStreak);

            // Combo display
            if (newStreak >= 5) {
                setComboText('PERFECT PILOT ⚡');
                setShowCombo(true);
                setTimeout(() => setShowCombo(false), 2200);
            } else if (newStreak >= 3) {
                setComboText(`${newStreak}× Combo! 🔥`);
                setShowCombo(true);
                setTimeout(() => setShowCombo(false), 1800);
            }

            // ── Adaptation: 3-streak upgrade ──────────────────────────────
            if (newStreak === 3 || newStreak === 6 || newStreak === 9) {
                override('calm');
                console.info(`[adapt] streak ${newStreak} → calm`);
            }

            // ── Adaptation: speed bonus (timed stages, < 8 s) ─────────────
            if (showTimer && elapsed < 8) {
                consecutiveFastRef.current += 1;
                if (consecutiveFastRef.current >= 2) {
                    override('calm');
                    console.info(`[adapt] ${consecutiveFastRef.current}× fast → calm`);
                } else {
                    override('calm');
                    console.info(`[adapt] speed bonus ${elapsed.toFixed(1)}s → calm`);
                }
            } else {
                consecutiveFastRef.current = 0;
            }

        } else {
            // Wrong answer — gauge stays at current session level (no penalty drain)
            streakRef.current = 0;
            setStreak(0);
            consecutiveFastRef.current = 0;
            setShakeCard(true);
            setAlienMood('shake');
            setTimeout(() => {
                setShakeCard(false);
                setAlienMood(m => m === 'shake' ? 'idle' : m);
            }, 700);

            // ── Adaptation: consistent struggle (2 wrong in last 3 by attempt count) ──
            const wrongCount = recentResultsRef.current.filter(r => !r).length;
            if (wrongCount >= 2) {
                override('distracted');
                console.info('[adapt] consistent struggle → distracted');
            }

            // ── Adaptation: within-question wrong attempts ─────────────────
            setWrongAttempts(w => {
                const nw = w + 1;
                if (nw >= 2) {
                    if (stage === 'challenging') override('mildStress');
                    else if (stage === 'standard') override('distracted');
                    console.info(`[adapt] ${nw} wrong attempts → downgrade`);
                }
                return nw;
            });
        }

        setTimeout(nextQuestion, 2200);
    }, [answered, problem.answer, stage, override, nextQuestion, showTimer, score]);

    // ── Block drop (assisted/guided) ───────────────────────────────────────────
    const handleBlockDrop = useCallback(() => {
        if (answered) return;
        idleReset();
        const nd = droppedBlocks + 1;
        setDroppedBlocks(nd);
        setGaugeLevel(Math.min(100, Math.round((nd / problem.answer) * 100)));
        if (nd >= problem.answer) handleAnswer(problem.answer);
    }, [answered, droppedBlocks, problem.answer, handleAnswer, idleReset]);

    // ── Countdown timer ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!showTimer || answered || sessionDone) return;
        setTimeLeft(TIMER_TOTAL);
        const id = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(id); handleAnswer(-1); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionNumber, showTimer]);

    // ── Save session ───────────────────────────────────────────────────────────
    const saveSession = useCallback(async () => {
        if (!studentUser?.id || !moduleIdRef.current) return;
        setSaving(true);
        try {
            await supabase.from('learning_progress' as any).insert({
                student_id: studentUser.id,
                module_id: moduleIdRef.current,
                session_id: crypto.randomUUID(),
                difficulty_stage: finalStageRef.current,
                score,
                total_questions: QUESTIONS_PER_SESSION,
                duration_seconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
                completed_at: new Date().toISOString(),
            });
        } catch (e) { console.error('Failed to save session:', e); }
        finally { setSaving(false); }
    }, [studentUser?.id, score]);

    useEffect(() => { if (sessionDone) saveSession(); }, [sessionDone, saveSession]);

    const cargoBlockCount = Math.min(problem.answer, 8);
    const magnetic = stage === 'guided';

    // ── End screen ─────────────────────────────────────────────────────────────
    if (sessionDone) {
        const perfect = score === QUESTIONS_PER_SESSION;
        return (
            <div className="scl-end-screen">
                <div className="scl-stars" aria-hidden />
                <motion.div className="scl-end-card"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
                    <div className="scl-end-icon">{perfect ? '🏆' : '🚀'}</div>
                    <h2>{perfect ? 'PERFECT MISSION!' : 'Mission Complete!'}</h2>
                    <p className="scl-end-score">{score} / {QUESTIONS_PER_SESSION}</p>
                    <p className="scl-end-label">
                        {score >= 7 ? 'Outstanding pilot! 🌟' : score >= 5 ? 'Good work! 👍' : 'Keep practising! 💪'}
                    </p>
                    {saving && <p className="scl-saving">Saving mission log…</p>}
                    <div className="scl-end-btns">
                        <button className="scl-btn-primary" onPointerDown={() => {
                            setScore(0); setQuestionNumber(1); setSessionDone(false);
                            setProblem(generateProblem(stage)); setGaugeLevel(0);
                            setStreak(0); streakRef.current = 0;
                            recentResultsRef.current = [];
                            sessionStartRef.current = Date.now();
                        }}>
                            Fly Again 🚀
                        </button>
                        <button className="scl-btn-secondary" onPointerDown={() => navigate('/dashboard')}>
                            Back to Base
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Main game ──────────────────────────────────────────────────────────────
    return (
        <div className={`scl-root stage-${stage}`} style={{ overflowX: 'hidden' }}>
            <div className="scl-stars" aria-hidden />

            {/* Backdrop planet */}
            <PlanetSVG stage={stage} className="scl-planet" />

            {/* ── HUD ── */}
            <header className="scl-hud">
                <button className="scl-back" onPointerDown={() => navigate('/dashboard')} aria-label="Back to dashboard">
                    ← Base
                </button>
                <div className="scl-hud-center" style={{ minWidth: 0, flex: '1 1 0', textAlign: 'center', overflow: 'hidden' }}>
                    <span className="scl-mission-label">{prompt.mission}</span>
                    <span className="scl-progress">{questionNumber} / {QUESTIONS_PER_SESSION}</span>
                </div>
                <div className="scl-hud-right">
                    {/* Alien co-pilot */}
                    <span className={`scl-alien scl-alien-${alienMood}`} aria-label={`Co-pilot: ${alienMood}`}>
                        {ALIEN_EMOJI[alienMood]}
                    </span>
                    {/* Streak badge */}
                    {streak >= 2 && (
                        <motion.span
                            className="scl-streak-badge"
                            key={streak}
                            initial={{ scale: 1.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            🔥 {streak}
                        </motion.span>
                    )}
                    <span className="scl-score-badge">⭐ {score}</span>
                    {showTimer && <TimerRing timeLeft={timeLeft} total={TIMER_TOTAL} />}
                </div>
            </header>

            {/* Combo burst */}
            <AnimatePresence>
                {showCombo && (
                    <motion.div
                        className="scl-combo-burst"
                        initial={{ scale: 0.5, opacity: 0, y: 10 }}
                        animate={{ scale: 1.05, opacity: 1, y: 0 }}
                        exit={{ scale: 1.3, opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {comboText}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dev badge */}
            <div className="scl-state-badge" title={`stress ${scores.stress.toFixed(2)} focus ${scores.focus.toFixed(2)}`}>
                {adaptState} → <strong>{stage}</strong>
            </div>

            <main className="scl-main">
                {/* ── Ship Panel ── */}
                <section className="scl-ship-panel">
                    <div className="scl-ship-wrapper">
                        <div className="scl-rocket-container">
                            <motion.div
                                className="scl-rocket"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <RocketSVG className="scl-rocket-svg" />
                            </motion.div>
                            {/* Rocket flame */}
                            <AnimatePresence>
                                {showFlame && (
                                    <motion.div
                                        className="scl-flame"
                                        initial={{ opacity: 0, scaleY: 0.3 }}
                                        animate={{ opacity: 1, scaleY: 1 }}
                                        exit={{ opacity: 0, scaleY: 0 }}
                                        transition={{ duration: 0.2 }}
                                        aria-hidden
                                    >
                                        <FlameSVG />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Particle burst */}
                            {showParticles && (
                                <div className="scl-particles" aria-hidden>
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className={`scl-particle scl-particle-${i}`} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div
                            className="scl-gauge-track"
                            aria-label={`Fuel gauge: ${gaugeLevel}%`}
                            role="progressbar"
                            aria-valuenow={gaugeLevel}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        >
                            <motion.div
                                className="scl-gauge-fill"
                                animate={
                                    horizontalGauge
                                        ? { width: `${gaugeLevel}%`, height: '100%' }
                                        : { height: `${gaugeLevel}%`, width: '100%' }
                                }
                                transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                            />
                            <div className="scl-gauge-label">FUEL</div>
                        </div>
                    </div>

                    {/* Drop zone (assisted / guided) */}
                    {(stage === 'assisted' || stage === 'guided') && (
                        <div
                            ref={dropZoneRef}
                            className={`scl-drop-zone ${magnetic ? 'magnet-active' : ''}`}
                            aria-label="Cargo dock — drag blocks here"
                            aria-dropeffect="copy"
                        >
                            <span className="scl-drop-icon">{magnetic ? '⚡' : '🛸'}</span>
                            <span className="scl-drop-label">{magnetic ? 'Magnetic Dock' : 'Cargo Dock'}</span>
                            <span className="scl-blocks-count" aria-label={`${droppedBlocks} of ${problem.answer} loaded`}>
                                {droppedBlocks} / {problem.answer}
                            </span>
                        </div>
                    )}
                </section>

                {/* ── Problem Panel ── */}
                <section className="scl-problem-panel">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={questionNumber}
                            className={`scl-problem-card ${shakeCard ? 'scl-shake' : ''}`}
                            initial={{ x: 70, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -70, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                        >
                            {/* Narrative briefing */}
                            <p className="scl-narrative" aria-live="polite">📡 {narrative}</p>

                            {/* CHALLENGING: equation */}
                            {stage === 'challenging' && (
                                <div className="scl-equation" aria-label={`${problem.have} plus blank equals ${problem.total}`}>
                                    <span className="eq-num">{problem.have}</span>
                                    <span className="eq-op">+</span>
                                    <span className="eq-blank" aria-hidden>?</span>
                                    <span className="eq-op">=</span>
                                    <span className="eq-num">{problem.total}</span>
                                </div>
                            )}

                            {/* STANDARD: word problem */}
                            {stage === 'standard' && (
                                <div className="scl-word-problem">
                                    <div className="scl-word-numbers">
                                        <div className="scl-word-stat">
                                            <span className="stat-val">{problem.have}</span>
                                            <span className="stat-lbl">loaded</span>
                                        </div>
                                        <div className="scl-word-arrow">→</div>
                                        <div className="scl-word-stat">
                                            <span className="stat-val">{problem.total}</span>
                                            <span className="stat-lbl">needed</span>
                                        </div>
                                    </div>
                                    <p className="scl-word-text">How many more cargo blocks?</p>
                                </div>
                            )}

                            {/* ASSISTED / GUIDED: visual blocks */}
                            {(stage === 'assisted' || stage === 'guided') && (
                                <div className="scl-visual-section">
                                    <div className="scl-capacity-bar" aria-label="Ship capacity">
                                        <span>Capacity: {problem.total}</span>
                                        <span>Loaded: {problem.have}</span>
                                    </div>
                                    <div className="scl-blocks-row" aria-label="Cargo blocks">
                                        {Array.from({ length: problem.have }).map((_, i) => (
                                            <div key={`ld-${i}`} className="scl-block loaded" aria-label="Already loaded" />
                                        ))}
                                        {Array.from({ length: cargoBlockCount }).map((_, i) => (
                                            <TouchBlock
                                                key={`cb-${i}-q${questionNumber}`}
                                                emoji="📦"
                                                onDropped={handleBlockDrop}
                                                dropZoneRef={dropZoneRef}
                                                magnetic={magnetic}
                                                disabled={answered || droppedBlocks >= problem.answer}
                                                onInput={idleReset}
                                            />
                                        ))}
                                    </div>
                                    {stage === 'guided' && <p className="scl-guided-tip">👆 Tap any block to load it!</p>}
                                    {stage === 'assisted' && <p className="scl-guided-tip">Drag a block to the dock 👆</p>}
                                </div>
                            )}

                            {/* Number pad (challenging / standard) */}
                            {(stage === 'challenging' || stage === 'standard') && !answered && (
                                <NumberPad
                                    value={inputValue}
                                    onChange={setInputValue}
                                    onSubmit={() => { if (inputValue) handleAnswer(parseInt(inputValue, 10)); }}
                                    onInput={idleReset}
                                />
                            )}

                            {/* Feedback overlay */}
                            <AnimatePresence>
                                {lastCorrect !== null && (() => {
                                    // Build the content based on result + streak/wrong state
                                    const s = streakRef.current;
                                    const cfg = lastCorrect
                                        ? s >= 5
                                            ? { icon: <StarIcon />, title: 'PERFECT PILOT!', sub: 'You are unstoppable!', type: 'perfect' }
                                            : s >= 3
                                                ? { icon: <FlameIcon />, title: `${s}× COMBO!`, sub: 'Keep the streak going!', type: 'combo' }
                                                : { icon: <CheckIcon />, title: 'CARGO LOADED!', sub: 'The mission advances.', type: 'correct' }
                                        : wrongAttempts >= 2
                                            ? { icon: <SwitchIcon />, title: 'SWITCHING MODE', sub: 'Adjusting mission difficulty…', type: 'switch' }
                                            : { icon: <MissIcon />, title: 'MISS!', sub: 'Recalculating — try again!', type: 'wrong' };

                                    return (
                                        <motion.div
                                            className={`scl-feedback fb-${cfg.type}`}
                                            initial={{ opacity: 0, scale: 0.75, y: 12 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 1.1, y: -10 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                        >
                                            <motion.div
                                                className="fb-icon"
                                                initial={{ scale: 0, rotate: -20 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ delay: 0.08, type: 'spring', stiffness: 400, damping: 18 }}
                                                aria-hidden
                                            >
                                                {cfg.icon}
                                            </motion.div>
                                            <motion.p
                                                className="fb-title"
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                            >
                                                {cfg.title}
                                            </motion.p>
                                            <motion.p
                                                className="fb-sub"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.22 }}
                                            >
                                                {cfg.sub}
                                            </motion.p>
                                        </motion.div>
                                    );
                                })()}
                            </AnimatePresence>
                        </motion.div>
                    </AnimatePresence>
                </section>
            </main>
        </div>
    );
}
