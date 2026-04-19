import NextAuth from "next-auth";
import { authoptions } from "./options";

const handler = NextAuth(authoptions);

export { handler as GET, handler as POST };
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
