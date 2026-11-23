"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { useAuth } from "@/context/AuthContext";
import { encodeMentions, type MentionRef } from "@/lib/mentionText";
import Avatar from "./Avatar";

type Suggestion = MentionRef & { label: string; sub: string | null; avatar: string | null };

// "@" at the start or after a space, then what's typed so far, right before the caret.
const QUERY_RE = /(?:^|\s)@([\p{L}\p{N}_.]{0,30})$/u;
const MAX_SHOWN = 6;

/**
 * @mentions for a web text box, like the app's composer: typing "@" lists your
 * pets and people (from /api/v1/social/mentions/suggest), picking one writes
 * "@name", and `encode` turns the picked ones into tokens before sending.
 *
 * Wire it up with `onChange` / `onSelect` / `onKeyDown` on the textarea and put
 * `menu` right under it. `onKeyDown` returns true when it used the key.
 */
export function useMentionPicker(
    box: RefObject<HTMLTextAreaElement>,
    text: string,
    setText: (value: string) => void,
    initial: MentionRef[] = []
) {
    const { isAuthenticated } = useAuth();
    const [query, setQuery] = useState<{ q: string; start: number } | null>(null);
    const [items, setItems] = useState<Suggestion[]>([]);
    const [active, setActive] = useState(0);
    const picked = useRef<MentionRef[]>(initial);
    const caretAfterPick = useRef<number | null>(null);

    /** Look at the text before the caret for an "@…" being typed. */
    const check = useCallback(() => {
        const el = box.current;
        if (!el || !isAuthenticated || el.selectionStart !== el.selectionEnd) return setQuery(null);
        const before = el.value.slice(0, el.selectionStart ?? 0);
        const m = before.match(QUERY_RE);
        setQuery(m ? { q: m[1], start: before.length - m[1].length - 1 } : null);
    }, [box, isAuthenticated]);

    // Fetch suggestions as the query changes, a beat after typing stops.
    useEffect(() => {
        if (!query) {
            setItems([]);
            return;
        }
        const ctrl = new AbortController();
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`/api/v1/social/mentions/suggest?q=${encodeURIComponent(query.q)}&limit=${MAX_SHOWN}`, {
                    credentials: "include",
                    signal: ctrl.signal,
                });
                if (!res.ok) return setItems([]);
                const body = await res.json();
                const pets: Suggestion[] = (body.pets ?? []).map((p: any) => ({
                    type: "pet" as const,
                    id: Number(p.pet_profile_id),
                    name: String(p.name ?? "").trim(),
                    label: p.name,
                    sub: "Your pet",
                    avatar: p.avatar_url ?? null,
                }));
                const users: Suggestion[] = (body.users ?? []).map((u: any) => ({
                    type: "user" as const,
                    id: Number(u.user_id),
                    name: String(u.social_username ?? "").trim(),
                    label: u.name || u.social_username,
                    sub: `@${u.social_username}`,
                    avatar: u.profile_image_url ?? null,
                }));
                // Names with brackets can't go in a token, so they can't be mentioned.
                setItems([...pets, ...users].filter((s) => s.name && s.id && !/[\[\]]/.test(s.name)).slice(0, MAX_SHOWN));
                setActive(0);
            } catch {
                /* aborted or offline: no list */
            }
        }, query.q ? 150 : 0);
        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
    }, [query]);

    // Put the caret after the name that was just picked.
    useEffect(() => {
        const at = caretAfterPick.current;
        const el = box.current;
        if (at === null || !el) return;
        caretAfterPick.current = null;
        el.focus();
        el.setSelectionRange(at, at);
    }, [text, box]);

    const pick = useCallback(
        (s: Suggestion) => {
            const el = box.current;
            if (!query || !el) return;
            const end = el.selectionStart ?? text.length;
            const insert = `@${s.name} `;
            setText(text.slice(0, query.start) + insert + text.slice(end));
            caretAfterPick.current = query.start + insert.length;
            if (!picked.current.some((m) => m.type === s.type && m.id === s.id)) {
                picked.current = [...picked.current, { name: s.name, type: s.type, id: s.id }];
            }
            setQuery(null);
        },
        [box, query, text, setText]
    );

    const open = query !== null && items.length > 0;

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): boolean => {
        if (!open) return false;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length);
            return true;
        }
        if ((e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.shiftKey) || e.key === "Tab") {
            e.preventDefault();
            pick(items[active]);
            return true;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            setQuery(null);
            return true;
        }
        return false;
    };

    const menu = open ? (
        <ul role="listbox" aria-label="Mention someone" className="mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {items.map((s, i) => (
                <li key={`${s.type}:${s.id}`} role="option" aria-selected={i === active}>
                    <button
                        type="button"
                        // Keep focus in the text box so the caret stays where it was.
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pick(s)}
                        onMouseEnter={() => setActive(i)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === active ? "bg-gray-100" : ""}`}
                    >
                        <Avatar src={s.avatar} name={s.label} size={32} />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-gray-900">{s.label}</span>
                            {s.sub && <span className="block truncate text-xs text-gray-500">{s.sub}</span>}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    ) : null;

    return {
        menu,
        onKeyDown,
        /** Call from the textarea's onChange and onSelect. */
        check,
        /** The text with every picked "@name" still in it turned into a mention token. */
        encode: (value: string) => encodeMentions(value, picked.current),
        /** Forget picked mentions after the text box is cleared. */
        reset: () => {
            picked.current = initial;
            setQuery(null);
        },
    };
}
