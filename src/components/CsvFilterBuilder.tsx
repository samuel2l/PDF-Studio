import { Plus, Trash2 } from "lucide-react";
import { inputClassName, selectClassName } from "./ToolShell";
import {
  FILTER_OPERATOR_LABELS,
  VALUELESS_OPERATORS,
  type CsvFilterRule,
  type FilterOperator,
} from "../lib/csv";
import { uniqueId } from "../lib/utils";

interface CsvFilterBuilderProps {
  headers: string[];
  rules: CsvFilterRule[];
  logic: "and" | "or";
  onRulesChange: (rules: CsvFilterRule[]) => void;
  onLogicChange: (logic: "and" | "or") => void;
}

function emptyRule(): CsvFilterRule {
  return {
    id: uniqueId(),
    columnIndex: 0,
    operator: "eq",
    value: "",
  };
}

export function CsvFilterBuilder({
  headers,
  rules,
  logic,
  onRulesChange,
  onLogicChange,
}: CsvFilterBuilderProps) {
  const updateRule = (id: string, patch: Partial<CsvFilterRule>) => {
    onRulesChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRule = (id: string) => {
    onRulesChange(rules.filter((r) => r.id !== id));
  };

  const addRule = () => {
    onRulesChange([...rules, emptyRule()]);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">Column filters</p>
        {rules.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Match</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
              value={logic}
              onChange={(e) => onLogicChange(e.target.value as "and" | "or")}
            >
              <option value="and">all rules (AND)</option>
              <option value="or">any rule (OR)</option>
            </select>
          </div>
        )}
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-slate-500">
          Add rules to filter rows — e.g. <span className="font-medium">Status equals Active</span>{" "}
          and <span className="font-medium">Country equals US</span>.
        </p>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule, index) => (
            <li
              key={rule.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
            >
              {index > 0 && (
                <span className="w-10 shrink-0 text-center text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  {logic}
                </span>
              )}
              {index === 0 && rules.length > 1 && <span className="w-10 shrink-0" />}

              <select
                className={`${selectClassName} min-w-[140px] flex-1`}
                value={rule.columnIndex}
                onChange={(e) => updateRule(rule.id, { columnIndex: Number(e.target.value) })}
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </select>

              <select
                className={`${selectClassName} min-w-[140px]`}
                value={rule.operator}
                onChange={(e) =>
                  updateRule(rule.id, { operator: e.target.value as FilterOperator })
                }
              >
                {(Object.keys(FILTER_OPERATOR_LABELS) as FilterOperator[]).map((op) => (
                  <option key={op} value={op}>
                    {FILTER_OPERATOR_LABELS[op]}
                  </option>
                ))}
              </select>

              {!VALUELESS_OPERATORS.includes(rule.operator) && (
                <input
                  className={`${inputClassName} min-w-[120px] flex-1`}
                  placeholder="Value"
                  value={rule.value}
                  onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                />
              )}

              <button
                type="button"
                onClick={() => removeRule(rule.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Remove rule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addRule}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand-300 bg-white px-3 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
        >
          <Plus className="h-4 w-4" />
          Add filter rule
        </button>
        {rules.length > 0 && (
          <button
            type="button"
            onClick={() => onRulesChange([])}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
