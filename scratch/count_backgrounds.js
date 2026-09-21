async function checkFirestoreCount() {
  const url = "https://firestore.googleapis.com/v1/projects/yy10-ba274/databases/(default)/documents/backgrounds?pageSize=100";
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.documents) {
      console.log(`Successfully fetched ${data.documents.length} backgrounds from Firestore!`);
      const sample = data.documents.slice(0, 5).map(doc => {
        const fields = doc.fields || {};
        return {
          id: doc.name.split("/").pop(),
          title: fields.title?.stringValue,
          category: fields.category?.stringValue,
          fileId: fields.fileId?.stringValue?.slice(0, 15) + "...",
          createdAt: fields.createdAt?.timestampValue,
        };
      });
      console.log("Sample records:", JSON.stringify(sample, null, 2));
    } else {
      console.log("Response:", data);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

checkFirestoreCount();
