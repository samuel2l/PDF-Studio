import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RotateCw, Trash2 } from "lucide-react";
import type { PagePreview } from "../types";

interface PageGridProps {
  pages: PagePreview[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onReorder?: (pages: PagePreview[]) => void;
  onRotate?: (id: string) => void;
  onDelete?: (id: string) => void;
  selectable?: boolean;
  sortable?: boolean;
}

function SortablePage({
  page,
  selected,
  onToggleSelect,
  onRotate,
  onDelete,
  selectable,
  sortable,
}: {
  page: PagePreview;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onRotate?: (id: string) => void;
  onDelete?: (id: string) => void;
  selectable: boolean;
  sortable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition ${
        selected ? "border-brand-500 ring-2 ring-brand-200" : "border-slate-200"
      }`}
    >
      <div
        className={`aspect-[3/4] bg-slate-100 ${sortable ? "cursor-grab active:cursor-grabbing" : ""}`}
        {...(sortable ? { ...attributes, ...listeners } : {})}
        onClick={() => selectable && onToggleSelect(page.id)}
      >
        <img
          src={page.thumbnail}
          alt={`Page ${page.pageIndex + 1}`}
          className="h-full w-full object-contain"
          style={{ transform: `rotate(${page.rotation}deg)` }}
          draggable={false}
        />
      </div>

      <div className="flex items-center justify-between gap-1 border-t border-slate-100 px-2 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-700">Page {page.pageIndex + 1}</p>
          <p className="truncate text-[10px] text-slate-400">{page.sourceFile}</p>
        </div>
        <div className="flex gap-1">
          {onRotate && (
            <button
              type="button"
              onClick={() => onRotate(page.id)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
              title="Rotate"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(page.id)}
              className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageGrid({
  pages,
  selectedIds,
  onToggleSelect,
  onReorder,
  onRotate,
  onDelete,
  selectable = true,
  sortable = false,
}: PageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    onReorder(arrayMove(pages, oldIndex, newIndex));
  };

  const grid = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {pages.map((page) => (
        <SortablePage
          key={page.id}
          page={page}
          selected={selectedIds.has(page.id)}
          onToggleSelect={onToggleSelect}
          onRotate={onRotate}
          onDelete={onDelete}
          selectable={selectable}
          sortable={sortable}
        />
      ))}
    </div>
  );

  if (!sortable) return grid;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        {grid}
      </SortableContext>
    </DndContext>
  );
}
