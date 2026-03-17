import { StationStatus, type GameStation, type StationInfo } from './workshopTypes';

export const WORKSHOP_FLOW: GameStation[] = ['tires', 'bolts', 'wiring', 'fuel'];

export const WORKSHOP_STATIONS: StationInfo[] = [
    {
        id: 'tires',
        title: 'Tire Balance Bay',
        icon: 'tire_repair',
        route: '/workshop/tires',
        status: StationStatus.AVAILABLE,
    },
    {
        id: 'bolts',
        title: 'Bolt Tightening',
        icon: 'build',
        route: '/workshop/bolts',
        status: StationStatus.LOCKED,
    },
    {
        id: 'wiring',
        title: 'Wiring Panel',
        icon: 'cable',
        route: '/workshop/wiring',
        status: StationStatus.LOCKED,
    },
    {
        id: 'fuel',
        title: 'Fuel Mix Monitor',
        icon: 'local_gas_station',
        route: '/workshop/fuel',
        status: StationStatus.LOCKED,
    },
];

export interface WorkshopMissionCopy {
    headline: string;
    objective: string;
    tip: string;
}

export const WORKSHOP_MISSIONS: Record<GameStation, WorkshopMissionCopy> = {
    tires: {
        headline: 'Balance the wheel',
        objective: 'Drag the right mix of weights onto the rim until the total matches the target.',
        tip: 'Start with the biggest weight that still fits the remaining amount.',
    },
    bolts: {
        headline: 'Secure the engine',
        objective: 'Memorize the bolt order, then tighten each bolt in the same sequence.',
        tip: 'Use the order reveal if you need another quick look.',
    },
    wiring: {
        headline: 'Restore the circuit',
        objective: 'Match each colored wire to the port with the same color.',
        tip: 'You can drag wires or tap a wire and then tap a port.',
    },
    fuel: {
        headline: 'Fill the tank safely',
        objective: 'Pour fuel canisters until the tank reaches the exact target level.',
        tip: 'Bigger cans get you there faster, but only if they do not overflow the tank.',
    },
};
