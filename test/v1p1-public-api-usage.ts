import type {
  OneRosterV1p1Category,
  OneRosterV1p1GradebookClient,
  OneRosterV1p1RosteringClient,
} from "../src/v1p1/index.js";

/** Compile-time coverage for the registry-derived v1.1 Rostering client. */
export async function v1p1RosteringClientUsageExample(
  client: OneRosterV1p1RosteringClient,
): Promise<void> {
  const page = await client.getClassesForSchool("school-example", {
    query: { limit: 100 },
  });
  if (page._tag === "err") return;
  const firstClass = page.value.items[0];
  const singleton = await client.getClass("class-example");
  if (singleton._tag === "err") return;
  const collected = await client.collectAllUsers({ maxPages: 2, maxItems: 10 });
  if (collected._tag === "err") return;
  void firstClass;
  void singleton.value;
  void collected.value;
}

/** Compile-time coverage for the registry-derived v1.1 Gradebook client. */
export async function v1p1GradebookClientUsageExample(
  client: OneRosterV1p1GradebookClient,
  category: OneRosterV1p1Category,
): Promise<void> {
  const page = await client.getLineItemsForClass("class-example");
  if (page._tag === "err") return;
  const written = await client.putCategory("category-example", category);
  if (written._tag === "err") return;
  void page.value.items;
  void written.value;
}
