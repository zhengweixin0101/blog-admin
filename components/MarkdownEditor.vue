<template>
  <client-only>
    <MdEditor v-model="localValue" />
  </client-only>
</template>

<script setup>
import { ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)

watch(localValue, val => emit('update:modelValue', val))

watch(() => props.modelValue, val => {
  if (val !== localValue.value) localValue.value = val
})
</script>