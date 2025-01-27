<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        setupInactivityTracker,
        cleanupInactivityTracker,
    } from "$lib/utils/auth";
    import { refreshAccessToken } from "$lib/utils/auth";

    onMount(() => {
        setupInactivityTracker();
    });

    onDestroy(() => {
        cleanupInactivityTracker();
    });

    const navItems = [
        { href: "/", label: "Service Details" },
        { href: "/edit-deploy", label: "Edit and Deploy" },
        { href: "/setup-deployment", label: "Setup Deployment" },
        { href: "/test", label: "Test" },
    ];

    let interval: ReturnType<typeof setInterval>;

    const REFRESH_INTERVAL = 27 * 60 * 1000;

    onMount(() => {
        interval = setInterval(() => {
            refreshAccessToken();
        }, REFRESH_INTERVAL);
    });

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

<nav class="bg-white shadow-lg sticky top-[4.6rem] z-10 font-poppins">
    <div class="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-4">
        <div class="flex items-center justify-between h-16">
            <div class="flex items-center">
                <a href="/" class="flex-shrink-0">
                    <span class="text-md font-semibold text-gray-900">
                        WAREHOUSE MANAGEMENT SYSTEM
                    </span>
                </a>
            </div>
            <div class="flex items-baseline space-x-4">
                {#each navItems as { href, label }}
                    <a
                        href="/"
                        class="px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                    >
                        {label}
                    </a>
                {/each}
            </div>
        </div>
    </div>
</nav>
