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

for (const s of props.scenes) {
  if (!s.src)
    throw new Error("Scene missing src: " + JSON.stringify(s).slice(0, 120));
}
console.log("Scenes validated:", props.scenes.length);
