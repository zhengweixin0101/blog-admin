<template>
  <div>
    <aside class="fixed top-0 left-0 w-20 md:w-40 bg-gray-100 h-screen p-4">
      <h2 class="text-xl font-bold mb-4">博客后台</h2>
      <nav class="flex flex-col gap-3">
        <NuxtLink to="/" class="rounded p-2 transition-all duration-200 no-underline"
                   :class="$route.path === '/' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:text-blue-600 hover:shadow-[0_0_0_0.5px_#3b82f6]'">首页概览</NuxtLink>
        <NuxtLink to="/articles" class="rounded p-2 transition-all duration-200 no-underline"
                   :class="$route.path.startsWith('/articles') ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:text-blue-600 hover:shadow-[0_0_0_0.5px_#3b82f6]'">文章管理</NuxtLink>
        <NuxtLink to="/talks" class="rounded p-2 transition-all duration-200 no-underline"
                   :class="$route.path === '/talks' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:text-blue-600 hover:shadow-[0_0_0_0.5px_#3b82f6]'">说说管理</NuxtLink>
        <NuxtLink to="/images" class="rounded p-2 transition-all duration-200 no-underline"
                   :class="$route.path === '/images' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:text-blue-600 hover:shadow-[0_0_0_0.5px_#3b82f6]'">图片管理</NuxtLink>
        <NuxtLink to="/settings" class="rounded p-2 transition-all duration-200 no-underline"
                   :class="$route.path === '/settings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:text-blue-600 hover:shadow-[0_0_0_0.5px_#3b82f6]'">系统设置</NuxtLink>
      </nav>
    </aside>
  </div>
</template>