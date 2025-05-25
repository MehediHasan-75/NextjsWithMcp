// import React, { useState } from 'react';
// // import { createFile, createFolder } from '@/app/utils/workspaceUtils';
// import { useWorkspaceSocket } from '@/hooks/useWorkspaceSocket';
// import { Node } from '@/types/tree';

// interface FileOperationsProps {
//   currentNode: Node;
//   onUpdate: (newNode: Node) => void;
// }

// export const FileOperations: React.FC<FileOperationsProps> = ({ currentNode, onUpdate }) => {
//   const [newName, setNewName] = useState('');
//   const [type, setType] = useState<'file' | 'folder'>('file');
//   const [content, setContent] = useState('');
//   const { sendMessage } = useWorkspaceSocket();

//   const handleCreate = async () => {
//     if (!newName) return;

//     try {
//       const newNode: Node = {
//         name: newName,
//         type: type,
//         content: type === 'file' ? content : undefined,
//         children: type === 'folder' ? [] : undefined
//       };

//       // Update local tree
//       const updatedNode = {
//         ...currentNode,
//         children: [...(currentNode.children || []), newNode]
//       };

//       // Create file/folder in workspace
//       const path = `${currentNode.name}/${newName}`;
//       if (type === 'file') {
//         await createFile('@workspace', path, content);
//       } else {
//         await createFolder('@workspace', path);
//       }

//       // Send update to backend
//       sendMessage({
//         type: 'update_structure',
//         data: updatedNode
//       });

//       // Update UI
//       onUpdate(updatedNode);
      
//       // Reset form
//       setNewName('');
//       setContent('');
//     } catch (error) {
//       console.error('Error creating file/folder:', error);
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <div>
//         <select 
//           value={type} 
//           onChange={(e) => setType(e.target.value as 'file' | 'folder')}
//           className="border p-2 rounded"
//         >
//           <option value="file">File</option>
//           <option value="folder">Folder</option>
//         </select>
//       </div>
      
//       <input
//         type="text"
//         value={newName}
//         onChange={(e) => setNewName(e.target.value)}
//         placeholder={`Enter ${type} name`}
//         className="border p-2 rounded w-full"
//       />

//       {type === 'file' && (
//         <textarea
//           value={content}
//           onChange={(e) => setContent(e.target.value)}
//           placeholder="Enter file content"
//           className="border p-2 rounded w-full h-32"
//         />
//       )}

//       <button
//         onClick={handleCreate}
//         className="bg-blue-500 text-white px-4 py-2 rounded"
//       >
//         Create {type}
//       </button>
//     </div>
//   );
// }; 