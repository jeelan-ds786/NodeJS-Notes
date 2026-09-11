export type MarkdownHeading = {
  depth: 2 | 3;
  id: string;
  text: string;
};

function headingId(text: string) {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getMarkdownHeadings(content: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const occurrences = new Map<string, number>();
  let inFence = false;

  for (const line of content.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^(##|###)\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const text = match[2].replace(/[`*_~]/g, "").trim();
    const baseId = headingId(text) || "section";
    const count = occurrences.get(baseId) ?? 0;
    occurrences.set(baseId, count + 1);
    headings.push({
      depth: match[1].length as 2 | 3,
      id: count ? `${baseId}-${count}` : baseId,
      text,
    });
  }

  return headings;
}