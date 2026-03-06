/**
 * api.ts — Direct client-side calls to the NestJS backend.
 * The backend is configured with CORS + credentials:true for localhost:3000,
 * so cookies (httpOnly token) are correctly set cross-origin.
 */

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    success: boolean;
    user: {
        id: number;
        user_id: number;
        name: string;
        email: string;
        role: string;
        profile_image_url?: string;
    };
}

/** Login via NestJS — sets an httpOnly `token` cookie on the browser. */
export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
    const res = await fetch(`${BACKEND_URL}/core/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send & receive cookies cross-origin
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        // NestJS returns { message: string } on errors
        const message = Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Login failed";
        throw new Error(message);
    }

    return data as LoginResponse;
}

/** Google login via NestJS — sets an httpOnly `token` cookie on the browser. */
export async function googleLoginApi(payload: {
    email: string;
    name?: string;
}): Promise<LoginResponse> {
    const res = await fetch(`${BACKEND_URL}/core/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const message = Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Google login failed";
        throw new Error(message);
    }

    return data as LoginResponse;
}

/** Logout via NestJS — clears the httpOnly `token` cookie. */
export async function logoutApi(): Promise<void> {
    await fetch(`${BACKEND_URL}/core/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
}
