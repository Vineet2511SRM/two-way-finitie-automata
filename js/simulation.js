/**
 * 2FA Simulation Engine & Trace Controller
 * 
 * Manages:
 * - Pre-computed execution traces
 * - Live step-by-step state tracking
 * - Step-forward and Step-backward (Time-travel)
 * - Pigeonhole Principle infinite loop detection
 * - Visited cell heatmaps and metrics
 */

import { TwoWayFA, DecisionStatus, REFERENCE_2FA } from './automaton.js';

export class SimulationEngine {
  constructor(automaton = new TwoWayFA()) {
    this.automaton = automaton;
    this.inputString = '';
    this.steps = [];             // Complete generated trace of transition steps
    this.currentStepIndex = -1;  // Index in this.steps (-1 means initial state before step 0)
    this.finalDecision = null;
    this.terminationReason = '';
    this.maxSafetySteps = 1000;  // Safety limit
    this.loopDetectedAt = null;  // Configuration loop info if any
  }

  /**
   * Load input string and precompute full deterministic trace
   * @param {string} input 
   * @returns {{ valid: boolean, error?: string, totalSteps?: number, decision?: string }}
   */
  loadInput(input) {
    const val = this.automaton.validateInput(input);
    if (!val.valid) {
      return { valid: false, error: val.error };
    }

    this.inputString = val.sanitized;
    this.steps = [];
    this.currentStepIndex = -1;
    this.finalDecision = null;
    this.terminationReason = '';
    this.loopDetectedAt = null;

    this._computeFullTrace();

    return {
      valid: true,
      inputString: this.inputString,
      totalSteps: this.steps.length,
      decision: this.finalDecision,
      reason: this.terminationReason
    };
  }

  /**
   * Compute the full simulation trace from (q0, 0) until halt or loop
   */
  _computeFullTrace() {
    let currentState = this.automaton.spec.initialState;
    let currentPos = 0;
    const n = this.inputString.length;

    // Set of seen configurations to detect infinite loops: key = `${state},${pos}`
    const seenConfigs = new Map(); // key -> step index where first seen

    let stepNumber = 0;

    while (stepNumber < this.maxSafetySteps) {
      const configKey = `${currentState},${currentPos}`;

      // Check for infinite loop (Pigeonhole principle for 2DFAs)
      if (seenConfigs.has(configKey)) {
        const firstSeenStep = seenConfigs.get(configKey);
        this.finalDecision = DecisionStatus.CYCLE_DETECTED;
        this.loopDetectedAt = {
          config: `(${currentState}, ${currentPos})`,
          state: currentState,
          pos: currentPos,
          firstSeenStep: firstSeenStep,
          currentStep: stepNumber
        };
        this.terminationReason = `Infinite Loop Detected: Configuration (${currentState}, ${currentPos}) repeated from step ${firstSeenStep}. In a deterministic 2FA, this computation will loop indefinitely without halting.`;
        break;
      }

      seenConfigs.set(configKey, stepNumber);

      const stepResult = this.automaton.computeStep(currentState, currentPos, this.inputString);

      const record = {
        stepNumber: stepNumber + 1,
        fromConfig: `(${currentState}, ${currentPos})`,
        fromState: currentState,
        fromPos: currentPos,
        scannedSymbol: stepResult.symbol,
        ruleText: stepResult.ruleText || 'None',
        direction: stepResult.direction,
        toState: stepResult.toState,
        toPos: stepResult.toPos,
        toConfig: `(${stepResult.toState}, ${stepResult.toPos})`,
        halted: stepResult.halted,
        decision: stepResult.decision,
        reason: stepResult.reason
      };

      this.steps.push(record);

      if (stepResult.halted) {
        this.finalDecision = stepResult.decision;
        this.terminationReason = stepResult.reason;
        break;
      }

      currentState = stepResult.toState;
      currentPos = stepResult.toPos;
      stepNumber++;
    }

    if (stepNumber >= this.maxSafetySteps && !this.finalDecision) {
      this.finalDecision = DecisionStatus.LIMIT_REACHED;
      this.terminationReason = `Execution safety limit of ${this.maxSafetySteps} steps reached. Halting to prevent browser lockup.`;
    }
  }

  /**
   * Reset simulation to beginning
   */
  reset() {
    this.currentStepIndex = -1;
  }

  /**
   * Check if simulation has reached end
   */
  isFinished() {
    return this.currentStepIndex >= this.steps.length - 1;
  }

  /**
   * Advance one step
   * @returns {object|null} The executed step record or null if already at end
   */
  stepForward() {
    if (this.isFinished()) return null;
    this.currentStepIndex++;
    return this.getCurrentStep();
  }

  /**
   * Step backward one step (Time-travel)
   * @returns {object|null} The current step after rewinding
   */
  stepBackward() {
    if (this.currentStepIndex < 0) return null;
    this.currentStepIndex--;
    return this.getCurrentStep();
  }

  /**
   * Jump to end instantly
   */
  jumpToEnd() {
    this.currentStepIndex = this.steps.length - 1;
    return this.getCurrentStep();
  }

  /**
   * Jump to a specific step index
   * @param {number} index 
   */
  jumpToStep(index) {
    if (index >= -1 && index < this.steps.length) {
      this.currentStepIndex = index;
      return this.getCurrentStep();
    }
    return null;
  }

  /**
   * Get current state & head position at this moment
   */
  getCurrentState() {
    if (this.currentStepIndex === -1) {
      return {
        state: this.automaton.spec.initialState,
        headPos: 0,
        stepNumber: 0,
        isInitial: true,
        isFinished: false,
        lastStep: null,
        scannedSymbol: this.inputString ? this.inputString[0] : null
      };
    }

    const currentStep = this.steps[this.currentStepIndex];
    const isFinished = this.currentStepIndex === this.steps.length - 1;

    return {
      state: currentStep.toState,
      headPos: currentStep.toPos,
      stepNumber: currentStep.stepNumber,
      isInitial: false,
      isFinished: isFinished,
      lastStep: currentStep,
      scannedSymbol: (currentStep.toPos >= 0 && currentStep.toPos < this.inputString.length)
        ? this.inputString[currentStep.toPos]
        : null
    };
  }

  getCurrentStep() {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  /**
   * Calculate visit counts for each cell up to the current step
   * @returns {number[]} Array of visit counts per cell index
   */
  getCellVisitCounts() {
    const counts = new Array(this.inputString.length).fill(0);
    if (!this.inputString) return counts;

    // Step 0 starts with head on index 0
    counts[0] = 1;

    for (let i = 0; i <= this.currentStepIndex; i++) {
      const step = this.steps[i];
      if (step.toPos >= 0 && step.toPos < this.inputString.length) {
        counts[step.toPos]++;
      }
    }
    return counts;
  }
}
