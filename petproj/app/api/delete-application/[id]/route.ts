import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth/next";
import { authoptions } from "../../auth/[...nextauth]/options";

interface JWTPayload {
    user_id: string;
    email: string;
    iat?: number;
    exp?: number;
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const { pathname } = req.nextUrl;
    const applicationId = pathname.split('/').pop(); // Extract the application ID from the URL

    if (!applicationId) {
        return NextResponse.json(
            { error: "Application ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const [type, id] = applicationId.split('_'); // Split ID to determine foster or adoption type
    if (!id || (type !== "foster" && type !== "adoption")) {
        return NextResponse.json(
            { error: "Invalid application ID" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        let userId: string | null = null;

        // Try NextAuth session first
        const session = await getServerSession(authoptions);
        if (session?.user) {
            userId = (session.user as any).user_id || (session.user as any).id;
        }

        // If no session, try JWT token from cookies
        if (!userId) {
            const token = req.cookies.get("token")?.value;
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
                    userId = decoded.user_id;
                } catch (jwtError) {
                    console.error("JWT verification failed:", jwtError);
                }
            }
        }

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required" },
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        await client.connect();

        // First, verify ownership of the application
        let ownershipQuery;
        if (type === "foster") {
            ownershipQuery = `
                SELECT user_id FROM foster_applications
                WHERE foster_id = $1
            `;
        } else {
            ownershipQuery = `
                SELECT user_id FROM adoption_applications
                WHERE adoption_id = $1
            `;
        }

        const ownershipResult = await client.query(ownershipQuery, [id]);
        
        if (ownershipResult.rowCount === 0) {
            return NextResponse.json(
                { error: `${type.charAt(0).toUpperCase() + type.slice(1)} application not found` },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const applicationOwnerId = ownershipResult.rows[0].user_id;
        if (applicationOwnerId !== userId) {
            return NextResponse.json(
                { error: "You can only delete your own applications" },
                {
                    status: 403,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Now delete the application
        let deleteQuery;
        if (type === "foster") {
            deleteQuery = `
                DELETE FROM foster_applications
                WHERE foster_id = $1
                RETURNING *;
            `;
        } else {
            deleteQuery = `
                DELETE FROM adoption_applications
                WHERE adoption_id = $1
                RETURNING *;
            `;
        }

        const result = await client.query(deleteQuery, [id]);

        // Return a success response with the deleted application data
        return NextResponse.json(
            {
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} application deleted successfully.`,
                deletedApplication: result.rows[0],
            },
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end(); // Close the database connection
    }
}