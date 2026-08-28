import styles from "./PetIdCard.module.css";

const DASH = "—";

// Stacked label + value, CNIC-style: small primary label above a Cheese Milky
// black entry. Mirrors the Field in the app's PetIdCard.
const Field = ({
    label,
    value,
    gap = true,
}: {
    label: string;
    value?: string | null;
    gap?: boolean;
}) => (
    <div className={gap ? styles.fieldGap : undefined}>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{value || DASH}</p>
    </div>
);

export interface PetIdCardProps {
    name?: string;
    parentName?: string;
    gender?: string;
    countryOfStay?: string;
    identityNumber?: string;
    dateOfBirth?: string;
    dateOfIssue?: string;
    dateOfExpiry?: string;
    photoUrl?: string;
    photoAlt?: string;
}

export default function PetIdCard({
    name = DASH,
    parentName = DASH,
    gender = DASH,
    countryOfStay = "Pakistan",
    identityNumber = DASH,
    dateOfBirth = DASH,
    dateOfIssue = DASH,
    dateOfExpiry = DASH,
    photoUrl,
    photoAlt = "",
}: PetIdCardProps) {
    return (
        <div className={styles.shell}>
            <div className={styles.card}>
                <div className={styles.header}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/paltuu bilkul tight.svg"
                        alt="Paltuu"
                        className={styles.wordmark}
                    />
                    <span className={styles.headerTitle}>Pet Identity Card</span>
                </div>

                <div className={styles.body}>
                    <div className={styles.fields}>
                        <Field label="Name" value={name} />
                        <Field label="Parent's Name" value={parentName} />

                        <div className={styles.pairedGrid}>
                            <div className={styles.colNarrow}>
                                <Field label="Gender" value={gender} />
                                <Field
                                    label="Identity Number"
                                    value={identityNumber}
                                />
                                <Field
                                    label="Date of Issue"
                                    value={dateOfIssue}
                                    gap={false}
                                />
                            </div>
                            <div className={styles.colWide}>
                                <Field
                                    label="Country of Stay"
                                    value={countryOfStay}
                                />
                                <Field
                                    label="Date of Birth"
                                    value={dateOfBirth}
                                />
                                <Field
                                    label="Date of Expiry"
                                    value={dateOfExpiry}
                                    gap={false}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.photoCol}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={photoUrl}
                            alt={photoAlt}
                            className={styles.photo}
                            loading="lazy"
                        />

                        {/* Signature area — what actually goes on the line is TBD */}
                        <div className={styles.signature}>
                            <div className={styles.signatureLine} />
                            <span className={styles.signatureCaption}>
                                Holder&apos;s Signature
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
