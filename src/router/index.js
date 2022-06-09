import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MatchesView from '../views/MatchesView.vue'
import TimelineView from '../views/TimelineView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/matches/:summonerId',
      name: 'matches',
      component: MatchesView
    },
    {
      path: '/matches',
      redirect: { name: 'home' }
    },
    {
      path: '/timeline/:matchId',
      name: 'timeline',
      component: TimelineView
    },
    {
      path: '/data/:dataURI',
      name: 'data',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/DataView.vue')
    },
    {
      path: '/data',
      redirect: { name: 'home' }
    }
  ]
})

export default router
