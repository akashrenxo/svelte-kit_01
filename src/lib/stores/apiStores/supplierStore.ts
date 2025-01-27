import { writable } from "svelte/store";
import { websocketStore } from "../websocket";

export interface Supplier {
    id: string;
    name: string;
    trusted?: boolean;
    client?: string;
}

export const suppliers = writable<Supplier[]>([]);
export const isConnected = writable(false);
export const messageModal = writable<{ status: string; message: string } | null>(null);

export const fetchSuppliers = () => {
    console.log("Fetching suppliers...");
    const message = {
        type: "action",
        action: "ListEntity",
        env: { user: "U005" },
        params: { entityName: "supplier" },
    };
    websocketStore.sendMessage(message);
    console.log("Sent WebSocket message:", message);
};

export const addSupplier = (supplierData: Omit<Supplier, "id">) => {
    console.log("Adding new supplier:", supplierData);
    websocketStore.sendMessage({
        type: "action",
        action: "AddEntity",
        env: {
            user: "U005",
        },
        params: {
            entityName: "supplier",
        },
        payload: JSON.stringify(supplierData),
    });
    setTimeout(fetchSuppliers, 500);
};

export const editSupplier = (id: string, updatedData: Partial<Supplier>) => {
    console.log("Editing supplier:", id, updatedData);
    websocketStore.sendMessage({
        type: "action",
        action: "UpdateEntity",
        env: {
            user: "U005",
        },
        params: {
            entityName: "supplier",
            primaryKey: id,
            update: JSON.stringify(updatedData),
        },
    });
    setTimeout(fetchSuppliers, 500);
};

export const deleteSupplier = (id: string) => {
    console.log("Deleting supplier:", id);
    websocketStore.sendMessage({
        type: "action",
        action: "RemoveEntity",
        env: {
            user: "U005",
        },
        params: {
            entityName: "supplier",
            primaryKey: id,
        },
    });
    setTimeout(fetchSuppliers, 500);
};

export const parseSupplierData = (data: string): Supplier[] => {
    try {
        console.log("Raw supplier data:", data);
        const parsedData = JSON.parse(data);
        return parsedData.map((supplier: any) => ({
            id: supplier.id || "",
            name: supplier.name || "Unknown",
            trusted: supplier.trusted || false,
            client: supplier.client || "Unknown",
        }));
    } catch (error) {
        console.error("Error parsing supplier data:", error, "Data:", data);
        return [];
    }
};

websocketStore.subscribe(($websocketStore) => {
    isConnected.set($websocketStore.isConnected);

    if ($websocketStore.messages?.length) {
        const lastMessage = $websocketStore.messages[$websocketStore.messages.length - 1];
        console.log("Processing last WebSocket message:", lastMessage);

        if (
            lastMessage?.action === "ListEntity" &&
            String(lastMessage?.result?.code) === "SUCCESS200" &&
            lastMessage?.params?.result
        ) {
            suppliers.set(parseSupplierData(lastMessage.params.result));
            console.log("Parsed suppliers:", suppliers);
        }
    }

    if ($websocketStore.messageModal) {
        messageModal.set($websocketStore.messageModal);
        console.log("messageModal updated:", $websocketStore.messageModal);
    }
});
