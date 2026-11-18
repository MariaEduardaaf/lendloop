// Convex trusts JWTs issued by Clerk. Set CLERK_JWT_ISSUER_DOMAIN in the Convex
// deployment env (your Clerk Frontend API URL). The Clerk JWT template must be
// named "convex" (applicationID below).
const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
