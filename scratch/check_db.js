const admin = require("firebase-admin");
const serviceAccount = require("../yy10-ba274-firebase-adminsdk-fbsvc-77f9c6958a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkBackgrounds() {
  try {
    const snap = await db.collection("backgrounds").orderBy("createdAt", "desc").limit(5).get();
    console.log(`Found ${snap.size} backgrounds in database:`);
    snap.forEach(doc => {
      console.log(`- ID: ${doc.id}, Title: "${doc.data().title}", FileID: "${doc.data().fileId}", Created: ${doc.data().createdAt?.toDate()}`);
    });
  } catch (e) {
    console.error("Error checking backgrounds:", e);
  }
}

checkBackgrounds();
