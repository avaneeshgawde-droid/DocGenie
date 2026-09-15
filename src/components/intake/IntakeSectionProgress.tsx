import React from 'react';
import { Check, Circle } from 'lucide-react';
import { HistorySectionId, IntakeAnswer } from '../../types';
import { HISTORY_SECTIONS } from '../../data/intakeQuestions';

interface IntakeSectionProgressProps {
  currentSectionId: HistorySectionId;
  answers: Record<string, IntakeAnswer>;
  onSelectSection?: (sectionId: HistorySectionId) => void;
}

export const IntakeSectionProgress: React.FC<IntakeSectionProgressProps> = ({
  currentSectionId,
  answers,
  onSelectSection,
}) => {
  // Compute section completion: a section is completed if all questions belonging to it have answers
  const sectionStatus = HISTORY_SECTIONS.map((section) => {
    // Check if any question in this section is answered
    const answeredCount = (Object.values(answers) as IntakeAnswer[]).filter(
      (ans) => ans?.sectionId === section.id
    ).length;
    const isCompleted = answeredCount > 0;
    const isActive = currentSectionId === section.id;
    return {
      ...section,
      isCompleted,
      isActive,
      answeredCount,
    };
  });

  const completedCount = sectionStatus.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / HISTORY_SECTIONS.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Intake History Progress
          </span>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
            {completedCount} of {HISTORY_SECTIONS.length} Sections
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {progressPercent}% Complete
        </span>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="bg-teal-700 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(progressPercent, 5)}%` }}
        />
      </div>

      {/* Section Step Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {sectionStatus.map((section) => {
          const isClickable = Boolean(onSelectSection) && (section.isCompleted || section.isActive);

          return (
            <button
              key={section.id}
              type="button"
              disabled={!isClickable}
              onClick={() => onSelectSection && onSelectSection(section.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                section.isActive
                  ? 'bg-teal-50/80 border-teal-500 shadow-2xs ring-2 ring-teal-200 cursor-pointer'
                  : section.isCompleted
                  ? 'bg-slate-50/90 border-slate-200 hover:border-teal-300 cursor-pointer'
                  : 'bg-slate-50/40 border-slate-100 text-slate-400 cursor-not-allowed opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-bold uppercase ${
                    section.isActive
                      ? 'text-teal-800'
                      : section.isCompleted
                      ? 'text-slate-600'
                      : 'text-slate-400'
                  }`}
                >
                  Step {section.stepNumber}
                </span>

                {section.isCompleted ? (
                  <div className="w-4 h-4 rounded-full bg-teal-700 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                ) : section.isActive ? (
                  <div className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Circle className="w-2.5 h-2.5 fill-teal-700" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[9px] font-bold">
                    {section.stepNumber}
                  </div>
                )}
              </div>

              <div
                className={`text-xs font-semibold truncate ${
                  section.isActive
                    ? 'text-teal-950 font-bold'
                    : section.isCompleted
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {section.shortLabel}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
