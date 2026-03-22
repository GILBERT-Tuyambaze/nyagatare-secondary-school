import { handlePublicAiRequest } from '../server/public-ai.js'

export default async function handler(request) {
  return handlePublicAiRequest(request)
}
