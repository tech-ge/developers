<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <router-link to="/">TechG</router-link>
      </div>
      
      <!-- Different menus based on user role -->
      <div class="nav-menu">
        <!-- Blogger Menu (Only Create Blog) -->
        <template v-if="userRole === 'blogger'">
          <router-link to="/blogs/create" class="nav-link">Create Blog</router-link>
        </template>

        <!-- Admin Menu (Only Admin Dashboard) -->
        <template v-else-if="userRole === 'admin'">
          <router-link to="/admin" class="nav-link">Admin Dashboard</router-link>
        </template>

        <!-- Regular User Menu (Blogs, Chat, Create Blog) -->
        <template v-else>
          <router-link to="/blogs" class="nav-link">Blogs</router-link>
          <router-link to="/chat" class="nav-link">Chat</router-link>
          <router-link to="/blogs/create" class="nav-link">Create Blog</router-link>
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        </template>
        
        <div class="nav-user">
          <span>{{ userName }} ({{ userRole }})</span>
          <button @click="logout" class="btn btn-secondary">Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  computed: {
    userName() {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).name : 'User'
    },
    userRole() {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user).role : 'user'
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.nav-brand a {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-decoration: none;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
  padding: 8px 16px;
  border-radius: 5px;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #667eea;
  background: #f8f9fa;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-left: 10px;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 5px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

@media (max-width: 768px) {
  .nav-menu {
    gap: 10px;
  }
  
  .nav-user {
    flex-direction: column;
    gap: 5px;
    text-align: center;
  }
}
</style>
