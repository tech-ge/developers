<template>
  <div class="dashboard-page">
    <div class="container">
      <h1>Welcome, {{ userName }}! ��</h1>
      <p class="dashboard-subtitle">Here's your activity overview</p>
      
      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <router-link to="/blogs" class="action-btn">
            <div class="action-icon">📚</div>
            <span>Browse Blogs</span>
          </router-link>
          <router-link to="/blogs/create" class="action-btn">
            <div class="action-icon">✍️</div>
            <span>Write Blog</span>
          </router-link>
          <router-link to="/chat" class="action-btn">
            <div class="action-icon">💬</div>
            <span>Join Chat</span>
          </router-link>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📖</div>
          <div class="stat-info">
            <h3>Blogs Read</h3>
            <p class="stat-number">{{ totalBlogs }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✍️</div>
          <div class="stat-info">
            <h3>My Blogs</h3>
            <p class="stat-number">{{ myBlogs.length }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❤️</div>
          <div class="stat-info">
            <h3>Total Likes</h3>
            <p class="stat-number">{{ totalLikes }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👁️</div>
          <div class="stat-info">
            <h3>Profile Views</h3>
            <p class="stat-number">{{ totalViews }}</p>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <h2>Recent Activity</h2>
        <div class="activity-list">
          <div v-if="recentActivity.length === 0" class="no-activity">
            <p>No recent activity yet. Start by exploring blogs or joining chats!</p>
          </div>
          <div v-else>
            <div class="activity-item" v-for="activity in recentActivity" :key="activity.id">
              <div class="activity-icon">{{ activity.icon }}</div>
              <div class="activity-content">
                <p>{{ activity.message }}</p>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- My Recent Blogs -->
      <div class="my-blogs-section">
        <div class="section-header">
          <h2>My Recent Blogs</h2>
          <router-link to="/blogs/create" class="btn btn-primary">Create New Blog</router-link>
        </div>
        <div class="blogs-list">
          <div v-if="myBlogs.length === 0" class="no-blogs">
            <p>You haven't written any blogs yet.</p>
            <router-link to="/blogs/create" class="btn btn-primary">Write Your First Blog</router-link>
          </div>
          <div v-else class="blogs-grid">
            <div class="blog-card" v-for="blog in myBlogs.slice(0, 3)" :key="blog._id">
              <div v-if="blog.mediaType === 'image'" class="blog-media">
                <img :src="getMediaUrl(blog.mediaUrl)" :alt="blog.title" class="media-preview">
              </div>
              <div class="blog-content">
                <h4 class="blog-title">{{ blog.title }}</h4>
                <p class="blog-excerpt">{{ blog.excerpt }}</p>
                <div class="blog-meta">
                  <span class="views">👁️ {{ blog.views }}</span>
                  <span class="likes">❤️ {{ blog.likes?.length || 0 }}</span>
                  <span class="date">{{ formatDate(blog.createdAt) }}</span>
                </div>
                <div class="blog-actions">
                  <router-link :to="`/blogs/${blog._id}`" class="btn btn-primary">View</router-link>
                  <button @click="editBlog(blog)" class="btn btn-secondary">Edit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    
    const blogs = ref([])
    const myBlogs = ref([])
    const loading = ref(true)

    const userName = computed(() => {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).name : 'User'
    })

    const userId = computed(() => {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).id : null
    })

    const totalBlogs = computed(() => blogs.value.length)
    
    const totalLikes = computed(() => {
      return myBlogs.value.reduce((sum, blog) => sum + (blog.likes?.length || 0), 0)
    })

    const totalViews = computed(() => {
      return myBlogs.value.reduce((sum, blog) => sum + (blog.views || 0), 0)
    })

    const recentActivity = computed(() => {
      const activities = []
      
      // Add blog creation activities
      myBlogs.value.slice(0, 3).forEach(blog => {
        activities.push({
          id: blog._id,
          icon: '✍️',
          message: `You published "${blog.title}"`,
          time: formatRelativeTime(blog.createdAt)
        })
      })

      // Add some sample activities (in real app, these would come from API)
      if (activities.length === 0) {
        activities.push(
          {
            id: '1',
            icon: '📚',
            message: 'Welcome to TechG! Start exploring blogs',
            time: 'Just now'
          },
          {
            id: '2',
            icon: '💬',
            message: 'Join the chat room to connect with others',
            time: 'Recently'
          }
        )
      }

      return activities
    })

    const getMediaUrl = (url) => {
      if (!url) return ''
      if (url.startsWith('http')) return url
      return `http://localhost:5000${url}`
    }

    const fetchBlogs = async () => {
      try {
        const response = await api.get('/blogs')
        blogs.value = response.data
        // Filter user's blogs
        myBlogs.value = response.data.filter(blog => blog.author._id === userId.value)
      } catch (error) {
        console.error('Error fetching blogs:', error)
      } finally {
        loading.value = false
      }
    }

    const editBlog = (blog) => {
      router.push(`/blogs/create?id=${blog._id}`)
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const formatRelativeTime = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return 'Just now'
      if (diffInHours < 24) return `${diffInHours}h ago`
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
      return formatDate(dateString)
    }

    onMounted(() => {
      fetchBlogs()
    })

    return {
      userName,
      blogs,
      myBlogs,
      loading,
      totalBlogs,
      totalLikes,
      totalViews,
      recentActivity,
      getMediaUrl,
      editBlog,
      formatDate
    }
  }
}
</script>

<style scoped>
.dashboard-page {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
  background: #f8f9fa;
}

.dashboard-page h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #333;
  text-align: center;
}

.dashboard-subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 40px;
  font-size: 1.1rem;
}

.quick-actions {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.quick-actions h2 {
  margin-bottom: 20px;
  color: #333;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 25px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  text-align: center;
}

.action-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
}

.action-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.action-btn span {
  font-weight: 600;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  margin-bottom: 5px;
  color: #666;
  font-size: 0.9rem;
  font-weight: normal;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin: 0;
}

.recent-activity {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.recent-activity h2 {
  margin-bottom: 20px;
  color: #333;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.2rem;
  margin-top: 2px;
}

.activity-content p {
  margin: 0 0 5px 0;
  color: #333;
}

.activity-time {
  color: #666;
  font-size: 0.8rem;
}

.no-activity {
  text-align: center;
  padding: 40px;
  color: #666;
}

.my-blogs-section {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  color: #333;
  margin: 0;
}

.blogs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.blog-card {
  border: 1px solid #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.blog-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.blog-media {
  height: 150px;
  overflow: hidden;
}

.media-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-content {
  padding: 20px;
}

.blog-title {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
}

.blog-excerpt {
  color: #666;
  line-height: 1.4;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 0.8rem;
  color: #666;
}

.blog-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.no-blogs {
  text-align: center;
  padding: 40px;
  color: #666;
}

@media (max-width: 768px) {
  .dashboard-page h1 {
    font-size: 2rem;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .blogs-grid {
    grid-template-columns: 1fr;
  }

  .blog-actions {
    flex-direction: column;
  }
}
</style>
