import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, RefreshCw, Briefcase, MapPin, Clock, 
    TrendingUp, Award, Target, ChevronRight, Star,
    Brain, Zap, Filter
} from 'lucide-react';
import { getRecommendations, refreshRecommendations, getProfileInsights } from '../api/recommendations';

const JobRecommendations = ({ compact = false }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [recsRes, insightsRes] = await Promise.all([
                getRecommendations(),
                getProfileInsights()
            ]);
            
            if (recsRes.status) {
                setRecommendations(recsRes.recommendations || []);
            }
            if (insightsRes.status) {
                setInsights(insightsRes.insights);
            }
        } catch (err) {
            setError('Failed to load recommendations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            const response = await refreshRecommendations();
            if (response.status) {
                setRecommendations(response.recommendations || []);
            }
        } catch (err) {
            setError('Failed to refresh recommendations');
        } finally {
            setRefreshing(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-blue-500';
        if (score >= 40) return 'text-yellow-500';
        return 'text-gray-400';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-gray-400';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-100 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Recommended for You</h3>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                
                <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec, index) => (
                        <motion.div
                            key={rec.testId || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className={`w-12 h-12 rounded-lg ${getScoreBg(rec.score)} flex items-center justify-center`}>
                                <span className="text-white font-bold text-sm">{rec.score}%</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-800 truncate">
                                    {rec.test ? rec.test.title : 'Job Opportunity'}
                                </h4>
                                <p className="text-sm text-gray-500 truncate">{rec.reason}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Insights Card */}
            {insights && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Brain className="w-8 h-8" />
                        <div>
                            <h2 className="text-2xl font-bold">Your Profile Insights</h2>
                            <p className="text-indigo-200">AI-powered analysis of your skills and experience</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <Award className="w-6 h-6 mb-2 text-indigo-200" />
                            <p className="text-3xl font-bold">{insights.experienceLevel}</p>
                            <p className="text-indigo-200 text-sm">Experience Level</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <Target className="w-6 h-6 mb-2 text-indigo-200" />
                            <p className="text-3xl font-bold">{insights.totalSubmissions}</p>
                            <p className="text-indigo-200 text-sm">Tests Completed</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6 mb-2 text-indigo-200" />
                            <p className="text-3xl font-bold">{insights.averageScore}%</p>
                            <p className="text-indigo-200 text-sm">Avg Score</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <Zap className="w-6 h-6 mb-2 text-indigo-200" />
                            <p className="text-3xl font-bold">{insights.skills.length}</p>
                            <p className="text-indigo-200 text-sm">Skills Identified</p>
                        </div>
                    </div>

                    {/* Top Skills */}
                    {insights.topSkills && insights.topSkills.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3">Top Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {insights.topSkills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="bg-white/20 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm"
                                    >
                                        {skill.skill} ({skill.avgScore}%)
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Recommendations Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Recommended Jobs</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'grid' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                            }`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                            }`}
                        >
                            List
                        </button>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Recommendations Grid/List */}
            {recommendations.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-12 text-center">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Recommendations Yet</h3>
                    <p className="text-gray-500 mb-4">Complete some tests to get personalized job recommendations</p>
                    <button
                        onClick={handleRefresh}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Generate Recommendations
                    </button>
                </div>
            ) : (
                <AnimatePresence>
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }>
                        {recommendations.map((rec, index) => (
                            <motion.div
                                key={rec.testId || index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group ${
                                    viewMode === 'list' ? 'flex' : ''
                                }`}
                            >
                                {/* Score Badge */}
                                <div className={`${viewMode === 'grid' ? 'p-6' : 'p-4 w-32 flex-shrink-0'} bg-gradient-to-br from-gray-50 to-gray-100`}>
                                    <div className={`${viewMode === 'grid' ? 'w-20 h-20' : 'w-16 h-16'} rounded-full ${getScoreBg(rec.score)} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                                        <span className="text-white font-bold text-xl">{rec.score}%</span>
                                    </div>
                                    <p className="text-center text-sm text-gray-500 mt-2">Match Score</p>
                                </div>

                                {/* Content */}
                                <div className={`${viewMode === 'grid' ? 'p-6' : 'p-4 flex-1'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                                {rec.test ? rec.test.title : 'Job Opportunity'}
                                            </h3>
                                            <p className="text-gray-500 text-sm">{rec.test ? rec.test.jobRole : 'Position'}</p>
                                        </div>
                                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{rec.reason}</p>

                                    {/* Matched Skills */}
                                    {rec.matchedSkills && rec.matchedSkills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {rec.matchedSkills.slice(0, 4).map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Job Details */}
                                    {rec.test && (
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            {rec.test.location && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{rec.test.location}</span>
                                                </div>
                                            )}
                                            {rec.test.employmentType && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{rec.test.employmentType}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        View Details
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default JobRecommendations;
