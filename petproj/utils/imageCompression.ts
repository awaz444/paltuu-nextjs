/**
 * Client-side image compression utility using HTML Canvas.
 *
 * Smartphone cameras (especially iPhone HEIC and modern Android sensors)
 * regularly produce photos between 4 MB and 15 MB. When multiple high-res
 * photos are uploaded at once, the HTTP request easily exceeds Vercel's
 * hard 4.5 MB request-body limit for Serverless Functions, resulting in
 * an immediate HTTP 413 (Payload Too Large) error before the backend runs.
 *
 * This utility downscales images to a reasonable maximum edge (default: 1600px)
 * and encodes to JPEG at 0.75 quality, bringing photos down to ~150-350 KB
 * each without noticeable loss of visual fidelity on mobile or desktop displays.
 */

export async function compressImageFile(
    file: File,
    maxDimension: number = 1600,
    quality: number = 0.75
): Promise<File> {
    if (typeof window === "undefined" || !file || !(file instanceof File)) {
        return file;
    }

    // Skip SVG files or non-images
    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (isSvg || (!file.type.startsWith("image/") && file.type !== "")) {
        return file;
    }

    return new Promise((resolve) => {
        let objectUrl = "";
        try {
            objectUrl = URL.createObjectURL(file);
        } catch {
            return resolve(file);
        }

        const img = new window.Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            try {
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;

                if (!width || !height || width <= 0 || height <= 0) {
                    return resolve(file);
                }

                // Downscale if either dimension exceeds maxDimension
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    return resolve(file);
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return resolve(file);
                        }
                        // If compressed blob is unexpectedly larger than original JPEG, keep original
                        if (blob.size >= file.size && file.type === "image/jpeg") {
                            return resolve(file);
                        }
                        const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                        const compressedFile = new File([blob], cleanName, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    "image/jpeg",
                    quality
                );
            } catch (err) {
                console.warn("[compressImageFile] Canvas processing failed, falling back to original:", err);
                resolve(file);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            // Fallback to original file if browser cannot decode format directly
            resolve(file);
        };

        img.src = objectUrl;
    });
}

export async function compressImageFiles(
    files: File[],
    maxDimension: number = 1600,
    quality: number = 0.75
): Promise<File[]> {
    return Promise.all(files.map((file) => compressImageFile(file, maxDimension, quality)));
}
