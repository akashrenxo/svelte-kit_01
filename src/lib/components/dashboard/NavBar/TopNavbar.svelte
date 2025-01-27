<script>
  import dashboard from "$lib/../../src/assests/images/navbar/dashboard.png";
  import caret from "$lib/../../src/assests/images/navbar/caret.png";
  import notificationbell from "$lib/../../src/assests/images/navbar/notificationBell.png";
  import profileIcon from "$lib/../../src/assests/images/navbar/profileIcon01.png";
  import hamburgerButton from "$lib/../../src/assests/images/navbar/hamburgerButton.png";
  import lanuage from "$lib/../../src/assests/images/navbar/language.png";
  import Cookies from "js-cookie";
  import { onMount } from "svelte";
  import SeachBar from "./SeachBar.svelte";
  import {
    menuItems,
    isConnected,
    fetchMenuItems,
  } from "$lib/stores/apiStores/menuStores";
  import { websocketStore } from "$lib/stores/websocket";
  import { goto } from "$app/navigation";

  function closeDrawer() {
    const drawerInput = document.getElementById("my-drawer");
    if (drawerInput && drawerInput instanceof HTMLInputElement) {
      drawerInput.checked = false;
    } else {
      console.error(
        "Drawer input element not found or is not an input element.",
      );
    }
  }
  const wsURL = Cookies.get("url") || "";
  const userId = Cookies.get("userId") || "";

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

<div
  class=" p-3 font-inter text-sm flex flex-row space-x-3 justify-between items-center sticky top-0 bg-white z-20 border border-b-gray-200 font-poppins"
>
  <div class="flex flex-row items-center space-x-3 font-inter font-extrabold">
    <div class="drawer">
      <input id="my-drawer" type="checkbox" class="drawer-toggle" />

      <div class="drawer-content">
        <label for="my-drawer" class=" hover:cursor-pointer">
          <img src={hamburgerButton} alt="hamburgerButton" class=" h-10" />
        </label>
      </div>

      <div class="drawer-side" style="transform: translateZ(0);">
        <label
          for="my-drawer"
          aria-label="close sidebar"
          class="drawer-overlay"
          style="backface-visibility: hidden;"
        ></label>
        <ul class="min-h-full w-80 p-4">
          {#if $isConnected}
            <div class="mb-4">
              {#if $menuItems.length}
                <ul class="space-y-3 rounded-md p-4 bg-white">
                  {#each $menuItems as item (item.id)}
                    <li class="rounded-lg text-base text-gray-700">
                      <button
                        class="p-4 flex justify-between items-center"
                        on:click={() => {
                          const menuItem = item.menu
                            .toLowerCase()
                            .replace(/\s+/g, "");
                          closeDrawer();
                          goto(`/dashboard/menu/${menuItem}`);
                        }}
                      >
                        <span class="font-medium ml-4">{item.menu}</span>
                      </button>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="text-gray-500 italic">No menu items available.</p>
              {/if}
            </div>
          {/if}
        </ul>
      </div>
    </div>

    <img src={dashboard} alt="logo" class="h-10" />
    <span class=" text-xl font-bold">RenxoTech</span>
  </div>

  <div class="flex flex-row items-center space-x-3 font-medium">
    <div class="group hover:cursor-pointer">
      <div class=" flex flex-row items-center p-3 text-base">
        <button class="">Services</button>
        <img src={caret} alt="caret" class="h-3 pl-1.5" />
      </div>
      <div
        class="absolute hidden group-hover:block w-48 bg-white shadow-lg border rounded-md p-2"
      >
        <a href="/" class="block px-2 py-2 hover:bg-gray-100">WMS</a>
        <a href="/" class="block px-2 py-2 hover:bg-gray-100"
          >android development</a
        >
        <a href="/" class="block px-2 py-2 hover:bg-gray-100">app development</a
        >
      </div>
    </div>
    <a href="/" class=" hover:cursor-pointer p-3 text-base">about</a>
    <a href="/" class=" hover:cursor-pointer p-3 text-base">contact</a>
  </div>
  <div class="flex flex-row items-center space-x-5">
    <div class="max-w-md mx-auto">
      <SeachBar />
    </div>
    <button
      class="bg-[#34495E] hover:bg-[#34495E] transition-all duration-200 ease-in-out text-white py-2 px-6 rounded-xl hover:cursor-pointer"
      >message</button
    >
    <button
      class="bg-[#34495E] hover:bg-[#34495E] transition-all duration-200 ease-in-out text-white py-2 px-6 rounded-xl hover:cursor-pointer"
      >Sign in</button
    >
    <img
      src={notificationbell}
      alt="notificationbell"
      class=" h-5 hover:cursor-pointer"
    />
    <img src={lanuage} alt="language" class=" h-7 hover:cursor-pointer" />
    <img
      src={profileIcon}
      alt="logo"
      class=" rounded-full h-10 hover:cursor-pointer"
    />
  </div>
</div>
