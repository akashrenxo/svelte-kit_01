<script lang="ts">
    import { websocketStore } from "$lib/stores/websocket";
    import { onMount } from "svelte";

    interface Supplier {
        id: string;
        name: string;
        trusted?: boolean;
        client?: string;
    }

    let suppliers: Supplier[] = [];
    let selectedSupplier = "";

    // Function to fetch suppliers
    const fetchSuppliers = () => {
        console.log("Fetching suppliers...");
        const message = {
            type: "action",
            action: "ListEntity",
            env: {
                user: "U005",
            },
            params: {
                entityName: "supplier",
            },
        };
        websocketStore.sendMessage(message);
        console.log("Sent WebSocket message:", message);
    };

    onMount(() => {
        console.log("Component mounted");
        // Add small delay to ensure WebSocket is ready
        setTimeout(() => {
            fetchSuppliers();
        }, 100);

        // Set up an interval to check connection and refetch if needed
        const interval = setInterval(() => {
            if (suppliers.length === 0) {
                console.log("No suppliers found, retrying...");
                fetchSuppliers();
            }
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    });

    // Reactive statement to handle WebSocket messages
    $: {
        console.log("WebSocket store updated:", $websocketStore.messages);
        if ($websocketStore.messages?.length) {
            const lastMessage =
                $websocketStore.messages[$websocketStore.messages.length - 1];
            console.log("Processing last message:", lastMessage);

            if (
                lastMessage?.action === "ListEntity" &&
                String(lastMessage?.result?.code) === "SUCCESS0200" &&
                lastMessage?.params?.result
            ) {
                try {
                    const resultData = lastMessage.params.result;
                    console.log("Received result data:", resultData);
                    if (resultData) {
                        suppliers = JSON.parse(resultData).map(
                            (supplier: any) => ({
                                id: supplier.id || "",
                                name: supplier.name || "Unknown",
                                trusted: supplier.trusted || false,
                                client: supplier.client || "Unknown",
                            }),
                        );
                        console.log("Parsed suppliers:", suppliers);
                    }
                } catch (error) {
                    console.error("Error parsing supplier data:", error);
                }
            }
        }
    }

    function handleSupplierChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        selectedSupplier = target.value;
    }
</script>

{#if suppliers.length > 0}
    <div class="mb-4">
        <div class="mb-3">
            <label for="supplier" class="label">Supplier</label>
            <select
                id="supplier"
                bind:value={selectedSupplier}
                on:change={handleSupplierChange}
                class="select select-bordered w-full"
            >
                <option value="">-- Select Supplier --</option>
                {#each suppliers as supplier (supplier.id)}
                    <option value={supplier.id}>{supplier.name}</option>
                {/each}
            </select>
        </div>
    </div>
{/if}
