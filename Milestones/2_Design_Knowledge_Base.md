# Milestone 2: Design Knowledge Base
## Status: Completed

### Progress Description:
The knowledge base for the AIVON 2.0 Academic Advisor has been designed and integrated.
- **Database Architecture**: MongoDB is being used to store the university's course catalog. 
- **System Instructions Embed**: A comprehensive text-based knowledge base covering "University Policies & Information" (Enrollment, GPA, Graduation Requirements, Academic Support, Financial Information, and Academic Integrity) is dynamically loaded into the AI's system instruction on server startup.
- **Course Integration**: The application fetches course data (Course, Interaction, Conversation, Appointment models) from the database and structures it into a catalog categorized by department (e.g., Computer Science, Mathematics, English) to feed into the AI context.
