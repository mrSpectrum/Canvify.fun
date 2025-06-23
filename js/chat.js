/**
 * Chat Widget with OpenAI Integration (via proxy)
 * Uses OpenAI models to provide AI assistance for the GenAI Canvas
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatButton = document.getElementById('chat-button');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    const statusIndicator = document.querySelector('.status-indicator');

    // API configuration
    const API_BASE = 'http://localhost:3000/api';
    let MODEL = 'gpt-3.5-turbo';
    let API_KEY = localStorage.getItem('openai_api_key') || '';

    // Model selector
    const modelSelector = document.getElementById('model-selector');

    // Chat state
    let isChatOpen = false;
    let isAPIAvailable = false;
    let isWaitingForResponse = false;

    // Initialize chat
    initChat();

    // Event listeners
    chatButton.addEventListener('click', toggleChat);
    closeChat.addEventListener('click', toggleChat);
    sendButton.addEventListener('click', sendMessage);
    document.getElementById('clear-chat').addEventListener('click', clearChat);

    // Model selection event listener
    modelSelector.addEventListener('change', function() {
        MODEL = this.value;
        console.log(`Model changed to ${MODEL}`);
        // Check connection with the new model
        checkAPIStatus();
    });

    document.getElementById('check-connection').addEventListener('click', () => {
        // Add a message to indicate checking connection
        addAIMessage("Checking connection to OpenAI API...");
        // Check connection
        checkAPIStatus();
        // Add a visual feedback by rotating the button
        const button = document.getElementById('check-connection');
        button.style.transform = 'translateY(-50%) rotate(360deg)';
        setTimeout(() => {
            button.style.transform = 'translateY(-50%)';
        }, 1000);
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    /**
     * Function to populate model dropdown with API key check
     */
    async function populateModelDropdown() {
        try {
            // Check if API key is available
            if (!API_KEY) {
                // Show API key input interface
                showAPIKeyInput();
                return;
            }

            // Update proxy server with the API key
            await updateProxyAPIKey(API_KEY);

            const response = await fetch(`${API_BASE}/tags`);

            if (response.ok) {
                const data = await response.json();
                const models = data.models || [];

                // Clear the dropdown
                modelSelector.innerHTML = '';

                if (models.length === 0) {
                    // No models found
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No models available';
                    modelSelector.appendChild(option);
                    return;
                }

                // Add each model to the dropdown
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    modelSelector.appendChild(option);

                    // Set the first model as default if MODEL is empty
                    if (MODEL === '' && model === models[0]) {
                        MODEL = model.name;
                        option.selected = true;
                    }
                });

                // Set default selection
                if (MODEL) {
                    modelSelector.value = MODEL;
                }

                // Trigger change event to update UI
                const event = new Event('change');
                modelSelector.dispatchEvent(event);
            } else {
                throw new Error(`Failed to fetch models: ${response.status}`);
            }
        } catch (error) {
            console.error('Error populating model dropdown:', error);
            // Add a default option
            modelSelector.innerHTML = '<option value="">Error loading models</option>';
            
            // If it's an API key issue, show the input
            if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
                showAPIKeyInput();
            }
        }
    }

    /**
     * Show API key input interface
     */
    function showAPIKeyInput() {
        const apiKeyMessage = `
            <div class="api-key-input-container">
                <h4>🔑 OpenAI API Key Required</h4>
                <p>To use the AI assistant, please enter your OpenAI API key:</p>
                <div class="api-key-form">
                    <input type="password" id="api-key-input" placeholder="sk-..." style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="window.chatModule.saveAPIKey()" style="background: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save Key</button>
                        <button onclick="window.chatModule.showAPIKeyHelp()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Help</button>
                    </div>
                </div>
                <p style="font-size: 0.8rem; color: #666; margin-top: 10px;">
                    Your API key is stored locally in your browser and never shared with third parties.
                </p>
            </div>
        `;
        
        chatMessages.innerHTML = apiKeyMessage;
        
        // Update model selector to show API key needed
        modelSelector.innerHTML = '<option value="">API Key Required</option>';
        statusIndicator.classList.add('offline');
    }

    /**
     * Save API key and reinitialize
     */
    function saveAPIKey() {
        const apiKeyInput = document.getElementById('api-key-input');
        const newAPIKey = apiKeyInput.value.trim();
        
        if (!newAPIKey) {
            addAIMessage("❌ Please enter a valid API key.");
            return;
        }
        
        if (!newAPIKey.startsWith('sk-')) {
            addAIMessage("❌ Invalid API key format. OpenAI API keys start with 'sk-'.");
            return;
        }
        
        // Save to localStorage and update current key
        API_KEY = newAPIKey;
        localStorage.setItem('openai_api_key', API_KEY);
        
        // Clear messages and reinitialize
        chatMessages.innerHTML = '';
        addAIMessage("✅ API key saved successfully! Initializing AI assistant...");
        
        // Reinitialize the chat
        setTimeout(() => {
            initChat();
        }, 1000);
    }

    /**
     * Show API key help
     */
    function showAPIKeyHelp() {
        const helpMessage = `
            <div class="api-key-help">
                <h4>🔑 How to get your OpenAI API Key</h4>
                <ol style="padding-left: 20px; line-height: 1.6;">
                    <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" style="color: var(--primary-color);">OpenAI API Keys page</a></li>
                    <li>Sign in to your OpenAI account (or create one)</li>
                    <li>Click "Create new secret key"</li>
                    <li>Copy the key (it starts with "sk-")</li>
                    <li>Paste it in the input field above</li>
                </ol>
                <p style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px; font-size: 0.9rem;">
                    <strong>Note:</strong> You may need to add billing information to your OpenAI account to use the API.
                </p>
                <button onclick="window.chatModule.showAPIKeyInput()" style="background: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Back to API Key Input</button>
            </div>
        `;
        
        chatMessages.innerHTML = helpMessage;
    }

    /**
     * Update proxy server with new API key
     */
    async function updateProxyAPIKey(apiKey) {
        try {
            await fetch(`${API_BASE}/update-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey })
            });
        } catch (error) {
            console.error('Error updating API key:', error);
        }
    }

    /**
     * Clear the chat history
     */
    function clearChat() {
        // Clear all messages
        chatMessages.innerHTML = '';

        // Add a system message
        addAIMessage("Chat history cleared. How can I help you with your AI Canvas?");

        // Add visual feedback
        const button = document.getElementById('clear-chat');
        button.classList.add('active');
        setTimeout(() => {
            button.classList.remove('active');
        }, 300);
    }

    /**
     * Initialize the chat widget
     */
    async function initChat() {
        // First populate the model dropdown
        await populateModelDropdown();

        // Then check if API is available
        await checkAPIStatus();

        // Add welcome message only if API key is available
        if (API_KEY) {
            setTimeout(() => {
                addAIMessage(`👋 Hi there! I'm your AI assistant powered by OpenAI. I can help you improve your AI Canvas by providing suggestions and answering questions. 

💡 **Tip:** Fill out all 12 canvas sections first, then use the "Analyze Canvas" button for comprehensive recommendations!

What would you like help with today?`);
            }, 500);
        }
    }

    /**
     * Toggle chat widget visibility
     */
    function toggleChat() {
        isChatOpen = !isChatOpen;
        chatContainer.style.display = isChatOpen ? 'flex' : 'none';

        if (isChatOpen) {
            chatInput.focus();
            // Check API status when opening chat
            checkAPIStatus();
        }
    }

    /**
     * Check if API is available
     */
    async function checkAPIStatus() {
        try {
            if (!API_KEY) {
                isAPIAvailable = false;
                statusIndicator.classList.add('offline');
                modelSelector.style.borderColor = '#f72585';
                return;
            }

            console.log(`Checking API connection at ${API_BASE}...`);

            // Update proxy with current API key
            await updateProxyAPIKey(API_KEY);

            const response = await fetch(`${API_BASE}/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Available models:', data.models.map(m => m.name));

                const hasSelectedModel = data.models.some(model => model.name === MODEL);
                console.log(`Has ${MODEL} model:`, hasSelectedModel);

                if (hasSelectedModel) {
                    isAPIAvailable = true;
                    statusIndicator.classList.remove('offline');
                    // Update the model selector to show it's connected
                    modelSelector.style.borderColor = '#4cc9f0';
                    console.log('API connection successful');
                } else {
                    throw new Error(`Model '${MODEL}' not found.`);
                }
            } else {
                console.error(`API check failed with status: ${response.status}`);
                throw new Error(`API service responded with status ${response.status}`);
            }
        } catch (error) {
            console.error('API connection error:', error);
            isAPIAvailable = false;
            statusIndicator.classList.add('offline');
            // Reset the model selector to show it's offline
            modelSelector.style.borderColor = '#f72585';

            // Add error message if chat is open and no messages yet
            if (isChatOpen && chatMessages.children.length <= 1) {
                if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
                    showAPIKeyInput();
                } else {
                    addAIMessage(`⚠️ I couldn't connect to the OpenAI API. Please make sure:
1. The proxy server is running: npm run proxy
2. Your OpenAI API key is valid
3. You have internet connectivity`);
                }
            }
        }
    }

    /**
     * Check if all canvas sections are filled
     */
    function checkCanvasCompletion() {
        const canvasData = getCanvasData();
        const requiredSections = [
            'task-type', 'human-judgment', 'action', 'outcome', 
            'input-data', 'training-data', 'feedback-loop', 
            'value-proposition', 'risks-responsible-ai'
        ];
        
        const filledSections = requiredSections.filter(sectionId => {
            const sectionData = canvasData[sectionId];
            return sectionData && sectionData.textarea && sectionData.textarea.trim() !== '';
        });
        
        return {
            total: requiredSections.length,
            filled: filledSections.length,
            isComplete: filledSections.length === requiredSections.length,
            missingSections: requiredSections.filter(sectionId => {
                const sectionData = canvasData[sectionId];
                return !sectionData || !sectionData.textarea || sectionData.textarea.trim() === '';
            })
        };
    }

    /**
     * Send a message to the AI
     */
    async function sendMessage() {
        const message = chatInput.value.trim();

        if (!message || isWaitingForResponse) return;

        // Add user message to chat
        addUserMessage(message);

        // Clear input
        chatInput.value = '';

        // Check if API is available
        if (!isAPIAvailable) {
            if (!API_KEY) {
                addAIMessage("⚠️ Please set up your OpenAI API key first to use the AI assistant.");
                showAPIKeyInput();
            } else {
                addAIMessage("⚠️ I can't process your request because the OpenAI API is not available. Please check your connection and API key, then try again.");
                checkAPIStatus();
            }
            return;
        }

        // Check canvas completion for analysis requests
        const completionStatus = checkCanvasCompletion();
        if (message.toLowerCase().includes('analyz') || message.toLowerCase().includes('review') || message.toLowerCase().includes('feedback')) {
            if (!completionStatus.isComplete) {
                addAIMessage(`📝 I notice you're asking for analysis, but your canvas isn't complete yet. You've filled ${completionStatus.filled} out of ${completionStatus.total} required sections.

**Missing sections:**
${completionStatus.missingSections.map(id => `• ${getSectionName(id)}`).join('\n')}

💡 **Tip:** For the best analysis, fill out all sections first, then use the "Analyze Canvas" button in the sidebar. This will give you comprehensive quality scores and detailed recommendations!

Would you like help with any specific section instead?`);
                return;
            }
        }

        // Show thinking indicator
        const thinkingId = showThinking();
        isWaitingForResponse = true;

        try {
            // Get canvas data for context
            const canvasData = getCanvasData();

            // Format canvas data as context
            const context = formatCanvasContext(canvasData);

            // Prepare prompt with context
            const prompt = `
You are an AI assistant helping a user with their AI Canvas.
The canvas is a tool for planning and analyzing both traditional and generative AI projects.

Here's the current state of the user's canvas:
${context}

Based on this information, please provide helpful, constructive feedback and suggestions.
Focus on helping the user improve their canvas entries and think more deeply about their AI project.

User message: ${message}
`;

            // Send request to API
            console.log("Sending request to OpenAI API...");
            const response = await fetch(`${API_BASE}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: MODEL,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7
                    }
                })
            });

            console.log('API response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response from API');
            }

            const data = await response.json();

            // Remove thinking indicator
            removeThinking(thinkingId);

            // Add AI response to chat
            addAIMessage(data.response);

        } catch (error) {
            console.error('Error getting AI response:', error);

            // Remove thinking indicator
            removeThinking(thinkingId);

            // Add detailed error message
            if (error.message.includes('Failed to fetch')) {
                addAIMessage(`Error: Could not connect to the AI service. Please ensure the proxy server is running:\n\nnpm run proxy`);
                isAPIAvailable = false;
                // Re-check connection
                checkAPIStatus();
            } else if (error.message.includes('API key')) {
                addAIMessage(`Error: OpenAI API key issue. Please check your API key.`);
                showAPIKeyInput();
            } else {
                addAIMessage(`Sorry, I encountered an error while processing your request: ${error.message}. Please try again later.`);
            }
        } finally {
            isWaitingForResponse = false;
        }
    }

    /**
     * Get section name from ID
     */
    function getSectionName(sectionId) {
        const sectionNames = {
            'task-type': 'Task Type',
            'human-judgment': 'Human Judgment & Oversight',
            'action': 'Action',
            'outcome': 'Outcome',
            'input-data': 'Input Data / Prompts / Features',
            'training-data': 'Training/Fine-tuning Data',
            'feedback-loop': 'Feedback Loop',
            'value-proposition': 'Value Proposition',
            'risks-responsible-ai': 'Risks & Responsible AI',
            'model-selection': 'Model Selection & Prompt Engineering',
            'content-moderation': 'Content Moderation & Quality Control',
            'transparency-ux': 'Transparency & User Experience'
        };
        return sectionNames[sectionId] || sectionId;
    }

    /**
     * Add a user message to the chat
     */
    function addUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    /**
     * Add an AI message to the chat
     */
    function addAIMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        messageElement.innerHTML = formatMessage(text);
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    /**
     * Show thinking indicator
     * @returns {string} ID of the thinking element
     */
    function showThinking() {
        const id = 'thinking-' + Date.now();
        const thinkingElement = document.createElement('div');
        thinkingElement.className = 'message thinking';
        thinkingElement.id = id;

        // Add dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            thinkingElement.appendChild(dot);
        }

        chatMessages.appendChild(thinkingElement);
        scrollToBottom();
        return id;
    }

    /**
     * Remove thinking indicator
     */
    function removeThinking(id) {
        const thinkingElement = document.getElementById(id);
        if (thinkingElement) {
            thinkingElement.remove();
        }
    }

    /**
     * Format message with markdown-like syntax
     */
    function formatMessage(text) {
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');

        // Bold text
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic text
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Code blocks
        text = text.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Lists
        text = text.replace(/^\d+\.\s+(.*?)(?=<br>|$)/gm, '<li>$1</li>');
        text = text.replace(/^-\s+(.*?)(?=<br>|$)/gm, '<li>$1</li>');
        text = text.replace(/^•\s+(.*?)(?=<br>|$)/gm, '<li>$1</li>');

        // Replace consecutive list items with a list
        text = text.replace(/(<li>.*?<\/li>)+/g, (match) => {
            return '<ul class="chat-list">' + match + '</ul>';
        });

        // Headings
        text = text.replace(/^###\s+(.*?)(?=<br>|$)/gm, '<h4>$1</h4>');
        text = text.replace(/^##\s+(.*?)(?=<br>|$)/gm, '<h3>$1</h3>');
        text = text.replace(/^#\s+(.*?)(?=<br>|$)/gm, '<h2>$1</h2>');

        return text;
    }

    /**
     * Scroll chat to bottom
     */
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Get all canvas data
     */
    function getCanvasData() {
        const canvasData = {};

        document.querySelectorAll('.section').forEach(section => {
            const sectionId = section.id;
            canvasData[sectionId] = {};

            // Get textarea values
            section.querySelectorAll('textarea').forEach(element => {
                canvasData[sectionId]['textarea'] = element.value;
            });
        });

        return canvasData;
    }

    /**
     * Format canvas data as context for the AI
     */
    function formatCanvasContext(canvasData) {
        let context = '';

        // Map section IDs to readable names
        const sectionNames = {
            'task-type': 'Task Type',
            'human-judgment': 'Human Judgment & Oversight',
            'action': 'Action',
            'outcome': 'Outcome',
            'input-data': 'Input Data / Prompts / Features',
            'training-data': 'Training/Fine-tuning Data',
            'feedback-loop': 'Feedback Loop',
            'value-proposition': 'Value Proposition',
            'risks-responsible-ai': 'Risks & Responsible AI',
            'model-selection': 'Model Selection & Prompt Engineering',
            'content-moderation': 'Content Moderation & Quality Control',
            'transparency-ux': 'Transparency & User Experience'
        };

        // Format each section
        Object.entries(canvasData).forEach(([sectionId, data]) => {
            const sectionName = sectionNames[sectionId] || sectionId;
            context += `## ${sectionName}\n`;

            // Add textarea content
            if (data.textarea) {
                context += `${data.textarea}\n`;
            } else {
                context += `[Empty]\n`;
            }

            context += '\n';
        });

        return context;
    }

    // Expose functions to global scope for onclick handlers
    window.chatModule = {
        saveAPIKey,
        showAPIKeyHelp,
        showAPIKeyInput
    };
});