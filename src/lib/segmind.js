const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Vite proxy path — bypasses 403 Forbidden embedding
const SPACE_URL = "/api/proxy";
// Real space URL — used for constructing file result URLs
const REAL_SPACE_URL = "https://kwai-kolors-kolors-virtual-try-on.hf.space";

console.log("≡ƒöæ Env Check:", {
  hasHfToken: !!HF_TOKEN,
  hasCloudName: !!CLOUD_NAME,
  hfPrefix: HF_TOKEN ? HF_TOKEN.substring(0, 12) + "..." : "MISSING",
});

/** Upload image to Cloudinary, return secure_url */
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Cloudinary upload failed");
  if (!data.secure_url) throw new Error("Cloudinary returned no URL");
  return data.secure_url;
}

/** Upload a file to the HF Space /upload endpoint via proxy */
async function uploadFileToSpace(file, signal) {
  const formData = new FormData();
  formData.append("files", file, file.name);

  const headers = {};
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const res = await fetch(`${SPACE_URL}?target=/upload`, {
    method: "POST",
    headers,
    body: formData,
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (HTTP ${res.status}): ${text}`);
  }

  const paths = await res.json();
  if (!paths || paths.length === 0) throw new Error("Space upload returned no file path");

  const filePath = paths[0];
  return {
    path: filePath,
    url: `${REAL_SPACE_URL}/file=${filePath}`,
    orig_name: file.name,
    size: file.size,
    mime_type: file.type || "image/jpeg",
    meta: { _type: "gradio.FileData" }
  };
}

/**
 * Join the Gradio queue.
 */
async function joinQueue(personFileData, garmentFileData, sessionHash, signal) {
  const headers = { "Content-Type": "application/json" };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const res = await fetch(`${SPACE_URL}?target=/queue/join`, {
    method: "POST",
    headers,
    signal,

    body: JSON.stringify({
      data: [
        personFileData,  // person image FileData
        garmentFileData, // garment image FileData
        42,              // seed
        true,            // random_seed
      ],
      event_data: null,
      fn_index: 2,
      trigger_id: 26,
      session_hash: sessionHash,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Queue join failed (HTTP ${res.status}): ${text}`);
  }

  const data = await res.json();
  console.log("≡ƒôï Queue join response:", data);
  if (!data.event_id) throw new Error("Queue join returned no event_id");
  return data.event_id;
}

/**
 * Poll the SSE stream using the SESSION HASH.
 */
function pollQueueResult(sessionHash, timeout = 180000, signal = null) {
  return new Promise((resolve, reject) => {
    const url = `${SPACE_URL}?target=/queue/data&session_hash=${sessionHash}`;
    console.log("≡ƒôí Polling SSE:", url);

    const headers = {};
    if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

    const controller = new AbortController();
    if (signal) { signal.addEventListener("abort", () => controller.abort()); }
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("Timed out (3 min). The AI is busy — please try again later."));
    }, timeout);

    fetch(url, { headers, signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`SSE stream failed (HTTP ${res.status}): ${text}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            reject(new Error("SSE stream ended without a result. Please try again."));
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep incomplete last line

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            let event;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            console.log("≡ƒôí SSE event:", event.msg, event);

            if (event.msg === "process_completed") {
              clearTimeout(timeoutId);
              controller.abort();

              // ✅ Handle server-side errors properly
              if (event.success === false) {
                const serverError =
                  event.output?.error ||
                  (event.output?.data?.[2] && typeof event.output.data[2] === "string"
                    ? event.output.data[2]
                    : null) ||
                  "The AI server is busy. Please try again in a moment.";
                reject(new Error(serverError));
                return;
              }

              const outputData = event.output?.data;
              if (!outputData || outputData.length === 0) {
                reject(new Error("The AI server returned no result. Please try again."));
                return;
              }

              // outputData = [resultImage, seedUsed, infoText]
              const imgData = outputData[0];
              const infoText = outputData[2]; // "Success" or error message

              console.log("🖼️ imgData:", imgData, "| info:", infoText);

              // ✅ Check if the result image is null (server returned error silently)
              if (!imgData) {
                const msg =
                  typeof infoText === "string" && infoText
                    ? infoText
                    : "The AI server could not process your image. Please try again.";
                reject(new Error(msg));
                return;
              }

              let rawUrl =
                typeof imgData === "string"
                  ? imgData
                  : imgData?.url ||
                    (imgData?.path ? `${REAL_SPACE_URL}/file=${imgData.path}` : null);

              // Route the image download through our proxy to bypass 403 Forbidden
              let imgUrl = rawUrl;
              if (rawUrl && rawUrl.startsWith(REAL_SPACE_URL)) {
                const pathPart = rawUrl.substring(REAL_SPACE_URL.length);
                imgUrl = `${SPACE_URL}?target=${encodeURIComponent(pathPart)}`;
              }

              if (!imgUrl) {
                console.error("Unexpected output:", outputData);
                reject(new Error("Could not extract image URL from AI result."));
                return;
              }

              console.log("≡ƒû╝∩╕Å Result image URL:", imgUrl);

              // Fetch the image through the Vite proxy and convert to blob URL
              try {
                const proxiedImgUrl = imgUrl.startsWith(REAL_SPACE_URL)
                  ? imgUrl.replace(REAL_SPACE_URL, SPACE_URL)
                  : imgUrl;

                const imgHeaders = {};
                if (HF_TOKEN) imgHeaders["Authorization"] = `Bearer ${HF_TOKEN}`;

                const imgRes = await fetch(proxiedImgUrl, { headers: imgHeaders });
                if (!imgRes.ok) throw new Error(`Image fetch failed (HTTP ${imgRes.status})`);

                const blob = await imgRes.blob();
                const blobUrl = URL.createObjectURL(blob);
                console.log("✅ Blob URL created:", blobUrl);
                resolve(blobUrl);
              } catch (fetchErr) {
                console.warn("⚠️ Could not proxy image, falling back to direct URL:", fetchErr.message);
                resolve(imgUrl);
              }
              return;
            }

            if (event.msg === "process_errored") {
              clearTimeout(timeoutId);
              controller.abort();
              reject(new Error(event.output?.error || "AI processing failed. Please try again."));
              return;
            }

            if (event.msg === "queue_full") {
              clearTimeout(timeoutId);
              controller.abort();
              reject(new Error("The AI queue is full. Please wait a moment and try again."));
              return;
            }
          }
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err.name !== "AbortError") reject(err);
      });
  });
}

/**
 * Full Virtual Try-On flow with automatic retry.
 */
export async function runVirtualTryOn(modelFile, garmentFile, _garmentDescription, retryCount = 0, signal = null) {
  if (!HF_TOKEN) {
    throw new Error("Hugging Face token missing — set VITE_HF_TOKEN in .env");
  }

  const sessionHash = Math.random().toString(36).substring(2, 12);
  console.log("≡ƒöæ Session hash:", sessionHash);

  console.log("📤 Uploading images to HF Space...");
  const [personFileData, garmentFileData] = await Promise.all([
    uploadFileToSpace(modelFile, signal),
    uploadFileToSpace(garmentFile, signal),
  ]);
  console.log("✅ Uploaded:", { personFileData, garmentFileData });

  console.log("🚀 Joining queue with session_hash:", sessionHash);
  const eventId = await joinQueue(personFileData, garmentFileData, sessionHash, signal);
  console.log("⏳ Queued, event_id:", eventId);

  console.log("🎨 Polling SSE with session_hash:", sessionHash);
  try {
    const resultUrl = await pollQueueResult(sessionHash, 180000, signal);
    console.log("🎉 Done:", resultUrl);
    return resultUrl;
  } catch (err) {
    // Auto-retry once for transient server errors
    const isTransient =
      err.message.includes("busy") ||
      err.message.includes("Too many") ||
      err.message.includes("try again");

    if (isTransient && retryCount < 2) {
      console.warn(`⚠️ Transient error, retrying (${retryCount + 1}/2)...`, err.message);
      await new Promise((r) => setTimeout(r, 3000)); // wait 3s before retry
      return runVirtualTryOn(modelFile, garmentFile, _garmentDescription, retryCount + 1, signal);
    }
    throw err;
  }
}

/** Full flow including Cloudinary backup storage */
export async function fullTryOnFlow(modelFile, garmentFile, garmentDescription, signal = null) {
  const resultUrl = await runVirtualTryOn(modelFile, garmentFile, garmentDescription, 0, signal);

  // Upload to Cloudinary for persistent storage (non-blocking, optional)
  const [modelUrl, garmentUrl] = await Promise.all([
    uploadToCloudinary(modelFile).catch(() => null),
    uploadToCloudinary(garmentFile).catch(() => null),
  ]);

  return { modelUrl, garmentUrl, resultUrl };
}
