"use client";

import { useEffect, useRef } from "react";
import type { PostMedia } from "@/lib/community";

/**
 * A post's video with real controls (PALTU-188).
 *
 * Plays the H.264 HLS copy when MediaConvert has made one: natively where the
 * browser speaks HLS (Safari, iOS), through hls.js everywhere else. Until it's
 * ready, or if HLS can't load, it plays the raw upload. iPhone uploads are
 * HEVC, which only Apple browsers decode reliably, which is why the raw file
 * alone left most viewers with a still frame.
 */
export default function PostVideo({
    media,
    className,
    style,
}: {
    media: PostMedia;
    className?: string;
    style?: React.CSSProperties;
}) {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = ref.current;
        if (!video) return;
        const raw = media.url;
        const hls = media.hls;

        if (!hls) {
            video.src = raw;
            return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = hls;
            return;
        }

        let destroyed = false;
        let player: import("hls.js").default | null = null;
        import("hls.js")
            .then(({ default: Hls }) => {
                if (destroyed) return;
                if (!Hls.isSupported()) {
                    video.src = raw;
                    return;
                }
                player = new Hls({ capLevelToPlayerSize: true });
                player.on(Hls.Events.ERROR, (_e, data) => {
                    if (!data.fatal) return;
                    player?.destroy();
                    player = null;
                    video.src = raw;
                });
                player.loadSource(hls);
                player.attachMedia(video);
            })
            .catch(() => {
                if (!destroyed) video.src = raw;
            });

        return () => {
            destroyed = true;
            player?.destroy();
        };
    }, [media.url, media.hls]);

    return (
        <video
            ref={ref}
            controls
            playsInline
            preload="metadata"
            poster={media.thumb ?? undefined}
            className={className}
            style={style}
        />
    );
}
