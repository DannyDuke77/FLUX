import { useEffect, useRef, useCallback } from 'react';

const DEBUG = process.env.NODE_ENV !== 'production';
const INITIAL_DELAY = 5000;

export const useTicketSocket = (onUpdate: () => void) => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) return;

    const socket = new WebSocket(`${wsUrl}/tickets/`);

    socket.onopen = () => {
      if (DEBUG) console.log('WebSocket connected via Nginx proxy');

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (DEBUG) console.log("Real-time update received:", data);
        onUpdate();
      } catch (err) {
        if (DEBUG) console.error("Failed to parse socket message:", err);
      }
    };

    socket.onclose = (e) => {
      if (DEBUG) console.log(`Socket closed: ${e.reason}. Reconnecting in 3s...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    socket.onerror = (error) => {
      if (DEBUG) console.error('WebSocket Error:', error);
      socket.close();
    };

    socketRef.current = socket;
  }, [onUpdate]);

  useEffect(() => {
    // Delay first connection
    initialTimeoutRef.current = setTimeout(() => {
      connect();
    }, INITIAL_DELAY);

    return () => {
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);
};