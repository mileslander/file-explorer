import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Create app and set root dir

const app = express()
app.set('json spaces', 2);

const ROOT_DIR = os.homedir();


// Safely resolve paths

function safePath(relativePath: string): string | null {
   const resolved = path.resolve(ROOT_DIR, relativePath);
   if (!resolved.startsWith(ROOT_DIR)) {
      return null;
   }
   return resolved;
}

function formatSize(bytes : number): string {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
   if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`; 
   return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

// GET /
app.get('/', (req: Request, res: Response) => {
   let items = fs.readdirSync(ROOT_DIR, { withFileTypes: true });

   const showHidden = req.query.showHidden == 'true';
   if (!showHidden) {
      items = items.filter(item => !item.name.startsWith('.'));
   }
   
   const checked = showHidden ? 'checked' : '';

   const dirs = items.filter(item => item.isDirectory());
   const files = items.filter(item => item.isFile());

   const dirRows = dirs.map(item => {
      const stat = fs.statSync(path.join(ROOT_DIR, item.name));
      const modified = stat.mtime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `<tr><td><a href="/browse?path=${item.name}">${item.name}/</a></td><td></td><td>${modified}</td></tr>`;
   });

   const fileRows = files.map(item => {
      const stat = fs.statSync(path.join(ROOT_DIR, item.name));
      const size = formatSize(stat.size);       
      const modified = stat.mtime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `<tr><td><a href="/file?path=${item.name}">${item.name}</a></td><td>${size}</td><td>${modified}</td></tr>`;
   });

   const separator = `<tr><td colspan="3"><hr></td></tr>`;
   const listItems = [...dirRows, separator, ...fileRows].join('\n'); 

   const html = `<html>
      <head><style>td { padding-right: 2rem; }</style></head>
      <body>
         <h1>${ROOT_DIR}</h1>
         <span style="color: grey; cursor: default;">&#11014; Up</span>
         <input type="checkbox" id="showHidden" ${checked}>
         <label for="showHidden">Show hidden files </label>
         <table>${listItems}</table>
         <script>
            document.getElementById('showHidden').addEventListener('change', function(){
               const url = new URL(window.location.href);
               if (this.checked) {
                  url.searchParams.set('showHidden', 'true');
               } else {
                    url.searchParams.delete('showHidden');
               }
               window.location.href = url.toString();
            });
         </script>
      </body>
   </html>`;

   res.type('text/html').send(html);
});

// GET /browse 
app.get('/browse', (req: Request, res: Response) => {
   const relativePath = req.query.path as string || '';
   const dirPath = safePath(relativePath);
   if (!dirPath) {
      res.status(403).json({ error: 'Access denied' });
      return;
   }

   let items;
   try {
      items = fs.readdirSync(dirPath, { withFileTypes: true });
   } catch {
      res.status(404).send('Directory not found');
      return;
   }

   const showHidden = req.query.showHidden == 'true';
   if (!showHidden) {
      items = items.filter(item => !item.name.startsWith('.'));
   }

   const checked = showHidden ? 'checked' : '';

   const dirs = items.filter(item => item.isDirectory());
   const files = items.filter(item => item.isFile());

   const dirRows = dirs.map(item => {
      const stat = fs.statSync(path.join(dirPath, item.name));
      const modified = stat.mtime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `<tr><td><a href="/browse?path=${path.join(relativePath, item.name)}">${item.name}/</a></td><td></td><td>${modified}</td></tr>`;
   });

   const fileRows = files.map(item => {
      const stat = fs.statSync(path.join(dirPath, item.name));
      const size = formatSize(stat.size);       
      const modified = stat.mtime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `<tr><td><a href="/file?path=${path.join(relativePath, item.name)}">${item.name}/</a></td><td>${size}</td><td>${modified}</td></tr>`;
   });

   const separator = `<tr><td colspan="3"><hr></td></tr>`;
   const listItems = [...dirRows, separator, ...fileRows].join('\n');   

   const parentPath = path.dirname(relativePath);
   const upLink = parentPath === '.'
      ? `<a href="/">&#11014; Up</a>`
      : `<a href="/browse?path=${parentPath}">&#11014; Up</a>`;

   const html = `<html>
      <head><style>td { padding-right: 2rem; }</style></head>
      <body>
         <h1>${dirPath}</h1>
         ${upLink}
         <input type="checkbox" id="showHidden" ${checked}>
         <label for="showHidden">Show hidden files</label>
         <table>${listItems}</table>
         <script>
            document.getElementById('showHidden').addEventListener('change', function(){
               const url = new URL(window.location.href);
               if (this.checked) {
                  url.searchParams.set('showHidden', 'true');
               } else {
                    url.searchParams.delete('showHidden');
               }
               window.location.href = url.toString();
            });
         </script>
      </body>
   </html>`;

   res.type('text/html').send(html);
});

// GET /file

app.get('/file', (req: Request, res: Response) => {
   const filePath = safePath(req.query.path as string || '');
   if (!filePath) {
      res.status(403).json({ error: 'Access denied' });
      return;
   }
   let buffer;
   try {
      buffer = fs.readFileSync(filePath);
   } catch {
      res.status(404).send('File Not Found')
      return;
   }
   if (buffer.includes(0)) {
      res.status(415).send('Binary File Not Supported')
      return;
   }
   res.type('text/plain').send(buffer.toString('utf-8'))
});

export default app;
