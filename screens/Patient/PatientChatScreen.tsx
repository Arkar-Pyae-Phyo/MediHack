import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Animated
} from 'react-native';
import { Send, Sparkles, Bot, Check, CheckCheck, Clock, Mic } from 'lucide-react-native'; 
import { askGemini } from '../../services/gemini';

// Typing Indicator Component
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const dotStyle = (animatedValue) => ({
    opacity: animatedValue,
    transform: [{
      translateY: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -6],
      }),
    }],
  });

  return (
    <View style={styles.typingContainer}>
      <View style={styles.miniIcon}>
        <Bot size={14} color="#64748B" />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
          <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
          <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
};

const PatientChatScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: "สวัสดีครับคุณ Avery! 👋 ผมคือผู้ช่วย CareMind พร้อมดูแลคุณตลอด 24 ชั่วโมง มีอะไรให้ผมช่วยในวันนี้ไหมครับ?",
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const quickReplies = [
    { id: 1, text: "ยาที่ต้องทานวันนี้", icon: "💊" },
    { id: 2, text: "อาการปวดหลัง", icon: "🤕" },
    { id: 3, text: "นัดพบแพทย์", icon: "📅" },
    { id: 4, text: "อาหารที่แนะนำ", icon: "🥗" },
  ];

  const sendMessage = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const timestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: trimmed,
      timestamp,
      status: 'sent'
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await askGemini(`ตอบคำถามคนไข้แบบเป็นกันเองและเข้าใจง่าย ใช้ emoji ประกอบเล็กน้อย: ${trimmed}`);
      
      // Update user message status to read
      setMessages(prev => prev.map(msg => 
        msg.id === userMsg.id ? { ...msg, status: 'read' } : msg
      ));

      // Add AI response
      setMessages(prev => [...prev, { 
        id: (Date.now()+1).toString(), 
        role: 'assistant', 
        text: res,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      }]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      setMessages(prev => [...prev, { 
        id: 'err', 
        role: 'assistant', 
        text: 'ขออภัยครับ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะครับ 🙏',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleQuickReply = (text) => {
    setInput(text);
    sendMessage(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botIconLarge}>
              <Sparkles size={24} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>CareMind AI</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerStatus}>ออนไลน์ • พร้อมช่วยเหลือ</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.chatArea}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Date Divider */}
          <View style={styles.dateDivider}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>วันนี้</Text>
            <View style={styles.dateLine} />
          </View>

          {/* Messages */}
          {messages.map((msg, index) => (
            <View key={msg.id}>
              <View style={[
                styles.msgRow, 
                msg.role === 'user' ? styles.userRow : styles.asstRow
              ]}>
                {msg.role === 'assistant' && (
                  <View style={styles.miniIcon}>
                    <Bot size={14} color="#2563EB" />
                  </View>
                )}
                
                <View style={styles.messageContainer}>
                  <View style={[
                    styles.bubble, 
                    msg.role === 'user' ? styles.userBubble : styles.asstBubble
                  ]}>
                    <Text style={[
                      styles.msgText, 
                      msg.role === 'user' ? styles.userText : styles.asText
                    ]}>
                      {msg.text}
                    </Text>
                  </View>
                  
                  {/* Timestamp & Status */}
                  <View style={[
                    styles.metaRow,
                    msg.role === 'user' ? styles.metaRowRight : styles.metaRowLeft
                  ]}>
                    <Text style={styles.timestamp}>{msg.timestamp}</Text>
                    {msg.role === 'user' && msg.status && (
                      <View style={styles.statusIcon}>
                        {msg.status === 'sent' && <Check size={12} color="#94A3B8" />}
                        {msg.status === 'read' && <CheckCheck size={12} color="#2563EB" />}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Typing Indicator */}
          {loading && <TypingIndicator />}

          {/* Quick Replies - Show when not loading and last message is from assistant */}
          {!loading && messages[messages.length - 1]?.role === 'assistant' && messages.length < 4 && (
            <View style={styles.quickRepliesContainer}>
              <Text style={styles.quickRepliesTitle}>คำถามที่ถามบ่อย:</Text>
              <View style={styles.quickReplies}>
                {quickReplies.map((reply) => (
                  <TouchableOpacity
                    key={reply.id}
                    style={styles.quickReplyButton}
                    onPress={() => handleQuickReply(reply.text)}
                  >
                    <Text style={styles.quickReplyIcon}>{reply.icon}</Text>
                    <Text style={styles.quickReplyText}>{reply.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Enhanced Input Box */}
        <View style={styles.inputContainer}>
          <View style={styles.inputBox}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="พิมพ์ข้อความของคุณ..."
                placeholderTextColor="#94A3B8"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
              />
              
              {/* Voice Button - Optional */}
              {!input && (
                <TouchableOpacity style={styles.voiceBtn}>
                  <Mic size={20} color="#64748B" />
                </TouchableOpacity>
              )}
              
              {/* Send Button */}
              <TouchableOpacity 
                onPress={() => sendMessage()} 
                style={[
                  styles.sendBtn,
                  !input.trim() && styles.sendBtnDisabled
                ]} 
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Send size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Character count */}
            {input.length > 400 && (
              <Text style={styles.charCount}>{input.length}/500</Text>
            )}
          </View>

          {/* Help Text */}
          <Text style={styles.helpText}>
            <Sparkles size={12} color="#94A3B8" /> CareMind ให้คำแนะนำเบื้องต้นเท่านั้น ไม่ทดแทนการปรึกษาแพทย์
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },

  // Header Styles
  headerContainer: {
    position: 'relative',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#EFF6FF',
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  botIconLarge: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: '#2563EB', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerTitle: { 
    fontSize: 19, 
    fontWeight: '800', 
    color: '#0F172A',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerStatus: { 
    fontSize: 13, 
    color: '#64748B', 
    fontWeight: '600',
  },

  // Chat Area
  chatArea: { 
    padding: 20,
    paddingBottom: 10,
  },

  // Date Divider
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Message Rows
  msgRow: { 
    flexDirection: 'row', 
    marginBottom: 16, 
    alignItems: 'flex-end', 
    gap: 10,
  },
  userRow: { 
    justifyContent: 'flex-end' 
  },
  asstRow: { 
    justifyContent: 'flex-start' 
  },

  // Avatar Icons
  miniIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#EFF6FF', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },

  // Message Container
  messageContainer: {
    maxWidth: '75%',
  },

  // Bubbles
  bubble: { 
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userBubble: { 
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 6,
  },
  asstBubble: { 
    backgroundColor: '#FFF', 
    borderBottomLeftRadius: 6,
    borderWidth: 1, 
    borderColor: '#E2E8F0',
  },

  // Message Text
  msgText: { 
    fontSize: 15, 
    lineHeight: 22,
    fontWeight: '500',
  },
  userText: { 
    color: '#FFF' 
  },
  asText: { 
    color: '#1E293B' 
  },

  // Meta Info (timestamp + status)
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  metaRowRight: {
    justifyContent: 'flex-end',
  },
  metaRowLeft: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statusIcon: {
    marginLeft: 2,
  },

  // Typing Indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    padding: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },

  // Quick Replies
  quickRepliesContainer: {
    marginTop: 8,
    marginBottom: 10,
    marginLeft: 42,
  },
  quickRepliesTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 10,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  quickReplyIcon: {
    fontSize: 16,
  },
  quickReplyText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  // Input Container
  inputContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputBox: { 
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 24,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: { 
    flex: 1, 
    fontSize: 15,
    color: '#1E293B',
    maxHeight: 100,
    paddingVertical: 8,
    fontWeight: '500',
  },
  voiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  sendBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#2563EB', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 6,
    marginRight: 4,
  },
  helpText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});

export default PatientChatScreen;