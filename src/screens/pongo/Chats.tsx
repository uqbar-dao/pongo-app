import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { AppState, AppStateStatus, Pressable, RefreshControl, StyleSheet } from 'react-native'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { getPresentedNotificationsAsync, dismissNotificationAsync, setBadgeCountAsync, Notification } from 'expo-notifications'

import useStore from '../../state/useStore'
import usePongoStore from '../../state/usePongoState'
import ChatsEntry from '../../components/pongo/Chats/ChatsEntry'
import Col from '../../components/spacing/Col'
import { Text, ScrollView } from '../../components/Themed'
import H2 from '../../components/text/H2'
import { PongoStackParamList } from '../../types/Navigation'
import { MaterialIcons } from '@expo/vector-icons'
import { light_gray, uq_darkpink, uq_pink, uq_purple } from '../../constants/Colors'
import Button from '../../components/form/Button'
import { isLargeDevice, isWeb, window } from '../../constants/Layout'
import JoinChatModal from '../../components/pongo/Chats/JoinChatModal'
import MessageSearchResults from '../../components/pongo/MessageSearchResults'
import H3 from '../../components/text/H3'
import Row from '../../components/spacing/Row'

interface ChatsScreenProps {
}

export default function ChatsScreen({  }: ChatsScreenProps) {
  const { chats, showJoinChatModal, set, init, refresh, sortedChats, isSearching } = usePongoStore()
  const { api, shipUrl } = useStore()
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()
  const appState = useRef(AppState.currentState)

  const onRefresh = useCallback(async () => {
    try {
      if (api) {
        await init(api, false)
      }
    } catch {}
  }, [api])

  useEffect(() => {
    if (!isWeb) {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === "active") {
          refresh(shipUrl)
        }
        appState.current = nextAppState
      }
      const appStateListener = AppState.addEventListener("change", handleAppStateChange)
      return appStateListener.remove
    }
  }, [shipUrl])

  useEffect(() => {
    if (!isWeb) {
      const totalUnreads = Object.values(chats).reduce((total, { unreads }) => total + unreads, 0)
      setBadgeCountAsync(totalUnreads).catch(console.warn)
      getPresentedNotificationsAsync()
        .then((notifications: Notification[]) => {
          notifications.forEach(n => {``
            const convo = n.request?.content?.data?.conversation_id as any
            const msgId = n.request?.content?.data?.message_id as any
            if (convo && msgId && chats[convo] && Number(chats[convo].conversation.last_read || 0) > Number(msgId)) {
              dismissNotificationAsync(n.request.identifier)
            }
          })
        })
    }
  }, [chats])

  const startNew = useCallback(() => {
    navigation.navigate('NewChat')
  }, [navigation])

  const { width } = window

  const styles = useMemo(() => StyleSheet.create({
    container: {
      height: '100%',
      width: isLargeDevice ? width / 3 : '100%',
      maxWidth: isLargeDevice ? 300 : undefined,
      borderRightWidth: 1,
      borderColor: light_gray
    },
    floatButton: {
      width: 54,
      height: 54,
      borderRadius: 30,
      backgroundColor: uq_pink,
      position: 'absolute',
      padding: 11,
      right: 24,
      elevation: 1,
      shadowColor: uq_darkpink,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.7,
      shadowRadius: 1,
    },
    chatsHeader: {
      backgroundColor: uq_purple,
      width: width / 3,
      maxWidth: 300,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomColor: 'rgb(216,216,216)',
      borderBottomWidth: 1
    }
  }), [])

  return (
    <Col style={styles.container}>
      {isLargeDevice && (
        <Row style={styles.chatsHeader}>
          <H3 text='Chats' style={{ color: 'white' }} />
        </Row>
      )}
      {isSearching ? (
        <MessageSearchResults />
      ) : !sortedChats.length ? (
        <Col style={{ alignSelf: 'center', alignItems: 'center', marginTop: 32 }}>
          <H2 text='No Chats' />
          <Text style={{ margin: 16, fontSize: 18, textAlign: 'center' }}>Start a chat here or with the button in the bottom right:</Text>
          <Button title='New Chat' onPress={startNew} />
        </Col>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />} keyboardShouldPersistTaps='handled'>
          {sortedChats.map(chat => <ChatsEntry key={chat.conversation.id} chat={chat} navigation={navigation} />)}
        </ScrollView>
      )}

      <Pressable onPress={() => navigation.navigate('Contacts')} style={[styles.floatButton, { bottom: 120 }]}>
        <MaterialIcons name='group' color='white' size={32} />
      </Pressable>
      <Pressable onPress={() => navigation.navigate('NewChat')} style={[styles.floatButton, { bottom: 40 }]}>
        <MaterialIcons name='edit' color='white' size={32} />
      </Pressable>

      <JoinChatModal show={showJoinChatModal} hide={() => set({ showJoinChatModal: false })} />
    </Col>
  )
}
