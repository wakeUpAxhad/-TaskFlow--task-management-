import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Column as ColumnType, Task as TaskType, BoardData } from "./types";
import Column from "./components/Column";
import TaskCard from "./components/TaskCard";
import { Layout, Plus, List, Calendar, Clock, Search } from "lucide-react";

export default function App() {
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [activeTask, setActiveTask] = useState<TaskType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    const res = await fetch("/api/board");
    const data: BoardData = await res.json();
    setColumns(data.columns);
    setTasks(data.tasks);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (!isActiveATask) return;

    // Dropping a task over another task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].column_id !== tasks[overIndex].column_id) {
          const updatedTasks = [...tasks];
          updatedTasks[activeIndex] = {
            ...updatedTasks[activeIndex],
            column_id: updatedTasks[overIndex].column_id
          };
          return arrayMove(updatedTasks, activeIndex, overIndex);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";

    // Dropping a task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const updatedTasks = [...tasks];
        updatedTasks[activeIndex] = {
          ...updatedTasks[activeIndex],
          column_id: overId as string
        };
        return arrayMove(updatedTasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (active.data.current?.type === "Column") {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((col) => col.id === activeId);
        const overIndex = columns.findIndex((col) => col.id === overId);
        return arrayMove(columns, activeIndex, overIndex);
      });
    }

    const isActiveATask = active.data.current?.type === "Task";
    if (isActiveATask) {
      const task = tasks.find((t) => t.id === activeId);
      if (task) {
        const colTasks = tasks.filter((t) => t.column_id === task.column_id);
        const pos = colTasks.findIndex((t) => t.id === activeId);
        
        await fetch(`/api/tasks/${activeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columnId: task.column_id,
            position: pos,
          }),
        });
      }
    }

    setActiveTask(null);
  };

  const addTask = async (columnId: string, content: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId, content }),
      });
      if (!res.ok) throw new Error("Failed to add task");
      const newTask = await res.json();
      setTasks([...tasks, newTask]);
    } catch (err) {
      console.error("Add task error:", err);
      alert("Failed to add task. Please check server logs.");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  const addColumn = async (title: string) => {
    try {
      const res = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to add column");
      const newCol = await res.json();
      setColumns([...columns, newCol]);
    } catch (err) {
      console.error("Add column error:", err);
    }
  };

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle.trim());
      setNewColumnTitle("");
      setIsAddingColumn(false);
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg text-gray-300 font-sans overflow-hidden select-none">
      {/* Sidebar - No changes needed here */}
      <aside className="w-64 bg-brand-sidebar border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Layout className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white italic">TaskFlow</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="py-2 px-3 bg-white/5 text-white rounded-md flex items-center gap-3 cursor-pointer">
            <List className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">All Boards</span>
          </div>
          <div className="py-2 px-3 text-gray-400 hover:bg-white/5 rounded-md flex items-center gap-3 transition-colors cursor-pointer group">
            <Clock className="w-4 h-4 group-hover:text-white" />
            <span className="text-sm group-hover:text-white">Recent Tasks</span>
          </div>
          <div className="py-2 px-3 text-gray-400 hover:bg-white/5 rounded-md flex items-center gap-3 transition-colors cursor-pointer group">
            <Calendar className="w-4 h-4 group-hover:text-white" />
            <span className="text-sm group-hover:text-white">Calendar</span>
          </div>
        </nav>

        <div className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-4 px-3">Projects</div>
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white cursor-pointer hover:bg-white/5 rounded-lg transition-all">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> TaskFlow App
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white cursor-pointer hover:bg-white/5 rounded-lg transition-all">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Backend API
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white cursor-pointer hover:bg-white/5 rounded-lg transition-all">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Marketing Site
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 border border-white/10" />
            <div>
              <p className="text-xs font-medium text-white">Alex Rivera</p>
              <p className="text-[10px] text-gray-500">Product Designer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-brand-bg relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Main Board</h2>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20">Public</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 w-64 transition-all"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            </div>
            
            {isAddingColumn ? (
              <div className="flex items-center gap-2">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Column title..."
                  className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all w-48"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") setIsAddingColumn(false);
                  }}
                />
                <button 
                  onClick={handleAddColumn}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={() => setIsAddingColumn(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                >
                  <span className="text-xs px-1 font-bold">X</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingColumn(true)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
              >
                <Plus size={16} />
                New Column
              </button>
            )}
          </div>
        </header>

        {/* Board Layout */}
        <div className="flex-1 p-8 flex gap-6 overflow-x-auto overflow-y-hidden content-start scrollbar-hide">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 items-start h-full">
              <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                {columns.map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    tasks={tasks.filter((t) => t.column_id === column.id)}
                    addTask={(content: string) => addTask(column.id, content)}
                    deleteTask={deleteTask}
                  />
                ))}
              </SortableContext>
              
              {/* Add Column Placeholder */}
              <button 
                onClick={() => setIsAddingColumn(true)}
                className="w-80 h-[100px] border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors shrink-0 group"
              >
                <div className="text-center">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-white/10 transition-colors">
                    <Plus className="w-6 h-6 text-gray-500 group-hover:text-white" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium group-hover:text-white">Add Column</p>
                </div>
              </button>
            </div>

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: "0.5",
                  },
                },
              }),
            }}>
              {activeTask && (
                <TaskCard task={activeTask} deleteTask={deleteTask} isOverlay />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </main>
    </div>
  );
}
