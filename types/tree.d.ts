export interface Node {
    name: string;
    type: "folder" | "file";
    content?: string;
    children?: Node[];
}
