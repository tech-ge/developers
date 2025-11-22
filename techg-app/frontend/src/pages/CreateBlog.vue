<template>
  <div class="create-blog-page">
    <div class="container">
      <div class="page-header">
        <h1>{{ isEditing ? 'Edit Blog Post' : 'Create New Blog Post' }}</h1>
        <router-link to="/" class="btn btn-secondary">Back to Home</router-link>
      </div>

      <div class="blog-form">
        <form @submit.prevent="handleSubmit">
          <!-- Title -->
          <div class="form-group">
            <label for="title">Blog Title *</label>
            <input 
              type="text" 
              id="title" 
              v-model="form.title"
              required
              placeholder="Enter a compelling title for your blog"
              class="form-input"
            >
          </div>

          <!-- Media Upload -->
          <div class="form-group">
            <label for="media">Featured Media (Image or Video)</label>
            <div class="media-upload-section">
              <input 
                type="file" 
                id="media"
                ref="mediaInput"
                @change="handleMediaUpload"
                accept="image/*,video/*"
                class="media-input"
                style="display: none"
              >
              <div class="upload-controls">
                <button type="button" @click="triggerMediaInput" class="btn btn-outline">
                  Choose File
                </button>
                <span class="file-info" v-if="form.mediaFile">
                  Selected: {{ form.mediaFile.name }} ({{ formatFileSize(form.mediaFile.size) }})
                </span>
                <span class="file-info" v-else-if="currentBlog?.mediaFileName">
                  Current: {{ currentBlog.mediaFileName }}
                </span>
              </div>
              
              <!-- Media Preview -->
              <div v-if="mediaPreview" class="media-preview">
                <img v-if="mediaPreview.type === 'image'" :src="mediaPreview.url" alt="Preview" class="preview-image">
                <video v-else-if="mediaPreview.type === 'video'" controls class="preview-video">
                  <source :src="mediaPreview.url" :type="mediaPreview.mimeType">
                  Your browser does not support the video tag.
                </video>
                <button type="button" @click="removeMedia" class="remove-media-btn">
                  Remove
                </button>
              </div>

              <!-- Existing Media Preview -->
              <div v-if="!mediaPreview && currentBlog?.mediaUrl && currentBlog.mediaType !== 'none'" class="media-preview">
                <img v-if="currentBlog.mediaType === 'image'" :src="getMediaUrl(currentBlog.mediaUrl)" alt="Current media" class="preview-image">
                <video v-else-if="currentBlog.mediaType === 'video'" controls class="preview-video">
                  <source :src="getMediaUrl(currentBlog.mediaUrl)" :type="getMimeType(currentBlog.mediaFileName)">
                  Your browser does not support the video tag.
                </video>
                <button type="button" @click="removeExistingMedia" class="remove-media-btn">
                  Remove
                </button>
              </div>
            </div>
            <small class="help-text">Max file size: 10MB. Supported formats: Images (JPEG, PNG, GIF) and Videos (MP4, WebM)</small>
          </div>

          <!-- Caption -->
          <div class="form-group">
            <label for="caption">Media Caption</label>
            <textarea 
              id="caption" 
              v-model="form.caption"
              placeholder="Add a caption for your image or video (optional)"
              rows="2"
              class="form-textarea"
            ></textarea>
          </div>

          <!-- Content -->
          <div class="form-group">
            <label for="content">Blog Content *</label>
            <textarea 
              id="content" 
              v-model="form.content"
              required
              rows="12"
              placeholder="Write your blog content here..."
              class="form-textarea content-textarea"
            ></textarea>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label for="tags">Tags</label>
            <input 
              type="text" 
              id="tags" 
              v-model="form.tagsInput"
              placeholder="Add tags separated by commas (e.g., technology, programming, web)"
              class="form-input"
            >
          </div>

          <!-- Author Info (Read-only) -->
          <div class="form-group">
            <label>Author</label>
            <div class="author-info">
              <strong>{{ userName }}</strong>
              <span class="author-email">{{ userEmail }}</span>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="loading"
            >
              <span v-if="loading">
                {{ isEditing ? 'Updating...' : 'Publishing...' }}
              </span>
              <span v-else>
                {{ isEditing ? 'Update Blog Post' : 'Publish Blog Post' }}
              </span>
            </button>
            <router-link to="/" class="btn btn-secondary">
              Cancel
            </router-link>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../utils/api'

export default {
  name: 'CreateBlog',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const mediaInput = ref(null)
    
    const form = reactive({
      title: '',
      caption: '',
      content: '',
      tagsInput: '',
      mediaFile: null
    })
    
    const loading = ref(false)
    const error = ref('')
    const currentBlog = ref(null)
    const mediaPreview = ref(null)

    const isEditing = computed(() => !!route.query.id)

    const userName = computed(() => {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).name : ''
    })

    const userEmail = computed(() => {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).email : ''
    })

    const getMediaUrl = (url) => {
      if (!url) return ''
      if (url.startsWith('http')) return url
      return `http://localhost:5000${url}`
    }

    const getMimeType = (filename) => {
      if (filename?.endsWith('.mp4')) return 'video/mp4'
      if (filename?.endsWith('.webm')) return 'video/webm'
      if (filename?.endsWith('.jpg') || filename?.endsWith('.jpeg')) return 'image/jpeg'
      if (filename?.endsWith('.png')) return 'image/png'
      if (filename?.endsWith('.gif')) return 'image/gif'
      return ''
    }

    const formatFileSize = (bytes) => {
      if (!bytes) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const triggerMediaInput = () => {
      mediaInput.value.click()
    }

    const handleMediaUpload = (event) => {
      const file = event.target.files[0]
      if (!file) return

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        error.value = 'File size must be less than 10MB'
        return
      }

      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        error.value = 'Only images and videos are allowed'
        return
      }

      form.mediaFile = file
      error.value = ''

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        mediaPreview.value = {
          url: e.target.result,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          mimeType: file.type
        }
      }
      reader.readAsDataURL(file)
    }

    const removeMedia = () => {
      form.mediaFile = null
      mediaPreview.value = null
      mediaInput.value.value = ''
    }

    const removeExistingMedia = () => {
      currentBlog.value.mediaType = 'none'
      currentBlog.value.mediaUrl = ''
      currentBlog.value.mediaFileName = ''
      currentBlog.value.mediaSize = 0
    }

    const fetchBlog = async (blogId) => {
      try {
        const response = await api.get(`/blogs/${blogId}`)
        currentBlog.value = response.data
        form.title = response.data.title
        form.caption = response.data.caption || ''
        form.content = response.data.content
        form.tagsInput = response.data.tags?.join(', ') || ''
      } catch (err) {
        error.value = 'Failed to load blog'
        console.error('Error fetching blog:', err)
      }
    }

    const handleSubmit = async () => {
      loading.value = true
      error.value = ''

      try {
        const formData = new FormData()
        formData.append('title', form.title)
        formData.append('caption', form.caption)
        formData.append('content', form.content)
        formData.append('tags', form.tagsInput)

        if (form.mediaFile) {
          formData.append('media', form.mediaFile)
        }

        let response
        if (isEditing.value) {
          response = await api.put(`/blogs/${route.query.id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        } else {
          response = await api.post('/blogs', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        }

        alert(isEditing.value ? 'Blog updated successfully!' : 'Blog published successfully!')
        router.push('/')
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to save blog'
        console.error('Error saving blog:', err)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      if (route.query.id) {
        fetchBlog(route.query.id)
      }
    })

    return {
      mediaInput,
      form,
      loading,
      error,
      currentBlog,
      mediaPreview,
      isEditing,
      userName,
      userEmail,
      getMediaUrl,
      getMimeType,
      formatFileSize,
      triggerMediaInput,
      handleMediaUpload,
      removeMedia,
      removeExistingMedia,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.create-blog-page {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.blog-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  font-family: inherit;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
}

.content-textarea {
  min-height: 300px;
}

.media-upload-section {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.upload-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.btn-outline {
  background: white;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
}

.file-info {
  color: #666;
  font-size: 0.9rem;
}

.media-preview {
  position: relative;
  margin-top: 15px;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-video {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.remove-media-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 14px;
}

.help-text {
  color: #666;
  font-size: 0.8rem;
  margin-top: 5px;
  display: block;
}

.author-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 5px;
  border-left: 4px solid #667eea;
}

.author-info strong {
  display: block;
  color: #333;
}

.author-email {
  color: #666;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  text-decoration: none;
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

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 5px;
  border: 1px solid #f5c6cb;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .blog-form {
    padding: 20px;
  }

  .upload-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
