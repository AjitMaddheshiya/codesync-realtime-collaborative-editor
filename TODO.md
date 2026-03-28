# CodeSync Run & Deploy Plan

## Current Status
✅ Backend: Express + Socket.IO (port 4000, in-memory rooms)
✅ Frontend: React + Vite (port 5173)
✅ Features: Real-time collab coding + chat + users list

## Local Run Commands
```
# Terminal 1 - Server
cd ajit/server
npm install
npm start
# or node index.js
```

```
# Terminal 2 - Client  
cd ajit/client
npm install
npm run dev
```

Visit http://localhost:5173

## GitHub Push
```
git init
git add .
git commit -m "CodeSync: Real-time collaborative code editor"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/CODE-sync-main.git
git push -u origin main
```

## Vercel Deploy (Frontend only)
1. Backend → Render/Heroku (Socket.IO needs server)
2. Frontend → Vercel:
   ```
   cd ajit/client
   vercel --prod
   ```
   Set env: `VITE_API_URL=https://your-backend.onrender.com`

## Next Steps
- [ ] Add README with screenshots/GIF
- [ ] GitHub Actions CI
- [ ] Deploy backend

