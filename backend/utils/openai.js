const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Utility to extract JSON from a potentially markdown-formatted string
 */
function cleanJsonResponse(str) {
    try {
        // Strip markdown backticks if present (e.g., ```json ... ```)
        const cleaned = str.replace(/```json\s?|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", str);
        throw new Error("Invalid format received from AI.");
    }
}

/**
 * Fallback: generate role-aware QCM questions without OpenAI
 * Uses a keyword-matched question bank so questions are always relevant.
 */
function generateFallbackQuestions(jobRole, description, count) {
    const role = (jobRole + ' ' + (description || '')).toLowerCase();

    const allQuestions = [
        // --- Frontend / React ---
        {
            tags: ['react', 'frontend', 'javascript', 'js', 'web'],
            prompt: "What hook should you use to run a side-effect only once after a component mounts in React?",
            options: ["useEffect with []", "useState", "useMemo", "useRef"],
            correctAnswer: "useEffect with []"
        },
        {
            tags: ['react', 'frontend', 'javascript', 'js', 'web'],
            prompt: "What does the virtual DOM do in React?",
            options: ["Directly updates the browser DOM", "Minimises real DOM updates by diffing", "Manages API calls", "Handles routing between pages"],
            correctAnswer: "Minimises real DOM updates by diffing"
        },
        {
            tags: ['react', 'frontend', 'javascript', 'js'],
            prompt: "Which of the following is the correct way to pass data from parent to child in React?",
            options: ["Using props", "Using context only", "Using Redux only", "Using localStorage"],
            correctAnswer: "Using props"
        },
        {
            tags: ['javascript', 'js', 'frontend', 'web'],
            prompt: "What is the output of: typeof null in JavaScript?",
            options: ['"object"', '"null"', '"undefined"', '"boolean"'],
            correctAnswer: '"object"'
        },
        {
            tags: ['javascript', 'js', 'frontend', 'web'],
            prompt: "Which method is used to add an element at the end of an array in JavaScript?",
            options: ["push()", "pop()", "shift()", "unshift()"],
            correctAnswer: "push()"
        },
        // --- Backend / Node ---
        {
            tags: ['node', 'nodejs', 'backend', 'express', 'api'],
            prompt: "What does the middleware function in Express receive as its third argument?",
            options: ["next", "res", "req", "app"],
            correctAnswer: "next"
        },
        {
            tags: ['node', 'nodejs', 'backend', 'express', 'api'],
            prompt: "Which HTTP status code indicates a resource was created successfully?",
            options: ["201", "200", "404", "500"],
            correctAnswer: "201"
        },
        {
            tags: ['backend', 'node', 'api', 'express'],
            prompt: "What does REST stand for?",
            options: ["Representational State Transfer", "Remote Execution & State Transfer", "Resource Endpoint State Transfer", "Rapid Event Streaming Technology"],
            correctAnswer: "Representational State Transfer"
        },
        // --- Database / MongoDB ---
        {
            tags: ['mongodb', 'database', 'db', 'mongo', 'backend'],
            prompt: "Which MongoDB method returns all documents matching a filter?",
            options: ["find()", "get()", "select()", "query()"],
            correctAnswer: "find()"
        },
        {
            tags: ['mongodb', 'database', 'db', 'sql'],
            prompt: "What is the primary key called in MongoDB documents?",
            options: ["_id", "id", "pk", "key"],
            correctAnswer: "_id"
        },
        // --- Python ---
        {
            tags: ['python', 'data', 'ml', 'ai', 'machine learning', 'science'],
            prompt: "Which Python library is most commonly used for data manipulation and analysis?",
            options: ["Pandas", "NumPy", "Matplotlib", "Scikit-learn"],
            correctAnswer: "Pandas"
        },
        {
            tags: ['python', 'data', 'ml', 'ai', 'machine learning'],
            prompt: "What does the 'self' parameter represent in a Python class method?",
            options: ["The instance of the class", "The class itself", "A static reference", "The parent class"],
            correctAnswer: "The instance of the class"
        },
        // --- DevOps / General ---
        {
            tags: ['devops', 'docker', 'cloud', 'aws', 'ci', 'cd', 'deployment'],
            prompt: "What is the purpose of a Dockerfile?",
            options: ["Define how to build a Docker image", "Run Docker containers", "Push images to Docker Hub", "Monitor container performance"],
            correctAnswer: "Define how to build a Docker image"
        },
        {
            tags: ['git', 'devops', 'developer', 'backend', 'frontend'],
            prompt: "Which Git command creates a new branch and switches to it?",
            options: ["git checkout -b <branch>", "git branch <branch>", "git switch <branch>", "git new <branch>"],
            correctAnswer: "git checkout -b <branch>"
        },
        // --- General Software Engineering ---
        {
            tags: ['software', 'engineering', 'developer', 'general'],
            prompt: "What does SOLID stand for in software design principles?",
            options: [
                "Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion",
                "Scalable, Open-source, Lightweight, Integrated, Distributed",
                "Simple, Object-oriented, Logical, Independent, Documented",
                "Structured, Observable, Layered, Incremental, Distributed"
            ],
            correctAnswer: "Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion"
        },
        {
            tags: ['software', 'engineering', 'developer', 'general'],
            prompt: "What is the main purpose of unit testing?",
            options: ["Test individual components in isolation", "Test the full application end-to-end", "Test performance under load", "Test the UI visually"],
            correctAnswer: "Test individual components in isolation"
        },
        {
            tags: ['software', 'engineering', 'developer', 'general'],
            prompt: "Which design pattern ensures a class has only one instance?",
            options: ["Singleton", "Factory", "Observer", "Strategy"],
            correctAnswer: "Singleton"
        },
        {
            tags: ['software', 'engineering', 'developer', 'general', 'agile'],
            prompt: "In Agile, what is a 'sprint'?",
            options: ["A time-boxed iteration to deliver working software", "A sprint between two releases", "A code review session", "A final product demo"],
            correctAnswer: "A time-boxed iteration to deliver working software"
        },
    ];

    // Score each question by how many tags match the role string
    const scored = allQuestions.map(q => ({
        ...q,
        score: q.tags.filter(t => role.includes(t)).length
    }));

    // Sort by relevance (desc), then pick top `count`
    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, count);

    // If we don't have enough role-specific ones, fill with generic software questions
    if (selected.length < count) {
        const generic = allQuestions
            .filter(q => q.tags.includes('general') || q.tags.includes('software'))
            .slice(0, count - selected.length);
        selected.push(...generic);
    }

    return selected.slice(0, count).map(({ prompt, options, correctAnswer }) => ({
        prompt, options, correctAnswer
    }));
}

async function generateQuestionsAI(jobRole, description, count = 5) {
    const prompt = `You are an expert HR technical recruiter.
Generate exactly ${count} multiple choice questions (QCM) to assess a candidate for the position of "${jobRole}".
Context/Requirements: ${description || 'Not provided'}

Return ONLY a valid JSON array of objects. Each object must have the following structure:
{
  "prompt": "The question text",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "The exact string from options that is correct"
}
Ensure the questions are reasonably difficult and varied. Do not include any explanation or markdown formatting outside the JSON array.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        });

        const rawJson = response.choices[0].message.content;
        return cleanJsonResponse(rawJson);
    } catch (error) {
        // If quota exceeded or rate limited, fall back to built-in question bank
        if (error.status === 429 || error.status === 503 || error.code === 'insufficient_quota') {
            console.warn("OpenAI quota exceeded, using fallback question generator.");
            return generateFallbackQuestions(jobRole, description, count);
        }
        console.error("OpenAI Question Generation Error:", error);
        throw new Error(error.message || "Failed to generate questions using AI.");
    }
}


async function evaluateAnswersAI(jobRole, questionsAndAnswersStr) {
    const prompt = `You are an expert HR technical recruiter evaluating a candidate for the position of "${jobRole}".
Below is a list of questions and the candidate's answers.
Please evaluate the answers, calculate a total score out of 100, and provide constructive feedback.

Questions and Answers:
${questionsAndAnswersStr}

Return ONLY a valid JSON object. No other text. Structure:
{
  "score": <number between 0 and 100>,
  "feedback": "<detailed string explaining the score, strengths, and weaknesses>"
}`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
        });

        const rawJson = response.choices[0].message.content;
        return cleanJsonResponse(rawJson);
    } catch (error) {
        console.error("OpenAI Grading Error:", error);
        throw new Error(error.message || "Failed to grade using AI.");
    }
}

module.exports = {
    generateQuestionsAI,
    evaluateAnswersAI
};
