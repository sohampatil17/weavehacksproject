'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  BeakerIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

export interface ClinicalTrial {
  id: string;
  title: string;
  brief_title: string;
  condition: string;
  sponsor: string;
  phase: string;
  status: 'recruiting' | 'active' | 'completed' | 'suspended';
  location: string;
  enrollment: number;
  start_date: string;
  completion_date?: string;
  eligibility_criteria: string[];
  primary_outcome: string;
  secondary_outcomes?: string[];
  contact_info?: {
    name: string;
    phone: string;
    email: string;
  };
  study_type: string;
  intervention_type: string;
  nct_id: string;
  brief_summary: string;
  detailed_description?: string;
  eligibility_status?: 'eligible' | 'ineligible' | 'uncertain';
  match_score?: number;
}

interface ClinicalTrialsDashboardProps {
  trials: ClinicalTrial[];
  onTrialSelect?: (trial: ClinicalTrial) => void;
  className?: string;
}

const statusConfig = {
  recruiting: {
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon
  },
  active: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    icon: BeakerIcon
  },
  completed: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-800',
    icon: CheckCircleIcon
  },
  suspended: {
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    icon: XMarkIcon
  }
};

const eligibilityStatusConfig = {
  eligible: {
    color: 'text-eligible-700',
    bgColor: 'bg-eligible-50',
    borderColor: 'border-eligible-200',
    badge: 'bg-eligible-100 text-eligible-800',
    text: 'Likely Match'
  },
  ineligible: {
    color: 'text-ineligible-700',
    bgColor: 'bg-ineligible-50',
    borderColor: 'border-ineligible-200',
    badge: 'bg-ineligible-100 text-ineligible-800',
    text: 'Not Suitable'
  },
  uncertain: {
    color: 'text-uncertain-700',
    bgColor: 'bg-uncertain-50',
    borderColor: 'border-uncertain-200',
    badge: 'bg-uncertain-100 text-uncertain-800',
    text: 'Needs Review'
  }
};

export default function ClinicalTrialsDashboard({ trials, onTrialSelect, className }: ClinicalTrialsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'enrollment'>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedTrials = useMemo(() => {
    const filtered = trials.filter(trial => {
      const matchesSearch = trial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trial.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trial.sponsor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || trial.status === statusFilter;
      const matchesPhase = phaseFilter === 'all' || trial.phase === phaseFilter;
      
      return matchesSearch && matchesStatus && matchesPhase;
    });

    // Sort trials
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (b.match_score || 0) - (a.match_score || 0);
        case 'date':
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case 'enrollment':
          return b.enrollment - a.enrollment;
        default:
          return 0;
      }
    });

    return filtered;
  }, [trials, searchTerm, statusFilter, phaseFilter, sortBy]);

  const uniquePhases = Array.from(new Set(trials.map(t => t.phase))).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx('bg-white rounded-lg shadow-lg border border-gray-200', className)}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Clinical Trials</h2>
            <p className="text-sm text-gray-600 mt-1">
              Found {filteredAndSortedTrials.length} trials matching your criteria
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
            <ChevronDownIcon className={clsx('w-4 h-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search trials by title, condition, or sponsor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="recruiting">Recruiting</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Phase Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
                <select
                  value={phaseFilter}
                  onChange={(e) => setPhaseFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Phases</option>
                  {uniquePhases.map(phase => (
                    <option key={phase} value={phase}>{phase}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date' | 'enrollment')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Start Date</option>
                  <option value="enrollment">Enrollment</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trials List */}
      <div className="p-6">
        {filteredAndSortedTrials.length === 0 ? (
          <div className="text-center py-12">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trials found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedTrials.map((trial, index) => (
              <TrialCard 
                key={trial.id} 
                trial={trial} 
                onSelect={onTrialSelect}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TrialCardProps {
  trial: ClinicalTrial;
  onSelect?: (trial: ClinicalTrial) => void;
  index: number;
}

function TrialCard({ trial, onSelect, index }: TrialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConf = statusConfig[trial.status];
  const eligibilityConf = trial.eligibility_status ? eligibilityStatusConfig[trial.eligibility_status] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={clsx(
        'border rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1',
        eligibilityConf ? eligibilityConf.borderColor : 'border-gray-200',
        'bg-white hover:bg-gray-50'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-gray-900 truncate">{trial.brief_title}</h3>
            {trial.match_score && (
              <span className={clsx(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm animate-pulse",
                trial.match_score >= 0.8 ? "bg-green-100 text-green-800 border border-green-200" :
                trial.match_score >= 0.6 ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
                "bg-red-100 text-red-800 border border-red-200"
              )}>
                🎯 {Math.round(trial.match_score * 100)}% match
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{trial.condition}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-3 h-3 text-blue-500" />
              {trial.location}
            </span>
            <span className="flex items-center gap-1">
              <UserGroupIcon className="w-3 h-3 text-green-500" />
              {trial.enrollment} participants
            </span>
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="w-3 h-3 text-purple-500" />
              {new Date(trial.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {eligibilityConf && (
            <span className={clsx(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              eligibilityConf.badge
            )}>
              {eligibilityConf.text}
            </span>
          )}
          <span className={clsx(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            statusConf.badge
          )}>
            {trial.status}
          </span>
          <span className="text-xs text-gray-500">{trial.phase}</span>
        </div>
      </div>

      {/* Brief Summary */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{trial.brief_summary}</p>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 pt-4 mt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Study Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Study Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Sponsor:</strong> {trial.sponsor}</p>
                  <p><strong>Study Type:</strong> {trial.study_type}</p>
                  <p><strong>Intervention:</strong> {trial.intervention_type}</p>
                  <p><strong>NCT ID:</strong> {trial.nct_id}</p>
                </div>
              </div>

              {/* Primary Outcome */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Primary Outcome</h4>
                <p className="text-sm text-gray-600">{trial.primary_outcome}</p>
              </div>

              {/* Contact Information */}
              {trial.contact_info && (
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="text-sm text-gray-600">
                    <p><strong>Contact:</strong> {trial.contact_info.name}</p>
                    <p><strong>Phone:</strong> {trial.contact_info.phone}</p>
                    <p><strong>Email:</strong> {trial.contact_info.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(trial);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md transition-all duration-200"
              >
                📊 View Full Details
              </button>
              <a
                href={`https://clinicaltrials.gov/ct2/show/${trial.nct_id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2 text-green-600" />
                View on ClinicalTrials.gov
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 