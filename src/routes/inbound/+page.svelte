<script lang="ts">
    import { websocketStore } from "$lib/stores/websocket";
    import { onMount } from "svelte";
    import Header from "$lib/components/dashboard/inbound/Header.svelte";
    import AddOrder from "$lib/components/dashboard/inbound/AddOrder.svelte";
    // import Summary from "$lib/components/inbound/Summary.svelte";

    interface OrderLine {
        id: string;
        item: string;
        expected: number;
        received: number;
    }

    interface Order {
        order: string;
        lines: OrderLine[];
    }

    interface DeliveryDetails {
        id: string;
        type: string;
        ASN_type: string;
        supplier: string;
        transport_equipment: string;
        orders: Order[];
        status: string;
        yard?: string;
        dock?: string;
        location?: string;
    }

    let deliveryDetails: DeliveryDetails = {
        id: "",
        type: "",
        ASN_type: "",
        supplier: "",
        transport_equipment: "",
        orders: [],
        status: "new",
    };

    // let connectionError = "";
    let messageModal = $websocketStore.messageModal;

    onMount(() => {
        websocketStore.connect("ws://localhost:8083/join", "U005");
        return () => {
            // Disconnect is handled by the store
        };
    });

    $: ({ isConnected } = $websocketStore);
    $: if ($websocketStore.messageModal) {
        messageModal = $websocketStore.messageModal;
        console.log("messageModal", messageModal);
    }

    // function handleAddOrder(order: Order) {
    //     deliveryDetails.orders = [...deliveryDetails.orders, order];
    // }

    // function handleRemoveOrder(orderToRemove: Order) {
    //     deliveryDetails.orders = deliveryDetails.orders.filter(
    //         (order) => order.order !== orderToRemove.order,
    //     );
    // }

    function handleUpdateDeliveryDetails(field: string, value: any) {
        deliveryDetails = { ...deliveryDetails, [field]: value };
    }

    // function handleSubmit() {
    //     if (!deliveryDetails.supplier) {
    //         alert("Please select a supplier");
    //         return;
    //     }

    //     if (!deliveryDetails.transport_equipment) {
    //         alert("Please enter transport equipment details");
    //         return;
    //     }

    //     if (deliveryDetails.orders.length === 0) {
    //         alert("Please add at least one order");
    //         return;
    //     }

    //     const inboundDelivery = {
    //         ...deliveryDetails,
    //         type: "inbound",
    //         ASN_type: "asn",
    //     };

    //     if (deliveryDetails.status === "new") {
    //         if (!deliveryDetails.yard) {
    //             alert("Please enter yard location");
    //             return;
    //         } else {
    //             inboundDelivery.yard = deliveryDetails.yard;
    //         }
    //     } else if (deliveryDetails.status === "yard") {
    //         inboundDelivery.yard = deliveryDetails.yard;
    //     } else if (deliveryDetails.status === "dock") {
    //         inboundDelivery.dock = deliveryDetails.dock;
    //     } else if (["recv stg", "received"].includes(deliveryDetails.status)) {
    //         inboundDelivery.dock = deliveryDetails.dock;
    //         inboundDelivery.location = deliveryDetails.location;
    //     }

    //     try {
    //         const message = {
    //             type: 'action',
    //             action: 'AddLog',
    //             env: {
    //                 user: "U005",
    //                 // transaction: "inbound"
    //             },
    //             params: {
    //                 entityName: 'inbound_delivery',
    //                 update: JSON.stringify({inboundDelivery})
    //             },
    //             // payload: JSON.stringify({
                   
    //             // })
    //         };
    //         websocketStore.sendMessage(message);
    //     } catch (error) {
    //         console.error("Error submitting inbound delivery:", error);
    //         alert("Failed to submit inbound delivery.");
    //     }
    // }
</script>

<div class="container mx-auto p-4">
    {#if !isConnected}
        <div
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
        >
            <strong class="font-bold">Connection Error!</strong>
            <span class="block sm:inline">
                WebSocket is not connected. Trying to reconnect...</span
            >
        </div>
    {/if }
    {#if isConnected}
          <h1>connected</h1>
    {/if }

    <!-- {#if messageModal}
        <div
            class="bg-{messageModal.status === 'success' ? 'green' : 'red'}-100 
                   border border-{messageModal.status === 'success' ? 'green' : 'red'}-400 
                   text-{messageModal.status === 'success' ? 'green' : 'red'}-700 
                   px-4 py-3 rounded relative mb-4"
            role="alert"
        >
            <strong class="font-bold">{messageModal.status === 'success' ? 'Success!' : 'Error!'}</strong>
            <span class="block sm:inline">{messageModal.message}</span>
            <button
                class="absolute top-0 right-0 px-4 py-3"
                on:click={() => websocketStore.closeModal()}
            >
                <span class="sr-only">Close</span>
                <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    {/if} -->

    <!-- <Header details={deliveryDetails} onUpdate={handleUpdateDeliveryDetails} /> -->
    <Header/>

    <div class="my-6">
        <AddOrder />
    </div>

    <div class="my-6">
        <!-- <Summary
            orders={deliveryDetails.orders}
            onRemoveOrder={(orderId) =>
                handleRemoveOrder(
                    deliveryDetails.orders.find((o) => o.order === orderId)!,
                )}
            onSubmit={handleSubmit}
        /> -->
    </div>

    <!-- <div class="mt-6">
        <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={handleSubmit}
            disabled={!isConnected}
        >
            Submit Inbound Delivery
        </button>
    </div> -->
</div>