export interface Note {
  id?: number;
  title: string;
  content: string;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  color: string;
  createdAt?: string;
  tags?: string[];
  reminderAt?: Date | null;
  reminderTriggered?: boolean;
  boardId?: number;
}
