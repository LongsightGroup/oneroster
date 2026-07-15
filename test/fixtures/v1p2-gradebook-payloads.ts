const reference = (type: string, sourcedId: string) => ({
  href: `https://sis.example/objects/${type}/${sourcedId}`,
  sourcedId,
  type,
});

const entityBase = (sourcedId: string) => ({
  sourcedId,
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
});

/** Non-PII, hand-authored Gradebook entity fixtures. */
export const gradebookEntities = {
  category: {
    ...entityBase("category-example"),
    title: "Example Category",
    weight: 1,
  },
  lineItem: {
    ...entityBase("line-item-example"),
    title: "Example Assignment",
    assignDate: "2025-01-01T00:00:00Z",
    dueDate: "2025-01-15T00:00:00Z",
    class: reference("class", "class-example"),
    school: reference("org", "school-example"),
    category: reference("category", "category-example"),
    resultValueMin: 0,
    resultValueMax: 100,
  },
  result: {
    ...entityBase("result-example"),
    lineItem: reference("lineItem", "line-item-example"),
    student: reference("user", "user-example"),
    scoreStatus: "fully graded",
    scoreDate: "2025-01-15",
    class: reference("class", "class-example"),
    score: 95,
    comment: "Example comment",
  },
  scoreScale: {
    ...entityBase("score-scale-example"),
    title: "Example Score Scale",
    type: "numeric",
    class: reference("class", "class-example"),
    scoreScaleValue: [{ itemValueLHS: "A", itemValueRHS: "90" }],
  },
} as const;

/** Return the standards-defined envelope for one Gradebook response family. */
export function gradebookPayload(responseCodec: string, empty = false): Record<string, unknown> {
  switch (responseCodec) {
    case "categoryCollection":
      return { categories: empty ? [] : [gradebookEntities.category] };
    case "categorySingleton":
      return { category: gradebookEntities.category };
    case "lineItemCollection":
      return { lineItems: empty ? [] : [gradebookEntities.lineItem] };
    case "lineItemSingleton":
      return { lineItem: gradebookEntities.lineItem };
    case "resultCollection":
      return { results: empty ? [] : [gradebookEntities.result] };
    case "resultSingleton":
      return { result: gradebookEntities.result };
    case "scoreScaleCollection":
      return { scoreScales: empty ? [] : [gradebookEntities.scoreScale] };
    case "scoreScaleSingleton":
      return { scoreScale: gradebookEntities.scoreScale };
    default:
      throw new Error(`Unsupported test fixture response codec: ${responseCodec}`);
  }
}
