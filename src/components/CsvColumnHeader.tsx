import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { inputClassName } from "./ToolShell";

interface CsvColumnHeaderProps {
  name: string;
  columnIndex: number;
  canDelete: boolean;
  sortControl: ReactNode;
  onRename: (columnIndex: number, name: string) => void;
  onDelete: (columnIndex: number) => void;
}

export function CsvColumnHeader({
  name,
  columnIndex,
  canDelete,
  sortControl,
  onRename,
  onDelete,
}: CsvColumnHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    onRename(columnIndex, draft.trim() || `Column ${columnIndex + 1}`);
    setEditing(false);
  };

  return (
    <div className="group/col flex min-w-[120px] max-w-[220px] items-center gap-1">
      {editing ? (
        <input
          ref={inputRef}
          className={`${inputClassName} !py-1 text-xs font-semibold`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <>
          <div className="min-w-0 flex-1 truncate font-semibold" title={name}>
            {name || `Column ${columnIndex + 1}`}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded p-0.5 text-slate-400 opacity-100 hover:bg-white hover:text-brand-600 sm:opacity-0 sm:group-hover/col:opacity-100"
            title="Rename column"
          >
            <Pencil className="h-3 w-3" />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(columnIndex)}
              className="shrink-0 rounded p-0.5 text-slate-400 opacity-100 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover/col:opacity-100"
              title="Delete column"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </>
      )}
      {!editing && sortControl}
    </div>
  );
}
