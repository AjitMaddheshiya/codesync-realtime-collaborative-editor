import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Editor from "@monaco-editor/react";
import { useParams, useLocation } from 'react-router-dom';
import Axios from "axios";
import { toast } from 'sonner';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '⚡' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚙️' },
  { id: 'csharp', name: 'C#', icon: '🎯' },
  { id: 'php', name: 'PHP', icon: '🐘' },
  { id: 'html', name: 'HTML', icon: '🌐' },
  { id: 'css', name: 'CSS', icon: '🎨' },
  { id: 'json', name: 'JSON', icon: '📄' },
  { id: 'sql', name: 'SQL', icon: '🗄️' },
  { id: 'rust', name: 'Rust', icon: '🦀' }
];

const THEMES = [
  { id: 'vs-dark', name: 'Dark', icon: '🌙' },
  { id: 'vs-light', name: 'Light', icon: '☀️' },
  { id: 'hc-black', name: 'High Contrast', icon: '⚫' }
];

function Playground() {
  const { id } = useParams();
  const location = useLocation();
  const userName = location?.state?.userName || 'Anonymous';

  const [socket, setSocket] = useState(null);
  const [text, setText] = useState('');
  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [selectedTheme, setSelectedTheme] = useState('vs-dark');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);

  // ✅ Socket setup
  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    if (!BACKEND_URL) {
      console.error("Backend URL missing");
      return;
    }

    const newSocket = io(BACKEND_URL);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // ✅ API Calls
  const getRoomContent = async () => {
    try {
      const res = await Axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-room-content`, {
        params: { roomName: id }
      });
      setText(res.data.content || '');
    } catch {
      toast.error('Failed to load room content');
    }
  };

  const getRoomUsers = async () => {
    try {
      const res = await Axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-room-users`, {
        params: { roomName: id }
      });
      setUsers(res.data.users || []);
    } catch {}
  };

  // ✅ Socket listeners (SAFE)
  useEffect(() => {
    if (!socket) return;

    getRoomContent();
    getRoomUsers();

    socket.emit('joinRoom', id, userName);

    socket.on('textUpdated', (data) => {
      setText(data);
    });

    socket.on('usersList', (data) => {
      setUsers(data || []);
    });

    socket.on('chatMessage', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('userTyping', (data) => {
      if (data.userName !== userName) {
        setTypingUsers(prev => [...prev, data]);
      }
    });

    socket.on('userStoppedTyping', (data) => {
      setTypingUsers(prev =>
        prev.filter(u => u.userName !== data.userName)
      );
    });

    return () => {
      socket.emit('leaveRoom', id);

      socket.off('textUpdated');
      socket.off('usersList');
      socket.off('chatMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [socket, id, userName]);

  // ✅ Editor change
  const handleTextChange = (value) => {
    setText(value);
    socket?.emit('updateText', id, value);
  };

  // ✅ Chat send
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      userName,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    socket?.emit('sendMessage', { roomName: id, message });
    setNewMessage('');
  };

  return (
    <div className="h-screen flex flex-col">

      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between">
        <div>Room: {id}</div>
        <div>{userName}</div>
      </div>

      {/* Main */}
      <div className="flex flex-1">

        {/* Editor */}
        <div className={`flex-1 ${showChat ? 'w-2/3' : 'w-full'}`}>
          <Editor
            height="100%"
            theme={selectedTheme}
            language={selectedLanguage}
            value={text}
            onChange={handleTextChange}
          />
        </div>

        {/* Chat */}
        {showChat && (
          <div className="w-1/3 bg-gray-800 text-white p-2 flex flex-col">
            <div className="flex-1 overflow-auto">
              {chatMessages.map(m => (
                <div key={m.id}>
                  <strong>{m.userName}</strong>: {m.text}
                </div>
              ))}
            </div>

            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="p-2 text-black"
            />
          </div>
        )}

      </div>

      {/* Users */}
      <div className="bg-gray-900 text-white p-2 flex gap-2">
        {users.map(u => (
          <span key={u.socketId}>{u.userName}</span>
        ))}
      </div>

    </div>
  );
}

export default Playground;