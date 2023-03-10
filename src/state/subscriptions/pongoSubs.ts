import { GetState, SetState } from "zustand"
import { dedupeAndSort, idNum, sortChats, sortMessages } from "../../util/ping"
import { deSig } from "../../util/string"
import { Message, MessageStatus, Update } from "../../types/Pongo"
import { PongoStore } from "../types/pongo"

export const messageSub = (set: SetState<PongoStore>, get: GetState<PongoStore>) => (update: Update) => {
  console.log('UPDATE:', JSON.stringify(update))
  const { currentChat, api, getChats } = get()
  
  if ('message' in update) {
    // How to handle when message is being updated?
    const chats = { ...get().chats }
    const chatId = update.message.conversation_id
    const chat = chats[chatId]
    const messages = chat?.messages || []

    if (!chat) {
      return
    }

    const { id, kind, content, edited, reactions, reference, timestamp, author } = update.message.message

    chat.conversation.last_active = timestamp
    const isMostRecent = chat.messages?.[0]?.id && idNum(id) > idNum(chat.messages[0]?.id || '0')

    if (isMostRecent) {
      chat.last_message = update.message.message
    }

    // Check that the chat is the current chat and the message is the next one in order
    if (deSig(author) === deSig(get().api?.ship || '')) {
      chat.unreads = 0
    } else if (isMostRecent) {
      chat.unreads = Number(chat.unreads) + 1
    }
    
    if (chatId === currentChat) {
      if (isMostRecent) {
        chat.conversation.last_read = id
        get().setLastReadMsg(chatId, id)
      }

      const existing = messages?.find(m =>
        m && (m.id === id || (m.id[0] === '-' && m.kind === kind && m.content === content)))

      if (existing) {
        existing.id = id
        existing.content = content
        existing.edited = edited
        existing.reactions = reactions
        existing.reference = reference
        existing.timestamp = timestamp
        existing.status = 'delivered'
      } else if (isMostRecent || !chat.messages || chat.messages.length === 0) {
        chat.messages = [{ ...update.message.message, status: 'delivered' as MessageStatus } as Message].concat(messages)
      }
      chat.messages = dedupeAndSort(chat.messages)
      set({ chats })
    }
    
    // Handle admin message types
    if (update.message.message.kind === 'leader-add') {
      chat.conversation.leaders.push(deSig(update.message.message.content))
    } else if (update.message.message.kind === 'leader-remove') {
      chat.conversation.leaders = chat.conversation.leaders.filter(l => deSig(l) !== deSig(update.message.message.content))
    } else if (update.message.message.kind === 'member-add') {
      if (!chat.conversation.members.includes(deSig(update.message.message.content))) {
        chat.conversation.members.unshift(deSig(update.message.message.content))
      }
    } else if (update.message.message.kind === 'member-remove') {
      chat.conversation.members = chat.conversation.members.filter(m => deSig(m) !== deSig(update.message.message.content))
    } else if (update.message.message.kind === 'change-name') {
      chat.conversation.name = update.message.message.content
    }

    const sortedChats = sortChats(chats)
    set({ chats, sortedChats })
  } else if ('sending' in update) {
    const { chats } = get()
    const existing = chats[update.sending.conversation_id]?.messages?.find(m => m.id === update.sending.identifier)
    if (existing) {
      existing.status = 'sent'
      existing.identifier = existing.id
      chats[update.sending.conversation_id].messages = dedupeAndSort(chats[update.sending.conversation_id].messages)
    }
  } else if ('delivered' in update) {
    const { chats } = get()
    const existing = chats[update.delivered.conversation_id]?.messages?.find(m => m.identifier === update.delivered.identifier)
    if (existing) {
      if (update.delivered.message_id) {
        existing.id = update.delivered.message_id
      }
      existing.status = 'delivered'
      chats[update.delivered.conversation_id].messages = dedupeAndSort(chats[update.delivered.conversation_id].messages)
    }
  } else if ('conversations' in update) {

  } else if ('message_list' in update) {

  } else if ('invite' in update) {
    if (api) {
      getChats(api)
    }
  } else if ('search_result' in update) {

  }
}
