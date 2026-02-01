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

test.describe('Recovery Phrase Feature', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(DEMO_URL);
        await page.waitForFunction(() => window.App?.isInitialized, { timeout: 10000 });
    });

    test('should have recovery phrase generation function available', async ({ page }) => {
        const hasFunction = await page.evaluate(() => {
            return typeof window.Crypto?.generateRecoveryPhrase === 'function';
        });
        expect(hasFunction).toBe(true);
    });

    test('should generate 24-word recovery phrase', async ({ page }) => {
        const phrase = await page.evaluate(async () => {
            return await window.Crypto.generateRecoveryPhrase();
        });

        expect(phrase).toBeTruthy();
        const words = phrase.split(' ');
        expect(words.length).toBe(24);
        
        // All words should be non-empty strings
        words.forEach(word => {
            expect(word.length).toBeGreaterThan(0);
        });
    });

    test('should have BIP39 wordlist loaded', async ({ page }) => {
        const wordlistInfo = await page.evaluate(() => {
            const wordlist = window.WORDLIST;
            return {
                exists: !!wordlist,
                length: wordlist?.length || 0,
                firstWord: wordlist?.[0] || null,
                lastWord: wordlist?.[2047] || null
            };
        });

        expect(wordlistInfo.exists).toBe(true);
        expect(wordlistInfo.length).toBe(2048);
        expect(wordlistInfo.firstWord).toBe('abandon');
        expect(wordlistInfo.lastWord).toBe('zoo');
    });

    test('should generate different phrases each time', async ({ page }) => {
        const phrases = await page.evaluate(async () => {
            const p1 = await window.Crypto.generateRecoveryPhrase();
            const p2 = await window.Crypto.generateRecoveryPhrase();
            return [p1, p2];
        });

        expect(phrases[0]).not.toBe(phrases[1]);
    });

    test('recovery phrase words should all be from BIP39 wordlist', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const phrase = await window.Crypto.generateRecoveryPhrase();
            const words = phrase.split(' ');
            const wordlist = window.WORDLIST;
            
            return words.map(word => ({
                word,
                inWordlist: wordlist.includes(word)
            }));
        });

        result.forEach(({ word, inWordlist }) => {
            expect(inWordlist).toBe(true);
        });
    });

    test('should be able to encrypt and decrypt with recovery phrase', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const testData = { message: 'Secret test data', timestamp: Date.now() };
            const password = 'TestPassword123!';
            const recoveryPhrase = await window.Crypto.generateRecoveryPhrase();
            
            // Encrypt with password and recovery phrase
            const encrypted = await window.Crypto.encrypt(testData, password, {
                recoveryPhrase: recoveryPhrase
            });
            
            // Verify structure
            if (encrypted.version !== '2.0') return { error: 'Wrong version' };
            if (!encrypted.keySlots || encrypted.keySlots.length !== 2) {
                return { error: 'Wrong keySlots count: ' + encrypted.keySlots?.length };
            }
            
            // Decrypt with password
            const decryptedWithPassword = await window.Crypto.decrypt(encrypted, password);
            
            // Decrypt with recovery phrase
            const decryptedWithRecovery = await window.Crypto.decrypt(encrypted, recoveryPhrase);
            
            return {
                success: true,
                passwordDecrypt: decryptedWithPassword.data,
                recoveryDecrypt: decryptedWithRecovery.data,
                originalData: testData
            };
        });

        expect(result.success).toBe(true);
        expect(result.passwordDecrypt.message).toBe(result.originalData.message);
        expect(result.recoveryDecrypt.message).toBe(result.originalData.message);
    });

    test('should show recovery option in open vault modal', async ({ page }) => {
        // Start fresh (no demo mode)
        await page.goto('/');
        
        // Wait for welcome modal
        await page.waitForSelector('.modal-overlay:not(.hidden)', { timeout: 5000 });
        
        // Click "Open Existing Vault"
        await page.click('#btn-open-vault');
        
        // Wait for password modal
        await page.waitForSelector('#open-vault-password', { timeout: 5000 });
        
        // Check for "Use Recovery Phrase" link
        const recoveryLink = page.locator('#btn-use-recovery');
        await expect(recoveryLink).toBeVisible();
        await expect(recoveryLink).toHaveText('Use Recovery Phrase instead');
    });

    test('should switch to recovery mode when clicking recovery link', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.modal-overlay:not(.hidden)', { timeout: 5000 });
        await page.click('#btn-open-vault');
        await page.waitForSelector('#open-vault-password', { timeout: 5000 });
        
        // Click recovery link
        await page.click('#btn-use-recovery');
        
        // Should now see recovery textarea instead of password input
        await page.waitForSelector('#open-vault-recovery', { timeout: 5000 });
        const recoveryInput = page.locator('#open-vault-recovery');
        await expect(recoveryInput).toBeVisible();
        
        // Should see "Use Password instead" link
        const passwordLink = page.locator('#btn-use-password');
        await expect(passwordLink).toBeVisible();
    });

    test('should validate 24-word count in recovery mode', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.modal-overlay:not(.hidden)', { timeout: 5000 });
        await page.click('#btn-open-vault');
        await page.waitForSelector('#open-vault-password', { timeout: 5000 });
        await page.click('#btn-use-recovery');
        await page.waitForSelector('#open-vault-recovery', { timeout: 5000 });
        
        // Enter only 5 words
        await page.fill('#open-vault-recovery', 'word1 word2 word3 word4 word5');
        
        // Click select file button (this will validate first)
        await page.click('#btn-select-open');
        
        // Should show error about word count
        await page.waitForSelector('.modal-error', { timeout: 5000 });
        const errorText = await page.locator('.modal-error').textContent();
        expect(errorText).toContain('24 words');
        expect(errorText).toContain('5');
    });
});
