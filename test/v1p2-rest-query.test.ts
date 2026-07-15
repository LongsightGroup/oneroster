import { describe, expect, it } from "vitest";

import {
  combineOneRosterV1p2Filters,
  createOneRosterV1p2FilterClause,
  createOneRosterV1p2Query,
  serializeOneRosterV1p2Filter,
  serializeOneRosterV1p2Query,
} from "../src/v1p2/index.js";

describe("OneRoster 1.2 REST query boundary", () => {
  it("serializes pagination, nested sort, projection, and a quoted Unicode filter once", () => {
    const clause = createOneRosterV1p2FilterClause("name.display", "~", "O'Connor");
    expect(clause._tag).toBe("ok");
    if (clause._tag === "err") return;
    const query = createOneRosterV1p2Query({
      limit: 25,
      offset: 10,
      sort: "name.display",
      orderBy: "asc",
      filter: clause.value,
      fields: ["sourcedId", "name.display"],
    });
    expect(query._tag).toBe("ok");
    if (query._tag === "err") return;
    expect(serializeOneRosterV1p2Filter(query.value.filter!)).toBe("name.display~'O''Connor'");
    expect(serializeOneRosterV1p2Query(query.value)).toMatchObject({
      _tag: "ok",
      value:
        "limit=25&offset=10&sort=name.display&orderBy=asc&filter=name.display%7E%27O%27%27Connor%27&fields=sourcedId%2Cname.display",
    });
  });

  it("supports exactly one AND or OR join", () => {
    const left = createOneRosterV1p2FilterClause("status", "=", "active");
    const right = createOneRosterV1p2FilterClause("grade", ">=", 5);
    expect(left._tag).toBe("ok");
    expect(right._tag).toBe("ok");
    if (left._tag === "err" || right._tag === "err") return;
    const filter = combineOneRosterV1p2Filters(left.value, "OR", right.value);
    expect(filter._tag).toBe("ok");
    expect(filter._tag === "ok" ? serializeOneRosterV1p2Filter(filter.value) : "").toBe(
      "status='active' OR grade>='5'",
    );
  });

  it("rejects unsafe fields and invalid sort/order combinations", () => {
    expect(createOneRosterV1p2FilterClause("name;drop", "=", "x")._tag).toBe("err");
    expect(createOneRosterV1p2Query({ orderBy: "asc" })._tag).toBe("err");
    expect(createOneRosterV1p2Query({ sort: "name" })._tag).toBe("err");
    expect(createOneRosterV1p2Query({ limit: 0 })._tag).toBe("err");
    const query = createOneRosterV1p2Query({ fields: ["title"] });
    expect(query._tag).toBe("ok");
    expect(
      query._tag === "ok" ? serializeOneRosterV1p2Query(query.value, ["limit"])._tag : "",
    ).toBe("err");
  });
});
