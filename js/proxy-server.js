const http = require('http');
const fetch = require('node-fetch');

// Configuration
const PORT = 3000;
const OPENAI_API_URL = 'https://api.openai.com/v1';

// You'll need to set this environment variable or replace with your API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';

// Create the server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse the request URL
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  
  // Only proxy requests to /api/*
  if (!path.startsWith('/api/')) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  
  // Collect request body data
  let body = [];
  req.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', async () => {
    try {
      body = Buffer.concat(body).toString();
      
      // Handle different API endpoints
      if (path === '/api/tags') {
        // Mock the Ollama tags endpoint for OpenAI models
        const mockModels = {
          models: [
            { name: 'gpt-3.5-turbo' },
            { name: 'gpt-4' },
            { name: 'gpt-4-turbo' }
          ]
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockModels));
        return;
      }
      
      if (path === '/api/generate') {
        // Convert Ollama-style request to OpenAI format
        const ollamaRequest = JSON.parse(body);
        
        // Check if API key is set
        if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable or update the proxy server.'
          }));
          return;
        }
        
        // Map model names
        let openaiModel = 'gpt-3.5-turbo';
        if (ollamaRequest.model && ollamaRequest.model.includes('gpt-4')) {
          openaiModel = ollamaRequest.model;
        }
        
        const openaiRequest = {
          model: openaiModel,
          messages: [
            {
              role: 'user',
              content: ollamaRequest.prompt
            }
          ],
          temperature: ollamaRequest.options?.temperature || 0.7,
          max_tokens: 2000
        };
        
        console.log(`Making OpenAI API request with model: ${openaiModel}`);
        
        // Make request to OpenAI
        const openaiResponse = await fetch(`${OPENAI_API_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify(openaiRequest)
        });
        
        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.error('OpenAI API error:', errorText);
          res.writeHead(openaiResponse.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: `OpenAI API error: ${errorText}`
          }));
          return;
        }
        
        const openaiData = await openaiResponse.json();
        
        // Convert OpenAI response to Ollama format
        const ollamaResponse = {
          response: openaiData.choices[0].message.content,
          done: true
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(ollamaResponse));
        return;
      }
      
      // Handle unknown endpoints
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
      
    } catch (error) {
      console.error('Proxy error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: `Proxy Error: ${error.message}`
      }));
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log(`Proxying requests to OpenAI API`);
  console.log('Make sure to set your OPENAI_API_KEY environment variable!');
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.log('\n⚠️  WARNING: OpenAI API key not configured!');
    console.log('Set your API key by running: export OPENAI_API_KEY=your_actual_api_key');
    console.log('Or update the OPENAI_API_KEY variable in js/proxy-server.js');
  }
});