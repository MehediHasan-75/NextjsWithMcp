'use client';

import { useState } from 'react';
import { runQuery } from '@lib/actions'; // Make sure this returns Step[]

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
