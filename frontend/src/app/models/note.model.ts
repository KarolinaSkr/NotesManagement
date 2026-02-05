export interface Note {
  id?: number;
  title: string;
  content: string;
  positionX: number;
  positionY: number;
  color: string;
  createdAt?: string;
  tags?: string[];
}
