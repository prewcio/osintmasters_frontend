import * as Ably from 'ably'
import { configureAbly } from "@ably-labs/react-hooks"

export const ably = configureAbly({
  authUrl: `/api/ably/auth`,
  clientId: Math.random().toString(36).substring(2, 15),
})

export const CHAT_CHANNEL = 'chat' 