/**
 * E2E tests for Aladin app
 * Tests the main application functionality in a real browser
 * Note: App requires vault creation/unlock which happens via modal
 * Use ?demo=true query parameter to bypass vault selection
 */

import { test, expect } from '@playwright/test';

// Demo mode URL bypasses vault password prompts
const DEMO_URL = '/?demo=true';

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

test.describe('Demo Mode - Editor Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Use demo mode to bypass vault password modal
        await page.goto(DEMO_URL);
        // Wait for editor to be ready
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });
    });

    test('should initialize in demo mode without vault prompt', async ({ page }) => {
        // Check that the editor is visible (not hidden behind modal)
        const editor = page.locator('#editorjs');
        await expect(editor).toBeVisible();

        // Modal should not be visible
        const modal = page.locator('.modal-overlay');
        await expect(modal).not.toBeVisible();
    });

    test('should have default content loaded', async ({ page }) => {
        // Check for default welcome heading
        const heading = page.locator('.ce-header:has-text("Welcome to Aladin")');
        await expect(heading).toBeVisible();
    });

    test('should have Editor.js toolbar elements', async ({ page }) => {
        // Click on first block to focus it
        const block = page.locator('.ce-block').first();
        await block.click();

        // Toolbar should exist in DOM (even if hidden)
        const toolbar = page.locator('.ce-toolbar');
        await expect(toolbar).toBeAttached();

        // Settings button should exist
        const settingsBtn = page.locator('.ce-toolbar__settings-btn');
        await expect(settingsBtn).toBeAttached();
    });

    test('should have multiple blocks in default content', async ({ page }) => {
        // Wait for blocks to be created
        await page.waitForSelector('.ce-block');

        // Get all blocks
        const blocks = page.locator('.ce-block');
        const count = await blocks.count();

        // Should have multiple blocks from default content
        expect(count).toBeGreaterThan(3);
    });

    test('should be able to type in editor', async ({ page }) => {
        // Find an empty paragraph or click after last block
        const lastBlock = page.locator('.ce-block').last();
        await lastBlock.click();

        // Type some text
        await page.keyboard.press('Enter');
        await page.keyboard.type('Test paragraph from E2E test');

        // Verify the text was added
        const testText = page.locator('text=Test paragraph from E2E test');
        await expect(testText).toBeVisible();
    });
});

test.describe('Demo Mode - Block Drag and Drop', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(DEMO_URL);
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });
    });

    test('settings button should have drag enhancement', async ({ page }) => {
        // Click on first block to focus it and trigger toolbar
        const block = page.locator('.ce-block').first();
        await block.click();

        // Wait for our drag enhancement to be applied
        await page.waitForFunction(() => {
            const btn = document.querySelector('.ce-toolbar__settings-btn');
            return btn && btn.dataset.dragEnhanced === 'true';
        }, { timeout: 5000 });

        // Settings button should be enhanced with drag
        const settingsBtn = page.locator('.ce-toolbar__settings-btn');
        const draggable = await settingsBtn.getAttribute('draggable');
        expect(draggable).toBe('true');
    });

    test('settings button should be draggable after enhancement', async ({ page }) => {
        // Click on first block to focus it and trigger toolbar  
        const block = page.locator('.ce-block').first();
        await block.click();

        // Wait for enhancement
        await page.waitForFunction(() => {
            const btn = document.querySelector('.ce-toolbar__settings-btn');
            return btn && btn.dataset.dragEnhanced === 'true';
        }, { timeout: 5000 });

        const settingsBtn = page.locator('.ce-toolbar__settings-btn');
        const draggable = await settingsBtn.getAttribute('draggable');
        expect(draggable).toBe('true');
    });

    test('block should get dragging class during drag', async ({ page }) => {
        // Click on first block to focus it and trigger toolbar
        const block = page.locator('.ce-block').first();
        await block.click();

        // Wait for enhancement
        await page.waitForFunction(() => {
            const btn = document.querySelector('.ce-toolbar__settings-btn');
            return btn && btn.dataset.dragEnhanced === 'true';
        }, { timeout: 5000 });

        // Use page.evaluate to trigger drag events properly
        await page.evaluate(() => {
            const settingsBtn = document.querySelector('.ce-toolbar__settings-btn');
            const focusedBlock = document.querySelector('.ce-block--focused');

            if (settingsBtn && focusedBlock) {
                // Create and dispatch dragstart event
                const dragStartEvent = new DragEvent('dragstart', {
                    bubbles: true,
                    cancelable: true,
                });
                settingsBtn.dispatchEvent(dragStartEvent);
            }
        });

        // Block should have dragging class
        await expect(block).toHaveClass(/dragging/);
    });
});

test.describe('Demo Mode - Hashtag Feature', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(DEMO_URL);
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });
    });

    test('should have hashtag menu element initialized', async ({ page }) => {
        // Hashtag menu should exist (hidden by default)
        const hashtagMenu = page.locator('#hashtag-menu');
        await expect(hashtagMenu).toBeAttached();
        await expect(hashtagMenu).toHaveClass(/hidden/);
    });

    test('hashtag menu should be properly styled', async ({ page }) => {
        // Check CSS class is applied
        const hashtagMenu = page.locator('#hashtag-menu');
        await expect(hashtagMenu).toHaveClass(/hashtag-menu/);
    });

    test('Editor should have hashtag command setup', async ({ page }) => {
        // Verify Editor has hashtagMenu property (created during init)
        const hasHashtagSetup = await page.evaluate(() => {
            return window.Editor && typeof window.Editor.setupHashtagCommands === 'function';
        });
        expect(hasHashtagSetup).toBe(true);
    });

    test('Editor should track allTags array', async ({ page }) => {
        // Verify Editor has allTags property
        const hasAllTags = await page.evaluate(() => {
            return window.Editor && Array.isArray(window.Editor.allTags);
        });
        expect(hasAllTags).toBe(true);
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
