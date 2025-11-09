export default defineNuxtRouteMiddleware((to) => {
    if (process.server) return

    if (to.path === '/verify') return

    const verified = useCookie('admin_verified')
    if (!verified.value) {
        window.location.href = '/verify' 
    }
})
