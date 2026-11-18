// Convex trusts session tokens issued by Clerk. Set CLERK_JWT_ISSUER_DOMAIN in the
// Convex deployment env (your Clerk Frontend API URL). applicationID must match the
// token's "aud" claim, which Clerk's Convex integration sets to "convex".
const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
