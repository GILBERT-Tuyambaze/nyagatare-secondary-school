import { handleInviteEmailRequest } from '../server/invite-email.js'

export default async function handler(request) {
  return handleInviteEmailRequest(request)
}
