<template>
  <div class="admin-page">
    <div class="container">
      <h1>Admin Dashboard</h1>
      
      <div class="admin-stats">
        <div class="stat-card">
          <h3>Total Users</h3>
          <p class="stat-number">{{ users.length }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Blogs</h3>
          <p class="stat-number">{{ blogs.length }}</p>
        </div>
        <div class="stat-card">
          <h3>Reported Messages</h3>
          <p class="stat-number">{{ reportedMessages.length }}</p>
        </div>
      </div>

      <div class="admin-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <h2>User Management</h2>
        <div class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user._id">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.phone }}</td>
                <td>
                  <select v-model="user.role" @change="updateUserRole(user._id, user.role)">
                    <option value="user">User</option>
                    <option value="blogger">Blogger</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>
                  <button 
                    @click="deleteUser(user._id)" 
                    class="btn btn-danger"
                    :disabled="user.email === currentUserEmail"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Blogs Tab -->
      <div v-if="activeTab === 'blogs'" class="tab-content">
        <h2>Blog Management</h2>
        <div class="blogs-list">
          <div class="blog-item" v-for="blog in blogs" :key="blog._id">
            <h4>{{ blog.title }}</h4>
            <p class="excerpt">{{ blog.excerpt }}</p>
            <div class="blog-meta">
              <span>By: {{ blog.author?.name }}</span>
              <span>Views: {{ blog.views }}</span>
              <span>Likes: {{ blog.likes?.length || 0 }}</span>
              <span>{{ formatDate(blog.createdAt) }}</span>
            </div>
            <div class="blog-actions">
              <button @click="editBlog(blog)" class="btn btn-secondary">Edit</button>
              <button @click="deleteBlog(blog._id)" class="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Reported Messages Tab -->
      <div v-if="activeTab === 'reports'" class="tab-content">
        <h2>Reported Messages</h2>
        <div v-if="reportedMessages.length === 0" class="no-reports">
          <p>No reported messages</p>
        </div>
        <div v-else class="reported-messages">
          <div v-for="message in reportedMessages" :key="message._id" class="reported-message">
            <div class="message-header">
              <strong>From: {{ message.sender?.name }} ({{ message.sender?.email }})</strong>
              <span class="message-time">{{ formatDate(message.createdAt) }}</span>
            </div>
            
            <div class="message-content">
              <div v-if="message.messageType === 'text'" class="text-content">
                {{ message.content }}
              </div>
              <div v-else class="file-content">
                <span>[{{ message.messageType.toUpperCase() }}] {{ message.fileName }}</span>
                <a :href="`http://localhost:5000${message.fileUrl}`" target="_blank" class="view-file">
                  View File
                </a>
              </div>
            </div>

            <div class="reports-list">
              <h4>Reports ({{ message.reports.length }}):</h4>
              <div v-for="report in message.reports" :key="report._id" class="report-item">
                <span class="reporter">👤 {{ report.user?.name }}:</span>
                <span class="reason">{{ report.reason }}</span>
                <span class="report-time">{{ formatDate(report.reportedAt) }}</span>
              </div>
            </div>

            <div class="message-actions">
              <button @click="viewInChat(message)" class="btn btn-secondary">View in Chat</button>
              <button @click="deleteReportedMessage(message._id)" class="btn btn-danger">
                Delete Message
              </button>
              <button @click="dismissReports(message._id)" class="btn btn-primary">
                Dismiss Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../utils/api'

export default {
  name: 'Admin',
  data() {
    return {
      users: [],
      blogs: [],
      reportedMessages: [],
      loading: false,
      currentUserEmail: '',
      activeTab: 'users',
      tabs: [
        { id: 'users', name: '👥 Users' },
        { id: 'blogs', name: '📝 Blogs' },
        { id: 'reports', name: '⚠️ Reported Messages' }
      ]
    }
  },
  async mounted() {
    await this.loadData()
    const user = localStorage.getItem('user')
    this.currentUserEmail = user ? JSON.parse(user).email : ''
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [usersResponse, blogsResponse, reportsResponse] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/blogs'),
          api.get('/chat/reported-messages')
        ])
        this.users = usersResponse.data
        this.blogs = blogsResponse.data
        this.reportedMessages = reportsResponse.data
      } catch (error) {
        console.error('Error loading admin data:', error)
        alert('Failed to load admin data')
      } finally {
        this.loading = false
      }
    },
    async updateUserRole(userId, newRole) {
      try {
        await api.put(`/admin/users/${userId}/role`, { role: newRole })
        alert('User role updated successfully')
      } catch (error) {
        console.error('Error updating user role:', error)
        alert('Failed to update user role')
      }
    },
    async deleteUser(userId) {
      if (!confirm('Are you sure you want to delete this user?')) return
      
      try {
        await api.delete(`/admin/users/${userId}`)
        this.users = this.users.filter(user => user._id !== userId)
        alert('User deleted successfully')
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user')
      }
    },
    async deleteBlog(blogId) {
      if (!confirm('Are you sure you want to delete this blog?')) return
      
      try {
        await api.delete(`/blogs/${blogId}`)
        this.blogs = this.blogs.filter(blog => blog._id !== blogId)
        alert('Blog deleted successfully')
      } catch (error) {
        console.error('Error deleting blog:', error)
        alert('Failed to delete blog')
      }
    },
    async deleteReportedMessage(messageId) {
      if (!confirm('Are you sure you want to delete this reported message?')) return
      
      try {
        await api.delete(`/chat/messages/${messageId}`)
        this.reportedMessages = this.reportedMessages.filter(msg => msg._id !== messageId)
        alert('Message deleted successfully')
      } catch (error) {
        console.error('Error deleting reported message:', error)
        alert('Failed to delete message')
      }
    },
    async dismissReports(messageId) {
      if (!confirm('Are you sure you want to dismiss all reports for this message?')) return
      
      try {
        // For now, we'll just remove it from the reported list
        // In a real app, you might want to clear the reports array in the database
        this.reportedMessages = this.reportedMessages.filter(msg => msg._id !== messageId)
        alert('Reports dismissed successfully')
      } catch (error) {
        console.error('Error dismissing reports:', error)
        alert('Failed to dismiss reports')
      }
    },
    viewInChat(message) {
      // Navigate to chat and highlight the message
      this.$router.push('/chat')
      // In a real app, you might want to implement message highlighting
    },
    editBlog(blog) {
      this.$router.push(`/blogs/create?id=${blog._id}`)
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.admin-page {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  color: #666;
  margin-bottom: 10px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin: 0;
}

.admin-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #667eea;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f0f0f0;
}

.tab-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.users-table select {
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.blogs-list {
  margin-top: 20px;
}

.blog-item {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 15px;
}

.blog-item h4 {
  margin-bottom: 10px;
  color: #333;
}

.excerpt {
  color: #666;
  margin-bottom: 10px;
  line-height: 1.4;
}

.blog-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #888;
  flex-wrap: wrap;
}

.blog-actions {
  display: flex;
  gap: 10px;
}

.reported-messages {
  margin-top: 20px;
}

.reported-message {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: #fafafa;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.message-content {
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 5px;
}

.text-content {
  line-height: 1.4;
}

.file-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-file {
  color: #667eea;
  text-decoration: none;
  padding: 5px 10px;
  border: 1px solid #667eea;
  border-radius: 4px;
  font-size: 0.8rem;
}

.reports-list {
  margin-bottom: 15px;
}

.reports-list h4 {
  margin-bottom: 10px;
  color: #666;
}

.report-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.reporter {
  font-weight: 500;
  color: #333;
}

.reason {
  flex: 1;
  color: #666;
}

.report-time {
  color: #999;
  font-size: 0.8rem;
}

.message-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-reports {
  text-align: center;
  padding: 40px;
  color: #666;
}

@media (max-width: 768px) {
  .users-table {
    font-size: 14px;
  }
  
  .blog-meta {
    flex-direction: column;
    gap: 5px;
  }
  
  .blog-actions {
    flex-direction: column;
  }
  
  .admin-tabs {
    flex-direction: column;
  }
  
  .message-actions {
    flex-direction: column;
  }
  
  .report-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>
