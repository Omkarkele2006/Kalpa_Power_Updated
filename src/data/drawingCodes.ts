/**
 * drawingCodes.ts
 *
 * Kalpa Solar Power – Drawing Type Code Registry
 * Format segment: GM-RT-DWG-{code}-{projectNumber}-{year}
 *
 * Replace / extend this list with actual Kalpa standard codes.
 * Each code ('aa') is fixed per drawing discipline and does NOT
 * change between projects or revisions.
 */

export interface DrawingTypeCode {
  code: string;   // two-digit code used in the document number
  label: string;  // human-readable discipline description
}

export const DRAWING_TYPE_CODES: DrawingTypeCode[] = [
  { code: '01', label: 'Civil / Structural' },
  { code: '02', label: 'Electrical — Single Line Diagram' },
  { code: '03', label: 'Electrical — Layout & Cable Routing' },
  { code: '04', label: 'Mechanical / Piping' },
  { code: '05', label: 'SCADA / Control & Instrumentation' },
  { code: '06', label: 'Foundation / Civil Structural' },
  { code: '07', label: 'Grounding / Earthing' },
  { code: '08', label: 'Road & Drainage' },
];

/**
 * Generates a document number following the Kalpa convention:
 *   GM-RT-DWG-{code}-{projectNumber}-{year}
 *
 * @param code          Drawing type code, e.g. '02'
 * @param projectNumber Project identifier, e.g. '0011'
 * @returns             e.g. 'GM-RT-DWG-02-0011-2026'
 */
export function generateDrawingNumber(code: string, projectNumber: string): string {
  const year = new Date().getFullYear().toString();
  return `GM-RT-DWG-${code}-${projectNumber}-${year}`;
}
