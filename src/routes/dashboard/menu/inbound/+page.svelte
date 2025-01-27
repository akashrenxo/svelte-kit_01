<!-- <script lang="ts">
    import { goto } from '$app/navigation';
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
  
    export let isConnected: boolean;
    export let menuItems: { id: string; menu: string }[] = [];
    
    let isOpen = false;
  
    function toggleSidebar() {
      isOpen = !isOpen;
    }
  
    function handleMenuItemClick(menuItem: string) {
      const formattedMenuItem = menuItem.toLowerCase().replace(/\s+/g, '');
      goto(`/dashboard/menu/${formattedMenuItem}`);
      if (window.innerWidth < 1024) {
        toggleSidebar();
      }
    }
  </script>
  
  <button
    on:click={toggleSidebar}
    class="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors duration-200"
    aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
    </svg>
  </button>
  
  <div class="relative z-40 lg:hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
    {#if isOpen}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-in-out duration-300"></div>
    {/if}
  
    <div class="fixed inset-0 overflow-hidden">
      <div class="absolute inset-0 overflow-hidden">
        <div class="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
          {#if isOpen}
            <div
              transition:fly={{ x: -100, duration: 300, easing: quintOut }}
              class="pointer-events-auto relative w-screen max-w-md"
            >
              <div class="flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                <div class="px-4 sm:px-6">
                  <div class="flex items-start justify-between">
                    <h2 class="text-2xl font-semibold leading-6 text-gray-900" id="slide-over-title">Menu</h2>
                    <div class="ml-3 flex h-7 items-center">
                      <button
                        on:click={toggleSidebar}
                        class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        <span class="sr-only">Close panel</span>
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="relative mt-6 flex-1 px-4 sm:px-6">
                  {#if isConnected}
                    {#if menuItems.length}
                      <ul class="space-y-3 rounded-md p-4 bg-gray-50">
                        {#each menuItems as item (item.id)}
                          <li
                            in:fly={{ y: 20, duration: 300, delay: 100 * menuItems.indexOf(item), easing: quintOut }}
                            class="rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <button
                              class="w-full p-4 flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                              on:click={() => handleMenuItemClick(item.menu)}
                            >
                              <span class="text-gray-700 font-medium">{item.menu}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                              </svg>
                            </button>
                          </li>
                        {/each}
                      </ul>
                    {:else}
                      <p class="text-gray-500 italic text-center py-8">No menu items available.</p>
                    {/if}
                  {:else}
                    <div class="text-center py-8">
                      <p class="text-gray-500 mb-4">Please connect to view menu items.</p>
                      <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                        Connect
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
  
  <div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
    <div class="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
      <div class="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div class="flex flex-shrink-0 items-center px-4">
          <h2 class="text-2xl font-semibold text-gray-900">Menu</h2>
        </div>
        <nav class="mt-5 flex-1 space-y-1 bg-white px-2">
          {#if isConnected}
            {#if menuItems.length}
              <ul class="space-y-3 rounded-md p-4 bg-gray-50">
                {#each menuItems as item (item.id)}
                  <li class="rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200">
                    <button
                      class="w-full p-4 flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      on:click={() => handleMenuItemClick(item.menu)}
                    >
                      <span class="text-gray-700 font-medium">{item.menu}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-gray-500 italic text-center py-8">No menu items available.</p>
            {/if}
          {:else}
            <div class="text-center py-8">
              <p class="text-gray-500 mb-4">Please connect to view menu items.</p>
              <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                Connect
              </button>
            </div>
          {/if}
        </nav>
      </div>
    </div>
  </div> -->