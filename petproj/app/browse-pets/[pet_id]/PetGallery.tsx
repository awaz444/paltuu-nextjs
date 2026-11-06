"use client";
import React, { useEffect, useState } from "react";
import { Image } from "antd";
import { CameraOutlined, ExpandOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

// Listing photos come straight from people's phones, so they're every aspect
// ratio under the sun. The main frame fills with the photo (object-cover) and
// clicking opens the full-size viewer, which shows it uncropped.
const PetGallery: React.FC<{ images: string[]; alt: string }> = ({ images, alt }) => {
    const [index, setIndex] = useState(0);
    const [loaded, setLoaded] = useState<Set<string>>(new Set());
    const [viewerOpen, setViewerOpen] = useState(false);

    // Warm the cache for the other photos so paging through is instant, but
    // only once the first one is in: on a phone connection they would
    // otherwise share bandwidth with the photo the visitor is waiting for.
    // Until a given photo has loaded, the frame shows a spinner rather than
    // the previous photo.
    const firstLoaded = images.length > 0 && loaded.has(images[0]);
    useEffect(() => {
        if (!firstLoaded) return;
        images.slice(1).forEach((src) => {
            const img = new window.Image();
            img.onload = () => setLoaded((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
            img.src = src;
        });
    }, [images, firstLoaded]);

    const markLoaded = (src: string) =>
        setLoaded((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));

    const go = (delta: number) =>
        setIndex((i) => (i + delta + images.length) % images.length);

    if (images.length === 0) {
        return (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-400">
                <div className="text-center">
                    <CameraOutlined className="mb-2 text-3xl" />
                    <p className="text-sm">No photos yet</p>
                </div>
            </div>
        );
    }

    const src = images[index];
    // The first photo is the page's main content: it is in the server HTML and
    // must paint as soon as it arrives, not wait for JavaScript to fade it in.
    const isFirst = index === 0;
    const isLoaded = isFirst || loaded.has(src);

    return (
        <div>
            <div className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100 sm:aspect-[4/3]">
                <button
                    type="button"
                    onClick={() => setViewerOpen(true)}
                    className="relative block h-full w-full cursor-zoom-in"
                    aria-label="Open photo full screen">
                    <img
                        key={src}
                        src={src}
                        alt={alt}
                        // React 18 only passes the lowercase attribute through.
                        {...({ fetchpriority: isFirst ? "high" : "auto" } as Record<string, string>)}
                        decoding={isFirst ? "sync" : "async"}
                        onLoad={() => markLoaded(src)}
                        className={`h-full w-full object-cover transition-opacity duration-200 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                    />
                </button>

                {!isLoaded && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    </div>
                )}

                <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white">
                    <ExpandOutlined /> Expand
                </span>

                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={() => go(-1)}
                            aria-label="Previous photo"
                            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow hover:bg-white">
                            <LeftOutlined />
                        </button>
                        <button
                            type="button"
                            onClick={() => go(1)}
                            aria-label="Next photo"
                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow hover:bg-white">
                            <RightOutlined />
                        </button>
                        <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white">
                            {index + 1} / {images.length}
                        </span>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {images.map((thumb, i) => (
                        <button
                            key={thumb + i}
                            type="button"
                            onClick={() => setIndex(i)}
                            aria-label={`Show photo ${i + 1}`}
                            className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-gray-100 transition sm:h-20 sm:w-20 ${
                                i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                            }`}>
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Full-screen viewer (zoom, rotate, arrow keys) — renders nothing until opened */}
            <div className="hidden">
                <Image.PreviewGroup
                    items={images}
                    preview={{
                        visible: viewerOpen,
                        current: index,
                        onVisibleChange: (v) => setViewerOpen(v),
                        onChange: (c) => setIndex(c),
                    }}
                />
            </div>
        </div>
    );
};

export default PetGallery;
