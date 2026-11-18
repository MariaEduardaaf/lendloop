import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 renamed `middleware` to `proxy`. Clerk needs it on every request to read
// the session. It does not decide access: the layout of the signed-in area does that
// (src/app/(app)/layout.tsx), and every Convex function checks the caller again.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|gif|svg|png|ico|webp|woff2?|ttf|map)).*)",
    "/(api|trpc)(.*)",
  ],
};
