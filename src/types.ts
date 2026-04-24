export interface Task {
  id: string;
  column_id: string;
  content: string;
  position: number;
  created_at?: string;
}

export interface Column {
  id: string;
  title: string;
  position: number;
}

export interface BoardData {
  columns: Column[];
  tasks: Task[];
}
