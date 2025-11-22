<template>
  <div class="blogs-page">
    <div class="container">
      <div class="page-header">
        <h1>Blog Posts</h1>
        <div class="header-actions">
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Search blogs..."
            class="search-input"
          >
        </div>
      </div>

      <div class="blogs-grid">
        <div class="blog-card" v-for="blog in filteredBlogs" :key="blog._id">
          <!-- Blog Media -->
          <div v-if="blog.mediaType !== 'none'" class="blog-media">
            <img 
              v-if="blog.mediaType === 'image'" 
              :src="getMediaUrl(blog.mediaUrl)" 
              :alt="blog.title"
              class="media-preview"
              @click="viewBlog(blog._id)"
            >
            <video 
              v-else-if="blog.mediaType === 'video'"
              :src="getMediaUrl(blog.mediaUrl)"
              class="media-preview"
              @click="viewBlog(blog._id)"
            ></video>
          </div>

          <!-- Blog Content -->
          <div class="blog-content">
            <h3 class="blog-title" @click="viewBlog(blog._id)">{{ blog.title }}</h3>
            
            <p v-if="blog.caption" class="blog-caption">{{ blog.caption }}</p>
            
            <p class="blog-excerpt">{{ blog.excerpt }}</p>
            
            <div class="blog-meta">
              <div class="author-info">
                <span class="author-name">By {{ getDisplayName(blog.author) }}</span>
                <span class="publish-date">{{ formatDate(blog.createdAt) }}</span>
              </div>
              <div class="blog-stats">
                <span class="views">👁️ {{ blog.views }} views</span>
                <span class="likes">❤️ {{ blog.likes?.length || 0 }} likes</span>
              </div>
            </div>

            <div class="blog-tags" v-if="blog.tags.length">
              <span class="tag" v-for="tag in blog.tags" :key="tag">#{{ tag }}</span>
            </div>

            <div class="blog-actions">
              <button @click="viewBlog(blog._id)" class="btn btn-primary">Read More</button>
              <div v-if="isBlogOwner(blog)" class="owner-actions">
                <button @click="editBlog(blog)" class="btn btn-secondary">Edit</button>
                <button @click="deleteBlog(blog._id)" class="btn btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">Loading blogs...</div>
      <div v-if="!loading && blogs.length === 0" class="no-blogs">
        <p>No blogs found. Be the first to create one!</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../utils/api'

export default {
  name: 'Blogs',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const blogs = ref([])
    const loading = ref(true)
    const searchQuery = ref('')

    const filteredBlogs = computed(() => {
      if (!searchQuery.value) return blogs.value
      
      const query = searchQuery.value.toLowerCase()
      return blogs.value.filter(blog => 
        blog.title.toLowerCase().includes(query) ||
        blog.content.toLowerCase().includes(query) ||
        blog.caption?.toLowerCase().includes(query) ||
        blog.tags.some(tag => tag.toLowerCase().includes(query)) ||
        blog.author?.name.toLowerCase().includes(query)
      )
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
      } catch (error) {
        console.error('Error fetching blogs:', error)
      } finally {
        loading.value = false
      }
    }

    const isBlogOwner = (blog) => {
      const user = localStorage.getItem('user')
      if (!user) return false
      const userData = JSON.parse(user)
      return blog.author._id === userData.id || userData.role === 'admin'
    }

    const viewBlog = (blogId) => {
      router.push(`/blogs/${blogId}`)
    }

    const editBlog = (blog) => {
      router.push(`/blogs/create?id=${blog._id}`)
    }

    const deleteBlog = async (blogId) => {
      if (!confirm('Are you sure you want to delete this blog?')) return

      try {
        await api.delete(`/blogs/${blogId}`)
        blogs.value = blogs.value.filter(blog => blog._id !== blogId)
      } catch (error) {
        console.error('Error deleting blog:', error)
        alert('Failed to delete blog')
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    onMounted(() => {
      fetchBlogs()
    })

    return {
      getDisplayName,
      blogs,
      loading,
      searchQuery,
      filteredBlogs,
      getMediaUrl,
      isBlogOwner,
      viewBlog,
      editBlog,
      deleteBlog,
      formatDate
    }
  }
}
</script>

<style scoped>
.blogs-page {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-input {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  width: 300px;
}

.blogs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 30px;
}

.blog-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.blog-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.blog-media {
  height: 200px;
  overflow: hidden;
}

.media-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.media-preview:hover {
  transform: scale(1.05);
}

.blog-content {
  padding: 25px;
}

.blog-title {
  font-size: 1.4rem;
  margin-bottom: 10px;
  color: #333;
  cursor: pointer;
  transition: color 0.3s ease;
}

.blog-title:hover {
  color: #667eea;
}

.blog-caption {
  font-style: italic;
  color: #666;
  margin-bottom: 10px;
  border-left: 3px solid #667eea;
  padding-left: 10px;
}

.blog-excerpt {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.blog-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.author-name {
  font-weight: 600;
  color: #333;
}

.publish-date {
  font-size: 0.9rem;
  color: #666;
}

.blog-stats {
  display: flex;
  gap: 10px;
  font-size: 0.9rem;
  color: #666;
}

.blog-tags {
  margin-bottom: 15px;
}

.tag {
  display: inline-block;
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 0.8rem;
  margin-right: 5px;
  margin-bottom: 5px;
}

.blog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.owner-actions {
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

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.loading, .no-blogs {
  text-align: center;
  padding: 40px;
  color: #666;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .blogs-grid {
    grid-template-columns: 1fr;
  }

  .blog-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .blog-actions {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .owner-actions {
    justify-content: space-between;
  }
}
</style>

    const getDisplayName = (author) => {
      if (!author) return 'Unknown'
      // Show "Admin" for admin users
      if (author.role === 'admin') return 'Admin'
      return author.name
    }
