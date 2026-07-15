const resourceEntity = {
  sourcedId: "resource-example",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  metadata: { source: "fixture" },
  vendorResourceId: "vendor-resource-example",
  title: "Example Resource",
  roles: ["teacher", "ext:example-role"],
  importance: "primary",
  vendorId: "vendor-example",
  applicationId: "application-example",
} as const;

/** Non-PII, hand-authored Resources entity fixture. */
export const resourcesEntities = {
  resource: resourceEntity,
} as const;

/** Return the standards-defined envelope for one Resources response family. */
export function resourcesPayload(responseCodec: string, empty = false): Record<string, unknown> {
  switch (responseCodec) {
    case "resourceCollection":
      return { resources: empty ? [] : [resourcesEntities.resource] };
    case "resourceSingleton":
      return { resource: resourcesEntities.resource };
    default:
      throw new Error(`Unsupported test fixture response codec: ${responseCodec}`);
  }
}
