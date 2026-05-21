// backend/seed.js
const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('./models/Course');

const sampleCourses = [
  // ═══════════════════════════════
  // COMPUTER SCIENCE
  // ═══════════════════════════════
  {
    courseCode: "CS101",
    title: "Introduction to Computer Science",
    description: "Foundations of programming, algorithms, and computational thinking using Python. Topics include variables, control flow, functions, recursion, and basic data structures.",
    credits: 3,
    prerequisites: []
  },
  {
    courseCode: "CS201",
    title: "Data Structures and Algorithms",
    description: "Advanced data organization including arrays, linked lists, stacks, queues, trees, graphs, and hash tables. Big-O analysis, sorting algorithms, and graph traversal.",
    credits: 4,
    prerequisites: ["CS101"]
  },
  {
    courseCode: "CS210",
    title: "Object-Oriented Programming",
    description: "OOP concepts using Java: classes, objects, inheritance, polymorphism, encapsulation, interfaces, and design patterns (Factory, Observer, Singleton).",
    credits: 3,
    prerequisites: ["CS101"]
  },
  {
    courseCode: "CS301",
    title: "Database Systems",
    description: "Relational database design, SQL (DDL/DML), normalization (1NF–BCNF), transaction management (ACID), indexing, and introduction to NoSQL databases.",
    credits: 3,
    prerequisites: ["CS201"]
  },
  {
    courseCode: "CS310",
    title: "Operating Systems",
    description: "Process management, CPU scheduling, memory management (paging, segmentation), file systems, concurrency, deadlocks, and virtualization concepts.",
    credits: 4,
    prerequisites: ["CS201"]
  },
  {
    courseCode: "CS350",
    title: "Artificial Intelligence",
    description: "Introduction to AI: search algorithms, knowledge representation, machine learning fundamentals, neural networks, natural language processing, and computer vision basics.",
    credits: 4,
    prerequisites: ["CS201", "MATH220"]
  },
  {
    courseCode: "CS401",
    title: "Software Engineering",
    description: "Software development lifecycle, agile/scrum methodologies, requirements engineering, system design, testing strategies, CI/CD, and project management.",
    credits: 3,
    prerequisites: ["CS210"]
  },
  {
    courseCode: "CS420",
    title: "Cybersecurity Fundamentals",
    description: "Network security, cryptography, authentication protocols, vulnerability assessment, ethical hacking, firewalls, intrusion detection systems, and security policies.",
    credits: 3,
    prerequisites: ["CS310"]
  },
  {
    courseCode: "CS450",
    title: "Cloud Computing & Distributed Systems",
    description: "Cloud architectures (IaaS, PaaS, SaaS), containerization (Docker, Kubernetes), microservices, distributed consensus, AWS/GCP fundamentals, and serverless computing.",
    credits: 4,
    prerequisites: ["CS310", "CS301"]
  },

  // ═══════════════════════════════
  // MATHEMATICS
  // ═══════════════════════════════
  {
    courseCode: "MATH101",
    title: "Calculus I",
    description: "Limits, continuity, derivatives, integrals, applications of differentiation (optimization, related rates), and the Fundamental Theorem of Calculus.",
    credits: 4,
    prerequisites: []
  },
  {
    courseCode: "MATH201",
    title: "Calculus II",
    description: "Advanced integration techniques, improper integrals, sequences, infinite series, Taylor/Maclaurin series, polar coordinates, and parametric equations.",
    credits: 4,
    prerequisites: ["MATH101"]
  },
  {
    courseCode: "MATH220",
    title: "Discrete Mathematics",
    description: "Propositional and predicate logic, sets, relations, functions, proof techniques, combinatorics, graph theory, and recurrence relations. Essential for CS majors.",
    credits: 3,
    prerequisites: ["CS101"]
  },
  {
    courseCode: "MATH301",
    title: "Linear Algebra",
    description: "Vector spaces, matrices, determinants, eigenvalues/eigenvectors, linear transformations, inner product spaces, and applications in data science.",
    credits: 3,
    prerequisites: ["MATH201"]
  },
  {
    courseCode: "MATH310",
    title: "Probability and Statistics",
    description: "Probability theory, random variables, distributions (binomial, normal, Poisson), statistical inference, hypothesis testing, regression analysis, and Bayesian methods.",
    credits: 3,
    prerequisites: ["MATH201"]
  },

  // ═══════════════════════════════
  // ENGLISH
  // ═══════════════════════════════
  {
    courseCode: "ENG101",
    title: "Freshman Composition",
    description: "Development of college-level academic writing, critical reading, thesis construction, argumentation, research methods, and proper citation (MLA/APA).",
    credits: 3,
    prerequisites: []
  },
  {
    courseCode: "ENG201",
    title: "Technical Writing",
    description: "Professional communication for STEM fields: technical reports, documentation, proposals, user manuals, data visualization, and presentation skills.",
    credits: 3,
    prerequisites: ["ENG101"]
  },

  // ═══════════════════════════════
  // BUSINESS
  // ═══════════════════════════════
  {
    courseCode: "BUS101",
    title: "Introduction to Business",
    description: "Overview of business fundamentals: management principles, marketing concepts, financial literacy, organizational behavior, and entrepreneurship.",
    credits: 3,
    prerequisites: []
  },
  {
    courseCode: "BUS220",
    title: "Business Analytics",
    description: "Data-driven decision making using statistical analysis, data visualization tools (Tableau, Excel), predictive modeling, and business intelligence concepts.",
    credits: 3,
    prerequisites: ["BUS101", "MATH101"]
  },
  {
    courseCode: "BUS301",
    title: "Marketing Principles",
    description: "Consumer behavior, market research, segmentation and targeting, branding, digital marketing strategies, social media marketing, and marketing analytics.",
    credits: 3,
    prerequisites: ["BUS101"]
  },
  {
    courseCode: "BUS350",
    title: "Entrepreneurship & Innovation",
    description: "Startup fundamentals: business model canvas, lean startup methodology, venture capital, pitch deck creation, product-market fit, and scaling strategies.",
    credits: 3,
    prerequisites: ["BUS101"]
  },

  // ═══════════════════════════════
  // PSYCHOLOGY
  // ═══════════════════════════════
  {
    courseCode: "PSY101",
    title: "Introduction to Psychology",
    description: "Survey of psychological science: research methods, biological bases of behavior, sensation/perception, learning, memory, development, personality, and disorders.",
    credits: 3,
    prerequisites: []
  },
  {
    courseCode: "PSY250",
    title: "Cognitive Psychology",
    description: "In-depth study of mental processes: attention, perception, memory systems, language, decision-making, problem-solving, and cognitive neuroscience.",
    credits: 3,
    prerequisites: ["PSY101"]
  },

  // ═══════════════════════════════
  // PHYSICS (NEW)
  // ═══════════════════════════════
  {
    courseCode: "PHY101",
    title: "General Physics I",
    description: "Classical mechanics: kinematics, Newton's laws, work and energy, momentum, rotational dynamics, oscillations, and waves. Calculus-based problem solving.",
    credits: 4,
    prerequisites: ["MATH101"]
  },
  {
    courseCode: "PHY201",
    title: "General Physics II",
    description: "Electricity and magnetism: Coulomb's law, electric fields, circuits, magnetic forces, electromagnetic induction, Maxwell's equations, and optics.",
    credits: 4,
    prerequisites: ["PHY101", "MATH201"]
  },

  // ═══════════════════════════════
  // ECONOMICS (NEW)
  // ═══════════════════════════════
  {
    courseCode: "ECON101",
    title: "Principles of Microeconomics",
    description: "Supply and demand, market equilibrium, consumer theory, production costs, market structures (perfect competition, monopoly, oligopoly), and welfare economics.",
    credits: 3,
    prerequisites: []
  },
  {
    courseCode: "ECON201",
    title: "Principles of Macroeconomics",
    description: "National income accounting, GDP, inflation, unemployment, fiscal and monetary policy, international trade, exchange rates, and economic growth models.",
    credits: 3,
    prerequisites: ["ECON101"]
  },

  // ═══════════════════════════════
  // HISTORY (NEW)
  // ═══════════════════════════════
  {
    courseCode: "HIST101",
    title: "World History: Ancient to Modern",
    description: "Survey of major civilizations, revolutions, wars, cultural movements, and global interactions from ancient Mesopotamia through the 21st century.",
    credits: 3,
    prerequisites: []
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    await Course.deleteMany({});
    console.log('Cleared old course data...');

    await Course.insertMany(sampleCourses);
    console.log(`✅ Successfully added ${sampleCourses.length} courses to the Knowledge Base!`);
    console.log('Departments: Computer Science, Mathematics, English, Business, Psychology, Physics, Economics, History');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();