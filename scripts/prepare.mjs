import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

mkdirSync("src-assets", { recursive: true });

const props = JSON.parse(readFileSync("input/props.json", "utf8"));
if (!props.audioUrl) throw new Error("props.audioUrl missing");
if (!Array.isArray(props.scenes) || props.scenes.length === 0)
  throw new Error("props.scenes missing or empty");

console.log("Downloading audio:", props.audioUrl.slice(0, 60) + "...");
const res = await fetch(props.audioUrl);
if (!res.ok) throw new Error("Audio download failed: " + res.status);
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync("src-assets/audio.wav", buf);
console.log("Audio saved:", buf.length, "bytes");

function wavDuration(b) {
  if (b.length < 44 || b.toString("ascii", 0, 4) !== "RIFF") return null;
  let off = 12;
  let byteRate = null;
  let dataSize = null;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "fmt " && off + 16 <= b.length) byteRate = b.readUInt32LE(off + 12);
    if (id === "data") {
      dataSize = size;
      break;
    }
    off += 8 + size + (size % 2);
  }
  if (!byteRate || !dataSize || byteRate <= 0) return null;
  return dataSize / byteRate;
}

const audioSeconds = wavDuration(buf) || null;
console.log("Audio duration:", audioSeconds, "s");

// Rescale scenes so the video ends exactly with the narration
let scenes = props.scenes;
if (audioSeconds) {
  const budget = Math.max(5, audioSeconds - 0.25);
  const total = scenes.reduce((a, s) => a + (s.duration || 15), 0);
  const q = (sec) => Math.max(1, Math.round(sec * 30) / 30);
  scenes = scenes.map((s) => ({
    ...s,
    duration: q((s.duration || 15) * (budget / total)),
  }));
  const sum = scenes.reduce((a, s) => a + s.duration, 0);
  const last = scenes[scenes.length - 1];
  last.duration = Math.max(2, Math.round((last.duration - (sum - budget)) * 30) / 30);
}

writeFileSync(
  "input/props.json",
  JSON.stringify({ ...props, scenes, audioSeconds }, null, 2)
);
console.log("Scene durations:", scenes.map((s) => s.duration).join(", "));
