<template>
  <div>
    <aside class="fixed top-0 left-0 w-20 md:w-40 bg-gray-100 h-screen p-4">
      <h2 class="text-xl font-bold mb-4">管理后台</h2>
      <nav class="flex flex-col gap-2">
        <NuxtLink to="/" class="hover:text-blue-500">首页</NuxtLink>
        <NuxtLink to="/articles" class="hover:text-blue-500">文章列表</NuxtLink>
        <NuxtLink to="/articles/create" class="hover:text-blue-500">创建文章</NuxtLink>
        <NuxtLink to="/talks" class="hover:text-blue-500">说说管理</NuxtLink>
        <NuxtLink to="/images" class="hover:text-blue-500">图片管理</NuxtLink>
      </nav>
    </aside>
  </div>
</template>