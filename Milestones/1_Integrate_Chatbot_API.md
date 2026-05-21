# Milestone 1: Integrate Chatbot API
## Status: Completed

### Progress Description:
The Chatbot API integration has been successfully completed in the backend. 
- **API Provider**: We are utilizing the Groq SDK with the `llama-3.3-70b-versatile` model to power the AI conversations.
- **Endpoint**: A dedicated `/api/chat` POST endpoint has been set up in `server.js` to receive user messages and history.
- **Context Handling**: The backend successfully formats the chat history from the frontend into the required OpenAI-compatible format to maintain conversation context.
- **Response Generation**: The AI processes the system instructions along with the user's prompt to generate intelligent and accurate academic advising responses, which are sent back to the frontend in real-time.
