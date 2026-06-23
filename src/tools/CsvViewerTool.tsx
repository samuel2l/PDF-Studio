import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Plus,
  Search,
  Table2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { CsvCell } from "../components/CsvCell";
import { CsvColumnHeader } from "../components/CsvColumnHeader";
import { CsvFilterBuilder } from "../components/CsvFilterBuilder";
import { FileDropzone } from "../components/FileDropzone";
import { ScrollHint } from "../components/ScrollHint";
import { TablePagination } from "../components/TablePagination";
import { Field, StatusMessage, ToolShell, inputClassName, selectClassName } from "../components/ToolShell";
import {
  addParsedCsvColumn,
  applyFilterIndices,
  deleteParsedCsvColumn,
  parseCsv,
  renameParsedCsvColumn,
  rowsToCsv,
  searchIndices,
  sortIndices,
  updateParsedCsvCell,
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
  const [dirty, setDirty] = useState(false);
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
    setDirty(false);
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

  const displayRowIndices = useMemo(() => {
    if (!data) return [];
    let indices = data.rows.map((_, i) => i);
    indices = applyFilterIndices(data.rows, indices, filterRules, filterLogic);
    indices = searchIndices(data.rows, indices, search);
    if (sortCol !== null) indices = sortIndices(data.rows, indices, sortCol, sortDir);
    return indices;
  }, [data, filterRules, filterLogic, search, sortCol, sortDir]);

  const isFiltered = filterRules.length > 0 || search.trim() !== "";

  const pageRowIndices = displayRowIndices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rowStart = displayRowIndices.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rowEnd = Math.min(page * PAGE_SIZE, displayRowIndices.length);

  const handleSort = (col: number) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleCellSave = (rowIndex: number, columnIndex: number, value: string) => {
    if (!data) return;
    setData(updateParsedCsvCell(data, rowIndex, columnIndex, value));
    setDirty(true);
  };

  const handleColumnRename = (columnIndex: number, name: string) => {
    if (!data) return;
    setData(renameParsedCsvColumn(data, columnIndex, name));
    setDirty(true);
  };

  const handleColumnDelete = (columnIndex: number) => {
    if (!data || data.headers.length <= 1) return;
    setData(deleteParsedCsvColumn(data, columnIndex));
    setDirty(true);
    if (sortCol === columnIndex) setSortCol(null);
    else if (sortCol !== null && sortCol > columnIndex) setSortCol(sortCol - 1);
  };

  const handleAddColumn = () => {
    if (!data) return;
    setData(addParsedCsvColumn(data));
    setDirty(true);
  };

  const handleExport = async (filteredOnly: boolean) => {
    if (!data || !file) return;
    setExporting(true);
    try {
      const rows = filteredOnly
        ? displayRowIndices.map((i) => data.rows[i])
        : data.rows;
      const csv = rowsToCsv(data.headers, rows, data.delimiter);
      const base = file.name.replace(/\.csv$/i, "");
      let suffix = "";
      if (dirty) suffix = "_edited";
      if (filteredOnly) suffix += "_filtered";
      if (!suffix) suffix = "_export";
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
      description="Open, edit, filter, and export CSV files in your browser. Rename columns, edit cells, and download your changes — data never leaves your device."
      actions={
        data ? (
          <div className="flex flex-wrap gap-2">
            {isFiltered && (
              <Button
                variant="ghost"
                loading={exporting}
                icon={<Download className="h-4 w-4" />}
                onClick={() => handleExport(true)}
              >
                Download filtered
              </Button>
            )}
            <Button
              variant="secondary"
              loading={exporting}
              icon={<Download className="h-4 w-4" />}
              onClick={() => handleExport(false)}
            >
              Download{dirty ? " edited" : ""} CSV
            </Button>
          </div>
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
            setDirty(false);
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
              {dirty && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Unsaved edits
                </span>
              )}
              {isFiltered && (
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                  Showing {displayRowIndices.length.toLocaleString()} of {data.totalRows.toLocaleString()}
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

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500">
                Click <span className="rounded border border-slate-200 px-1 text-[10px]">edit</span> on a cell
                or column header to change values
              </p>
              <button
                type="button"
                onClick={handleAddColumn}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand-300 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add column
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-xs font-medium text-slate-500">
                  {pageRowIndices.length > 0
                    ? `Showing ${rowStart.toLocaleString()}–${rowEnd.toLocaleString()} on this page`
                    : "No rows to display"}
                </p>
              </div>

              <ScrollHint hint="Scroll down for more rows" maxHeight="min(60vh, 520px)">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                    <tr>
                      <th className="border-b border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        #
                      </th>
                      {data.headers.map((header, i) => (
                        <th
                          key={`${header}-${i}`}
                          className="border-b border-slate-200 px-2 py-2 text-xs text-slate-700"
                        >
                          <CsvColumnHeader
                            name={header}
                            columnIndex={i}
                            canDelete={data.headers.length > 1}
                            onRename={handleColumnRename}
                            onDelete={handleColumnDelete}
                            sortControl={
                              <button
                                type="button"
                                onClick={() => handleSort(i)}
                                className="shrink-0 rounded p-0.5 hover:text-brand-600"
                                title="Sort column"
                              >
                                <SortIcon col={i} />
                              </button>
                            }
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pageRowIndices.length === 0 ? (
                      <tr>
                        <td
                          colSpan={data.headers.length + 1}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No rows match your filters.
                        </td>
                      </tr>
                    ) : (
                      pageRowIndices.map((rowIndex, ri) => (
                        <tr key={rowIndex} className="hover:bg-brand-50/40">
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">
                            {rowStart + ri}
                          </td>
                          {data.rows[rowIndex].map((cell, ci) => (
                            <td key={ci} className="px-2 py-1.5 text-slate-800">
                              <CsvCell
                                value={cell}
                                onSave={(value) => handleCellSave(rowIndex, ci, value)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollHint>
            </div>

            <TablePagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={displayRowIndices.length}
              onPageChange={setPage}
            />
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
