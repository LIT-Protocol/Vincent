import { theme, fonts } from '@/lib/themeClasses';
import { CreateAppStep, STEPS } from './types';

interface CreateAppProgressBarProps {
  currentStep: CreateAppStep;
}

export function CreateAppProgressBar({ currentStep }: CreateAppProgressBarProps) {
  const currentStepIndex = STEPS.findIndex((s) => s.step === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        {STEPS.map((step, index) => (
          <div
            key={step.step}
            className="flex items-center"
            style={{ flex: index === STEPS.length - 1 ? '0 0 auto' : 1 }}
          >
            {/* Step Circle and Label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 text-white shadow-lg ${
                  index > currentStepIndex
                    ? `${theme.mainCard} border-2 ${theme.cardBorder} ${theme.textMuted}`
                    : ''
                }`}
                style={index <= currentStepIndex ? { backgroundColor: theme.brandOrange } : {}}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs mt-2 font-medium transition-colors duration-300 text-center`}
                style={{
                  ...fonts.body,
                  color: index <= currentStepIndex ? theme.text : theme.textMuted,
                }}
              >
                {step.name}
              </span>
            </div>

            {/* Connecting Bar */}
            {index < STEPS.length - 1 && (
              <div className="flex-1 mx-4" style={{ marginTop: '-20px' }}>
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor:
                      index < currentStepIndex ? theme.brandOrange : theme.cardBorder,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
