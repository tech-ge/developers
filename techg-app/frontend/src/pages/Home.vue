<template>
  <div class="home">
    <div class="container">
      <!-- Blogger Home (Only Create Blog) -->
      <div v-if="userRole === 'blogger'" class="blogger-home">
        <h1>Welcome, Blogger!</h1>
        <p>You can create and manage blog posts.</p>
        <div class="action-buttons">
          <router-link to="/blogs/create" class="btn btn-primary btn-large">
            📝 Create New Blog
          </router-link>
        </div>
        <div class="blogger-info">
          <h3>Your Role: Blogger</h3>
          <p>As a blogger, you have the ability to:</p>
          <ul>
            <li>Create new blog posts</li>
            <li>Edit your existing blog posts</li>
            <li>Delete your blog posts</li>
          </ul>
        </div>
      </div>

      <!-- Admin Home (Only Admin Dashboard) -->
      <div v-else-if="userRole === 'admin'" class="admin-home">
        <h1>Welcome, Admin!</h1>
        <p>You have access to the admin dashboard for user and content management.</p>
        <div class="action-buttons">
          <router-link to="/admin" class="btn btn-primary btn-large">
            ⚙️ Admin Dashboard
          </router-link>
        </div>
        <div class="admin-info">
          <h3>Your Role: Administrator</h3>
          <p>As an admin, you have the ability to:</p>
          <ul>
            <li>Manage all users and their roles</li>
            <li>View and manage all blog posts</li>
            <li>Delete any user or blog post</li>
            <li>Update user permissions</li>
          </ul>
        </div>
      </div>

      <!-- Regular User Home (Blogs, Chat, Create Blog, Dashboard) -->
      <div v-else class="user-home">
        <h1>Welcome to TechG, {{ userName }}!</h1>
        <p>Your social platform for blogs and chat</p>
        <div class="features">
          <router-link to="/blogs" class="btn btn-primary">📖 Read Blogs</router-link>
          <router-link to="/chat" class="btn btn-secondary">💬 Join Chat</router-link>
          <router-link to="/blogs/create" class="btn btn-primary">✍️ Create Blog</router-link>
          <router-link to="/dashboard" class="btn btn-secondary">📊 My Dashboard</router-link>
        </div>
        <div class="user-info">
          <h3>Your Role: Regular User</h3>
          <p>As a regular user, you can:</p>
          <ul>
            <li>Read all published blog posts</li>
            <li>Create your own blog posts</li>
            <li>Participate in chat rooms</li>
            <li>View your personal dashboard</li>
            <li>Like and interact with content</li>
          </ul>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
          <h3>Quick Access</h3>
          <div class="stats-grid">
            <div class="stat-card" @click="$router.push('/blogs')">
              <div class="stat-icon">📚</div>
              <div class="stat-info">
                <h4>Browse Blogs</h4>
                <p>Read latest posts from our community</p>
              </div>
            </div>
            <div class="stat-card" @click="$router.push('/chat')">
              <div class="stat-icon">💬</div>
              <div class="stat-info">
                <h4>Join Chat</h4>
                <p>Connect with other users in real-time</p>
              </div>
            </div>
            <div class="stat-card" @click="$router.push('/blogs/create')">
              <div class="stat-icon">✍️</div>
              <div class="stat-info">
                <h4>Write Blog</h4>
                <p>Share your thoughts and experiences</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  computed: {
    userRole() {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).role : 'user'
    },
    userName() {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).name : 'User'
    }
  }
}
</script>

<style scoped>
.home {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.home h1 {
  font-size: 3rem;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
}

.home p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 30px;
  text-align: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.features {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.3s ease;
}

.btn-large {
  padding: 15px 30px;
  font-size: 18px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

.blogger-info,
.admin-info,
.user-info {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto 40px;
}

.blogger-info h3,
.admin-info h3,
.user-info h3 {
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}

.blogger-info ul,
.admin-info ul,
.user-info ul {
  text-align: left;
  color: #666;
  line-height: 1.6;
}

.blogger-info li,
.admin-info li,
.user-info li {
  margin-bottom: 8px;
}

.quick-stats {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

.quick-stats h3 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: #667eea;
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.1);
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.stat-info h4 {
  margin-bottom: 10px;
  color: #333;
}

.stat-info p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

@media (max-width: 768px) {
  .home h1 {
    font-size: 2rem;
  }
  
  .features {
    flex-direction: column;
    align-items: center;
  }
  
  .features .btn {
    width: 200px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
