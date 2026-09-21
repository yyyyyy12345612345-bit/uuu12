const token = "8831057960:AAFaDRBVdOYScPQ7lMQVcSHb7os8D8QRezY";

async function inspect() {
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=5`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Total received:", data.result ? data.result.length : 0);
  if (data.result && data.result.length > 0) {
    for (const update of data.result) {
      console.log("Update ID:", update.update_id);
      const post = update.channel_post || update.edited_channel_post || update.message;
      if (post) {
        console.log("Chat ID:", post.chat?.id, "| Title:", post.chat?.title, "| Type:", post.chat?.type);
        console.log("Has Video:", !!post.video, "| Video file_id:", post.video?.file_id?.slice(0, 25));
        console.log("Caption:", post.caption);
      }
    }
  }
}

inspect();
