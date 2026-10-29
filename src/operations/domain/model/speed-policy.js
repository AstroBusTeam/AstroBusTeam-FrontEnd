export const SPEED_LIMIT_KMH = 60;

export const SPEED_WARNING_KMH = 48;

export function speedStatus(speedKmh) {
    if (speedKmh > SPEED_LIMIT_KMH) return 'overspeed';
    if (speedKmh > SPEED_WARNING_KMH) return 'warning';
    return 'normal';
}

export function assessDriver({ rating = 0, shifts = [] } = {}) {
    // suma de excesos, incidentes y la velocidad máxima registrada
    const overspeedEvents = shifts.reduce((total, shift) => total + (shift.overspeedEvents ?? 0), 0);
    const incidents = shifts.reduce((total, shift) => total + (shift.incidents ?? 0), 0);
    const maxSpeedKmh = shifts.reduce((max, shift) => Math.max(max, shift.maxSpeedKmh ?? 0), 0);

    const averageOf = (shift) => shift.averageSpeed ?? shift.averageSpeedKmh ?? 0;
    const speeds = shifts.map(averageOf).filter(speed => speed > 0);
    const averageSpeedKmh = speeds.length
        ? Math.round(speeds.reduce((total, speed) => total + speed, 0) / speeds.length * 10) / 10
        : null;

    const hasData = shifts.length > 0 || rating > 0;
    const base = rating > 0 ? rating * 20 : 80;

    const score = Math.max(0, Math.min(100, Math.round(base - overspeedEvents * 3 - incidents * 5)));
    const level = !hasData ? 'unknown' : score >= 85 ? 'good' : score >= 60 ? 'regular' : 'risk';

    return {
        score, level, averageSpeedKmh, maxSpeedKmh, overspeedEvents, incidents,
        shiftsCount: shifts.length, hasData
    };
}
