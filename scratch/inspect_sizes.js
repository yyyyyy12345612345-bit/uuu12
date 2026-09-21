const token = "8831057960:AAFaDRBVdOYScPQ7lMQVcSHb7os8D8QRezY";

async function inspectAll() {
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=100`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.result) return console.log("No updates");

  console.log(`Total updates fetched: ${data.result.length}`);
  let videoCount = 0;
  let docCount = 0;
  let over20MBCount = 0;
  let otherChatCount = 0;

  for (const update of data.result) {
    const post = update.channel_post || update.edited_channel_post || update.message;
    if (!post) continue;
    if (post.chat?.id !== -1004363174660) {
      otherChatCount++;
      continue;
    }
    if (post.video) {
      videoCount++;
      const sizeMB = post.video.file_size / (1024 * 1024);
      if (sizeMB > 20) {
        over20MBCount++;
        console.log(`WARNING: Video over 20MB (${sizeMB.toFixed(2)} MB): file_id ${post.video.file_id}`);
      }
    } else if (post.document) {
      docCount++;
      const sizeMB = post.document.file_size / (1024 * 1024);
      console.log(`Document found: ${post.document.file_name} (${sizeMB.toFixed(2)} MB)`);
    }
  }

  console.log(`Summary:
- Valid Videos in channel: ${videoCount}
- Videos > 20MB: ${over20MBCount}
- Documents: ${docCount}
- Other chats: ${otherChatCount}`);
}

inspectAll();
