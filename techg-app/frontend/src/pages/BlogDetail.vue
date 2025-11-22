<template>
  <div class="blog-detail-page">
    <div class="container">
      <div v-if="loading" class="loading">Loading blog...</div>
      
      <div v-else-if="blog" class="blog-detail">
        <!-- Back Button -->
        <div class="back-section">
          <button @click="$router.push('/blogs')" class="btn btn-secondary">
            ← Back to Blogs
          </button>
        </div>

        <!-- Blog Header -->
        <div class="blog-header">
          <h1 class="blog-title">{{ blog.title }}</h1>
          
          <div class="blog-meta">
            <div class="author-section">
              <div class="author-avatar" :class="{ admin: blog.author?.role === 'admin' }">
                {{ getAuthorInitial(blog.author) }}
              </div>
              <div class="author-info">
                <span class="author-name">{{ getDisplayName(blog.author) }}</span>
                <span class="publish-date">{{ formatDate(blog.createdAt) }}</span>
              </div>
            </div>
            
            <div class="blog-stats">
              <span class="views">👁️ {{ blog.views }} views</span>
              <span class="likes">❤️ {{ blog.likes?.length || 0 }} likes</span>
            </div>
          </div>
        </div>

        <!-- Featured Media -->
        <div v-if="blog.mediaType !== 'none'" class="featured-media">
          <img 
            v-if="blog.mediaType === 'image'" 
            :src="getMediaUrl(blog.mediaUrl)" 
            :alt="blog.title"
            class="media-full"
          >
          <video 
            v-else-if="blog.mediaType === 'video'"
            :src="getMediaUrl(blog.mediaUrl)"
            controls
            class="media-full"
          >
            Your browser does not support the video tag.
          </video>
          
          <p v-if="blog.caption" class="media-caption">{{ blog.caption }}</p>
        </div>

        <!-- Blog Content -->
        <div class="blog-content">
          <div class="content-text">{{ formattedContent }}</div>
        </div>

        <!-- Tags -->
        <div v-if="blog.tags.length" class="blog-tags">
          <h3>Tags</h3>
          <div class="tags-list">
            <span class="tag" v-for="tag in blog.tags" :key="tag">#{{ tag }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="blog-actions">
          <button @click="likeBlog" class="btn btn-primary" :disabled="liking">
            {{ isLiked ? '❤️ Liked' : '🤍 Like' }} ({{ blog.likes?.length || 0 }})
          </button>
          
          <div v-if="isBlogOwner" class="owner-actions">
            <button @click="editBlog" class="btn btn-secondary">Edit</button>
            <button @click="deleteBlog" class="btn btn-danger">Delete</button>
          </div>
        </div>
      </div>

      <div v-else class="not-found">
        <h2>Blog not found</h2>
        <p>The blog you're looking for doesn't exist.</p>
        <router-link to="/blogs" class="btn btn-primary">Back to Blogs</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../utils/api'

export default {
  name: 'BlogDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const blog = ref(null)
    const loading = ref(true)
    const liking = ref(false)

    const getMediaUrl = (url) => {
      if (!url) return ''
      if (url.startsWith('http')) return url
      return `http://localhost:5000${url}`
    }

    const getAuthorInitial = (author) => {
      if (!author?.name) return '?'
      // For admin, show "A"
      if (author.role === 'admin') return 'A'
      return author.name.charAt(0).toUpperCase()
    }

    const getDisplayName = (author) => {
      if (!author) return 'Unknown'
      // Show "Admin" for admin users
      if (author.role === 'admin') return 'Admin'
      return author.name
    }

    const isBlogOwner = computed(() => {
      if (!blog.value) return false
      const user = localStorage.getItem('user')
      if (!user) return false
      const userData = JSON.parse(user)
      return blog.value.author._id === userData.id || userData.role === 'admin'
    })

    const isLiked = computed(() => {
      if (!blog.value || !blog.value.likes) return false
      const user = localStorage.getItem('user')
      if (!user) return false
      const userData = JSON.parse(user)
      return blog.value.likes.includes(userData.id)
    })

    const formattedContent = computed(() => {
      if (!blog.value?.content) return ''
      return blog.value.content
    })

    const fetchBlog = async () => {
      try {
        const response = await api.get(`/blogs/${route.params.id}`)
        blog.value = response.data
      } catch (error) {
        console.error('Error fetching blog:', error)
        blog.value = null
      } finally {
        loading.value = false
      }
    }

    const likeBlog = async () => {
      if (liking.value) return
      
      liking.value = true
      try {
        const response = await api.post(`/blogs/${route.params.id}/like`)
        blog.value = response.data.blog
      } catch (error) {
        console.error('Error liking blog:', error)
        alert('Failed to like blog')
      } finally {
        liking.value = false
      }
    }

    const editBlog = () => {
      router.push(`/blogs/create?id=${blog.value._id}`)
    }

    const deleteBlog = async () => {
      if (!confirm('Are you sure you want to delete this blog?')) return

      try {
        await api.delete(`/blogs/${blog.value._id}`)
        router.push('/blogs')
      } catch (error) {
        console.error('Error deleting blog:', error)
        alert('Failed to delete blog')
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    onMounted(() => {
      fetchBlog()
    })

    return {
      blog,
      loading,
      liking,
      getMediaUrl,
      getAuthorInitial,
      getDisplayName,
      isBlogOwner,
      isLiked,
      formattedContent,
      likeBlog,
      editBlog,
      deleteBlog,
      formatDate
    }
  }
}
</script>

<style scoped>
.blog-detail-page {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.back-section {
  margin-bottom: 30px;
}

.blog-detail {
  max-width: 800px;
  margin: 0 auto;
}

.blog-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.blog-title {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #333;
  line-height: 1.2;
}

.blog-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.author-avatar {
  width: 50px;
  height: 50px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.author-avatar.admin {
  background: #dc3545;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.publish-date {
  color: #666;
  font-size: 0.9rem;
}

.blog-stats {
  display: flex;
  gap: 15px;
  color: #666;
}

.featured-media {
  margin-bottom: 30px;
}

.media-full {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.media-caption {
  text-align: center;
  font-style: italic;
  color: #666;
  margin-top: 10px;
  padding: 0 20px;
}

.blog-content {
  margin-bottom: 30px;
}

.content-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  white-space: pre-line;
}

.blog-tags {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.blog-tags h3 {
  margin-bottom: 15px;
  color: #333;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  background: white;
  color: #667eea;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  border: 1px solid #667eea;
}

.blog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.owner-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd8;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.loading, .not-found {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.not-found h2 {
  margin-bottom: 10px;
  color: #333;
}

@media (max-width: 768px) {
  .blog-title {
    font-size: 2rem;
  }

  .blog-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .blog-actions {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .owner-actions {
    justify-content: space-between;
  }

  .content-text {
    font-size: 1rem;
  }
}
</style>
