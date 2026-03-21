import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    BarChart3, TrendingUp, Users, Award, PieChart, 
    Activity, Target, Clock, Briefcase, TrendingDown,
    ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { getDashboardStats } from '../api/dashboard';

const AnalyticsCharts = ({ compact = false }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeChart, setActiveChart] = useState('overview');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await getDashboardStats();
            if (response.status) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mock data for demonstration
    const mockData = {
        scoreDistribution: [
            { range: '0-20', count: 5, color: '#ef4444' },
            { range: '21-40', count: 12, color: '#f97316' },
            { range: '41-60', count: 28, color: '#eab308' },
            { range: '61-80', count: 45, color: '#22c55e' },
            { range: '81-100', count: 32, color: '#10b981' }
        ],
        pipelineStages: [
            { stage: 'Applied', count: 156, percentage: 100 },
            { stage: 'Screening', count: 98, percentage: 63 },
            { stage: 'Interview', count: 45, percentage: 29 },
            { stage: 'Offered', count: 18, percentage: 12 },
            { stage: 'Hired', count: 12, percentage: 8 }
        ],
        skillsHeatmap: [
            { skill: 'JavaScript', demand: 95, supply: 78 },
            { skill: 'React', demand: 88, supply: 65 },
            { skill: 'Python', demand: 82, supply: 70 },
            { skill: 'Node.js', demand: 75, supply: 55 },
            { skill: 'TypeScript', demand: 70, supply: 45 },
            { skill: 'AWS', demand: 65, supply: 35 },
            { skill: 'Docker', demand: 60, supply: 40 },
            { skill: 'MongoDB', demand: 55, supply: 50 }
        ],
        submissionsOverTime: [
            { week: 'W1', submissions: 45, hires: 3 },
            { week: 'W2', submissions: 52, hires: 5 },
            { week: 'W3', submissions: 38, hires: 2 },
            { week: 'W4', submissions: 61, hires: 4 },
            { week: 'W5', submissions: 55, hires: 6 },
            { week: 'W6', submissions: 72, hires: 8 }
        ],
        topPerformers: [
            { name: 'Jean Dupont', score: 98, role: 'Full Stack Developer' },
            { name: 'Marie Martin', score: 95, role: 'Frontend Developer' },
            { name: 'Pierre Bernard', score: 92, role: 'Backend Developer' },
            { name: 'Sophie Petit', score: 90, role: 'DevOps Engineer' },
            { name: 'Lucas Robert', score: 88, role: 'Data Scientist' }
        ]
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-64 bg-gray-100 rounded-xl"></div>
                        <div className="h-64 bg-gray-100 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    const renderScoreDistribution = () => (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Score Distribution</h3>
            </div>
            <div className="space-y-4">
                {mockData.scoreDistribution.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4"
                    >
                        <span className="w-16 text-sm text-gray-500">{item.range}</span>
                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.count / 45) * 100}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="h-full rounded-lg flex items-center justify-end pr-2"
                                style={{ backgroundColor: item.color }}
                            >
                                <span className="text-white text-sm font-medium">{item.count}</span>
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderPipelineChart = () => (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Application Pipeline</h3>
            </div>
            <div className="flex items-end justify-between gap-2 h-48">
                {mockData.pipelineStages.map((stage, index) => (
                    <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: `${stage.percentage}%` }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="flex-1 flex flex-col items-center"
                    >
                        <div 
                            className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg relative group cursor-pointer hover:from-indigo-500 hover:to-purple-400 transition-colors"
                            style={{ height: '100%' }}
                        >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {stage.count} candidates
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">{stage.stage}</p>
                        <p className="text-sm font-semibold text-gray-700">{stage.percentage}%</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderSkillsHeatmap = () => (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Skills Supply vs Demand</h3>
            </div>
            <div className="space-y-4">
                {mockData.skillsHeatmap.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="space-y-2"
                    >
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">{item.skill}</span>
                            <span className={`flex items-center gap-1 ${
                                item.demand > item.supply ? 'text-red-500' : 'text-green-500'
                            }`}>
                                {item.demand > item.supply ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                ) : item.demand < item.supply ? (
                                    <ArrowDownRight className="w-4 h-4" />
                                ) : (
                                    <Minus className="w-4 h-4" />
                                )}
                                {Math.abs(item.demand - item.supply)}% {item.demand > item.supply ? 'shortage' : 'surplus'}
                            </span>
                        </div>
                        <div className="flex gap-1 h-4">
                            <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.demand}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.05 }}
                                    className="h-full bg-indigo-500 rounded-full"
                                />
                            </div>
                            <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.supply}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.05 + 0.1 }}
                                    className="h-full bg-emerald-500 rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
                <div className="flex gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                        <span className="text-sm text-gray-500">Demand</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-gray-500">Supply</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTimeSeries = () => (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Submissions Over Time</h3>
            </div>
            <div className="relative h-48">
                <svg className="w-full h-full" viewBox="0 0 300 150">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map(i => (
                        <line
                            key={i}
                            x1="0"
                            y1={i * 37.5}
                            x2="300"
                            y2={i * 37.5}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                        />
                    ))}
                    
                    {/* Submissions line */}
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5 }}
                        d="M 0 120 L 50 105 L 100 130 L 150 85 L 200 95 L 250 70"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    
                    {/* Hires line */}
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.3 }}
                        d="M 0 140 L 50 135 L 100 142 L 150 138 L 200 132 L 250 125"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="5,5"
                    />
                    
                    {/* Data points */}
                    {mockData.submissionsOverTime.map((item, index) => (
                        <g key={index}>
                            <motion.circle
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                cx={index * 50}
                                cy={150 - (item.submissions / 72) * 100}
                                r="5"
                                fill="#6366f1"
                            />
                            <motion.circle
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                cx={index * 50}
                                cy={150 - (item.hires / 72) * 100}
                                r="4"
                                fill="#10b981"
                            />
                        </g>
                    ))}
                </svg>
                
                {/* X-axis labels */}
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    {mockData.submissionsOverTime.map((item, index) => (
                        <span key={index}>{item.week}</span>
                    ))}
                </div>
            </div>
            
            <div className="flex gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-indigo-500 rounded"></div>
                    <span className="text-sm text-gray-500">Submissions</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-emerald-500 rounded" style={{ borderStyle: 'dashed' }}></div>
                    <span className="text-sm text-gray-500">Hires</span>
                </div>
            </div>
        </div>
    );

    const renderTopPerformers = () => (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Top Performers</h3>
            </div>
            <div className="space-y-4">
                {mockData.topPerformers.map((performer, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-indigo-500'
                        }`}>
                            {index + 1}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-800">{performer.name}</p>
                            <p className="text-sm text-gray-500">{performer.role}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-indigo-600">{performer.score}%</p>
                            <p className="text-xs text-gray-400">Score</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    // Compact view for dashboard widgets
    if (compact) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderScoreDistribution()}
                {renderPipelineChart()}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Chart Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'overview', label: 'Overview', icon: PieChart },
                    { id: 'pipeline', label: 'Pipeline', icon: Activity },
                    { id: 'skills', label: 'Skills', icon: Target },
                    { id: 'trends', label: 'Trends', icon: TrendingUp },
                    { id: 'performers', label: 'Top Talent', icon: Award }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveChart(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                            activeChart === tab.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Chart Content */}
            <motion.div
                key={activeChart}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeChart === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderScoreDistribution()}
                        {renderPipelineChart()}
                    </div>
                )}
                {activeChart === 'pipeline' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {renderPipelineChart()}
                        {renderTopPerformers()}
                    </div>
                )}
                {activeChart === 'skills' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {renderSkillsHeatmap()}
                        {renderTopPerformers()}
                    </div>
                )}
                {activeChart === 'trends' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {renderTimeSeries()}
                        {renderScoreDistribution()}
                    </div>
                )}
                {activeChart === 'performers' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {renderTopPerformers()}
                        {renderSkillsHeatmap()}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default AnalyticsCharts;
