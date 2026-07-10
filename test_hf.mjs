import fs from 'fs';
import path from 'path';

const SPACE_URL = "https://kwai-kolors-kolors-virtual-try-on.hf.space";

async function testTryOn() {
  console.log("Creating dummy image...");
  // Create a 1x1 png image
  const dummyImg = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  
  // 1. Upload
  console.log("Uploading dummy image 1...");
  const formData1 = new FormData();
  formData1.append("files", new Blob([dummyImg], { type: 'image/png' }), "person.png");
  
  const res1 = await fetch(`${SPACE_URL}/upload`, { method: "POST", body: formData1 });
  const paths1 = await res1.json();
  console.log("Upload 1 res:", paths1);
  const p1 = paths1[0];

  const formData2 = new FormData();
  formData2.append("files", new Blob([dummyImg], { type: 'image/png' }), "garment.png");
  const res2 = await fetch(`${SPACE_URL}/upload`, { method: "POST", body: formData2 });
  const paths2 = await res2.json();
  console.log("Upload 2 res:", paths2);
  const p2 = paths2[0];

  // 2. Join Queue
  console.log("Joining queue...");
  const sessionHash = Math.random().toString(36).substring(2);
  const REAL_SPACE_URL = "https://kwai-kolors-kolors-virtual-try-on.hf.space";
  const joinRes = await fetch(`${SPACE_URL}/queue/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [
        { path: p1, url: `${REAL_SPACE_URL}/file=${p1}`, orig_name: "person.png", meta: { _type: "gradio.FileData" } },
        { path: p2, url: `${REAL_SPACE_URL}/file=${p2}`, orig_name: "garment.png", meta: { _type: "gradio.FileData" } },
        42,
        true
      ],
      event_data: null,
      fn_index: 2,
      trigger_id: 26,
      session_hash: sessionHash
    })
  });
  
  const joinData = await joinRes.json();
  console.log("Join response:", joinData);

  // 3. Poll
  console.log("Polling...");
  const pollRes = await fetch(`${SPACE_URL}/queue/data?session_hash=${sessionHash}`);
  const reader = pollRes.body.getReader();
  const decoder = new TextDecoder();
  
  while(true) {
    const { done, value } = await reader.read();
    if(done) break;
    const text = decoder.decode(value);
    console.log("SSE:\n" + text.trim());
    if (text.includes("process_completed")) {
      break;
    }
  }
}

testTryOn().catch(console.error);
