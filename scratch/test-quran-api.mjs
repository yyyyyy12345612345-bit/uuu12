async function testSearch() {
  const query = "الم";
  const url = `https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=20&language=ar`;
  console.log("Testing URL:", url);
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Response keys:", Object.keys(data));
    if (data.search) {
      console.log("Search keys:", Object.keys(data.search));
      console.log("Results count:", data.search.results?.length);
      if (data.search.results?.length > 0) {
        console.log("First result:", data.search.results[0]);
      }
    } else {
      console.log("Full data:", JSON.stringify(data).substring(0, 500));
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testSearch();
