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
