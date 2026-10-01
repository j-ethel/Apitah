import { supabase } from "./supabase";
import type { FieldDefinition, ImportMapping } from "./apitah-types";

export function normalizeHeader(value: string): string {
  return value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function localFieldMatch(header: string, fields: FieldDefinition[]): ImportMapping {
  const normalized = normalizeHeader(header);
  const exact = fields.find((field) => normalizeHeader(field.field_key) === normalized);
  if (exact) return { sourceHeader: header, fieldKey: exact.field_key, confidence: 1, matchType: "exact" };
  const label = fields.find((field) => normalizeHeader(field.label) === normalized);
  if (label) return { sourceHeader: header, fieldKey: label.field_key, confidence: 0.9, matchType: "alias" };
  return { sourceHeader: header, fieldKey: null, confidence: 0, matchType: "unmatched" };
}

export async function matchHeaderWithDatabase(header: string, userId: string): Promise<ImportMapping> {
  if (!supabase) return { sourceHeader: header, fieldKey: null, confidence: 0, matchType: "unmatched" };
  const { data, error } = await supabase.rpc("match_document_field", { p_user_id: userId, p_header: header });
  if (error || !data?.length) return { sourceHeader: header, fieldKey: null, confidence: 0, matchType: "unmatched" };
  const match = data[0];
  return {
    sourceHeader: header, fieldKey: match.field_key, confidence: Number(match.confidence ?? 0),
    matchType: match.match_type === "exact" ? "exact" : "alias",
  };
}
