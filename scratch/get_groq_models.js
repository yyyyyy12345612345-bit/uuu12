const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const envPath = path.join(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('.env.local not found');
      return;
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GROQ_API_KEY=(.+)/);
    if (!match) {
      console.log('GROQ_API_KEY not found in .env.local');
      return;
    }
    const apiKey = match[1].trim();
    if (apiKey === 'YOUR_GROQ_API_KEY_HERE') {
      console.log('GROQ_API_KEY is placeholder');
      return;
    }

    console.log('Fetching models from Groq API...');
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      console.error(text);
      return;
    }

    const data = await response.json();
    console.log('Available models:');
    const models = data.data.map(m => m.id);
    console.log(JSON.stringify(models, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
