async function checkTodayBackgrounds() {
  const url = "https://firestore.googleapis.com/v1/projects/yy10-ba274/databases/(default)/documents/backgrounds?pageSize=300";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.documents) {
      console.log(`Total backgrounds in Firestore: ${data.documents.length}`);
      const todayDocs = data.documents.filter(doc => {
        const ts = doc.fields?.createdAt?.timestampValue || "";
        return ts.startsWith("2026-09-21");
      });
      console.log(`Backgrounds added TODAY (2026-09-21): ${todayDocs.length}`);
      for (const d of todayDocs.slice(0, 10)) {
        const fields = d.fields || {};
        console.log(`- ID: ${d.name.split("/").pop()} | Title: ${fields.title?.stringValue} | FileId: ${fields.fileId?.stringValue?.slice(0, 20)}... | Category: ${fields.category?.stringValue}`);
      }
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

checkTodayBackgrounds();
