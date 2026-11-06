import { describe, it, expect } from "vitest";
import { memoryDB } from "../src/storage/db.js";

describe("memoryDB (storage blocked, e.g. sandboxed embed)", () => {
  it("stores, reads, counts and clears by keyPath", async () => {
    const db = memoryDB();
    await db.put("sketches", { id: "a", code: "x" });
    await db.put("sounds", { name: "kick", blob: null });
    expect(await db.get("sketches", "a")).toEqual({ id: "a", code: "x" });
    expect(await db.count("sounds")).toBe(1);
    expect((await db.getAll("sketches")).length).toBe(1);
    await db.delete("sketches", "a");
    expect(await db.get("sketches", "a")).toBeUndefined();
    await db.clear("sounds");
    expect(await db.count("sounds")).toBe(0);
  });
  it("auto-increments render ids and refuses duplicate adds", async () => {
    const db = memoryDB();
    const a = await db.add("renders", { bytes: 1 });
    const b = await db.add("renders", { bytes: 2 });
    expect(b).toBe(a + 1);
    await db.add("media", { name: "m" });
    await expect(db.add("media", { name: "m" })).rejects.toThrow();
  });
});
