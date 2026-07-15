import { describe, expect, it } from "vitest";

import {
  combineOneRosterV1p1Filters,
  createOneRosterV1p1ContainsFilter,
  createOneRosterV1p1EqualsFilter,
  createOneRosterV1p1GreaterThanFilter,
  createOneRosterV1p1GreaterThanOrEqualFilter,
  createOneRosterV1p1LessThanFilter,
  createOneRosterV1p1LessThanOrEqualFilter,
  createOneRosterV1p1NotEqualsFilter,
  serializeOneRosterV1p1Filter,
} from "../src/v1p1/index.js";
import {
  combineOneRosterV1p2Filters,
  createOneRosterV1p2ContainsFilter,
  createOneRosterV1p2EqualsFilter,
  createOneRosterV1p2FilterClause,
  createOneRosterV1p2GreaterThanFilter,
  createOneRosterV1p2GreaterThanOrEqualFilter,
  createOneRosterV1p2LessThanFilter,
  createOneRosterV1p2LessThanOrEqualFilter,
  createOneRosterV1p2NotEqualsFilter,
  createOneRosterV1p2Query,
  serializeOneRosterV1p2Filter,
  serializeOneRosterV1p2Query,
} from "../src/v1p2/index.js";
import { parseOneRosterV1p1FilterInput } from "../src/v1p1/rest/filter.js";
import { parseOneRosterV1p2FilterInput } from "../src/v1p2/rest/filter.js";

describe("OneRoster REST named filter helpers", () => {
  it("maps every v1.2 helper to its existing standard symbol", () => {
    const cases = [
      [createOneRosterV1p2EqualsFilter, "="],
      [createOneRosterV1p2NotEqualsFilter, "!="],
      [createOneRosterV1p2GreaterThanFilter, ">"],
      [createOneRosterV1p2GreaterThanOrEqualFilter, ">="],
      [createOneRosterV1p2LessThanFilter, "<"],
      [createOneRosterV1p2LessThanOrEqualFilter, "<="],
      [createOneRosterV1p2ContainsFilter, "~"],
    ] as const;
    for (const [createFilter, symbol] of cases) {
      const result = createFilter("score", 10);
      if (result._tag === "err") throw new Error("Expected a valid named filter.");
      expect(serializeOneRosterV1p2Filter(result.value)).toBe(`score${symbol}'10'`);
    }
  });

  it("gives v1.1 the equivalent validated helpers", () => {
    const cases = [
      [createOneRosterV1p1EqualsFilter, "="],
      [createOneRosterV1p1NotEqualsFilter, "!="],
      [createOneRosterV1p1GreaterThanFilter, ">"],
      [createOneRosterV1p1GreaterThanOrEqualFilter, ">="],
      [createOneRosterV1p1LessThanFilter, "<"],
      [createOneRosterV1p1LessThanOrEqualFilter, "<="],
      [createOneRosterV1p1ContainsFilter, "~"],
    ] as const;
    for (const [createFilter, symbol] of cases) {
      const result = createFilter("score", 10);
      if (result._tag === "err") throw new Error("Expected a valid named filter.");
      expect(serializeOneRosterV1p1Filter(result.value)).toBe(`score${symbol}'10'`);
    }
  });

  it("preserves quote escaping and URLSearchParams encoding", () => {
    const filter = createOneRosterV1p2ContainsFilter("familyName", "O'Connor");
    if (filter._tag === "err") throw new Error("Expected a valid contains filter.");
    expect(serializeOneRosterV1p2Filter(filter.value)).toBe("familyName~'O''Connor'");
    const query = createOneRosterV1p2Query({ filter: filter.value });
    if (query._tag === "err") throw new Error("Expected a valid query.");
    expect(serializeOneRosterV1p2Query(query.value)).toEqual({
      _tag: "ok",
      value: "filter=familyName%7E%27O%27%27Connor%27",
    });
  });

  it("preserves the documented version-specific combination return contracts", () => {
    const v1p1Left = createOneRosterV1p1EqualsFilter("status", "active");
    const v1p1Right = createOneRosterV1p1EqualsFilter("enabledUser", true);
    if (v1p1Left._tag === "err" || v1p1Right._tag === "err") {
      throw new Error("Expected valid v1.1 clauses.");
    }
    expect(combineOneRosterV1p1Filters(v1p1Left.value, "AND", v1p1Right.value)).toMatchObject({
      join: "AND",
    });

    const v1p2Left = createOneRosterV1p2EqualsFilter("status", "active");
    const v1p2Right = createOneRosterV1p2EqualsFilter("enabledUser", true);
    if (v1p2Left._tag === "err" || v1p2Right._tag === "err") {
      throw new Error("Expected valid v1.2 clauses.");
    }
    expect(combineOneRosterV1p2Filters(v1p2Left.value, "AND", v1p2Right.value)).toMatchObject({
      _tag: "ok",
      value: { join: "AND" },
    });
  });

  it("does not expand the baseline grammar or logical depth", () => {
    const invalidPredicate = Reflect.apply(createOneRosterV1p2FilterClause, undefined, [
      "status",
      "in",
      "active",
    ]);
    expect(invalidPredicate._tag).toBe("err");

    const left = createOneRosterV1p2EqualsFilter("status", "active");
    const right = createOneRosterV1p2EqualsFilter("enabledUser", true);
    if (left._tag === "err" || right._tag === "err") throw new Error("Expected valid clauses.");
    const pair = combineOneRosterV1p2Filters(left.value, "AND", right.value);
    if (pair._tag === "err") throw new Error("Expected a valid pair.");
    expect(
      parseOneRosterV1p2FilterInput({
        _tag: "OneRosterV1p2FilterCombination",
        left: pair.value,
        join: "OR",
        right: right.value,
      }),
    ).toMatchObject({ _tag: "err" });
    expect(parseOneRosterV1p2FilterInput("(status='active')")).toMatchObject({ _tag: "err" });
  });

  it("rejects ambiguous and incomplete v1.1 runtime filter shapes", () => {
    const clause = { field: "status", operator: "=", value: "active" };
    expect(parseOneRosterV1p1FilterInput(clause)).toMatchObject({ _tag: "ok" });
    expect(
      parseOneRosterV1p1FilterInput({
        ...clause,
        left: clause,
        join: "AND",
        right: clause,
      }),
    ).toMatchObject({ _tag: "err" });
    expect(parseOneRosterV1p1FilterInput({ field: "status", operator: "=" })).toMatchObject({
      _tag: "err",
    });
    expect(
      parseOneRosterV1p1FilterInput({ left: clause, join: "AND", right: clause }),
    ).toMatchObject({ _tag: "ok" });
    expect(
      parseOneRosterV1p1FilterInput({ left: clause, join: "AND", right: clause, value: "junk" }),
    ).toMatchObject({ _tag: "err" });
  });

  it("adapts shared filter failures to each version's diagnostic namespace", () => {
    expect(
      parseOneRosterV1p1FilterInput({ field: "status", operator: "in", value: "active" }),
    ).toMatchObject({
      _tag: "err",
      error: [{ _tag: "OneRosterV1p1QueryDiagnostic", code: "invalid_operator" }],
    });
    expect(
      parseOneRosterV1p2FilterInput({
        _tag: "OneRosterV1p2FilterClause",
        field: "status",
        operator: "in",
        value: "active",
      }),
    ).toMatchObject({
      _tag: "err",
      error: [{ _tag: "OneRosterV1p2PayloadDiagnostic", code: "query.invalid_operator" }],
    });
  });
});
