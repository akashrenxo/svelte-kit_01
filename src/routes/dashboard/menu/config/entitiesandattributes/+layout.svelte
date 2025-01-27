<script lang="ts">
    import { websocketStore } from "$lib/stores/websocket";
    import { onMount } from "svelte";
    import { writable, derived, get } from "svelte/store";
    import Cookies from "js-cookie";

    interface Attribute {
        data_type: string;
        mandatory?: boolean;
        name: string;
        path: string | Record<string, string>;
        type: string;
    }

    interface EntityData {
        attributes: Attribute[];
        db: string;
        entity: string;
        table: string;
        type: string;
    }

    let isLoading = writable(false);
    let attributes = writable<EntityData[]>([]);
    let errorMessage = writable<string | null>(null);
    let wsInitialized = writable(false);
    let retryCount = 0;
    const MAX_RETRIES = 5;

    const searchQuery = writable("");
    const databaseQuery = writable("");
    const wsURL = Cookies.get("url") || "";
    const userId = Cookies.get("userId") || "";

    const filteredAttributes = derived(
        [attributes, searchQuery, databaseQuery],
        ([$attributes, $searchQuery, $databaseQuery]) => {
            const query = $searchQuery.toLowerCase();
            const dbFilter = $databaseQuery.toLowerCase();

            return $attributes
                .map((entityData) => ({
                    ...entityData,
                    attributes: entityData.attributes.filter((attribute) =>
                        attribute.name.toLowerCase().includes(query),
                    ),
                }))
                .filter(
                    (entityData) =>
                        (entityData.entity.toLowerCase().includes(query) ||
                            entityData.attributes.length > 0) &&
                        entityData.db.toLowerCase().includes(dbFilter),
                );
        },
    );

    const fetchEntities = async () => {
        if (!get(wsInitialized)) {
            console.log("WebSocket not initialized yet, waiting...");
            return;
        }

        isLoading.set(true);
        errorMessage.set(null);

        const message = {
            type: "action",
            action: "ListEntity",
            env: {
                user: userId,
            },
            params: {
                entityName: "entity",
            },
        };

        console.log("Sending message:", message);
        websocketStore.sendMessage(message);
    };

    const initializeSubscriptions = () => {
        websocketStore.subscribe((store) => {
            if (store.isConnected && !get(wsInitialized)) {
                wsInitialized.set(true);
                fetchEntities();
            }
        });

        websocketStore.subscribe((store) => {
            const messages = store.messages;
            if (messages?.length) {
                const lastMessage = messages[messages.length - 1];
                if (
                    lastMessage?.action === "ListEntity" &&
                    String(lastMessage?.result?.code) === "SUCCESS200"
                ) {
                    try {
                        const resultData = JSON.parse(
                            lastMessage?.params?.result || "{}",
                        ) as Record<string, EntityData>;

                        const transformedData = Object.entries(resultData).map(
                            ([entityKey, entityData]) => ({
                                entity: entityKey,
                                db: entityData.db,
                                table: entityData.table,
                                type: entityData.type,
                                attributes: entityData.attributes,
                            }),
                        );

                        if (transformedData.length > 0) {
                            attributes.set(transformedData);
                            errorMessage.set(null);
                            retryCount = 0;
                        } else {
                            errorMessage.set("No entities found in response.");
                        }
                        isLoading.set(false);
                    } catch (error) {
                        console.error("Error parsing response data:", error);
                        errorMessage.set("Failed to parse response data.");
                    }
                } else {
                    isLoading.set(false);
                    if (lastMessage?.result?.code !== "SUCCESS0200") {
                        errorMessage.set(
                            `Error: ${lastMessage?.result?.message || "Unknown error"}`,
                        );
                    }
                }
            }
        });
    };

    const initializeWebSocket = () => {
        if (!get(websocketStore).isConnected) {
            websocketStore.connect(wsURL, userId);
        }
    };

    onMount(() => {
        initializeWebSocket();
        initializeSubscriptions();

        const interval = setInterval(() => {
            if (get(attributes).length === 0 && retryCount < MAX_RETRIES) {
                retryCount++;
                fetchEntities();
            } else if (retryCount >= MAX_RETRIES) {
                clearInterval(interval);
                errorMessage.set("Failed to load data after multiple attempts");
            }
        }, 2000);

        return () => clearInterval(interval);
    });
</script>

<div class="p-2">
    {#if $isLoading}
        <div class="text-center text-gray-500">Loading attributes...</div>
    {/if}

    {#if !$isLoading && !$errorMessage && $attributes.length > 0}
        <div class="flex gap-4 mt-5">
            <div class="relative">
                <input
                    type="text"
                    id="searchQuery"
                    bind:value={$searchQuery}
                    placeholder="Search by attribute or entity..."
                    class="input input-bordered w-64 px-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34495E] text-sm"
                />
                <label for="searchQuery" class="sr-only"
                    >Search by attribute or entity...</label
                >
            </div>
            <div class="relative">
                <input
                    type="text"
                    id="databaseQuery"
                    bind:value={$databaseQuery}
                    placeholder="Filter by database..."
                    class="input input-bordered w-64 px-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34495E] text-sm"
                />
                <label for="databaseQuery" class="sr-only"
                    >Filter by database...</label
                >
            </div>
        </div>
        <table
            class="table-auto w-full border border-gray-200 shadow-lg text-sm mt-5"
        >
            <thead>
                <tr class="bg-[#34495E] text-white">
                    <th class="border border-gray-300 px-6 py-3 text-left"
                        >Entity</th
                    >
                    <th class="border border-gray-300 px-6 py-3 text-left"
                        >Database</th
                    >
                    <th class="border border-gray-300 px-6 py-3 text-left"
                        >Table</th
                    >
                    <th class="border border-gray-300 px-6 py-3 text-left"
                        >Type</th
                    >
                    <th class="border border-gray-300 px-6 py-3 text-left"
                        >Attributes</th
                    >
                </tr>
            </thead>
            <tbody>
                {#each $filteredAttributes as entityData}
                    {#if entityData.attributes.length > 0}
                        {#each entityData.attributes as attribute, index}
                            <tr
                                class="even:bg-gray-100 odd:bg-white hover:bg-gray-200 transition"
                            >
                                {#if index === 0}
                                    <td
                                        class="border border-gray-300 px-6 py-3 text-gray-800 font-medium align-top"
                                        rowspan={entityData.attributes.length}
                                    >
                                        {entityData.entity}
                                    </td>
                                    <td
                                        class="border border-gray-300 px-6 py-3 text-gray-800 font-medium align-top"
                                        rowspan={entityData.attributes.length}
                                    >
                                        {entityData.db}
                                    </td>
                                    <td
                                        class="border border-gray-300 px-6 py-3 text-gray-800 font-medium align-top"
                                        rowspan={entityData.attributes.length}
                                    >
                                        {entityData.table}
                                    </td>
                                    <td
                                        class="border border-gray-300 px-6 py-3 text-gray-800 font-medium align-top"
                                        rowspan={entityData.attributes.length}
                                    >
                                        {entityData.type}
                                    </td>
                                {/if}
                                <td
                                    class="border border-gray-300 px-4 py-2 text-gray-700"
                                >
                                    <div class="group">
                                        <span
                                            class="font-semibold text-sm hover:cursor-pointer"
                                            >{attribute.name}</span
                                        >
                                        <div
                                            class="absolute hidden group-hover:block right-5 bg-white shadow-lg border rounded-md p-2"
                                        >
                                            <span
                                                class="block px-2 py-2 hover:bg-gray-100 font-medium"
                                                ><span class=" text-black"
                                                    >Data Type:</span
                                                >
                                                {attribute.data_type}</span
                                            >
                                            <span
                                                class="block px-2 py-2 hover:bg-gray-100 font-medium"
                                                ><span class=" text-black"
                                                    >Mandatory:</span
                                                >
                                                {attribute.mandatory
                                                    ? "Yes"
                                                    : "No"}</span
                                            >
                                            <span
                                                class="block px-2 py-2 hover:bg-gray-100 font-medium"
                                                ><span class=" text-black"
                                                    >Path:</span
                                                >
                                                {attribute.path}</span
                                            >
                                            <span
                                                class="block px-2 py-2 hover:bg-gray-100 font-medium"
                                                ><span class=" text-black"
                                                    >Type:</span
                                                >
                                                {attribute.type}</span
                                            >
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    {/if}
                {/each}
            </tbody>
        </table>
    {/if}
</div>
<slot />
