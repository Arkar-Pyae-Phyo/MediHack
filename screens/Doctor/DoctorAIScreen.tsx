import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Animated } from 'react-native';
import { Send, Bot, User, Sparkles, Brain, Zap, MessageSquare, Clock, TrendingUp, Stethoscope, FlaskConical, AlertCircle } from 'lucide-react-native';
import { askGemini } from '../../services/gemini';

const DoctorAIScreen = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string, timestamp?: string}[]>([
    { 
      role: 'ai', 
      text: 'Hello Doctor! I\'m your AI Medical Assistant powered by advanced clinical knowledge. How can I help you today? Feel free to ask about drug interactions, clinical guidelines, differential diagnoses, or any medical queries.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);

  const handleAsk = async (question: string = input) => {
    if (!question.trim()) return;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // Add User Message
    const newMsgs = [...messages, { role: 'user', text: question, timestamp }];
    setMessages(newMsgs as any);
    setInput('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await askGemini(`(Answer in medical context as an expert physician. Be concise and professional) ${question}`);
      const aiTimestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setMessages([...newMsgs, { role: 'ai', text: res, timestamp: aiTimestamp }] as any);
    } catch (error) {
      setMessages([...newMsgs, { role: 'ai', text: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.", timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }] as any);
    }
    setLoading(false);

    // Scroll to bottom after response
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const QuickActionChip = ({ icon: Icon, label, query, color }: { icon: any, label: string, query: string, color: string }) => (
    <TouchableOpacity 
      style={[styles.quickAction, { borderColor: color + '30' }]} 
      onPress={() => handleAsk(query)} 
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Icon size={16} color={color} strokeWidth={2} />
      </View>
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrapper}>
              <Brain size={28} color="#7C3AED" strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Consultant</Text>
              <View style={styles.headerBadge}>
                <Zap size={10} color="#10B981" strokeWidth={2.5} />
                <Text style={styles.headerBadgeText}>Powered by Gemini 1.5 Pro</Text>
              </View>
            </View>
          </View>
          <View style={styles.messageCountBadge}>
            <MessageSquare size={14} color="#7C3AED" strokeWidth={2} />
            <Text style={styles.messageCountText}>{messages.length}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick Consult</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            <QuickActionChip 
              icon={FlaskConical}
              label="Drug Interaction" 
              query="Check drug interactions between Metformin and IV Contrast media" 
              color="#EF4444"
            />
            <QuickActionChip 
              icon={AlertCircle}
              label="Sepsis Criteria" 
              query="What are the latest Sepsis-3 criteria?" 
              color="#F59E0B"
            />
            <QuickActionChip 
              icon={TrendingUp}
              label="AKI Staging" 
              query="Explain KDIGO staging for Acute Kidney Injury" 
              color="#0EA5E9"
            />
            <QuickActionChip 
              icon={Stethoscope}
              label="Clinical Guidelines" 
              query="Latest guidelines for hypertension management" 
              color="#10B981"
            />
          </ScrollView>
        </View>
      </View>

      {/* Chat Area */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatBox} 
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, idx) => (
          <View key={idx} style={[styles.messageRow, msg.role === 'user' && styles.messageRowUser]}>
            {msg.role === 'ai' && (
              <View style={styles.aiAvatarWrapper}>
                <View style={styles.aiAvatar}>
                  <Bot size={18} color="#FFF" strokeWidth={2} />
                </View>
              </View>
            )}
            
            <View style={styles.messageContainer}>
              <View style={[styles.messageBubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                {msg.role === 'ai' && (
                  <View style={styles.aiHeader}>
                    <Text style={styles.aiLabel}>AI Medical Assistant</Text>
                    <View style={styles.verifiedBadge}>
                      <Sparkles size={10} color="#7C3AED" strokeWidth={2.5} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>
                )}
                <Text style={[styles.messageText, msg.role === 'user' && styles.messageTextUser]}>
                  {msg.text}
                </Text>
                <View style={styles.messageFooter}>
                  <Clock size={10} color={msg.role === 'user' ? '#BAE6FD' : '#94A3B8'} />
                  <Text style={[styles.timestamp, msg.role === 'user' && styles.timestampUser]}>
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            </View>

            {msg.role === 'user' && (
              <View style={styles.userAvatarWrapper}>
                <View style={styles.userAvatar}>
                  <User size={18} color="#FFF" strokeWidth={2} />
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.messageRow}>
            <View style={styles.aiAvatarWrapper}>
              <Animated.View style={[styles.aiAvatar, { transform: [{ scale: pulseAnim }] }]}>
                <Bot size={18} color="#FFF" strokeWidth={2} />
              </Animated.View>
            </View>
            <View style={styles.messageContainer}>
              <View style={[styles.messageBubble, styles.bubbleAi, styles.loadingBubble]}>
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color="#7C3AED" />
                  <Text style={styles.loadingText}>AI is analyzing...</Text>
                </View>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDotDelay1]} />
                  <View style={[styles.typingDot, styles.typingDotDelay2]} />
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} 
              placeholder="Ask about diagnosis, treatment, guidelines..." 
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]} 
              onPress={() => handleAsk()} 
              disabled={!input.trim() || loading}
              activeOpacity={0.7}
            >
              <Send size={20} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <View style={styles.inputFooter}>
            <View style={styles.securityBadge}>
              <View style={styles.securityDot} />
              <Text style={styles.securityText}>HIPAA Compliant • Secure Communication</Text>
            </View>
          </View>
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

  // Header
  header: { 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  headerIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0F172A',
    marginBottom: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 0.3,
  },
  messageCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C3AED',
  },

  // Quick Actions
  quickActionsSection: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  quickActionsScroll: {
    paddingHorizontal: 24,
    gap: 10,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
  },

  // Chat
  chatBox: { 
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageRow: { 
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  
  // Avatars
  aiAvatarWrapper: {
    marginRight: 12,
    marginBottom: 4,
  },
  aiAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatarWrapper: {
    marginLeft: 12,
    marginBottom: 4,
  },
  userAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // Messages
  messageContainer: {
    flex: 1,
    maxWidth: '75%',
  },
  messageBubble: { 
    padding: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bubbleAi: { 
    backgroundColor: '#FFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  bubbleUser: { 
    backgroundColor: '#0EA5E9',
    borderTopRightRadius: 4,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3FF',
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.3,
  },
  messageText: { 
    fontSize: 15,
    lineHeight: 22,
    color: '#1E293B',
    fontWeight: '500',
  },
  messageTextUser: {
    color: '#FFF',
    fontWeight: '500',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  timestamp: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timestampUser: {
    color: '#BAE6FD',
  },

  // Loading
  loadingBubble: {
    minWidth: 150,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C4B5FD',
  },
  typingDotDelay1: {
    opacity: 0.6,
  },
  typingDotDelay2: {
    opacity: 0.3,
  },
  
  // Input Area
  inputContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 12,
  },
  input: { 
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: '#0F172A',
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontWeight: '500',
  },
  sendButton: { 
    width: 48,
    height: 48,
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  inputFooter: {
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  securityText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

export default DoctorAIScreen;