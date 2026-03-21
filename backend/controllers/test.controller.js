const Test = require('../models/test.model');
const Question = require('../models/question.model');
const { generateQuestionsAI } = require('../utils/openai');

// Create a new Test / Job
async function createTest(req, res) {
    try {
        const { title, description, jobRole, timeLimit, location, employmentType, status } = req.body;

        const test = new Test({
            title,
            description,
            jobRole,
            timeLimit,
            location,
            employmentType,
            status,
            createdBy: req.user.id
        });

        await test.save();

        res.status(201).json({
            status: true,
            message: "Test created successfully",
            test
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Generate Questions using AI for a given Test
async function generateAutoQuestions(req, res) {
    try {
        const { testId, count } = req.body;

        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ status: false, message: "Test not found" });
        }

        const aiQuestions = await generateQuestionsAI(test.jobRole, test.description, count || 5);

        // Save generated questions to DB
        const savedQuestions = [];
        for (let qData of aiQuestions) {
            const question = new Question({
                testId: test._id,
                type: 'QCM',
                prompt: qData.prompt,
                options: qData.options,
                correctAnswer: qData.correctAnswer
            });
            await question.save();
            savedQuestions.push(question);
        }

        res.status(200).json({
            status: true,
            message: "Questions generated and saved successfully",
            questions: savedQuestions
        });

    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get all tests
// HR/admin: only their own tests; candidates: all tests
async function getTests(req, res) {
    try {
        const filter = req.user.role === 'candidat' ? {} : { createdBy: req.user.id };
        const tests = await Test.find(filter).sort('-createdAt');
        res.status(200).json({ status: true, tests });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get single test with questions
async function getTestById(req, res) {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ status: false, message: "Test not found" });

        const questions = await Question.find({ testId: test._id });

        res.status(200).json({ status: true, test, questions });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Add Manual Question
async function addManualQuestion(req, res) {
    try {
        const { testId, type, prompt, options, correctAnswer } = req.body;
        const question = new Question({
            testId,
            type,
            prompt,
            options: type === 'QCM' ? options : undefined,
            correctAnswer: type === 'QCM' ? correctAnswer : undefined
        });
        await question.save();
        res.status(201).json({ status: true, message: "Question added", question });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Delete question
async function deleteQuestion(req, res) {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ status: false, message: "Question not found" });
        res.status(200).json({ status: true, message: "Question deleted" });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Delete a test and all its questions
async function deleteTest(req, res) {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ status: false, message: "Test not found" });

        // Only allow the creator or admin to delete
        if (test.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Not authorized to delete this test" });
        }

        await Question.deleteMany({ testId: test._id });
        await Test.findByIdAndDelete(test._id);
        res.status(200).json({ status: true, message: "Test and its questions deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Update test (renamed to job offers mentally in the frontend)
async function updateTest(req, res) {
    try {
        const { title, description, jobRole, timeLimit, location, employmentType, status } = req.body;
        const test = await Test.findByIdAndUpdate(
            req.params.id,
            { title, description, jobRole, timeLimit, location, employmentType, status },
            { new: true }
        );
        if (!test) return res.status(404).json({ status: false, message: "Test not found" });
        res.status(200).json({ status: true, message: "Test updated", test });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get public published jobs for Careers Page with pagination
async function getPublicTests(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter
        const filter = { status: 'PUBLISHED' };
        
        // Add search functionality
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { jobRole: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } },
                { location: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        // Add employment type filter
        if (req.query.employmentType) {
            const types = Array.isArray(req.query.employmentType) 
                ? req.query.employmentType 
                : [req.query.employmentType];
            filter.employmentType = { $in: types };
        }
        
        // Add location filter
        if (req.query.location) {
            const locations = Array.isArray(req.query.location) 
                ? req.query.location 
                : [req.query.location];
            filter.location = { $in: locations };
        }
        
        // Add salary range filter
        if (req.query.minSalary || req.query.maxSalary) {
            filter.salaryRange = {};
            if (req.query.minSalary) {
                filter.salaryRange.$gte = req.query.minSalary;
            }
            if (req.query.maxSalary) {
                filter.salaryRange.$lte = req.query.maxSalary;
            }
        }
        
        // Get total count
        const total = await Test.countDocuments(filter);
        
        // Get paginated results
        const tests = await Test.find(filter)
            .sort(req.query.sortBy ? { [req.query.sortBy]: req.query.sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        res.status(200).json({ 
            status: true, 
            tests,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = {
    createTest,
    generateAutoQuestions,
    getTests,
    getTestById,
    addManualQuestion,
    deleteQuestion,
    deleteTest,
    updateTest,
    getPublicTests
};
