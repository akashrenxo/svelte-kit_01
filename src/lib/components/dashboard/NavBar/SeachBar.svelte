<script lang="ts">
    import { goto } from "$app/navigation";
    import { menuItems } from "$lib/stores/apiStores/menuStores";
    import { onMount } from "svelte";
    import type { MenuItem } from "$lib/stores/apiStores/menuStores";
    let searchTerm = "";
    let searchResults: Array<{
        id: string;
        menu: string;
        parentMenu?: string;
    }> = [];
    let showResults = false;
    let searchRef: HTMLDivElement;
    function flattenMenuItems(
        items: MenuItem[],
        parentMenu?: string,
    ): Array<{ id: string; menu: string; parentMenu?: string }> {
        return items.reduce(
            (acc, item) => {
                acc.push({
                    id: item.id,
                    menu: item.menu,
                    parentMenu,
                });
                if (item.submenu && item.submenu.length > 0) {
                    acc.push(...flattenMenuItems(item.submenu, item.menu));
                }
                return acc;
            },
            [] as Array<{ id: string; menu: string; parentMenu?: string }>,
        );
    }
    function handleSearch(term: string) {
        const trimmed = term.trim();
        if (!trimmed) {
            searchResults = [];
            return;
        }
        const allItems = flattenMenuItems($menuItems);
        searchResults = allItems.filter((item) =>
            item.menu.toLowerCase().includes(trimmed.toLowerCase()),
        );
        showResults = true;
    }
    function handleMenuItemClick(item: {
        id: string;
        menu: string;
        parentMenu?: string;
    }) {
        if (item.parentMenu) {
            const parentPath = item.parentMenu
                .toLowerCase()
                .replace(/\s+/g, "");
            const menuPath = item.menu.toLowerCase().replace(/\s+/g, "");
            goto(`/dashboard/menu/${parentPath}/${menuPath}`);
        } else {
            const menuPath = item.menu.toLowerCase().replace(/\s+/g, "");
            goto(`/dashboard/menu/${menuPath}`);
        }
        showResults = false;
        searchTerm = "";
    }
    function handleKeyDown(
        event: KeyboardEvent,
        item: {
            id: string;
            menu: string;
            parentMenu?: string;
        },
    ) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleMenuItemClick(item);
        }
    }
    function onSearchChange(e: Event) {
        const target = e.target as HTMLInputElement;
        searchTerm = target.value;
        handleSearch(searchTerm);
    }
    function handleClickOutside(event: MouseEvent) {
        if (searchRef && !searchRef.contains(event.target as Node)) {
            showResults = false;
        }
    }
    onMount(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    });
</script>

<div class="relative" bind:this={searchRef}>
    <div
        class="flex items-center w-full h-10 rounded-3xl bg-white overflow-hidden border border-gray-300 scrollbar-hide"
        role="search"
        aria-label="Search menu items"
    >
        <div class="grid place-items-center h-full w-12 text-gray-700 pl-3">
            <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
        </div>
        <input
            class="peer h-full w-full outline-none text-sm pl-3"
            type="search"
            placeholder="Search menu items..."
            bind:value={searchTerm}
            on:input={onSearchChange}
            aria-label="Search menu items"
        />
        <button
            type="button"
            class="bg-[#34495E] text-white h-10 px-8 transition-all duration-200 ease-in-out"
            on:click={() => handleSearch(searchTerm)}
            aria-label="Perform search"
        >
            Search
        </button>
    </div>
    {#if showResults && searchResults.length > 0}
        <div
            class="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
            role="listbox"
            aria-label="Search results"
        >
            {#each searchResults as result (result.id)}
                <button
                    type="button"
                    class="w-full px-4 py-2 hover:bg-gray-100 text-left"
                    on:click={() => handleMenuItemClick(result)}
                    on:keydown={(e) => handleKeyDown(e, result)}
                    role="option"
                    aria-label={`${result.menu} under ${result.parentMenu || "main menu"}`}
                    aria-selected="false"
                >
                    <div class="flex items-center justify-between">
                        <span class="text-gray-800">{result.menu}</span>
                        {#if result.parentMenu}
                            <span class="text-gray-500 text-sm"
                                >{result.parentMenu}</span
                            >
                        {/if}
                    </div>
                </button>
            {/each}
        </div>
    {/if}
    {#if showResults && searchTerm && searchResults.length === 0}
        <div
            class="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-50 p-4"
            role="status"
            aria-live="polite"
        >
            <p class="text-gray-500">No matching menu items found</p>
        </div>
    {/if}
</div>
