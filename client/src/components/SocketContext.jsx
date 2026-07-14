import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../lib/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!user && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setLoading(true);
      return;
    }

    if (token && !socketRef.current) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        setSocket(newSocket);
        setLoading(false);
      });

      newSocket.on('disconnect', () => {
        setSocket(null);
        setLoading(true);
      });

      newSocket.on('connect_error', () => setLoading(false));
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, loading }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
