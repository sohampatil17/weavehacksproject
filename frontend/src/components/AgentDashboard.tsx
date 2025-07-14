'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  BeakerIcon, 
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  currentTask?: string;
  lastUpdate: Date;
  processingTime?: number;
  errorMessage?: string;
}

interface AgentDashboardProps {
  agents: AgentStatus[];
  className?: string;
}

const agentConfig = {
  document_processing_agent: {
    icon: DocumentTextIcon,
    color: 'blue',
    description: 'Processing PDF documents and extracting patient data'
  },
  clinical_trials_agent: {
    icon: MagnifyingGlassIcon,
    color: 'purple',
    description: 'Searching clinicaltrials.gov for relevant studies'
  },
  eligibility_analysis_agent: {
    icon: BeakerIcon,
    color: 'green',
    description: 'Analyzing patient eligibility using AI reasoning'
  },
  clinical_trial_orchestrator: {
    icon: Cog6ToothIcon,
    color: 'orange',
    description: 'Coordinating workflow and managing agent communication'
  }
};

const statusConfig = {
  idle: {
    icon: ClockIcon,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    badgeText: 'Idle'
  },
  processing: {
    icon: ClockIcon,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    badgeText: 'Processing'
  },
  completed: {
    icon: CheckCircleIcon,
    color: 'text-green-500', // Changed from text-eligible-500 to text-green-500
    bgColor: 'bg-green-50', // Changed from bg-eligible-50 to bg-green-50
    borderColor: 'border-green-200', // Changed from border-eligible-200 to border-green-200
    badge: 'bg-green-100 text-green-700', // Changed from bg-eligible-100 text-eligible-700 to bg-green-100 text-green-700
    badgeText: 'Completed ✓' // Added checkmark
  },
  error: {
    icon: ExclamationTriangleIcon,
    color: 'text-red-500', // Changed from text-ineligible-500 to text-red-500
    bgColor: 'bg-red-50', // Changed from bg-ineligible-50 to bg-red-50
    borderColor: 'border-red-200', // Changed from border-ineligible-200 to border-red-200
    badge: 'bg-red-100 text-red-700', // Changed from bg-ineligible-100 text-ineligible-700 to bg-red-100 text-red-700
    badgeText: 'Error ✗' // Added X mark
  }
};

export default function AgentDashboard({ agents, className }: AgentDashboardProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client side only
    setCurrentTime(new Date());
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const overallProgress = agents.reduce((sum, agent) => sum + agent.progress, 0) / agents.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx('bg-white rounded-lg shadow-lg border border-gray-200 p-6', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Agent Status Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time monitoring of all system agents</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{Math.round(overallProgress)}%</div>
          <div className="text-xs text-gray-500">Overall Progress</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">System Status</span>
          <span className="text-sm text-gray-500">{Math.round(overallProgress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent, index) => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            currentTime={currentTime}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface AgentCardProps {
  agent: AgentStatus;
  currentTime: Date | null;
  index: number;
}

function AgentCard({ agent, currentTime, index }: AgentCardProps) {
  const config = agentConfig[agent.id as keyof typeof agentConfig];
  const statusConf = statusConfig[agent.status];
  
  if (!config) return null;

  // Handle null currentTime during SSR
  const timeSinceUpdate = currentTime 
    ? Math.floor((currentTime.getTime() - agent.lastUpdate.getTime()) / 1000)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={clsx(
        'border rounded-lg p-4 transition-all duration-200',
        statusConf.bgColor,
        statusConf.borderColor,
        agent.status === 'processing' && 'shadow-md'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'p-2 rounded-lg',
            `bg-${config.color}-100`
          )}>
            <config.icon className={clsx('w-5 h-5', `text-${config.color}-600`)} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{agent.name}</h3>
            <p className="text-xs text-gray-600">{config.description}</p>
          </div>
        </div>
        <span className={clsx(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
          statusConf.badge
        )}>
          {statusConf.badgeText}
        </span>
      </div>

      {/* Current Task */}
      {agent.currentTask && (
        <div className="mb-3 p-2 bg-white rounded border border-gray-100">
          <p className="text-xs text-gray-700">{agent.currentTask}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs text-gray-600">{agent.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2"> {/* Increased height from h-1.5 to h-2 */}
          <motion.div
            className={clsx(
              'h-2 rounded-full relative overflow-hidden', // Increased height and added overflow-hidden
              agent.status === 'processing' ? 'bg-blue-500' : 
              agent.status === 'completed' ? 'bg-green-500' : // Changed from bg-eligible-500 to bg-green-500
              agent.status === 'error' ? 'bg-red-500' : 'bg-gray-400' // Changed from bg-ineligible-500 to bg-red-500
            )}
            initial={{ width: 0 }}
            animate={{ width: `${agent.progress}%` }}
            transition={{ duration: 0.5 }}
          >
            {/* Add animated stripes for processing state */}
            {agent.status === 'processing' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}
            
            {/* Add pulse effect for completed state */}
            {agent.status === 'completed' && (
              <motion.div
                className="absolute inset-0 bg-green-400 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Updated {currentTime ? `${timeSinceUpdate}s ago` : 'just now'}</span>
      </div>

      {/* Error Message */}
      {agent.status === 'error' && agent.errorMessage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700" // Changed from ineligible colors to red colors
        >
          {agent.errorMessage}
        </motion.div>
      )}

      {/* Processing Animation */}
      {agent.status === 'processing' && (
        <motion.div
          className="absolute inset-0 bg-blue-50 rounded-lg opacity-30"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
} 