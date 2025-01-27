<!-- <script lang="ts">
    import { createEntityStore } from "$lib/stores/apiStores/entityStores";
    import { websocketStore } from "$lib/stores/websocket";
    import { goto } from "$app/navigation";
    import Cookies from "js-cookie";
    import { onMount } from "svelte";
    import { suppliers } from "$lib/stores/apiStores/supplierStore";
    // export let entityName: string;

    const wsURL = Cookies.get("url") || "";
    const userId = Cookies.get("userId") || "";

    onMount(() => {
        websocketStore.connect(wsURL, userId);
        setTimeout(() => {
            fetchEntities();
            fetchEntityAttributes();
            let sendMessage = {
                name: "testing02",
                client: "testing_client",
                trusted: true
            };
            let primary = "98182e40-f055-4389-b64c-4625150027d1";
            // addEntity(sendMessage);
            editEntity(primary, sendMessage)
        }, 100);

        const interval = setInterval(() => {}, 2000);

        return () => {
            console.log("Cleaning up on unmount...");
            clearInterval(interval);
        };
    });
    const {
        entities,
        isConnected,
        messageModal,
        fetchEntities,
        addEntity,
        editEntity,
        deleteEntity,
        fetchEntityAttributes,
    } = createEntityStore("supplier");

    // fetchEntities();
</script> -->
