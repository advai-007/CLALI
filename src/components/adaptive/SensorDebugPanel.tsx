import { useState } from 'react';
import {
    Activity, Eye, Brain, Clock, Smartphone, Hand, Move,
    Scroll, Fingerprint, RotateCw, Grip, ChevronDown, ChevronUp
} from 'lucide-react';
import type { ExtractedFeatures } from '../../utils/tracking/FeatureExtractor';
import type { FaceMetrics } from '../../utils/tracking/FaceFeatureExtractor';
import type { AdaptationState } from '../../logic/adaptationMachine';
import { ALL_STATES } from '../../logic/adaptationMachine';

interface SensorDebugPanelProps {
    state: AdaptationState;
    scores: { stress: number; focus: number };
    blinkRate: number;
    timeOnTask: number;
    rawFeatures: ExtractedFeatures | null;
    faceMetrics: FaceMetrics | null;
    override: (state: AdaptationState) => void;
}

const STATE_LABELS: Record<AdaptationState, { label: string; color: string }> = {
    calm: { label: 'Calm', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    mildStress: { label: 'Mild Stress', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    highStress: { label: 'High Stress', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    distracted: { label: 'Distracted', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    disengaged: { label: 'Disengaged', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

type SectionId = 'scores' | 'behavioral' | 'tablet' | 'face' | 'override';

const ScoreBar = ({ value, max, colorFrom, colorTo, label, unit = '' }: {
    value: number; max: number; colorFrom: string; colorTo: string; label: string; unit?: string;
}) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-20 truncate">{label}</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${colorFrom} ${colorTo}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-[10px] text-slate-400 w-14 text-right font-mono">
                {typeof value === 'number' ? value.toFixed(2) : '—'}{unit}
            </span>
        </div>
    );
};

const MetricRow = ({ icon, label, value, unit = '' }: {
    icon: React.ReactNode; label: string; value: string | number; unit?: string;
}) => (
    <div className="flex items-center gap-1.5 py-0.5">
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span className="text-[10px] text-slate-500 flex-1 truncate">{label}</span>
        <span className="text-[10px] font-mono text-slate-700 font-medium">
            {typeof value === 'number' ? value.toFixed(2) : value}{unit}
        </span>
    </div>
);

const SectionHeader = ({ title, icon, expanded, onToggle }: {
    title: string; icon: React.ReactNode; expanded: boolean; onToggle: () => void;
}) => (
    <button
        onClick={onToggle}
        className="flex items-center gap-1.5 w-full py-1 text-left group"
    >
        <span className="text-slate-400 group-hover:text-slate-600 transition-colors">{icon}</span>
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex-1">{title}</span>
        {expanded
            ? <ChevronUp size={12} className="text-slate-400" />
            : <ChevronDown size={12} className="text-slate-400" />
        }
    </button>
);

export const SensorDebugPanel = ({
    state, scores, blinkRate, timeOnTask, rawFeatures, faceMetrics, override
}: SensorDebugPanelProps) => {
    const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
        scores: true,
        behavioral: true,
        tablet: true,
        face: true,
        override: true,
    });
    const [minimized, setMinimized] = useState(false);

    const toggle = (section: SectionId) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (minimized) {
        return (
            <button
                onClick={() => setMinimized(false)}
                className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200 z-50 flex items-center gap-2 hover:bg-white transition-colors"
            >
                <Activity size={14} className="text-rose-500" />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATE_LABELS[state].color}`}>
                    {STATE_LABELS[state].label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                    S:{scores.stress.toFixed(1)} F:{scores.focus.toFixed(1)}
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 z-50 w-80 max-h-[85vh] flex flex-col font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Sensor Debug</h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${STATE_LABELS[state].color}`}>
                        {STATE_LABELS[state].label}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock size={9} />{Math.floor(timeOnTask)}s
                    </span>
                    <button
                        onClick={() => setMinimized(true)}
                        className="text-slate-400 hover:text-slate-600 ml-1 p-0.5 rounded hover:bg-slate-100"
                        title="Minimize"
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-3 py-2 space-y-2 flex-1">
                {/* ─── Normalized Scores ─── */}
                <div>
                    <SectionHeader title="Normalized Scores" icon={<Brain size={12} />} expanded={expanded.scores} onToggle={() => toggle('scores')} />
                    {expanded.scores && (
                        <div className="space-y-1.5 pl-4 pb-1">
                            <ScoreBar value={scores.stress} max={1} colorFrom="from-amber-400" colorTo="to-rose-500" label="Stress" />
                            <ScoreBar value={scores.focus} max={1} colorFrom="from-blue-400" colorTo="to-emerald-500" label="Focus" />
                            <div className="flex items-center gap-3 mt-1">
                                <MetricRow icon={<Eye size={10} />} label="Blinks" value={blinkRate} unit="/m" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100" />

                {/* ─── Behavioral Sensors ─── */}
                <div>
                    <SectionHeader title="Behavioral Sensors" icon={<Hand size={12} />} expanded={expanded.behavioral} onToggle={() => toggle('behavioral')} />
                    {expanded.behavioral && (
                        <div className="space-y-0.5 pl-4 pb-1">
                            <MetricRow icon={<Fingerprint size={10} />} label="Frantic Taps" value={rawFeatures?.franticTaps ?? 0} />
                            <MetricRow icon={<Scroll size={10} />} label="Scroll Yo-Yo" value={rawFeatures?.scrollYoYoCount ?? 0} />
                            <MetricRow icon={<Move size={10} />} label="Motion Mag." value={rawFeatures?.motionMagnitude ?? 0} />
                            <MetricRow icon={<Hand size={10} />} label="Touch Hold" value={rawFeatures?.touchHoldDuration ?? 0} unit="ms" />
                            <div className="flex items-center gap-3 mt-0.5">
                                <div className={`w-2 h-2 rounded-full ${rawFeatures?.isIdle ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span className="text-[10px] text-slate-500">{rawFeatures?.isIdle ? 'Idle' : 'Active'}</span>
                                <div className={`w-2 h-2 rounded-full ml-2 ${rawFeatures?.isVisible ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <span className="text-[10px] text-slate-500">{rawFeatures?.isVisible ? 'Visible' : 'Hidden'}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100" />

                {/* ─── Tablet Sensors ─── */}
                <div>
                    <SectionHeader title="Tablet Sensors" icon={<Smartphone size={12} />} expanded={expanded.tablet} onToggle={() => toggle('tablet')} />
                    {expanded.tablet && (
                        <div className="space-y-0.5 pl-4 pb-1">
                            <ScoreBar value={rawFeatures?.tiltVariance ?? 0} max={100} colorFrom="from-violet-400" colorTo="to-fuchsia-500" label="Tilt Variance" />
                            <ScoreBar value={rawFeatures?.avgTouchPressure ?? 0} max={1} colorFrom="from-orange-400" colorTo="to-red-500" label="Touch Pressure" />
                            <MetricRow icon={<Grip size={10} />} label="Grip Touches" value={rawFeatures?.gripTouchCount ?? 0} />
                            <MetricRow icon={<RotateCw size={10} />} label="Orient. Changes" value={rawFeatures?.orientationChangeRate ?? 0} />
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100" />

                {/* ─── Face Biometrics ─── */}
                <div>
                    <SectionHeader title="Face Biometrics" icon={<Eye size={12} />} expanded={expanded.face} onToggle={() => toggle('face')} />
                    {expanded.face && (
                        <div className="space-y-0.5 pl-4 pb-1">
                            {faceMetrics ? (
                                <>
                                    <ScoreBar value={faceMetrics.ear} max={0.5} colorFrom="from-cyan-400" colorTo="to-blue-500" label="EAR" />
                                    <MetricRow icon={<RotateCw size={10} />} label="Head Pitch" value={faceMetrics.headPitch} />
                                    <MetricRow icon={<RotateCw size={10} />} label="Head Yaw" value={faceMetrics.headYaw} />
                                    <MetricRow icon={<RotateCw size={10} />} label="Head Roll" value={(faceMetrics.headRoll * 180 / Math.PI)} unit="°" />
                                </>
                            ) : (
                                <div className="text-[10px] text-slate-400 italic py-1">
                                    No camera connected. Enable face tracking from calibration page.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100" />

                {/* ─── State Override ─── */}
                <div>
                    <SectionHeader title="State Override" icon={<Activity size={12} />} expanded={expanded.override} onToggle={() => toggle('override')} />
                    {expanded.override && (
                        <div className="flex flex-wrap gap-1 pl-4 pb-1">
                            {ALL_STATES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => override(s)}
                                    className={`px-2 py-1 text-[10px] rounded-md font-medium border transition-colors ${state === s
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    {STATE_LABELS[s].label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
