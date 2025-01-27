<script>
    import SubMenu from "$lib/components/dashboard/subMenu/subMenu.svelte";
    let menuName = "Inbound";
</script>

<main>
    <div class=" grid grid-cols-11 font-poppins">
        <div class=" col-span-3">
            <SubMenu {menuName} />
        </div>
        <div class=" col-span-8 bg-gray-100 rounded-md">
            <slot />
        </div>
    </div>
</main>

