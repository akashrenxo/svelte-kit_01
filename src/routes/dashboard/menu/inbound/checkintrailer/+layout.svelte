<script lang="ts">
    import { websocketStore } from "$lib/stores/websocket";
    import WorkflowUi from "$lib/components/dashboard/workflowUI/workflowUI.svelte";
    import Cookies from "js-cookie";

    let transportEquipment = "";
    let dockDoorNo = "";
    let error: string | null = null;
    let workflow: any = null;
    let showModal = false;
    const wsURL = Cookies.get("url") || "";
    const userId = Cookies.get("userId") || "";
    
    function handleSubmit() {
        error = null;

        if (!transportEquipment) {
            error = "Please enter transport equipment.";
            return;
        }

        if (!dockDoorNo) {
            error = "Please enter dock door number.";
            return;
        }

        websocketStore.sendMessage({
            type: "action",
            action: "CheckInTrailer",
            env: { user: "U005" },
            params: {
                entityName: "inbound_delivery",
                dock: dockDoorNo,
                transport_equipment: transportEquipment,
            },
        });

        alert("Data submission in progress...");
    }

    $: {
        console.log("WebSocket store updated:", $websocketStore.messages);
        if ($websocketStore.messages?.length) {
            const lastMessage =
                $websocketStore.messages[$websocketStore.messages.length - 1];
            console.log("Processing last message:", lastMessage);

            if (
                lastMessage?.action === "workflow" &&
                String(lastMessage?.result?.code) === "SUCCESS2001" &&
                lastMessage?.params?.entityName === "workflow"
            ) {
                try {
                    const resultData = lastMessage.params.result;
                    console.log("Received data:", resultData);
                    workflow = lastMessage.params.workflow
                        ? JSON.parse(lastMessage.params.workflow)
                        : null;
                    console.log("Workflow stored:", workflow);
                    showModal = true;
                } catch (error) {
                    console.error("Error parsing:", error);
                }
            } else if (lastMessage?.result?.code === "ERR0474") {
                error = lastMessage.result.message;
                console.error("Error message:", error);
            }
        }
    }
</script>

<div
    class="container mx-auto bg-white p-6 rounded-lg max-w-[90%] mt-10 shadow-lg"
>
    <h3 class="text-xl font-bold text-gray-800 border-b pb-4 mb-6">
        Check In Trailer
    </h3>

    <div class="mb-6">
        <label
            for="transportEquipmentInput"
            class="block text-sm font-medium text-gray-700 mb-2"
        >
            Transport Equipment:
        </label>
        <input
            id="transportEquipmentInput"
            type="text"
            bind:value={transportEquipment}
            class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter transport equipment"
        />
    </div>

    <div class="mb-6">
        <label
            for="dockDoorInput"
            class="block text-sm font-medium text-gray-700 mb-2"
        >
            Dock Door Number:
        </label>
        <input
            id="dockDoorInput"
            type="text"
            bind:value={dockDoorNo}
            class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter dock door number"
        />
    </div>

    <div class="flex justify-end">
        <button
            class="px-6 py-2 bg-[34495E] text-white rounded-lg shadow-md bg-[#34495E] focus:outline-none focus:ring-2 focus:ring-[#34495E]"
            on:click={handleSubmit}
        >
            Submit
        </button>
    </div>

    {#if error}
        <div class="mt-4 p-4 bg-red-100 text-red-700 rounded-lg shadow-md">
            <strong>Error:</strong>
            {error}
        </div>
    {/if}

    <script>
        let showModal = false;
    </script>

    <style>
        .scrollbar-hidden::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        body.modal-open {
            overflow: hidden;
        }
    </style>

    {#if showModal}
        <div
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 scrollbar-hidden"
        >
            <div
                class="bg-white rounded-xl p-4 max-w-lg w-full shadow-2xl relative transform transition-all"
            >
                <button
                    class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-2 rounded-full focus:outline-none focus:ring focus:ring-gray-300"
                    on:click={() => (showModal = false)}
                    aria-label="Close Modal"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                <div class="overflow-y-auto h-[550px] scrollbar-hidden">
                    <WorkflowUi
                        {workflow}
                        on:closeModal={() => (showModal = false)}
                    />
                </div>
            </div>
        </div>
    {/if}
</div>