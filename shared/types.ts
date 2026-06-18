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
