import { getUserFromRequest } from "@/utils/authServer";
import { NextRequest } from "next/server";

// Vets at Home ("Express Vet") — mirrors app/api/v1/admin/adminAuth.ts's checkAdmin pattern.
export async function checkDispatcher(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || (user.role !== "dispatcher" && user.role !== "admin")) {
    return null;
  }
  return user;
}
