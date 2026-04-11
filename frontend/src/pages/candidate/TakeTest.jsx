import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Button, Typography, Spin, message, Radio, Input, Space, Progress, FloatButton, Drawer, Modal } from 'antd';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { RobotOutlined, FullscreenOutlined } from '@ant-design/icons';
import { getTestById } from '../../api/tests';
import { submitTest, getTestDraft, saveTestDraft } from '../../api/submissions';
import { sendAssistantMessage } from '../../api/chat';
import { useAuth } from '../../contexts/authContext';

const { Title, Text, Paragraph } = Typography;

const DRAFT_PREFIX = 'test-draft-';

function TakeTest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const invite = searchParams.get('invite') || '';
    const { user } = useAuth();

    const [test, setTest] = useState(null);
    const [testMeta, setTestMeta] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const answersRef = useRef(answers);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);
    const hasAutoSubmitted = useRef(false);
    const testStartedAtRef = useRef(null);
    const pasteWarned = useRef(false);
    const fullscreenPromptedRef = useRef(false);
    const telemetryRef = useRef({
        focusLossCount: 0,
        visibilityHiddenCount: 0,
        tabSwitchCount: 0,
        copyCount: 0,
        pasteCount: 0,
        fullscreenExitCount: 0,
    });

    const [assistantOpen, setAssistantOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const incrementTelemetry = useCallback((key, count = 1) => {
        const current = Number(telemetryRef.current[key] || 0);
        telemetryRef.current[key] = Math.max(0, current + count);
    }, []);

    const antiCheatConfig = test?.antiCheatConfig || testMeta?.antiCheatConfig || {};
    const tabWarnThreshold = Math.max(1, Number(antiCheatConfig.tabSwitchWarnThreshold || 3));
    const tabAutoSubmitThreshold = Math.max(tabWarnThreshold + 1, Number(antiCheatConfig.tabSwitchAutoSubmitThreshold || 5));
    const requireFullscreen = Boolean(antiCheatConfig.requireFullscreen);

    const getClientContext = useCallback(() => ({
        screenResolution:
            typeof window !== 'undefined' ? `${window.screen?.width || 0}x${window.screen?.height || 0}` : '',
        timezone: Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || '',
    }), []);

    const fetchTestDetails = async () => {
        try {
            const data = await getTestById(id, { invite });
            setTest(data.test);
            setTestMeta(data.meta || null);
            if (!testStartedAtRef.current) {
                testStartedAtRef.current = new Date().toISOString();
            }
            const shuffled = [...(data.questions || [])];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setQuestions(shuffled);

            let merged = {};
            try {
                const raw = localStorage.getItem(`${DRAFT_PREFIX}${id}`);
                if (raw) {
                    const draft = JSON.parse(raw);
                    if (draft.answers && typeof draft.answers === 'object') {
                        merged = { ...draft.answers };
                    }
                }
            } catch {
                /* ignore */
            }
            try {
                const dRes = await getTestDraft(id);
                if (dRes.draft?.startedAt) {
                    testStartedAtRef.current = new Date(dRes.draft.startedAt).toISOString();
                }
                if (dRes.draft?.telemetry) {
                    const t = dRes.draft.telemetry;
                    telemetryRef.current = {
                        focusLossCount: Math.max(Number(telemetryRef.current.focusLossCount || 0), Number(t.focusLossCount || 0)),
                        visibilityHiddenCount: Math.max(Number(telemetryRef.current.visibilityHiddenCount || 0), Number(t.visibilityHiddenCount || 0)),
                        tabSwitchCount: Math.max(Number(telemetryRef.current.tabSwitchCount || 0), Number(t.tabSwitchCount || 0)),
                        copyCount: Math.max(Number(telemetryRef.current.copyCount || 0), Number(t.copyCount || 0)),
                        pasteCount: Math.max(Number(telemetryRef.current.pasteCount || 0), Number(t.pasteCount || 0)),
                        fullscreenExitCount: Math.max(Number(telemetryRef.current.fullscreenExitCount || 0), Number(t.fullscreenExitCount || 0)),
                    };
                }
                if (dRes.draft?.answers?.length) {
                    const m = {};
                    dRes.draft.answers.forEach((a) => {
                        m[a.questionId] = a.response ?? '';
                    });
                    merged = { ...merged, ...m };
                    if (Number.isFinite(dRes.draft.currentQuestionIndex)) {
                        setCurrentQuestionIndex(Math.min(dRes.draft.currentQuestionIndex, shuffled.length - 1));
                    }
                }
            } catch {
                /* offline or first visit */
            }
            if (Object.keys(merged).length) {
                setAnswers(merged);
                message.info('Brouillon restauré (appareil et/ou serveur).');
            }
        } catch (error) {
            message.error(error.message || 'Error fetching test');
            navigate('/tests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestDetails();
    }, [id, invite]);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        if (test && test.timeLimit && timeLeft === null) {
            setTimeLeft(test.timeLimit * 60);
        }
    }, [test]);

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
        timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [timeLeft]);

    useEffect(() => {
        if (!test?._id) return;
        const h = setTimeout(() => {
            try {
                localStorage.setItem(`${DRAFT_PREFIX}${id}`, JSON.stringify({ answers, savedAt: Date.now() }));
            } catch {
                /* ignore */
            }
        }, 600);
        return () => clearTimeout(h);
    }, [answers, id, test]);

    useEffect(() => {
        if (!test?._id || !questions.length) return;
        const sync = setTimeout(() => {
            const arr = Object.entries(answers).map(([questionId, response]) => ({
                questionId,
                response: response == null ? '' : String(response),
            }));
            saveTestDraft(id, {
                answers: arr,
                currentQuestionIndex,
                startedAt: testStartedAtRef.current,
                telemetry: telemetryRef.current,
                ...getClientContext(),
            }).catch(() => {});
        }, 2000);
        return () => clearTimeout(sync);
    }, [answers, currentQuestionIndex, getClientContext, id, test, questions.length]);

    useEffect(() => {
        if (!test?._id) return;

        const onBlur = () => incrementTelemetry('focusLossCount');
        const onVisibilityChange = () => {
            if (document.hidden) {
                const nextTabSwitchCount = Number(telemetryRef.current.tabSwitchCount || 0) + 1;
                incrementTelemetry('visibilityHiddenCount');
                incrementTelemetry('tabSwitchCount');

                if (nextTabSwitchCount === tabWarnThreshold) {
                    message.warning({
                        content: 'Changement d\'onglet detecte. Cela sera signale au recruteur.',
                        duration: 5,
                    });
                }

                if (nextTabSwitchCount >= tabAutoSubmitThreshold && !hasAutoSubmitted.current) {
                    hasAutoSubmitted.current = true;
                    Modal.error({
                        title: 'Test suspendu',
                        content: 'Trop de changements d\'onglet detectes. Le test va etre soumis automatiquement.',
                        onOk: () => handleSubmit(true),
                    });
                }
            }
        };
        const onCopy = () => incrementTelemetry('copyCount');
        const onFullscreenChange = () => {
            if (!document.fullscreenElement) {
                const nextFullscreenExits = Number(telemetryRef.current.fullscreenExitCount || 0) + 1;
                incrementTelemetry('fullscreenExitCount');
                if (nextFullscreenExits >= 1) {
                    message.warning('Veuillez rester en mode plein ecran pendant le test.');
                }
            }
        };

        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibilityChange);
        document.addEventListener('copy', onCopy);
        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => {
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            document.removeEventListener('copy', onCopy);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, [incrementTelemetry, tabAutoSubmitThreshold, tabWarnThreshold, test?._id]);

    useEffect(() => {
        if (!test?._id) return;
        if (!requireFullscreen) return;
        if (document.fullscreenElement) return;
        if (fullscreenPromptedRef.current) return;

        fullscreenPromptedRef.current = true;
        message.info('Ce test requiert le mode plein ecran. Activez-le pour continuer dans les meilleures conditions.');
    }, [requireFullscreen, test?._id]);

    const handleSubmit = async (autoSubmit = false) => {
        try {
            setSubmitting(true);
            clearTimeout(timerRef.current);
            const ans = answersRef.current;
            const submissionData = {
                testId: test._id,
                testStartedAt: testStartedAtRef.current,
                answers: Object.entries(ans).map(([qId, resp]) => ({
                    questionId: qId,
                    response: resp,
                })),
                telemetry: telemetryRef.current,
                ...getClientContext(),
            };
            const res = await submitTest(submissionData);
            try {
                localStorage.removeItem(`${DRAFT_PREFIX}${id}`);
            } catch {
                /* ignore */
            }
            if (!autoSubmit) message.success('Test soumis avec succès!');
            navigate('/tests/termine', {
                replace: true,
                state: { submissionId: res.submissionId },
            });
        } catch (error) {
            message.error(error.message || 'Erreur lors de la soumission');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAnswerChange = (val) => {
        setAnswers((prev) => ({
            ...prev,
            [questions[currentQuestionIndex]._id]: val,
        }));
    };

    const onPasteOpen = useCallback(() => {
        incrementTelemetry('pasteCount');
        if (!pasteWarned.current) {
            pasteWarned.current = true;
            message.warning('Privilégiez vos propres mots : le collage massif peut être signalé au recruteur.');
        }
    }, [incrementTelemetry]);

    const handleAssistantSend = async () => {
        const msg = chatInput.trim();
        if (!msg) return;
        setChatInput('');
        setChatMessages((m) => [...m, { role: 'user', text: msg }]);
        setChatLoading(true);
        try {
            const data = await sendAssistantMessage(msg, {
                jobRole: test?.jobRole,
                testTitle: test?.title,
            });
            setChatMessages((m) => [...m, { role: 'assistant', text: data.reply || '—' }]);
        } catch (e) {
            message.error(e.message || 'Assistant indisponible');
        } finally {
            setChatLoading(false);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!test || questions.length === 0) {
        return (
            <div style={{ textAlign: 'center' }}>
                <Text>Aucune question trouvée pour ce test.</Text>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
    const openRows = currentQuestion.type === 'PROBLEM' ? 10 : currentQuestion.type === 'SHORT_ANSWER' ? 5 : 6;
    const openPlaceholder =
        currentQuestion.type === 'PROBLEM'
            ? 'Détaillez votre raisonnement et votre solution...'
            : currentQuestion.type === 'SHORT_ANSWER'
              ? 'Réponse courte (quelques phrases)...'
              : 'Tapez votre réponse ici...';

    const formatTime = (secs) => {
        if (secs === null) return '--:--';
        const m = Math.floor(secs / 60)
            .toString()
            .padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
    const isLowTime = timeLeft !== null && timeLeft <= 60;
    const a11y = user?.accessibilityMode;

    const requestFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                message.success('Mode plein ecran active.');
            }
        } catch {
            message.info('Le mode plein ecran a ete refuse ou n\'est pas disponible.');
        }
    };

    return (
        <div
            className={a11y ? 'take-test-a11y' : undefined}
            style={{ maxWidth: 800, margin: '0 auto' }}
            role="main"
            aria-label={`Test ${test.title}`}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>
                    {test.title}
                </Title>
                <Space align="center" size="middle">
                    <Button icon={<FullscreenOutlined />} onClick={requestFullscreen}>
                        Plein ecran (recommande)
                    </Button>
                    <Text strong style={{ color: isLowTime ? '#f5222d' : '#faad14', fontSize: 16 }}>
                        Temps restant {formatTime(timeLeft)}
                    </Text>
                </Space>
            </div>

            {testMeta?.minSecondsPerQuestion > 0 && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    Ce test demande un minimum d’environ {testMeta.minSecondsPerQuestion}s par question pour une évaluation équitable.
                </Text>
            )}

            {requireFullscreen && (
                <Text type="warning" style={{ display: 'block', marginBottom: 12 }}>
                    Le plein ecran est requis pour ce test.
                </Text>
            )}

            <Progress percent={progress} showInfo={false} style={{ marginBottom: 24 }} strokeColor="#13c2c2" />

            <Card style={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flexGrow: 1 }}>
                    <Text type="secondary">
                        Question {currentQuestionIndex + 1} sur {questions.length}
                    </Text>
                    <Paragraph style={{ fontSize: a11y ? 20 : 18, marginTop: 12 }}>{currentQuestion.prompt}</Paragraph>

                    <div style={{ marginTop: 24 }}>
                        {currentQuestion.type === 'QCM' ? (
                            <Radio.Group
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                value={answers[currentQuestion._id]}
                                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                                aria-label="Choix multiples"
                            >
                                {currentQuestion.options.map((opt, i) => (
                                    <Radio key={i} value={opt} style={{ fontSize: a11y ? 18 : 16 }}>
                                        {opt}
                                    </Radio>
                                ))}
                            </Radio.Group>
                        ) : (
                            <Input.TextArea
                                rows={openRows}
                                placeholder={openPlaceholder}
                                value={answers[currentQuestion._id]}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                onPaste={onPasteOpen}
                                aria-label="Réponse libre"
                            />
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                    <Button onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                        Précédent
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button type="primary" onClick={() => handleSubmit(false)} loading={submitting}>
                            Soumettre le test
                        </Button>
                    ) : (
                        <Button type="primary" onClick={handleNext}>
                            Suivant
                        </Button>
                    )}
                </div>
            </Card>

            <FloatButton
                icon={<RobotOutlined />}
                type="primary"
                tooltip="Assistant (sans réponses directes)"
                style={{ right: 24, bottom: 24 }}
                onClick={() => setAssistantOpen(true)}
            />

            <Drawer
                title="Assistant test"
                placement="right"
                width={360}
                onClose={() => setAssistantOpen(false)}
                open={assistantOpen}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    Conseils et clarifications uniquement — pas de réponses toutes faites.
                </Text>
                <div style={{ minHeight: 200, marginBottom: 12 }}>
                    {chatMessages.map((m, i) => (
                        <div
                            key={i}
                            style={{
                                marginBottom: 8,
                                padding: 8,
                                background: m.role === 'user' ? '#e6f7ff' : '#f5f5f5',
                                borderRadius: 8,
                            }}
                        >
                            <Text strong>{m.role === 'user' ? 'Vous' : 'Assistant'}</Text>
                            <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{m.text}</Paragraph>
                        </div>
                    ))}
                </div>
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onPressEnter={handleAssistantSend}
                        placeholder="Posez votre question..."
                        disabled={chatLoading}
                    />
                    <Button type="primary" onClick={handleAssistantSend} loading={chatLoading}>
                        Envoyer
                    </Button>
                </Space.Compact>
            </Drawer>
        </div>
    );
}

export default TakeTest;


