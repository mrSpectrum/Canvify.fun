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
  
  // Handle health check endpoint
  if (path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      hasApiKey: !!OPENAI_API_KEY 
    }));
    return;
  }
  
  // Only proxy requests to /api/*
  if (!path.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
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
        console.log('✅ API key updated successfully');
        
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

        // Validate API key format
        if (!OPENAI_API_KEY.startsWith('sk-')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Invalid API key format. OpenAI API keys should start with "sk-".'
          }));
          return;
        }
        
        // Map model names
        let openaiModel = 'gpt-3.5-turbo';
        if (ollamaRequest.model && ollamaRequest.model.includes('gpt-4')) {
          openaiModel = ollamaRequest.model;
        }

        // Validate and clean the prompt
        let prompt = ollamaRequest.prompt;
        if (!prompt || typeof prompt !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Invalid or missing prompt in request.'
          }));
          return;
        }

        // Truncate very long prompts to avoid token limits
        if (prompt.length > 12000) {
          prompt = prompt.substring(0, 12000) + '\n\n[Content truncated due to length]';
        }
        
        const openaiRequest = {
          model: openaiModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: Math.min(Math.max(ollamaRequest.options?.temperature || 0.7, 0), 2),
          max_tokens: 1500, // Reduced to avoid hitting limits
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        };
        
        console.log(`🤖 Making OpenAI API request with model: ${openaiModel}`);
        console.log(`📝 Prompt length: ${prompt.length} characters`);
        
        try {
          // Make request to OpenAI with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const openaiResponse = await fetch(`${OPENAI_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'User-Agent': 'AI-Canvas-Analyzer/1.0'
            },
            body: JSON.stringify(openaiRequest),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('❌ OpenAI API error:', openaiResponse.status, errorText);
            
            let errorMessage = 'OpenAI API error';
            let statusCode = openaiResponse.status;
            
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error && errorData.error.message) {
                errorMessage = errorData.error.message;
              }
            } catch (parseError) {
              // If we can't parse the error, use the status text
              errorMessage = `HTTP ${openaiResponse.status}: ${openaiResponse.statusText}`;
            }

            // Handle specific error cases
            if (openaiResponse.status === 401) {
              errorMessage = 'Invalid API key. Please check your OpenAI API key.';
            } else if (openaiResponse.status === 429) {
              errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
            } else if (openaiResponse.status === 402) {
              errorMessage = 'Insufficient credits. Please check your OpenAI account billing.';
            } else if (openaiResponse.status === 400) {
              errorMessage = 'Bad request. The prompt may be too long or contain invalid content.';
            } else if (openaiResponse.status >= 500) {
              errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
            }
            
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: errorMessage
            }));
            return;
          }
          
          const openaiData = await openaiResponse.json();
          console.log('✅ OpenAI API response received successfully');
          
          // Validate response structure
          if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
            throw new Error('Invalid response structure from OpenAI API');
          }
          
          // Convert OpenAI response to Ollama format
          const ollamaResponse = {
            response: openaiData.choices[0].message.content,
            done: true
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(ollamaResponse));
          
        } catch (fetchError) {
          console.error('❌ Network error:', fetchError);
          
          let errorMessage = 'Network error occurred while contacting OpenAI';
          if (fetchError.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again with a shorter prompt.';
          } else if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to OpenAI. Please check your internet connection.';
          }
          
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: errorMessage
          }));
        }
        return;
      }
      
      // Handle unknown endpoints
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
      
    } catch (error) {
      console.error('❌ Proxy error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: `Proxy Error: ${error.message}`
      }));
    }
  });
});

// Error handling for the server
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop any other processes using this port and try again.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Proxy server running at http://localhost:${PORT}`);
  console.log(`🔗 Proxying requests to OpenAI API`);
  
  if (OPENAI_API_KEY) {
    console.log('✅ OpenAI API key configured from environment variable');
  } else {
    console.log('⚠️  No API key found in environment. Users can set it through the chat interface.');
  }
  
  console.log('\n📋 Available endpoints:');
  console.log('  GET  /api/health - Health check');
  console.log('  GET  /api/tags - Available models');
  console.log('  POST /api/update-key - Update API key');
  console.log('  POST /api/generate - Generate AI response');
  console.log('\n💡 To use the AI features, make sure to:');
  console.log('  1. Keep this proxy server running');
  console.log('  2. Set your OpenAI API key in the chat interface');
  console.log('  3. Refresh the frontend application');
});