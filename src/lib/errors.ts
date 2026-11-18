import { ConvexError } from "convex/values";

/**
 * Turns anything a mutation can throw into a sentence for the user.
 * The backend throws ConvexError("short readable message") for every rule violation,
 * so that text is shown as is. Anything else (network, unexpected) gets a generic line.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ConvexError && typeof error.data === "string") return error.data;
  return "Something went wrong. Please try again.";
}
