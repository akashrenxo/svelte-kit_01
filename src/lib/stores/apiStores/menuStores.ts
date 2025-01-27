import { writable, get } from "svelte/store";
import { websocketStore } from "../websocket";
import Cookies from "js-cookie";

export interface MenuItem {
    id: string;
    menu: string;
    submenu?: MenuItem[];
}

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const REFRESH_THRESHOLD = 23 * 60 * 60 * 1000;
const FORCE_UPDATE_INTERVAL = REFRESH_THRESHOLD;

export const menuItems = writable<MenuItem[]>([]);
export const isConnected = writable(false);
export const messageModal = writable<{ status: string; message: string } | null>(null);
export const isRefreshing = writable(false);
export const lastUpdateTime = writable<number>(0);

const userId = Cookies.get("userId") || "";
let lastActivityTime = Date.now();

const resetActivityTimer = () => {
    lastActivityTime = Date.now();
};

if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);
}

const saveMenuToLocalStorage = (items: MenuItem[]) => {
    try {
        const saveData = {
            items,
            timestamp: Date.now(),
            version: Date.now()
        };
        localStorage.setItem('webapp_menu_items', JSON.stringify(saveData));
    } catch (error) {
        console.error("Error saving menu to localStorage:", error);
    }
};

const getMenuFromLocalStorage = (): {
    items: MenuItem[] | null;
    needsRefresh: boolean;
    version?: number;
} => {
    try {
        const stored = localStorage.getItem('webapp_menu_items');
        if (!stored) {
            return { items: null, needsRefresh: true };
        }
        const { items, timestamp, version } = JSON.parse(stored);
        const now = Date.now();
        const age = now - timestamp;
        const inactivity = now - lastActivityTime;
        if (inactivity > CACHE_DURATION || age > CACHE_DURATION) {
            return { items: null, needsRefresh: true };
        }
        if (age > REFRESH_THRESHOLD) {
            return { items, needsRefresh: true, version };
        }
        return {
            items,
            needsRefresh: false,
            version
        };
    } catch (error) {
        console.error("Error reading menu from localStorage:", error);
        return { items: null, needsRefresh: true };
    }
};

let refreshCheckInterval: any = null;
const startRefreshCheck = () => {
    if (refreshCheckInterval) return;
    refreshCheckInterval = setInterval(() => {
        const { needsRefresh } = getMenuFromLocalStorage();
        if (needsRefresh && !get(isRefreshing)) {
            refreshMenuItems();
        }
    }, FORCE_UPDATE_INTERVAL);
};

const stopRefreshCheck = () => {
    if (refreshCheckInterval) {
        clearInterval(refreshCheckInterval);
        refreshCheckInterval = null;
    }
};

export const fetchMenuItems = (forceRefresh?: boolean) => {
    const { items, needsRefresh } = getMenuFromLocalStorage();
    startRefreshCheck();
    if (items && !forceRefresh) {
        console.log('✅ Loading menu items from localStorage cache');
        menuItems.set(items);
        if (!needsRefresh) {
            console.log('📦 Cache is valid, no refresh needed');
            return;
        }
        console.log('⚠️ Cache needs refresh');
    } else {
        console.log('🔄 No cache available or force refresh requested');
    }
    if (needsRefresh || forceRefresh) {
        refreshMenuItems();
    }
};

const hasUnsavedChanges = (): boolean => {
    // Implement logic to detect unsaved changes on the website
    // For now, return false as a placeholder
    return false;
};

export const refreshMenuItems = async () => {
    if (get(isRefreshing)) {
        return;
    }
    if (hasUnsavedChanges()) {
        console.log("⚠️ Unsaved changes detected. Deferring menu updates.");
        return;
    }
    isRefreshing.set(true);
    console.log('🔄 Fetching fresh menu data from server...');
    const message = {
        type: "action",
        action: "GetWebAppMenu",
        env: { user: userId },
        params: { entityName: "webapp_menu" },
    };
    try {
        websocketStore.sendMessage(message);
    } catch (error) {
        console.error("Error refreshing menu items:", error);
        isRefreshing.set(false);
    }
};

export const parseMenuData = (data: string): MenuItem[] => {
    try {
        const parsedData = JSON.parse(data);
        const processMenu = (menu: any): MenuItem => ({
            id: menu.id || "",
            menu: menu.menu || "Unknown",
            submenu: menu.submenu ? menu.submenu.map(processMenu) : undefined,
        });
        return parsedData.submenu ? parsedData.submenu.map(processMenu) : [];
    } catch (error) {
        console.error("Error parsing menu data:", error);
        return [];
    }
};

websocketStore.subscribe(($websocketStore) => {
    isConnected.set($websocketStore.isConnected);
    if ($websocketStore.messages?.length) {
        const lastMessage = $websocketStore.messages[$websocketStore.messages.length - 1];
        if (
            lastMessage?.action === "GetWebAppMenu" &&
            String(lastMessage?.result?.code) === "SUCCESS200" &&
            lastMessage?.params?.menu
        ) {
            const parsedMenuItems = parseMenuData(lastMessage.params.menu);
            const currentMenuItems = get(menuItems);
            const timeSinceLastUpdate = Date.now() - get(lastUpdateTime);
            if (
                !currentMenuItems.length ||
                JSON.stringify(currentMenuItems) !== JSON.stringify(parsedMenuItems) ||
                timeSinceLastUpdate > FORCE_UPDATE_INTERVAL
            ) {
                console.log('✨ Menu content changed, updating cache and UI');
                menuItems.set(parsedMenuItems);
                saveMenuToLocalStorage(parsedMenuItems);
                lastUpdateTime.set(Date.now());
            } else {
                console.log('🟰 Menu content unchanged, keeping current state');
            }
            console.log('✅ Menu refresh completed');
            isRefreshing.set(false);
            lastActivityTime = Date.now();
        }
    }
    if ($websocketStore.messageModal) {
        messageModal.set($websocketStore.messageModal);
        console.log("messageModal updated:", $websocketStore.messageModal);
    }
});

if (typeof window !== 'undefined') {
    window.addEventListener('unload', stopRefreshCheck);
}
