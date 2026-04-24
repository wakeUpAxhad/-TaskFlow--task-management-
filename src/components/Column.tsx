import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Column as ColumnType, Task as TaskType } from "../types";
import TaskCard from "./TaskCard";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  key?: React.Key;
  column: ColumnType;
  tasks: TaskType[];
  addTask: () => Promise<void> | void;
  deleteTask: (id: string) => Promise<void> | void;
  isOverlay?: boolean;
}

export default function Column({ column, tasks, addTask, deleteTask }: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white/5 border-2 border-dashed border-white/10 w-80 min-h-[500px] rounded-2xl shrink-0"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-80 flex flex-col shrink-0"
    >
      {/* Header */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-4 group cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            {column.title}
          </h3>
          <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 font-bold border border-white/5">
            {tasks.length}
          </span>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3 min-h-[100px] mb-4">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} deleteTask={deleteTask} />
          ))}
        </SortableContext>
      </div>

      {/* Footer / Add Action */}
      <button
        onClick={addTask}
        className="w-full flex items-center justify-center gap-2 p-3 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all text-xs font-medium"
      >
        <Plus size={14} />
        <span>Add New Task</span>
      </button>
    </div>
  );
}
