"use server";

import { buildSearchIndex } from "./search-index";
import type { SearchItem } from "./search.ts";

/** The search box loads this once when it's first used, then filters in the browser. */
export async function getSearchIndex(): Promise<SearchItem[]> {
  return buildSearchIndex();
}
