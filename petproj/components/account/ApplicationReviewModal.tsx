"use client";

// One adoption application, in full, with the decision buttons. Opened from My
// Listings (PALTU-141): from the "Waiting on you" queue, from a listing's
// applicant list, or from a notification link (?application=ID).

import React from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Phone, MessageCircle } from "lucide-react";
import { formatPhoneDisplay } from "@/utils/phone";
import { formatShortDate } from "@/utils/listingDisplay";
import { assessFit, fitSummary, type FitPet, type Verdict } from "@/utils/applicationFit";
import { Modal, Avatar, Pill, APPLICATION_PILL, btn } from "./ui";

/** A row from GET /api/v1/applications/my-pets. */
export interface OwnerApplication {
    adoption_id: number;
    user_id: number | null;
    adopter_image: string | null;
    status: string;
    created_at: string;
    adopter_name: string;
    contact_info: string | null;
    adopter_address: string | null;
    age_of_youngest_child: string | number | null;
    other_pets_details: string | null;
    other_pets_neutered: boolean | null;
    has_secure_outdoor_area: boolean | null;
    pet_sleep_location: string | null;
    pet_left_alone: string | null;
    additional_details: string | null;
    agree_to_terms: boolean | null;
    city_name: string | null;
    pet_name: string;
    pet_id: number;
    image_url: string | null;
}

export const appStatus = (a: Pick<OwnerApplication, "status">) => (a.status || "pending").toLowerCase();

const yesNo = (v: boolean | null | undefined) => (v === null || v === undefined ? "Not stated" : v ? "Yes" : "No");

export function VerdictTag({ verdict }: { verdict: Verdict }) {
    if (verdict === "fits")
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                <Check size={14} strokeWidth={2.6} aria-hidden="true" />
                Fits
            </span>
        );
    if (verdict === "check")
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                <AlertCircle size={14} aria-hidden="true" />
                Check
            </span>
        );
    return <span className="text-xs font-medium text-gray-500">Your call</span>;
}

/** "2 of 2 fit" next to an applicant's name. */
export function FitBadge({ app, pet, separator }: { app: OwnerApplication; pet?: FitPet | null; separator?: boolean }) {
    const s = fitSummary(assessFit(app, pet));
    if (!s) return null;
    return (
        <span className="whitespace-nowrap">
            {separator && <span className="text-gray-500">· </span>}
            <span className={`text-xs font-medium ${s.hasCheck ? "text-amber-700" : "text-green-700"}`}>
                {s.fits} of {s.total} fit
            </span>
        </span>
    );
}

export default function ApplicationReviewModal({
    app,
    pet,
    petName,
    otherPending,
    position,
    onPrev,
    onNext,
    onClose,
    onApprove,
    onDecline,
    busy,
    canDecide,
}: {
    app: OwnerApplication | null;
    pet?: FitPet | null;
    petName: string;
    /** Other pending applications on the same pet (declined automatically on approve). */
    otherPending: number;
    /** "2 of 5" when browsing a list. */
    position?: string;
    onPrev?: () => void;
    onNext?: () => void;
    onClose: () => void;
    onApprove: (app: OwnerApplication) => void;
    onDecline: (app: OwnerApplication) => void;
    busy: boolean;
    /** False once the pet is adopted: decisions are closed. */
    canDecide: boolean;
}) {
    if (!app) return null;
    const status = appStatus(app);
    const firstName = app.adopter_name?.split(" ")[0] || "This applicant";
    const fit = assessFit(app, pet);
    const summary = fitSummary(fit);
    const phone = app.contact_info ? formatPhoneDisplay(app.contact_info) : null;
    const pill = APPLICATION_PILL[status] ?? APPLICATION_PILL.pending;

    const facts: { label: string; value: string }[] = [
        { label: "Lives in", value: [app.adopter_address, app.city_name].filter(Boolean).join(", ") || "Not provided" },
        {
            label: "Youngest child",
            value: app.age_of_youngest_child === null || app.age_of_youngest_child === "" ? "No children mentioned" : `${app.age_of_youngest_child} years`,
        },
        { label: "Other pets", value: app.other_pets_details || "None" },
        { label: "Other pets neutered", value: yesNo(app.other_pets_neutered) },
        { label: "Secure outdoor area", value: yesNo(app.has_secure_outdoor_area) },
        { label: "Pet will sleep", value: app.pet_sleep_location || "Not provided" },
        { label: "Alone each day", value: app.pet_left_alone || "Not provided" },
    ];

    const decisionNote =
        status === "approved"
            ? `You approved ${firstName}. Get in touch to arrange a meet-and-greet with ${petName}.`
            : status === "rejected"
              ? `You declined ${firstName}.`
              : `Approving ${firstName} marks ${petName} as adopted${
                    otherPending > 0 ? ` and declines the other ${otherPending} pending ${otherPending === 1 ? "application" : "applications"}` : ""
                }. Everyone who applied is notified.`;

    const footer =
        canDecide && status !== "approved" ? (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                {status === "pending" && (
                    <button type="button" disabled={busy} onClick={() => onDecline(app)} className={btn.secondary}>
                        Decline
                    </button>
                )}
                <button type="button" disabled={busy} onClick={() => onApprove(app)} className={`${btn.primary} ${status !== "pending" ? "col-span-2" : ""}`}>
                    <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                    {status === "rejected" ? "Approve instead" : `Approve ${firstName}`}
                </button>
            </div>
        ) : undefined;

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            closeDisabled={busy}
            title={
                <span className="flex items-center gap-3">
                    <Avatar src={app.adopter_image} name={app.adopter_name} size={40} />
                    <span className="min-w-0">
                        <span className="block truncate">{app.adopter_name}</span>
                        <span className="block text-sm font-normal text-gray-500">
                            Wants to adopt {petName} · applied {formatShortDate(app.created_at)}
                        </span>
                    </span>
                </span>
            }
            footer={footer}>
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                        {summary && (
                            <Pill tone={summary.hasCheck ? "amber" : "green"}>
                                {summary.fits} of {summary.total} needs fit
                            </Pill>
                        )}
                    </div>
                    {position && (
                        <div className="flex items-center gap-1">
                            <span className="mr-1 text-xs text-gray-500 tabular-nums">{position}</span>
                            <button type="button" aria-label="Previous application" onClick={onPrev} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
                                <ChevronLeft size={16} />
                            </button>
                            <button type="button" aria-label="Next application" onClick={onNext} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm leading-relaxed text-gray-700">{decisionNote}</p>

                {phone && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-3.5">
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm font-semibold text-gray-900">
                                <span className="mr-1.5">{phone.flag}</span>
                                {phone.pretty}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <a href={`tel:${phone.e164}`} className={btn.smSecondary}>
                                <Phone size={14} aria-hidden="true" />
                                Call
                            </a>
                            <a
                                href={`https://wa.me/${phone.digits}?text=${encodeURIComponent(`Hi ${firstName}, this is about your Paltuu application for ${petName}.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-green-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-700">
                                <MessageCircle size={14} aria-hidden="true" />
                                WhatsApp
                            </a>
                        </div>
                    </div>
                )}

                <section>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">
                        How {firstName} fits {petName}&apos;s needs
                    </h3>
                    <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
                        {fit.map((row) => (
                            <div key={row.need} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-3.5 py-3 text-sm sm:grid-cols-[100px_1fr_1fr_70px] sm:items-center">
                                <span className="font-medium text-gray-900">{row.need}</span>
                                <span className="justify-self-end sm:hidden">
                                    <VerdictTag verdict={row.verdict} />
                                </span>
                                <span className="col-span-2 text-gray-600 sm:col-span-1">
                                    <span className="text-gray-400 sm:hidden">{petName}: </span>
                                    {row.pet}
                                </span>
                                <span className="col-span-2 break-words text-gray-900 sm:col-span-1">
                                    <span className="text-gray-400 sm:hidden">{firstName}: </span>
                                    {row.them}
                                </span>
                                <span className="hidden justify-end sm:flex">
                                    <VerdictTag verdict={row.verdict} />
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">Home and household</h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-xl border border-gray-200 p-3.5 sm:grid-cols-2">
                        {facts.map((f) => (
                            <div key={f.label} className="min-w-0">
                                <dt className="text-xs text-gray-500">{f.label}</dt>
                                <dd className="break-words text-sm font-medium text-gray-900">{f.value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">In their words</h3>
                    <p className={`whitespace-pre-line rounded-xl border border-gray-200 p-3.5 text-[15px] leading-7 ${app.additional_details ? "text-gray-700" : "text-gray-500"}`}>
                        {app.additional_details || "No additional details shared."}
                    </p>
                    {app.agree_to_terms && <p className="mt-2 text-xs text-gray-500">Agreed to the Paltuu adoption terms when applying.</p>}
                </section>
            </div>
        </Modal>
    );
}
