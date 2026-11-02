"use server";

import { searchParts } from "@/lib/data";
import { PARTS_PAGE, partsQuery } from "@/lib/parts-query";
import type { Part } from "@/lib/types";

/** The next page of the parts list, for "Show more". */
export async function moreParts(raw: Record<string, unknown>, offset: number): Promise<{ parts: Part[] } | { error: string }> {
  if (!Number.isInteger(offset) || offset < 0 || offset > 20_000) return { error: "Couldn't load more parts." };
  try {
    const { parts } = await searchParts(partsQuery(raw), offset, PARTS_PAGE);
    return { parts };
  } catch (error) {
    console.error(error);
    return { error: "Couldn't load more parts. Check your connection and try again." };
  }
}
