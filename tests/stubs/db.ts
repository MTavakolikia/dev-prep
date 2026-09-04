// stub: never touch SQLite from unit tests
type AnyPrisma = Record<string, never>;
export const db = {} as AnyPrisma;
export default db;
