import { writable, type Writable, derived } from "svelte/store";
import { websocketStore } from "../websocket";
import Cookies from "js-cookie";
import { addToast } from "$lib/stores/toastStore";
import errorMessage from "../../../../src/messages/errorMessages.json";
import successMessage from "../../../../src/messages/successMessages.json";
import warningMessage from "../../../../src/messages/warningMessages.json";


export interface Entity {
    id: string;
    [key: string]: any;
}

export interface MessageModal {
    status: string;
    message: string;
}

interface Translation {
    [key: string]: string;
}

interface TranslationEntry {
    variables: string[];
    translations: Translation;
}

const userId = Cookies.get("userId") || "";

export function entityStore<T extends Entity>(entityName: string) {
    const entitiesData: Writable<T[]> = writable([]);
    const attributes: Writable<T[]> = writable([]);
    const isConnected: Writable<boolean> = writable(false);
    const messageModal: Writable<MessageModal | null> = writable(null);
    const offset: Writable<number> = writable(0);
    const totalrecords: Writable<number> = writable(0);
    const totalfetched: Writable<number> = writable(0);
    const nextoffset: Writable<number> = writable(0);
    const hasmore: Writable<boolean> = writable(true);
    const requestid: Writable<string> = writable("");
    const successcode: Writable<string> = writable("");

    const fetchEntityAttributes = () => {
        console.log(`Fetching ${entityName}'s attributes...`);
        const message = {
            type: "action",
            action: "GetEntity",
            env: { user: userId },
            params: {
                entityName: "entity",
                primaryKey: entityName
            }
        };
        websocketStore.sendMessage(message);
    };

    const fetchEntities = (limit: number, nextoffset: number, requestid: string) => {
        console.log(`Fetching ${entityName}s...`);
        entitiesData.set([]);
        const message = {
            type: "action",
            action: "ListEntity",
            env: { user: userId },
            params: {
                entityName,
                limit: limit,
                offset: nextoffset || 0,
                requestID: requestid,
            }
        };
        console.log("message__fetchentities", message);
        websocketStore.sendMessage(message);
    };

    const addEntity = (entityData: Omit<T, "id">) => {
        const sendData = {
            data: entityData
        }
        const message = {
            type: "action",
            action: "AddEntity",
            env: { user: userId },
            params: { entityName },
            payload: JSON.stringify(sendData)
        };
        websocketStore.sendMessage(message);
    };

    const updateEntity = (primaryKey: string, updatedData: Partial<T>) => {
        const message = {
            type: "action",
            action: "UpdateEntity",
            env: { user: userId },
            params: {
                entityName,
                primaryKey,
                updates: JSON.stringify(updatedData)
            }
        };
        console.log("message", message);
        websocketStore.sendMessage(message);
    };

    const deleteEntity = (id: string) => {
        const message = {
            type: "action",
            action: "RemoveEntity",
            env: { user: userId },
            params: {
                entityName,
                primaryKey: id
            }
        };
        websocketStore.sendMessage(message);
        console.log("delete_entity_msg", message);
    };

    const parseEntityData = (data: string): T[] => {
        try {
            const parsedData = JSON.parse(data);
            return parsedData;
        } catch (error) {
            console.error(`Error parsing ${entityName} data:`, error);
            return [];
        }
    };

    interface Translations {
        "en-US": string;
        "fr-FR": string;
    }

    type SupportedLanguages = keyof Translations;

    function getTranslation(
        successCode: keyof typeof successMessage,
        languageCode: SupportedLanguages,
        variables: Record<string, string> = {}
    ): string {
        const entry = successMessage[successCode];
        if (!entry) {
            console.error(`Invalid success code: ${successCode}`);
            return '';
        }

        const translations = entry.translations as Translations;
        const translation = translations[languageCode];

        if (!translation) {
            console.error(`Language code ${languageCode} not found for ${successCode}`);
            return translations["en-US"] || '';
        }

        try {
            return entry.variables.reduce((text: string, varName: string) => {
                const value = variables[varName];
                if (value === undefined) {
                    console.warn(`Missing variable: ${varName}, using empty string`);
                    return text.replace(`{${varName}}`, '');
                }
                return text.replace(`{${varName}}`, value);
            }, translation);
        } catch (error) {
            console.error('Error during translation:', error);
            return '';
        }
    }

    const handleWebSocketMessage = (message: any) => {
        if (!message?.result?.code) return;

        const { action, result, params } = message;
        const successCode = result.code;
        successcode.set(successCode);
        switch (action) {
            case "ListEntity":
                if (successCode === "SUCCESS200" && params?.result) {
                    entitiesData.set(parseEntityData(params.result));
                    offset.set(params.offset);
                    requestid.set(params.requestID);
                    totalrecords.set(params.totalRecords);
                    hasmore.set(params.hasMore);
                    totalfetched.set(params.totalFetched);
                    nextoffset.set(params.nextOffset);
                    console.log("entitiesData", params.result);
                }
                break;
            case "GetEntity":
                if (successCode === "SUCCESS200" && params[entityName]) {
                    const entityData = JSON.parse(params[entityName]);
                    const attributesData = entityData.attributes || [];
                    attributes.set(attributesData);
                    console.log("attributes", attributesData);
                }
                break;
            case "UpdateEntity":
                if (successCode === "SUCCESS199" && params?.result) {
                    addToast(getTranslation("SUCCESS199", "en-US"), "success");
                }
                break;
            case "RemoveEntity":
                if (successCode === "SUCCESS220") {
                    addToast(getTranslation("SUCCESS220", "en-US"), "success");
                    fetchEntities(5, 0, "");
                }
                break;
            case "AddEntity":
                if (successCode === "SUCCESS122") {
                    addToast(getTranslation("SUCCESS122", "en-US"), "success");
                    console.log("trnslation success", getTranslation("SUCCESS122", "en-US"))
                }
                break;
        }
    };

    const processedMessages = new Set();

    websocketStore.subscribe(($websocketStore) => {
        isConnected.set($websocketStore.isConnected);

        if ($websocketStore.messages?.length) {
            const lastMessage = $websocketStore.messages[$websocketStore.messages.length - 1];
            if (lastMessage?.result?.code && !processedMessages.has(JSON.stringify(lastMessage))) {
                processedMessages.add(JSON.stringify(lastMessage));
                handleWebSocketMessage(lastMessage);
            }
        }

        if ($websocketStore.messageModal) {
            messageModal.set($websocketStore.messageModal);
        }
    });

    return {
        nextoffset,
        totalrecords,
        totalfetched,
        hasmore,
        offset,
        entitiesData,
        attributes,
        isConnected,
        requestid,
        messageModal,
        fetchEntities,
        addEntity,
        updateEntity,
        deleteEntity,
        fetchEntityAttributes
    };
}