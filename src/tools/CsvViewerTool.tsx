import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Table2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { CsvFilterBuilder } from "../components/CsvFilterBuilder";
import { FileDropzone } from "../components/FileDropzone";
import { Field, StatusMessage, ToolShell, inputClassName, selectClassName } from "../components/ToolShell";
import {
  applyFilterRules,
  filterRows,
  parseCsv,
  rowsToCsv,
  sortRows,
  type CsvDelimiter,
  type CsvFilterRule,
  type ParsedCsv,
} from "../lib/csv";
import { formatBytes, getUserErrorMessage, saveFile } from "../lib/utils";

const DELIMITER_OPTIONS: { value: CsvDelimiter | "auto"; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe (|)" },
];

const PAGE_SIZE = 50;

export function CsvViewerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ParsedCsv | null>(null);
  const [delimiter, setDelimiter] = useState<CsvDelimiter | "auto">("auto");
  const [search, setSearch] = useState("");
  const [filterRules, setFilterRules] = useState<CsvFilterRule[]>([]);
  const [filterLogic, setFilterLogic] = useState<"and" | "or">("and");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadFile = async (f: File, delim: CsvDelimiter | "auto") => {
    setError(null);
    setSearch("");
    setFilterRules([]);
    setSortCol(null);
    setPage(1);
    try {
      const text = await f.text();
      const parsed = parseCsv(text, delim === "auto" ? undefined : delim);
      if (parsed.headers.length === 0) {
        setError("This file doesn't look like a valid CSV.");
        return;
      }
      setFile(f);
      setData(parsed);
    } catch (e) {
      setError(getUserErrorMessage(e, "Couldn't read this CSV file. Try again."));
    }
  };

  const displayRows = useMemo(() => {
    if (!data) return [];
    let rows = applyFilterRules(data.rows, filterRules, filterLogic);
    rows = filterRows(rows, search);
    if (sortCol !== null) rows = sortRows(rows, sortCol, sortDir);
    return rows;
  }, [data, filterRules, filterLogic, search, sortCol, sortDir]);

  const isFiltered =
    filterRules.length > 0 || search.trim() !== "";

  const totalPages = Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE));
  const pageRows = displayRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (col: number) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleExport = async () => {
    if (!data || !file) return;
    setExporting(true);
    try {
      const csv = rowsToCsv(data.headers, displayRows, data.delimiter);
      const base = file.name.replace(/\.csv$/i, "");
      const suffix = isFiltered ? "_filtered" : "_export";
      await saveFile({
        data: new TextEncoder().encode(csv),
        filename: `${base}${suffix}.csv`,
        mime: "text/csv",
      });
    } catch (e) {
      setError(getUserErrorMessage(e, "Couldn't export this CSV. Try again."));
    } finally {
      setExporting(false);
    }
  };

  const SortIcon = ({ col }: { col: number }) => {
    if (sortCol !== col) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-brand-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-brand-600" />
    );
  };

  return (
    <ToolShell
      title="CSV Viewer"
      description="Open, filter, search, and sort CSV files in your browser. Build rules like “Column X equals Y and Column A equals B” — data never leaves your device."
      actions={
        data ? (
          <Button
            variant="secondary"
            loading={exporting}
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            Download {isFiltered ? "filtered" : ""} CSV
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <FileDropzone
          accept=".csv,text/csv"
          label="Upload a CSV file"
          hint=".csv files only — opens instantly in your browser"
          onFiles={(files) => loadFile(files[0], delimiter)}
          files={file ? [file] : []}
          onClear={() => {
            setFile(null);
            setData(null);
            setFilterRules([]);
            setError(null);
          }}
        />

        {file && (
          <Field label="Delimiter">
            <select
              className={selectClassName}
              value={delimiter}
              onChange={(e) => {
                const next = e.target.value as CsvDelimiter | "auto";
                setDelimiter(next);
                loadFile(file, next);
              }}
            >
              {DELIMITER_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <Table2 className="h-4 w-4 text-brand-600" />
                {data.totalRows.toLocaleString()} total rows · {data.headers.length} columns
              </span>
              {file && <span>· {formatBytes(file.size)}</span>}
              {isFiltered && (
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                  Showing {displayRows.length.toLocaleString()} of {data.totalRows.toLocaleString()}
                </span>
              )}
            </div>

            <CsvFilterBuilder
              headers={data.headers}
              rules={filterRules}
              logic={filterLogic}
              onRulesChange={(rules) => {
                setFilterRules(rules);
                setPage(1);
              }}
              onLogicChange={(logic) => {
                setFilterLogic(logic);
                setPage(1);
              }}
            />

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClassName} pl-10`}
                placeholder="Quick search across all columns…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="max-h-[min(60vh,520px)] overflow-auto">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                    <tr>
                      <th className="border-b border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        #
                      </th>
                      {data.headers.map((header, i) => (
                        <th
                          key={`${header}-${i}`}
                          className="border-b border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700"
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(i)}
                            className="inline-flex max-w-[200px] items-center gap-1.5 truncate hover:text-brand-600"
                            title={header || `Column ${i + 1}`}
                          >
                            <span className="truncate">{header || `Column ${i + 1}`}</span>
                            <SortIcon col={i} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pageRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={data.headers.length + 1}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No rows match your filters.
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-brand-50/40">
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">
                            {(page - 1) * PAGE_SIZE + ri + 1}
                          </td>
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="max-w-[240px] truncate px-3 py-2 text-slate-800"
                              title={cell}
                            >
                              {cell || <span className="text-slate-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
