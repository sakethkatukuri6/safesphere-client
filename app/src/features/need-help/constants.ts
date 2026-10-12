/**
 * Need Help feature constants and copy.
 * Calm, plain sentence-case text without exclamation marks or emojis.
 */

// ASSUMPTION A1: Questionnaire questions mapped to cannot_speak and threat_nearby
export const QUESTIONNAIRE_QUESTIONS = {
  cannotSpeak: {
    title: 'Are you unable to speak safely?',
    yesLabel: 'Yes',
    noLabel: 'No',
  },
  threatNearby: {
    title: 'Is an immediate threat nearby?',
    yesLabel: 'Yes',
    noLabel: 'No',
  },
} as const;

export const NEED_HELP_COPY = {
  headerWordmark: 'SAFESPHERE',
  locationLive: 'Live location on',
  locationOff: 'Location off',
  idleBody: 'Tap the SOS button to alert emergency services and verified nearby responders.',
  confirmingHeader: 'Emergency countdown',
  confirmingBody: 'Alert sends automatically when the countdown ends.',
  immediateButton: 'I need help now',
  sentHeader: 'Alert sent',
  sentDescription: 'Your emergency signal has been received by dispatch orchestrator.',
  capsuleLabel: 'Capsule reference',
  errorHeader: 'Alert failed',
  offlineNotice: 'Device is offline. Network is required to transmit emergency capsule.',
  retryButton: 'Try again',
  resetButton: 'Return to idle',
} as const;
