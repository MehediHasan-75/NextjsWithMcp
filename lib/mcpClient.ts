import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { CallToolResultSchema, ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import path from "path";

dotenv.config();

interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

interface Config {
    mcpServers: Record<string, MCPServerConfig>;
}

interface MCPClientConfig {
    name?: string;
    version?: string;
}

interface ServerConnection {
    name: string;
    client: Client;
    transport: StdioClientTransport;
}

const SYSTEM_PROMPT = `You are an intelligent assistant with access to various tools for calculations and operations. Analyze the user's query and use the most appropriate tool.`

class MCPClient {
    private anthropic: Anthropic;
    private servers: Map<string, ServerConnection> = new Map();
    private availableTools: Anthropic.Tool[] = [];

    constructor(config: MCPClientConfig = {}) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error("Anthropic API key is required.");
        }

        this.anthropic = new Anthropic({ apiKey });
    }

    private static readConfigJson(): Config {
        const configPath = process.env.mcpConfig || path.join(process.cwd(), "mcpConfig.json");
        const configData = readFileSync(configPath, "utf-8");
        return JSON.parse(configData);
    }

    async connectToServers(): Promise<void> {
        const config = MCPClient.readConfigJson();
        const mcpServers = config.mcpServers;

        const tools: Anthropic.Tool[] = [];

        for (const [serverName, serverInfo] of Object.entries(mcpServers)) {
            const client = new Client({ name: `client-${serverName}`, version: "1.0.0" });

            const resolvedArgs = serverInfo.args.map(arg =>
                path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg)
            );

            const transport = new StdioClientTransport({
                command: serverInfo.command,
                args: resolvedArgs,
                env: serverInfo.env,
            });

            await client.connect(transport);

            this.servers.set(serverName, { name: serverName, client, transport });

            const toolsResponse = await client.request({ method: "tools/list" }, ListToolsResultSchema);

            for (const tool of toolsResponse.tools) {
                tools.push({
                    name: tool.name,
                    description: tool.description || tool.name,
                    input_schema: tool.inputSchema,
                });
            }
        }

        this.availableTools = tools;
    }

    async processQuery(query: string): Promise<
        { type: 'text' | 'tool_use' | 'tool_result'; content: string }[]
    > {
        if (this.availableTools.length === 0) {
            throw new Error("No tools available. Please call connectToServers() first.");
        }

        const SYSTEM_PROMPT = `You are a helpful assistant that uses tools to solve problems step-by-step.`;

        const steps: { type: 'text' | 'tool_use' | 'tool_result'; content: string }[] = [];

        const messages: Anthropic.MessageParam[] = [
            { role: "user", content: query }
        ];

        let response = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            messages,
            tools: this.availableTools,
            system: SYSTEM_PROMPT,
        });

        while (true) {
            let usedTool = false;

            for (const content of response.content) {
                if (content.type === "text") {
                    steps.push({ type: "text", content: content.text });
                } else if (content.type === "tool_use") {
                    usedTool = true;

                    const toolName = content.name;
                    const toolInput = content.input;

                    steps.push({
                        type: "tool_use",
                        content: `Tool: ${toolName}\nInput:\n${JSON.stringify(toolInput, null, 2)}`
                    });

                    const toolResult = await this.executeTool(toolName, toolInput);

                    steps.push({
                        type: "tool_result",
                        content: toolResult
                    });

                    messages.push({ role: "assistant", content: response.content });
                    messages.push({
                        role: "user",
                        content: [
                            {
                                type: "tool_result",
                                tool_use_id: content.id,
                                content: toolResult,
                            },
                        ],
                    });

                    break;
                }
            }

            if (!usedTool) break;

            response = await this.anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 4096,
                messages,
                tools: this.availableTools,
                system: SYSTEM_PROMPT,
            });
        }

        return steps;
    }

    private async executeTool(toolName: string, input: any): Promise<string> {
        for (const [serverName, connection] of this.servers) {
            try {
                const result = await connection.client.request(
                    {
                        method: "tools/call",
                        params: {
                            name: toolName,
                            arguments: input,
                        },
                    },
                    CallToolResultSchema
                );

                const content = result.content;
                if (!content) return "Tool executed successfully (no output).";

                if (Array.isArray(content)) {
                    return content.map(c => c.text || JSON.stringify(c)).join("\n");
                } else if (typeof content === "string") {
                    return content;
                } else {
                    return JSON.stringify(content, null, 2);
                }
            } catch (err) {
                // Try next server
                continue;
            }
        }

        return `Tool '${toolName}' not found in any server.`;
    }

    async cleanup(): Promise<void> {
        for (const { client } of this.servers.values()) {
            await client.close().catch(() => { });
        }

        this.servers.clear();
        this.availableTools = [];
    }
}

export default MCPClient;
