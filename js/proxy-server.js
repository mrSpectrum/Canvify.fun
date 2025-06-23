const http = require('http');
const fetch = require('node-fetch');

// Configuration
const PORT = 3000;
const OPENAI_API_URL = 'https://api.openai.com/v1';

// API key will be updated dynamically
let OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

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
      
      // Handle API key update endpoint
      if (path === '/api/update-key') {
        const requestData = JSON.parse(body);
        OPENAI_API_KEY = requestData.apiKey;
        console.log('API key updated successfully');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }
      
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
        if (!OPENAI_API_KEY) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'OpenAI API key not configured. Please set your API key in the chat interface.'
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
          
          let errorMessage = 'OpenAI API error';
          if (openaiResponse.status === 401) {
            errorMessage = 'Invalid API key. Please check your OpenAI API key.';
          } else if (openaiResponse.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
          } else if (openaiResponse.status === 402) {
            errorMessage = 'Insufficient credits. Please check your OpenAI account billing.';
          }
          
          res.writeHead(openaiResponse.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: errorMessage
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
  
  if (OPENAI_API_KEY) {
    console.log('✅ OpenAI API key configured from environment variable');
  } else {
    console.log('⚠️  No API key found in environment. Users can set it through the chat interface.');
  }
});