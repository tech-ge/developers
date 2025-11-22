<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>Join TechG</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" v-model="form.name" required>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="form.email" required>
        </div>
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input type="tel" id="phone" v-model="form.phone" required placeholder="+254700000000">
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="form.password" required>
          <small>Password must be at least 6 characters</small>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" v-model="form.confirmPassword" required>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Sign Up' }}
        </button>
      </form>
      
      <div class="error-message" v-if="error">{{ error }}</div>
      
      <p>Already have an account? <router-link to="/login">Login</router-link></p>
    </div>
  </div>
</template>

<script>
import api from '../utils/api'

export default {
  name: 'Register',
  data() {
    return {
      form: {
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      },
      loading: false,
      error: ''
    }
  },
  methods: {
    async handleRegister() {
      if (this.form.password !== this.form.confirmPassword) {
        this.error = 'Passwords do not match!'
        return
      }
      
      if (this.form.password.length < 6) {
        this.error = 'Password must be at least 6 characters long!'
        return
      }

      if (!this.form.phone) {
        this.error = 'Phone number is required!'
        return
      }

      this.loading = true
      this.error = ''

      try {
        const response = await api.post('/auth/register', {
          name: this.form.name,
          email: this.form.email,
          phone: this.form.phone,
          password: this.form.password
        })
        
        // Save token and user data
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        this.$router.push('/')
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration failed. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.form-group small {
  color: #666;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin: 15px 0;
  padding: 10px;
  background: #f8d7da;
  border-radius: 5px;
}

.auth-form p {
  text-align: center;
  margin-top: 20px;
}
</style>
