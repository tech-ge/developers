<template>
  <div class="chat-page">
    <div class="chat-container">
      <!-- Chat Header -->
      <div class="chat-header">
        <h2>💬 TechG Chat Room</h2>
        <div class="room-info">
          <span>Room: {{ currentRoom }}</span>
          <span class="connection-status" :class="{ connected: isConnected }">
            {{ isConnected ? '🟢 Online' : '🔴 Offline' }}
          </span>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="loading" class="loading">Loading messages...</div>
        
        <div v-else-if="messages.length === 0" class="no-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>

        <div v-else class="messages-list">
          <div 
            v-for="message in messages" 
            :key="message._id"
            class="message-item"
            :class="{ 'own-message': isOwnMessage(message) }"
          >
            <!-- Deleted Message -->
            <div v-if="message.isDeleted" class="deleted-message">
              <span>🗑️ This message was deleted</span>
            </div>

            <!-- Active Message -->
            <div v-else class="message-content">
              <!-- Message Header -->
              <div class="message-header">
                <span class="sender-name">{{ getDisplayName(message.sender) }}</span>
                <span class="message-time">
                  {{ formatTime(message.createdAt) }}
                  <span v-if="message.isEdited" class="edited-badge">(edited)</span>
                </span>
              </div>

              <!-- Message Body -->
              <div class="message-body">
                <!-- Text Message -->
                <div v-if="message.messageType === 'text'" class="text-message">
                  {{ message.content }}
                </div>

                <!-- File Message -->
                <div v-else class="file-message">
                  <div v-if="message.messageType === 'image'" class="image-message">
                    <div class="image-container">
                      <img 
                        :src="getFileUrl(message.fileUrl)" 
                        :alt="message.fileName"
                        class="file-preview image-preview"
                        @load="onImageLoad"
                        @error="onImageError"
                      >
                    </div>
                  </div>

                  <div v-else-if="message.messageType === 'video'" class="video-message">
                    <video 
                      controls 
                      class="file-preview video-preview"
                      :src="getFileUrl(message.fileUrl)"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <div v-else-if="message.messageType === 'audio'" class="audio-message">
                    <audio 
                      controls 
                      class="audio-player"
                      :src="getFileUrl(message.fileUrl)"
                    >
                      Your browser does not support the audio tag.
                    </audio>
                  </div>

                  <div v-else class="generic-file">
                    <div class="file-icon">📎</div>
                    <div class="file-info">
                      <span class="file-name">{{ message.fileName }}</span>
                      <span class="file-size">{{ formatFileSize(message.fileSize) }}</span>
                    </div>
                    <a 
                      :href="getFileUrl(message.fileUrl)" 
                      download
                      class="download-btn"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>

              <!-- Message Actions -->
              <div class="message-actions" v-if="!message.isDeleted">
                <!-- Reactions -->
                <div class="reactions">
                  <div 
                    v-for="reaction in message.reactions" 
                    :key="reaction._id"
                    class="reaction"
                    :title="reaction.user.name"
                  >
                    {{ reaction.emoji }}
                  </div>
                  <button 
                    @click="toggleReactionPicker(message._id)"
                    class="react-btn"
                  >
                    😊
                  </button>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons">
                  <!-- Edit (own messages only) -->
                  <button 
                    v-if="isOwnMessage(message)"
                    @click="startEditMessage(message)"
                    class="action-btn"
                    title="Edit"
                  >
                    ✏️
                  </button>

                  <!-- Delete (own messages or admin) -->
                  <button 
                    v-if="isOwnMessage(message) || userRole === 'admin'"
                    @click="deleteMessage(message._id)"
                    class="action-btn"
                    title="Delete"
                  >
                    🗑️
                  </button>

                  <!-- Report (not own messages) -->
                  <button 
                    v-if="!isOwnMessage(message)"
                    @click="reportMessage(message._id)"
                    class="action-btn"
                    title="Report"
                  >
                    ⚠️
                  </button>
                </div>
              </div>

              <!-- Reaction Picker -->
              <div v-if="showReactionPicker === message._id" class="reaction-picker">
                <button 
                  v-for="emoji in commonEmojis" 
                  :key="emoji"
                  @click="addReaction(message._id, emoji)"
                  class="emoji-btn"
                >
                  {{ emoji }}
                </button>
              </div>

              <!-- Edit Message Form -->
              <div v-if="editingMessageId === message._id" class="edit-message-form">
                <textarea 
                  v-model="editContent"
                  @keypress.enter="saveEdit(message._id)"
                  class="edit-textarea"
                ></textarea>
                <div class="edit-actions">
                  <button @click="saveEdit(message._id)" class="btn btn-primary">Save</button>
                  <button @click="cancelEdit" class="btn btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="typingUsers.length > 0" class="typing-indicator">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="typing-text">
            {{ typingUsers.length === 1 ? 'is typing' : 'are typing' }}...
          </span>
        </div>
      </div>

      <!-- Message Input Area -->
      <div class="message-input-area">
        <!-- File Upload & Recording -->
        <div class="media-controls">
          <!-- File Upload -->
          <div class="file-upload-section">
            <input 
              type="file" 
              ref="fileInput"
              @change="handleFileUpload"
              accept="image/*,video/*"
              style="display: none"
            >
            <button @click="triggerFileInput" class="media-btn" title="Upload file">
              📎
            </button>
          </div>

          <!-- Audio Recording -->
          <div class="audio-recording-section">
            <button 
              @click="toggleRecording" 
              class="media-btn"
              :class="{ recording: isRecording }"
              title="Record audio"
            >
              {{ isRecording ? '⏹️' : '🎤' }}
            </button>
            <div v-if="isRecording" class="recording-info">
              <span class="recording-dot"></span>
              <span class="recording-time">{{ formatRecordingTime(recordingTime) }}</span>
              <button @click="stopRecording" class="stop-btn">Stop</button>
            </div>
          </div>
        </div>

        <!-- Upload Progress -->
        <div class="upload-progress" v-if="uploadingFile">
          <span>Uploading... {{ uploadProgress }}%</span>
        </div>

        <!-- Text Input -->
        <div class="text-input-section">
          <textarea 
            v-model="newMessage"
            @keypress.enter.prevent="sendMessage"
            @input="handleTyping"
            @focus="startTyping"
            @blur="stopTyping"
            placeholder="Type your message..."
            class="message-textarea"
          ></textarea>
          <button 
            @click="sendMessage" 
            :disabled="!newMessage.trim() && !isRecording"
            class="send-btn"
          >
            📤
          </button>
        </div>
      </div>
    </div>

    <!-- Report Modal -->
    <div v-if="showReportModal" class="modal-overlay">
      <div class="modal">
        <h3>Report Message</h3>
        <textarea 
          v-model="reportReason"
          placeholder="Why are you reporting this message?"
          class="report-textarea"
        ></textarea>
        <div class="modal-actions">
          <button @click="submitReport" class="btn btn-primary">Submit Report</button>
          <button @click="showReportModal = false" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import api from '../utils/api'

export default {
  name: 'Chat',
  setup() {
    const chatStore = useChatStore()
    const messagesContainer = ref(null)
    const fileInput = ref(null)
    
    const newMessage = ref('')
    const loading = ref(false)
    const showReactionPicker = ref(null)
    const editingMessageId = ref(null)
    const editContent = ref('')
    const showReportModal = ref(false)
    const reportReason = ref('')
    const reportingMessageId = ref(null)
    const uploadingFile = ref(false)
    const uploadProgress = ref(0)
    
    // Audio recording states
    const isRecording = ref(false)
    const mediaRecorder = ref(null)
    const audioChunks = ref([])
    const recordingTime = ref(0)
    const recordingTimer = ref(null)
    
    // Typing states
    const typingTimeout = ref(null)
    const isTyping = ref(false)

    const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏']

    const currentRoom = computed(() => chatStore.currentRoom)
    const isConnected = computed(() => chatStore.isConnected)
    const messages = computed(() => chatStore.messages)
    const typingUsers = computed(() => chatStore.typingUsers)

    const userRole = computed(() => {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).role : 'user'
    })

    const userId = computed(() => {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).id : null
    })

    const userName = computed(() => {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).name : 'User'
    })

    const isOwnMessage = (message) => {
      return message.sender?._id === userId.value
    }

    const getDisplayName = (sender) => {
      if (!sender) return 'Unknown'
      // Show "Admin" for admin users
      if (sender.role === 'admin') return 'Admin'
      return sender.name
    }

    const getFileUrl = (fileUrl) => {
      if (!fileUrl) return ''
      if (fileUrl.startsWith('http')) return fileUrl
      return `http://localhost:5000${fileUrl}`
    }

    const onImageLoad = (event) => {
      // Image loaded successfully
      console.log('Image loaded successfully')
    }

    const onImageError = (event) => {
      // Image failed to load
      console.error('Image failed to load:', event.target.src)
      event.target.style.display = 'none'
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }

    const loadMessages = async () => {
      loading.value = true
      try {
        const response = await api.get(`/chat/messages/${currentRoom.value}`)
        chatStore.messages = response.data
        scrollToBottom()
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        loading.value = false
      }
    }

    const handleTyping = () => {
      if (!isTyping.value) {
        isTyping.value = true
        chatStore.startTyping(userName.value)
      }

      // Clear existing timeout
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
      }

      // Set new timeout to stop typing after 1 second of inactivity
      typingTimeout.value = setTimeout(() => {
        isTyping.value = false
        chatStore.stopTyping(userName.value)
      }, 1000)
    }

    const startTyping = () => {
      if (!isTyping.value) {
        isTyping.value = true
        chatStore.startTyping(userName.value)
      }
    }

    const stopTyping = () => {
      if (isTyping.value) {
        isTyping.value = false
        chatStore.stopTyping(userName.value)
      }
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
      }
    }

    const sendMessage = async () => {
      if (!newMessage.value.trim() && !isRecording.value) return

      // Stop typing when sending message
      stopTyping()

      try {
        const response = await api.post('/chat/messages', {
          content: newMessage.value,
          room: currentRoom.value
        })
        
        chatStore.sendMessage(response.data)
        newMessage.value = ''
        scrollToBottom()
      } catch (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message')
      }
    }

    const triggerFileInput = () => {
      fileInput.value.click()
    }

    const handleFileUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      // Check file size and type
      if (file.type.startsWith('video/') && file.size > 10 * 1024 * 1024) {
        alert('Video size must be less than 10MB')
        return
      }

      uploadingFile.value = true
      uploadProgress.value = 0

      const formData = new FormData()
      formData.append('file', file)
      formData.append('room', currentRoom.value)

      try {
        const response = await api.post('/chat/messages/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              uploadProgress.value = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
            }
          }
        })

        chatStore.sendMessage(response.data)
        scrollToBottom()
      } catch (error) {
        console.error('Error uploading file:', error)
        alert(error.response?.data?.message || 'Failed to upload file')
      } finally {
        uploadingFile.value = false
        uploadProgress.value = 0
        event.target.value = '' // Reset file input
      }
    }

    // Audio Recording Functions
    const toggleRecording = async () => {
      if (isRecording.value) {
        stopRecording()
      } else {
        startRecording()
      }
    }

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioChunks.value = []
        recordingTime.value = 0
        
        mediaRecorder.value = new MediaRecorder(stream)
        
        mediaRecorder.value.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.value.push(event.data)
          }
        }
        
        mediaRecorder.value.onstop = sendAudioRecording
        
        mediaRecorder.value.start()
        isRecording.value = true
        
        // Start recording timer
        recordingTimer.value = setInterval(() => {
          recordingTime.value++
        }, 1000)
        
      } catch (error) {
        console.error('Error starting recording:', error)
        alert('Could not access microphone. Please check permissions.')
      }
    }

    const stopRecording = () => {
      if (mediaRecorder.value && isRecording.value) {
        mediaRecorder.value.stop()
        mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
        isRecording.value = false
        clearInterval(recordingTimer.value)
      }
    }

    const sendAudioRecording = async () => {
      if (audioChunks.value.length === 0) return

      const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' })
      
      // Check file size (2MB max)
      if (audioBlob.size > 2 * 1024 * 1024) {
        alert('Recording is too long. Please keep it under 2MB.')
        return
      }

      uploadingFile.value = true
      uploadProgress.value = 50

      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('room', currentRoom.value)

      try {
        const response = await api.post('/chat/messages/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        chatStore.sendMessage(response.data)
        scrollToBottom()
      } catch (error) {
        console.error('Error uploading audio:', error)
        alert(error.response?.data?.message || 'Failed to upload recording')
      } finally {
        uploadingFile.value = false
        uploadProgress.value = 0
        audioChunks.value = []
        recordingTime.value = 0
      }
    }

    const formatRecordingTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const startEditMessage = (message) => {
      editingMessageId.value = message._id
      editContent.value = message.content
    }

    const saveEdit = async (messageId) => {
      if (!editContent.value.trim()) return

      try {
        const response = await api.put(`/chat/messages/${messageId}`, {
          content: editContent.value
        })
        
        chatStore.editMessage(response.data)
        editingMessageId.value = null
        editContent.value = ''
      } catch (error) {
        console.error('Error editing message:', error)
        alert(error.response?.data?.message || 'Failed to edit message')
      }
    }

    const cancelEdit = () => {
      editingMessageId.value = null
      editContent.value = ''
    }

    const deleteMessage = async (messageId) => {
      if (!confirm('Are you sure you want to delete this message?')) return

      try {
        await api.delete(`/chat/messages/${messageId}`)
        chatStore.deleteMessage({ messageId, room: currentRoom.value })
      } catch (error) {
        console.error('Error deleting message:', error)
        alert(error.response?.data?.message || 'Failed to delete message')
      }
    }

    const toggleReactionPicker = (messageId) => {
      showReactionPicker.value = showReactionPicker.value === messageId ? null : messageId
    }

    const addReaction = async (messageId, emoji) => {
      try {
        const response = await api.post(`/chat/messages/${messageId}/reactions`, { emoji })
        chatStore.addReaction({ 
          messageId, 
          reactions: response.data,
          room: currentRoom.value 
        })
        showReactionPicker.value = null
      } catch (error) {
        console.error('Error adding reaction:', error)
      }
    }

    const reportMessage = (messageId) => {
      reportingMessageId.value = messageId
      showReportModal.value = true
      reportReason.value = ''
    }

    const submitReport = async () => {
      if (!reportReason.value.trim()) {
        alert('Please provide a reason for reporting')
        return
      }

      try {
        await api.post(`/chat/messages/${reportingMessageId.value}/report`, {
          reason: reportReason.value
        })
        alert('Message reported successfully')
        showReportModal.value = false
        reportReason.value = ''
        reportingMessageId.value = null
      } catch (error) {
        console.error('Error reporting message:', error)
        alert(error.response?.data?.message || 'Failed to report message')
      }
    }

    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    onMounted(async () => {
      chatStore.connectSocket()
      chatStore.joinRoom('general')
      await loadMessages()
    })

    onUnmounted(() => {
      if (isRecording.value) {
        stopRecording()
      }
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
      }
      stopTyping()
      chatStore.disconnectSocket()
    })

    return {
      messagesContainer,
      fileInput,
      newMessage,
      loading,
      showReactionPicker,
      editingMessageId,
      editContent,
      showReportModal,
      reportReason,
      reportingMessageId,
      uploadingFile,
      uploadProgress,
      isRecording,
      recordingTime,
      typingUsers,
      commonEmojis,
      currentRoom,
      isConnected,
      messages,
      userRole,
      userId,
      userName,
      isOwnMessage,
      getDisplayName,
      getFileUrl,
      onImageLoad,
      onImageError,
      sendMessage,
      handleTyping,
      startTyping,
      stopTyping,
      triggerFileInput,
      handleFileUpload,
      toggleRecording,
      stopRecording,
      formatRecordingTime,
      startEditMessage,
      saveEdit,
      cancelEdit,
      deleteMessage,
      toggleReactionPicker,
      addReaction,
      reportMessage,
      submitReport,
      formatTime,
      formatFileSize
    }
  }
}
</script>

<style scoped>
/* Add typing indicator styles */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: #666;
  font-style: italic;
}

.typing-dots {
  display: flex;
  gap: 3px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #667eea;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Improve image display */
.image-container {
  display: inline-block;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 4px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.image-preview {
  max-width: 300px;
  max-height: 200px;
  border-radius: 6px;
  display: block;
}

/* Rest of the styles remain the same */
.chat-page {
  height: 100vh;
  background: #f0f2f5;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  background: white;
}

.chat-header {
  background: #667eea;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.room-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.connection-status.connected {
  color: #4ade80;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.loading, .no-messages {
  text-align: center;
  padding: 40px;
  color: #666;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-item {
  display: flex;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  background: white;
  border-radius: 10px;
  padding: 10px 15px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.own-message .message-content {
  background: #dcf8c6;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 0.8rem;
}

.sender-name {
  font-weight: 600;
  color: #667eea;
}

.message-time {
  color: #666;
  font-size: 0.7rem;
}

.edited-badge {
  color: #999;
  font-style: italic;
}

.message-body {
  margin-bottom: 8px;
}

.text-message {
  line-height: 1.4;
  word-wrap: break-word;
}

.file-message {
  margin: 5px 0;
}

.file-preview {
  border-radius: 8px;
}

.video-preview {
  max-width: 300px;
  max-height: 200px;
}

.audio-player {
  width: 250px;
  height: 40px;
}

.generic-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.file-icon {
  font-size: 1.5rem;
}

.file-info {
  flex: 1;
}

.file-name {
  display: block;
  font-weight: 500;
}

.file-size {
  font-size: 0.8rem;
  color: #666;
}

.download-btn {
  padding: 5px 10px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.8rem;
}

.message-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.reactions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.reaction {
  background: rgba(255,255,255,0.8);
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid #ddd;
}

.react-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  opacity: 0.6;
}

.react-btn:hover {
  opacity: 1;
}

.action-buttons {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-item:hover .action-buttons {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.action-btn:hover {
  background: rgba(0,0,0,0.1);
}

.reaction-picker {
  display: flex;
  gap: 5px;
  margin-top: 5px;
  padding: 5px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.emoji-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 5px;
  font-size: 1rem;
  border-radius: 4px;
}

.emoji-btn:hover {
  background: #f0f0f0;
}

.edit-message-form {
  margin-top: 10px;
}

.edit-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.edit-actions {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

.deleted-message {
  color: #666;
  font-style: italic;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.message-input-area {
  padding: 15px 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.media-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.media-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.media-btn:hover {
  background: #f0f0f0;
}

.media-btn.recording {
  background: #ff4444;
  color: white;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.recording-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  background: #ff4444;
  color: white;
  border-radius: 20px;
  font-size: 0.8rem;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.stop-btn {
  background: white;
  color: #ff4444;
  border: none;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  cursor: pointer;
}

.upload-progress {
  text-align: center;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 5px;
}

.text-input-section {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  max-height: 100px;
}

.send-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
}

.report-textarea {
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin: 10px 0;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
  
  .file-preview {
    max-width: 200px;
  }
  
  .chat-header {
    padding: 10px 15px;
  }
  
  .message-input-area {
    padding: 10px 15px;
  }
  
  .media-controls {
    flex-wrap: wrap;
  }
}
</style>
