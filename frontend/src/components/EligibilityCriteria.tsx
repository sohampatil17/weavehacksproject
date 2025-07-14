'use client';

import { CheckCircleIcon, XCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export interface EligibilityCriterion {
  id: string;
  title: string;
  description: string;
  status: 'eligible' | 'ineligible' | 'uncertain';
  reasoning: string;
  patientValue?: string;
  requiredValue?: string;
}

export interface EligibilityAnalysis {
  overallStatus: 'eligible' | 'ineligible' | 'uncertain';
  overallReasoning: string;
  criteria: EligibilityCriterion[];
}

interface EligibilityCriteriaProps {
  analysis: EligibilityAnalysis;
  trialTitle: string;
  className?: string;
}

const statusConfig = {
  eligible: {
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    badgeText: 'Eligible ✓'
  },
  ineligible: {
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    badgeText: 'Not Eligible ✗'
  },
  uncertain: {
    icon: QuestionMarkCircleIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    badgeText: 'Uncertain ?'
  }
};

export default function EligibilityCriteria({ analysis, trialTitle, className }: EligibilityCriteriaProps) {
  const overallConfig = statusConfig[analysis.overallStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx('bg-white rounded-lg shadow-lg border border-gray-200 p-4', className)} // Reduced padding from p-6 to p-4
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4"> {/* Reduced margin from mb-6 to mb-4 */}
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-2">{trialTitle}</h3> {/* Reduced from text-lg to text-base */}
          <div className="flex items-center gap-2">
            <span className={clsx(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              overallConfig.badge
            )}>
              {overallConfig.badgeText}
            </span>
          </div>
        </div>
        <overallConfig.icon className={clsx('w-6 h-6', overallConfig.color)} /> {/* Reduced from w-8 h-8 to w-6 h-6 */}
      </div>

      {/* Overall Reasoning */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg"> {/* Reduced margin from mb-6 to mb-4 and padding from p-4 to p-3 */}
        <h4 className="text-sm font-medium text-gray-900 mb-2">Eligibility Analysis</h4>
        <p className="text-xs text-gray-700">{analysis.overallReasoning}</p> {/* Reduced from text-sm to text-xs */}
      </div>

      {/* Criteria List */}
      <div className="space-y-3"> {/* Reduced from space-y-4 to space-y-3 */}
        <h4 className="text-sm font-medium text-gray-900 mb-2">Inclusion Criteria</h4> {/* Reduced margin from mb-3 to mb-2 */}
        {analysis.criteria.map((criterion, index) => (
          <CriterionCard key={criterion.id} criterion={criterion} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

interface CriterionCardProps {
  criterion: EligibilityCriterion;
  index: number;
}

function CriterionCard({ criterion, index }: CriterionCardProps) {
  const config = statusConfig[criterion.status];
  
  // Avoid duplicate text - only show description if it's different from reasoning
  const showDescription = criterion.description && criterion.description !== criterion.reasoning;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={clsx(
        'flex items-start gap-3 p-3 rounded-lg border', // Reduced padding from p-4 to p-3
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Status Icon */}
      <config.icon className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', config.color)} />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium text-gray-900 mb-1">{criterion.title}</h5>
        
        {/* Only show description if it's different from reasoning */}
        {showDescription && (
          <p className="text-sm text-gray-600 mb-2">{criterion.description}</p>
        )}
        
        {/* Patient vs Required Values */}
        {criterion.patientValue && criterion.requiredValue && (
          <div className="flex items-center gap-4 mb-2 text-xs">
            <span className="text-gray-500">
              Patient: <span className="font-medium text-gray-700">{criterion.patientValue}</span>
            </span>
            <span className="text-gray-500">
              Required: <span className="font-medium text-gray-700">{criterion.requiredValue}</span>
            </span>
          </div>
        )}
        
        {/* Reasoning */}
        <p className="text-xs text-gray-600 italic">{criterion.reasoning}</p>
      </div>
    </motion.div>
  );
} 