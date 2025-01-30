'use client';

import { useState } from 'react';

export default function CardKnowledgeBaseAI() {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Knowledge Base AI Management</h2>
        
        <div className="divider"></div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">AI Features Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stat bg-base-200 rounded-box p-4">
                <div className="stat-title">Article Suggestions</div>
                <div className="stat-value text-primary">Active</div>
                <div className="stat-desc">Suggests relevant articles to users</div>
              </div>
              
              <div className="stat bg-base-200 rounded-box p-4">
                <div className="stat-title">Auto-Tagging</div>
                <div className="stat-value text-primary">Active</div>
                <div className="stat-desc">Suggests tags for new articles</div>
              </div>
              
              <div className="stat bg-base-200 rounded-box p-4">
                <div className="stat-title">Quality Analysis</div>
                <div className="stat-value text-primary">Active</div>
                <div className="stat-desc">Analyzes article quality</div>
              </div>
              
              <div className="stat bg-base-200 rounded-box p-4">
                <div className="stat-title">Performance Tracking</div>
                <div className="stat-value text-primary">Active</div>
                <div className="stat-desc">Tracks article effectiveness</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 