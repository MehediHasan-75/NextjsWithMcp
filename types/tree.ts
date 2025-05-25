export interface Node {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: Node[];
  // Remove id requirement if not needed
} 