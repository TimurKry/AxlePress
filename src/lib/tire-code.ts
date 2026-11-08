/**
 * Quick entry: parse the marking printed on the tyre sidewall, e.g.
 *   "315/80 R22.5 156/150 L", "385/65R22,5 160K", "9.5 R 17.5 129/127 L", "205/75 R 16 C 110/108 N".
 *
 * The parsed code is only used to PRE-SELECT documented options. A field is filled
 * automatically only when exactly one documented option matches – nothing is guessed.
 */

export interface ParsedTireCode {
  /** Tyre size in the dataset's notation, e.g. "315/80 R 22,5". */
  tireSize: string;
  /** Load index for single mounting (first number of "156/150"). */
  single: number | null;
  /** Load index for twin mounting (second number of "156/150"). */
  twin: number | null;
}

const SIZE_RE = /(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:\/\s*(\d{2}))?\s*R\s*(\d{2}(?:[.,]5)?)(\s*C(?![a-z]))?/i;
const LI_RE = /(?:^|[^\d/])(\d{2,3})(?:\s*\/\s*(\d{2,3}))?(?:\s*[A-Z])?(?=$|[^\d])/i;

export function parseTireCode(input: string): ParsedTireCode | null {
  const text = input.trim();
  if (!text) return null;
  const size = SIZE_RE.exec(text);
  if (!size) return null;
  const [, width, series, rim, c] = size;
  const tireSize = `${width.replace(".", ",")}${series ? `/${series}` : ""} R ${rim.replace(".", ",")}${c ? " C" : ""}`;
  const rest = text.slice((size.index ?? 0) + size[0].length);
  const li = LI_RE.exec(rest);
  return {
    tireSize,
    single: li ? Number(li[1]) : null,
    twin: li?.[2] ? Number(li[2]) : null,
  };
}

/** Numbers inside a printed load-index alternative, e.g. "128/129" → [128, 129]. */
function numbers(text: string): number[] {
  return (text.match(/\d{2,3}/g) ?? []).map(Number);
}

/**
 * Does a dataset load-index key match the load indices from the tyre marking?
 *
 * Key formats:
 *  - "EB 129 · ZW 127", "EB 128/129 · ZW 126/127", "EB 136"  (17,5″ / 19,5″)
 *  - "156/150" (22,5″ twin), "156" (22,5″ single or twin), "110/108 N" (type 667/668/670)
 *  - "-" (no load index printed) never matches
 */
export function loadIndexMatches(key: string, mounting: string, code: ParsedTireCode): boolean {
  if (code.single === null) return false;
  if (key.startsWith("EB ")) {
    const [ebPart, zwPart] = key.slice(3).split(" · ZW ");
    if (!numbers(ebPart).includes(code.single)) return false;
    if (zwPart === undefined || code.twin === null) return true;
    return numbers(zwPart).includes(code.twin);
  }
  const nums = numbers(key);
  if (nums.length === 2) {
    return nums[0] === code.single && (code.twin === null || nums[1] === code.twin);
  }
  if (nums.length === 1) {
    if (mounting === "twin") return code.twin !== null ? nums[0] === code.twin : nums[0] === code.single;
    return nums[0] === code.single;
  }
  return false;
}
