
export interface MessageEnv {
    user?: string;
    wh_id?: string;
    transaction?: string;
    orig_action?: string;
}

export interface MessageResult {
    code: string;
    message: string;
}

export interface BaseMessage {
    type: string |'action' | 'response' | 'UI' | 'submit';
    action: string;
    env?: MessageEnv;
    result?: MessageResult;
    params?: Record<string, any>;
    payload?: string | Record<string, any>;
}

export interface ResponseMessage extends BaseMessage {
    type: 'response';
    action: string |'function' | 'message' | 'workflow' | 'screen_name' | 'confirmation';
    result: MessageResult;  // Result is required for ResponseMessage
}

export interface WebSocketState {
    isConnected: boolean;
    messages: BaseMessage[];
    messageModal: { status: string; message: string } | null;
    formModal: any | null;
}

export interface EntityMessage extends BaseMessage {
    type: 'action';  // We're always sending action types from entityStore
    env: {
        user: string;  // We always include user in entityStore
        [key: string]: string;
    };
}

export interface AttributePath {
    [key: string]: string;
}

export interface EntityAttribute {
    data_type: string;
    mandatory: string;
    name: string;
    path: string | AttributePath;
    type: string;
}

export interface EntityInfo {
    attributes: EntityAttribute[];
    db: string;
    entity: string;
    table: string;
    type: string;
}

// src/lib/types/entityTypes.ts
export interface EntityAttribute {
    name: string;
    data_type: string;
    mandatory: string;  // Keep as string since it comes as "true"/"false" from API
    path: string | Record<string, string>;
    type: string;
}

export interface DisplayAttribute {
    name: string;
    data_type: string;
    mandatory: boolean;  // Convert to boolean for component use
    path?: string | Record<string, string>;
    type?: string;
}


// appointmentStore.ts
export interface Appointment {
    dock?: string; // Optional because not all records have this field
    duration: number;
    id: string;
    inbound_delivery: string;
    schedule: string;
    status: string;
    manually_set:boolean;
    transport_equipment?: string; // Optional because not all records have this field
  }

  export  interface AppointmentMessage {
    type: string | 'action' | 'response';
    action: string;
    env?: MessageEnv;
    params?: Record<string, any>;
    payload?: string | Record<string, any>;
  }
