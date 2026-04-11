import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { fetchAllSubmissions, updateSubmissionStage } from '../../api/submissions';
import { message, Spin, Avatar, Tag, Tooltip, Button } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAvatarUrl } from '../../utils/avatar.js';

const STAGES = [
    { id: 'NEW', title: 'Nouveau', color: '#3b82f6', bg: '#eff6ff' },
    { id: 'SCREENING', title: 'Screening RH', color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 'INTERVIEW', title: 'Entretien', color: '#f59e0b', bg: '#fffbeb' },
    { id: 'OFFER', title: 'Offre', color: '#10b981', bg: '#ecfdf5' },
    { id: 'HIRED', title: 'Embauché', color: '#059669', bg: '#d1fae5' },
    { id: 'REJECTED', title: 'Refusé', color: '#ef4444', bg: '#fef2f2' }
];

export default function Pipeline() {
    const [columns, setColumns] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = async () => {
        try {
            setLoading(true);
            const { submissions } = await fetchAllSubmissions();

            // Initialize columns
            const cols = {};
            STAGES.forEach(st => { cols[st.id] = [] });

            // Populate columns based on candidate's stage
            submissions.forEach(sub => {
                const stage = sub.stage || 'NEW'; // Default to NEW if undefined
                if (cols[stage]) {
                    cols[stage].push(sub);
                } else {
                    cols['NEW'].push(sub);
                }
            });

            setColumns(cols);
        } catch (error) {
            message.error("Erreur de chargement du pipeline");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        // Dropped outside a valid column
        if (!destination) return;

        // Dropped in same place
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceCol = source.droppableId;
        const destCol = destination.droppableId;

        // Optimistically update UI
        const newCols = { ...columns };
        const sourceList = Array.from(newCols[sourceCol]);
        const destList = Array.from(newCols[destCol]);

        const [movedItem] = sourceList.splice(source.index, 1);
        movedItem.stage = destCol; // Update local state property
        
        if (sourceCol === destCol) {
            sourceList.splice(destination.index, 0, movedItem);
            newCols[sourceCol] = sourceList;
        } else {
            destList.splice(destination.index, 0, movedItem);
            newCols[sourceCol] = sourceList;
            newCols[destCol] = destList;
        }

        setColumns(newCols);

        // API Call
        try {
            await updateSubmissionStage(draggableId, destCol);
            message.success(`Candidat déplacé vers ${STAGES.find(s => s.id === destCol).title}`);
        } catch (err) {
            message.error("Erreur de sauvegarde");
            loadData(); // Revert on error
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Pipeline de Recrutement</h2>
                    <p style={styles.subtitle}>Gérez vos candidats en les déplaçant d'une étape à l'autre (Drag & Drop)</p>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div style={styles.board}>
                    {STAGES.map(stage => {
                        const items = columns[stage.id] || [];
                        return (
                            <div key={stage.id} style={styles.columnWrapper}>
                                <div style={{...styles.columnHeader, borderTopColor: stage.color}}>
                                    <div style={styles.columnTitle}>
                                        {stage.title}
                                        <span style={styles.columnCount}>{items.length}</span>
                                    </div>
                                </div>

                                <Droppable droppableId={stage.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{
                                                ...styles.columnList,
                                                background: snapshot.isDraggingOver ? stage.bg : '#f8fafc',
                                            }}
                                        >
                                            {items.map((candidate, index) => (
                                                <Draggable key={candidate._id} draggableId={candidate._id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...styles.card,
                                                                ...provided.draggableProps.style,
                                                                boxShadow: snapshot.isDragging ? '0 12px 24px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                                                                transform: snapshot.isDragging ? provided.draggableProps.style.transform + ' scale(1.02)' : provided.draggableProps.style.transform,
                                                            }}
                                                            onClick={(e) => {
                                                                // Prevent navigation if clicking drag handle specifically if needed, 
                                                                // but usually dragging and clicking are distinct enough.
                                                                navigate(`/rh/candidate/${candidate._id}`);
                                                            }}
                                                        >
                                                            <div style={styles.cardHeader}>
                                                                <Avatar size={32} icon={<UserOutlined />} src={getAvatarUrl(candidate.candidateId?.avatar)} style={{ backgroundColor: '#2563eb' }} />
                                                                <div style={styles.cardHeaderText}>
                                                                    <div style={styles.candidateName}>
                                                                        {candidate.candidateId?.firstName} {candidate.candidateId?.lastName}
                                                                    </div>
                                                                    <div style={styles.jobTitle}>{candidate.testId?.title}</div>
                                                                </div>
                                                            </div>

                                                            <div style={styles.cardFooter}>
                                                                <div style={styles.date}>
                                                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                                    {dayjs(candidate.createdAt).format('DD MMM')}
                                                                </div>
                                                                
                                                                {candidate.totalScore !== null ? (
                                                                    <Tag color="success" style={{ margin: 0, borderRadius: 12 }}>
                                                                        {Math.round(candidate.totalScore)}%
                                                                    </Tag>
                                                                ) : (
                                                                    <Tag color="default" style={{ margin: 0, borderRadius: 12 }}>
                                                                        Non évalué
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        fontFamily: "'Inter', sans-serif"
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: 'var(--navy)',
        margin: 0,
        letterSpacing: '-0.04em'
    },
    subtitle: {
        fontSize: 16,
        color: 'var(--text-muted)',
        margin: '6px 0 0 0',
        fontWeight: 500
    },
    board: {
        display: 'flex',
        gap: 24,
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: 24,
        flex: 1,
        alignItems: 'flex-start'
    },
    columnWrapper: {
        width: 340,
        minWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-subtle)',
        borderRadius: 24,
        maxHeight: '100%',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
    },
    columnHeader: {
        padding: '24px',
        borderTop: '5px solid',
        background: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
    },
    columnTitle: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 13,
        fontWeight: 800,
        color: 'var(--navy-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
    },
    columnCount: {
        background: 'var(--bg-subtle)',
        color: 'var(--text-muted)',
        padding: '4px 12px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 800
    },
    columnList: {
        padding: '16px',
        flex: 1,
        overflowY: 'auto',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    card: {
        background: '#ffffff',
        borderRadius: 18,
        padding: '20px',
        border: '1px solid var(--border)',
        cursor: 'grab',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        marginBottom: 16,
    },
    cardHeaderText: {
        flex: 1,
        minWidth: 0,
    },
    candidateName: {
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--navy)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        letterSpacing: '-0.01em'
    },
    jobTitle: {
        fontSize: 13,
        color: 'var(--text-muted)',
        marginTop: 3,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    cardFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid var(--border-light)',
        paddingTop: 16,
    },
    date: {
        fontSize: 12,
        color: 'var(--text-light)',
        display: 'flex',
        alignItems: 'center',
        fontWeight: 600
    }
};
