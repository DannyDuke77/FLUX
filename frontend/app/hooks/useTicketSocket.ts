import { useEffect, useRef, useCallback, useState } from 'react';

const DEBUG = process.env.NODE_ENV !== 'production';

const INITIAL_DELAY = 3000;

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export const useTicketSocket = (onUpdate: () => void, user: any): WsStatus => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');

  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const connect = useCallback(() => {
    if (!user) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) return;

    if (socketRef.current && (socketRef.current.readyState === WebSocket.CONNECTING || socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setWsStatus('connecting');
    const socket = new WebSocket(`${wsUrl}/tickets/`);

    socket.onopen = () => {
      if (DEBUG) console.log('WebSocket connected successfully');
      setWsStatus('connected');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (DEBUG) console.log("Real-time update received:", data);
        onUpdateRef.current();
      } catch (err) {
        if (DEBUG) console.error("Failed to parse socket message:", err);
      }
    };

    socket.onclose = (e) => {
      setWsStatus('disconnected');
      if (e.wasClean) return;
      if (DEBUG) console.log(`Socket closed. Reconnecting in 3s...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    socket.onerror = (error) => {
      if (DEBUG) console.error('WebSocket Error:', error);
      setWsStatus('disconnected');
      socket.close();
    };

    socketRef.current = socket;
  }, [user]);

  useEffect(() => {
    // Delay first connection
    initialTimeoutRef.current = setTimeout(() => {
      connect();
    }, INITIAL_DELAY);

    return () => {
      if (initialTimeoutRef.current) clearTimeout(initialTimeoutRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = () => {};
        socketRef.current.close();
      }
    };
  }, [connect]);

  return wsStatus;
};