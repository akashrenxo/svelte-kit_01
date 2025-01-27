<script lang="ts">
    export let entityName: string;
    export let isViewDetailsModalOpen: boolean;
    export let detailedEntity: any;

    const closeViewDetailsModal = () => {
        isViewDetailsModalOpen = false;
        detailedEntity = null;
    };
</script>

<div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-sm"
>
    <div class="bg-white rounded-lg shadow-lg max-w-xl w-full">
        <div
            class="text-[#34495E] bg-white border-b border-gray-500 px-6 py-4 flex justify-between items-center rounded-t-lg"
        >
            <h3 class="text-base font-medium">{entityName} Entity Details</h3>
            <button
                class="text-white hover:text-gray-300"
                on:click={closeViewDetailsModal}
            >
                ✕
            </button>
        </div>
        <div class="p-6 space-y-4">
            {#each Object.keys(detailedEntity || {}) as key}
                {#if !key.toLowerCase().includes("inventory") && !key
                        .toLowerCase()
                        .includes("id")}
                    <div class="flex justify-between items-start border-b pb-2">
                        <span class="font-semibold text-gray-700">
                            {key.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span class="text-gray-600">
                            {#if typeof detailedEntity[key] === "object" && detailedEntity[key] !== null}
                                <div class="bg-gray-100 p-2 rounded w-72">
                                    {#each Object.entries(detailedEntity[key]) as [subKey, subValue]}
                                        <div
                                            class="flex justify-between gap-20 text-sm items-start border-b pb-1"
                                        >
                                            <span
                                                class="font-medium text-gray-600"
                                            >
                                                {subKey
                                                    .replace(/_/g, " ")
                                                    .toUpperCase()}
                                            </span>
                                            <span>{subValue}</span>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                {detailedEntity[key]}
                            {/if}
                        </span>
                    </div>
                {/if}
            {/each}
        </div>
        <div class="bg-gray-100 px-6 py-3 rounded-b-lg flex justify-end">
            <button
                class="bg-[#34495E] text-white px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition"
                on:click={closeViewDetailsModal}
            >
                Close
            </button>
        </div>
    </div>
</div>
