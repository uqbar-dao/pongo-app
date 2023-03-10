import { NavigationProp } from "@react-navigation/native"
import { StyleSheet, TouchableOpacity } from "react-native"
import moment from 'moment'

import { PongoStackParamList } from "../../../types/Navigation"
import useStore from "../../../state/useStore"
import { Chat } from "../../../types/Pongo"
import Col from "../../spacing/Col"
import Row from "../../spacing/Row"
import { Text } from "../../Themed"
import { medium_gray, uq_lightpurple, uq_purple } from "../../../constants/Colors"
import { checkIsDm, getAdminMsgText, getChatName } from '../../../util/ping'
import Avatar from "../Avatar"
import { isLargeDevice, window } from "../../../constants/Layout"
import { getRelativeTime, ONE_SECOND } from "../../../util/time"
import { addSig, deSig } from "../../../util/string"
import { useMemo } from "react"

interface ChatProps {
  chat: Chat
  navigation: NavigationProp<PongoStackParamList>
}

export default function ChatsEntry({ chat, navigation }: ChatProps) {
  const { ship } = useStore()
  const { unreads, last_message, conversation: { id, members, last_active, name, leaders, muted } } = chat
  const chatName = getChatName(ship, chat)

  const isDm = checkIsDm(chat)
  const { width } = window

  const groupDisplayShip = addSig(last_message?.author || (leaders && leaders[0]) || ship)

  const messageDisplay = (
    <Col>
      {chat?.last_message?.author && !isDm && (
        <Text style={{ fontWeight: '600' }}>
          {deSig(last_message?.author || '') === deSig(ship) ? 'You' : chat?.last_message?.author}
        </Text>
      )}
      <Text style={{ fontSize: 14, marginRight: 16 }} numberOfLines={1}>
        {!chat?.last_message?.author ? (
          'No messages yet'
        ) : (
          <>
            {getAdminMsgText(last_message?.kind || 'text', last_message?.content|| '')}
          </>
        )}
      </Text>
    </Col>
  )

  const styles = useMemo(() => StyleSheet.create({
    chatsEntry: { width: '100%', padding: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: uq_lightpurple },
    unread: {
      padding: 4, backgroundColor: muted ? medium_gray : uq_purple, borderRadius: 14, minWidth: 28, justifyContent: 'center'
    },
    unreadText: {
      fontSize: 14, color: 'white', fontWeight: '600'
    },
  }), [muted])

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Chat', { id }) }>
      <Row style={styles.chatsEntry}>
        {isDm ? (
          <Avatar size='huge' ship={chatName} />
        ) : (
          <Avatar size='huge' ship={groupDisplayShip} />
        )}
        <Col style={{ marginLeft: 12, flex: 1 }}>
          <Row style={{ flex: 1, justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', maxWidth: width - (2 * 24 + 12 + 48 + 70) }} numberOfLines={1}>{chatName}</Text>
            {/* FORMAT TIME: time if today, day of the week if last week, mmm DD if last year, DD.MM.YY otherwise */}
            <Text style={{ fontSize: 14 }}>{getRelativeTime(last_active * ONE_SECOND)}</Text>
          </Row>
          <Row style={{ flex: 1, justifyContent: 'space-between', marginTop: 4 }}>
            <Row style={{ maxWidth: (isLargeDevice ? width / 4 : width) - (2 * 24 + 12 + 48 + 32) }}>
              {messageDisplay}
            </Row>
            {unreads > 0 && (
              <Row style={styles.unread}>
                <Text style={styles.unreadText}>
                  {unreads}
                </Text>
              </Row>
            )}
          </Row>
        </Col>
      </Row>
    </TouchableOpacity>
  )
}
