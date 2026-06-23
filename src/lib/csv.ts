export type CsvDelimiter = "," | ";" | "\t" | "|";

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: CsvDelimiter;
  totalRows: number;
}

export function detectDelimiter(text: string): CsvDelimiter {
  const sample = text.slice(0, 4096);
  const firstLine = sample.split(/\r?\n/)[0] ?? "";
  const counts: Record<CsvDelimiter, number> = {
    ",": (firstLine.match(/,/g) ?? []).length,
    ";": (firstLine.match(/;/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
    "|": (firstLine.match(/\|/g) ?? []).length,
  };

  let best: CsvDelimiter = ",";
  let max = 0;
  for (const [del, count] of Object.entries(counts) as [CsvDelimiter, number][]) {
    if (count > max) {
      max = count;
      best = del;
    }
  }
  return best;
}

function parseRow(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  cells.push(current);
  return cells;
}

export function parseCsv(text: string, delimiter?: CsvDelimiter): ParsedCsv {
  const delim = delimiter ?? detectDelimiter(text);
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line, i, arr) => line.length > 0 || i < arr.length - 1);

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: delim, totalRows: 0 };
  }

  const headers = parseRow(lines[0], delim).map((h) => h.trim());
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cells = parseRow(line, delim);
    while (cells.length < headers.length) cells.push("");
    rows.push(cells.slice(0, headers.length));
  }

  return { headers, rows, delimiter: delim, totalRows: rows.length };
}

export function sortRows(
  rows: string[][],
  columnIndex: number,
  direction: "asc" | "desc",
): string[][] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    const av = a[columnIndex] ?? "";
    const bv = b[columnIndex] ?? "";
    const an = Number(av);
    const bn = Number(bv);
    let cmp: number;
    if (av !== "" && bv !== "" && !Number.isNaN(an) && !Number.isNaN(bn)) {
      cmp = an - bn;
    } else {
      cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
    }
    return direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}

export function filterRows(rows: string[][], query: string): string[][] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
}

export type FilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "starts"
  | "ends"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "empty"
  | "not_empty";

export interface CsvFilterRule {
  id: string;
  columnIndex: number;
  operator: FilterOperator;
  value: string;
}

export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "equals",
  neq: "does not equal",
  contains: "contains",
  not_contains: "does not contain",
  starts: "starts with",
  ends: "ends with",
  gt: "greater than",
  gte: "greater or equal",
  lt: "less than",
  lte: "less or equal",
  empty: "is empty",
  not_empty: "is not empty",
};

export const VALUELESS_OPERATORS: FilterOperator[] = ["empty", "not_empty"];

function matchRule(cell: string, operator: FilterOperator, value: string): boolean {
  const v = value.trim();
  const c = cell.trim();
  const cn = Number(c);
  const vn = Number(v);
  const numeric = c !== "" && v !== "" && !Number.isNaN(cn) && !Number.isNaN(vn);

  switch (operator) {
    case "eq":
      return numeric ? cn === vn : c.toLowerCase() === v.toLowerCase();
    case "neq":
      return numeric ? cn !== vn : c.toLowerCase() !== v.toLowerCase();
    case "contains":
      return c.toLowerCase().includes(v.toLowerCase());
    case "not_contains":
      return !c.toLowerCase().includes(v.toLowerCase());
    case "starts":
      return c.toLowerCase().startsWith(v.toLowerCase());
    case "ends":
      return c.toLowerCase().endsWith(v.toLowerCase());
    case "gt":
      return numeric ? cn > vn : c.localeCompare(v, undefined, { numeric: true }) > 0;
    case "gte":
      return numeric ? cn >= vn : c.localeCompare(v, undefined, { numeric: true }) >= 0;
    case "lt":
      return numeric ? cn < vn : c.localeCompare(v, undefined, { numeric: true }) < 0;
    case "lte":
      return numeric ? cn <= vn : c.localeCompare(v, undefined, { numeric: true }) <= 0;
    case "empty":
      return c === "";
    case "not_empty":
      return c !== "";
    default:
      return true;
  }
}

export function applyFilterRules(
  rows: string[][],
  rules: CsvFilterRule[],
  logic: "and" | "or",
): string[][] {
  const active = rules.filter(
    (r) => VALUELESS_OPERATORS.includes(r.operator) || r.value.trim() !== "",
  );
  if (active.length === 0) return rows;

  return rows.filter((row) => {
    const results = active.map((rule) => {
      const cell = row[rule.columnIndex] ?? "";
      return matchRule(cell, rule.operator, rule.value);
    });
    return logic === "and" ? results.every(Boolean) : results.some(Boolean);
  });
}

export function rowsToCsv(headers: string[], rows: string[][], delimiter: CsvDelimiter = ","): string {
  const escape = (cell: string) => {
    if (/[",\n\r]/.test(cell) || cell.includes(delimiter)) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const lines = [headers.map(escape).join(delimiter)];
  for (const row of rows) {
    lines.push(row.map(escape).join(delimiter));
  }
  return lines.join("\n");
}
