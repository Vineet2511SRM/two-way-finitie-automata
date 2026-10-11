/**
 * Interactive SVG State Transition Diagram for 2FA (Light Theme Edition)
 * 
 * Renders:
 * - States q0 (initial with start arrow), q1 (double circle final), q2 (intermediate reversal)
 * - Directional curved transition edges with labeled pill badges
 * - Active state pulsing glow in vibrant color palette
 * - Active transition traveling edge highlight
 */

export class StateDiagram {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activeState = null;
    this.activeTransition = null;
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <svg viewBox="0 0 700 320" class="state-diagram-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Soft ambient glow filters -->
          <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#4f46e5" flood-opacity="0.3" />
          </filter>
          <filter id="soft-glow-final" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#10b981" flood-opacity="0.35" />
          </filter>
          <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.08" />
          </filter>

          <!-- Marker arrows -->
          <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#4f46e5" />
          </marker>
          <marker id="arrow-start" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
          </marker>
        </defs>

        <!-- Subtle background grid pattern -->
        <g class="diagram-grid" opacity="0.6">
          <line x1="0" y1="80" x2="700" y2="80" stroke="#e2e8f0" stroke-dasharray="4,4" />
          <line x1="0" y1="160" x2="700" y2="160" stroke="#e2e8f0" stroke-dasharray="4,4" />
          <line x1="0" y1="240" x2="700" y2="240" stroke="#e2e8f0" stroke-dasharray="4,4" />
        </g>

        <!-- START INCOMING ARROW -->
        <g class="start-indicator">
          <line x1="60" y1="180" x2="115" y2="180" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arrow-start)" />
          <text x="85" y="168" fill="#0284c7" font-size="12" font-family="'Fira Code', monospace" font-weight="700" text-anchor="middle">START</text>
        </g>

        <!-- ================= TRANSITION EDGES ================= -->

        <!-- 1. q0 -> q0 on '0' (Self loop bottom-left) -->
        <g id="edge-q0-0-q0" class="diagram-edge" data-from="q0" data-symbol="0" data-to="q0">
          <path d="M 135,215 C 100,280 200,280 165,215" fill="none" stroke="#64748b" stroke-width="2.5" marker-end="url(#arrow)" />
          <rect x="130" y="270" width="60" height="22" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" />
          <text x="160" y="285" fill="#334155" font-size="11" font-family="'Fira Code', monospace" font-weight="600" text-anchor="middle">0 → R</text>
        </g>

        <!-- 2. q0 -> q1 on '1' (Arc from q0 to q1) -->
        <g id="edge-q0-1-q1" class="diagram-edge" data-from="q0" data-symbol="1" data-to="q1">
          <path d="M 175,155 C 210,120 260,105 310,102" fill="none" stroke="#64748b" stroke-width="2.5" marker-end="url(#arrow)" />
          <rect x="215" y="105" width="60" height="22" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" />
          <text x="245" y="120" fill="#334155" font-size="11" font-family="'Fira Code', monospace" font-weight="600" text-anchor="middle">1 → R</text>
        </g>

        <!-- 3. q1 -> q1 on '0' (Self loop top) -->
        <g id="edge-q1-0-q1" class="diagram-edge" data-from="q1" data-symbol="0" data-to="q1">
          <path d="M 335,65 C 310,10 390,10 365,65" fill="none" stroke="#64748b" stroke-width="2.5" marker-end="url(#arrow)" />
          <rect x="320" y="8" width="60" height="22" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" />
          <text x="350" y="23" fill="#334155" font-size="11" font-family="'Fira Code', monospace" font-weight="600" text-anchor="middle">0 → R</text>
        </g>

        <!-- 4. q1 -> q2 on '1' (Arc from q1 to q2) -->
        <g id="edge-q1-1-q2" class="diagram-edge" data-from="q1" data-symbol="1" data-to="q2">
          <path d="M 388,110 C 435,120 480,140 515,160" fill="none" stroke="#64748b" stroke-width="2.5" marker-end="url(#arrow)" />
          <rect x="425" y="112" width="60" height="22" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" />
          <text x="455" y="127" fill="#334155" font-size="11" font-family="'Fira Code', monospace" font-weight="600" text-anchor="middle">1 → L</text>
        </g>

        <!-- 5. q2 -> q1 on '1' (Reverse arc from q2 to q1) -->
        <g id="edge-q2-1-q1" class="diagram-edge" data-from="q2" data-symbol="1" data-to="q1">
          <path d="M 525,150 C 475,90 425,75 385,85" fill="none" stroke="#64748b" stroke-width="2.5" marker-end="url(#arrow)" />
          <rect x="445" y="65" width="60" height="22" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" />
          <text x="475" y="80" fill="#334155" font-size="11" font-family="'Fira Code', monospace" font-weight="600" text-anchor="middle">1 → L</text>
        </g>

        <!-- 6. q2 -> q0 on '0' (Wide bottom return arc) -->
        <g id="edge-q2-0-q0" class="diagram-edge" data-from="q2" data-symbol="0" data-to="q0">
          <path d="M 530,215 C 460,285 240,285 170,215" fill="none" stroke="#64748b" stroke-width="2.5" marker-end="url(#arrow)" />
          <rect x="320" y="270" width="60" height="22" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" />
          <text x="350" y="285" fill="#334155" font-size="11" font-family="'Fira Code', monospace" font-weight="600" text-anchor="middle">0 → R</text>
        </g>

        <!-- ================= STATE NODES ================= -->

        <!-- Node q0 (Initial State) -->
        <g id="node-q0" class="diagram-node" transform="translate(150, 180)" cursor="pointer" filter="url(#node-shadow)">
          <circle class="node-halo" r="42" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.35" />
          <circle class="node-bg" r="35" fill="#ffffff" stroke="#0284c7" stroke-width="3" />
          <text class="node-text" y="6" fill="#0f172a" font-size="18" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">q0</text>
          <text class="node-sub" y="22" fill="#0284c7" font-size="9" font-family="'Fira Code', monospace" font-weight="700" text-anchor="middle">START</text>
        </g>

        <!-- Node q1 (Final/Accepting State - Double Circle) -->
        <g id="node-q1" class="diagram-node" transform="translate(350, 95)" cursor="pointer" filter="url(#node-shadow)">
          <circle class="node-halo" r="45" fill="none" stroke="#059669" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.35" />
          <!-- Outer circle for final state -->
          <circle class="node-bg" r="38" fill="#ffffff" stroke="#059669" stroke-width="3" />
          <!-- Inner concentric circle for final state -->
          <circle class="node-inner" r="30" fill="none" stroke="#059669" stroke-width="2" />
          <text class="node-text" y="5" fill="#0f172a" font-size="18" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">q1</text>
          <text class="node-sub" y="20" fill="#059669" font-size="9" font-family="'Fira Code', monospace" font-weight="700" text-anchor="middle">ACCEPT</text>
        </g>

        <!-- Node q2 (Intermediate Reversal State) -->
        <g id="node-q2" class="diagram-node" transform="translate(550, 180)" cursor="pointer" filter="url(#node-shadow)">
          <circle class="node-halo" r="42" fill="none" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.35" />
          <circle class="node-bg" r="35" fill="#ffffff" stroke="#d97706" stroke-width="3" />
          <text class="node-text" y="6" fill="#0f172a" font-size="18" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">q2</text>
          <text class="node-sub" y="22" fill="#d97706" font-size="9" font-family="'Fira Code', monospace" font-weight="700" text-anchor="middle">REVERSAL</text>
        </g>
      </svg>
    `;
  }

  /**
   * Highlight the active state and optionally the active transition
   * @param {string} state Current state 'q0' | 'q1' | 'q2'
   * @param {string|null} fromState Previous state
   * @param {string|null} symbol Scanned symbol
   */
  highlight(state, fromState = null, symbol = null) {
    if (!this.container) return;

    // Reset all nodes
    this.container.querySelectorAll('.diagram-node').forEach(node => {
      node.classList.remove('is-active', 'is-active-final', 'pulse-glow');
      const bg = node.querySelector('.node-bg');
      if (bg) bg.setAttribute('fill', '#ffffff');
    });

    // Reset all edges
    this.container.querySelectorAll('.diagram-edge').forEach(edge => {
      edge.classList.remove('is-active-edge');
      const path = edge.querySelector('path');
      if (path) {
        path.setAttribute('stroke', '#64748b');
        path.setAttribute('stroke-width', '2.5');
        path.setAttribute('marker-end', 'url(#arrow)');
      }
      const rect = edge.querySelector('rect');
      if (rect) {
        rect.setAttribute('stroke', '#cbd5e1');
        rect.setAttribute('fill', '#ffffff');
      }
      const text = edge.querySelector('text');
      if (text) {
        text.setAttribute('fill', '#334155');
      }
    });

    // Highlight current active state
    if (state) {
      const activeNode = this.container.querySelector(`#node-${state}`);
      if (activeNode) {
        activeNode.classList.add('is-active', 'pulse-glow');
        const bg = activeNode.querySelector('.node-bg');
        if (state === 'q0' && bg) bg.setAttribute('fill', '#e0f2fe'); // Soft sky tint
        if (state === 'q1') {
          activeNode.classList.add('is-active-final');
          if (bg) bg.setAttribute('fill', '#d1fae5'); // Soft emerald tint
        }
        if (state === 'q2' && bg) bg.setAttribute('fill', '#fef3c7'); // Soft amber tint
      }
    }

    // Highlight active transition if provided
    if (fromState && symbol !== null && symbol !== undefined) {
      let targetState = null;
      if (fromState === 'q0' && symbol === '0') targetState = 'q0';
      if (fromState === 'q0' && symbol === '1') targetState = 'q1';
      if (fromState === 'q1' && symbol === '0') targetState = 'q1';
      if (fromState === 'q1' && symbol === '1') targetState = 'q2';
      if (fromState === 'q2' && symbol === '0') targetState = 'q0';
      if (fromState === 'q2' && symbol === '1') targetState = 'q1';

      if (targetState) {
        const edgeId = `edge-${fromState}-${symbol}-${targetState}`;
        const activeEdge = this.container.querySelector(`#${edgeId}`);
        if (activeEdge) {
          activeEdge.classList.add('is-active-edge');
          const path = activeEdge.querySelector('path');
          if (path) {
            path.setAttribute('stroke', '#4f46e5');
            path.setAttribute('stroke-width', '3.8');
            path.setAttribute('marker-end', 'url(#arrow-active)');
          }
          const rect = activeEdge.querySelector('rect');
          if (rect) {
            rect.setAttribute('stroke', '#4f46e5');
            rect.setAttribute('fill', '#eef2ff');
          }
          const text = activeEdge.querySelector('text');
          if (text) {
            text.setAttribute('fill', '#4338ca');
          }
        }
      }
    }
  }
}
