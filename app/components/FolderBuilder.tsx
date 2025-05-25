"use client";
import React from "react";
import { Node } from "@/types/tree";

interface Props {
    tree: Node;
    setTree: React.Dispatch<React.SetStateAction<Node>>;
    onExport: (tree: Node) => void;
}

export default function FolderBuilder({ tree, setTree, onExport }: Props) {
    const addFile = (parent: Node) => {
        const name = prompt("File name?");
        const content = prompt("File content?");
        if (!name) return;
        parent.children?.push({ name, type: "file", content: content ?? "" });
        setTree({ ...tree });
    };

    const addFolder = (parent: Node) => {
        const name = prompt("Folder name?");
        if (!name) return;
        parent.children?.push({ name, type: "folder", children: [] });
        setTree({ ...tree });
    };

    const renderNode = (node: Node) => (
        <div style={{ marginLeft: 20 }}>
            <strong>
                {node.type === "folder" ? "📁 " : "📄 "}
                {node.name}
            </strong>
            {node.type === "folder" && node.children && (
                <div className="ml-4">
                    {node.children.map((child, i) => (
                        <div key={i}>{renderNode(child)}</div>
                    ))}
                    <button onClick={() => addFile(node)} className="mr-2">
                        + File
                    </button>
                    <button onClick={() => addFolder(node)}>+ Folder</button>
                </div>
            )}
        </div>
    );

    return (
        <div>
            {renderNode(tree)}
            <button
                onClick={() => onExport(tree)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
                Export JSON
            </button>
        </div>
    );
}