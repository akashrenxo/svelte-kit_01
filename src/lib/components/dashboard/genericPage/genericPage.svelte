<script lang="ts">
    import edit from "$lib/../../src/assests/images/supplier/edit.png";
    import deleteButton from "$lib/../../src/assests/images/supplier/deleteButton.png";
    import sortingArrows from "$lib/../../src/assests/images/genericPage/sortingArrows.png";
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import { onMount } from "svelte";
    import { websocketStore } from "$lib/stores/websocket";
    import Cookies from "js-cookie";
    import { writable, get } from "svelte/store";
    import AddModal from "./modals/addModal/addModal.svelte";
    import DeleteModal from "./modals/deleteModal/deleteModal.svelte";
    import ViewModal from "./modals/viewModal/viewModal.svelte";
    import FilterModal from "./modals/filterModal/filterModal.svelte";
    import EditModal from "./modals/editModal/editModal.svelte";
    import Loader from "../loader/loader.svelte";

    const wsURL = Cookies.get("url") || "";
    const userId = Cookies.get("userId") || "";

    export let entityName: string;

    let isAddModalOpen: boolean = false;
    let isFilterModalOpen: boolean = false;
    let isEditModalOpen: boolean = false;
    let isDeleteModalOpen: boolean = false;
    let selectedEntity: any = null;
    let selectedEntityId: any = null;
    let selectedPrimaryKeyName: any = null;
    let isViewDetailsModalOpen = false;
    let detailedEntity: any = null;
    let limit: number = 3;
    let nextOffset: number = 0;
    let requestId: string = "";
    let currentPage: any = 1;

    const {
        requestid,
        hasmore,
        totalrecords,
        totalfetched,
        entitiesData,
        attributes,
        isConnected,
        fetchEntities,
        fetchEntityAttributes,
    } = entityStore(entityName);

    let entity_address = entityName + "_address";

    const openEditModal = (entity: any) => {
        const idAttribute = $attributes.find((attr) => attr.data_type === "id");
        if (!idAttribute) {
            console.error("No attribute with data_type 'id' found.");
            alert(
                "Unable to delete record: Missing primary key configuration.",
            );
            return;
        }
        const primaryKeyName = idAttribute.name;
        const primaryKeyValue = entity[primaryKeyName];
        selectedPrimaryKeyName = primaryKeyName;
        selectedEntityId = primaryKeyValue;
        selectedEntity = entity;
        isEditModalOpen = true;
    };

    const openDeleteModal = (entity: any) => {
        const idAttribute = $attributes.find((attr) => attr.data_type === "id");
        if (!idAttribute) {
            console.error("No attribute with data_type 'id' found.");
            alert(
                "Unable to delete record: Missing primary key configuration.",
            );
            return;
        }
        const primaryKeyName = idAttribute.name;
        const primaryKeyValue = entity[primaryKeyName];
        selectedEntityId = primaryKeyValue;
        isDeleteModalOpen = true;
    };

    const openViewDetailsModal = (entity: any) => {
        detailedEntity = entity;
        isViewDetailsModalOpen = true;
    };

    onMount(() => {
        let connectionAttempts = 0;
        const maxAttempts = 5;
        const attemptInterval = 5000;

        const attemptConnection = async () => {
            if (!$isConnected && connectionAttempts < maxAttempts) {
                console.log(
                    `Connection attempt ${connectionAttempts + 1} of ${maxAttempts}`,
                );
                try {
                    await websocketStore.connect(wsURL, userId);
                    connectionAttempts++;
                } catch (error) {
                    console.error("Connection error:", error);
                }
            }
        };

        const fetchData = async () => {
            if ($isConnected) {
                try {
                    await fetchEntityAttributes();
                    await fetchEntities(limit, nextOffset, requestId);
                    console.log("Data fetched successfully");
                    return true;
                } catch (error) {
                    console.error("Error fetching data:", error);
                    return false;
                }
            }
            return false;
        };

        const initialize = async () => {
            while (connectionAttempts < maxAttempts && !$isConnected) {
                await attemptConnection();
                if ($isConnected) {
                    break;
                }
                await new Promise((resolve) =>
                    setTimeout(resolve, attemptInterval),
                );
            }

            if ($isConnected) {
                const dataFetched = await fetchData();
                if (!dataFetched) {
                    console.log("Retrying data fetch...");
                    await fetchData();
                }
            } else {
                console.error(
                    "Max connection attempts reached. Could not connect.",
                );
            }
        };

        initialize();

        return () => {
            console.log("Component unmounted. Cleaning up...");
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", stopResize);
        };
    });

    $: {
        if ($isConnected) {
            fetchEntityAttributes();
            fetchEntities(limit, nextOffset, requestId);
        }
    }

    // ************************** handle drag and drop of columns ****************************//
    let draggedColumn: string | null = null;
    let dragOverColumn: string | null = null;
    let columnOrder = writable<string[]>([]);

    $: {
        if (
            $attributes &&
            $attributes.length > 0 &&
            $columnOrder.length === 0
        ) {
            columnOrder.set($attributes.map((attr) => attr.name));
        }
    }

    function handleDragStart(event: DragEvent, column: string) {
        if (!event.dataTransfer) return;
        draggedColumn = column;
        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(event: DragEvent, column: string) {
        event.preventDefault();
        if (column !== draggedColumn) {
            dragOverColumn = column;
        }
    }

    function handleDragLeave() {
        dragOverColumn = null;
    }

    function handleDrop(event: DragEvent, targetColumn: string) {
        event.preventDefault();
        if (!draggedColumn || draggedColumn === targetColumn) {
            draggedColumn = null;
            dragOverColumn = null;
            return;
        }

        const currentColumns = [...$columnOrder];
        const draggedIdx = currentColumns.indexOf(draggedColumn);
        const targetIdx = currentColumns.indexOf(targetColumn);

        currentColumns.splice(draggedIdx, 1);
        currentColumns.splice(targetIdx, 0, draggedColumn);

        columnOrder.set(currentColumns);
        draggedColumn = null;
        dragOverColumn = null;
    }

    function handleDragEnd() {
        draggedColumn = null;
        dragOverColumn = null;
    }
    //********************************************************************************************//

    //************************************ Resizing columns **************************************//
    let currentColumnIndex: number | null = null;
    let startX: number;
    let startWidth: number;
    let columnWidths = writable<{ [key: string]: number }>({});
    let isResizing = false;

    // Initialize column order and widths
    $: if ($attributes?.length > 0 && $columnOrder.length === 0) {
        columnOrder.set($attributes.map((attr) => attr.name));
    }
    $: if ($attributes?.length > 0) {
        columnWidths.update((widths) => {
            const newWidths = { ...widths };
            $attributes.forEach((attr) => {
                if (!newWidths[attr.name]) {
                    const width =
                        attr.data_type === "id"
                            ? 300
                            : attr.data_type === "text"
                              ? 300
                              : attr.data_type === "date"
                                ? 300
                                : 300;
                    newWidths[attr.name] = width;
                }
            });
            return newWidths;
        });
    }

    function startResize(columnName: string, event: MouseEvent) {
        event.preventDefault();
        currentColumnIndex = $columnOrder.indexOf(columnName);
        startX = event.pageX;
        startWidth = $columnWidths[columnName] || 150;
        isResizing = true;

        document.body.classList.add("select-none");
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", stopResize);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isResizing || currentColumnIndex === null) return;
        const columnName = $columnOrder[currentColumnIndex];
        const diff = event.pageX - startX;
        const newWidth = Math.max(100, startWidth + diff);

        columnWidths.update((widths) => ({
            ...widths,
            [columnName]: newWidth,
        }));
    }

    function stopResize() {
        isResizing = false;
        currentColumnIndex = null;
        document.body.classList.remove("select-none");
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResize);
    }

    //*******************************************************************************************//
</script>

{#if $isConnected}
    <div class="max-w-[90%] mx-auto mt-10 font-sans text-sm">
        <div class="flex justify-between items-center mb-6 font-sans">
            <div class="flex items-center gap-2">
                <select
                    id="limit"
                    class="px-2 py-2 text-sm border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    bind:value={limit}
                >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                </select>
                <label for="entries" class="text-gray-600 text-sm">
                    : Entries per page
                </label>
            </div>
            <div class="flex gap-4 font-poppins text-sm">
                <button
                    class="bg-[#34495E] text-white px-4 py-2 rounded-lg shadow transition-all"
                    on:click={() => {
                        isFilterModalOpen = true;
                    }}
                >
                    Filter
                </button>
                <button
                    class="bg-[#00B894] text-white px-4 py-2 rounded-lg shadow transition-all"
                    on:click={() => {
                        isAddModalOpen = true;
                    }}
                >
                    Add {entityName}
                </button>
            </div>
        </div>

        <!-- Table Container -->
        <div
            class="overflow-x-auto border border-gray-300 rounded-lg shadow-md h-[450px] scrollbar-beautiful"
        >
            <table
                class="table-auto min-w-[800px] w-full text-sm text-gray-700 bg-white"
                style="border-collapse: collapse;"
            >
                <thead class="sticky top-0 bg-gray-50 border-b border-gray-300">
                    <tr>
                        <th
                            class="py-4 px-4 text-start font-semibold border-r border-gray-300 last:border-r-0 min-w-[120px]"
                        >
                            ACTIONS
                        </th>
                        {#each $columnOrder as columnName}
                            <th
                                draggable={true}
                                on:dragstart={(e) =>
                                    handleDragStart(e, columnName)}
                                on:dragover={(e) =>
                                    handleDragOver(e, columnName)}
                                on:dragleave={handleDragLeave}
                                on:drop={(e) => handleDrop(e, columnName)}
                                on:dragend={handleDragEnd}
                                style="width: {$columnWidths[
                                    columnName
                                ]}px; min-width: {$columnWidths[columnName]}px"
                                class="relative py-4 px-3 text-left font-semibold border-r border-gray-300 last:border-r-0 select-none transition-all duration-200 ease-in-out column-header
                                {draggedColumn === columnName
                                    ? 'bg-blue-100'
                                    : 'hover:bg-gray-200'}
                                {dragOverColumn === columnName
                                    ? 'bg-blue-50'
                                    : ''}
                                {isResizing
                                    ? 'select-none'
                                    : 'cursor-grab active:cursor-grabbing'}"
                            >
                                <div class="flex flex-row items-center gap-2">
                                    <span>
                                        {columnName
                                            .replace(/_/g, " ")
                                            .toUpperCase()}
                                    </span>
                                    <img
                                        src={sortingArrows}
                                        alt="sortingArrows"
                                        class="h-4 hover:cursor-pointer"
                                    />
                                </div>
                                <div
                                    class="resize-handle"
                                    class:active={isResizing &&
                                        currentColumnIndex ===
                                            $columnOrder.indexOf(columnName)}
                                    on:mousedown={(e) =>
                                        startResize(columnName, e)}
                                    role="button"
                                    tabindex="0"
                                    aria-label="Resize column"
                                ></div>
                            </th>
                        {/each}
                    </tr>
                </thead>

                <tbody>
                    {#if $entitiesData.length > 0}
                        {#each $entitiesData as entity}
                            <tr
                                class="bg-white even:bg-gray-50 hover:bg-gray-200 duration-150 border-b border-gray-300 last:border-b-0"
                            >
                                <td
                                    class="py-3 px-2 border-r border-gray-300 last:border-r-0"
                                    style="min-width:120px; white-space:nowrap;"
                                >
                                    <div
                                        class="flex items-center justify-start space-x-7 ml-1"
                                    >
                                        <button
                                            type="button"
                                            class="text-blue-500 hover:text-blue-700 transition duration-150 ease-in-out"
                                            on:click={() =>
                                                openEditModal(entity)}
                                        >
                                            <img
                                                src={edit}
                                                alt="Edit"
                                                class="h-5 inline"
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            class="text-red-500 hover:text-red-700 transition duration-150 ease-in-out"
                                            on:click={() =>
                                                openDeleteModal(entity)}
                                        >
                                            <img
                                                src={deleteButton}
                                                alt="Delete"
                                                class="h-5 inline"
                                            />
                                        </button>
                                    </div>
                                </td>
                                {#each $columnOrder as columnName}
                                    <td
                                        class="py-3 px-4 text-sm whitespace-nowrap hover:cursor-pointer border-r border-gray-300 last:border-r-0"
                                        style="width: {$columnWidths[
                                            columnName
                                        ]}px; min-width: {columnName.length +
                                            150}px"
                                        on:click={() =>
                                            openViewDetailsModal(entity)}
                                    >
                                        {#if typeof entity[columnName] === "object" && entity[columnName] !== null}
                                            {#if columnName === entity_address}
                                                {#each ["line", "city", "state", "country", "zip"] as key, i}
                                                    {#if entity[columnName]?.[key]}
                                                        {" " +
                                                            entity[columnName][
                                                                key
                                                            ]}{#if i < 4},{/if}
                                                    {/if}
                                                {/each}
                                            {:else}
                                                {JSON.stringify(
                                                    entity[columnName],
                                                )}
                                            {/if}
                                        {:else}
                                            {entity[columnName]}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    {:else}
                        <tr class="flex justify-center items-center h-32">
                            <Loader show={true} />
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div
            class="flex justify-between items-center mt-6 text-sm text-gray-700 font-sans"
        >
            <div>Showing 1 to {limit} of {$totalrecords} entries</div>
            <div
                class="flex justify-between items-center text-sm text-gray-700 font-sans"
            >
                <div class="flex items-center space-x-2">
                    <button
                        class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click={() => {
                            currentPage = 1;
                            fetchEntities(limit, 0, $requestid);
                        }}
                        disabled={currentPage === 1}
                    >
                        &laquo;
                    </button>

                    <button
                        class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click={() => {
                            currentPage--;
                            fetchEntities(
                                limit,
                                (currentPage - 1) * limit,
                                $requestid,
                            );
                        }}
                        disabled={currentPage === 1}
                    >
                        &lsaquo;
                    </button>

                    {#each Array(Math.ceil(Number($totalrecords) / Number(limit))).fill(0) as _, index}
                        {#if index < 6 || index === Math.ceil(Number($totalrecords) / Number(limit)) - 1 || (index >= currentPage - 2 && index <= currentPage)}
                            <button
                                class={`px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 ${
                                    currentPage == index + 1
                                        ? "bg-gray-200"
                                        : ""
                                }`}
                                on:click={() => {
                                    fetchEntities(
                                        limit,
                                        index * limit,
                                        $requestid,
                                    );
                                    currentPage = index + 1;
                                }}
                            >
                                {index + 1}
                            </button>
                        {:else if index === 6 || (index === currentPage + 2 && currentPage < Math.ceil(Number($totalrecords) / Number(limit)) - 4)}
                            <span class="px-2 py-1 text-gray-600">...</span>
                        {/if}
                    {/each}

                    <button
                        class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click={() => {
                            currentPage++;
                            fetchEntities(
                                limit,
                                (currentPage - 1) * limit,
                                $requestid,
                            );
                        }}
                        disabled={!$hasmore}
                    >
                        &rsaquo;
                    </button>

                    <button
                        class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!$hasmore}
                        on:click={() => {
                            currentPage = Math.ceil(
                                Number($totalrecords) / Number(limit),
                            );
                            fetchEntities(
                                limit,
                                $totalrecords - limit,
                                $requestid,
                            );
                        }}
                    >
                        &raquo;
                    </button>
                </div>
            </div>
        </div>
    </div>
{:else}
    <p>Connecting to the server, please wait...</p>
{/if}

{#if isAddModalOpen}
    <AddModal {entityName} bind:isAddModalOpen bind:limit />
{/if}

{#if isDeleteModalOpen}
    <DeleteModal {entityName} bind:isDeleteModalOpen {selectedEntityId} />
{/if}

{#if isEditModalOpen && selectedEntity}
    <EditModal
        {selectedEntity}
        bind:isEditModalOpen
        {selectedPrimaryKeyName}
        {entityName}
        {selectedEntityId}
    />
{/if}

{#if isViewDetailsModalOpen}
    <ViewModal bind:isViewDetailsModalOpen {entityName} {detailedEntity} />
{/if}

{#if isFilterModalOpen}
    <FilterModal bind:isFilterModalOpen {entityName} />
{/if}

<style>
    th,
    td {
        border-color: #d1d5db; /* tailwind's gray-300 */
    }

    /* The handle for resizing */
    .resize-handle {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: col-resize;
        background-color: transparent;
        transition: background-color 0.2s;
    }

    .resize-handle:hover,
    .resize-handle.active {
        background-color: #4299e1;
    }

    .scrollbar-beautiful {
        scrollbar-width: thin;
        scrollbar-color: #aaa #f0f0f0;
    }

    .scrollbar-beautiful::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    .scrollbar-beautiful::-webkit-scrollbar-thumb {
        background-color: #aaa;
        border-radius: 12px;
    }

    .scrollbar-beautiful::-webkit-scrollbar-thumb:hover {
        background-color: #888;
    }

    .scrollbar-beautiful::-webkit-scrollbar-track {
        background-color: #f0f0f0;
        border-radius: 12px;
    }

    .column-header {
        transition:
            background-color 0.2s,
            transform 0.1s;
    }
    .column-header:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    .column-header.dragging {
        transform: scale(1.02);
        opacity: 0.9;
    }

    /* This helps prevent text selection during drag */
    .select-none {
        user-select: none;
    }

    /* Force text overflow to ellipsis (particularly for table cells) */
    td {
        max-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .transition-width {
        transition: width 0.2s ease-out;
    }
</style>
