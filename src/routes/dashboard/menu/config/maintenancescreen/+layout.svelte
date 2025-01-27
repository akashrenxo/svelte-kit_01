<!-- <script lang="ts">
    import { get, writable } from "svelte/store";
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import type { Entity } from "$lib/stores/apiStores/entityStores";
    import { onMount } from "svelte";
    import { refreshMenuItems } from "$lib/stores/apiStores/menuStores";
    import { websocketStore } from "$lib/stores/websocket";
    import deleteButton from "$lib/../../src/assests/images/supplier/deleteButton.png";
    import edit from "$lib/../../src/assests/images/supplier/edit.png";

    interface Attribute extends Entity {
        attributeName: string;
        defaultVal: string;
        isMandatory: boolean;
        selectedDataType: string;
        inputType: string;
        entitytype: string;
        attributeType: string;
    }

    let entityName = "";
    let dbName = "";
    let tableName = "";
    let selectedType = "standard";
    let attributes = writable<Attribute[]>([]);
    let currentAttribute: Attribute = {
        id: "",
        attributeName: "",
        isMandatory: false,
        entitytype: "standard",
        attributeType: "standard",
        defaultVal: "",
        selectedDataType: "",
        inputType: "text",
    };
    let isSaved = false;
    const LOCATIONS_PER_PAGE = 20;

    const listOfValueStore = entityStore<Attribute>("list_of_value");
    const createEntityStore = entityStore("entity");
    const { addEntity } = createEntityStore;

    let listOfValues = [];
    let retryCount = 0;
    const MAX_RETRIES = 5;
    let isFetching = writable(false);
    let listFetched = writable(false);

    const availableDataTypes = writable<string[]>([
        "ID (alphanumeric)",
        "Text",
        "Number (int or real)",
        "Money",
        "Address",
        "Date",
        "DateTime",
        "Time",
        "Weekday",
        "Month",
        "Toggle",
        "Range",
    ]);

    listOfValueStore.subscribe(($store) => {
        listOfValues = $store.entities;

        if (listOfValues.length > 0) {
            const codes = listOfValues.map((value) => value.code);
            availableDataTypes.update((types) => [
                ...new Set([...types, ...codes]),
            ]);
        }
    });

    function fetchListOfValues() {
        if (get(isFetching) || get(listFetched)) {
            console.log("Skipping fetch: already in progress or fetched.");
            return;
        }

        console.log("Fetching list of values...");
        isFetching.set(true);
        listOfValueStore.fetchEntities(
            {
                limit: LOCATIONS_PER_PAGE,
                offset: 0,
            },
            true,
        );
        const unsubscribe = websocketStore.subscribe(($websocketStore) => {
            const lastMessage = $websocketStore.messages?.at(-1);
            if (
                lastMessage?.action === "ListEntity" &&
                lastMessage?.params?.entityName === "list_of_value"
            ) {
                if (lastMessage.result?.code === "SUCCESS200") {
                    console.log("List of values fetched successfully.");
                    listOfValues = $websocketStore.messages.filter(
                        (msg) =>
                            msg.action === "ListEntity" &&
                            msg.params?.entityName === "list_of_value",
                    );
                    listFetched.set(true);
                } else {
                    console.error(
                        "Error fetching list of values:",
                        lastMessage.result?.variables,
                    );
                }

                isFetching.set(false);
                unsubscribe();
            }
        });
    }
    onMount(() => {
        const retryInterval = setInterval(() => {
            if (!get(listFetched) && retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Retrying fetch (${retryCount}/${MAX_RETRIES})`);
                fetchListOfValues();
            } else {
                clearInterval(retryInterval);
            }
        }, 2000);

        return () => clearInterval(retryInterval);
    });

    function addAttribute() {
        if (
            currentAttribute.attributeName &&
            currentAttribute.selectedDataType
        ) {
            attributes.update((attr) => [...attr, { ...currentAttribute }]);
            resetCurrentAttribute();
        }
    }

    function resetCurrentAttribute() {
        currentAttribute = {
            id: "",
            attributeName: "",
            isMandatory: false,
            entitytype: "standard",
            attributeType: "standard",
            defaultVal: "",
            selectedDataType: "",
            inputType: "text",
        };
    }

    function deleteAttribute(index: number) {
        attributes.update((attr) => attr.filter((_, i) => i !== index));
    }

    function editAttribute(index: number) {
        attributes.subscribe((attr) => {
            currentAttribute = { ...attr[index] };
        })();
        attributes.update((attr) => attr.filter((_, i) => i !== index));
        isSaved = false;
    }

    function saveAttributes() {
        attributes.subscribe(($attributes) => {
            const formattedAttributes = $attributes.map((attr) => ({
                data_type: attr.selectedDataType.toLowerCase(),
                mandatory: attr.isMandatory,
                name: attr.attributeName,
                path: `${dbName}.${tableName}.${attr.attributeName}`,
                type: attr.type,
            }));

            const payload = {
                attributes: formattedAttributes,
                db: dbName,
                entity: entityName,
                table: tableName,
                type: selectedType,
            };
            addEntity(payload);
            const unsubscribe = websocketStore.subscribe(($websocketStore) => {
                const lastMessage = $websocketStore.messages?.at(-1);
                if (
                    lastMessage?.action === "AddEntity" &&
                    lastMessage?.params?.entityName === "entity"
                ) {
                    if (lastMessage.result?.code === "SUCCESS122") {
                        console.log("Entity added successfully!");
                        isSaved = true;
                        refreshMenuItems();
                    } else {
                        console.error(
                            "Error adding entity:",
                            lastMessage.result?.variables,
                        );
                    }
                    unsubscribe();
                }
            });
        })();
    }
</script>

<div class="max-w-6xl mx-auto bg-gray-100 p-6 rounded-lg shadow">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Create Entity</h1>
        <button
            class="py-2 px-10 bg-[#34495E] text-white rounded-md hover:bg-blue-700 mr-10"
        >
            Edit Entity
        </button>
    </div>
    <form on:submit|preventDefault={saveAttributes} class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label for="dbName" class="block text-sm font-medium mb-2"
                    >DB Name</label
                >
                <input
                    type="text"
                    id="dbName"
                    bind:value={dbName}
                    placeholder="Enter database name"
                    class="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                />
            </div>
            <div>
                <label for="entityName" class="block text-sm font-medium mb-2"
                    >Entity Name</label
                >
                <input
                    type="text"
                    id="entityName"
                    bind:value={entityName}
                    placeholder="Enter entity name"
                    class="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                />
            </div>
            <div>
                <label for="tableName" class="block text-sm font-medium mb-2"
                    >Table Name</label
                >
                <input
                    type="text"
                    id="tableName"
                    bind:value={tableName}
                    placeholder="Enter table name"
                    class="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                />
            </div>
            <div>
                <label for="type" class="block text-sm font-medium mb-2"
                    >Type</label
                >
                <select
                    id="type"
                    bind:value={currentAttribute.entitytype}
                    class="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                >
                    <option value="standard">Standard</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-6">
            <div class="flex-1 bg-white p-4 rounded-lg shadow">
                <h2 class="text-lg font-semibold mb-4">Add Attribute</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label
                            for="datatype"
                            class="block text-sm font-medium mb-2"
                            >Data Type</label
                        >
                        <select
                            id="datatype"
                            bind:value={currentAttribute.selectedDataType}
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                        >
                            <option value="" disabled selected
                                >Select a data type</option
                            >
                            {#each $availableDataTypes as dataType}
                                <option value={dataType}>{dataType}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label for="type" class="block text-sm font-medium mb-2"
                            >Attribute Name</label
                        >
                        <input
                            type="text"
                            id="type"
                            bind:value={currentAttribute.attributeName}
                            placeholder="Enter attribute name"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                        />
                    </div>
                </div>
                <div class="flex items-center gap-2 mb-3">
                    <label for="isMandatory" class="text-sm font-medium"
                        >Mandatory:</label
                    >
                    <input
                        type="checkbox"
                        id="isMandatory"
                        bind:checked={currentAttribute.isMandatory}
                        class="h-5 w-5 text-blue-500 focus:ring focus:ring-blue-200"
                    />
                </div>
                <div>
                    <label for="type" class="block text-sm font-medium mb-2"
                        >Type</label
                    >
                    <select
                        bind:value={currentAttribute.attributeType}
                        id="type"
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                    >
                        <option value="standard">Standard</option>
                        <option value="standard-fixed">Standard-Fixed</option>
                        <option value="standard-locked">Standard-Locked</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
                <div>
                    <label
                        for="defaultVal"
                        class="block text-sm font-medium mb-2 mt-3"
                        >Default Value</label
                    >
                    <input
                        type="text"
                        id="defaultVal"
                        bind:value={currentAttribute.defaultVal}
                        placeholder="Enter default value"
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                    />
                </div>
                <button
                    type="button"
                    class="w-full mt-4 py-2 bg-[#34495E] text-white rounded-md hover:bg-blue-700"
                    on:click={addAttribute}
                >
                    Add Attribute
                </button>
            </div>
            <div
                class="flex-1 bg-gray-50 p-4 rounded-lg shadow overflow-y-auto max-h-[400px]"
            >
                <h2 class="text-lg font-semibold mb-4">Preview Attributes</h2>
                {#if $attributes.length > 0}
                    {#each $attributes as attribute, index}
                        <div
                            class="flex items-start justify-between mb-4 p-3 bg-white rounded shadow-sm"
                        >
                            <div>
                                <p class="font-medium text-lg">
                                    {attribute.attributeName}
                                </p>
                                <p class="text-sm text-gray-600">
                                    <strong>Data Type:</strong>
                                    {attribute.selectedDataType}
                                </p>
                                <p class="text-sm text-gray-600">
                                    <strong>Mandatory:</strong>
                                    {attribute.isMandatory ? "Yes" : "No"}
                                </p>
                                <p class="text-sm text-gray-600">
                                    <strong>Type:</strong>
                                    {attribute.type}
                                </p>
                                <p class="text-sm text-gray-600">
                                    <strong>Default Value:</strong>
                                    {attribute.defaultVal || "N/A"}
                                </p>
                            </div>
                            <div class="flex flex-col gap-2">
                                <button
                                    type="button"
                                    class="p-2 bg-transparent hover:opacity-80"
                                    on:click={() => editAttribute(index)}
                                >
                                    <img
                                        src={edit}
                                        alt="Edit"
                                        class="h-6 w-6"
                                    />
                                </button>
                                <button
                                    type="button"
                                    class="p-2 bg-transparent hover:opacity-80"
                                    on:click={() => deleteAttribute(index)}
                                >
                                    <img
                                        src={deleteButton}
                                        alt="Delete"
                                        class="h-6 w-6"
                                    />
                                </button>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <p class="text-gray-500">No attributes added yet.</p>
                {/if}
            </div>
        </div>
        <button
            type="button"
            class="w-full py-2 bg-[#34495E] text-white rounded-md hover:bg-blue-700"
            on:click={saveAttributes}
        >
            Create Entity
        </button>
    </form>
</div>
<slot /> -->
