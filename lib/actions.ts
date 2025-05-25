'use server';

import MCPClient from './mcpClient';

export async function runQuery(query: string): Promise<string> {
    const client = new MCPClient();
    await client.connectToServers();
    const result = await client.processQuery(query);
    await client.cleanup();
    return result;
}
