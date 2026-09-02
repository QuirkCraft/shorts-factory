import whisperPkg from "@remotion/install-whisper-cpp";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const { installWhisperCpp, downloadModel, transcribe, toTimeline } = whisperPkg;

const MODEL = "tiny.en";

const base = JSON.parse(readFileSync("input/props.json", "utf8"));

let captions = [];

try {
  console.log("Installing whisper.cpp...");
  const { dir } = await installWhisperCpp({ to: "whisper", version: "v1.7.4" });
  const modelDir = "whisper/models";
  const modelFile = `${modelDir}/ggml-${MODEL}.bin`;
  if (!existsSync(modelFile)) {
    console.log("Downloading model", MODEL, "...");
    await downloadModel({ model: MODEL, folder: modelDir });
  } else {
    console.log("Model already present:", modelFile);
  }

  console.log("Transcribing voiceover...");
  const { transcription } = await transcribe({
    input: "src-assets/audio.wav",
    model: MODEL,
    whisperPath: dir || "whisper",
    tokenLevel: true,
  });

  // Normalize tokens to word list with second timings
  let words = [];
  for (const tok of transcription || []) {
    const text = String(tok.text || tok.word || "").trim();
    if (!text) continue;
    let start = typeof tok.start === "number" ? tok.start : Number(tok.start);
    let end = typeof tok.end === "number" ? tok.end : Number(tok.end);
    if (!isFinite(start) || !isFinite(end)) continue;
    if (start > 10000 || end > 10000) {
      // timestamps look like milliseconds
      start = start / 1000;
      end = end / 1000;
    }
    words.push({ text, start, end });
  }

  // Group words into caption lines: max 3 words, break on >0.6s gap
  const lines = [];
  let cur = null;
  for (const w of words) {
    if (!cur) {
      cur = { words: [w], start: w.start, end: w.end };
    } else if (cur.words.length >= 3 || w.start - cur.end > 0.6) {
      lines.push(cur);
      cur = { words: [w], start: w.start, end: w.end };
    } else {
      cur.words.push(w);
      cur.end = w.end;
    }
  }
  if (cur) lines.push(cur);

  captions = lines.map((l) => ({
    text: l.words.map((w) => w.text).join(" "),
    start: l.start,
    end: l.end,
  }));

  console.log("Caption lines:", captions.length);
  if (captions.length === 0) throw new Error("Transcription produced no words");
} catch (e) {
  console.error("Whisper transcription failed, falling back to timed script:", e.message);
  // Fallback: distribute sentences evenly across total duration
  const total = base.scenes.reduce((a, s) => a + (s.duration || 15), 0);
  const sentences = (base.scenes || []).map((s) => s.text || "").filter(Boolean);
  const per = total / Math.max(1, sentences.length);
  captions = sentences.map((text, i) => ({
    text,
    start: i * per,
    end: (i + 1) * per - 0.05,
  }));
}

writeFileSync(
  "render-props.json",
  JSON.stringify(
    { scenes: base.scenes, audioUrl: base.audioUrl, captions },
    null,
    2
  )
);
console.log("render-props.json written");
