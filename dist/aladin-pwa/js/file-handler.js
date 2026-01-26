/**
 * File Handler - Manages file uploads, hashing, and storage
 */

const FileHandler = {
    /**
     * Process a dropped or selected file
     */
    async processFile(file) {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Compute hash
        const hash = await Utils.computeHash(arrayBuffer);

        // Check if already exists
        const existing = await Storage.getAttachment(hash);
        if (existing) {
            console.log("File already exists:", hash);
            return existing;
        }

        // Convert to base64 for storage
        const base64Data = Utils.arrayBufferToBase64(arrayBuffer);

        // Get file metadata
        const ext = Utils.getExtension(file.name);
        const isImage = Utils.isImage(file.type);

        // Create attachment record
        const attachment = {
            hash: hash,
            originalName: file.name,
            mime: file.type,
            size: file.size,
            ext: ext,
            created: Utils.getTimestamp(),
            data: base64Data,
            isImage: isImage,
        };

        // If image, get dimensions
        if (isImage) {
            const dimensions = await this.getImageDimensions(file);
            attachment.width = dimensions.width;
            attachment.height = dimensions.height;
        }

        // Save to storage
        await Storage.saveAttachment(attachment);

        console.log("File saved:", hash);
        return attachment;
    },

    /**
     * Get image dimensions
     */
    getImageDimensions(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = () => {
                resolve({ width: 0, height: 0 });
            };
            img.src = URL.createObjectURL(file);
        });
    },

    /**
     * Get data URL for an attachment
     */
    getDataUrl(attachment) {
        if (!attachment || !attachment.data) return null;
        return `data:${attachment.mime};base64,${attachment.data}`;
    },

    /**
     * Create a Blob from attachment for download
     */
    createBlob(attachment) {
        if (!attachment || !attachment.data) return null;
        return Utils.base64ToBlob(attachment.data, attachment.mime);
    },

    /**
     * Download an attachment
     */
    downloadAttachment(attachment) {
        const blob = this.createBlob(attachment);
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Create an image block data structure
     */
    createImageBlock(attachment, caption = "") {
        return {
            id: Utils.generateId(),
            type: "image",
            data: {
                file: {
                    url: this.getDataUrl(attachment),
                    hash: attachment.hash,
                },
                caption: caption,
                withBorder: false,
                stretched: false,
                withBackground: false,
            },
            image: {
                hash: attachment.hash,
                originalName: attachment.originalName,
                width: attachment.width,
                height: attachment.height,
                alt: attachment.originalName,
                caption: caption,
            },
        };
    },

    /**
     * Create a file block data structure
     */
    createFileBlock(attachment) {
        return {
            id: Utils.generateId(),
            type: "file",
            data: {
                hash: attachment.hash,
                originalName: attachment.originalName,
                mime: attachment.mime,
                size: attachment.size,
                ext: attachment.ext,
            },
            file: {
                hash: attachment.hash,
                originalName: attachment.originalName,
                mime: attachment.mime,
                size: attachment.size,
                ext: attachment.ext,
                created: attachment.created,
                tags: [],
            },
        };
    },

    /**
     * Extract all attachment hashes from blocks
     */
    extractAttachmentHashes(blocks) {
        const hashes = new Set();

        for (const block of blocks) {
            // Check image blocks
            if (block.type === "image" && block.data?.file?.hash) {
                hashes.add(block.data.file.hash);
            }
            // Check file blocks
            if (block.type === "file" && block.data?.hash) {
                hashes.add(block.data.hash);
            }
            // Check for legacy image metadata
            if (block.image?.hash) {
                hashes.add(block.image.hash);
            }
            // Check for legacy file metadata
            if (block.file?.hash) {
                hashes.add(block.file.hash);
            }
        }

        return hashes;
    },

    /**
     * Clean up orphaned attachments that are no longer referenced by any block
     * This prevents the vault from growing indefinitely
     */
    async cleanupOrphanedAttachments(currentBlocks) {
        try {
            // Get all attachment hashes currently in use
            const usedHashes = this.extractAttachmentHashes(currentBlocks);

            // Get all stored attachments
            const allAttachments = await Storage.getAllAttachments();

            // Find orphaned attachments
            const orphanedHashes = [];
            for (const attachment of allAttachments) {
                if (!usedHashes.has(attachment.hash)) {
                    orphanedHashes.push(attachment.hash);
                }
            }

            // Delete orphaned attachments
            for (const hash of orphanedHashes) {
                await Storage.deleteAttachment(hash);
                console.log("FileHandler: Deleted orphaned attachment:", hash);
            }

            if (orphanedHashes.length > 0) {
                console.log(
                    `FileHandler: Cleaned up ${orphanedHashes.length} orphaned attachments`,
                );
            }

            return orphanedHashes;
        } catch (error) {
            console.error("FileHandler: Failed to cleanup attachments:", error);
            return [];
        }
    },
};

// Make globally available
window.FileHandler = FileHandler;
