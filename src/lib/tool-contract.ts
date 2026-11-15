export type ToolInput = Record<string, string>;
export interface ToolField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  hint?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number | 'any';
  maxLength?: number;
  defaultValue?: string;
}
export interface ToolResult {
  error?: boolean;
  title: string;
  summary: string;
  sections: { title: string; items: string[] }[];
  metrics?: { label: string; value: string; detail?: string }[];
  download?: { filename: string; content: string; mime: string };
}
export interface BusinessTool {
  id: string;
  title: string;
  description: string;
  intro: string;
  submitLabel: string;
  fields: ToolField[];
  method: string[];
  example: string;
  limitations: string[];
  faqs: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  related: { label: string; url: string }[];
  ctaLabel: string;
  ctaHref: string;
  calculate: (input: ToolInput) => ToolResult;
}
