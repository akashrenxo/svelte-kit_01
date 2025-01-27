<script lang="ts">
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    export let entityName: string;
    export let isDeleteModalOpen: boolean;
    export let selectedEntityId: string;

    const { deleteEntity, fetchEntities } = entityStore(entityName);

    const handleDelete = async () => {
        console.log("selectedEntityId:", selectedEntityId);
        if (!selectedEntityId) return;
        try {
            await deleteEntity(selectedEntityId);
            closeModal();
        } catch (error) {
            console.error("Error deleting entity:", error);
        }
    };

    const closeModal = () => {
        isDeleteModalOpen = false;
    };

</script>

<div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-sm"
>
    <div class="bg-white rounded-lg shadow-lg p-6 w-[400px]">
        <h2 class="text-base font-medium mb-4">Delete {entityName}</h2>
        <p class="mb-4">
            Are you sure you want to delete ? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-4">
            <button
                type="button"
                class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                on:click={closeModal}
            >
                Cancel
            </button>
            <button
                type="button"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                on:click={handleDelete}
            >
                Delete
            </button>
        </div>
    </div>
</div>
