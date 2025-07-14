'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  UserIcon,
  CalendarDaysIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  dateOfBirth?: string;
  medicalRecordNumber?: string;
  
  // Contact Information
  phone?: string;
  email?: string;
  address?: string;
  
  // Medical Information
  conditions: string[];
  medications: string[];
  allergies: string[];
  labResults?: Record<string, number | string>;
  
  // Clinical Information
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string[];
  procedures?: string[];
  
  // Demographics
  race?: string;
  ethnicity?: string;
  insurance?: string;
  
  // Document Metadata
  documentType?: string;
  extractedDate: Date;
  confidence?: number;
}

interface PatientProfileProps {
  patient: PatientInfo;
  className?: string;
}

export default function PatientProfile({ patient, className }: PatientProfileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx('bg-white rounded-lg shadow-lg border border-gray-200 p-6', className)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <UserIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
            <p className="text-sm text-gray-600">
              {patient.age} years old • {patient.gender}
            </p>
            {patient.medicalRecordNumber && (
              <p className="text-xs text-gray-500 mt-1">
                MRN: {patient.medicalRecordNumber}
              </p>
            )}
          </div>
        </div>
        
        {patient.confidence && (
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {Math.round(patient.confidence * 100)}%
            </div>
            <div className="text-xs text-gray-500">Extraction Confidence</div>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Personal Information
          </h3>
          
          <div className="space-y-3">
            {patient.dateOfBirth && (
              <InfoItem
                icon={CalendarDaysIcon}
                label="Date of Birth"
                value={new Date(patient.dateOfBirth).toLocaleDateString()}
              />
            )}
            
            {patient.phone && (
              <InfoItem
                icon={PhoneIcon}
                label="Phone"
                value={patient.phone}
              />
            )}
            
            {patient.email && (
              <InfoItem
                icon={EnvelopeIcon}
                label="Email"
                value={patient.email}
              />
            )}
            
            {patient.address && (
              <InfoItem
                icon={MapPinIcon}
                label="Address"
                value={patient.address}
              />
            )}
            
            {patient.race && (
              <InfoItem
                icon={UserIcon}
                label="Race"
                value={patient.race}
              />
            )}
            
            {patient.ethnicity && (
              <InfoItem
                icon={UserIcon}
                label="Ethnicity"
                value={patient.ethnicity}
              />
            )}
            
            {patient.insurance && (
              <InfoItem
                icon={DocumentTextIcon}
                label="Insurance"
                value={patient.insurance}
              />
            )}
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Medical Information
          </h3>
          
          {/* Primary Diagnosis */}
          {patient.primaryDiagnosis && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Primary Diagnosis</h4>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{patient.primaryDiagnosis}</p>
              </div>
            </div>
          )}
          
          {/* Conditions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Medical Conditions</h4>
            <div className="space-y-2">
              {patient.conditions.length > 0 ? (
                patient.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <HeartIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{condition}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No conditions recorded</p>
              )}
            </div>
          </div>
          
          {/* Secondary Diagnoses */}
          {patient.secondaryDiagnoses && patient.secondaryDiagnoses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Secondary Diagnoses</h4>
              <div className="space-y-2">
                {patient.secondaryDiagnoses.map((diagnosis, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{diagnosis}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Current Medications
          </h3>
          <div className="space-y-2">
            {patient.medications.length > 0 ? (
              patient.medications.map((medication, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <BeakerIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{medication}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No medications recorded</p>
            )}
          </div>
        </div>

        {/* Allergies */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Allergies
          </h3>
          <div className="space-y-2">
            {patient.allergies.length > 0 ? (
              patient.allergies.map((allergy, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{allergy}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No allergies recorded</p>
            )}
          </div>
        </div>

        {/* Lab Results */}
        {patient.labResults && Object.keys(patient.labResults).length > 0 && (
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Laboratory Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(patient.labResults).map(([test, value]) => (
                <div key={test} className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">{test}</div>
                  <div className="text-lg font-semibold text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Procedures */}
        {patient.procedures && patient.procedures.length > 0 && (
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Procedures
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {patient.procedures.map((procedure, index) => (
                <div key={index} className="p-2 bg-blue-50 rounded">
                  <span className="text-sm text-gray-700">{procedure}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Extracted from {patient.documentType || 'medical document'} on{' '}
            {patient.extractedDate.toLocaleDateString()}
          </span>
          <span>
            Last updated: {patient.extractedDate.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm text-gray-900 font-medium">{value}</div>
      </div>
    </div>
  );
} 