<script lang="ts">
    import TopNavbar from "$lib/components/dashboard/NavBar/TopNavbar.svelte";
    import Navbar from "$lib/components/dashboard/NavBar/Navbar.svelte";
</script>

<div>
    <TopNavbar />
    <Navbar />
    <main class="p-4">
        <slot />
    </main>
</div>
