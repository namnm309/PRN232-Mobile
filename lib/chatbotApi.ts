import { config } from './config';

export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    content?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
};

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const url = `${config.apiBaseUrl}/api/chat`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  const data = (await res.json().catch(() => ({}))) as ChatApiResponse;
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }

  // BE current pattern: ApiResponse<T>
  const content = data?.data?.content;
  if (!content) throw new Error('Phản hồi AI không hợp lệ.');
  return content;
}
