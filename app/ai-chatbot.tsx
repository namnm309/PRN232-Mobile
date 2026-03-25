import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { sendChatMessage, type ChatMessage } from '@/lib/chatbotApi';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function AiChatbotScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: 'hello',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI NongXanh. Bạn cần tư vấn sản phẩm nào?',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const handleSend = async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput('');

    const userMsg: UiMessage = {
      id: Date.now().toString(36),
      role: 'user',
      content: text,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const apiMessages: ChatMessage[] = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await sendChatMessage(apiMessages);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now().toString(36)}-ai`,
          role: 'assistant',
          content: reply,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now().toString(36)}-err`,
          role: 'assistant',
          content: e instanceof Error ? e.message : 'Không thể kết nối trợ lý AI.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Trợ lý AI"
        subtitle="Tư vấn theo dữ liệu sản phẩm"
        left={
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
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

        <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: theme.background }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhập câu hỏi..."
            placeholderTextColor="#9ca3af"
            style={[styles.input, { color: theme.text }]}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.85}
            style={[styles.sendBtn, { backgroundColor: canSend ? theme.primary : '#9ca3af' }]}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 4 },
  container: { flex: 1 },
  list: { padding: 16, gap: 10 },
  bubble: {
    maxWidth: '86%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userBubble: { alignSelf: 'flex-end' },
  aiBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    fontSize: 14,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
