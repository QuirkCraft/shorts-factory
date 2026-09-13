import { readFileSync, writeFileSync } from 'fs';

const props = JSON.parse(readFileSync('input/props.json', 'utf8'));
const meta = props.meta || {};
const title = String(meta.title || 'Untitled').slice(0, 100);
const description = String(meta.description || '').slice(0, 4900);
const tags = Array.isArray(meta.tags) ? meta.tags.slice(0, 15) : [];
const privacy = String(meta.privacyStatus || 'private');

async function accessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  const t = await res.json();
  if (!t.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(t).slice(0, 300));
  return t.access_token;
}

const tok = await accessToken();
const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4' },
  body: JSON.stringify({
    snippet: { title, description, tags, categoryId: '22' },
    status: { privacyStatus: privacy, selfDeclaredMadeForKids: false }
  })
});
if (!init.ok) throw new Error('Resumable init failed: ' + init.status + ' ' + (await init.text()).slice(0, 300));
const location = init.headers.get('location');
if (!location) throw new Error('No upload location returned');
const bytes = readFileSync('out/video.mp4');
const up = await fetch(location, { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body: bytes });
const txt = await up.text();
if (!up.ok) throw new Error('YouTube upload failed: ' + up.status + ' ' + txt.slice(0, 300));
const done = JSON.parse(txt);
const status = {
  videoId: done.id,
  title,
  url: 'https://youtube.com/shorts/' + done.id,
  privacyStatus: (done.status && done.status.privacyStatus) || privacy,
  date: new Date().toISOString(),
  logged: false
};
writeFileSync('input/status.json', JSON.stringify(status, null, 2));
console.log('UPLOADED ' + done.id + ' -> ' + status.url);