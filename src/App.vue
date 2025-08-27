<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
</script>

<template>
    <div class="h-screen flex flex-col justify-center items-center">
        <div class="flex justify-center items-center mb-4 gap-4">
            <a
                href="https://vite.dev"
                target="_blank"
            >
                <img
                    src="/vite.svg"
                    class="logo"
                    alt="Vite logo"
                />
            </a>
            <a
                href="https://vuejs.org/"
                target="_blank"
            >
                <img
                    src="./assets/vue.svg"
                    class="logo vue"
                    alt="Vue logo"
                />
            </a>
        </div>

        <HelloWorld msg="Vite + Vue" />
    </div>
</template>
