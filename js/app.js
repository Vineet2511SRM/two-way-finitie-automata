/**
 * Two-Way Finite Automata (2FA) Simulator - Main Controller
 * Handles user interactions, smooth animation loops, tape layout, and HUD synchronization.
 */

import { TwoWayFA, DecisionStatus, REFERENCE_2FA } from './automaton.js';
import { SimulationEngine } from './simulation.js';
import { StateDiagram } from './diagram.js';
import { SoundFX } from './audio.js';
import { runAutomataTests } from './tests.js';

class AppController {
  constructor() {
    this.automaton = new TwoWayFA(REFERENCE_2FA);
    this.engine = new SimulationEngine(this.automaton);
    this.diagram = new StateDiagram('diagram-container');
    this.sound = new SoundFX();

    this.isPlaying = false;
    this.animTimer = null;
    this.speedMs = 600; // Default ms per step

    this._cacheDOM();
    this._bindEvents();

    // Initial load with default reference string 101001
    this.loadString('101001');
  }

  _cacheDOM() {
    // Inputs & Presets
    this.inputField = document.getElementById('tape-input');
    this.inputError = document.getElementById('input-error');
    this.errorText = document.getElementById('error-text');
    this.presetPills = document.querySelectorAll('.preset-pill');
    this.btnRandom = document.getElementById('btn-random-input');
    this.btnClear = document.getElementById('btn-clear-input');

    // Controls
    this.btnRun = document.getElementById('btn-run');
    this.runBtnText = document.getElementById('run-btn-text');
    this.runIconPlay = document.getElementById('run-icon-play');
    this.btnStepPrev = document.getElementById('btn-step-prev');
    this.btnStepNext = document.getElementById('btn-step-next');
    this.btnReset = document.getElementById('btn-reset');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnInstant = document.getElementById('btn-instant');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedDisplay = document.getElementById('speed-display');

    // Tape & Head
    this.tapeViewport = document.getElementById('tape-viewport');
    this.tapeTrack = document.getElementById('tape-track');
    this.readHeadPointer = document.getElementById('read-head-pointer');
    this.headBadge = document.getElementById('head-badge');
    this.headStateText = document.getElementById('head-state-text');
    this.headArrowText = document.getElementById('head-arrow-text');

    // Live HUD
    this.hudCurrentState = document.getElementById('hud-current-state');
    this.hudConfig = document.getElementById('hud-config');
    this.hudScannedSymbol = document.getElementById('hud-scanned-symbol');
    this.hudDirection = document.getElementById('hud-direction');
    this.hudStepCounter = document.getElementById('hud-step-counter');

    // Trace Table
    this.traceTableBody = document.getElementById('trace-table-body');
    this.traceContainer = document.getElementById('trace-table-container');
    this.traceCountBadge = document.getElementById('trace-step-count-badge');
    this.btnCopyTrace = document.getElementById('btn-copy-trace');

    // Decision Spotlight Banner
    this.decisionBanner = document.getElementById('decision-spotlight');
    this.decisionIcon = document.getElementById('decision-icon');
    this.decisionTitle = document.getElementById('decision-title');
    this.decisionDesc = document.getElementById('decision-desc');
    this.decisionTotalSteps = document.getElementById('decision-total-steps');
    this.decisionConfig = document.getElementById('decision-config');

    // Modals & Header Actions
    this.modalTests = document.getElementById('modal-tests');
    this.btnOpenTests = document.getElementById('btn-open-tests');
    this.btnCloseTests = document.getElementById('btn-close-tests');
    this.btnRunAllTests = document.getElementById('btn-run-all-tests');
    this.testsListContainer = document.getElementById('tests-list-container');
    this.testSummaryBadge = document.getElementById('test-summary-badge');

    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundLabel = document.getElementById('sound-label');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
  }

  _bindEvents() {
    // Input field change
    this.inputField.addEventListener('input', (e) => {
      this.loadString(e.target.value);
    });

    // Clear input
    this.btnClear.addEventListener('click', () => {
      this.inputField.value = '';
      this.loadString('');
      this.inputField.focus();
    });

    // Random input generator
    this.btnRandom.addEventListener('click', () => {
      const len = Math.floor(Math.random() * 5) + 4; // 4 to 8 length
      let str = '';
      for (let i = 0; i < len; i++) {
        str += Math.random() > 0.5 ? '1' : '0';
      }
      this.inputField.value = str;
      this.loadString(str);
    });

    // Presets
    this.presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.getAttribute('data-val');
        this.presetPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.inputField.value = val;
        this.loadString(val);
      });
    });

    // Simulation Controls
    this.btnRun.addEventListener('click', () => this.togglePlay());
    this.btnStepNext.addEventListener('click', () => this.stepForward());
    this.btnStepPrev.addEventListener('click', () => this.stepBackward());
    this.btnReset.addEventListener('click', () => this.resetSimulation());
    this.btnRestart.addEventListener('click', () => this.restartSimulation());
    this.btnInstant.addEventListener('click', () => this.runInstantly());

    // Speed Slider
    this.speedSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      // Invert: lower slider value = faster execution
      // Slider min 50, max 1800
      this.speedMs = 1850 - val;
      const multiplier = (800 / this.speedMs).toFixed(1);
      this.speedDisplay.textContent = `${multiplier}x`;
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    });

    // Copy Trace
    this.btnCopyTrace.addEventListener('click', () => this.copyTraceToClipboard());

    // Modals
    this.btnOpenTests.addEventListener('click', () => {
      this.modalTests.classList.add('open');
      this.executeAndRenderTests();
    });
    this.btnCloseTests.addEventListener('click', () => this.modalTests.classList.remove('open'));

    this.btnRunAllTests.addEventListener('click', () => this.executeAndRenderTests());

    // Audio Toggle
    this.btnToggleSound.addEventListener('click', () => {
      const enabled = this.sound.toggle();
      if (enabled) {
        this.btnToggleSound.classList.add('active');
        this.soundLabel.textContent = 'Audio On';
      } else {
        this.btnToggleSound.classList.remove('active');
        this.soundLabel.textContent = 'Muted';
      }
    });

    // Fullscreen
    this.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.stepBackward();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.resetSimulation();
      }
    });

    // Window resize -> reposition read head
    window.addEventListener('resize', () => {
      this.updateReadHeadPosition();
    });
  }

  /**
   * Load input string into engine and prepare UI
   */
  loadString(str) {
    this.pause();

    const res = this.engine.loadInput(str);
    if (!res.valid) {
      this.inputField.classList.add('input-invalid');
      this.inputError.classList.add('visible');
      this.errorText.textContent = res.error;
      this.btnRun.disabled = true;
      this.btnStepNext.disabled = true;
      this.btnInstant.disabled = true;
      this.tapeTrack.innerHTML = '';
      this.traceTableBody.innerHTML = '';
      this.hideDecision();
      return;
    }

    this.inputField.classList.remove('input-invalid');
    this.inputError.classList.remove('visible');
    this.btnRun.disabled = false;
    this.btnStepNext.disabled = false;
    this.btnInstant.disabled = false;

    // Match preset pill highlight if any
    this.presetPills.forEach(pill => {
      if (pill.getAttribute('data-val') === res.inputString) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    this.renderTape();
    this.renderTraceTable();
    this.resetSimulation();
  }

  /**
   * Render tape cells with boundary markers
   */
  renderTape() {
    const input = this.engine.inputString;
    let html = '';

    // Left Boundary Cell
    html += `
      <div id="cell-boundary-left" class="tape-cell boundary-cell" title="Left Boundary (index -1)">
        <span class="cell-index">⊣</span>
        <span class="cell-symbol">⊢</span>
        <span class="cell-visit-tag">START</span>
      </div>
    `;

    // Input Tape Cells
    for (let i = 0; i < input.length; i++) {
      html += `
        <div id="tape-cell-${i}" class="tape-cell" data-index="${i}">
          <span class="cell-index">[${i}]</span>
          <span class="cell-symbol">${input[i]}</span>
          <span id="visit-tag-${i}" class="cell-visit-tag">0x</span>
        </div>
      `;
    }

    // Right Boundary Cell (Halt cell)
    html += `
      <div id="cell-boundary-right" class="tape-cell boundary-cell" title="Right Boundary (index ${input.length})">
        <span class="cell-index">[${input.length}]</span>
        <span class="cell-symbol">⊣</span>
        <span class="cell-visit-tag">HALT</span>
      </div>
    `;

    this.tapeTrack.innerHTML = html;
  }

  /**
   * Populate execution trace table
   */
  renderTraceTable() {
    const steps = this.engine.steps;
    this.traceCountBadge.textContent = `${steps.length} Transitions`;
    let html = '';

    steps.forEach((step, idx) => {
      const dirTag = step.direction === 'L' 
        ? `<span class="trace-dir-tag dir-L">◀ L</span>` 
        : `<span class="trace-dir-tag dir-R">R ▶</span>`;

      html += `
        <tr id="trace-row-${idx}" data-step-index="${idx}">
          <td><strong>${step.stepNumber}</strong></td>
          <td>${step.fromConfig}</td>
          <td>'${step.scannedSymbol ?? ''}'</td>
          <td style="color: var(--accent-cyan);">${step.ruleText}</td>
          <td>${dirTag}</td>
          <td><strong>${step.toConfig}</strong></td>
        </tr>
      `;
    });

    this.traceTableBody.innerHTML = html;

    // Attach click listeners to trace rows for time-travel
    this.traceTableBody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const stepIdx = parseInt(row.getAttribute('data-step-index'), 10);
        this.pause();
        this.engine.jumpToStep(stepIdx);
        this.updateUI();
      });
    });
  }

  /**
   * Synchronize all UI elements to the current step of the simulation
   */
  updateUI() {
    const currentState = this.engine.getCurrentState();
    const currentStep = this.engine.getCurrentStep();
    const visitCounts = this.engine.getCellVisitCounts();
    const isFinished = this.engine.isFinished();

    // 1. Update HUD
    this.hudCurrentState.textContent = currentState.state;
    this.hudConfig.textContent = `(${currentState.state}, ${currentState.headPos})`;
    this.hudScannedSymbol.textContent = currentState.scannedSymbol !== null 
      ? `'${currentState.scannedSymbol}'` 
      : 'Boundary';

    const nextStep = this.engine.steps[this.engine.currentStepIndex + 1];
    if (nextStep && !isFinished) {
      if (nextStep.direction === 'L') {
        this.hudDirection.innerHTML = `<span class="dir-badge-left">⟵ LEFT (L)</span>`;
      } else {
        this.hudDirection.innerHTML = `<span class="dir-badge-right">RIGHT (R) ⟶</span>`;
      }
    } else {
      this.hudDirection.innerHTML = `<span style="color: var(--text-dim);">HALTED</span>`;
    }

    this.hudStepCounter.textContent = `${this.engine.currentStepIndex + 1} / ${this.engine.steps.length}`;

    // 2. Update Tape Cells & Visited badges
    const cells = this.tapeTrack.querySelectorAll('.tape-cell:not(.boundary-cell)');
    cells.forEach((cell, idx) => {
      cell.classList.remove('is-active-cell', 'revisited', 'was-visited');
      const count = visitCounts[idx] || 0;
      const tag = document.getElementById(`visit-tag-${idx}`);
      if (tag) tag.textContent = `${count}x`;

      if (count > 0) {
        cell.classList.add('was-visited');
      }
      if (count > 1) {
        cell.classList.add('revisited');
      }
    });

    // Boundary cells reset
    const leftBound = document.getElementById('cell-boundary-left');
    const rightBound = document.getElementById('cell-boundary-right');
    if (leftBound) leftBound.classList.remove('boundary-breached', 'is-active-cell');
    if (rightBound) rightBound.classList.remove('is-active-cell');

    // Highlight active cell
    if (currentState.headPos >= 0 && currentState.headPos < this.engine.inputString.length) {
      const activeCell = document.getElementById(`tape-cell-${currentState.headPos}`);
      if (activeCell) activeCell.classList.add('is-active-cell');
    } else if (currentState.headPos < 0) {
      if (leftBound) leftBound.classList.add('boundary-breached', 'is-active-cell');
    } else if (currentState.headPos >= this.engine.inputString.length) {
      if (rightBound) rightBound.classList.add('is-active-cell');
    }

    // 3. Reposition Read Head Pointer
    this.updateReadHeadPosition(currentState);

    // 4. Update State Diagram
    const fromState = currentStep ? currentStep.fromState : null;
    const scanned = currentStep ? currentStep.scannedSymbol : null;
    this.diagram.highlight(currentState.state, fromState, scanned);

    // 5. Update Transition Matrix Table & Function Cards Highlight
    document.querySelectorAll('.matrix-cell').forEach(c => c.classList.remove('cell-evaluating'));
    document.querySelectorAll('.func-card').forEach(c => c.classList.remove('func-active'));
    if (nextStep && !isFinished) {
      const cellId = `cell-${nextStep.fromState}-${nextStep.scannedSymbol}`;
      const funcId = `func-card-${nextStep.fromState}-${nextStep.scannedSymbol}`;
      const matrixCell = document.getElementById(cellId);
      const funcCard = document.getElementById(funcId);
      if (matrixCell) matrixCell.classList.add('cell-evaluating');
      if (funcCard) funcCard.classList.add('func-active');
    }

    // 6. Highlight Active Trace Row & Scroll
    document.querySelectorAll('.trace-table tr').forEach(r => r.classList.remove('active-trace-row'));
    if (this.engine.currentStepIndex >= 0) {
      const activeRow = document.getElementById(`trace-row-${this.engine.currentStepIndex}`);
      if (activeRow) {
        activeRow.classList.add('active-trace-row');
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // 7. Check if Finished -> Show Final Decision Banner
    if (isFinished) {
      this.pause();
      this.showDecision();
    } else {
      this.hideDecision();
    }

    // Button states
    this.btnStepPrev.disabled = this.engine.currentStepIndex < 0;
    this.btnStepNext.disabled = isFinished;
  }

  /**
   * Position physical read-head over active cell
   */
  updateReadHeadPosition(currentState) {
    if (!currentState) {
      currentState = this.engine.getCurrentState();
    }

    let targetElement = null;
    if (currentState.headPos < 0) {
      targetElement = document.getElementById('cell-boundary-left');
    } else if (currentState.headPos >= this.engine.inputString.length) {
      targetElement = document.getElementById('cell-boundary-right');
    } else {
      targetElement = document.getElementById(`tape-cell-${currentState.headPos}`);
    }

    if (targetElement && this.readHeadPointer) {
      // Calculate position relative to track
      const leftOffset = targetElement.offsetLeft + (targetElement.offsetWidth / 2) - (this.readHeadPointer.offsetWidth / 2);
      this.readHeadPointer.style.transform = `translateX(${leftOffset}px)`;

      // Update badge label
      this.headStateText.textContent = `HEAD [${currentState.state}]`;

      const lastStep = currentState.lastStep;
      if (lastStep && lastStep.direction === 'L') {
        this.headBadge.classList.add('head-left');
        this.headArrowText.textContent = '◀ L';
      } else {
        this.headBadge.classList.remove('head-left');
        this.headArrowText.textContent = 'R ▶';
      }

      // Smooth scroll viewport to keep cell in view
      const viewportWidth = this.tapeViewport.offsetWidth;
      const scrollTarget = leftOffset - (viewportWidth / 2) + (this.readHeadPointer.offsetWidth / 2);
      this.tapeViewport.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth'
      });
    }
  }

  /**
   * Step Forward
   */
  stepForward() {
    if (this.engine.isFinished()) return;
    const step = this.engine.stepForward();
    if (step) {
      this.sound.playStep(step.direction);
    }
    this.updateUI();
  }

  /**
   * Step Backward (Rewind)
   */
  stepBackward() {
    this.pause();
    this.engine.stepBackward();
    this.updateUI();
  }

  /**
   * Reset simulation to beginning
   */
  resetSimulation() {
    this.pause();
    this.engine.reset();
    this.updateUI();
  }

  /**
   * Restart animation from beginning
   */
  restartSimulation() {
    this.resetSimulation();
    this.play();
  }

  /**
   * Jump instantly to final result
   */
  runInstantly() {
    this.pause();
    this.engine.jumpToEnd();
    this.updateUI();
  }

  /**
   * Toggle Play / Pause
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.engine.isFinished()) {
        this.engine.reset();
      }
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    this.btnRun.classList.add('btn-running');
    this.runBtnText.textContent = 'Pause';
    this.runIconPlay.innerHTML = `
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    `;

    this._animationLoop();
  }

  pause() {
    this.isPlaying = false;
    clearTimeout(this.animTimer);
    this.btnRun.classList.remove('btn-running');
    this.runBtnText.textContent = 'Run Animation';
    this.runIconPlay.innerHTML = `
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    `;
  }

  _animationLoop() {
    if (!this.isPlaying) return;

    if (this.engine.isFinished()) {
      this.pause();
      return;
    }

    this.stepForward();

    if (!this.engine.isFinished() && this.isPlaying) {
      this.animTimer = setTimeout(() => {
        this._animationLoop();
      }, this.speedMs);
    }
  }

  /**
   * Display presentation final decision banner
   */
  showDecision() {
    const decision = this.engine.finalDecision;
    const reason = this.engine.terminationReason;
    const totalSteps = this.engine.steps.length;
    const lastStep = this.engine.steps[this.engine.steps.length - 1];

    this.decisionBanner.className = 'decision-spotlight visible';
    this.decisionTotalSteps.textContent = `${totalSteps} Steps Executed`;
    this.decisionConfig.textContent = `Halted At: ${lastStep?.toConfig ?? 'End'}`;

    if (decision === DecisionStatus.ACCEPTED) {
      this.decisionBanner.classList.add('decision-accepted');
      this.decisionTitle.textContent = 'STRING ACCEPTED ✓';
      this.decisionDesc.textContent = reason;
      this.decisionIcon.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      this.sound.playAccept();
    } else if (decision === DecisionStatus.REJECTED) {
      this.decisionBanner.classList.add('decision-rejected');
      this.decisionTitle.textContent = 'STRING REJECTED ✗';
      this.decisionDesc.textContent = reason;
      this.decisionIcon.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      this.sound.playReject();
    } else if (decision === DecisionStatus.CYCLE_DETECTED) {
      this.decisionBanner.classList.add('decision-loop');
      this.decisionTitle.textContent = 'INFINITE LOOP DETECTED ⟳';
      this.decisionDesc.textContent = reason;
      this.decisionIcon.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
      `;
      this.sound.playReject();
    } else {
      this.decisionBanner.classList.add('decision-loop');
      this.decisionTitle.textContent = 'EXECUTION LIMIT REACHED ⚠';
      this.decisionDesc.textContent = reason;
      this.decisionIcon.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    }
  }

  hideDecision() {
    this.decisionBanner.className = 'decision-spotlight';
  }

  /**
   * Run automated tests and render in modal
   */
  executeAndRenderTests() {
    const report = runAutomataTests();
    this.testSummaryBadge.textContent = `${report.totalPassed} / ${report.totalTests} Tests Passing`;
    this.testSummaryBadge.style.color = report.allPassed ? 'var(--accent-emerald)' : 'var(--accent-rose)';

    let html = '';
    report.results.forEach((test, idx) => {
      const statusIcon = test.passed ? '✓ PASS' : '✗ FAIL';
      const statusClass = test.passed ? 'pass' : 'fail';
      const statusColor = test.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)';

      html += `
        <div class="test-item-card ${statusClass}">
          <div>
            <strong style="color: #fff; font-size: 0.9rem;">#${idx + 1}: ${test.name}</strong>
            <p style="font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono); margin-top: 2px;">
              ${test.details}
            </p>
          </div>
          <span style="font-family: var(--font-mono); font-weight: 800; font-size: 0.8rem; color: ${statusColor};">
            ${statusIcon}
          </span>
        </div>
      `;
    });

    this.testsListContainer.innerHTML = html;
  }

  /**
   * Copy Trace table formatted string
   */
  copyTraceToClipboard() {
    const lines = [
      `2FA Execution Trace for input: "${this.engine.inputString}"`,
      `============================================================`,
      `Step | Config (q, i) | Scanned | Applied Rule | Move | Resulting Config`,
      `------------------------------------------------------------`
    ];

    this.engine.steps.forEach(s => {
      lines.push(`${s.stepNumber.toString().padStart(4)} | ${s.fromConfig.padEnd(13)} | '${s.scannedSymbol}'       | ${s.ruleText.padEnd(12)} | ${s.direction}    | ${s.toConfig}`);
    });

    lines.push(`============================================================`);
    lines.push(`Decision: ${this.engine.finalDecision}`);
    lines.push(`Reason: ${this.engine.terminationReason}`);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      const origText = this.btnCopyTrace.textContent;
      this.btnCopyTrace.textContent = '✓ Copied!';
      setTimeout(() => {
        this.btnCopyTrace.textContent = origText;
      }, 1800);
    }).catch(() => {
      alert('Trace copied to clipboard!');
    });
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
