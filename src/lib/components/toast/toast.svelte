<script lang="ts">
    import { toasts } from "$lib/stores/toastStore";
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    const icons = {
        success: `<svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>`,
        error: `<svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>`,
        info: `<svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 9.5A2.5 2.5 0 109.5 7 2.5 2.5 0 0012 9.5z"/>
        </svg>`,
        warning: `<svg class="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>`,
    };

    const bgColors = {
        success: "bg-emerald-50 border-emerald-200",
        error: "bg-red-50 border-red-200",
        info: "bg-blue-50 border-blue-200",
        warning: "bg-amber-50 border-amber-200",
    };
</script>

<div
    class="fixed top-4 right-4 z-50 flex flex-col gap-2 min-w-[320px] max-w-md pointer-events-none"
>
    {#each $toasts as { id, message, type }}
        <div
            class="pointer-events-auto"
            in:fly={{ x: 100, duration: 300, easing: quintOut }}
            out:fly={{ x: 100, duration: 300 }}
        >
            <div
                class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border {bgColors[
                    type
                ]}"
            >
                {@html icons[type]}
                <p class="text-sm font-medium text-gray-800 flex-grow">
                    {message}
                </p>
                <button
                    on:click={() =>
                        toasts.update((t) =>
                            t.filter((toast) => toast.id !== id),
                        )}
                    class="p-1 rounded-full hover:bg-black/5 transition-colors"
                    aria-label="Close notification"
                >
                    <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    {/each}
</div>
