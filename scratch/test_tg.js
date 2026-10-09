const token = "8884703655:AAEBNWXP8aLsmpWr2iZ9ZMfYtVs26TZG9UQ";
const fileId = "BAACAgQAAyEFAAMBBBDDBAACAQABasj3-2HC3GmliAUInscAAapa_NvSAAITHgACqfgAAVJVJth0VCYBVD0E";

async function run() {
  const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
}
run();
