import React from 'react';
import { SyntheticPatient, ClinicalCase } from '../../types';
import { ConversationScreen } from '../intake/ConversationScreen';

interface StartCaseViewProps {
  patient: SyntheticPatient;
  onCreateCase: (newCase: ClinicalCase) => void;
  onCancel: () => void;
  onNavigateToDoctorDashboard: () => void;
}

export const StartCaseView: React.FC<StartCaseViewProps> = ({
  patient,
  onCreateCase,
  onCancel,
  onNavigateToDoctorDashboard,
}) => {
  return (
    <ConversationScreen
      patient={patient}
      onCreateCase={onCreateCase}
      onCancel={onCancel}
      onNavigateToDoctorDashboard={onNavigateToDoctorDashboard}
    />
  );
};
