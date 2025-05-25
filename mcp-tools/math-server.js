"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
// Create the server instance
const server = new index_js_1.Server({
    name: "test-math-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Helper function for error handling
function handleError(error) {
    if (error instanceof types_js_1.McpError) {
        throw error;
    }
    throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, error instanceof Error ? error.message : String(error));
}
// Helper function to validate numbers
function validateNumber(value, name) {
    if (typeof value !== "number" || isNaN(value)) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, `${name} must be a valid number`);
    }
    return value;
}
// List available tools
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
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
            {
                name: "power",
                description: "Raise a number to a power",
                inputSchema: {
                    type: "object",
                    properties: {
                        base: { type: "number", description: "Base number" },
                        exponent: { type: "number", description: "Exponent" },
                    },
                    required: ["base", "exponent"],
                },
            },
            {
                name: "factorial",
                description: "Calculate the factorial of a number",
                inputSchema: {
                    type: "object",
                    properties: {
                        n: { type: "number", description: "Non-negative integer" },
                    },
                    required: ["n"],
                },
            },
            {
                name: "is_prime",
                description: "Check if a number is prime",
                inputSchema: {
                    type: "object",
                    properties: {
                        n: { type: "number", description: "Number to check" },
                    },
                    required: ["n"],
                },
            },
            {
                name: "fibonacci",
                description: "Calculate the nth Fibonacci number",
                inputSchema: {
                    type: "object",
                    properties: {
                        n: { type: "number", description: "Position in sequence (0-based)" },
                    },
                    required: ["n"],
                },
            },
            {
                name: "random",
                description: "Generate a random number between min and max",
                inputSchema: {
                    type: "object",
                    properties: {
                        min: { type: "number", description: "Minimum value", default: 0 },
                        max: { type: "number", description: "Maximum value", default: 100 },
                    },
                },
            },
            {
                name: "reverse_string",
                description: "Reverse a string",
                inputSchema: {
                    type: "object",
                    properties: {
                        text: { type: "string", description: "Text to reverse" },
                    },
                    required: ["text"],
                },
            },
            {
                name: "word_count",
                description: "Count words in text",
                inputSchema: {
                    type: "object",
                    properties: {
                        text: { type: "string", description: "Text to analyze" },
                    },
                    required: ["text"],
                },
            },
            {
                name: "current_time",
                description: "Get current date and time",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: {
                            type: "string",
                            description: "Format: 'iso' or 'local'",
                            default: "iso"
                        },
                    },
                },
            },
        ],
    };
});
// Handle tool execution
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        switch (name) {
            case "add": {
                const a = validateNumber(args?.a, "a");
                const b = validateNumber(args?.b, "b");
                const result = a + b;
                return {
                    content: [
                        {
                            type: "text",
                            text: `${a} + ${b} = ${result}`,
                        },
                    ],
                };
            }
            case "multiply": {
                const a = validateNumber(args?.a, "a");
                const b = validateNumber(args?.b, "b");
                const result = a * b;
                return {
                    content: [
                        {
                            type: "text",
                            text: `${a} × ${b} = ${result}`,
                        },
                    ],
                };
            }
            case "power": {
                const base = validateNumber(args?.base, "base");
                const exponent = validateNumber(args?.exponent, "exponent");
                const result = Math.pow(base, exponent);
                return {
                    content: [
                        {
                            type: "text",
                            text: `${base}^${exponent} = ${result}`,
                        },
                    ],
                };
            }
            case "factorial": {
                const n = validateNumber(args?.n, "n");
                if (n < 0 || !Number.isInteger(n)) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Factorial requires a non-negative integer");
                }
                if (n > 170) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Number too large (would exceed precision)");
                }
                let result = 1;
                for (let i = 2; i <= n; i++) {
                    result *= i;
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: `${n}! = ${result}`,
                        },
                    ],
                };
            }
            case "is_prime": {
                const n = validateNumber(args?.n, "n");
                if (!Number.isInteger(n) || n < 2) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${n} is not prime (must be integer ≥ 2)`,
                            },
                        ],
                    };
                }
                if (n === 2) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${n} is prime`,
                            },
                        ],
                    };
                }
                if (n % 2 === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${n} is not prime (even number)`,
                            },
                        ],
                    };
                }
                const sqrt = Math.sqrt(n);
                for (let i = 3; i <= sqrt; i += 2) {
                    if (n % i === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `${n} is not prime (divisible by ${i})`,
                                },
                            ],
                        };
                    }
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: `${n} is prime`,
                        },
                    ],
                };
            }
            case "fibonacci": {
                const n = validateNumber(args?.n, "n");
                if (n < 0 || !Number.isInteger(n)) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Fibonacci requires non-negative integer");
                }
                if (n > 78) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Number too large (would exceed precision)");
                }
                if (n <= 1) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Fibonacci(${n}) = ${n}`,
                            },
                        ],
                    };
                }
                let a = 0, b = 1;
                for (let i = 2; i <= n; i++) {
                    [a, b] = [b, a + b];
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: `Fibonacci(${n}) = ${b}`,
                        },
                    ],
                };
            }
            case "random": {
                const min = args?.min ?? 0;
                const max = args?.max ?? 100;
                validateNumber(min, "min");
                validateNumber(max, "max");
                if (min > max) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "min cannot be greater than max");
                }
                const result = 10;
                return {
                    content: [
                        {
                            type: "text",
                            text: `Random number between ${min} and ${max}: ${result}`,
                        },
                    ],
                };
            }
            case "reverse_string": {
                const text = args?.text;
                if (typeof text !== "string") {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "text must be a string");
                }
                const reversed = text.split("").reverse().join("");
                return {
                    content: [
                        {
                            type: "text",
                            text: `Original: "${text}"\nReversed: "${reversed}"`,
                        },
                    ],
                };
            }
            case "word_count": {
                const text = args?.text;
                if (typeof text !== "string") {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "text must be a string");
                }
                const words = text.trim().split(/\s+/).filter(word => word.length > 0);
                const wordCount = words.length;
                const charCount = text.length;
                const charCountNoSpaces = text.replace(/\s/g, "").length;
                return {
                    content: [
                        {
                            type: "text",
                            text: `Text analysis:\nWords: ${wordCount}\nCharacters: ${charCount}\nCharacters (no spaces): ${charCountNoSpaces}`,
                        },
                    ],
                };
            }
            case "current_time": {
                const format = args?.format ?? "iso";
                const now = new Date();
                let timeString;
                if (format === "local") {
                    timeString = now.toLocaleString();
                }
                else {
                    timeString = now.toISOString();
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: `Current time (${format}): ${timeString}`,
                        },
                    ],
                };
            }
            default:
                throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (error) {
        handleError(error);
    }
});
// Start the server
// Start the server
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport); // ✅ This keeps the server alive and ready
    console.error("✅ MCP Server is running.");
}
// Handle errors gracefully
main().catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
});
