/**
 * Downsize a photo in the browser before upload.
 *
 * A phone photo is several MB, and a serverless request body is capped at
 * 4.5 MB, so sending the original fails on exactly the photos this page is
 * for. createImageBitmap applies the EXIF orientation, and the server
 * re-normalises whatever arrives.
 */
export async function resizeForUpload(file: File, maxSide = 1600, quality = 0.86): Promise<string> {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser cannot process images.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", quality);
}
