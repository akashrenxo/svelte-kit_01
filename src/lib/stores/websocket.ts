import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import Cookies from "js-cookie";
import { translateMessage } from '$lib/utils/messageTranslator';
import { locale } from 'svelte-i18n';

interface MessageEnv {
    user?: string;
    warehouse?: string;
    transaction?: string;
    orig_action?: string;
}

interface MessageResult {
    code: string;
    variables: Record<string, any>;
}

interface BaseMessage {
    type: string | 'action' | 'response' | 'UI' | 'submit';
    action: string;
    env?: MessageEnv;
    result?: MessageResult;
    params?: Record<string, any>;
    payload?: string | Record<string, any>;
}

interface ResponseMessage extends BaseMessage {
    type: 'response';
    action: string | 'function' | 'message' | 'workflow' | 'screen_name' | 'confirmation';
    result: MessageResult;
}

function isResponseMessage(message: BaseMessage): message is ResponseMessage {
    return message.type === 'response' && 'result' in message;
}

interface WebSocketState {
    isConnected: boolean;
    messages: BaseMessage[];
    messageModal: { status: string; message: string } | null;
    formModal: any | null;
}

function generateRandomCode(): string {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `WA${randomDigits}`;
}

const jwt_token = Cookies.get("access_token") || "";

function createWebSocketStore() {
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 100;
    const reconnectInterval = 5000;
    const state = writable<WebSocketState>({
        isConnected: false,
        messages: [],
        messageModal: null,
        formModal: null
    });

    function connect(url: string, userId: string) {
        if (!browser) return;
        ws = new WebSocket(url);
        console.log("Connecting to:", url);
        ws.onopen = () => {
            state.update(s => ({ ...s, isConnected: true }));
            reconnectAttempts = 0;
            const authPayload: BaseMessage = {
                type: 'action',
                action: 'auth',
                env: {
                    user: userId,
                    transaction: jwt_token
                },
                payload: ""
            };
            console.log("authPayload", authPayload);
            sendMessage(authPayload);
        };

        ws.onmessage = (event) => {
            try {
                const message: BaseMessage = JSON.parse(event.data);
                console.log("Received WebSocket message:", message);
                handleMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            state.update(s => ({ ...s, isConnected: false }));
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const reconnectDelay = Math.min(reconnectInterval * (2 ** reconnectAttempts), 30000);
                setTimeout(() => connect(url, userId), reconnectDelay);
            } else {
                ws = null;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            ws?.close();
            state.update(s => ({
                ...s,
                messageModal: {
                    status: 'error',
                    message: 'WebSocket encountered an error and will attempt to reconnect.'
                }
            }));
        };
    }

    function handleMessage(message: BaseMessage) {
        state.update(s => ({ ...s, messages: [...s.messages, message] }));
        switch (message.type) {
            case 'response':
                if (isResponseMessage(message)) {
                    handleResponseMessage(message);
                }
                break;
            case 'UI':
                handleUIMessage(message);
                break;
            default:
                console.warn(`Unhandled message type: ${message.type}`);
        }
    }

    function handleResponseMessage(message: ResponseMessage) {
        let currentLocale = 'en';
        locale.subscribe(value => {
            if (value) {
                currentLocale = value;
            }
        })();

        const { code, variables } = message.result;
        const translatedMessage = translateMessage('SUCCESS', code, variables, currentLocale);
        let status: 'success' | 'error' | 'warning';

        if (code.startsWith('SUCCESS')) {
            status = 'success';
        } else if (code.startsWith('ERR')) {
            status = 'error';
        } else if (code.startsWith('WARN')) {
            status = 'warning';
        } else {
            status = 'error';
        }

        state.update(s => ({
            ...s,
            messageModal: {
                status,
                message: translatedMessage,
            }
        }));

        if (message.action === 'Auth' && message.result.code === 'SUCCESS00') {
            console.log('Authentication Successful');
        } else if (message.action === 'Auth') {
            console.error('Authentication Failed:', translatedMessage);
        }
    }

    function handleUIMessage(message: BaseMessage) {
        switch (message.action) {
            case 'workflow':
                if (message.params?.workflow) {
                    try {
                        const formData = JSON.parse(message.params.workflow);
                        state.update(s => ({ ...s, formModal: formData }));
                    } catch (error) {
                        console.error('Error parsing workflow payload:', error);
                    }
                }
                break;
            default:
                console.warn(`Unhandled UI message action: ${message.action}`);
        }
    }

    function updateTranslations(newLocale: string) {
        state.update(s => {
            const updatedMessages = s.messages.map(message => {
                if (isResponseMessage(message)) {
                    const { code, variables } = message.result;
                    const translatedMessage = translateMessage('SUCCESS', code, variables, newLocale);
                    return {
                        ...message,
                        result: {
                            ...message.result,
                            translatedMessage,
                        },
                    };
                }
                return message;
            });

            return {
                ...s,
                messages: updatedMessages,
            };
        });
    }

    locale.subscribe(newLocale => {
        if (newLocale) {
            updateTranslations(newLocale);
        }
    });

    const sendMessage = (message: BaseMessage) => {
        if (message.action != "auth") {
            message.env = {
                ...message.env,
                transaction: generateRandomCode(),
            };
        }
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        } else {
            state.update(s => ({
                ...s,
                messageModal: {
                    status: 'error',
                    message: 'WebSocket is not connected',
                },
            }));
        }
    };

    function closeModal() {
        state.update(s => ({ ...s, messageModal: null }));
    }

    const isConnected = derived(state, $state => $state.isConnected);
    const messages = derived(state, $state => $state.messages);
    const messageModal = derived(state, $state => $state.messageModal);
    const formModal = derived(state, $state => $state.formModal);

    return {
        subscribe: state.subscribe,
        connect,
        sendMessage,
        closeModal,
        updateTranslations,
        isConnected,
        messages,
        messageModal,
        formModal
    };
}

export const websocketStore = createWebSocketStore();
