/**
 * Unit tests for Utils module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Utils } from './lib/utils.js';

describe('Utils', () => {
    describe('generateId', () => {
        it('should generate a unique ID with block- prefix', () => {
            const id = Utils.generateId();
            expect(id).toMatch(/^block-[a-f0-9]{8}$/);
        });

        it('should generate different IDs on each call', () => {
            const id1 = Utils.generateId();
            const id2 = Utils.generateId();
            expect(id1).not.toBe(id2);
        });
    });

    describe('getExtension', () => {
        it('should extract extension from filename', () => {
            expect(Utils.getExtension('document.pdf')).toBe('pdf');
            expect(Utils.getExtension('image.PNG')).toBe('png');
            expect(Utils.getExtension('file.test.js')).toBe('js');
        });

        it('should return empty string for files without extension', () => {
            expect(Utils.getExtension('Makefile')).toBe('');
            expect(Utils.getExtension('README')).toBe('');
        });

        it('should handle dotfiles', () => {
            expect(Utils.getExtension('.gitignore')).toBe('gitignore');
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(Utils.formatFileSize(0)).toBe('0 B');
            expect(Utils.formatFileSize(500)).toBe('500 B');
            expect(Utils.formatFileSize(1024)).toBe('1 KB');
            expect(Utils.formatFileSize(1536)).toBe('1.5 KB');
            expect(Utils.formatFileSize(1048576)).toBe('1 MB');
            expect(Utils.formatFileSize(1073741824)).toBe('1 GB');
        });

        it('should handle decimal places', () => {
            expect(Utils.formatFileSize(1500)).toBe('1.5 KB');
            expect(Utils.formatFileSize(2560000)).toBe('2.4 MB');
        });
    });

    describe('escapeHtml', () => {
        it('should escape HTML special characters', () => {
            expect(Utils.escapeHtml('<script>')).toBe('&lt;script&gt;');
            expect(Utils.escapeHtml('a & b')).toBe('a &amp; b');
            expect(Utils.escapeHtml('"quoted"')).toBe('"quoted"');
        });

        it('should handle normal text', () => {
            expect(Utils.escapeHtml('Hello World')).toBe('Hello World');
        });

        it('should handle empty string', () => {
            expect(Utils.escapeHtml('')).toBe('');
        });
    });

    describe('getTimestamp', () => {
        it('should return a valid ISO timestamp', () => {
            const timestamp = Utils.getTimestamp();
            expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            expect(() => new Date(timestamp)).not.toThrow();
        });
    });

    describe('getFileIcon', () => {
        it('should return correct icons for known extensions', () => {
            expect(Utils.getFileIcon('pdf')).toBe('📄');
            expect(Utils.getFileIcon('doc')).toBe('📝');
            expect(Utils.getFileIcon('xlsx')).toBe('📊');
            expect(Utils.getFileIcon('zip')).toBe('📦');
            expect(Utils.getFileIcon('js')).toBe('⚡');
            expect(Utils.getFileIcon('css')).toBe('🎨');
            expect(Utils.getFileIcon('html')).toBe('🌐');
        });

        it('should return default icon for unknown extensions', () => {
            expect(Utils.getFileIcon('xyz')).toBe('📎');
            expect(Utils.getFileIcon('unknown')).toBe('📎');
        });
    });

    describe('isImage', () => {
        it('should return true for image MIME types', () => {
            expect(Utils.isImage('image/png')).toBe(true);
            expect(Utils.isImage('image/jpeg')).toBe(true);
            expect(Utils.isImage('image/gif')).toBe(true);
            expect(Utils.isImage('image/webp')).toBe(true);
        });

        it('should return false for non-image MIME types', () => {
            expect(Utils.isImage('application/pdf')).toBe(false);
            expect(Utils.isImage('text/plain')).toBe(false);
            expect(Utils.isImage('video/mp4')).toBe(false);
        });

        it('should handle null/undefined', () => {
            expect(Utils.isImage(null)).toBeFalsy();
            expect(Utils.isImage(undefined)).toBeFalsy();
            expect(Utils.isImage('')).toBeFalsy();
        });
    });

    describe('debounce', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should delay function execution', () => {
            const fn = vi.fn();
            const debouncedFn = Utils.debounce(fn, 100);

            debouncedFn();
            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should reset timer on subsequent calls', () => {
            const fn = vi.fn();
            const debouncedFn = Utils.debounce(fn, 100);

            debouncedFn();
            vi.advanceTimersByTime(50);
            debouncedFn();
            vi.advanceTimersByTime(50);
            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });

    describe('throttle', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should call function immediately on first call', () => {
            const fn = vi.fn();
            const throttledFn = Utils.throttle(fn, 100);

            throttledFn();
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should ignore calls within throttle period', () => {
            const fn = vi.fn();
            const throttledFn = Utils.throttle(fn, 100);

            throttledFn();
            throttledFn();
            throttledFn();
            expect(fn).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(100);
            throttledFn();
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

    describe('arrayBufferToBase64', () => {
        it('should convert ArrayBuffer to base64', () => {
            const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
            const base64 = Utils.arrayBufferToBase64(buffer);
            expect(base64).toBe('SGVsbG8='); // 'Hello' in base64
        });

        it('should handle empty buffer', () => {
            const buffer = new Uint8Array([]).buffer;
            const base64 = Utils.arrayBufferToBase64(buffer);
            expect(base64).toBe('');
        });
    });

    describe('base64ToBlob', () => {
        it('should convert base64 to Blob', () => {
            const base64 = 'SGVsbG8='; // 'Hello'
            const blob = Utils.base64ToBlob(base64, 'text/plain');
            
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('text/plain');
            expect(blob.size).toBe(5);
        });
    });
});
