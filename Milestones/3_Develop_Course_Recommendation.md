# Milestone 3: Develop Course Recommendation
## Status: Completed

### Progress Description:
Course recommendation capabilities have been successfully integrated into the AI's logic.
- **Structured Prompting**: The AI is instructed via the system prompt to explicitly recommend courses based on the provided knowledge base and to mention prerequisites when suggesting courses to students.
- **Dynamic Context**: The `Course` models are pulled from the MongoDB database, formatted into a readable catalog with course codes, credits, and prerequisites, and fed directly into the system instruction for the LLM. 
- **Accuracy Constraints**: Strict rules are enforced to ensure the AI never hallucinates or invents courses, ensuring all recommendations are grounded in the actual university catalog.
