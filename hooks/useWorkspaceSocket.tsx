"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Node } from "@/types/tree";

interface WebSocketMessage {
  type: string;
  data: any;
  command?: string;
  message?: string;
  message_id?: string;
  path?: string;
  folder_structure?: Node;
}

interface UseWorkspaceSocketProps {
  onMessage?: (message: WebSocketMessage) => void;
  defaultStructure?: Node;
}

export const useWorkspaceSocket = ({ onMessage, defaultStructure }: UseWorkspaceSocketProps = {}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, type: string}>>([]);
  const onMessageRef = useRef(onMessage);
  const structureRef = useRef(defaultStructure);

  const appendMessage = useCallback((text: string, type: string) => {
    setMessages(prev => [...prev, { text, type }]);
  }, []);

  // Keep the latest callback in ref
  useEffect(() => {
    onMessageRef.current = onMessage;
    structureRef.current = defaultStructure;
  }, [onMessage, defaultStructure]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/ac/`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      appendMessage('🟢 Connected to server', 'system');
      
      // Send initial structure if available
      if (structureRef.current) {
        ws.send(JSON.stringify({
          type: 'initialize',
          data: structureRef.current
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        if (data.type === 'greeting') {
          appendMessage(`Server: ${data.message}`, 'system');
          return;
        }

        // Handle folder read request
        if (data.command === 'read_folder_request' || data.type === 'folder_request') {
          appendMessage(`🔍 MCP requesting folder: ${data.path || 'root'}`, 'reply-request');

          const response = {
            command: 'folder_response',
            type: 'folder_response',
            message_id: data.message_id,
            path: data.path,
            folder_structure: structureRef.current
          };

          setTimeout(() => {
            ws.send(JSON.stringify(response));
            appendMessage(`✅ Sent folder structure`, 'reply');
          }, 100);
          return;
        }

        // Handle folder update
        if (data.command === 'update_folder_request' || data.type === 'folder_update') {
          appendMessage(`📁 MCP updating folder: ${data.path || 'root'}`, 'reply-request');

          if (data.folder_structure) {
            onMessageRef.current?.({
              type: 'update_structure',
              data: data.folder_structure
            });
          }

          const response = {
            command: 'folder_updated',
            type: 'folder_updated',
            message_id: data.message_id,
            status: 'success',
            message: 'Folder updated successfully'
          };

          setTimeout(() => {
            ws.send(JSON.stringify(response));
            appendMessage(`✅ Folder updated successfully`, 'reply');
          }, 100);
          return;
        }

        // Handle other messages
        onMessageRef.current?.(data);
        
        if (data.message) {
          appendMessage(`Received: ${data.message}`, 'received');
        }

      } catch (error) {
        appendMessage(`Raw: ${event.data}`, 'received');
        console.error('Error processing message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setConnected(false);
      appendMessage('🔴 Disconnected from server', 'system');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      appendMessage('❌ WebSocket error', 'system');
    };

    setSocket(ws);

    return () => {
      console.log('Cleaning up WebSocket connection');
      ws.close();
      setSocket(null);
      setConnected(false);
    };
  }, [appendMessage]);

  const sendMessage = useCallback((message: any) => {
    if (socket && connected && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      appendMessage(`Sent: ${JSON.stringify(message)}`, 'sent');
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [socket, connected, appendMessage]);

  return { connected, sendMessage, socket, messages };
};