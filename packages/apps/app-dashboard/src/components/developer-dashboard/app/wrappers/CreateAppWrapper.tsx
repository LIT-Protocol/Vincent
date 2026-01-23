import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/shared/ui/Loading';
import { theme } from '@/lib/themeClasses';
import {
  useCreateAppFormState,
  CreateAppProgressBar,
  CreateAppStepAbilities,
  CreateAppStepDelegatees,
  CreateAppStepMetadata,
  CreateAppStepReview,
  CreateAppSubmitting,
} from './create-app';

export function CreateAppWrapper() {
  const navigate = useNavigate();

  const {
    // Step state
    currentStep,

    // Abilities
    selectedAbilities,
    isAbilitySelectorOpen,
    setIsAbilitySelectorOpen,
    handleAbilityAdd,
    handleAbilityRemove,
    abilities,
    abilitiesLoading,

    // Delegatees
    delegateeAddresses,
    delegateeInput,
    delegateeError,
    handleDelegateeInputChange,
    handleRemoveDelegatee,

    // Metadata
    metadataForm,
    metadataFormData,

    // Submission
    error,
    submissionStatus,
    infoMessage,

    // Navigation
    handleNextFromAbilities,
    handleNextFromDelegatees,
    handleNextFromMetadata,
    handleBack,
    handleFinalSubmit,
  } = useCreateAppFormState();

  // Show submitting state
  if (currentStep === 'submitting') {
    return <CreateAppSubmitting submissionStatus={submissionStatus} />;
  }

  // Show error if abilities failed to load
  if (!abilities && !abilitiesLoading) {
    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Apps', onClick: () => navigate('/developer/apps') },
            { label: 'Create App' },
          ]}
        />
        <StatusMessage message="Failed to load abilities. Please try again." type="error" />
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          { label: 'Create App' },
        ]}
      />

      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${theme.text}`}>Create New App</h1>
        <p className={`${theme.textMuted} mt-2`}>
          Follow the steps below to register your app on-chain with abilities and delegatees.
        </p>
      </div>

      <CreateAppProgressBar currentStep={currentStep} />

      {infoMessage && (
        <div className="mb-4">
          <StatusMessage message={infoMessage} type="info" />
        </div>
      )}

      {error && (
        <div className="mb-4">
          <StatusMessage message={error} type="error" />
        </div>
      )}

      {abilitiesLoading ? (
        <Loading />
      ) : !abilities || abilities.length === 0 ? (
        <StatusMessage message="No abilities available. Please contact support." type="warning" />
      ) : (
        <>
          {currentStep === 'abilities' && (
            <CreateAppStepAbilities
              selectedAbilities={selectedAbilities}
              isAbilitySelectorOpen={isAbilitySelectorOpen}
              setIsAbilitySelectorOpen={setIsAbilitySelectorOpen}
              onAbilityAdd={handleAbilityAdd}
              onAbilityRemove={handleAbilityRemove}
              onNext={handleNextFromAbilities}
              availableAbilities={abilities}
            />
          )}

          {currentStep === 'delegatees' && (
            <CreateAppStepDelegatees
              delegateeAddresses={delegateeAddresses}
              delegateeInput={delegateeInput}
              delegateeError={delegateeError}
              onDelegateeInputChange={handleDelegateeInputChange}
              onRemoveDelegatee={handleRemoveDelegatee}
              onNext={handleNextFromDelegatees}
              onBack={handleBack}
            />
          )}

          {currentStep === 'metadata' && (
            <CreateAppStepMetadata
              metadataForm={metadataForm}
              onNext={handleNextFromMetadata}
              onBack={handleBack}
            />
          )}

          {currentStep === 'review' && (
            <CreateAppStepReview
              metadataFormData={metadataFormData}
              selectedAbilities={selectedAbilities}
              delegateeAddresses={delegateeAddresses}
              onSubmit={handleFinalSubmit}
              onBack={handleBack}
            />
          )}
        </>
      )}
    </>
  );
}
