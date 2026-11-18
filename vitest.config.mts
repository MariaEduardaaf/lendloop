import { defineConfig } from "vitest/config";

export default defineConfig({
  // Same alias as tsconfig, so tests can import src/lib files that use @convex/*.
  resolve: { alias: { "@convex": new URL("./convex", import.meta.url).pathname } },
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    include: ["tests/**/*.test.ts"],
  },
});
