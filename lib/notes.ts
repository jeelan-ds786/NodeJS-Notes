import "server-only";

import fs from "node:fs";
import path from "node:path";

const contentDirectory = path.join(process.cwd(), "1.contents");
const mapperPath = path.join(process.cwd(), "0.IndexMapper", "0.Index Mapper.md");

export type Note = {
  title: string;
  subtopic: string;
  slug: string;
  fileName: string;
  content: string;
  episode: string;
  tags: string[];
  order: number;
};

type MapperEntry = {
  fileStem: string;
  title: string;
  subtopic: string;
  episode: string;
  tags: string[];
  order: number;
};

function clean(value: string) {
  return value.replace(/<br\s*\/?\s*>/gi, " ").replaceAll("__PIPE__", "|").trim();
}

function toSlug(fileStem: string) {
  return fileStem
    .replace(/^\d+[.\s-]*/, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function displayTitle(fileStem: string) {
  return fileStem.replace(/^\d+[.\s-]*/, "").trim().replace(/\s+\?/g, "?");
}

function parseMapper(): MapperEntry[] {
  const lines = fs.readFileSync(mapperPath, "utf8").split("\n");
  const entries: MapperEntry[] = [];
  let episode = "More notes";

  for (const line of lines) {
    const cells = line.replace(/\\\|/g, "__PIPE__").split("|").map(clean);
    const link = line.match(/\[\[([^\]]+)\]\]/)?.[1]?.trim();
    if (!link) continue;

    if (cells[2]) episode = cells[2].replace(/\|$/, "").trim();
    const subtopic = cells[3] || displayTitle(link);
    const tags = (cells[4]?.match(/#[\w-]+/g) ?? []).map((tag) => tag.slice(1));
    entries.push({
      fileStem: link,
      title: displayTitle(link),
      subtopic,
      episode,
      tags,
      order: entries.length,
    });
  }

  return entries;
}

export function getAllNotes(): Note[] {
  const mapped = parseMapper();
  const byFile = new Map(mapped.map((entry) => [entry.fileStem.trim(), entry]));
  const files = fs.readdirSync(contentDirectory).filter((file) => file.endsWith(".md"));

  return files
    .map((fileName, index) => {
      const fileStem = path.basename(fileName, ".md").trim();
      const entry = byFile.get(fileStem);
      return {
        title: entry?.title || displayTitle(fileStem),
        subtopic: entry?.subtopic || displayTitle(fileStem),
        slug: toSlug(fileStem),
        fileName,
        content: fs.readFileSync(path.join(contentDirectory, fileName), "utf8"),
        episode: entry?.episode || "More notes",
        tags: entry?.tags || [],
        order: entry?.order ?? mapped.length + index,
      };
    })
    .sort((first, second) => first.order - second.order);
}

export function getNote(slug: string) {
  return getAllNotes().find((note) => note.slug === slug);
}