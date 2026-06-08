const admin = require('firebase-admin');
const serviceAccount = require('./yy10-ba274-firebase-adminsdk-fbsvc-77f9c6958a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'youssefosama@gmail.com';

admin.auth().getUserByEmail(email)
  .then((userRecord) => {
    return admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
  })
  .then(() => {
    console.log(`Successfully set admin claim for ${email}`);
    process.exit(0);
  })
  .catch((error) => {
    console.log('Error:', error);
    process.exit(1);
  });
