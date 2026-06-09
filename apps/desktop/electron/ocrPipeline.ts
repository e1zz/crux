import { desktopCapturer, screen } from "electron";
import Tesseract from "tesseract.js";
import path from "path";
import fs from "fs/promises";
import os from "os";

let isDebug = process.env.CRUX_DEBUG === 'true' || process.env.CRUX_DEBUG === '1';
const debugDir = path.join(process.cwd(), 'crux-debug-screenshots');

export function setOcrDebugMode(enabled: boolean) {
  isDebug = enabled;
  console.log(`[OCR] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
}

export async function captureScoreboard() {
  console.log("Capturing scoreboard...");
  try {
    // 1. Capture the primary display using Electron's native desktopCapturer
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width, height },
    });

    if (sources.length === 0) {
      throw new Error("No screen sources found for capture");
    }

    // Use the first available screen (usually primary)
    const screenSource = sources[0];
    const imgBuffer = screenSource.thumbnail.toPNG();
    
    const tmpPath = path.join(os.tmpdir(), `crux-scoreboard-${Date.now()}.png`);
    await fs.writeFile(tmpPath, imgBuffer);
    console.log(`Saved screenshot to ${tmpPath}`);

    // 2. Perform OCR with explicit worker path for Electron/Node.js
    console.time("Tesseract OCR");
    
    // Resolve the correct path to the tesseract.js node worker script
    const workerPath = path.join(__dirname, "..", "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js");
    
    const { data: { text } } = await Tesseract.recognize(
      tmpPath,
      'eng',
      { 
        // Must be a function, never undefined, to prevent worker thread errors
        logger: isDebug ? (m: any) => console.log(m) : () => {},
        workerPath,
      }
    );
    
    console.timeEnd("Tesseract OCR");
    console.log("OCR Result length:", text.length);

    if (isDebug) {
      console.log("--- RAW OCR TEXT START ---");
      console.log(text);
      console.log("--- RAW OCR TEXT END ---");
      
      try {
        await fs.mkdir(debugDir, { recursive: true });
        const debugPath = path.join(debugDir, `crux-scoreboard-debug-${Date.now()}.png`);
        await fs.copyFile(tmpPath, debugPath);
        console.log(`[DEBUG] Saved inspection screenshot to ${debugPath}`);
      } catch (err) {
        console.error("[DEBUG] Failed to save debug screenshot:", err);
      }
    }

    // Extract BattleTags
    const battleTags = extractBattleTags(text);
    console.log("Detected BattleTags:", battleTags);

    // Clean up temp file (debug copies are preserved in debugDir)
    await fs.unlink(tmpPath).catch(() => {});

    return { battleTags };
  } catch (err) {
    console.error("Scoreboard capture/OCR failed", err);
    return null;
  }
}

function extractBattleTags(text: string): string[] {
  const regex = /[A-Za-z0-9]+[#-]\d{4,5}/g;
  const matches = text.match(regex);
  if (!matches) return [];
  return [...new Set(matches)];
}
