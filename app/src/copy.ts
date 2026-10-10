/**
 * SafeSphere Copy Dictionary
 * Sentence case everywhere except wordmark and overlines.
 * Short, calm, plain, no exclamation marks.
 */

export const copy = {
  shell: {
    wordmark: 'SAFESPHERE',
    tabNeedHelp: 'Need Help',
    tabHelpNearby: 'Help Nearby',
    locationLive: 'Live location on',
    locationOff: 'Location off',
  },
  needHelp: {
    idleBody: 'Press and hold for 3 seconds to send an emergency alert.',
    survivalEngineOverline: 'SURVIVAL ENGINE',
    survivalModeTitle: 'Survival Mode',
    standardTheme: 'Standard',
    pitchBlackTheme: 'Pitch Black',
    batteryLabel: 'Battery',
    rowBattery: 'Battery',
    rowGpsInterval: 'GPS interval',
    rowEvidenceCapture: 'Evidence capture',
    batteryCriticalBanner: 'Battery critical. Throttling active.',
    confirmingSeconds: 'seconds',
    silentCheckInOverline: 'SILENT CHECK-IN',
    questionCannotSpeak: 'I cannot speak right now',
    questionThreatNearby: 'There is a threat near me',
    choiceYes: 'Yes',
    choiceNo: 'No',
    immediateAction: 'I need help now',
    sentTitle: 'Alert sent',
    referenceOverline: 'REFERENCE',
    sentBody: 'Responders and nearby volunteers have been notified.',
    errorTitle: 'Alert could not be sent',
    offlineTitle: 'Device is offline',
    offlineBody: 'Alert will send automatically when connection returns.',
  },
  helpNearby: {
    connectedToDispatch: 'Connected to dispatch',
    reconnectingToDispatch: 'Reconnecting to dispatch',
    connectingToDispatch: 'Connecting...',
    disconnectedFromDispatch: 'Disconnected',
    updatedJustNow: 'Updated just now',
    emptyTitle: 'No active incidents.',
    emptyBody: 'You will be alerted if someone nearby triggers an emergency.',
    capsuleOverline: 'CAPSULE',
    locationOverline: 'LOCATION',
    actionDecline: 'Decline',
    actionAccept: 'Accept',
    actionMarkArrived: 'Mark Arrived',
    arrivalLogged: 'Arrival logged',
  },
  survival: {
    batteryCaption: 'battery',
    rowGpsInterval: 'GPS interval',
    rowEvidenceCapture: 'Evidence capture',
    rowSensors: 'Sensors',
    sensorsValue: 'Crash detection active',
  },
} as const;
