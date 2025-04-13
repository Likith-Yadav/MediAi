import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface GuidedTourProps {
  forceStart?: boolean;
}

const steps: Step[] = [
  {
    target: '.logo-container',
    content: 'Welcome to MediAI! This is your dashboard. Let me show you around.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.user-profile-section',
    content: 'Here you can view and manage your profile information.',
    placement: 'right',
  },
  {
    target: '.recent-consultations',
    content: 'Your recent medical consultations are listed here. Click on any to view details.',
    placement: 'right',
  },
  {
    target: '.chat-interface',
    content: 'This is where you can chat with MediAI. Describe your symptoms, and our AI will help analyze them.',
    placement: 'left',
  },
  {
    target: '.user-menu',
    content: 'Access your profile, medical history, and settings from here.',
    placement: 'bottom',
  },
];

export default function GuidedTour({ forceStart = false }: GuidedTourProps) {
  const [run, setRun] = useState(false);
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if ((!hasSeenTour && currentUser) || forceStart) {
      setRun(true);
    }
  }, [currentUser, forceStart]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (!forceStart) {
        localStorage.setItem('hasSeenTour', 'true');
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      styles={{
        options: {
          primaryColor: '#6366f1',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        tooltip: {
          borderRadius: 8,
          padding: 16,
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: 6,
        },
        buttonBack: {
          color: '#6366f1',
          marginRight: 8,
        },
        buttonSkip: {
          color: '#6b7280',
        },
      }}
      locale={{
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
        back: 'Back',
      }}
      callback={handleJoyrideCallback}
    />
  );
} 