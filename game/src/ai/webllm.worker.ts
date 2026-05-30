/**
 * WebLLM inference worker. Hosts the MLCEngine off the main thread so model
 * download + token generation don't stutter the render loop (BACKLOG-049).
 *
 * Stays under game/src/ai/ — the NPCBrain boundary covers this file too.
 */

import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg: MessageEvent) => handler.onmessage(msg);
