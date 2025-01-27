<script lang="ts">
    import edit from "$lib/../../src/assests/images/supplier/edit.png";
    import deleteButton from "$lib/../../src/assests/images/supplier/deleteButton.png";
    import viewDetails from "$lib/../../src/assests/images/genericPage/viewDetails.png";
    import sortingArrows from "$lib/../../src/assests/images/genericPage/sortingArrows.png";

    interface TableData {
        Name: string;
        Email: string;
        Address: string;
        Phone: string;
    }

    let isAddModalOpen: boolean = false;
    let isEditModalOpen: boolean = false;
    let isDeleteModalOpen: boolean = false;
    let isViewDetailsModalOpen: boolean = false;
    let isFilterModalOpen: boolean = false;

    export let data: TableData[] = [];

    type ColumnKey = keyof TableData;

    let columns: ColumnKey[] = ["Name", "Email", "Address", "Phone"];

    let draggedColumn: ColumnKey | null = null;
    let dragOverColumn: ColumnKey | null = null;

    function handleDragStart(event: DragEvent, column: ColumnKey) {
        if (!event.dataTransfer) return;
        draggedColumn = column;
    }

    function handleDragOver(event: DragEvent, column: ColumnKey) {
        event.preventDefault();
        if (column !== draggedColumn) {
            dragOverColumn = column;
        }
    }

    function handleDragLeave() {
        dragOverColumn = null;
    }

    function handleDrop(event: DragEvent, targetColumn: ColumnKey) {
        event.preventDefault();

        if (!draggedColumn || draggedColumn === targetColumn) {
            draggedColumn = null;
            dragOverColumn = null;
            return;
        }

        const currentColumns = [...columns];
        const draggedIdx = currentColumns.indexOf(draggedColumn);
        const targetIdx = currentColumns.indexOf(targetColumn);

        currentColumns.splice(draggedIdx, 1);
        currentColumns.splice(targetIdx, 0, draggedColumn);

        columns = currentColumns;
        draggedColumn = null;
        dragOverColumn = null;
    }

    function handleDragEnd() {
        draggedColumn = null;
        dragOverColumn = null;
    }

    function handleEdit(row: TableData) {
        console.log("Edit:", row);
    }

    function handleDelete(row: TableData) {
        console.log("Delete:", row);
    }

    function handleView(row: TableData) {
        console.log("View:", row);
    }

    interface Filters {
        [key: string]: string[];
    }

    let filterValues: Filters = {};
    let tempFilterInput: { [key: string]: string } = {};

    const addFilterValue = (attribute: string): void => {
        const value = tempFilterInput[attribute]?.trim();
        if (!filterValues[attribute]) {
            filterValues[attribute] = [];
        }
        if (value && !filterValues[attribute].includes(value)) {
            filterValues = {
                ...filterValues,
                [attribute]: [...filterValues[attribute], value],
            };
            tempFilterInput[attribute] = "";
        }
    };

    const removeFilterValue = (attribute: string, value: string): void => {
        if (filterValues[attribute]) {
            filterValues = {
                ...filterValues,
                [attribute]: filterValues[attribute].filter((v) => v !== value),
            };
        }
    };
</script>

<div class="flex justify-between items-center mb-6 font-sans">
    <div class="flex items-center gap-2">
        <select
            id="entries"
            class="px-2 py-2 text-sm border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#34495E]"
        >
            <option value="10">10</option>
            <option value="25" selected>25</option>
            <option value="50">50</option>
            <option value="100">100</option>
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
            class="bg-[#34495E] text-white px-4 py-2 rounded-lg shadow transition-all"
            on:click={() => {
                isAddModalOpen = true;
            }}
        >
            Add Entity
        </button>
    </div>
</div>
<div class="w-full overflow-x-auto rounded-lg bg-white font-sans">
    <table class="w-full min-w-[800px] text-sm text-gray-700">
        <thead class="bg-[#34495E] text-white">
            <tr>
                <th
                    class=" py-4 px-4 text-left font-medium min-w-[10rem] select-none
                           transition-all duration-200 ease-in-out">Actions</th
                >
                {#each columns as column}
                    <th
                        draggable={true}
                        on:dragstart={(e) => handleDragStart(e, column)}
                        on:dragover={(e) => handleDragOver(e, column)}
                        on:dragleave={handleDragLeave}
                        on:drop={(e) => handleDrop(e, column)}
                        on:dragend={handleDragEnd}
                        class="py-4 px-4 text-left font-medium min-w-[10rem] select-none
                           transition-all duration-200 ease-in-out
                           {draggedColumn === column
                            ? 'bg-blue-100'
                            : 'hover:bg-gray-200'}
                           {dragOverColumn === column ? 'bg-blue-50' : ''}
                           cursor-grab active:cursor-grabbing"
                    >
                        <div class=" flex flex-row items-center gap-2">
                            <span
                                >{column.replace(/_/g, " ").toUpperCase()}</span
                            >
                            <img
                                src={sortingArrows}
                                alt="sortingArrows"
                                class=" h-4 hover:cursor-pointer"
                            />
                        </div>
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each data as row}
                <tr
                    class="border-t border-gray-200 even:bg-gray-50 hover:bg-gray-100 transition-colors duration-150"
                >
                    <td class="py-3 px-4 whitespace-nowrap">
                        <div
                            class="py-3 text-center flex flex-row justify-start min-w-[150px]"
                        >
                            <button
                                class="inline-block text-blue-500 hover:text-blue-700 mx-2"
                                on:click={() => handleEdit(row)}
                            >
                                <img src={edit} alt="Edit" class="h-5 inline" />
                            </button>
                            <button
                                class="inline-block text-red-500 hover:text-red-700 mx-2"
                                on:click={() => handleDelete(row)}
                            >
                                <img
                                    src={deleteButton}
                                    alt="Delete"
                                    class="h-5 inline"
                                />
                            </button>
                            <button
                                class="inline-block text-blue-500 hover:text-blue-700 mx-2"
                                on:click={() => handleView(row)}
                            >
                                <img
                                    src={viewDetails}
                                    alt="View Details"
                                    class="h-5 inline"
                                />
                            </button>
                        </div>
                    </td>
                    {#each columns as column}
                        <td class="py-3 px-4 whitespace-nowrap">
                            {row[column]}
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>
<div class="flex justify-between items-center mt-6 text-sm text-gray-700 font-sans">
    <div>Showing 1 to 10 of 57 entries</div>
    <div class="flex items-center space-x-2">
        <button
            class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200"
            >&laquo;</button
        >
        <button
            class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200"
            >&lsaquo;</button
        >
        <button class="px-3 py-1 border border-gray-300 bg-gray-300 rounded"
            >1</button
        >
        <button
            class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200"
            >2</button
        >
        <button
            class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200"
            >3</button
        >
        <span>...</span>
        <button
            class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200"
            >&rsaquo;</button
        >
        <button
            class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200"
            >&raquo;</button
        >
    </div>
</div>

{#if isFilterModalOpen}
    <div
        class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 font-poppins"
    >
        <div
            class="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[550px] overflow-y-auto scrollbar-hidden grid grid-cols-6"
        >
            <div class=" col-span-2">
                <h2 class="text-sm font-semibold mb-5">Filter by Attribute</h2>
                {#each columns as column}
                    <div
                        class=" flex flex-row gap-2 text-sm font-medium items-center mb-2"
                    >
                        <input
                            type="checkbox"
                            class=" h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span>{column}</span>
                    </div>
                {/each}
            </div>
            <div class=" col-span-4">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-sm font-semibold">Filter by Value</h2>
                    <button
                        class="text-gray-500 hover:text-gray-700 focus:outline-none"
                        on:click={() => {
                            isFilterModalOpen = false;
                        }}
                    >
                        ✕
                    </button>
                </div>
                <div class="space-y-3 text-sm">
                    {#each columns as attr (attr)}
                        <div>
                            <label
                                for="filter-{attr}"
                                class="block text-sm font-medium text-gray-700"
                            >
                                {attr}
                            </label>

                            <div class=" flex flex-wrap gap-2">
                                {#each filterValues[attr] || [] as value}
                                    <span
                                        class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                    >
                                        {value}
                                        <button
                                            class="text-[#34495E]"
                                            on:click={() =>
                                                removeFilterValue(attr, value)}
                                        >
                                            ✕
                                        </button>
                                    </span>
                                {/each}
                            </div>
                            <div class="flex gap-2 mt-2">
                                <input
                                    id="filter-{attr}"
                                    type="text"
                                    placeholder="Enter value"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                    bind:value={tempFilterInput[attr]}
                                />
                                <button
                                    class="bg-[#34495E] text-white px-4 rounded-md text-sm"
                                    on:click={() => addFilterValue(attr)}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
                <div class="flex justify-end space-x-4 mt-6 text-sm">
                    <button
                        class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                        on:click={() => {
                            isFilterModalOpen = false;
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        class="px-4 py-2 bg-[#34495E] text-white rounded-lg"
                        on:click={() => {
                            console.log("Filters applied:", filterValues);
                            isFilterModalOpen = false;
                        }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    th {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
    .scrollbar-hidden::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hidden {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
