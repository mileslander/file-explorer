import request from 'supertest';
import app from './app';

describe('GET /', () => {
  it('returns 200 with HTML listing the home directory', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<ul>');
  });

  it('includes hidden files when showHidden=true', async () => {
    const res = await request(app).get('/?showHidden=true');
    expect(res.status).toBe(200);
    expect(res.text).toContain('checked');
  });
});

describe('GET /browse', () => {
  it('returns 403 for path traversal attempts', async () => {
    const res = await request(app).get('/browse?path=../../../etc');
    expect(res.status).toBe(403);
  });

  it('returns 404 for a nonexistent directory', async () => {
    const res = await request(app).get('/browse?path=__nonexistent_dir_12345__');
    expect(res.status).toBe(404);
  });
});

describe('GET /file', () => {
  it('returns 403 for path traversal attempts', async () => {
    const res = await request(app).get('/file?path=../../../etc/passwd');
    expect(res.status).toBe(403);
  });

  it('returns 404 for a nonexistent file', async () => {
    const res = await request(app).get('/file?path=__nonexistent_file_12345__.txt');
    expect(res.status).toBe(404);
  });
});
