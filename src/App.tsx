/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { StepStatus, TeachingPackage, RegulationReference, AppState } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StepHeaderBanner } from './components/StepHeaderBanner';
import { ActionBar } from './components/ActionBar';
import { FooterNav } from './components/FooterNav';

// Modals
import { FileModal } from './components/modals/FileModal';
import { ProgressMatrixModal } from './components/modals/ProgressMatrixModal';
import { TutorialModal } from './components/modals/TutorialModal';
import { RegulationsModal } from './components/modals/RegulationsModal';
import { PackageModal } from './components/modals/PackageModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { AuthModal } from './components/modals/AuthModal';
import { PaymentModal } from './components/modals/PaymentModal';

// Step Views
import { Step1Profile } from './components/steps/Step1Profile';
import { Step2Packages } from './components/steps/Step2Packages';
import { Step3Calendar } from './components/steps/Step3Calendar';
import { Step4Cp } from './components/steps/Step4Cp';
import { Step5Atp } from './components/steps/Step5Atp';
import { Step6Prota } from './components/steps/Step6Prota';
import { Step7Promes } from './components/steps/Step7Promes';
import { Step8Kktp } from './components/steps/Step8Kktp';
import { Step9ModulAjar } from './components/steps/Step9ModulAjar';
import { Step10Lkpd } from './components/steps/Step10Lkpd';
import { Step11Asesmen } from './components/steps/Step11Asesmen';
import { Step12KisiDanSoal } from './components/steps/Step12KisiDanSoal';
import { Step13AnalisisSoal } from './components/steps/Step13AnalisisSoal';

export default function App() {
  const store = useAppStore();

  // Load saved state from IndexedDB (localforage) on startup
  useEffect(() => {
    store.initializeStore();
  }, []);

  // Modals state
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isRegulationsModalOpen, setIsRegulationsModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleSelectStep = (stepNumber: number) => {
    store.setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeStepStatus = (newStatus: StepStatus) => {
    store.setStepStatus(store.currentStep, newStatus);
  };

  // Convert store to AppState object for components that need the entire snapshot
  const stateSnapshot: AppState = {
    currentStep: store.currentStep,
    activePackageId: store.activePackageId,
    packages: store.packages,
    profile: store.profile,
    calendar: store.calendar,
    cp: store.cp,
    atp: store.atp,
    prota: store.prota,
    promes: store.promes,
    kktp: store.kktp,
    modules: store.modules,
    activeModuleTp: store.activeModuleTp,
    lkpd: store.lkpd,
    assessmentPlans: store.assessmentPlans,
    step12: store.step12,
    analysis: store.analysis,
    stepStatuses: store.stepStatuses,
    regulations: store.regulations,
    lastSavedAt: store.lastSavedAt,
  };

  // Active module & LKPD
  const activeModule =
    store.modules[store.activeModuleTp] || Object.values(store.modules)[0];
  const activeLkpd =
    store.lkpd[store.activeModuleTp] || Object.values(store.lkpd)[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header Navbar */}
      <Header
        packages={store.packages}
        activePackageId={store.activePackageId}
        onSelectPackage={(id) => store.setActivePackage(id)}
        onOpenPackageModal={() => setIsPackageModalOpen(true)}
        onOpenFileModal={() => setIsFileModalOpen(true)}
        onOpenProgressModal={() => setIsProgressModalOpen(true)}
        onOpenTutorialModal={() => setIsTutorialModalOpen(true)}
        onOpenRegulationsModal={() => setIsRegulationsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        lastSavedAt={store.lastSavedAt}
      />

      {/* Main Container */}
      <main className="max-w-[1700px] w-full mx-auto p-3 md:p-5 flex-1">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Sidebar ("ALUR 13 LANGKAH") */}
          <Sidebar
            currentStep={store.currentStep}
            onSelectStep={handleSelectStep}
            stepStatuses={store.stepStatuses}
            onOpenProgressModal={() => setIsProgressModalOpen(true)}
          />

          {/* Center Main Workspace */}
          <div className="flex-1 w-full min-w-0">
            {/* Step Header Banner */}
            <StepHeaderBanner
              currentStep={store.currentStep}
              status={store.stepStatuses[store.currentStep] || 'Tersimpan'}
              onChangeStatus={handleChangeStepStatus}
            />

            {/* Action Bar (Unduh JSON, Upload JSON, Salin untuk Word, Unduh .doc) */}
            <ActionBar
              currentStep={store.currentStep}
              state={stateSnapshot}
              onOpenUploadModal={() => setIsFileModalOpen(true)}
            />

            {/* Step Workspace Content */}
            <div className="transition-all duration-150">
              {store.currentStep === 1 && (
                <Step1Profile
                  profile={store.profile}
                  onChange={(updated) => store.updateProfile(updated)}
                />
              )}

              {store.currentStep === 2 && (
                <Step2Packages
                  packages={store.packages}
                  activePackageId={store.activePackageId}
                  onSelectPackage={(id) => store.setActivePackage(id)}
                  onOpenPackageModal={() => setIsPackageModalOpen(true)}
                />
              )}

              {store.currentStep === 3 && (
                <Step3Calendar
                  calendar={store.calendar}
                  onChange={(updated) => store.updateCalendar(updated)}
                />
              )}

              {store.currentStep === 4 && (
                <Step4Cp
                  cp={store.cp}
                  onChange={(updated) => store.updateCp(updated)}
                  appState={stateSnapshot}
                />
              )}

              {store.currentStep === 5 && (
                <Step5Atp
                  atp={store.atp}
                  onChange={(updated) => store.updateAtp(updated)}
                  appState={stateSnapshot}
                />
              )}

              {store.currentStep === 6 && (
                <Step6Prota
                  prota={store.prota}
                  onChange={(updated) => store.updateProta(updated)}
                  appState={stateSnapshot}
                />
              )}

              {store.currentStep === 7 && (
                <Step7Promes
                  promes={store.promes}
                  onChange={(updated) => store.updatePromes(updated)}
                  appState={stateSnapshot}
                />
              )}

              {store.currentStep === 8 && (
                <Step8Kktp
                  kktp={store.kktp}
                  onChange={(updated) => store.updateKktp(updated)}
                  appState={stateSnapshot}
                />
              )}

              {store.currentStep === 9 && (
                <Step9ModulAjar
                  module={activeModule}
                  onChange={(updated) => store.updateModule(updated.tpCode, updated)}
                  appState={stateSnapshot}
                />
              )}

              {store.currentStep === 10 && (
                <Step10Lkpd
                  lkpd={activeLkpd}
                  onChange={(updated) => store.updateLkpd(updated.tpCode, updated)}
                  appState={stateSnapshot}
                />
              )}

              {store.currentStep === 11 && (
                <Step11Asesmen
                  plans={store.assessmentPlans}
                  onChange={(updated) => store.updateAssessmentPlans(updated)}
                  appState={stateSnapshot}
                />
              )}

              {store.currentStep === 12 && (
                <Step12KisiDanSoal
                  data={store.step12}
                  onChange={(updated) => store.updateStep12(updated)}
                  appState={stateSnapshot}
                />
              )}

              {store.currentStep === 13 && (
                <Step13AnalisisSoal
                  analysis={store.analysis}
                  onChange={(updated) => store.updateAnalysis(updated)}
                  appState={stateSnapshot}
                />
              )}
            </div>

            {/* Bottom Footer Navigation */}
            <FooterNav
              currentStep={store.currentStep}
              totalSteps={13}
              onSelectStep={handleSelectStep}
            />
          </div>
        </div>
      </main>

      {/* Global Modals */}
      <FileModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        state={stateSnapshot}
        onLoadState={(newState) => {
          store.loadState(newState);
        }}
      />

      <ProgressMatrixModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        state={stateSnapshot}
        onJumpToStep={handleSelectStep}
      />

      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />

      <RegulationsModal
        isOpen={isRegulationsModalOpen}
        onClose={() => setIsRegulationsModalOpen(false)}
        regulations={store.regulations}
        onToggleRegulation={(id) => store.toggleRegulation(id)}
        onAddRegulation={(reg) => store.addRegulation(reg)}
      />

      <PackageModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        packages={store.packages}
        activePackageId={store.activePackageId}
        onSelectPackage={(id) => store.setActivePackage(id)}
        onAddPackage={(pkg) => store.addPackage(pkg)}
        onClonePackage={(sourceId, name) => store.clonePackage(sourceId, name)}
        onDeletePackage={(id) => store.deletePackage(id)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {}}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
