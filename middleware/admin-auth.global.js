export default defineNuxtRouteMiddleware((to) => {
    if (to.path === '/verify') return

    if (process.client) {
        const verified = localStorage.getItem('admin_verified')
        if (!verified) {
            return navigateTo('/verify')
        }
    }
})