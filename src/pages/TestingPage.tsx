import React from 'react';
import FeatureTester from '@/components/testing/FeatureTester';

const TestingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Testing Dashboard</h1>
          <p className="text-gray-600">
            Validate all enhanced features and database setup for Knowledge Nexus Phase 1
          </p>
        </div>
        
        <FeatureTester />
      </div>
    </div>
  );
};

export default TestingPage;