import { Text } from "react-native"
import { DM_DIVIDER } from "../constants/Pongo"
import { Chat, Chats, Message, MessageKind, Reactions } from "../types/Pongo"
import { displayTokenAmount } from "../wallet-ui/utils/number"
import { fromUd } from "./number"
import { addSig, AUDIO_URL_REGEX, deSig, IMAGE_URL_REGEX } from "./string"

export const sortChats = (chats: Chats) =>
  Object.keys(chats)
    .reduce((acc, cur) => acc.concat([chats[cur]]), [] as Chat[])
    .sort((a, b) => b.conversation.last_active - a.conversation.last_active)

export const isAdminMsg = (msg: Message) => 
  msg.kind === 'member-add' || msg.kind === 'member-remove' || msg.kind === 'change-name' ||
  msg.kind === 'leader-add' || msg.kind === 'leader-remove' || msg.kind === 'change-router'

export const checkIsDm = (chat: Chat) => {
  if (!chat) {
    return false
  }
  
  return chat.conversation.dm
}

export const getChatName = (self: string, chat?: Chat) => {
  if (!chat) {
    return 'Unknown'
  }
  if (checkIsDm(chat)) {
    return addSig(chat.conversation.members.find(m => m !== deSig(self)) || chat.conversation.name)
  }

  return chat.conversation.name
}

export const getAdminMsgText = (kind: MessageKind, content: string) => {
  if (kind === 'member-add') {
    return `${content} joined the chat`
  } else if (kind === 'member-remove') {
    return `${content} left the chat`
  } else if (kind === 'change-name') {
    return `name changed to "${content}"`
  } else if (kind === 'leader-add') {
    return `${content} added as an admin`
  } else if (kind === 'leader-remove') {
    return `${content} removed as an admin`
  } else if (kind === 'change-router') {
    return `Router changed to ${content}`
  } else if (kind === 'send-tokens') {
    return formatTokenContent(content)
  } else if (AUDIO_URL_REGEX.test(content)) {
    return 'Voice Message'
  } else if (IMAGE_URL_REGEX.test(content)) {
    return 'Image'
  } else {
    return content
  }
}

export const getAppLinkText = (link: string) => `urbit:/${link}`

export const idNum = (id: string) => Number(id.replace(/\./, ''))

export function throttle(fn: Function, wait: number) {
  let time = Date.now();
  return function() {
    if ((time + wait - Date.now()) < 0) {
      fn();
      time = Date.now();
    }
  }
}

export const dedupeMessages = (messages: Message[]) => {
  const messageMap = new Map<string, Message>()
  messages.forEach(msg => messageMap.set(msg.id, { ...msg, status: 'delivered' }))
  return Array.from(messageMap.values())
}

export const sortMessages = (messages: Message[]) =>
  messages.sort((a, b) => {
    if (a.id[0] === '-' && b.id[0] === '-') {
      return Number(a) - Number(b)
    } else if (a.id[0] === '-') {
      return -1
    } else if (b.id[0] === '-') {
      return 1
    } else {
      return Number(b.id.replace(/\./g, '')) - Number(a.id.replace(/\./g, ''))
    }
  })

export const removePending = (messages: Message[]) =>
  messages.filter(m => {
    if (m.id[0] === '-') {
      return !Boolean(
        messages.find(t => t.id[0] !== '-' && m.kind === t.kind && m.content === t.content && m.author === t.author)
      )
    }

    return true
  })

export const dedupeAndSort = (messages: Message[]) => sortMessages(dedupeMessages(removePending(messages)))

export const formatTokenContent = (text: string) => {
  const [amount, symbol, recipient] = text.split(' ')
  return `Sent ${displayTokenAmount(fromUd(amount), 18, 3)} ${symbol} to ${recipient}`
}
