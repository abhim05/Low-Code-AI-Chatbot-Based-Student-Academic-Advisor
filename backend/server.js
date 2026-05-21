// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const Groq = require('groq-sdk');

const Course = require('./models/Course');
const Interaction = require('./models/Interaction');
const Conversation = require('./models/Conversation');
const Appointment = require('./models/Appointment');

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let systemInstruction = ''; // loaded after DB connects with full knowledge base



// ═══════════════════════════════════════════
// UNIVERSITY POLICIES KNOWLEDGE BASE
// ═══════════════════════════════════════════
const universityPolicies = `
UNIVERSITY POLICIES & INFORMATION:

📋 ENROLLMENT & REGISTRATION:
- Registration opens 4 weeks before each semester begins.
- Enrollment deadline: Students must complete enrollment before the 2nd week of classes.
- Late enrollment: Allowed during weeks 2-3 with advisor approval and a $50 late fee.
- Waitlist: Students can join a waitlist for full sections; positions are filled automatically as spots open.
- Course overload: Students wanting more than 18 credits need written advisor approval (max 21 credits).
- Minimum load: Full-time status requires at least 12 credits per semester.
- Part-time students: May take 1-11 credits; not eligible for certain financial aid.
- Add/Drop period: Courses can be added or dropped freely during the first week without record.

📊 ACADEMIC STANDING & GPA:
- Good standing: Minimum cumulative GPA of 2.0 required.
- Dean's List: Awarded each semester to students with 3.5+ GPA (minimum 12 credits).
- President's List: Awarded for 4.0 GPA in a semester (minimum 12 credits).
- Academic Warning: Issued when semester GPA falls below 2.0 for the first time.
- Academic Probation: Applied when cumulative GPA remains below 2.0 for two consecutive semesters.
- Academic Dismissal: Students on probation who fail to raise GPA above 2.0 may be dismissed.
- Dismissal Appeal: Students may appeal dismissal within 10 business days to the Academic Standards Committee.
- Grade Appeals: Students may appeal a final grade within 30 days of grade posting through the department chair.

🎓 GRADUATION REQUIREMENTS:
- Bachelor's degree: Minimum 120 credits required.
- Residency credits: At least 30 of the last 60 credits must be completed at this university.
- Core curriculum: 36 credits of general education requirements (English, Math, Science, Humanities, Social Science).
- Major requirements: Vary by department — typically 36-48 credits in the major.
- Minimum GPA: 2.0 cumulative and 2.0 in major courses required for graduation.
- Graduation honors: Cum Laude (3.5), Magna Cum Laude (3.7), Summa Cum Laude (3.9).
- Commencement: Students must apply for graduation by the deadline (typically 3 months before ceremony).
- Degree audit: Students should request a degree audit at least 2 semesters before expected graduation.

📚 ACADEMIC SUPPORT SERVICES:
- Tutoring Center: Free tutoring for all enrolled students, Mon-Fri 9 AM - 8 PM, located in Library Room 201.
- Writing Center: Free writing assistance for essays, research papers, and lab reports, Mon-Fri 10 AM - 6 PM.
- Math Lab: Drop-in math help, Mon-Thu 9 AM - 7 PM, Science Building Room 105.
- Academic Advisors: Available Mon-Fri 9 AM - 5 PM. Appointments recommended; walk-ins accepted based on availability.
- Disability Services: Accommodations available for students with documented disabilities. Contact the Office of Disability Services.
- Counseling Center: Free mental health counseling, crisis support, and stress management resources available to all students.
- Career Services: Resume reviews, mock interviews, job fairs, and internship placement assistance.
- Study Groups: Facilitated study groups organized through the Tutoring Center for high-enrollment courses.

💰 FINANCIAL INFORMATION:
- Tuition payment deadline: 2 weeks before the semester begins.
- Late payment fee: $100 assessed after the payment deadline.
- Payment plans: Available through the Bursar's Office — split into 4 monthly installments.
- Refund schedule: 100% refund during week 1, 75% during week 2, 50% during week 3, 25% during week 4, 0% after week 4.
- Financial aid office: Located in Admin Building Room 102, Mon-Fri 8 AM - 5 PM.
- Scholarships: Merit-based and need-based scholarships available. Application deadline is March 1 each year.
- Work-study: Federal work-study positions available for eligible students — check with Financial Aid.

🔒 ACADEMIC INTEGRITY:
- Honor Code: All students must adhere to the university's Academic Honor Code.
- Plagiarism: Submitting others' work as your own results in disciplinary action (from failing the assignment to expulsion).
- First offense: Typically results in a zero on the assignment and mandatory Academic Integrity workshop.
- Second offense: Failing grade in the course and academic probation.
- Third offense: Expulsion from the university.
- AI Policy: Use of AI tools must be disclosed and is only permitted when explicitly allowed by the instructor.

📅 ACADEMIC CALENDAR:
- Fall semester: Late August to mid-December.
- Spring semester: Mid-January to early May.
- Summer sessions: Two 6-week sessions available (June-July and July-August).
- Midterm exams: Typically during week 8 of the semester.
- Final exams: During the last week of the semester (dedicated exam week).
- Reading days: 2 study days between last day of classes and finals week.

🔄 TRANSFER & SPECIAL CREDITS:
- Transfer credits: Up to 60 credits accepted from accredited institutions.
- AP credits: Scores of 4 or 5 earn college credit (3-4 credits per exam depending on subject).
- CLEP exams: Select CLEP exams accepted for credit — check with the Registrar.
- International credits: Evaluated through WES (World Education Services) credential evaluation.
- Credit by examination: Students may test out of certain courses with department approval.
`;

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    // Build system instruction with full knowledge base embedded
    const courses = await Course.find({});
    const deptNames = { CS:'Computer Science', MATH:'Mathematics', ENG:'English', BUS:'Business', PSY:'Psychology', PHY:'Physics', ECON:'Economics', HIST:'History' };
    const departments = {};
    courses.forEach(c => { const d = c.courseCode.replace(/\d+/g,''); if (!departments[d]) departments[d]=[]; departments[d].push(c); });
    const courseCatalog = Object.entries(departments).map(([dept, cs]) => {
      const list = cs.map(c => `  • ${c.courseCode}: ${c.title} (${c.credits} cr) | Prereqs: ${c.prerequisites.length ? c.prerequisites.join(', ') : 'None'} | ${c.description}`).join('\n');
      return `[${deptNames[dept]||dept}]\n${list}`;
    }).join('\n\n');

    const fullInstruction = `You are AIVON 2.0, a premium AI-powered university academic advisor.

PERSONA: Warm, professional, empathetic, proactive. You genuinely care about student success.

RESPONSE FORMATTING:
- Use **bold** for course codes, deadlines, and key numbers.
- Use bullet points for course lists and steps.
- Keep responses concise (3-5 paragraphs max).
- Always mention prerequisites when recommending courses.

ESCALATION RULES:
- If student is frustrated, anxious, overwhelmed, or asks for a human advisor: include '[ESCALATE_TO_HUMAN]'
- If student asks to book an appointment or schedule a meeting: include '[SUGGEST_BOOKING]'

STRICT RULES:
- Only recommend courses and policies from the knowledge base below.
- Never invent courses, policies, or deadlines.
- If unsure, say so and suggest the student verify with the registrar.

══════ COURSE CATALOG ══════
${courseCatalog}

══════ UNIVERSITY POLICIES ══════
${universityPolicies}`;

    systemInstruction = fullInstruction;
    console.log(`Knowledge base loaded: ${courses.length} courses across ${Object.keys(departments).length} departments.`);
  })
  .catch(err => console.error('MongoDB Error:', err));


// Helper: detect topic from message
function detectTopic(message) {
  const msg = message.toLowerCase();
  if (msg.match(/course|class|credit|prerequisite|prereq|enroll|register|schedule|semester|syllabus|catalog/)) return 'courses';
  if (msg.match(/gpa|grade|score|academic standing|probation|dean|honors|cum laude/)) return 'grades';
  if (msg.match(/appointment|book|schedule|meet|advisor|human|talk to someone/)) return 'appointments';
  if (msg.match(/policy|rule|deadline|drop|transfer|graduation|requirement|honor|integrity|plagiarism/)) return 'policies';
  if (msg.match(/tutor|help|study|learn|resource|writing center|math lab|counseling|career/)) return 'resources';
  if (msg.match(/tuition|financial|scholarship|payment|refund|fee|aid|work.study/)) return 'financial';
  return 'general';
}

// Helper: detect sentiment from message
function detectSentiment(message) {
  const msg = message.toLowerCase();
  const negativeWords = ['frustrated', 'angry', 'confused', 'lost', 'hate', 'terrible', 'worst', 'awful', 'stuck', 'hopeless', 'stressed', 'overwhelmed', 'stupid', 'useless', 'waste', 'annoyed', 'disappointed', 'failing', 'anxious', 'worried', 'scared', 'panic', 'struggle', 'difficult', 'impossible'];
  const positiveWords = ['thanks', 'thank', 'great', 'awesome', 'perfect', 'helpful', 'amazing', 'excellent', 'love', 'appreciate', 'wonderful', 'good', 'fantastic', 'brilliant', 'excited', 'happy', 'glad', 'nice', 'cool', 'outstanding'];
  
  const negCount = negativeWords.filter(w => msg.includes(w)).length;
  const posCount = positiveWords.filter(w => msg.includes(w)).length;
  
  if (negCount > posCount) return 'negative';
  if (posCount > negCount) return 'positive';
  return 'neutral';
}

// ============== CHAT ENDPOINT ==============
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, conversationId } = req.body;
    if (!systemInstruction) return res.status(503).json({ error: 'Advisor is still loading, please try again in a moment.' });
    const startTime = Date.now();

    // Convert Gemini-style history [{role:'user',parts:[{text}]},{role:'model',parts:[{text}]}]
    // to OpenAI-compatible format [{role:'user',content:''},{role:'assistant',content:''}]
    const messages = [{ role: 'system', content: systemInstruction }];
    if (history && history.length > 0) {
      for (const h of history) {
        const role = h.role === 'model' ? 'assistant' : 'user';
        const content = h.parts?.map(p => p.text).join('') || '';
        if (content) messages.push({ role, content });
      }
    }
    messages.push({ role: 'user', content: message });

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
    });

    let aiResponse = completion.choices[0]?.message?.content || 'I could not generate a response.';
    const responseTime = Date.now() - startTime;
    const topic = detectTopic(message);
    let sentiment = detectSentiment(message);
    let requiresHuman = false;
    let suggestBooking = false;

    if (aiResponse.includes('[ESCALATE_TO_HUMAN]')) {
      sentiment = 'negative';
      requiresHuman = true;
      aiResponse = aiResponse.replace(/\[ESCALATE_TO_HUMAN\]/g, '');
      aiResponse += '\n\n📋 **I recommend speaking with a human advisor.** You can book an appointment right here using the booking button below.';
    }

    if (aiResponse.includes('[SUGGEST_BOOKING]')) {
      suggestBooking = true;
      aiResponse = aiResponse.replace(/\[SUGGEST_BOOKING\]/g, '');
    }

    // Save interaction for analytics
    await Interaction.create({ message, aiResponse, sentiment, topic, responseTime });

    // If conversationId provided, update that conversation
    if (conversationId) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $push: { 
          messages: [
            { role: 'user', text: message },
            { role: 'bot', text: aiResponse }
          ]
        },
        updatedAt: Date.now()
      });
    }

    res.json({ response: aiResponse, requiresHuman, suggestBooking });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// ============== CONVERSATION ENDPOINTS ==============
app.post('/api/conversations', async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await Conversation.create({ 
      title: title || 'New Chat',
      messages: []
    });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({})
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/conversations/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

app.put('/api/conversations/:id', async (req, res) => {
  try {
    const { title } = req.body;
    const update = { updatedAt: Date.now() };
    if (title) update.title = title;
    const conversation = await Conversation.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

app.delete('/api/conversations/:id', async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ============== APPOINTMENT ENDPOINTS ==============
app.post('/api/appointments', async (req, res) => {
  try {
    const { studentName, studentEmail, date, time, department, reason } = req.body;
    if (!studentName || !studentEmail || !date || !time) {
      return res.status(400).json({ error: 'Name, email, date, and time are required.' });
    }
    const appointment = await Appointment.create({ studentName, studentEmail, date, time, department, reason });
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({}).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ============== ANALYTICS ENDPOINTS ==============
app.get('/api/analytics', async (req, res) => {
  try {
    const totalInteractions = await Interaction.countDocuments();
    const escalations = await Interaction.countDocuments({ sentiment: 'negative' });
    const recentLogs = await Interaction.find().sort({ timestamp: -1 }).limit(15);
    
    // Topic breakdown
    const topicBreakdown = await Interaction.aggregate([
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Sentiment breakdown
    const sentimentBreakdown = await Interaction.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]);

    // Average response time
    const avgResponseTime = await Interaction.aggregate([
      { $match: { responseTime: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$responseTime' }, min: { $min: '$responseTime' }, max: { $max: '$responseTime' } } }
    ]);

    // Response time distribution
    const responseTimeDistribution = await Interaction.aggregate([
      { $match: { responseTime: { $gt: 0 } } },
      { $bucket: {
        groupBy: '$responseTime',
        boundaries: [0, 1000, 3000, 5000, 10000, Infinity],
        default: 'slow',
        output: { count: { $sum: 1 } }
      }}
    ]);

    // Daily activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyActivity = await Interaction.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Hourly activity (today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const hourlyActivity = await Interaction.aggregate([
      { $match: { timestamp: { $gte: todayStart } } },
      { $group: {
        _id: { $hour: '$timestamp' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Total appointments & recent appointments
    const totalAppointments = await Appointment.countDocuments();
    const recentAppointments = await Appointment.find({}).sort({ createdAt: -1 }).limit(5);

    res.json({
      totalInteractions,
      escalations,
      recentLogs,
      topicBreakdown,
      sentimentBreakdown,
      avgResponseTime: avgResponseTime[0]?.avg || 0,
      minResponseTime: avgResponseTime[0]?.min || 0,
      maxResponseTime: avgResponseTime[0]?.max || 0,
      responseTimeDistribution,
      dailyActivity,
      hourlyActivity,
      totalAppointments,
      recentAppointments
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));