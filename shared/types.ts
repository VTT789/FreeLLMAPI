// Basic types
export interface Model {
id: string;
name: string;
provider: string;
context_length?: number;
max_tokens?: number;
input_price_per_1k?: number;
output_price_per_1k?: number;
is_active?: boolean;
}

export interface Provider {
id: string;
name: string;
api_key?: string;
base_url?: string;
enabled?: boolean;
}

export interface Profile {
id: string;
name: string;
description?: string;
model_ids: string[];
strategy: string;
is_active?: boolean;
}

export interface Analytics {
provider_id: string;
model_id: string;
request_type: string;
tokens_input: number;
tokens_output: number;
tokens_total: number;
latency_ms: number;
success: boolean;
error_message?: string;
}

export interface ModelListRow {
id: string;
model_id: string;
provider: string;
display_name: string;
context_length?: number;
max_tokens?: number;
input_price_per_1k?: number;
output_price_per_1k?: number;
is_active: boolean;
}

export interface ChatMessage {
role: 'system' | 'user' | 'assistant' | 'tool';
content: string;
name?: string;
tool_calls?: ChatToolCall[];
tool_call_id?: string;
}

export interface ChatToolCall {
id: string;
type: 'function';
function: {
name: string;
arguments: string;
};
}

export interface ChatToolDefinition {
type: 'function';
function: {
name: string;
description?: string;
parameters?: Record<string, any>;
};
}

export type ChatToolChoice =
| 'none'
| 'auto'
| { type: 'function'; function: { name: string } };

export type Platform =
| 'google'
| 'groq'
| 'cerebras'
| 'nvidia'
| 'mistral'
| 'openrouter'
| 'github'
| 'cohere'
| 'cloudflare'
| 'zhipu'
| 'ollama'
| 'kilo'
| 'pollinations'
| 'ovh'
| 'llm7'
| 'huggingface'
| 'opencode'
| 'agnes'
| 'custom';

export interface ApiKey {
id: number;
platform: Platform;
label?: string;
enabled?: boolean;
status?: string;
created_at?: string;
}

export interface KeyStatus {
key: string;
provider: string;
valid: boolean;
last_checked?: string;
error?: string;
}

export type QuirkSeverity =
| 'low'
| 'medium'
| 'high'
| 'critical';

export type QuirkTarget =
| 'prompt'
| 'response'
| 'both';

export interface Quirk {
id: string;
model_id: string;
severity: QuirkSeverity;
target: QuirkTarget;
description: string;
fix?: string;
slug?: string;
title?: string;
body?: string;
}

export interface QuirkDefinition {
id: string;
model_id: string;
severity: QuirkSeverity;
target: QuirkTarget;
description: string;
fix?: string;
slug?: string;
title?: string;
body?: string;
}

export interface QuirkSeverityCount {
blocker?: number;
high?: number;
medium?: number;
low?: number;
}
