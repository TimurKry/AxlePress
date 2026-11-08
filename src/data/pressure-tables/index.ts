import type { SourceTable } from "@/types/pressure";
import { TABLES_01C } from "./w-4060-01c";
import { TABLES_01D } from "./w-4060-01d";
import { TABLES_01F } from "./w-4060-01f";
import { TABLES_D01C } from "./d-4060-01c";

/**
 * Dataset version. Bump whenever any table value, verification status or mapping changes.
 * Shared URLs carry this version so that the app can warn when a link was created
 * against a different dataset.
 */
export const DATASET_VERSION = "2026.11.1";
export const DATASET_DATE = "2026-11-08";

export const SOURCE_TABLES: SourceTable[] = [...TABLES_01C, ...TABLES_01D, ...TABLES_01F, ...TABLES_D01C];
