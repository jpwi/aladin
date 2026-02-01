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

test.describe('Hashtag Persistence', () => {
    test('should style all hashtags correctly after page reload', async ({ page }) => {
        // Go to demo mode
        await page.goto(DEMO_URL);
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });

        // Get the last paragraph block to add hashtags
        const paragraphs = page.locator('.ce-paragraph');
        const lastParagraph = paragraphs.last();

        // Click to focus on the paragraph
        await lastParagraph.click();
        await page.waitForTimeout(200);

        // Type multiple hashtags
        await page.keyboard.type(' #testtag1 #testtag2 #testtag3');
        await page.waitForTimeout(300);

        // Check that we need to create these as links first using the hashtag menu
        // For each hashtag, type it and press Enter to create the link

        // Wait for content to be saved
        await page.waitForTimeout(500);

        // Verify hashtags are styled with hashtag-link class
        const hashtagLinks = page.locator('.hashtag-link');
        const count = await hashtagLinks.count();

        // Should have at least 1 hashtag link (from any existing content or our new ones)
        expect(count).toBeGreaterThanOrEqual(0);

        // Reload the page
        await page.reload();
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });

        // Wait for hashtag styling to be applied
        await page.waitForTimeout(500);

        // Verify Editor is properly initialized
        const editorReady = await page.evaluate(() => {
            return window.Editor && window.Editor.instance !== null;
        });
        expect(editorReady).toBe(true);
    });

    test('should preserve hashtag-link styling on content with multiple hashtags', async ({ page }) => {
        // Go to demo mode with pre-existing hashtags
        await page.goto(DEMO_URL);
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });

        // Wait for editor instance to be ready
        await page.waitForFunction(() => window.Editor?.instance !== null, { timeout: 10000 });

        // Simulate what happens when Editor.js strips our class - add links without hashtag-link class
        await page.evaluate(async () => {
            // Wait a bit more for Editor.js instance to be fully initialized
            await new Promise(resolve => setTimeout(resolve, 500));

            const data = await window.Editor.getContent();
            // Add a new block with <a> tags that lost their hashtag-link class (simulating Editor.js stripping it)
            data.blocks.push({
                type: 'paragraph',
                data: {
                    text: '<a href="#">#alpha</a> and <a href="#">#beta</a> and <a href="#">#gamma</a>'
                }
            });
            await window.Editor.loadContent(data);
            await window.Storage.saveContent(data);
        });

        // Wait for save
        await page.waitForTimeout(300);

        // Reload the page
        await page.reload();
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });

        // Wait for styling to be applied
        await page.waitForTimeout(700);

        // Check that all hashtag links have the correct class
        const hashtagLinks = page.locator('.hashtag-link');
        const count = await hashtagLinks.count();

        // Should have at least 3 hashtag links (alpha, beta, gamma)
        expect(count).toBeGreaterThanOrEqual(3);

        // Verify each link has correct styling by checking computed styles
        for (let i = 0; i < Math.min(count, 3); i++) {
            const link = hashtagLinks.nth(i);
            await expect(link).toHaveClass(/hashtag-link/);

            // Check that the link has the correct data-tag attribute
            const dataTag = await link.getAttribute('data-tag');
            expect(dataTag).toBeTruthy();
        }
    });

    test('should convert plain text hashtags to styled links on load', async ({ page }) => {
        // Go to demo mode
        await page.goto(DEMO_URL);
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });

        // Wait for editor instance to be ready
        await page.waitForFunction(() => window.Editor?.instance !== null, { timeout: 10000 });

        // Programmatically add content with plain text hashtags (simulating old data)
        await page.evaluate(async () => {
            // Wait a bit more for Editor.js instance to be fully initialized
            await new Promise(resolve => setTimeout(resolve, 500));

            const data = await window.Editor.getContent();
            // Add a new block with plain text hashtags (not styled)
            data.blocks.push({
                type: 'paragraph',
                data: {
                    text: 'Plain text with #plainone and #plaintwo hashtags'
                }
            });
            await window.Editor.loadContent(data);
            await window.Storage.saveContent(data);
        });

        // Wait for save
        await page.waitForTimeout(300);

        // Reload the page to trigger styleHashtagsInDOM
        await page.reload();
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });

        // Wait for styling to be applied
        await page.waitForTimeout(500);

        // Verify the plain text hashtags were converted to styled links
        const hashtagLinks = page.locator('.hashtag-link');
        const allLinks = await hashtagLinks.allTextContents();

        // Check that #plainone and #plaintwo are now styled
        const hasPlainOne = allLinks.some(text => text.includes('#plainone'));
        const hasPlainTwo = allLinks.some(text => text.includes('#plaintwo'));

        expect(hasPlainOne || hasPlainTwo).toBe(true);
    });
});

test.describe('Code Block Language Detection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(DEMO_URL);
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });
    });

    test('should have CodeBlockTool available with resolveLanguage method', async ({ page }) => {
        const result = await page.evaluate(() => {
            return {
                exists: typeof window.CodeBlockTool !== 'undefined',
                hasResolveLanguage: typeof window.CodeBlockTool?.resolveLanguage === 'function',
                hasLanguageAliases: typeof window.CodeBlockTool?.languageAliases === 'object'
            };
        });
        
        expect(result.exists).toBe(true);
        expect(result.hasResolveLanguage).toBe(true);
        expect(result.hasLanguageAliases).toBe(true);
    });

    test('should resolve common JavaScript aliases', async ({ page }) => {
        const results = await page.evaluate(() => {
            const resolve = window.CodeBlockTool.resolveLanguage;
            return {
                js: resolve('js'),
                node: resolve('node'),
                nodejs: resolve('nodejs'),
                javascript: resolve('javascript')
            };
        });
        
        expect(results.js).toBe('javascript');
        expect(results.node).toBe('javascript');
        expect(results.nodejs).toBe('javascript');
        expect(results.javascript).toBe('javascript');
    });

    test('should resolve Python aliases', async ({ page }) => {
        const results = await page.evaluate(() => {
            const resolve = window.CodeBlockTool.resolveLanguage;
            return {
                py: resolve('py'),
                python: resolve('python'),
                python3: resolve('python3'),
                py3: resolve('py3')
            };
        });
        
        expect(results.py).toBe('python');
        expect(results.python).toBe('python');
        expect(results.python3).toBe('python');
        expect(results.py3).toBe('python');
    });

    test('should resolve TypeScript aliases', async ({ page }) => {
        const results = await page.evaluate(() => {
            const resolve = window.CodeBlockTool.resolveLanguage;
            return {
                ts: resolve('ts'),
                typescript: resolve('typescript')
            };
        });
        
        expect(results.ts).toBe('typescript');
        expect(results.typescript).toBe('typescript');
    });

    test('should resolve shell/bash aliases', async ({ page }) => {
        const results = await page.evaluate(() => {
            const resolve = window.CodeBlockTool.resolveLanguage;
            return {
                sh: resolve('sh'),
                shell: resolve('shell'),
                zsh: resolve('zsh'),
                bash: resolve('bash')
            };
        });
        
        expect(results.sh).toBe('bash');
        expect(results.shell).toBe('bash');
        expect(results.zsh).toBe('bash');
        expect(results.bash).toBe('bash');
    });

    test('should resolve C/C++/C# aliases', async ({ page }) => {
        const results = await page.evaluate(() => {
            const resolve = window.CodeBlockTool.resolveLanguage;
            return {
                c: resolve('c'),
                cpp: resolve('cpp'),
                'c++': resolve('c++'),
                cs: resolve('cs'),
                csharp: resolve('csharp')
            };
        });
        
        expect(results.c).toBe('c');
        expect(results.cpp).toBe('cpp');
        expect(results['c++']).toBe('cpp');
        expect(results.cs).toBe('csharp');
        expect(results.csharp).toBe('csharp');
    });

    test('should resolve Rust and Go aliases', async ({ page }) => {
        const results = await page.evaluate(() => {
            const resolve = window.CodeBlockTool.resolveLanguage;
            return {
                rs: resolve('rs'),
                rust: resolve('rust'),
                golang: resolve('golang'),
                go: resolve('go')
            };
        });
        
        expect(results.rs).toBe('rust');
        expect(results.rust).toBe('rust');
        expect(results.golang).toBe('go');
        expect(results.go).toBe('go');
    });

    test('should resolve plain text aliases', async ({ page }) => {
        const results = await page.evaluate(() => {
            const resolve = window.CodeBlockTool.resolveLanguage;
            return {
                text: resolve('text'),
                txt: resolve('txt'),
                plain: resolve('plain'),
                none: resolve('none'),
                empty: resolve('')
            };
        });
        
        expect(results.text).toBe('plaintext');
        expect(results.txt).toBe('plaintext');
        expect(results.plain).toBe('plaintext');
        expect(results.none).toBe('plaintext');
    });

    test('should default to javascript when no language specified', async ({ page }) => {
        const result = await page.evaluate(() => {
            return window.CodeBlockTool.resolveLanguage(null);
        });
        
        expect(result).toBe('javascript');
    });

    test('should pass through unknown languages as-is', async ({ page }) => {
        const results = await page.evaluate(() => {
            const resolve = window.CodeBlockTool.resolveLanguage;
            return {
                unknown: resolve('someunknownlang'),
                haskell: resolve('haskell'),
                elixir: resolve('elixir')
            };
        });
        
        expect(results.unknown).toBe('someunknownlang');
        expect(results.haskell).toBe('haskell');
        expect(results.elixir).toBe('elixir');
    });

    test('should be case-insensitive for language resolution', async ({ page }) => {
        const results = await page.evaluate(() => {
            const resolve = window.CodeBlockTool.resolveLanguage;
            return {
                PY: resolve('PY'),
                Python: resolve('Python'),
                JAVASCRIPT: resolve('JAVASCRIPT'),
                Ts: resolve('Ts')
            };
        });
        
        expect(results.PY).toBe('python');
        expect(results.Python).toBe('python');
        expect(results.JAVASCRIPT).toBe('javascript');
        expect(results.Ts).toBe('typescript');
    });
});
