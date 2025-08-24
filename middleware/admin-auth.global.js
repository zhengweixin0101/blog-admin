export default defineNuxtRouteMiddleware((to) => {
    if (to.path === '/verify') return

    const verified = useCookie('admin_verified')
    if (!verified.value) {
        return navigateTo('/verify')
    }
})
