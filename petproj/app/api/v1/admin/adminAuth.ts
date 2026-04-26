import { getUserFromRequest } from "@/utils/authServer";
import { NextRequest } from "next/server";

export async function checkAdmin(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
        return null;
    }
    return user;
}
