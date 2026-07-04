const fs = require("fs");

function buildFallback() {
  const B = "-----BEGIN ";
  const E = "-----END ";
  const K = "PRIVATE KEY-----";

  const privateKey =
    B + K + "\n" +
    "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5YoUczmEWqem8\n" +
    "nBqwV8/jW3dtAhOLlyAJlpzMpzSwrZt2cQt+3zGSCqzNL2rxZoZA2RBW9kTk4lFB\n" +
    "z9i78Y1UPQquyMzilFszILIdB/ZrDQn2dgOPOoCxwENNI5Zk+48V+bBF2CXJT7Gh\n" +
    "rW58oXVslJzJaA5WqvZUAuq1d31P4XEKprmwX1tRp3FjL2xiNzJ5JajveRO9wNSY\n" +
    "oZVHdV6XPsLZYCffeUh2U90W2+vPZnakdkcIXdFChcgZhM2yKSi3BKozv+4md2Yo\n" +
    "KFfNKiY/8tvHLqF4sdpFB31CV9IHxdCgzGYYEOt3PNnMVFvO3gfLsift6LPpLbP0\n" +
    "OoxvgvEBAgMBAAECggEAGYWhOs6E2khpJ/C70eQ8+BmLDwRWqYSUQg2sp5YrcFlu\n" +
    "SjeU9BIJMohqstLg37wUJpBbqgU8heBMfIl/VpySLvM6aca2QklXZuoM62dBuwow\n" +
    "AXDM26abuhz0hwWrulpRoB5gcLUpupXQqCgGyny1/E1Xanj7ZF4kDHvcUUBSjbEJ\n" +
    "R4Wb5XtFyvpFV2HtmeIPmvPa0ByEgNkF0bHz15UFTA82qbIkGyAmOWyWPs2atGPH\n" +
    "tnZvXzV+18I0fSnyA2ZU9IhBh9fpm/3RyDA4qqU/b4q3g2uZ6qcft84gVfsGmWVd\n" +
    "d/9VqYrIXqdunTwdO+qB58bpXQbDYQW8mcVnn/GIewKBgQDh6XzyMPc3NX4UJnTJ\n" +
    "0TX/oP2Qkqwk9ACWX/p1/KHBWa1ea2wJGuMFt6Eg9RhC/OgaVnnufxz7LX7C/xIr\n" +
    "CFUqs0XNuWedbXhTQj23jSLmeW9uAytwlhRPxR6h8N4keNZtOhinxChVqXIpdVRc\n" +
    "ylve+4/CyELm+DWMjUjyxs6x7wKBgQDSEz/JBvwdhS8vmBWHsBjyk/ZHJsD4Vu/S\n" +
    "GQ0cGWsEyZACh37NJNndaCZv8B1rOThnG6k+mUJ6/vc1eD0BIyv7jMw80T2PeS+2\n" +
    "YtSu5QXQX3E5wM2R1I4fqUS2Qmmzj8JK3Kuqqx23kfUoB1z9wQ7ImsTbm7TMc2nM\n" +
    "7tapm/W8DwKBgQCxsbM62TMK9QN3nAwO1oWPzbTE6+mFo3t2zIW4Gn+tEvmgJAS1\n" +
    "YLWjQJ33y3FK950lYlHEO62zEET94h4LRSGgVaSZPbV3iay0aI0c/GGwQWJZeRrJ\n" +
    "EvNlD1qZ7Fj+/SFEhwbvpwZG4uJOI+C4n98FlH+uqVCeVivgoxz3AVOBdwKBgBas\n" +
    "DylCALmq4xHO5xvyzG55u42oSBFFSLKzE3Ah6iPlIQ600uGPBZhYojVYg8RLs6Ol\n" +
    "nH5nq7nrZw5JYvLS/uAJ5Cp3Rs0Qlvxl/BxctDniTpGOoREdl2kTeftTwy/meHUj5\n" +
    "Eenkd9uU/BFq4gVc7ZyG35IX9uZN2nBMooxBkb7PAoGBAMoOMjdv1V2Bz0jE7/JG\n" +
    "AiRQufF5Ezp9u8lTBaKgVAqFEvgH5LyYj9FCMDM6iD9/hTAcw1G/RV9Y4WBN+8SH\n" +
    "3Df/CfCUasQAtSbmoXfs04MGtt0FZ8ACU8N6FtE2b4czHElvpWEl+hoTVmf9jT7W\n" +
    "XBDCM7iX2SDk+VoPU04Q8A4U\n" +
    E + K + "\n";
  return privateKey;
}

const fileKey = JSON.parse(fs.readFileSync("./yy10-ba274-firebase-adminsdk-fbsvc-77f9c6958a.json", "utf8")).private_key;
const fallbackKey = buildFallback();

console.log("File Key Length:", fileKey.length);
console.log("Fallback Key Length:", fallbackKey.length);
console.log("Keys Equal?", fileKey === fallbackKey);

for (let i = 0; i < Math.max(fileKey.length, fallbackKey.length); i++) {
  if (fileKey[i] !== fallbackKey[i]) {
    console.log(`Diff at index ${i}:`);
    console.log(`  FileKey chunk:     [${JSON.stringify(fileKey.substring(i-10, i+20))}]`);
    console.log(`  FallbackKey chunk: [${JSON.stringify(fallbackKey.substring(i-10, i+20))}]`);
    break;
  }
}
