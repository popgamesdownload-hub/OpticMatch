FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=frontend-build /app/dist ./dist
COPY backend ./backend
COPY package.json ./package.json
EXPOSE 3000
CMD ["node", "-e", "const http=require('http'),fs=require('fs'),path=require('path');const port=process.env.PORT||3000;const root=path.join(process.cwd(),'dist');http.createServer((req,res)=>{const p=req.url==='/'?'/index.html':req.url;const file=path.join(root,p.split('?')[0]);if(p==='/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true}));}fs.readFile(file,(e,d)=>{if(!e){res.writeHead(200);res.end(d)}else{fs.readFile(path.join(root,'index.html'),(x,h)=>{res.writeHead(200,{'content-type':'text/html'});res.end(h)})}})}).listen(port,'0.0.0.0')"]
