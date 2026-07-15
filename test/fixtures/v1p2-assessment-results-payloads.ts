const reference = (type: string, sourcedId: string) => ({
  href: `https://sis.example/objects/${type}/${sourcedId}`,
  sourcedId,
  type,
});

const entityBase = (sourcedId: string) => ({
  sourcedId,
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  metadata: { source: "fixture" },
});

/** Non-PII, hand-authored Assessment Results Profile fixtures. */
export const assessmentResultsEntities = {
  assessmentLineItem: {
    ...entityBase("assessment-line-item-example"),
    title: "Example Assessment",
    description: "Example assessment description",
    class: reference("class", "class-example"),
    parentAssessmentLineItem: reference(
      "assessmentLineItem",
      "parent-assessment-line-item-example",
    ),
    scoreScale: reference("scoreScale", "score-scale-example"),
    resultValueMin: 0,
    resultValueMax: 100,
    learningObjectiveSet: [
      {
        source: "case",
        learningObjectiveIds: ["objective-example"],
      },
    ],
  },
  assessmentResult: {
    ...entityBase("assessment-result-example"),
    assessmentLineItem: reference("assessmentLineItem", "assessment-line-item-example"),
    student: reference("user", "user-example"),
    textScore: "A",
    scoreDate: "2025-01-15",
    scoreScale: reference("scoreScale", "score-scale-example"),
    scoreStatus: "fully graded",
    comment: "Example assessment comment",
    learningObjectiveSet: [
      {
        source: "case",
        learningObjectiveResults: [
          { learningObjectiveId: "objective-example", textScore: "mastered" },
        ],
      },
    ],
    inProgress: "false",
    incomplete: "false",
    late: "false",
    missing: "false",
  },
} as const;

/** Return the standards-defined Assessment Results Profile envelope. */
export function assessmentResultsPayload(
  responseCodec: string,
  empty = false,
): Record<string, unknown> {
  switch (responseCodec) {
    case "assessmentLineItemCollection":
      return {
        assessmentLineItems: empty ? [] : [assessmentResultsEntities.assessmentLineItem],
      };
    case "assessmentLineItemSingleton":
      return { assessmentLineItem: assessmentResultsEntities.assessmentLineItem };
    case "assessmentResultCollection":
      return { assessmentResults: empty ? [] : [assessmentResultsEntities.assessmentResult] };
    case "assessmentResultSingleton":
      return { assessmentResult: assessmentResultsEntities.assessmentResult };
    default:
      throw new Error(`Unsupported test fixture response codec: ${responseCodec}`);
  }
}
