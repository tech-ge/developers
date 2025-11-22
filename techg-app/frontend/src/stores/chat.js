import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'

export const useChatStore = defineStore('chat', () => {
  const socket = ref(null)
  const messages = ref([])
  const isConnected = ref(false)
  const currentRoom = ref('general')
  const typingUsers = ref([])

  const connectSocket = () => {
    socket.value = io('http://localhost:5000')
    
    socket.value.on('connect', () => {
      isConnected.value = true
      console.log('Connected to chat server')
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
      console.log('Disconnected from chat server')
    })

    socket.value.on('receive_message', (message) => {
      const existingIndex = messages.value.findIndex(m => m._id === message._id)
      if (existingIndex === -1) {
        messages.value.push(message)
      }
    })

    socket.value.on('message_updated', (message) => {
      const index = messages.value.findIndex(m => m._id === message._id)
      if (index !== -1) {
        messages.value[index] = message
      }
    })

    socket.value.on('message_removed', (messageId) => {
      messages.value = messages.value.filter(m => m._id !== messageId)
    })

    socket.value.on('reaction_updated', (data) => {
      const message = messages.value.find(m => m._id === data.messageId)
      if (message) {
        message.reactions = data.reactions
      }
    })

    socket.value.on('user_typing', (data) => {
      typingUsers.value = data.users
    })
  }

  const joinRoom = (room) => {
    if (socket.value) {
      socket.value.emit('join_room', room)
      currentRoom.value = room
    }
  }

  const sendMessage = (message) => {
    if (socket.value) {
      socket.value.emit('send_message', message)
    }
  }

  const editMessage = (data) => {
    if (socket.value) {
      socket.value.emit('message_edited', data)
    }
  }

  const deleteMessage = (data) => {
    if (socket.value) {
      socket.value.emit('message_deleted', data)
    }
  }

  const addReaction = (data) => {
    if (socket.value) {
      socket.value.emit('reaction_added', data)
    }
  }

  const startTyping = (user) => {
    if (socket.value) {
      socket.value.emit('typing_start', {
        room: currentRoom.value,
        user: user
      })
    }
  }

  const stopTyping = (user) => {
    if (socket.value) {
      socket.value.emit('typing_stop', {
        room: currentRoom.value,
        user: user
      })
    }
  }

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  return {
    socket,
    messages,
    isConnected,
    currentRoom,
    typingUsers,
    connectSocket,
    joinRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    startTyping,
    stopTyping,
    disconnectSocket
  }
})
