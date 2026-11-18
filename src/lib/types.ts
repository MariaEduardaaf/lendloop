import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";

// Row types come from the Convex functions, so the UI follows the backend.
export type LoanRow = FunctionReturnType<typeof api.loans.myRequests>[number];
export type ToolRow = FunctionReturnType<typeof api.tools.list>[number];
export type ListingRow = FunctionReturnType<typeof api.tools.myListings>[number];
export type IncomingRow = FunctionReturnType<typeof api.loans.incoming>[number];
