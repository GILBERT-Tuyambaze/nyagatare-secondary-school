import { handleAiHubRequest } from '../server/ai-hub.js'

export default async function handler(request) {
  return handleAiHubRequest(request)
}
