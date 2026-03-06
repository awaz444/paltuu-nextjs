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

// ─── Pets ────────────────────────────────────────────────────────────────────

/** Browse all pets with filters */
export async function getPetsApi(queryString: string = ""): Promise<any> {
    const url = queryString ? `${BACKEND_URL}/pets?${queryString}` : `${BACKEND_URL}/pets`;
    const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch pets");
    return data;
}

/** Get details of a specific pet */
export async function getPetByIdApi(id: string | number): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/pets/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch pet");
    return data;
}

/** List a new pet (Requires Auth) */
export async function createPetApi(payload: any): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/pets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create pet");
    return data;
}

/** Update a pet listing */
export async function updatePetApi(id: string | number, payload: any): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/pets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update pet");
    return data;
}

/** Delete a pet listing */
export async function deletePetApi(id: string | number): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/pets/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete pet");
    return data;
}

// ─── Adoptions ───────────────────────────────────────────────────────────────

/** Submit a new adoption or foster application */
export async function submitAdoptionApplicationApi(payload: any): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/adoptions/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
        const message = Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Failed to submit application";
        throw new Error(message);
    }
    return data;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

/** Get all pet categories */
export async function getPetCategoriesApi(): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/metadata/pet-categories`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch categories");
    return data;
}

/** Get all cities */
export async function getCitiesApi(): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/metadata/cities`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch cities");
    return data;
}

/** Approve a pet listing */
export async function approvePetApi(id: string | number): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/pets/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to approve pet");
    return data;
}

/** Upload images for a pet listing */
export async function uploadPetImagesApi(id: string | number, formData: FormData): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/pets/${id}/images`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to upload images");
    return data;
}

/** Get applications received for user's pet listings */
export async function getReceivedApplicationsApi(): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/adoptions/applications/received`, {
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch received applications");
    return data;
}

/** Update status of an adoption application */
export async function updateApplicationStatusApi(id: string | number, status: 'approved' | 'rejected' | 'pending'): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/adoptions/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update application status");
    return data;
}

/** Get entity (shelter/shop) for the current user */
export async function getMyEntityApi(): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/core/my-entity`, {
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch entity info");
    return data;
}






