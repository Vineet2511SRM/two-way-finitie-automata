/**
 * Automated Verification Test Suite for Two-Way Finite Automata
 * 
 * Validates:
 * 1. Reference input 101001 (Step count, leftward moves, revisiting, ACCEPT)
 * 2. Leftward transitions & symbol revisiting verification
 * 3. Right boundary acceptance & rejection
 * 4. Left boundary breach rejection
 * 5. Input validation (Empty, non-binary)
 * 6. Mathematical configuration accuracy
 */

import { TwoWayFA, DecisionStatus, REFERENCE_2FA } from './automaton.js';
import { SimulationEngine } from './simulation.js';

export function runAutomataTests() {
  const results = [];
  const engine = new SimulationEngine();

  function assert(name, condition, details = '') {
    results.push({
      name,
      passed: Boolean(condition),
      details
    });
  }

  // TEST 1: Reference Input 101001
  const refRes = engine.loadInput('101001');
  assert(
    'Reference Input 101001 loads successfully',
    refRes.valid === true,
    `Valid: ${refRes.valid}`
  );
  assert(
    'Reference Input 101001 is ACCEPTED',
    refRes.decision === DecisionStatus.ACCEPTED,
    `Final Decision: ${refRes.decision} (Expected: ${DecisionStatus.ACCEPTED})`
  );
  assert(
    'Reference Input 101001 terminates in state q1',
    engine.steps[engine.steps.length - 1]?.toState === 'q1',
    `Halting state: ${engine.steps[engine.steps.length - 1]?.toState}`
  );
  assert(
    'Reference Input 101001 halts past right boundary (index 6)',
    engine.steps[engine.steps.length - 1]?.toPos === 6,
    `Halting head position: ${engine.steps[engine.steps.length - 1]?.toPos}`
  );
  assert(
    'Reference Input 101001 executes exactly 10 transitions',
    engine.steps.length === 10,
    `Total steps: ${engine.steps.length} (Expected: 10)`
  );

  // Check leftward transitions in 101001
  const leftTransitions = engine.steps.filter(s => s.direction === 'L');
  assert(
    'Reference Input 101001 exhibits at least one leftward transition',
    leftTransitions.length >= 2,
    `Found ${leftTransitions.length} leftward moves at steps ${leftTransitions.map(s => s.stepNumber).join(', ')}`
  );

  // Check cell revisitation in 101001
  engine.jumpToEnd();
  const visitCounts = engine.getCellVisitCounts();
  const revisitedCells = visitCounts.filter(count => count > 1);
  assert(
    'Reference Input 101001 revisits previously scanned tape cells',
    revisitedCells.length >= 2,
    `Revisited cell counts: ${JSON.stringify(visitCounts)}`
  );

  // TEST 2: Rejection on all zeros (0000)
  const zeroRes = engine.loadInput('0000');
  assert(
    'Input "0000" is REJECTED (halts in non-accepting state q0)',
    zeroRes.decision === DecisionStatus.REJECTED && engine.steps[engine.steps.length - 1]?.toState === 'q0',
    `Decision: ${zeroRes.decision}, Halting state: ${engine.steps[engine.steps.length - 1]?.toState}`
  );

  // TEST 3: Left boundary breach rejection (110010)
  const leftBreachRes = engine.loadInput('110010');
  assert(
    'Input "110010" triggers Left-Boundary breach and REJECTS',
    leftBreachRes.decision === DecisionStatus.REJECTED && leftBreachRes.reason.includes('left past index 0'),
    `Reason: ${leftBreachRes.reason}`
  );

  // TEST 4: Simple accepting string without left reversal (100)
  const simpleAccRes = engine.loadInput('100');
  assert(
    'Input "100" is ACCEPTED (reaches q1 at right boundary)',
    simpleAccRes.decision === DecisionStatus.ACCEPTED && engine.steps.every(s => s.direction === 'R'),
    `Decision: ${simpleAccRes.decision}, Steps: ${engine.steps.length}`
  );

  // TEST 5: Input validation - Empty string
  const emptyRes = engine.loadInput('');
  assert(
    'Empty input is rejected with clear error message',
    emptyRes.valid === false && emptyRes.error.includes('empty'),
    `Error: ${emptyRes.error}`
  );

  // TEST 6: Input validation - Invalid symbols
  const invalidCharRes = engine.loadInput('10a01');
  assert(
    'Non-binary characters (10a01) are rejected with error',
    invalidCharRes.valid === false && invalidCharRes.error.includes('Invalid character'),
    `Error: ${invalidCharRes.error}`
  );

  // TEST 7: Configuration Mathematical Correctness for 101001
  engine.loadInput('101001');
  // Step 1: (q0, 0) with '1' -> (q1, 1)
  const step1 = engine.steps[0];
  const step1Correct = step1.fromConfig === '(q0, 0)' && step1.scannedSymbol === '1' && step1.toConfig === '(q1, 1)';
  assert(
    'Mathematical Configuration for Step 1 is correct: (q0, 0) ⊢ (q1, 1)',
    step1Correct,
    `${step1.fromConfig} --[1, R]--> ${step1.toConfig}`
  );

  // Step 3: (q1, 2) with '1' -> (q2, 1) [Left move!]
  const step3 = engine.steps[2];
  const step3Correct = step3.fromConfig === '(q1, 2)' && step3.scannedSymbol === '1' && step3.toConfig === '(q2, 1)' && step3.direction === 'L';
  assert(
    'Step 3 correctly records leftward reversal: (q1, 2) ⊢ (q2, 1)',
    step3Correct,
    `${step3.fromConfig} --[1, L]--> ${step3.toConfig}`
  );

  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.length - totalPassed;

  return {
    allPassed: totalFailed === 0,
    totalTests: results.length,
    totalPassed,
    totalFailed,
    results
  };
}
