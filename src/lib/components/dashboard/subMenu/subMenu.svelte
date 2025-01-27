<script lang="ts">
    import { onMount } from "svelte";
    import Cookies from "js-cookie";
    import {
        menuItems,
        fetchMenuItems,
        isConnected,
    } from "$lib/stores/apiStores/menuStores";
    import { websocketStore } from "$lib/stores/websocket";
    import { goto } from "$app/navigation";

    export let menuName: string;
    const userId = Cookies.get("userId") || "";
    const wsURL = Cookies.get("url") || "";

    onMount(() => {
        websocketStore.connect(wsURL, userId);
        setTimeout(() => {
            fetchMenuItems();
        }, 100);

        const interval = setInterval(() => {
            menuItems.subscribe((items) => {
                if (items.length === 0) {
                    console.log("Retrying fetch due to empty menu items...");
                    fetchMenuItems();
                } else {
                    console.log("Menu items loaded, clearing interval");
                    clearInterval(interval);
                }
            });
        }, 2000);

        return () => {
            console.log("Cleaning up on unmount...");
            clearInterval(interval);
        };
    });
</script>

<main>
    <ul class=" h-full w-80 p-6 bg-gray-50 rounded-lg">
        {#if $isConnected}
            <div class="mb-4">
                {#if $menuItems.length}
                    <ul class="space-y-3">
                        {#each $menuItems.filter((item) => item.menu === menuName) as item (item.id)}
                            {#if item.submenu}
                                {#each item.submenu as submenu (submenu.id)}
                                    <li
                                        class="bg-white rounded-lg shadow-sm hover:bg-indigo-50 transition duration-300"
                                    >
                                        <button
                                            class="w-full p-4 flex justify-between items-center text-left text-gray-800 hover:text-[#34495E]"
                                            on:click={() => {
                                                const menuItem = submenu.menu
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "");

                                                const menuname = menuName
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "");

                                                goto(
                                                    `/dashboard/menu/${menuname}/${menuItem}`,
                                                );
                                            }}
                                        >
                                            <span class="font-medium ml-4"
                                                >{submenu.menu}</span
                                            >
                                        </button>
                                    </li>
                                {/each}
                            {/if}
                        {/each}
                    </ul>
                {:else}
                    <p class="text-gray-500 italic">No menu items available.</p>
                {/if}
            </div>
        {/if}
    </ul>
</main>
