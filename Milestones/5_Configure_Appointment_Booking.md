# Milestone 5: Configure Appointment Booking
## Status: Completed

### Progress Description:
The appointment booking system has been configured and is fully operational.
- **AI Triggers**: The AI is trained to recognize when a student is frustrated or specifically asks for a human advisor, triggering a `[SUGGEST_BOOKING]` or `[ESCALATE_TO_HUMAN]` flag in the response.
- **Backend Infrastructure**: The backend processes these flags and instructs the frontend to display booking options. Endpoints (`/api/appointments`) are implemented to handle the creation and retrieval of appointments.
- **Data Model**: An `Appointment` schema captures necessary details like the student's name, email, preferred date, time, department, and reason for the visit.
