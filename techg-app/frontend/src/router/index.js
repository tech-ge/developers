import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login', 
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/blogs',
    name: 'Blogs',
    component: () => import('../pages/Blogs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/blogs/create',
    name: 'CreateBlog',
    component: () => import('../pages/CreateBlog.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/blogs/:id',
    name: 'BlogDetail',
    component: () => import('../pages/BlogDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../pages/Chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard', 
    component: () => import('../pages/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../pages/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token') !== null
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  const userRole = user ? user.role : 'user'

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && userRole !== 'admin') {
    next('/')
  } else {
    next()
  }
})

export default router
