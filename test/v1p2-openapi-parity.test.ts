import { describe, expect, it } from "vitest";

import { oneRosterV1p2Operations } from "../src/v1p2/index.js";
import {
  oneRosterV1p2DiscoveryFilenameIssue,
  oneRosterV1p2NormativeDocuments,
  oneRosterV1p2OperationManifest,
} from "./fixtures/v1p2-operation-manifest.js";

describe("OneRoster 1.2 OpenAPI parity manifest", () => {
  it("has unique normative documents and operation facts for every registry entry", () => {
    expect(oneRosterV1p2NormativeDocuments).toHaveLength(4);
    expect(new Set(oneRosterV1p2NormativeDocuments.map((document) => document.url)).size).toBe(4);
    expect(
      oneRosterV1p2NormativeDocuments.every((document) => document.revisionDate === "2022-09-19"),
    ).toBe(true);
    expect(oneRosterV1p2OperationManifest).toHaveLength(oneRosterV1p2Operations.length);
    expect(
      new Set(oneRosterV1p2OperationManifest.map((operation) => operation.operationId)).size,
    ).toBe(oneRosterV1p2OperationManifest.length);
    expect(
      oneRosterV1p2OperationManifest.map((operation) => operation.operationId).toSorted(),
    ).toEqual(oneRosterV1p2Operations.map((operation) => operation.operationId).toSorted());
  });

  it("records the binding/conformance discovery filename contradiction explicitly", () => {
    expect(oneRosterV1p2DiscoveryFilenameIssue.binding).not.toBe(
      oneRosterV1p2DiscoveryFilenameIssue.conformance,
    );
    expect(oneRosterV1p2DiscoveryFilenameIssue.resolution).toContain("exact discovery URL");
  });
});
