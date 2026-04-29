import { CreateMLCEngine, type MLCEngine, type InitProgressReport } from '@mlc-ai/web-llm';

/**
 * Local LLM access. The engine is loaded lazily on first use and cached
 * for the life of the page. Models are downloaded once into the browser's
 * cache (typically a few hundred MB) and never leave the device.
 */

const DEFAULT_MODEL = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';

const SYSTEM_PROMPT = `You are Circuitus, an on-device legal-research assistant for in-house counsel and transactional lawyers. Default to a measured, plain-prose register. When you can answer concisely, do. When citations would normally appear, attribute them naturally ("under Cal. Civ. Code § 1641", "see Armendariz, 24 Cal.4th 83"). You are not connected to any external service; you cannot look up live cases. If asked to draft something non-legal (an email, an outline, a summary), do that helpfully too.`;

let enginePromise: Promise<MLCEngine> | null = null;
let progressListeners: Array<(p: InitProgressReport) => void> = [];

export function onLoadProgress(listener: (p: InitProgressReport) => void): () => void {
  progressListeners.push(listener);
  return () => {
    progressListeners = progressListeners.filter((l) => l !== listener);
  };
}

export function getEngine(): Promise<MLCEngine> {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(DEFAULT_MODEL, {
      initProgressCallback: (report) => {
        for (const l of progressListeners) l(report);
      },
    }).catch((err) => {
      // Clear the cached failure so the next call can retry from scratch.
      enginePromise = null;
      throw err;
    });
  }
  return enginePromise;
}

/** Drop the cached engine so the next getEngine() retries from scratch. */
export function resetEngine(): void {
  enginePromise = null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function* streamReply(
  history: ChatMessage[],
  context?: string,
): AsyncGenerator<string, void, void> {
  const engine = await getEngine();
  const systemContent = context
    ? `${SYSTEM_PROMPT}\n\n--- Active Workspace Context ---\n${context}\n--- End Context ---`
    : SYSTEM_PROMPT;
  const messages: ChatMessage[] = [{ role: 'system', content: systemContent }, ...history];
  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1024,
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

export const ASSISTANT_MODEL_ID = DEFAULT_MODEL;
