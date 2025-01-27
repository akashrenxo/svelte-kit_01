import { writable, get, derived } from 'svelte/store';
import { websocketStore } from '../websocket';
import type { Appointment, MessageEnv, AppointmentMessage } from '../MessageType/messagetype';


// Create the appointment store
function createAppointmentStore() {
  const appointments = writable<Appointment[]>([]); // Holds the list of appointments
  const isConnected = writable(false); // Tracks WebSocket connection status
  const errorState = writable<string | null>(null); // Holds error messages

  // Process incoming WebSocket messages
  const processWebSocketMessages = (messages: any[]) => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.action !== 'ListEntity') return;

    try {
      const result = latestMessage.params?.result;
      if (typeof result === 'string') {
        const parsedAppointments: Appointment[] = JSON.parse(result);

        if (Array.isArray(parsedAppointments)) {
          appointments.set(parsedAppointments);
          setError(null); // Clear previous errors
        } else {
          throw new Error('Parsed data is not a valid array.');
        }
      } else {
        console.warn('Unexpected result format:', result);
        setError('Received unexpected data format from server.');
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      setError('Failed to process appointments data.');
    }
  };

  // Subscribe to WebSocket updates
  const unsubscribeWebSocket = websocketStore.subscribe(($websocketStore) => {
    isConnected.set($websocketStore.isConnected);

    // Process messages if available
    if ($websocketStore.messages?.length) {
      processWebSocketMessages($websocketStore.messages);
    }
  });

  // Fetch appointments via WebSocket
  const fetchAppointments = async () => {
    if (!get(isConnected)) {
      setError('WebSocket is not connected. Please check your connection.');
      return;
    }

    const message: AppointmentMessage = {
      type: 'action',
      action: 'ListEntity',
      env: { user: 'U005' },
      params: { entityName: 'appointment' },
    };

    try {
      await websocketStore.sendMessage(message);
    } catch (error) {
      console.error('Error sending fetchAppointments message:', error);
      setError('Failed to fetch appointments. Please try again.');
    }
  };

  // Utility to set error messages
  const setError = (message: string | null) => {
    errorState.set(message);
  };

  // Reset the appointments store
  const resetAppointments = () => {
    appointments.set([]);
    setError(null);
  };

  // Derived store combining all states
  const combinedStore = derived(
    [appointments, isConnected, errorState],
    ([$appointments, $isConnected, $errorState]) => ({
      appointments: $appointments,
      isConnected: $isConnected,
      error: $errorState,
    })
  );

  // Cleanup logic
  const cleanup = () => {
    unsubscribeWebSocket(); // Unsubscribe from WebSocket
  };

  return {
    subscribe: combinedStore.subscribe, // Subscribe to the combined store
    fetchAppointments, // Fetch appointments via WebSocket
    reset: resetAppointments, // Reset the appointments
    cleanup, // Cleanup on destroy
  };
}

// Export the store instance
export const appointmentStore = createAppointmentStore();
