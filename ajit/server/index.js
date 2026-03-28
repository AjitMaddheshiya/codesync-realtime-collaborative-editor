const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

// In-memory rooms storage (no MongoDB)
const rooms = new Map();

const PORT = process.env.PORT || 4000;

// Create room endpoint - in-memory
app.post('/create-room', async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName || userName.trim() === '') {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    const roomName = uuidv4();
    rooms.set(roomName, {
      name: roomName,
      content: '',
      users: [],
      chatMessages: []
    });
    console.log(`Room created: ${roomName} by ${userName}`);
    res.json({ roomName });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room content endpoint - in-memory
app.get('/get-room-content', async (req, res) => {
  try {
    const roomName = req.query.roomName;
    const roomData = rooms.get(roomName);
    if (!roomData) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ content: roomData.content || '' });
  } catch (error) {
    console.error('Error getting room content:', error);
    res.status(500).json({ error: 'Failed to get room content' });
  }
});

// Get room users endpoint - in-memory
app.get('/get-room-users', async (req, res) => {
  try {
    const roomName = req.query.roomName;
    const roomData = rooms.get(roomName);
    if (!roomData) {
      return res.status(404).json({ error: 'Room not found' });
    }
    console.log(`Room ${roomName} has ${roomData.users.length} users:`, roomData.users.map(u => u.userName));
    res.json({ users: roomData.users || [] });
  } catch (error) {
    console.error('Error getting room users:', error);
    res.status(500).json({ error: 'Failed to get room users' });
  }
});

// Get room chat messages endpoint - in-memory
app.get('/get-room-chat', async (req, res) => {
  try {
    const roomName = req.query.roomName;
    const roomData = rooms.get(roomName);
    if (!roomData) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ messages: roomData.chatMessages || [] });
  } catch (error) {
    console.error('Error getting room chat:', error);
    res.status(500).json({ error: 'Failed to get room chat' });
  }
});

// Helper function to update and broadcast user list - in-memory
const updateAndBroadcastUsers = async (roomName) => {
  try {
    const roomData = rooms.get(roomName);
    if (roomData) {
      console.log(`Broadcasting updated user list for room ${roomName}:`, roomData.users.map(u => u.userName));
      io.to(roomName).emit('usersList', roomData.users);
    }
  } catch (error) {
    console.error('Error updating and broadcasting users:', error);
  }
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
socket.on('joinRoom', async (roomName, userName) => {
  try {
    console.log(`User ${userName} (${socket.id}) joining room: ${roomName}`);
    
    // Add user to room - in-memory
    let roomData = rooms.get(roomName);
    if (!roomData) {
      return socket.emit('error', 'Room not found');
    }
    
    // Remove user if already exists
    roomData.users = roomData.users.filter(user => user.socketId !== socket.id);
    
    // Add new user
    roomData.users.push({
      socketId: socket.id,
      userName: userName,
      joinedAt: new Date()
    });
    
    // Join socket room
    socket.join(roomName);
    
    // Notify others
    socket.to(roomName).emit('userJoined', `${userName} has joined the room`);
    
    // Send current users list and chat history
    socket.emit('roomUsers', roomData.users);
    socket.emit('chatHistory', roomData.chatMessages || []);
    
    // Broadcast updated users list
    await updateAndBroadcastUsers(roomName);
  } catch (error) {
    console.error('Error joining room:', error);
  }
});
  
socket.on('updateText', async (roomName, updatedText) => {
  try {
    const roomData = rooms.get(roomName);
    if (roomData) {
      roomData.content = updatedText;
      socket.to(roomName).emit('textUpdated', updatedText);
    }
  } catch (error) {
    console.error('Error updating text:', error);
  }
});

// Chat functionality - in-memory
  socket.on('sendMessage', async (data) => {
    try {
      const { roomName, message } = data;
      const roomData = rooms.get(roomName);
      
      if (roomData) {
        roomData.chatMessages.push(message);
        io.to(roomName).emit('chatMessage', message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Typing indicators
  socket.on('userTyping', (data) => {
    socket.to(data.roomName).emit('userTyping', data);
  });

  socket.on('userStoppedTyping', (data) => {
    socket.to(data.roomName).emit('userStoppedTyping', data);
  });
  
socket.on('leaveRoom', async (roomName) => {
  try {
    const roomData = rooms.get(roomName);
    if (roomData) {
      const userIndex = roomData.users.findIndex(user => user.socketId === socket.id);
      if (userIndex !== -1) {
        const userName = roomData.users[userIndex].userName;
        roomData.users.splice(userIndex, 1);
        
        socket.to(roomName).emit('userLeft', `${userName} has left the room`);
        await updateAndBroadcastUsers(roomName);
      }
    }
    socket.leave(roomName);
  } catch (error) {
    console.error('Error leaving room:', error);
  }
});
  
socket.on('disconnect', async () => {
  console.log('User disconnected:', socket.id);
  
  // Remove user from all rooms - in-memory
  try {
    for (const [roomName, roomData] of rooms) {
      const userIndex = roomData.users.findIndex(user => user.socketId === socket.id);
      if (userIndex !== -1) {
        const userName = roomData.users[userIndex].userName;
        roomData.users.splice(userIndex, 1);
        
        io.to(roomName).emit('userLeft', `${userName} has disconnected`);
        await updateAndBroadcastUsers(roomName);
      }
    }
  } catch (error) {
    console.error('Error handling disconnect:', error);
  }
});
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
