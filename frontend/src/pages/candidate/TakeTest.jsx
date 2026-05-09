import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Button, Typography, Spin, Radio, Input, Space, Progress, Modal, App as AntdApp } from 'antd';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FullscreenOutlined } from '@ant-design/icons';
import { getTestById } from '../../api/tests';
import { submitTest, getTestDraft, saveTestDraft } from '../../api/submissions';
import { useAuth } from '../../contexts/authContext';

const { Title, Text, Paragraph } = Typography;
const DRAFT_PREFIX = 'test-draft-';

function getDraftStorageKey(testId, userId) {
    const safeTestId = String(testId || '').trim();
    const safeUserId = String(userId || 'anonymous').trim();
    return `${DRAFT_PREFIX}${safeUserId}-${safeTestId}`;
}

function TakeTest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const invite = searchParams.get('invite') || '';
    const { user } = useAuth();
    const { message, modal } = AntdApp.useApp();

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
    const questionEnteredAtRef = useRef(Date.now());
    const questionMetricsRef = useRef({});
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
    const currentUserId = user?._id || user?.id || '';

    const incrementTelemetry = useCallback((key, count = 1) => {
        const current = Number(telemetryRef.current[key] || 0);
        telemetryRef.current[key] = Math.max(0, current + count);
    }, []);

    const trackQuestionDwell = useCallback(() => {
        const question = questions[currentQuestionIndex];
        if (!question?._id) return;
        const now = Date.now();
        const elapsed = Math.max(0, Math.round((now - questionEnteredAtRef.current) / 1000));
        const key = String(question._id);
        const prev = questionMetricsRef.current[key] || { dwellSeconds: 0, keystrokes: 0, backspaces: 0, pastes: 0 };
        questionMetricsRef.current[key] = {
            ...prev,
            dwellSeconds: Math.max(prev.dwellSeconds || 0, elapsed),
        };
        questionEnteredAtRef.current = now;
    }, [currentQuestionIndex, questions]);

    const antiCheatConfig = test?.antiCheatConfig || testMeta?.antiCheatConfig || {};
    const tabWarnThreshold = Math.max(1, Number(antiCheatConfig.tabSwitchWarnThreshold || 3));
    const tabAutoSubmitThreshold = Math.max(tabWarnThreshold + 1, Number(antiCheatConfig.tabSwitchAutoSubmitThreshold || 5));
    const requireFullscreen = Boolean(antiCheatConfig.requireFullscreen);
    const blockPaste = Boolean(antiCheatConfig.blockPaste);
    const maxFullscreenExitAllowed = Math.max(0, Number(antiCheatConfig.maxFullscreenExitAllowed ?? (requireFullscreen ? 0 : 3)));

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
                const raw = localStorage.getItem(getDraftStorageKey(id, currentUserId));
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
                if (dRes.draft?.questionTimeline && typeof dRes.draft.questionTimeline === 'object') {
                    const entries = Object.entries(dRes.draft.questionTimeline || {});
                    entries.forEach(([questionId, metrics]) => {
                        if (!questionId) return;
                        const prev = questionMetricsRef.current[questionId] || { dwellSeconds: 0, keystrokes: 0, backspaces: 0, pastes: 0 };
                        const next = metrics || {};
                        questionMetricsRef.current[questionId] = {
                            dwellSeconds: Math.max(Number(prev.dwellSeconds || 0), Number(next.dwellSeconds || 0)),
                            keystrokes: Math.max(Number(prev.keystrokes || 0), Number(next.keystrokes || 0)),
                            backspaces: Math.max(Number(prev.backspaces || 0), Number(next.backspaces || 0)),
                            pastes: Math.max(Number(prev.pastes || 0), Number(next.pastes || 0)),
                        };
                    });
                }
                if (dRes.draft?.answers?.length) {
                    const mappedAnswers = {};
                    dRes.draft.answers.forEach((a) => {
                        mappedAnswers[a.questionId] = a.response ?? '';
                    });
                    merged = { ...merged, ...mappedAnswers };
                    if (Number.isFinite(dRes.draft.currentQuestionIndex)) {
                        setCurrentQuestionIndex(Math.min(dRes.draft.currentQuestionIndex, shuffled.length - 1));
                    }
                }
            } catch {
                /* ignore */
            }

            if (Object.keys(merged).length) {
                setAnswers(merged);
                message.info('Brouillon restaure.');
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
    }, [test, timeLeft]);

    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            if (!hasAutoSubmitted.current) {
                hasAutoSubmitted.current = true;
                message.warning('Temps ecoule. Soumission automatique...');
                handleSubmit(true);
            }
            return;
        }
        timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [timeLeft]);

    useEffect(() => {
        if (!test?._id) return;
        const timeout = setTimeout(() => {
            try {
                localStorage.setItem(
                    getDraftStorageKey(id, currentUserId),
                    JSON.stringify({ answers, savedAt: Date.now() })
                );
            } catch {
                /* ignore */
            }
        }, 600);
        return () => clearTimeout(timeout);
    }, [answers, currentUserId, id, test]);

    useEffect(() => {
        if (!test?._id || !questions.length) return;
        const sync = setTimeout(() => {
            trackQuestionDwell();
            const payloadAnswers = Object.entries(answers).map(([questionId, response]) => ({
                questionId,
                response: response == null ? '' : String(response),
            }));
            saveTestDraft(id, {
                answers: payloadAnswers,
                currentQuestionIndex,
                startedAt: testStartedAtRef.current,
                telemetry: telemetryRef.current,
                questionTimeline: questionMetricsRef.current,
                ...getClientContext(),
            }).catch(() => {});
        }, 2000);
        return () => clearTimeout(sync);
    }, [answers, currentQuestionIndex, getClientContext, id, questions.length, test, trackQuestionDwell]);

    useEffect(() => {
        questionEnteredAtRef.current = Date.now();
    }, [currentQuestionIndex]);

    useEffect(() => {
        if (!test?._id) return;

        // Note: window.blur is intentionally NOT tracked — it fires on every browser
        // UI interaction (scrollbars, address bar, etc.) causing false positives.
        // Real tab-switching is captured via visibilitychange below.
        const onVisibilityChange = () => {
            if (document.hidden) {
                const nextTabSwitchCount = Number(telemetryRef.current.tabSwitchCount || 0) + 1;
                incrementTelemetry('visibilityHiddenCount');
                incrementTelemetry('tabSwitchCount');

                if (nextTabSwitchCount === tabWarnThreshold) {
                    message.warning({
                        content: "Changement d'onglet detecte. Cela sera signale au recruteur.",
                        duration: 5,
                    });
                }

                if (nextTabSwitchCount >= tabAutoSubmitThreshold && !hasAutoSubmitted.current) {
                    hasAutoSubmitted.current = true;
                    modal.error({
                        title: 'Test suspendu',
                        content: "Trop de changements d'onglet detectes. Le test va etre soumis automatiquement.",
                        onOk: () => handleSubmit(true),
                    });
                }
            }
        };

        const onCopy = () => incrementTelemetry('copyCount');

        // Debounce fullscreenchange: browsers can fire it multiple times per actual exit.
        let fullscreenDebounceTimer = null;
        const onFullscreenChange = () => {
            if (!document.fullscreenElement) {
                clearTimeout(fullscreenDebounceTimer);
                fullscreenDebounceTimer = setTimeout(() => {
                    const nextFullscreenExits = Number(telemetryRef.current.fullscreenExitCount || 0) + 1;
                    incrementTelemetry('fullscreenExitCount');
                    if (nextFullscreenExits >= 1) {
                        message.warning('Veuillez rester en mode plein ecran pendant le test.');
                    }
                    if (nextFullscreenExits > maxFullscreenExitAllowed && !hasAutoSubmitted.current) {
                        hasAutoSubmitted.current = true;
                        modal.error({
                            title: 'Test suspendu',
                            content: "Sorties repetees du plein ecran detectees. Le test va etre soumis automatiquement.",
                            onOk: () => handleSubmit(true),
                        });
                    }
                }, 300);
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        document.addEventListener('copy', onCopy);
        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => {
            clearTimeout(fullscreenDebounceTimer);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            document.removeEventListener('copy', onCopy);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, [incrementTelemetry, maxFullscreenExitAllowed, modal, tabAutoSubmitThreshold, tabWarnThreshold, test?._id]);

    useEffect(() => {
        if (!test?._id || !requireFullscreen || document.fullscreenElement || fullscreenPromptedRef.current) return;
        fullscreenPromptedRef.current = true;
        message.info('Ce test requiert le mode plein ecran.');
    }, [requireFullscreen, test?._id]);

    const handleSubmit = async (autoSubmit = false) => {
        try {
            setSubmitting(true);
            clearTimeout(timerRef.current);
            trackQuestionDwell();
            const submissionData = {
                testId: test._id,
                testStartedAt: testStartedAtRef.current,
                answers: Object.entries(answersRef.current).map(([questionId, response]) => ({
                    questionId,
                    response,
                })),
                telemetry: telemetryRef.current,
                questionTimeline: questionMetricsRef.current,
                ...getClientContext(),
            };
            const res = await submitTest(submissionData);
            try {
                localStorage.removeItem(getDraftStorageKey(id, currentUserId));
            } catch {
                /* ignore */
            }
            if (res.submissionRetained === false) {
                if (!autoSubmit) {
                    message.warning(res.message || 'Votre candidature a été clôturée suite au processus automatique.');
                }
                navigate('/mes-candidatures', {
                    replace: true,
                    state: { pipelineRemoval: res.removalReason, pipelineMessage: res.message },
                });
                return;
            }
            if (!autoSubmit) message.success('Test soumis avec succes.');
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

    const trackTyping = useCallback((event) => {
        const question = questions[currentQuestionIndex];
        if (!question?._id) return;
        const key = String(question._id);
        const prev = questionMetricsRef.current[key] || { dwellSeconds: 0, keystrokes: 0, backspaces: 0, pastes: 0 };
        const next = { ...prev };
        if (event?.key === 'Backspace' || event?.key === 'Delete') {
            next.backspaces += 1;
        } else if (event?.key && event.key.length === 1) {
            next.keystrokes += 1;
        }
        questionMetricsRef.current[key] = next;
    }, [currentQuestionIndex, questions]);

    const onPasteOpen = useCallback(() => {
        if (blockPaste) {
            message.error('Le collage est desactive pour ce test.');
            return;
        }
        incrementTelemetry('pasteCount');
        const question = questions[currentQuestionIndex];
        if (question?._id) {
            const key = String(question._id);
            const prev = questionMetricsRef.current[key] || { dwellSeconds: 0, keystrokes: 0, backspaces: 0, pastes: 0 };
            questionMetricsRef.current[key] = { ...prev, pastes: (prev.pastes || 0) + 1 };
        }
        if (!pasteWarned.current) {
            pasteWarned.current = true;
            message.warning('Privilegiez vos propres mots : le collage massif peut etre signale au recruteur.');
        }
    }, [blockPaste, currentQuestionIndex, incrementTelemetry, message, questions]);

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
                <Text>Aucune question trouvee pour ce test.</Text>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
    const openRows = currentQuestion.type === 'PROBLEM' ? 10 : currentQuestion.type === 'SHORT_ANSWER' ? 5 : 6;
    const openPlaceholder =
        currentQuestion.type === 'PROBLEM'
            ? 'Detaillez votre raisonnement et votre solution...'
            : currentQuestion.type === 'SHORT_ANSWER'
              ? 'Reponse courte (quelques phrases)...'
              : 'Tapez votre reponse ici...';

    const formatTime = (secs) => {
        if (secs === null) return '--:--';
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
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
            message.info("Le mode plein ecran a ete refuse ou n'est pas disponible.");
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
                    Ce test demande un minimum d'environ {testMeta.minSecondsPerQuestion}s par question pour une evaluation equitable.
                </Text>
            )}

            {requireFullscreen && (
                <Text type="warning" style={{ display: 'block', marginBottom: 12 }}>
                    Le plein ecran est requis pour ce test.
                </Text>
            )}
            {blockPaste && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    Le collage de texte est desactive pour garantir l'integrite de l'evaluation.
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
                                onKeyDown={trackTyping}
                                onPaste={(e) => {
                                    if (blockPaste) e.preventDefault();
                                    onPasteOpen();
                                }}
                                aria-label="Reponse libre"
                            />
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                    <Button onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                        Precedent
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
        </div>
    );
}

export default TakeTest;
