import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { bulkUpdateSubmissionStage, fetchAllSubmissions, updateSubmissionStage } from '../../api/submissions';
import { getTests } from '../../api/tests';
import { message, Spin, Avatar, Tag, Tooltip, Button, Select, Empty, Checkbox } from 'antd';
import { UserOutlined, ClockCircleOutlined, HolderOutlined, FileSearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAvatarUrl } from '../../utils/avatar.js';
import HRActionModal from './ActionModal.jsx';

const STAGES = [
  { id: 'NEW', title: 'Nouveau', color: '#8a6a3d', bg: 'rgba(183, 154, 106, 0.12)' },
  { id: 'SCREENING', title: 'Screening RH', color: '#5f6f63', bg: 'rgba(95, 111, 99, 0.12)' },
  { id: 'INTERVIEW', title: 'Entretien', color: '#b38746', bg: 'rgba(179, 135, 70, 0.12)' },
  { id: 'OFFER', title: 'Offre', color: '#5f7a59', bg: 'rgba(95, 122, 89, 0.14)' },
  { id: 'HIRED', title: 'Embauché', color: '#3d5a40', bg: 'rgba(61, 90, 64, 0.1)' },
  { id: 'REJECTED', title: 'Refusé', color: '#9f4d3b', bg: 'rgba(159, 77, 59, 0.1)' },
];

function normalizeStage(raw) {
  const u = String(raw || 'NEW').trim().toUpperCase();
  const allowed = new Set(STAGES.map((s) => s.id));
  return allowed.has(u) ? u : 'NEW';
}

export default function Pipeline() {
  const [columns, setColumns] = useState({});
  const [rawSubmissions, setRawSubmissions] = useState([]);
  const [myTests, setMyTests] = useState([]);
  const [testFilter, setTestFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStage, setBulkStage] = useState('SCREENING');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, submission: null });
  const navigate = useNavigate();

  const loadTests = useCallback(async () => {
    try {
      const data = await getTests();
      setMyTests(Array.isArray(data.tests) ? data.tests : []);
    } catch {
      setMyTests([]);
    }
  }, []);

  const distributeToColumns = useCallback((list) => {
    const cols = {};
    STAGES.forEach((st) => {
      cols[st.id] = [];
    });
    const filtered =
      testFilter === 'ALL'
        ? list
        : list.filter((sub) => String(sub.testId?._id || sub.testId) === String(testFilter));
    filtered.forEach((sub) => {
      const stage = normalizeStage(sub.stage);
      if (cols[stage]) cols[stage].push(sub);
      else cols.NEW.push(sub);
    });
    setColumns(cols);
  }, [testFilter]);

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const { submissions } = await fetchAllSubmissions();
      const list = Array.isArray(submissions) ? submissions : [];
      setRawSubmissions(list);
    } catch {
      message.error('Impossible de charger votre pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    distributeToColumns(rawSubmissions);
  }, [rawSubmissions, distributeToColumns]);

  const testOptions = useMemo(
    () =>
      myTests.map((t) => ({
        value: String(t._id),
        label: t.title || 'Sans titre',
      })),
    [myTests],
  );

  const totals = useMemo(() => {
    const t = {};
    STAGES.forEach((s) => {
      t[s.id] = (columns[s.id] || []).length;
    });
    const all = Object.values(t).reduce((a, b) => a + b, 0);
    return { ...t, all };
  }, [columns]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const newCols = { ...columns };
    const sourceList = Array.from(newCols[sourceCol]);
    const destList = sourceCol === destCol ? sourceList : Array.from(newCols[destCol]);

    const [movedItem] = sourceList.splice(source.index, 1);
    movedItem.stage = destCol;

    if (sourceCol === destCol) {
      sourceList.splice(destination.index, 0, movedItem);
      newCols[sourceCol] = sourceList;
    } else {
      const destCopy = Array.from(newCols[destCol]);
      destCopy.splice(destination.index, 0, movedItem);
      newCols[sourceCol] = sourceList;
      newCols[destCol] = destCopy;
    }

    setColumns(newCols);

    try {
      const response = await updateSubmissionStage(draggableId, destCol);
      if (response?.deleted) {
        setRawSubmissions((prev) => prev.filter((item) => String(item._id) !== String(draggableId)));
        message.success(response.message || 'Candidature retirée du pipeline');
        return;
      }
      setRawSubmissions((prev) =>
        prev.map((item) => (String(item._id) === String(draggableId) ? { ...item, stage: destCol } : item)),
      );
      const label = STAGES.find((s) => s.id === destCol)?.title || destCol;
      message.success(`Étape mise à jour : ${label}`);
    } catch {
      message.error('Enregistrement impossible — rechargement');
      loadSubmissions();
    }
  };

  const toggleSelect = (submissionId, checked) => {
    const id = String(submissionId);
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const handleBulkMove = async () => {
    if (!selectedIds.length || !bulkStage) return;
    setBulkLoading(true);
    try {
      const response = await bulkUpdateSubmissionStage(selectedIds, bulkStage);
      setRawSubmissions((prev) =>
        prev.map((item) => (
          selectedIds.includes(String(item._id))
            ? {
              ...item,
              stage: bulkStage,
              stageHistory: [
                ...(Array.isArray(item.stageHistory) ? item.stageHistory : []),
                {
                  fromStage: item.stage || 'NEW',
                  toStage: bulkStage,
                  source: 'hr',
                  changedAt: new Date().toISOString(),
                  note: 'Bulk stage update by HR',
                },
              ],
            }
            : item
        )),
      );
      setSelectedIds([]);
      message.success(response?.message || 'Candidatures mises à jour');
    } catch (error) {
      message.error(error?.message || 'Mise à jour en lot impossible');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Vue recruteur</p>
          <h2 style={styles.title}>Pipeline</h2>
          <p style={styles.subtitle}>
            Uniquement les candidats ayant postulé sur <strong>vos offres</strong> (et celles de votre équipe RH
            rattachée à la même entreprise). Les comptes candidats voient leurs propres dossiers ailleurs — rien n’est
            mélangé ici.
          </p>
        </div>
        <div style={styles.toolbar}>
          <span style={styles.toolbarLab}>Filtrer par offre</span>
          <Select
            value={testFilter}
            onChange={(v) => setTestFilter(v)}
            style={{ minWidth: 220 }}
            options={[{ value: 'ALL', label: 'Toutes mes offres' }, ...testOptions]}
            showSearch
            optionFilterProp="label"
          />
          <Tag style={{ margin: 0, borderRadius: 999, padding: '4px 12px', fontWeight: 700 }}>
            {totals.all} candidature{totals.all !== 1 ? 's' : ''}
          </Tag>
          <Tag color={selectedIds.length > 0 ? 'processing' : 'default'} style={{ margin: 0, borderRadius: 999 }}>
            {selectedIds.length} sélectionnée{selectedIds.length > 1 ? 's' : ''}
          </Tag>
          <Select
            value={bulkStage}
            onChange={setBulkStage}
            style={{ minWidth: 170 }}
            options={STAGES.map((s) => ({ value: s.id, label: s.title }))}
          />
          <Button type="primary" onClick={handleBulkMove} loading={bulkLoading} disabled={selectedIds.length === 0}>
            Déplacer la sélection
          </Button>
          <Button onClick={clearSelection} disabled={selectedIds.length === 0}>
            Effacer
          </Button>
        </div>
      </div>

      {totals.all === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            testFilter === 'ALL'
              ? 'Aucune candidature sur vos offres pour l’instant.'
              : 'Aucune candidature pour cette offre.'
          }
        />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={styles.board}>
            {STAGES.map((stage) => {
              const items = columns[stage.id] || [];
              return (
                <div key={stage.id} style={styles.columnWrapper}>
                  <div style={{ ...styles.columnHeader, borderTopColor: stage.color }}>
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
                          background: snapshot.isDraggingOver ? stage.bg : 'rgba(255, 253, 249, 0.55)',
                        }}
                      >
                        {items.map((submission, index) => (
                          <Draggable key={submission._id} draggableId={String(submission._id)} index={index}>
                            {(providedDrag, snapshotDrag) => (
                              <div
                                ref={providedDrag.innerRef}
                                {...providedDrag.draggableProps}
                                style={{
                                  ...styles.card,
                                  ...providedDrag.draggableProps.style,
                                  boxShadow: snapshotDrag.isDragging
                                    ? '0 16px 40px rgba(64, 49, 28, 0.15)'
                                    : 'var(--wow-shadow, 0 8px 24px rgba(64,49,28,0.06))',
                                }}
                              >
                                <div {...providedDrag.dragHandleProps} style={styles.dragHandle} title="Glisser">
                                  <HolderOutlined />
                                </div>
                                <div style={styles.cardBody}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Tooltip title="Sélectionner pour action groupée">
                                      <Checkbox
                                        checked={selectedIds.includes(String(submission._id))}
                                        onChange={(e) => toggleSelect(submission._id, e.target.checked)}
                                      />
                                    </Tooltip>
                                  </div>
                                  <div style={styles.cardHeader}>
                                    <Avatar
                                      size={36}
                                      icon={<UserOutlined />}
                                      src={getAvatarUrl(submission.candidateId?.avatar)}
                                      style={{ backgroundColor: 'var(--wow-primary-a, #8a6a3d)', flexShrink: 0 }}
                                    />
                                    <div style={styles.cardHeaderText}>
                                      <div style={styles.candidateName}>
                                        {submission.candidateId?.firstName} {submission.candidateId?.lastName}
                                      </div>
                                      <div style={styles.jobTitle}>{submission.testId?.title || 'Offre'}</div>
                                    </div>
                                  </div>

                                  <div style={styles.cardFooter}>
                                    <div style={styles.date}>
                                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                                      {dayjs(submission.createdAt).format('DD MMM YY')}
                                    </div>
                                    {submission.totalScore != null ? (
                                      <Tag color="success" style={{ margin: 0, borderRadius: 12, fontWeight: 700 }}>
                                        {Math.round(submission.totalScore)}%
                                      </Tag>
                                    ) : (
                                      <Tag style={{ margin: 0, borderRadius: 12 }}>Non évalué</Tag>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<FileSearchOutlined />}
                                      onClick={() => navigate(`/rh/candidate/${submission._id}`)}
                                      style={{ padding: 0, fontWeight: 700 }}
                                    >
                                      Dossier
                                    </Button>
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<ThunderboltOutlined />}
                                      onClick={() => setActionModal({ open: true, submission })}
                                      style={{ background: '#6366f1', borderColor: '#6366f1', fontWeight: 700 }}
                                    >
                                      Actions
                                    </Button>
                                  </div>
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
      )}

      <HRActionModal
        open={actionModal.open}
        submission={actionModal.submission}
        onClose={() => setActionModal({ open: false, submission: null })}
        onSuccess={(newStage) => {
          if (actionModal.submission) {
            setRawSubmissions(prev =>
              prev.map(s => s._id === actionModal.submission._id ? { ...s, stage: newStage } : s)
            );
          }
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 140px)',
    fontFamily: "'Manrope', 'Sora', sans-serif",
    maxWidth: '100%',
  },
  header: {
    marginBottom: 22,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  kicker: {
    margin: 0,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--wow-primary-a, #8a6a3d)',
  },
  title: {
    fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
    fontWeight: 900,
    color: 'var(--wow-ink, #2b241b)',
    margin: '6px 0 0 0',
    letterSpacing: '-0.03em',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--wow-sub, #83796d)',
    margin: '10px 0 0 0',
    maxWidth: 720,
    lineHeight: 1.65,
    fontWeight: 500,
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  toolbarLab: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--wow-ink, #2b241b)',
  },
  board: {
    display: 'flex',
    gap: 16,
    overflowX: 'auto',
    overflowY: 'hidden',
    paddingBottom: 20,
    flex: 1,
    alignItems: 'flex-start',
  },
  columnWrapper: {
    width: 300,
    minWidth: 300,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--wow-card, #fffdf9)',
    borderRadius: 20,
    maxHeight: '100%',
    border: '1px solid var(--wow-border, #ddd1bf)',
    boxShadow: 'var(--wow-shadow, 0 14px 32px rgba(64,49,28,0.07))',
    overflow: 'hidden',
  },
  columnHeader: {
    padding: '16px 18px',
    borderTop: '4px solid',
    background: 'rgba(255, 253, 249, 0.95)',
    borderBottom: '1px solid var(--wow-border, #ddd1bf)',
  },
  columnTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 800,
    color: 'var(--wow-sub, #83796d)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  columnCount: {
    background: 'rgba(183, 154, 106, 0.15)',
    color: 'var(--wow-ink, #2b241b)',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  },
  columnList: {
    padding: 12,
    flex: 1,
    overflowY: 'auto',
    minHeight: 200,
    maxHeight: 'calc(100vh - 260px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    transition: 'background 0.25s ease',
  },
  card: {
    display: 'flex',
    gap: 0,
    background: 'var(--wow-card, #fffdf9)',
    borderRadius: 16,
    border: '1px solid var(--wow-border, #ddd1bf)',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease',
  },
  dragHandle: {
    width: 36,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    color: 'var(--wow-sub, #83796d)',
    background: 'rgba(221, 209, 191, 0.25)',
    borderRight: '1px solid var(--wow-border, #ddd1bf)',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    padding: '12px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--wow-ink, #2b241b)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  jobTitle: {
    fontSize: 12,
    color: 'var(--wow-sub, #83796d)',
    marginTop: 2,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px dashed rgba(221, 209, 191, 0.85)',
    paddingTop: 10,
  },
  date: {
    fontSize: 11,
    color: 'var(--wow-sub, #83796d)',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 600,
  },
};
