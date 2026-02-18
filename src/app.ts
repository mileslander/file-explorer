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

// GET /
app.get('/', (req: Request, res: Response) => {
   let items = fs.readdirSync(ROOT_DIR, { withFileTypes: true });

   const showHidden = req.query.showHidden == 'true';
   if (!showHidden) {
      items = items.filter(item => !item.name.startsWith('.'));
   }
   
   const checked = showHidden ? 'checked' : '';

   const listItems = items.map(item => {
      if (item.isDirectory()) {
         return `<li><a href="/browse?path=${item.name}">${item.name}/</a></li>`;
      }
      return `<li>${item.name}</li>`;
   }).join('\n');

   const html = `<html>
      <body>
         <h1>${ROOT_DIR}</h1>
         <span style="color: grey; cursor: default;">&#11014; Up</span>
         <input type="checkbox" id="showHidden" ${checked}>
         <label for="showHidden">Show hidden files </label>
         <ul>${listItems}</ul>
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

   const listItems = items.map(item => {
      const itemPath = path.join(relativePath, item.name);
      if (item.isDirectory()) {
         return `<li><a href="/browse?path=${itemPath}">${item.name}/</a></li>`;
      }
      return `<li>${item.name}</li>`;
   }).join('\n');

   const parentPath = path.dirname(relativePath);
   const upLink = parentPath === '.'
      ? `<a href="/">&#11014; Up</a>`
      : `<a href="/browse?path=${parentPath}">&#11014; Up</a>`;

   const html = `<html>
      <body>
         <h1>${dirPath}</h1>
         ${upLink}
         <input type="checkbox" id="showHidden" ${checked}>
         <label for="showHidden">Show hidden files</label>
         <ul>${listItems}</ul>
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

// Read a file

app.get('/file', (req: Request, res: Response) => {
   const filePath = safePath(req.query.path as string || '');
   if (!filePath) {
      res.status(403).json({ error: 'Access denied' });
      return;
   }
   let content;
   try {
      content = fs.readFileSync(filePath, 'utf-8');
   } catch {
      res.status(404).send('File not found');
      return;
   }
   res.type('text/plain').send(content);
});

export default app;
