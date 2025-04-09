import OpenAI from 'openai';
import axios from 'axios';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const apiKey = config.openaiApiKey;
  const apiBaseUrl = config.public.apiBaseUrl;
  const apiToken = config.apiToken;

  console.log(`API Base URL: ${apiBaseUrl}`);

  if (!apiKey && apiBaseUrl === '/api') {
    throw createError({
      statusCode: 500,
      message: 'No API configuration available. Please set OPENAI_API_KEY or API_BASE_URL.'
    });
  }

  // Add formatting instructions to the system message
  const messages = [...body.messages];
  
  // Find the system message index
  const systemMessageIndex = messages.findIndex(msg => msg.role === 'system');
  
  // Enhance system message or add one if it doesn't exist
  const formattingInstructions = 
    'Format your responses using markdown. For code blocks, use proper syntax highlighting with triple backticks and language specification. ' +
    'Use appropriate formatting for lists, headings, and other structured content. Make your responses visually clear and well-organized.';

  if (systemMessageIndex >= 0) {
    messages[systemMessageIndex].content += ' ' + formattingInstructions;
  } else {
    messages.unshift({
      role: 'system',
      content: 'You are a helpful, friendly, and concise AI assistant. ' + formattingInstructions
    });
  }

  try {
    // Use custom API endpoint if provided and it's not the default '/api'
    if (apiBaseUrl && apiBaseUrl !== '/api') {
      console.log(`Using custom API endpoint: ${apiBaseUrl}`);
      
      // Prepare the exact format that the custom endpoint expects
      const requestPayload = {
        model: "gpt-4o-mini", // Specify model for compatibility
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      };
      
      try {
        // Custom API endpoint implementation with proper endpoints and headers
        const response = await axios.post(`${apiBaseUrl}/v1/chat/completions`, requestPayload, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`, // Use the token from config
          },
          validateStatus: status => status < 500 // Accept any non-500 status for proper error handling
        });
        
        // Check if we got a valid JSON response
        if (response.headers['content-type']?.includes('application/json')) {
          console.log("Received JSON response from custom API");
          
          // Handle standard OpenAI-compatible response format
          if (response.data && response.data.choices && response.data.choices[0]?.message?.content) {
            return {
              message: response.data.choices[0].message.content,
              status: 'success'
            };
          } 
          // Alternative response format
          else if (response.data && typeof response.data.message === 'string') {
            return {
              message: response.data.message,
              status: 'success'
            };
          }
          // Generic object response - look for content in standard locations
          else if (response.data) {
            const content = response.data.content || 
                          response.data.answer || 
                          response.data.text || 
                          response.data.result || 
                          JSON.stringify(response.data);
                          
            return {
              message: typeof content === 'string' ? content : JSON.stringify(content),
              status: 'success'
            };
          }
        } 
        // Non-JSON response handling (HTML, etc.)
        else {
          console.error("Received non-JSON response from custom API:", 
                      response.headers['content-type']);
          
          throw new Error(`Unexpected response type: ${response.headers['content-type']}`);
        }
      } catch (error: any) {
        console.error("Custom API call failed:", error.message);
        
        if (error.response) {
          console.error(`Response status: ${error.response.status}`);
          if (error.response.headers['content-type']?.includes('application/json')) {
            console.error("Response data:", JSON.stringify(error.response.data).substring(0, 200) + "...");
          } else {
            console.error(`Non-JSON error response type: ${error.response.headers['content-type']}`);
          }
        }
        
        // Fall back to OpenAI if we have a key
        if (apiKey) {
          console.log("Falling back to official OpenAI API after custom endpoint failed");
          return await useOpenAI(apiKey, messages);
        }
        
        throw createError({
          statusCode: error.response?.status || 500,
          message: error.message || 'Error calling custom API endpoint'
        });
      }
    } else if (apiKey) {
      // Use standard OpenAI client directly
      return await useOpenAI(apiKey, messages);
    } else {
      throw new Error("No API configuration available");
    }
  } catch (error: any) {
    console.error('Error calling API:', error);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response type:', error.response.headers['content-type'] || 'unknown');
    }
    
    throw createError({
      statusCode: error.response?.status || error.status || 500,
      message: error.message || 'Error processing your request'
    });
  }
});

// Helper function to use the OpenAI API
async function useOpenAI(apiKey: string, messages: any[]) {
  console.log("Using official OpenAI API");
  const openai = new OpenAI({
    apiKey
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000,
  });

  return {
    message: response.choices[0]?.message?.content || '',
    status: 'success'
  };
} 