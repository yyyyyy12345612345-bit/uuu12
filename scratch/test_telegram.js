const token = "8831057960:AAFaDRBVdOYScPQ7lMQVcSHb7os8D8QRezY";
const fileId = "BAACAgQAAxkBAAMEakmUBs5bKMDk400Hf2E9mRN910EAAqwyAAIBRVFSNvw4VmO40uQ8BA";

async function test() {
  const getFileUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
  console.log("Calling URL:", getFileUrl);
  try {
    const res = await fetch(getFileUrl);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
