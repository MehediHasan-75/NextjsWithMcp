"use client";
import React, { useState } from 'react';
import FolderBuilder from "@/components/FolderBuilder";
import { useWorkspaceSocket } from "@/hooks/useWorkspaceSocket";
import { Node } from "@/types/tree";
// import { FileOperations } from '@/components/FileOperations';

export default function HomePage() {
    const [tree, setTree] = useState<Node>({
        name: 'root',
        type: 'folder',
        children: []
    });
    // console.log(message);
    const { connected, messages } = useWorkspaceSocket({
        onMessage: (message) => {
            if (message.type === 'update_structure') {
                setTree(message.data);
            }
        },
        defaultStructure: tree
    });

    const handleUpdate = (newNode: Node) => {
        setTree(newNode);
    };

    return (
        <main className="p-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                    <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{connected ? 'Connected' : 'Disconnected'}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Messages Log */}
                    <div className="border rounded p-4">
                        <h2 className="text-xl mb-4">Messages</h2>
                        <div className="h-96 overflow-y-auto space-y-2">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-2 rounded ${
                                        msg.type === 'system' ? 'bg-gray-100' :
                                        msg.type === 'sent' ? 'bg-blue-100' :
                                        msg.type === 'received' ? 'bg-green-100' :
                                        'bg-yellow-100'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tree View */}
                    <div className="border rounded p-4">
                        <h2 className="text-xl mb-4">Structure</h2>
                        <pre className="whitespace-pre-wrap">
                            {JSON.stringify(tree, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </main>
    );
}