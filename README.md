# MCP Communication Flow Documentation

## Architecture Overview

The application follows a clear communication chain that enables AI-powered tool interactions through the Model Context Protocol (MCP).

**Communication Flow:**
```
[app/mcp/page.tsx] → [lib/actions.ts] → [lib/mcpClient.ts] → [mcp-tools/math-server.ts]
```

## Component Details

### 1. Frontend UI (`app/mcp/page.tsx`)

The React client component provides the user interface for interacting with MCP tools.

**Key Features:**
- User input handling for queries
- Step-by-step display of tool execution
- Loading states and error handling
- Real-time feedback showing AI reasoning, tool calls, and results

**Type Definitions:**
```typescript
type Step = {
  type: 'text' | 'tool_use' | 'tool_result';
  content: string;
};
```

### 2. Server Actions (`lib/actions.ts`)

Next.js server action that handles the bridge between frontend and backend MCP operations.

**Responsibilities:**
- Initialize MCP client connection
- Process user queries
- Handle connection lifecycle (connect → process → cleanup)
- Return structured step data to the frontend

### 3. MCP Client (`lib/mcpClient.ts`)

The core orchestration layer that manages communication between Claude AI and MCP tools.

**Key Components:**

#### Configuration Management
- Reads `mcpConfig.json` to discover available MCP servers
- Dynamically resolves file paths for tool executables
- Manages multiple server connections simultaneously

#### AI Integration
- Integrates with Anthropic's Claude AI API
- Converts MCP tool schemas to Claude-compatible tool definitions
- Handles multi-turn conversations with tool usage

#### Process Workflow
1. **Server Discovery**: Connects to all configured MCP servers
2. **Tool Registration**: Fetches available tools from each server
3. **AI Processing**: Sends user query to Claude with available tools
4. **Tool Execution**: Executes tools based on Claude's decisions
5. **Result Processing**: Formats and returns step-by-step results

### 4. MCP Math Server (`mcp-tools/math-server.ts`)

A standalone Node.js process that implements the MCP server protocol.

**Tool Capabilities:**
- **Mathematical**: add, multiply, power, factorial, fibonacci, is_prime
- **Utility**: random number generation, current time
- **Text Processing**: reverse_string, word_count

**MCP Protocol Implementation:**
- Handles `tools/list` requests to advertise available tools
- Processes `tools/call` requests to execute specific tools
- Provides proper error handling and validation
- Uses structured JSON schemas for tool parameters

## Communication Mechanisms

### Process Spawning
The MCP SDK internally converts configuration into process spawn commands:

**Configuration:**
```json
{
  "mcpServers": {
    "math-server": {
      "command": "node",
      "args": ["./mcp-tools/math-server.js"]
    }
  }
}
```

**Internal Conversion:**
```javascript
// MCP SDK internally creates:
const childProcess = spawn('node', ['./mcp-tools/math-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']  // stdin, stdout, stderr
});
```

### STDIO Communication
- **Client Transport**: `StdioClientTransport` manages spawned processes
- **Server Transport**: `StdioServerTransport` handles incoming requests
- **Protocol**: Structured JSON-RPC over standard input/output streams
- **Lifecycle**: Automatic process management and cleanup

### Error Handling
- Connection failures are handled gracefully
- Tool execution errors are captured and reported
- Process cleanup ensures no zombie processes
- Validation occurs at multiple layers (input, execution, output)

## Code Implementation

### 1. Frontend UI Component (`app/mcp/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { runQuery } from '@lib/actions';

type Step = {
  type: 'text' | 'tool_use' | 'tool_result';
  content: string;
};

export default function MCPUI() {
  const [query, setQuery] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSteps([]); // Clear previous steps

    try {
      const result = await runQuery(query);
      setSteps(result);
    } catch (err) {
      setSteps([{ type: 'text', content: '❌ Error: ' + String(err) }]);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto font-mono">
      <h1 className="text-xl font-bold mb-4">🧠 AI Tool Assistant</h1>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type your question, e.g., 'What is 15 * 32?'"
        rows={3}
        className="w-full p-3 border rounded text-sm"
      />

      <button
        onClick={handleRun}
        disabled={loading}
        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run'}
      </button>

      {steps.length > 0 && (
        <div className="mt-6 space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-gray-100 p-3 rounded border text-sm">
              <div className="font-semibold text-gray-700 mb-1">
                {step.type === 'text' && '🧠 Claude:'}
                {step.type === 'tool_use' && '🛠️ Tool Call:'}
                {step.type === 'tool_result' && '📦 Tool Result:'}
              </div>
              <pre className="whitespace-pre-wrap">{step.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Key Features:**
- **State Management**: Tracks query input, execution steps, and loading state
- **Error Handling**: Displays errors as text steps in the UI
- **Step Visualization**: Shows AI reasoning, tool calls, and results with icons
- **Real-time Feedback**: Users see the complete thought process

### 2. Server Action Bridge (`lib/actions.ts`)

```typescript
'use server';

import MCPClient from './mcpClient';

export async function runQuery(query: string): Promise<Step[]> {
  const client = new MCPClient();
  
  try {
    // 1. Connect to all configured MCP servers
    await client.connectToServers();
    
    // 2. Process query through Claude AI with tools
    const result = await client.processQuery(query);
    
    return result;
  } finally {
    // 3. Always cleanup connections
    await client.cleanup();
  }
}
```

**Responsibilities:**
- **Connection Lifecycle**: Manages MCP server connections
- **Error Boundary**: Ensures cleanup even if processing fails
- **Type Safety**: Returns properly typed Step array

### 3. MCP Client Orchestrator (`lib/mcpClient.ts`)

```typescript
class MCPClient {
  private anthropic: Anthropic;
  private servers: Map<string, ServerConnection> = new Map();
  private availableTools: Anthropic.Tool[] = [];

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Anthropic API key is required.");
    this.anthropic = new Anthropic({ apiKey });
  }

  // 🔗 Server Discovery and Connection
  async connectToServers(): Promise<void> {
    const config = MCPClient.readConfigJson();
    const tools: Anthropic.Tool[] = [];

    for (const [serverName, serverInfo] of Object.entries(config.mcpServers)) {
      // Create MCP client for this server
      const client = new Client({ name: `client-${serverName}`, version: "1.0.0" });

      // Resolve file paths (relative to absolute)
      const resolvedArgs = serverInfo.args.map(arg =>
        path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg)
      );

      // Create transport (this spawns the process internally)
      const transport = new StdioClientTransport({
        command: serverInfo.command,  // "node"
        args: resolvedArgs,          // ["./mcp-tools/math-server.js"]
        env: serverInfo.env,
      });

      // Connect to spawned process
      await client.connect(transport);
      this.servers.set(serverName, { name: serverName, client, transport });

      // Discover available tools from this server
      const toolsResponse = await client.request(
        { method: "tools/list" }, 
        ListToolsResultSchema
      );

      // Convert MCP tools to Claude-compatible format
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

  // 🧠 AI Processing with Tool Integration
  async processQuery(query: string): Promise<Step[]> {
    const steps: Step[] = [];
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: query }
    ];

    let response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages,
      tools: this.availableTools,  // Available MCP tools
      system: "You are a helpful assistant that uses tools to solve problems step-by-step.",
    });

    // Process multi-turn conversation with tool usage
    while (true) {
      let usedTool = false;

      for (const content of response.content) {
        if (content.type === "text") {
          steps.push({ type: "text", content: content.text });
        } 
        else if (content.type === "tool_use") {
          usedTool = true;

          // Log tool call
          steps.push({
            type: "tool_use",
            content: `Tool: ${content.name}\nInput:\n${JSON.stringify(content.input, null, 2)}`
          });

          // Execute tool on MCP server
          const toolResult = await this.executeTool(content.name, content.input);

          // Log tool result
          steps.push({
            type: "tool_result",
            content: toolResult
          });

          // Continue conversation with tool result
          messages.push({ role: "assistant", content: response.content });
          messages.push({
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: content.id,
              content: toolResult,
            }],
          });

          break; // Process one tool at a time
        }
      }

      // If no tools used, conversation is complete
      if (!usedTool) break;

      // Get Claude's response to tool result
      response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages,
        tools: this.availableTools,
        system: "You are a helpful assistant that uses tools to solve problems step-by-step.",
      });
    }

    return steps;
  }

  // 🛠️ Tool Execution on MCP Servers
  private async executeTool(toolName: string, input: any): Promise<string> {
    for (const [serverName, connection] of this.servers) {
      try {
        const result = await connection.client.request({
          method: "tools/call",
          params: {
            name: toolName,
            arguments: input,
          },
        }, CallToolResultSchema);

        // Format result content
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
        continue; // Try next server
      }
    }

    return `Tool '${toolName}' not found in any server.`;
  }

  // 🧹 Cleanup Resources
  async cleanup(): Promise<void> {
    for (const { client } of this.servers.values()) {
      await client.close().catch(() => {}); // Graceful cleanup
    }
    this.servers.clear();
    this.availableTools = [];
  }
}
```

**Key Processes:**
- **Dynamic Discovery**: Finds and connects to MCP servers from config
- **Tool Registration**: Converts MCP tool schemas to Claude format
- **Multi-turn Conversation**: Handles tool usage in AI conversations
- **Process Management**: Spawns and manages separate tool processes

### 4. MCP Math Server (`mcp-tools/math-server.ts`)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

// Create MCP server instance
const server = new Server({
  name: "test-math-server",
  version: "1.0.0",
}, {
  capabilities: { tools: {} },
});

// 📋 Tool Discovery Endpoint
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add",
        description: "Add two numbers together",
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number" },
          },
          required: ["a", "b"],
        },
      },
      {
        name: "multiply",
        description: "Multiply two numbers",
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number" },
          },
          required: ["a", "b"],
        },
      },
      // ... other tools (power, factorial, fibonacci, etc.)
    ],
  };
});

// 🔧 Tool Execution Endpoint
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "add": {
        const a = validateNumber(args?.a, "a");
        const b = validateNumber(args?.b, "b");
        const result = a + b;
        return {
          content: [{
            type: "text",
            text: `${a} + ${b} = ${result}`,
          }],
        };
      }

      case "multiply": {
        const a = validateNumber(args?.a, "a");
        const b = validateNumber(args?.b, "b");
        const result = a * b;
        return {
          content: [{
            type: "text",
            text: `${a} × ${b} = ${result}`,
          }],
        };
      }

      // ... other tool implementations

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) throw error;
    throw new McpError(ErrorCode.InternalError, 
      error instanceof Error ? error.message : String(error)
    );
  }
});

// 🚀 Server Startup
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport); // Keeps server alive
  console.error("✅ MCP Server is running.");
}

main().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
```

**Server Capabilities:**
- **Tool Advertisement**: Lists available tools with schemas
- **Input Validation**: Ensures parameters meet requirements
- **Error Handling**: Provides structured error responses
- **STDIO Communication**: Uses standard input/output for MCP protocol

## Data Flow Example

1. **User Input**: "What is 15 × 32?"

2. **Server Action**: Receives query and initializes MCP client

3. **MCP Client**: 
   - Connects to math server process via `spawn('node', ['./mcp-tools/math-server.js'])`
   - Discovers available tools (multiply, add, etc.)
   - Sends query to Claude AI with tool definitions

4. **Claude AI**:
   - Analyzes query and decides to use `multiply` tool
   - Returns tool_use instruction with parameters `{a: 15, b: 32}`

5. **Tool Execution**:
   - MCP client forwards request to math server via STDIO
   - Math server validates inputs and calculates `15 × 32 = 480`
   - Returns formatted result: "15 × 32 = 480"

6. **Response Chain**:
   - Results flow back through MCP client → server action → frontend
   - UI displays step-by-step breakdown of reasoning and execution

## Process Communication

### Internal Process Spawning
```javascript
// MCP SDK internally converts mcpConfig.json to:
const childProcess = spawn('node', ['./mcp-tools/math-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']  // stdin, stdout, stderr
});
```

### STDIO Protocol
- **Client → Server**: JSON-RPC requests over stdin
- **Server → Client**: JSON-RPC responses over stdout
- **Error Stream**: stderr for logging and debugging

### Connection Lifecycle
1. **Spawn**: Child process started via StdioClientTransport
2. **Handshake**: MCP protocol initialization
3. **Discovery**: `tools/list` request to get available tools
4. **Execution**: `tools/call` requests during AI conversations
5. **Cleanup**: Process termination and resource cleanup

## Why This Architecture

### Separation of Concerns
- **Frontend**: Pure UI logic and user interaction
- **Server Actions**: Request orchestration and session management  
- **MCP Client**: AI integration and tool coordination
- **Tool Servers**: Isolated, reusable computational units

### Scalability
- Multiple MCP servers can run concurrently
- Tools are isolated processes (failure isolation)
- Easy to add new tool categories without code changes
- Claude AI handles complex reasoning and tool selection

### Development Benefits
- **Type Safety**: Full TypeScript support across the stack
- **Hot Reload**: Next.js development with fast iteration
- **Modularity**: Tools can be developed and tested independently
- **Standards-Based**: Uses MCP protocol for interoperability

## Build Process

The project uses separate compilation for different environments:

**Frontend Build**: `npm run build` (Next.js application)
**Tools Build**: `npm run build:tools` (Compiles TypeScript MCP tools)

**Why Separate Builds:**
- Next.js and Node.js have different module systems
- Tools run in separate processes with different requirements
- Enables independent deployment and scaling strategies

## Getting Started

### From GitHub Repository

```bash
# Clone and install dependencies
git clone <repository-url>
cd workspace-chat
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your ANTHROPIC_API_KEY

# Build MCP tools
npm run build:tools

# Start development server
npm run dev
```

## Configuration Files

The system relies on several configuration files that work together to enable the MCP communication flow.

### TypeScript Configurations

#### Main TypeScript Config (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,                               // ✅ Let Next.js handle build
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",                // ✅ Next.js 13+ default
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",                               // ✅ Required for path aliases
    "paths": {
      "@/*": ["./*"],
      "@lib/*": ["lib/*"],
      "@app/*": ["app/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

**Purpose**: Configures TypeScript for the Next.js frontend application
**Key Features**:
- `noEmit: true` - Next.js handles compilation
- `moduleResolution: "bundler"` - Modern module resolution
- Path aliases (`@/*`, `@lib/*`, `@app/*`) for clean imports
- Browser-compatible target and libraries

#### Tools TypeScript Config (`tsconfig.tools.json`)
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",                          // ✅ Fixes Zod compatibility
    "module": "CommonJS",                        // ✅ Node.js compatibility
    "outDir": "mcp-tools",                       // ✅ Separate output directory
    "noEmit": false,                             // ✅ Enable compilation
    "esModuleInterop": true,
    "strict": true,
    "types": ["node"],                           // ✅ Node.js type definitions
    "moduleResolution": "node",                  // ✅ Node.js module resolution
    "resolveJsonModule": true
  },
  "include": ["mcp-tools/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Purpose**: Separate configuration for compiling MCP tool servers
**Why Needed**:
- **Different Runtime**: Tools run in Node.js, not browser
- **Module System**: CommonJS vs ESNext modules
- **Build Output**: Compiles to separate directory
- **Dependencies**: Node.js-specific APIs and types

### Package Configuration (`package.json`)
```json
{
  "name": "workspace-chat",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build:tools": "tsc -p tsconfig.tools.json",  // ✅ Compile MCP tools
    "dev": "next dev --turbopack",                 // ✅ Fast development
    "build": "next build",                         // ✅ Production build
    "start": "next start",                         // ✅ Production server
    "lint": "next lint"                            // ✅ Code quality
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.52.0",               // Claude AI integration
    "@modelcontextprotocol/sdk": "^1.12.0",       // MCP protocol
    "ajv": "^8.17.1",                             // JSON schema validation
    "dotenv": "^16.5.0",                          // Environment variables
    "next": "15.3.2",                             // React framework
    "react": "^19.0.0",                           // UI library
    "react-dom": "^19.0.0"                        // DOM rendering
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",                 // CSS processing
    "@types/node": "^20.17.50",                   // Node.js types
    "@types/react": "^19",                        // React types
    "@types/react-dom": "^19",                    // React DOM types
    "tailwindcss": "^4",                          // Utility CSS
    "ts-node": "^10.9.2",                        // TypeScript execution
    "typescript": "^5.8.3"                       // TypeScript compiler
  }
}
```

**Script Explanations**:
- `build:tools`: Compiles MCP tools separately from Next.js app
- `dev --turbopack`: Uses Turbopack for faster development builds
- Dual build system supports both web and Node.js environments

### MCP Server Configuration (`mcpConfig.json`)
```json
{
  "mcpServers": {
    "math-server": {
      "command": "node",
      "args": ["./mcp-tools/math-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Purpose**: Defines available MCP servers and how to launch them
**Process Spawning**: MCP SDK converts this to:
```javascript
spawn('node', ['./mcp-tools/math-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { NODE_ENV: 'production' }
});
```

### Environment Configuration (`.env.local`)
```bash
# Required: Anthropic API key for Claude AI
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Custom MCP config path
MCP_CONFIG_PATH=./mcpConfig.json

# Optional: Logging level
LOG_LEVEL=info
```

**Security**: This file is git-ignored and contains sensitive API keys

## Why These Configurations Are Needed

### Dual Environment Support
- **Frontend**: Runs in browser with modern JavaScript
- **Backend Tools**: Run in Node.js with CommonJS modules
- **Different Targets**: Browser APIs vs Node.js APIs

### Build Optimization
- **Next.js**: Handles frontend bundling and optimization
- **Tools**: Simple TypeScript compilation for server processes
- **Path Aliases**: Clean imports and better developer experience

### Process Management
- **MCP Config**: Declarative server definitions
- **Environment**: Secure API key management
- **Scripts**: Automated build and development workflows

### Type Safety
- **Full Stack**: TypeScript across frontend and backend
- **API Contracts**: Shared types between components
- **Tool Schemas**: Validated inputs and outputs

## Setup Instructions

### From GitHub Repository

```bash
# 1. Clone and install
git clone <repository-url>
cd workspace-chat
npm install

# 2. Environment setup
cp .env.example .env.local
# Edit .env.local with your ANTHROPIC_API_KEY

# 3. Build tools
npm run build:tools

# 4. Start development
npm run dev
```

### Configuration Validation
The system will automatically:
- Validate TypeScript configurations on build
- Check for required environment variables
- Discover and connect to MCP servers
- Handle process spawning and communication

**Error Handling**: Missing configurations will show clear error messages with setup instructions.