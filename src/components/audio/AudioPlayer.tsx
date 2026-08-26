"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

interface AudioPlayerProps {
    src: string;
    label?: string;
    autoPlay?: boolean;
}

export default function AudioPlayer({
                                        src,
                                        label = "Listen",
                                        autoPlay = false,
                                    }: AudioPlayerProps) {
    const audioRef =
        useRef<HTMLAudioElement | null>(
            null,
        );

    const [playing, setPlaying] =
        useState(false);

    const [currentTime, setCurrentTime] =
        useState(0);

    const [duration, setDuration] =
        useState(0);

    const [error, setError] =
        useState(false);

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        function handleLoadedMetadata() {
            setDuration(
                Number.isFinite(
                    audio!.duration,
                )
                    ? audio!.duration
                    : 0,
            );
        }

        function handleTimeUpdate() {
            setCurrentTime(
                audio!.currentTime,
            );
        }

        function handleEnded() {
            setPlaying(false);
            setCurrentTime(0);
        }

        function handleError() {
            setPlaying(false);
            setError(true);
        }

        audio.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata,
        );

        audio.addEventListener(
            "timeupdate",
            handleTimeUpdate,
        );

        audio.addEventListener(
            "ended",
            handleEnded,
        );

        audio.addEventListener(
            "error",
            handleError,
        );

        return () => {
            audio.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata,
            );

            audio.removeEventListener(
                "timeupdate",
                handleTimeUpdate,
            );

            audio.removeEventListener(
                "ended",
                handleEnded,
            );

            audio.removeEventListener(
                "error",
                handleError,
            );
        };
    }, [src]);

    useEffect(() => {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        audio.pause();
        audio.currentTime = 0;

        setPlaying(false);
        setCurrentTime(0);
        setError(false);

        if (autoPlay) {
            void audio
                .play()
                .then(() => {
                    setPlaying(true);
                })
                .catch(() => {
                    setPlaying(false);
                });
        }
    }, [src, autoPlay]);

    async function togglePlayback() {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        if (error) {
            return;
        }

        if (playing) {
            audio.pause();
            setPlaying(false);
            return;
        }

        try {
            await audio.play();
            setPlaying(true);
        } catch {
            setPlaying(false);
            setError(true);
        }
    }

    function seek(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const audio =
            audioRef.current;

        if (!audio) {
            return;
        }

        const value =
            Number(event.target.value);

        audio.currentTime = value;
        setCurrentTime(value);
    }

    function formatTime(
        value: number,
    ) {
        if (
            !Number.isFinite(value) ||
            value < 0
        ) {
            return "0:00";
        }

        const minutes =
            Math.floor(value / 60);

        const seconds =
            Math.floor(value % 60)
                .toString()
                .padStart(2, "0");

        return `${minutes}:${seconds}`;
    }

    return (
        <div className="w-full rounded-3xl border border-zinc-200 bg-white p-5">
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
            />

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={
                        togglePlayback
                    }
                    disabled={error}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xl text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={
                        playing
                            ? "Pause audio"
                            : "Play audio"
                    }
                >
                    {playing
                        ? "Ⅱ"
                        : "▶"}
                </button>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900">
                        {error
                            ? "Audio unavailable"
                            : label}
                    </p>

                    {!error && (
                        <div className="mt-2 flex items-center gap-3">
                            <span className="w-10 text-xs text-zinc-400">
                                {formatTime(
                                    currentTime,
                                )}
                            </span>

                            <input
                                type="range"
                                min="0"
                                max={
                                    duration ||
                                    0
                                }
                                step="0.1"
                                value={
                                    Math.min(
                                        currentTime,
                                        duration ||
                                        0,
                                    )
                                }
                                onChange={
                                    seek
                                }
                                disabled={
                                    duration ===
                                    0
                                }
                                className="h-2 flex-1 cursor-pointer accent-zinc-900 disabled:cursor-default"
                                aria-label="Audio progress"
                            />

                            <span className="w-10 text-right text-xs text-zinc-400">
                                {formatTime(
                                    duration,
                                )}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <p className="mt-3 text-xs text-red-600">
                    The audio file could not be
                    loaded.
                </p>
            )}
        </div>
    );
}