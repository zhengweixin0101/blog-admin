<template>
  <textarea v-model="modelValue" class="border p-2 w-full h-96"></textarea>
</template>

<script setup>
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>
