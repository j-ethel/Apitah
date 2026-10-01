export type DocumentElementType = "text" | "field" | "image" | "qrcode" | "shape" | "line" | "barcode" | "logo" | "signature";
export type FieldDataType = "text" | "number" | "date" | "datetime" | "boolean" | "image" | "url" | "email" | "phone" | "qrcode";

export interface FieldDefinition {
  id: string; field_key: string; label: string; data_type: FieldDataType; category: string;
  placeholder?: string | null; display_format?: string | null; required: boolean;
  is_system: boolean; is_custom: boolean;
}

export interface TemplateElement {
  id: string; template_id: string; element_type: DocumentElementType; name: string | null;
  field_definition_id: string | null; content: string | null; x: number; y: number;
  width: number; height: number; rotation: number; z_index: number; locked: boolean;
  visible: boolean; style: Record<string, unknown>; properties: Record<string, unknown>;
}

export interface PersonRecord {
  id: string; external_id?: string | null; first_name?: string | null; last_name?: string | null;
  full_name?: string | null; email?: string | null; phone?: string | null;
  photo_url?: string | null; data: Record<string, unknown>;
}

export interface ImportMapping {
  sourceHeader: string; fieldKey: string | null; confidence: number;
  matchType: "exact" | "alias" | "manual" | "unmatched";
}

export interface GenerationProgress {
  total: number; completed: number; failed: number;
  status: "idle" | "processing" | "completed" | "failed";
}
