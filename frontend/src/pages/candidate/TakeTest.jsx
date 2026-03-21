import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Button, Typography, Spin, message, Radio, Input, Space, Progress } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById } from '../../api/tests';
// We need to implement an API call for submitTest later:
import { submitTest } from '../../api/submissions';

const { Title, Text, Paragraph } = Typography;

function TakeTest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: responseString }
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null); // seconds remaining
    const timerRef = useRef(null);
    const hasAutoSubmitted = useRef(false);

    useEffect(() => {
        fetchTestDetails();
    }, [id]);

    // Start timer when test loads
    useEffect(() => {
        if (test && test.timeLimit && timeLeft === null) {
            setTimeLeft(test.timeLimit * 60);
        }
    }, [test]);

    // Countdown tick
    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            if (!hasAutoSubmitted.current) {
                hasAutoSubmitted.current = true;
                message.warning('Temps écoulé! Soumission automatique...');
                handleSubmit(true);
            }
            return;
        }
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [timeLeft]);

    const fetchTestDetails = async () => {
        try {
            const data = await getTestById(id);
            setTest(data.test);
            setQuestions(data.questions);
        } catch (error) {
            message.error(error.message || 'Error fetching test');
            navigate('/tests');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (val) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentQuestionIndex]._id]: val
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async (autoSubmit = false) => {
        try {
            setSubmitting(true);
            clearTimeout(timerRef.current);
            const submissionData = {
                testId: test._id,
                answers: Object.entries(answers).map(([qId, resp]) => ({
                    questionId: qId,
                    response: resp
                }))
            };
            await submitTest(submissionData);
            if (!autoSubmit) message.success('Test soumis avec succès!');
            navigate('/mes-resultats');
        } catch (error) {
            message.error(error.message || 'Erreur lors de la soumission');
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div>;
    }

    if (!test || questions.length === 0) {
        return <div style={{ textAlign: 'center' }}><Text>Aucune question trouvée pour ce test.</Text></div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

    // Format timeLeft in MM:SS
    const formatTime = (secs) => {
        if (secs === null) return '--:--';
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
    const isLowTime = timeLeft !== null && timeLeft <= 60;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>{test.title}</Title>
                <Text strong style={{ color: isLowTime ? '#f5222d' : '#faad14', fontSize: 16 }}>
                    ⏱ {formatTime(timeLeft)}
                </Text>
            </div>

            <Progress percent={progress} showInfo={false} style={{ marginBottom: 24 }} strokeColor="#13c2c2" />

            <Card style={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flexGrow: 1 }}>
                    <Text type="secondary">Question {currentQuestionIndex + 1} sur {questions.length}</Text>
                    <Paragraph style={{ fontSize: 18, marginTop: 12 }}>
                        {currentQuestion.prompt}
                    </Paragraph>

                    <div style={{ marginTop: 24 }}>
                        {currentQuestion.type === 'QCM' ? (
                            <Radio.Group
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                value={answers[currentQuestion._id]}
                                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                            >
                                {currentQuestion.options.map((opt, i) => (
                                    <Radio key={i} value={opt} style={{ fontSize: 16 }}>
                                        {opt}
                                    </Radio>
                                ))}
                            </Radio.Group>
                        ) : (
                            <Input.TextArea
                                rows={6}
                                placeholder="Tapez votre réponse ici..."
                                value={answers[currentQuestion._id]}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                            />
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                    <Button onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                        Précédent
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button type="primary" onClick={handleSubmit} loading={submitting}>
                            Soumettre le test
                        </Button>
                    ) : (
                        <Button type="primary" onClick={handleNext}>
                            Suivant
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}

export default TakeTest;
