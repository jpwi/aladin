/**
 * Unit tests for Editor date utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDateISO, dateOptions } from './lib/editor-dates.js';

describe('Editor Date Utilities', () => {
    describe('formatDateISO', () => {
        it('should format date as YYYY-MM-DD', () => {
            const date = new Date(2026, 0, 26); // Jan 26, 2026
            expect(formatDateISO(date)).toBe('2026-01-26');
        });

        it('should pad single-digit months and days', () => {
            const date = new Date(2026, 4, 5); // May 5, 2026
            expect(formatDateISO(date)).toBe('2026-05-05');
        });

        it('should handle December correctly', () => {
            const date = new Date(2026, 11, 31); // Dec 31, 2026
            expect(formatDateISO(date)).toBe('2026-12-31');
        });

        it('should handle leap year', () => {
            const date = new Date(2024, 1, 29); // Feb 29, 2024
            expect(formatDateISO(date)).toBe('2024-02-29');
        });
    });

    describe('dateOptions', () => {
        beforeEach(() => {
            // Mock current date to Jan 26, 2026
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 0, 26, 12, 0, 0));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should have correct option names', () => {
            const names = dateOptions.map(opt => opt.name);
            expect(names).toContain('today');
            expect(names).toContain('yesterday');
            expect(names).toContain('tomorrow');
            expect(names).toContain('next week');
            expect(names).toContain('next month');
        });

        it('today should return current date', () => {
            const todayOption = dateOptions.find(opt => opt.name === 'today');
            expect(todayOption.getDate()).toBe('2026-01-26');
        });

        it('yesterday should return previous date', () => {
            const yesterdayOption = dateOptions.find(opt => opt.name === 'yesterday');
            expect(yesterdayOption.getDate()).toBe('2026-01-25');
        });

        it('tomorrow should return next date', () => {
            const tomorrowOption = dateOptions.find(opt => opt.name === 'tomorrow');
            expect(tomorrowOption.getDate()).toBe('2026-01-27');
        });

        it('next week should return date 7 days from now', () => {
            const nextWeekOption = dateOptions.find(opt => opt.name === 'next week');
            expect(nextWeekOption.getDate()).toBe('2026-02-02');
        });

        it('next month should return date one month from now', () => {
            const nextMonthOption = dateOptions.find(opt => opt.name === 'next month');
            expect(nextMonthOption.getDate()).toBe('2026-02-26');
        });

        it('should handle year rollover for next month', () => {
            vi.setSystemTime(new Date(2026, 11, 26)); // Dec 26, 2026
            const nextMonthOption = dateOptions.find(opt => opt.name === 'next month');
            expect(nextMonthOption.getDate()).toBe('2027-01-26');
        });

        it('should handle month boundary for yesterday', () => {
            vi.setSystemTime(new Date(2026, 1, 1)); // Feb 1, 2026
            const yesterdayOption = dateOptions.find(opt => opt.name === 'yesterday');
            expect(yesterdayOption.getDate()).toBe('2026-01-31');
        });
    });
});
