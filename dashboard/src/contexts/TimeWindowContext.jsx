/**
 * TimeWindowContext.jsx
 *
 * Provides a shared time window state across the entire dashboard.
 * The DashboardLayout header buttons update the window;
 * useDashboardQuery and other hooks read it to build API params.
 *
 * Windows:
 *   '24H' → last 24 hours (default)
 *   '7D'  → last 7 days
 *   (1H removed: hourly time buckets made it unreliable for recent data)
 */
import { createContext, useContext, useState, useCallback } from 'react';

const TimeWindowContext = createContext(null);

const WINDOW_HOURS = {
    '24H': 24,
    '7D':  24 * 7,
};

export function TimeWindowProvider({ children }) {
    const [timeWindow, setTimeWindow] = useState('24H');

    /** Returns { startTime: number (ms), endTime: number (ms) } for API params */
    const getTimeRange = useCallback(() => {
        const now = Date.now();
        const hours = WINDOW_HOURS[timeWindow] ?? 24;
        return {
            startTime: now - hours * 3_600_000,
            endTime:   now,
        };
    }, [timeWindow]);

    return (
        <TimeWindowContext.Provider value={{ timeWindow, setTimeWindow, getTimeRange, WINDOW_HOURS }}>
            {children}
        </TimeWindowContext.Provider>
    );
}

export function useTimeWindow() {
    const ctx = useContext(TimeWindowContext);
    if (!ctx) throw new Error('useTimeWindow must be used within <TimeWindowProvider>');
    return ctx;
}
