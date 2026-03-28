# CodeSync Deployment Plan ✅

## Local Development
```
# Server
cd ajit/server
node index.js  # port 4000

# Client  
cd ajit/client
npm run dev    # port 5173
```
Visit http://localhost:5173

## Production Deployment
1. **Backend (Render.com)**
```
git push origin main  # triggers auto-deploy
```
✅ Backend: https://codesync-realtime-collaborative-editor.onrender.com

2. **Frontend (Vercel)**
```
cd ajit/client
npm i -g vercel
vercel --prod
```
✅ Set env: `VITE_BACKEND_URL=https://codesync-realtime-collaborative-editor.onrender.com`

## Live URLs
🌐 Frontend: [your-vercel-url.vercel.app]
🔌 Backend: https://codesync-realtime-collaborative-editor.onrender.com

## GitHub Push
```
git init
git add .
git commit -m \"CodeSync: Production ready\"
git branch -M main  
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

