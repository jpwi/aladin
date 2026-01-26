/**
 * Utility Functions - ES Module version for testing
 */

export const Utils = {
    /**
     * Generate a unique block ID
     */
    generateId() {
        return "block-" + crypto.randomUUID().slice(0, 8);
    },

    /**
     * Compute SHA-256 hash of an ArrayBuffer
     */
    async computeHash(arrayBuffer) {
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    },

    /**
     * Get file extension from filename
     */
    getExtension(filename) {
        const parts = filename.split(".");
        return parts.length > 1 ? parts.pop().toLowerCase() : "";
    },

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Get current ISO timestamp
     */
    getTimestamp() {
        return new Date().toISOString();
    },

    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <=
                (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Smooth scroll to element
     */
    scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            // Update URL hash
            history.pushState(null, "", "#" + elementId);
        }
    },

    /**
     * Get file icon based on extension
     */
    getFileIcon(extension) {
        const icons = {
            pdf: "📄",
            doc: "📝",
            docx: "📝",
            xls: "📊",
            xlsx: "📊",
            ppt: "📽️",
            pptx: "📽️",
            zip: "📦",
            rar: "📦",
            txt: "📃",
            md: "📃",
            json: "🔧",
            js: "⚡",
            css: "🎨",
            html: "🌐",
            default: "📎",
        };
        return icons[extension] || icons.default;
    },

    /**
     * Check if file is an image
     */
    isImage(mimeType) {
        return mimeType && mimeType.startsWith("image/");
    },

    /**
     * Convert ArrayBuffer to base64
     */
    arrayBufferToBase64(buffer) {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    /**
     * Convert base64 to Blob
     */
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }
        return new Blob(byteArrays, { type: mimeType });
    },
};

export default Utils;
