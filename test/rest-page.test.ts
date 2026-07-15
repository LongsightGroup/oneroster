import { describe, expect, it } from "vitest";

import { hasMoreOneRosterV1p1Page } from "../src/v1p1/index.js";
import { hasMoreOneRosterV1p2Page } from "../src/v1p2/index.js";

describe("OneRoster REST page termination", () => {
  it("gives a validated next link precedence over conflicting totals", () => {
    const page = {
      items: [],
      limit: 100,
      offset: 10,
      totalCount: 10,
      links: { next: "https://sis.example/users?offset=10" },
    };
    expect(hasMoreOneRosterV1p2Page(page)).toBe(true);
    expect(hasMoreOneRosterV1p1Page(page)).toBe(true);
  });

  it("uses totalCount when no next link is present", () => {
    expect(
      hasMoreOneRosterV1p2Page({
        items: [{}],
        limit: 1,
        offset: 0,
        totalCount: 1,
        links: {},
      }),
    ).toBe(false);
    expect(
      hasMoreOneRosterV1p2Page({
        items: [{}],
        limit: 1,
        offset: 0,
        totalCount: 2,
        links: {},
      }),
    ).toBe(true);
  });

  it("terminates an empty page and allows offset fallback for a non-empty page without totals", () => {
    expect(hasMoreOneRosterV1p2Page({ items: [], limit: 100, offset: 0, links: {} })).toBe(false);
    expect(hasMoreOneRosterV1p2Page({ items: [{}], limit: 100, offset: 0, links: {} })).toBe(true);
  });
});
