// Vite replaces import.meta.glob at build time. Declared here (instead of pulling in
// vite/client types) because it is the only Vite feature the tests use.
interface ImportMeta {
  glob(patterns: string[]): Record<string, () => Promise<unknown>>;
}
