"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Camera, ChevronRight, ImagePlus } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/community/Avatar";
import { useProfile } from "./ProfileProvider";

const inputClass = "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none";
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function Card({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-gray-900">{title}</h2>
            {children}
        </section>
    );
}

type UsernameState = { kind: "idle" | "checking" | "ok" | "bad"; message?: string };

function DetailsCard() {
    const { profile, refresh, setProfile } = useProfile();
    const { refreshUser } = useAuth();
    const [name, setName] = useState(profile.name);
    const [username, setUsername] = useState(profile.username ?? "");
    const [bio, setBio] = useState(profile.bio ?? "");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");
    const [cityId, setCityId] = useState("");
    const [cities, setCities] = useState<{ city_id: number; city_name: string }[]>([]);
    const [usernameState, setUsernameState] = useState<UsernameState>({ kind: "idle" });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
    const avatarInput = useRef<HTMLInputElement>(null);
    const coverInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let live = true;
        Promise.all([
            fetch("/api/v1/profile", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
            fetch("/api/v1/cities").then((r) => (r.ok ? r.json() : null)),
        ])
            .then(([me, cityData]) => {
                if (!live) return;
                if (me) {
                    setEmail(me.email ?? "");
                    setPhone(me.phone_number ?? "");
                    setDob(me.dob ? String(me.dob).slice(0, 10) : "");
                    setCityId(me.city_id ? String(me.city_id) : "");
                }
                const list = Array.isArray(cityData) ? cityData : (cityData?.cities ?? cityData?.data ?? []);
                setCities(list);
            })
            .catch(() => {});
        return () => {
            live = false;
        };
    }, []);

    useEffect(() => {
        const trimmed = username.trim();
        if (!trimmed || trimmed === (profile.username ?? "")) {
            setUsernameState({ kind: "idle" });
            return;
        }
        setUsernameState({ kind: "checking" });
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/v1/social/username/check?q=${encodeURIComponent(trimmed)}`);
                const data = await res.json();
                if (!data.valid) setUsernameState({ kind: "bad", message: data.error || "That username isn't valid" });
                else if (!data.available) setUsernameState({ kind: "bad", message: "That username is taken" });
                else setUsernameState({ kind: "ok", message: "Available" });
            } catch {
                setUsernameState({ kind: "idle" });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [username, profile.username]);

    const upload = async (kind: "avatar" | "cover", file: File) => {
        setUploading(kind);
        try {
            const form = new FormData();
            form.append("file", file);
            const url = kind === "avatar" ? "/api/v1/profile/avatar" : "/api/v1/social/profile/cover";
            const res = await fetch(url, { method: "POST", credentials: "include", body: form });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "Upload failed");
            setProfile(kind === "avatar" ? { avatar: data.url } : { cover: data.url });
            if (kind === "avatar") await refreshUser();
            toast.success(kind === "avatar" ? "Profile photo updated" : "Cover photo updated");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Upload failed");
        } finally {
            setUploading(null);
        }
    };

    const save = async (e: FormEvent) => {
        e.preventDefault();
        if (usernameState.kind === "checking") return toast.error("Please wait for the username check to finish");
        if (usernameState.kind === "bad") return toast.error(usernameState.message || "Fix the username first");
        if (!name.trim()) return toast.error("Please add your name");

        setSaving(true);
        try {
            const social = await fetch("/api/v1/social/profile/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: name.trim(),
                    bio: bio.trim(),
                    ...(username.trim() && username.trim() !== (profile.username ?? "") ? { social_username: username.trim() } : {}),
                }),
            });
            if (!social.ok) {
                const data = await social.json().catch(() => null);
                throw new Error(data?.error || "Could not save your profile");
            }
            const personal = await fetch("/api/v1/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                // Empty fields stay as they are: the API keeps the old value for a null.
                body: JSON.stringify({ phone_number: phone.trim() || null, dob: dob || null, city_id: cityId ? Number(cityId) : null }),
            });
            if (!personal.ok) {
                const data = await personal.json().catch(() => null);
                throw new Error(data?.error || "Could not save your details");
            }
            await Promise.all([refresh(), refreshUser()]);
            toast.success("Profile updated");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save your profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card title="Edit profile">
            <div className="mb-4 flex flex-wrap items-center gap-4">
                <button type="button" onClick={() => avatarInput.current?.click()} disabled={Boolean(uploading)} aria-label="Change profile photo" className="relative shrink-0 rounded-full">
                    <Avatar src={profile.avatar} name={profile.name} size={64} />
                    <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-gray-200 bg-white p-1 text-gray-700">
                        <Camera size={13} />
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => coverInput.current?.click()}
                    disabled={Boolean(uploading)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                    <ImagePlus size={15} /> {uploading === "cover" ? "Uploading…" : "Change cover photo"}
                </button>
                {uploading === "avatar" && <span className="text-sm text-gray-500">Uploading…</span>}
                <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload("avatar", e.target.files[0])} />
                <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload("cover", e.target.files[0])} />
            </div>

            <form onSubmit={save} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                    Name
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={inputClass} />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                    Username
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-sm text-gray-400">@</span>
                        <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} autoCapitalize="none" className={`${inputClass} pl-7`} />
                    </div>
                    {usernameState.kind === "checking" && <span className="mt-1 block text-xs text-gray-400">Checking…</span>}
                    {usernameState.kind === "ok" && <span className="mt-1 block text-xs text-green-700">{usernameState.message}</span>}
                    {usernameState.kind === "bad" && <span className="mt-1 block text-xs text-red-600">{usernameState.message}</span>}
                </label>
                <label className="block text-sm font-medium text-gray-700">
                    Bio
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} placeholder="Write a little about yourself or your pets…" className={inputClass} />
                    <span className="mt-1 block text-xs text-gray-400">Anyone who can see your profile can read this.</span>
                </label>

                <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Private details, not shown on your profile</p>
                </div>
                <label className="block text-sm font-medium text-gray-700">
                    Email
                    <input value={email} readOnly disabled className={`${inputClass} bg-gray-50 text-gray-500`} />
                    <span className="mt-1 block text-xs text-gray-400">To change your email, use Settings in the Paltuu app.</span>
                </label>
                <label className="block text-sm font-medium text-gray-700">
                    Phone
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" className={inputClass} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Date of birth
                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        City
                        <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={inputClass}>
                            <option value="">Choose a city</option>
                            {cities.map((c) => (
                                <option key={c.city_id} value={c.city_id}>
                                    {c.city_name}
                                </option>
                            ))}
                        </select>
                        <span className="mt-1 block text-xs font-normal text-gray-400">Your posts appear on your city&apos;s community page.</span>
                    </label>
                </div>
                <button type="submit" disabled={saving} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                    {saving ? "Saving…" : "Save changes"}
                </button>
            </form>
        </Card>
    );
}

function PrivacyCard() {
    const { profile, refresh } = useProfile();
    const [saving, setSaving] = useState(false);

    const toggle = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/v1/social/profile/privacy", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ is_private: !profile.isPrivate }),
            });
            if (!res.ok) throw new Error();
            await refresh();
        } catch {
            toast.error("Could not change your privacy setting");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card title="Privacy">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-900">Private account</p>
                    <p className="text-xs leading-relaxed text-gray-500">Only people you approve can see your posts and pets.</p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={profile.isPrivate}
                    aria-label="Private account"
                    disabled={saving}
                    onClick={toggle}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${profile.isPrivate ? "bg-primary" : "bg-gray-300"}`}
                >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${profile.isPrivate ? "left-[22px]" : "left-0.5"}`} />
                </button>
            </div>
        </Card>
    );
}

type RequestRow = { follow_id: number; user_id: number; name: string | null; social_username: string | null; profile_image_url: string | null };
type BlockedRow = { user_id: number; display_name: string | null; username: string | null; avatar_url: string | null };

function PersonLine({ id, name, handle, avatar, children }: { id: number; name: string; handle: string | null; avatar: string | null; children: ReactNode }) {
    return (
        <li className="flex items-center gap-3 py-2">
            <Link href={`/profile/${id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar src={avatar} name={name} size={36} />
                <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900">{name}</span>
                    {handle && <span className="block truncate text-xs text-gray-500">@{handle}</span>}
                </span>
            </Link>
            {children}
        </li>
    );
}

function FollowRequestsCard() {
    const { refresh } = useProfile();
    const [rows, setRows] = useState<RequestRow[] | null>(null);

    const load = useCallback(async () => {
        const res = await fetch("/api/v1/social/follow-requests", { credentials: "include" }).catch(() => null);
        if (res?.ok) setRows((await res.json()).requests ?? []);
        else setRows([]);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const answer = async (row: RequestRow, action: "accept" | "reject") => {
        const res = await fetch(`/api/v1/social/follow-requests/${row.follow_id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ action }),
        });
        if (!res.ok) return toast.error("Could not answer this request");
        setRows((prev) => prev?.filter((r) => r.follow_id !== row.follow_id) ?? null);
        refresh();
    };

    if (!rows || rows.length === 0) return null;
    return (
        <Card title={`Follow requests (${rows.length})`}>
            <ul className="divide-y divide-gray-100">
                {rows.map((r) => (
                    <PersonLine key={r.follow_id} id={r.user_id} name={r.name || r.social_username || "Paltuu member"} handle={r.social_username} avatar={r.profile_image_url}>
                        <button type="button" onClick={() => answer(r, "accept")} className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">Accept</button>
                        <button type="button" onClick={() => answer(r, "reject")} className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700">Decline</button>
                    </PersonLine>
                ))}
            </ul>
        </Card>
    );
}

function BlockedCard() {
    const [rows, setRows] = useState<BlockedRow[] | null>(null);

    useEffect(() => {
        fetch("/api/v1/users/me/blocked", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setRows(d?.blocked_users ?? []))
            .catch(() => setRows([]));
    }, []);

    const unblock = async (row: BlockedRow) => {
        const res = await fetch(`/api/v1/users/${row.user_id}/block`, { method: "DELETE", credentials: "include" });
        if (!res.ok) return toast.error("Could not unblock this user");
        setRows((prev) => prev?.filter((r) => r.user_id !== row.user_id) ?? null);
    };

    return (
        <Card title="Blocked users">
            {rows === null ? (
                <p className="text-sm text-gray-400">Loading…</p>
            ) : rows.length === 0 ? (
                <p className="text-sm text-gray-500">You haven&apos;t blocked anyone.</p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {rows.map((r) => (
                        <PersonLine key={r.user_id} id={r.user_id} name={r.display_name || r.username || "Paltuu member"} handle={r.username} avatar={r.avatar_url}>
                            <button type="button" onClick={() => unblock(r)} className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700">Unblock</button>
                        </PersonLine>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function PasswordCard() {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!current) return toast.error("Enter your current password");
        if (!passwordRule.test(next)) return toast.error("Use at least 8 characters with uppercase, lowercase, a number and a special character");
        if (next !== confirm) return toast.error("The new passwords don't match");
        setSaving(true);
        try {
            const res = await fetch("/api/v1/profile/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword: current, newPassword: next }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || data?.error || "Could not change your password");
            }
            toast.success("Password changed");
            setCurrent("");
            setNext("");
            setConfirm("");
            setOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not change your password");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card title="Password">
            {!open ? (
                <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Change password
                </button>
            ) : (
                <form onSubmit={submit} className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Current password
                        <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        New password
                        <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        Confirm new password
                        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
                    </label>
                    <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                            {saving ? "Saving…" : "Update password"}
                        </button>
                        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </Card>
    );
}

const LINKS = [
    { href: "/my-listings", label: "My adoption listings" },
    { href: "/adoption-applicants", label: "Adoption requests" },
    { href: "/my-applications", label: "My applications" },
    { href: "/support", label: "Help" },
    { href: "/about", label: "About Paltuu" },
    { href: "/privacy-policy", label: "Privacy policy" },
    { href: "/delete-account", label: "Delete account" },
];

export default function AccountPanel() {
    const { logout } = useAuth();

    return (
        <div className="space-y-4">
            <FollowRequestsCard />
            <DetailsCard />
            <PrivacyCard />
            <PasswordCard />
            <BlockedCard />
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <ul className="divide-y divide-gray-100">
                    {LINKS.map((l) => (
                        <li key={l.href}>
                            <Link href={l.href} className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50">
                                {l.label} <ChevronRight size={16} className="text-gray-400" />
                            </Link>
                        </li>
                    ))}
                    <li>
                        <button type="button" onClick={() => logout()} className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-gray-50">
                            Log out
                        </button>
                    </li>
                </ul>
            </section>
        </div>
    );
}
