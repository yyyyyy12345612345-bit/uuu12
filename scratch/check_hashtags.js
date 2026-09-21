async function checkHashtagsInDb() {
  const url = "https://firestore.googleapis.com/v1/projects/yy10-ba274/databases/(default)/documents/backgrounds?pageSize=300";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) return console.log("No documents");
    let count = 0;
    for (const d of data.documents) {
      const f = d.fields || {};
      const title = f.title?.stringValue || "";
      const tags = f.tags?.arrayValue?.values?.map(v => v.stringValue) || [];
      if (title.includes("#") || tags.some(t => t?.includes("#"))) {
        count++;
        console.log(`Doc ID: ${d.name.split("/").pop()} | Title: ${title} | Tags: ${tags.join(", ")}`);
      }
    }
    console.log(`Total documents with '#': ${count}`);
  } catch (e) {
    console.error(e);
  }
}

checkHashtagsInDb();
