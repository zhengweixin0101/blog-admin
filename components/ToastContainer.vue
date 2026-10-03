<template>
  <div class="fixed bottom-5 right-5 z-500 flex flex-col items-end gap-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="relative overflow-hidden min-w-40 max-w-sm bg-blue-500 text-white rounded shadow-lg px-4 py-3"
      >
        <span class="relative z-1 block text-base font-medium break-words whitespace-pre-line">{{ item.message }}</span>

        <span
          v-if="item.duration"
          class="toast-progress absolute inset-0 bg-black/5"
          :style="{ animationDuration: item.duration + 'ms' }"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '~/composables/useToast.js'

const { toasts } = useToast()
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.25s ease;
}

.toast-leave-active {
  transition: all 0.25s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.toast-move {
  transition: all 0.25s ease;
}

.toast-progress {
  transform-origin: left;
  animation-name: toast-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes toast-progress {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}
</style>