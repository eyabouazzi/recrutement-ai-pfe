import React from 'react';
import { motion } from 'framer-motion';
import JobRecommendations from '../../Components/JobRecommendations';

const Recommendations = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900">
                        Job Recommendations
                    </h1>
                    <p className="mt-2 text-gray-600">
                        AI-powered job matching based on your skills and experience
                    </p>
                </motion.div>

                {/* Recommendations Component */}
                <JobRecommendations />
            </div>
        </div>
    );
};

export default Recommendations;
