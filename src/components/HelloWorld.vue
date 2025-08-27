<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ msg: string }>();

const count = ref(0);
</script>

<template>
    <div class="w-4xl mx-auto text-center">
        <div class="flex gap-4 flex-col">
            <h1>{{ msg }}</h1>

            <div class="flex flex-col gap-4">
                <div>
                    <button
                        type="button"
                        @click="count++"
                        class="py-2 px-4 bg-button-primary-default text-white rounded hover:bg-blue-600 transition-all duration-300 cursor-pointer"
                    >
                        count is {{ count }}
                    </button>
                </div>

                <p>
                    Edit
                    <code>components/HelloWorld.vue</code> to test HMR
                </p>
            </div>

            <div>
                <p>
                    Check out
                    <a
                        href="https://vuejs.org/guide/quick-start.html#local"
                        target="_blank"
                        >create-vue</a
                    >, the official Vue + Vite starter
                </p>
                <p>
                    Learn more about IDE Support for Vue in the
                    <a
                        href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
                        target="_blank"
                        >Vue Docs Scaling up Guide</a
                    >.
                </p>
                <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
            </div>
        </div>
    </div>
</template>
