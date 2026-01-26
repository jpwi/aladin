/**
 * E2E tests for Aladin app
 * Tests the main application functionality in a real browser
 * Note: App requires vault creation/unlock which happens via modal
 */

import { test, expect } from '@playwright/test';

test.describe('Aladin App - Initial Load', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the application with correct title', async ({ page }) => {
        await expect(page).toHaveTitle('Aladin - Local Knowledge Base');
    });

    test('should show the app container', async ({ page }) => {
        const appContainer = page.locator('.app-container');
        await expect(appContainer).toBeVisible();
    });

    test('should have a sidebar element', async ({ page }) => {
        const sidebar = page.locator('#sidebar');
        await expect(sidebar).toBeVisible();
    });

    test('should have a search input in sidebar', async ({ page }) => {
        const searchInput = page.locator('#search-input');
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toHaveAttribute('placeholder', 'Search headings...');
    });

    test('should have a main editor area', async ({ page }) => {
        const mainEditor = page.locator('.main-editor');
        await expect(mainEditor).toBeVisible();
    });

    test('should have an editorjs container', async ({ page }) => {
        const editorjs = page.locator('#editorjs');
        await expect(editorjs).toBeAttached();
    });

    test('should have sidebar navigation element', async ({ page }) => {
        const sidebarNav = page.locator('.sidebar-nav');
        await expect(sidebarNav).toBeVisible();
    });

    test('should have heading tree container', async ({ page }) => {
        const headingTree = page.locator('#heading-tree');
        await expect(headingTree).toBeAttached();
    });

    test('should have resize handle for sidebar', async ({ page }) => {
        const resizeHandle = page.locator('#resize-handle');
        await expect(resizeHandle).toBeAttached();
    });
});

test.describe('Responsive Layout', () => {
    test('sidebar should be visible on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');
        
        const sidebar = page.locator('#sidebar');
        await expect(sidebar).toBeVisible();
    });

    test('main editor should be visible on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');
        
        const mainEditor = page.locator('.main-editor');
        await expect(mainEditor).toBeVisible();
    });

    test('app should have flex layout', async ({ page }) => {
        await page.goto('/');
        
        const appContainer = page.locator('.app-container');
        const display = await appContainer.evaluate((el) => 
            getComputedStyle(el).display
        );
        expect(display).toBe('flex');
    });
});

test.describe('CSS and Styles', () => {
    test('should load stylesheet', async ({ page }) => {
        await page.goto('/');
        
        // Check that CSS variables are applied
        const bgColor = await page.evaluate(() => 
            getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim()
        );
        expect(bgColor).toBeTruthy();
    });

    test('sidebar should have proper styling', async ({ page }) => {
        await page.goto('/');
        
        const sidebar = page.locator('#sidebar');
        const width = await sidebar.evaluate((el) => 
            getComputedStyle(el).width
        );
        expect(parseInt(width)).toBeGreaterThan(100);
    });
});

test.describe('External Dependencies', () => {
    test('should load Editor.js from CDN', async ({ page }) => {
        await page.goto('/');
        
        // Wait for EditorJS to be defined
        const hasEditorJS = await page.evaluate(() => {
            return typeof window.EditorJS !== 'undefined';
        });
        expect(hasEditorJS).toBe(true);
    });

    test('should load Header plugin', async ({ page }) => {
        await page.goto('/');
        
        const hasHeader = await page.evaluate(() => {
            return typeof window.Header !== 'undefined';
        });
        expect(hasHeader).toBe(true);
    });

    test('should load List plugin', async ({ page }) => {
        await page.goto('/');
        
        const hasList = await page.evaluate(() => {
            return typeof window.List !== 'undefined';
        });
        expect(hasList).toBe(true);
    });
});

test.describe('JavaScript Modules', () => {
    test('should initialize EditorJS module', async ({ page }) => {
        await page.goto('/');
        
        // Wait for EditorJS to be ready (it's the main external dep)
        await page.waitForFunction(() => typeof window.EditorJS !== 'undefined', { timeout: 5000 });
        
        const hasEditorJS = await page.evaluate(() => {
            return typeof window.EditorJS === 'function';
        });
        expect(hasEditorJS).toBe(true);
    });

    test('should have Header plugin from CDN', async ({ page }) => {
        await page.goto('/');
        
        // Wait for CDN scripts to load
        await page.waitForFunction(() => typeof window.Header !== 'undefined', { timeout: 5000 });
        
        const hasHeader = await page.evaluate(() => {
            return typeof window.Header !== 'undefined';
        });
        expect(hasHeader).toBe(true);
    });

    test('should have List plugin from CDN', async ({ page }) => {
        await page.goto('/');
        
        await page.waitForFunction(() => typeof window.List !== 'undefined', { timeout: 5000 });
        
        const hasList = await page.evaluate(() => {
            return typeof window.List !== 'undefined';
        });
        expect(hasList).toBe(true);
    });

    test('should have Paragraph plugin from CDN', async ({ page }) => {
        await page.goto('/');
        
        await page.waitForFunction(() => typeof window.Paragraph !== 'undefined', { timeout: 5000 });
        
        const hasParagraph = await page.evaluate(() => {
            return typeof window.Paragraph !== 'undefined';
        });
        expect(hasParagraph).toBe(true);
    });

    test('should have ImageTool plugin from CDN', async ({ page }) => {
        await page.goto('/');
        
        await page.waitForFunction(() => typeof window.ImageTool !== 'undefined', { timeout: 5000 });
        
        const hasImageTool = await page.evaluate(() => {
            return typeof window.ImageTool !== 'undefined';
        });
        expect(hasImageTool).toBe(true);
    });
});
