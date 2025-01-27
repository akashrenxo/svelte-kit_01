<!-- <script lang="ts">
    import "../../app.css";
    import { websocketStore } from "$lib/stores/websocket";
    import { onMount, onDestroy } from "svelte";

    let suppliers: any[] = [];
    let filteredSuppliers: any[] = [];
    let isConnected = false;
    let searchQuery = "";
    let selectedSupplier: any = null;
    let modalMode = "add";

    const unsubscribe = websocketStore.subscribe((state) => {
        isConnected = state.isConnected;
        suppliers = state.suppliers;
        filterSuppliers();
    });

    $: if (isConnected) {
        websocketStore.fetchSuppliers();
    }

    function filterSuppliers() {
        filteredSuppliers = suppliers.filter(
            (supplier) =>
                supplier.client
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                supplier.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        );
    }

    function handleSearch(event: Event) {
        searchQuery = (event.target as HTMLInputElement).value;
        filterSuppliers();
    }

    const openModal = (mode: string, supplier: any = null) => {
        modalMode = mode;
        selectedSupplier = supplier;
        (
            document.getElementById("my_modal_1") as HTMLDialogElement
        )?.showModal();
    };

    function handleSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const supplierData = {
            client: formData.get("client") as string,
            name: formData.get("name") as string,
            trusted: formData.get("trusted") === "on",
        };

        if (modalMode === "add") {
            websocketStore.sendMessage({
                action: "AddEntity",
                env: {
                    user: "U005",
                },
                params: {
                    entityName: "supplier",
                },
                payload: JSON.stringify({
                    client: formData.get("client") as string,
                    name: formData.get("name") as string,
                    trusted: formData.get("trusted") === "on",
                }),
            });
        } else if (modalMode === "edit" && selectedSupplier) {
            websocketStore.sendMessage({
                action: "UpdateEntity",
                env: {
                    user: "U005",
                },
                params: {
                    entityName: "supplier",
                    primaryKey: selectedSupplier.id,
                    update: JSON.stringify({
                    client: formData.get("client") as string,
                    trusted: formData.get("trusted") === "on",
                }),
                },
            });
        }

        const modal = document.getElementById(
            "my_modal_1",
        ) as HTMLDialogElement;
        modal?.close();
        setTimeout(websocketStore.fetchSuppliers, 500);
    }

    function handleDelete(id: string) {
        websocketStore.sendMessage({
            action: "RemoveEntity",
            env: {
                user: "U005",
            },
            params: {
                entityName: "supplier",
                primaryKey: id,
            },
        });
        setTimeout(websocketStore.fetchSuppliers, 500);
    }

    onMount(() => {
        websocketStore.connect();
    });

    onDestroy(() => {
        unsubscribe();
        websocketStore.disconnect();
    });
</script>


<div class="max-w-[80%] mx-auto mt-20">
    <dialog id="my_modal_1" class="modal">
        <div class="modal-box p-5">
            <form method="dialog" on:submit|preventDefault={handleSubmit}>
                <div class="flex justify-between">
                    <h3 class="font-semibold text-lg">
                        {modalMode === "add" ? "Add Supplier" : "Edit Supplier"}
                    </h3>
                    <button
                        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        >✕</button
                    >
                </div>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text text-base">Client</span>
                    </div>
                    <input
                        name="client"
                        type="text"
                        class="input input-bordered w-full"
                        value={selectedSupplier?.client || ""}
                        required
                    />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text text-base">Name</span>
                    </div>
                    <input
                        name="name"
                        type="text"
                        class="input input-bordered w-full"
                        value={selectedSupplier?.name || ""}
                        required
                    />
                </label>

                <div class="form-control">
                    <label class="label cursor-pointer">
                        <span class="label-text">Trusted</span>
                        <input
                            name="trusted"
                            type="checkbox"
                            class="checkbox"
                            checked={selectedSupplier?.trusted || false}
                        />
                    </label>
                </div>

                <div class="modal-action">
                    <button type="submit" class="btn btn-primary">
                        {modalMode === "add" ? "Add Supplier" : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    </dialog>

    <div class="flex justify-between items-center mb-6">
        <button class="btn btn-primary" on:click={() => openModal("add")}>
            Add Supplier
        </button>
        <input
            type="text"
            placeholder="Search suppliers..."
            class="input input-bordered w-64"
            value={searchQuery}
            on:input={handleSearch}
        />
    </div>

    <div class="mb-4">
        <span
            class={`px-2 py-1 rounded ${isConnected ? "bg-green-500" : "bg-red-500"} text-white`}
        >
            {isConnected ? "Connected" : "Disconnected"}
        </span>
    </div>

    <div class="overflow-x-auto">
        <table class="table w-full">
            <thead>
                <tr>
                    <th>Client</th>
                    <th>Name</th>
                    <th>Trusted</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each filteredSuppliers as supplier (supplier.id)}
                    <tr>
                        <td>{supplier.client}</td>
                        <td>{supplier.name}</td>
                        <td>{supplier.trusted ? "Yes" : "No"}</td>
                        <td class="space-x-2">
                            <button
                                class="btn btn-sm btn-warning"
                                on:click={() => openModal("edit", supplier)}
                            >
                                Edit
                            </button>
                            <button
                                class="btn btn-sm btn-error"
                                on:click={() => handleDelete(supplier.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div> -->
