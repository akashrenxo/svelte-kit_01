<script>
    import SubMenu from "$lib/components/dashboard/subMenu/subMenu.svelte";
    import { slide } from "svelte/transition";
    import Toast from "$lib/components/toast/toast.svelte";

    let menuName = "Master Data";
    let isMenuVisible = true;

    function toggleMenu() {
        isMenuVisible = !isMenuVisible;
    }
</script>

<main>
    <div class="grid grid-cols-12 font-poppins relative">
        <button
            class="absolute top-4 {isMenuVisible
                ? 'left-[23%]'
                : 'left-2'}  bg-white p-2 rounded-full shadow-md transition-all duration-300"
            on:click={toggleMenu}
        >
            {#if isMenuVisible}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            {:else}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            {/if}
        </button>

        {#if isMenuVisible}
            <div
                class="col-span-3 transition-all duration-300"
                transition:slide={{ duration: 300 }}
            >
                <SubMenu {menuName} />
            </div>
        {/if}

        <div
            class="{isMenuVisible
                ? 'col-span-9'
                : 'col-span-12'} bg-gray-50 rounded-md transition-all duration-600 px-6 py-4"
        >
            <Toast />
            <slot />
        </div>
    </div>
</main>

<style>
    :global(.transition-all) {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
</style>
