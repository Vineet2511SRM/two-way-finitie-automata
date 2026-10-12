/**
 * Two-Way Finite Automata (2FA) - Formal Model & Transition Engine
 * 
 * Formal Definition 1 (Textbook 8-Tuple with Delimiters & Halting States):
 * M = (Q, Σ, ⊢, ⊣, δ, q_start, q_accept, q_reject)
 * - Q: Finite set of states {q0, q1, q2}
 * - Σ: Input alphabet {0, 1}
 * - ⊢: Left delimiter / endmarker (head cannot move left off ⊢)
 * - ⊣: Right delimiter / endmarker (marks tape cell n+1)
 * - δ: (Q \ {q_accept, q_reject}) × (Σ ∪ {⊢, ⊣}) → Q × {L, R}
 * - q_start: Start state (q0)
 * - q_accept: Halting accept state (q1)
 * - q_reject: Halting reject state
 * 
 * Formal Definition 2 (Compact 5-Tuple / Shepherdson 1959 Model):
 * M = (Q, Σ, δ, q0, F)
 * - Boundary Convention (Simulated Engine):
 *   - Read-only input tape w = w[0]...w[n-1]
 *   - Initial head position: index 0 (first symbol)
 *   - Right Boundary (⊣): Head moves past index n-1 to index n -> Halts.
 *     If halting state in F (q1) => ACCEPTED. Else => REJECTED.
 *   - Left Boundary (⊢): Head attempts to move past index 0 to index -1 -> Halts.
 *     Breaching the left boundary represents tape fall-off => REJECTED.
 *   - Cycle Detection: If configuration (q, i) repeats, deterministic 2FA
 *     will loop infinitely => LOOP DETECTED (Halts / Rejection).
 */

export const REFERENCE_2FA = {
  id: 'reference_2fa',
  name: 'Standard Academic Reference 2FA',
  states: ['q0', 'q1', 'q2'],
  alphabet: ['0', '1'],
  initialState: 'q0',
  finalStates: ['q1'],
  transitions: {
    'q0': {
      '0': { nextState: 'q0', direction: 'R', label: '0 → q0, R' },
      '1': { nextState: 'q1', direction: 'R', label: '1 → q1, R' }
    },
    'q1': {
      '0': { nextState: 'q1', direction: 'R', label: '0 → q1, R' },
      '1': { nextState: 'q2', direction: 'L', label: '1 → q2, L' }
    },
    'q2': {
      '0': { nextState: 'q0', direction: 'R', label: '0 → q0, R' },
      '1': { nextState: 'q1', direction: 'L', label: '1 → q1, L' }
    }
  },
  descriptions: {
    'q0': 'Initial state. Stays in q0 on 0; transitions right to q1 on 1.',
    'q1': 'Accepting / Final state. Stays in q1 on 0; transitions left to q2 on 1.',
    'q2': 'Reversal / Intermediate state. Re-evaluates previous symbols. Moves right to q0 on 0, left to q1 on 1.'
  }
};

export const DecisionStatus = {
  RUNNING: 'RUNNING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CYCLE_DETECTED: 'LOOP_DETECTED',
  LIMIT_REACHED: 'LIMIT_REACHED',
  INVALID_INPUT: 'INVALID_INPUT'
};

export class TwoWayFA {
  constructor(spec = REFERENCE_2FA) {
    this.spec = spec;
  }

  /**
   * Validate input string against alphabet Σ = {0, 1}
   * @param {string} input 
   * @returns {{ valid: boolean, error?: string }}
   */
  validateInput(input) {
    if (typeof input !== 'string') {
      return { valid: false, error: 'Input must be a valid string.' };
    }
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Input tape cannot be empty. Please enter at least 1 binary digit (0 or 1).' };
    }
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (!this.spec.alphabet.includes(char)) {
        return { 
          valid: false, 
          error: `Invalid character '${char}' at position ${i + 1}. Only binary symbols Σ = {${this.spec.alphabet.join(', ')}} are allowed.` 
        };
      }
    }
    return { valid: true, sanitized: trimmed };
  }

  /**
   * Get transition rule for current state and symbol
   * @param {string} state 
   * @param {string} symbol 
   * @returns {{ nextState: string, direction: 'L'|'R', label: string } | null}
   */
  getTransition(state, symbol) {
    if (!this.spec.transitions[state]) return null;
    return this.spec.transitions[state][symbol] || null;
  }

  /**
   * Check if a given state is in the final state set F
   * @param {string} state 
   * @returns {boolean}
   */
  isFinalState(state) {
    return this.spec.finalStates.includes(state);
  }

  /**
   * Compute a single transition step from configuration (q, i)
   * @param {string} state Current state
   * @param {number} headPos Current head index (0-based)
   * @param {string} inputString The full input tape
   * @returns {object} Step result metadata
   */
  computeStep(state, headPos, inputString) {
    const n = inputString.length;

    // Check if head is out of bounds already
    if (headPos >= n) {
      const isAccepted = this.isFinalState(state);
      return {
        halted: true,
        decision: isAccepted ? DecisionStatus.ACCEPTED : DecisionStatus.REJECTED,
        reason: isAccepted 
          ? `Head moved past right boundary (index ${n}) in final state '${state}'. String is ACCEPTED.` 
          : `Head moved past right boundary (index ${n}) in non-accepting state '${state}'. String is REJECTED.`,
        fromState: state,
        fromPos: headPos,
        toState: state,
        toPos: headPos,
        symbol: null,
        direction: null
      };
    }

    if (headPos < 0) {
      return {
        halted: true,
        decision: DecisionStatus.REJECTED,
        reason: `Head attempted to move left beyond tape boundary (index < 0). Left-boundary breach halts and REJECTS.`,
        fromState: state,
        fromPos: headPos,
        toState: state,
        toPos: headPos,
        symbol: null,
        direction: null
      };
    }

    const symbol = inputString[headPos];
    const transition = this.getTransition(state, symbol);

    if (!transition) {
      return {
        halted: true,
        decision: DecisionStatus.REJECTED,
        reason: `No transition defined for state '${state}' with input '${symbol}'. Automaton halts and REJECTS.`,
        fromState: state,
        fromPos: headPos,
        toState: state,
        toPos: headPos,
        symbol,
        direction: null
      };
    }

    const nextState = transition.nextState;
    const direction = transition.direction;
    const nextPos = direction === 'R' ? headPos + 1 : headPos - 1;

    let halted = false;
    let decision = DecisionStatus.RUNNING;
    let reason = `Applied δ(${state}, ${symbol}) → (${nextState}, ${direction}).`;

    // Check boundary outcome immediately after move
    if (nextPos >= n) {
      halted = true;
      const isAccepted = this.isFinalState(nextState);
      decision = isAccepted ? DecisionStatus.ACCEPTED : DecisionStatus.REJECTED;
      reason += isAccepted 
        ? ` Head moved past right boundary (index ${n}) into final state '${nextState}'. ACCEPTED.`
        : ` Head moved past right boundary (index ${n}) into non-accepting state '${nextState}'. REJECTED.`;
    } else if (nextPos < 0) {
      halted = true;
      decision = DecisionStatus.REJECTED;
      reason += ` Head attempted to move left past index 0 (off-tape boundary fall-off). REJECTED.`;
    }

    return {
      halted,
      decision,
      reason,
      fromState: state,
      fromPos: headPos,
      toState: nextState,
      toPos: nextPos,
      symbol,
      direction,
      ruleText: `δ(${state}, ${symbol}) = (${nextState}, ${direction})`
    };
  }
}
