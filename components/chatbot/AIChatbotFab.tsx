import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { sendChatMessage, type ChatMessage } from '@/lib/chatbotApi';

type UiMessage = { id: string; role: 'user' | 'assistant'; content: string };

const FAB_SIZE = 56;
const CARD_WIDTH = 360;
const CARD_HEIGHT = 460;
const EDGE = 8;
const HISTORY_KEY_PREFIX = '@nongxanh:ai-chat:';
const INITIAL_MESSAGE: UiMessage = {
  id: 'init',
  role: 'assistant',
  content:
    'Xin chào! Tôi tư vấn rau củ, dinh dưỡng và sản phẩm đang giảm giá tại NongXanh.',
};

export function AIChatbotFab() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { width, height } = Dimensions.get('window');

  const [open, setOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([INITIAL_MESSAGE]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const maxX = Math.max(0, width - FAB_SIZE);
  const maxY = Math.max(insets.top + 8, height - insets.bottom - FAB_SIZE - 12);
  const pan = useRef(new Animated.ValueXY({ x: maxX - 8, y: maxY })).current;
  const fabPosRef = useRef({ x: maxX - 8, y: maxY });
  const movedRef = useRef(false);
  const [anchor, setAnchor] = useState({ x: EDGE, y: height - CARD_HEIGHT - insets.bottom - 90 });

  const cardOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (!user?.id) {
      setMessages([INITIAL_MESSAGE]);
      return;
    }
    const key = `${HISTORY_KEY_PREFIX}${user.id}`;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as UiMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const key = `${HISTORY_KEY_PREFIX}${user.id}`;
    AsyncStorage.setItem(key, JSON.stringify(messages)).catch(() => {});
  }, [messages, user?.id]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const calcAnchorFromFab = () => {
    const fw = CARD_WIDTH > width - 2 * EDGE ? width - 2 * EDGE : CARD_WIDTH;
    const fh = CARD_HEIGHT;
    const fab = fabPosRef.current;
    const rightSpace = width - (fab.x + FAB_SIZE + EDGE);
    const leftSpace = fab.x - EDGE;
    const placeRight = rightSpace >= fw || rightSpace >= leftSpace;
    const x = placeRight ? fab.x + FAB_SIZE + 10 : fab.x - fw - 10;

    const bottomLimit = height - keyboardHeight - insets.bottom - EDGE - fh;
    const preferTop = fab.y - fh - 10;
    const preferBottom = fab.y + FAB_SIZE + 10;
    const y = preferTop >= insets.top + EDGE ? preferTop : preferBottom;

    return {
      x: Math.max(EDGE, Math.min(width - fw - EDGE, x)),
      y: Math.max(insets.top + EDGE, Math.min(bottomLimit, y)),
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        movedRef.current = false;
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3) movedRef.current = true;
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        const nextX = Math.min(maxX, Math.max(0, (pan.x as any)._value));
        const nextY = Math.min(maxY, Math.max(insets.top + 8, (pan.y as any)._value));
        Animated.spring(pan, {
          toValue: { x: nextX, y: nextY },
          useNativeDriver: false,
          bounciness: 8,
        }).start();
        fabPosRef.current = { x: nextX, y: nextY };
        if (!movedRef.current && Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) {
          cardOffset.setValue({ x: 0, y: 0 });
          setAnchor(calcAnchorFromFab());
          setOpen(true);
        }
      },
    })
  ).current;

  const cardPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        cardOffset.setOffset({
          x: (cardOffset.x as any)._value,
          y: (cardOffset.y as any)._value,
        });
        cardOffset.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        cardOffset.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: () => {
        cardOffset.flattenOffset();
        const current = {
          x: (cardOffset.x as any)._value,
          y: (cardOffset.y as any)._value,
        };
        const fw = CARD_WIDTH > width - 2 * EDGE ? width - 2 * EDGE : CARD_WIDTH;
        const minX = EDGE - anchor.x;
        const maxXBound = width - fw - EDGE - anchor.x;
        const minY = insets.top + EDGE - anchor.y;
        const maxYBound = height - keyboardHeight - insets.bottom - EDGE - CARD_HEIGHT - anchor.y;
        const nx = Math.max(minX, Math.min(maxXBound, current.x));
        const ny = Math.max(minY, Math.min(maxYBound, current.y));
        Animated.spring(cardOffset, {
          toValue: { x: nx, y: ny },
          useNativeDriver: false,
          bounciness: 8,
        }).start();
      },
    })
  ).current;

  const handleSend = async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput('');
    const next = [...messages, { id: `${Date.now()}-u`, role: 'user' as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const apiMessages: ChatMessage[] = next.map((m) => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(apiMessages);
      setMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: 'assistant', content: res }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-e`, role: 'assistant', content: e instanceof Error ? e.message : 'Lỗi AI.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.fabWrap,
          {
            width: FAB_SIZE,
            height: FAB_SIZE,
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}>
        {/* Chỉ mở qua PanResponder khi thả tay (tap nhẹ); tránh trùng với onPress gây double-open */}
        <View style={[styles.fab, { backgroundColor: theme.primary }]}>
          <MaterialIcons name="smart-toy" size={26} color="#fff" />
        </View>
      </Animated.View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 36 : 28}
            style={styles.keyboardWrap}>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.background,
                  width: CARD_WIDTH > width - 2 * EDGE ? width - 2 * EDGE : CARD_WIDTH,
                  left: anchor.x,
                  top: anchor.y,
                  transform: [{ translateX: cardOffset.x }, { translateY: cardOffset.y }],
                },
              ]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Trợ lý AI NongXanh</Text>
                <TouchableOpacity onPress={() => setOpen(false)} activeOpacity={0.8}>
                  <MaterialIcons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>
              <View {...cardPanResponder.panHandlers} style={styles.dragHandleWrap}>
                <View style={styles.dragHandle} />
              </View>

              {messages.length <= 1 ? (
                <View style={styles.chipsWrap}>
                  {[
                    'Rau củ đang giảm giá',
                    'Tôi thiếu vitamin C nên ăn gì?',
                    'Tôi thiếu sắt nên mua rau gì?',
                    'Gợi ý rau giàu chất xơ',
                  ].map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      style={[styles.chip, { borderColor: theme.primary }]}
                      onPress={() => setInput(chip)}
                      activeOpacity={0.8}>
                      <Text style={[styles.chipText, { color: theme.primary }]}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <FlatList
                data={messages}
                keyExtractor={(i) => i.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.bubble,
                      item.role === 'user'
                        ? [styles.userBubble, { backgroundColor: theme.primary }]
                        : [styles.aiBubble, { backgroundColor: theme.background }],
                    ]}>
                    <Text style={[styles.bubbleText, { color: item.role === 'user' ? '#fff' : theme.text }]}>
                      {item.content}
                    </Text>
                  </View>
                )}
              />

              <View style={[styles.inputWrap, { borderColor: theme.border }]}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Nhập câu hỏi..."
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, { color: theme.text }]}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!canSend}
                  style={[styles.sendBtn, { backgroundColor: canSend ? theme.primary : '#9ca3af' }]}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  keyboardWrap: { flex: 1, width: '100%' },
  modalCard: {
    position: 'absolute',
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 16, fontWeight: '700' },
  dragHandleWrap: { alignItems: 'center', paddingVertical: 6 },
  dragHandle: { width: 44, height: 5, borderRadius: 99, backgroundColor: '#d1d5db' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '500' },
  list: { padding: 12, gap: 8 },
  bubble: { maxWidth: '86%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  userBubble: { alignSelf: 'flex-end' },
  aiBubble: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#e5e7eb' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  inputWrap: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, minHeight: 40, maxHeight: 110, fontSize: 14, paddingVertical: 8 },
  sendBtn: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
