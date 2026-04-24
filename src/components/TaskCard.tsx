import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../types";
import { Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  key?: React.Key;
  task: Task;
  deleteTask: (id: string) => Promise<void> | void;
  isOverlay?: boolean;
}

export default function TaskCard({ task, deleteTask, isOverlay }: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
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
        className="bg-brand-surface/50 border-2 border-dashed border-white/5 h-[100px] min-h-[100px] rounded-xl opacity-30"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group bg-brand-surface border border-white/5 p-4 rounded-xl shadow-xl hover:shadow-2xl transition-all cursor-grab active:cursor-grabbing relative overflow-hidden",
        isOverlay && "shadow-2xl border-emerald-500/20 ring-1 ring-emerald-500/30 scale-[1.02]"
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded uppercase font-bold tracking-tight">
            Task
          </span>
          <span className="text-[10px] text-gray-500 font-mono tracking-tighter">
            {task.id.slice(0, 4)}
          </span>
        </div>
        
        <p className="text-sm text-gray-100 font-medium leading-relaxed">
          {task.content}
        </p>

        <div className="flex items-center justify-between mt-1">
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full border border-brand-surface bg-emerald-600" />
            <div className="w-5 h-5 rounded-full border border-brand-surface bg-blue-600" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
            className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      {/* Active state indicator */}
      <div className="absolute top-0 right-4 w-6 h-1 bg-emerald-500 rounded-b opacity-0 group-hover:opacity-60 transition-opacity" />
    </div>
  );
}
