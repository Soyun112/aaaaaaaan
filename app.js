/* ==========================================================================
   주도 실습 모바일 웹 - APPLICATION LOGIC (Pure Vanilla JS)
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. DATA OBJECT (APP_DATA) - 데이터 및 규칙 통합 관리
// --------------------------------------------------------------------------
const APP_DATA = {
  // 인원수별 3회차 순환표 및 짝 규칙
  rotationRules: {
    5: {
      labels: ['A', 'B', 'C', 'D', 'E'],
      rounds: [
        { A: 'junior', B: 'senior', C: 'junior', D: 'senior', E: 'observer' },
        { A: 'senior', B: 'junior', C: 'senior', D: 'observer', E: 'junior' },
        { A: 'junior', B: 'senior', C: 'observer', D: 'junior', E: 'senior' }
      ],
      pairs: [
        [ { junior: 'A', senior: 'B' }, { junior: 'C', senior: 'D' } ],
        [ { junior: 'B', senior: 'C' }, { junior: 'E', senior: 'A' } ],
        [ { junior: 'A', senior: 'B' }, { junior: 'D', senior: 'E' } ]
      ],
      observers: ['E', 'D', 'C']
    },
    4: {
      labels: ['A', 'B', 'C', 'D'],
      rounds: [
        { A: 'junior', B: 'senior', C: 'junior', D: 'senior' },
        { A: 'senior', B: 'junior', C: 'senior', D: 'junior' },
        { A: 'junior', B: 'senior', C: 'senior', D: 'junior' }
      ],
      pairs: [
        [ { junior: 'A', senior: 'B' }, { junior: 'C', senior: 'D' } ],
        [ { junior: 'B', senior: 'A' }, { junior: 'D', senior: 'C' } ],
        [ { junior: 'A', senior: 'C' }, { junior: 'D', senior: 'B' } ]
      ],
      observers: [] // 4명일 땐 관찰자 없음 (짝끼리 상호 피드백)
    },
    3: {
      labels: ['A', 'B', 'C'],
      rounds: [
        { A: 'junior', B: 'senior', C: 'observer' },
        { A: 'observer', B: 'junior', C: 'senior' },
        { A: 'senior', B: 'observer', C: 'junior' }
      ],
      pairs: [
        [ { junior: 'A', senior: 'B' } ],
        [ { junior: 'B', senior: 'C' } ],
        [ { junior: 'C', senior: 'A' } ]
      ],
      observers: ['C', 'A', 'B']
    }
  },

  // 역할별 정보 및 카드 내용
  roleInfo: {
    junior: {
      title: '아랫사람',
      colorClass: 'role-junior',
      badgeClass: 'badge-mint',
      situation: '입사 후 첫 회식. 윗사람과 한 테이블에 앉았다.',
      dialogues: ['"한 잔 따라드릴까요?"', '"감사합니다"'],
      actions: [
        '오른손으로 병 몸통, 왼손으로 손목이나 병 아래를 받쳐 따르기',
        '두 손으로 받고, 입술 댄 뒤 내려놓기',
        '고개를 옆으로 돌려 마시는 자세'
      ],
      tip: '병 입구가 잔에 닿지 않게, 잔의 7할 정도. 왼손잡이는 손 바꿔도 OK.'
    },
    senior: {
      title: '윗사람',
      colorClass: 'role-senior',
      badgeClass: 'badge-peach',
      situation: '신입사원과 첫 회식.',
      dialogues: ['"그래요, 고마워요."', '"○○씨도 한 잔 받아요."'],
      actions: [
        '아랫사람이 따라주는 잔 받기',
        '아랫사람에게 따라주기',
        '"그만"이라고 말해서 멈추는지 확인해보기'
      ]
    },
    observer: {
      title: '관찰자',
      colorClass: 'role-observer',
      badgeClass: 'badge-yellow',
      checks: [
        '두 손을 썼나요?',
        '병 입구가 잔에 안 닿았나요?',
        '고개 돌려 마셨나요?'
      ],
      feedbackGuide: '잘한 것 1개, 바꿀 것 1개 말해주기'
    }
  },

  // 거절 카드 데이터 (랜덤 뽑기용)
  refusalCards: [
    {
      id: 'A',
      title: '카드 A: 미음주 사전 거절',
      situation: '오늘은 안 마시려는데 윗사람이 한 잔을 권한다. 따르기 전에 의사를 전달하자.',
      example: '감사합니다만 저는 술을 마시지 않습니다. 음료로 함께하겠습니다.'
    },
    {
      id: 'B',
      title: '카드 B: 추가 한 잔 거절',
      situation: '이미 충분히 마셨는데 한 잔 더 권한다.',
      example: '감사하지만 오늘은 여기까지만 마시겠습니다.'
    }
  ],

  // 마무리 자기점검 수칙
  wrapupChecks: [
    '여쭙고 두 손으로 따랐다',
    '두 손으로 받고 입 대고 내려놓았다',
    '고개를 돌려 마셨다',
    '정중하게 거절하고, 거절을 존중했다'
  ]
};

// --------------------------------------------------------------------------
// 2. STATE MANAGEMENT - 메모리 변수 & localStorage 동기화
// --------------------------------------------------------------------------
const STORAGE_KEY = 'JUDO_PRACTICE_STATE_V2';

let state = {
  step: 1,            // 1:시작, 2:인원설정, 3:역할표, 4:1회차, 5:2회차, 6:3회차, 7:거절, 8:정리
  groupNum: 1,        // 선택된 모둠 번호 (1~8)
  peopleCount: 5,     // 5, 4, 3
  memberNames: ['A', 'B', 'C', 'D', 'E'], // 사용자가 입력하거나 기본 제공된 이름
  shuffledMapping: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' }, // 기호 -> 실제 이름 매핑
  soundMuted: false,  // 음소거 상태
  drawnCards: {},     // 거절 실습 짝별 뽑은 카드
  timer: {
    secondsLeft: 90,
    totalSeconds: 90,
    phase: 'action',  // 'action' (1m30s) or 'feedback' (30s)
    isRunning: false,
    intervalId: null
  },
  wakeLock: null
};

// localStorage 저장
function saveState() {
  try {
    const dataToSave = {
      step: state.step,
      groupNum: state.groupNum,
      peopleCount: state.peopleCount,
      memberNames: state.memberNames,
      shuffledMapping: state.shuffledMapping,
      soundMuted: state.soundMuted,
      drawnCards: state.drawnCards
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {
    console.warn('localStorage 저장 실패:', err);
  }
}

// localStorage 불러오기
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state.step = parsed.step || 1;
      state.groupNum = parsed.groupNum || 1;
      state.peopleCount = parsed.peopleCount || 5;
      state.memberNames = parsed.memberNames || ['A', 'B', 'C', 'D', 'E'];
      state.shuffledMapping = parsed.shuffledMapping || { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' };
      state.soundMuted = parsed.soundMuted || false;
      state.drawnCards = parsed.drawnCards || {};
    }
  } catch (err) {
    console.warn('localStorage 복원 실패:', err);
  }
}

// --------------------------------------------------------------------------
// 3. AUDIO & HAPTICS (Web Audio API & Vibration)
// --------------------------------------------------------------------------
let audioCtx = null;

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBeepSound() {
  if (state.soundMuted) return;
  try {
    initAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    
    // Tone 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.2); // E5
    gain2.gain.setValueAtTime(0.35, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.warn('Web Audio Play error:', e);
  }
}

function triggerVibration() {
  if (navigator.vibrate) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (e) {
      // ignore
    }
  }
}

// --------------------------------------------------------------------------
// 4. WAKE LOCK API (화면 꺼짐 방지)
// --------------------------------------------------------------------------
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      state.wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
      console.log('Wake Lock request failed:', err.name, err.message);
    }
  }
}

function releaseWakeLock() {
  if (state.wakeLock) {
    state.wakeLock.release().then(() => {
      state.wakeLock = null;
    });
  }
}

// --------------------------------------------------------------------------
// 5. FISHER-YATES SHUFFLE ALGORITHM
// --------------------------------------------------------------------------
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --------------------------------------------------------------------------
// 6. UI RENDER ENGINE
// --------------------------------------------------------------------------
function renderApp() {
  updateHeaderAndProgress();
  showCurrentStepView();
  saveState();
}

// 상단 헤더 및 진행 바 업데이트
function updateHeaderAndProgress() {
  // 모둠 태그
  const groupBadge = document.getElementById('group-badge');
  groupBadge.textContent = `${state.groupNum}모둠`;

  // 음소거 아이콘
  const soundOn = document.getElementById('icon-sound-on');
  const soundOff = document.getElementById('icon-sound-off');
  if (state.soundMuted) {
    soundOn.classList.add('hidden');
    soundOff.classList.remove('hidden');
  } else {
    soundOn.classList.remove('hidden');
    soundOff.classList.add('hidden');
  }

  // 상단 역할표 모달 버튼 (Step 3 이상부터 활성화)
  const btnMatrix = document.getElementById('btn-open-matrix');
  if (state.step >= 3) {
    btnMatrix.classList.remove('hidden');
  } else {
    btnMatrix.classList.add('hidden');
  }

  // 프로그레스 바 점 상태
  const dots = document.querySelectorAll('.dot-item');
  dots.forEach(dot => {
    const dotStep = parseInt(dot.dataset.step, 10);
    dot.classList.remove('active');
    
    // 매핑 (Step 4,5,6 -> 실습 점 4번)
    if (state.step === dotStep) {
      dot.classList.add('active');
    } else if ((state.step === 4 || state.step === 5 || state.step === 6) && dotStep === 4) {
      dot.classList.add('active');
    }
  });

  // 하단 메인 버튼 문구 조정
  const btnMainNext = document.getElementById('btn-main-next');
  if (state.step === 1) {
    btnMainNext.textContent = '실습 시작하기';
  } else if (state.step === 2) {
    btnMainNext.textContent = '전체 역할표 보기';
  } else if (state.step === 3) {
    btnMainNext.textContent = '1회차 실습 시작';
  } else if (state.step === 4) {
    btnMainNext.textContent = '2회차 실습으로';
  } else if (state.step === 5) {
    btnMainNext.textContent = '3회차 실습으로';
  } else if (state.step === 6) {
    btnMainNext.textContent = '거절 실습으로';
  } else if (state.step === 7) {
    btnMainNext.textContent = '정리 및 자기점검';
  } else if (state.step === 8) {
    btnMainNext.textContent = '처음으로 돌아가기';
  }
}

// 화면별 Step 렌더링
function showCurrentStepView() {
  // 모든 step 뷰 비활성화
  document.querySelectorAll('.step-view').forEach(view => {
    view.classList.remove('active');
  });

  // Step 4, 5, 6은 동일한 practice view 공유
  if (state.step >= 4 && state.step <= 6) {
    const practiceView = document.getElementById('step-practice');
    practiceView.classList.add('active');
    renderPracticeStep(state.step - 3); // 1, 2, 3회차
  } else {
    const activeView = document.getElementById(`step-${state.step}`);
    if (activeView) {
      activeView.classList.add('active');
    }
  }

  // 각 Step별 동적 렌더링 처리
  if (state.step === 1) {
    renderStep1();
  } else if (state.step === 2) {
    renderStep2();
  } else if (state.step === 3) {
    renderStep3();
  } else if (state.step === 7) {
    renderStep7();
  } else if (state.step === 8) {
    renderStep8();
  }

  // 4~7단계 중에는 Wake Lock 요청
  if (state.step >= 4 && state.step <= 7) {
    requestWakeLock();
  } else {
    releaseWakeLock();
  }
}

// --------------------------------------------------------------------------
// STEP 1 RENDERER
// --------------------------------------------------------------------------
function renderStep1() {
  const numBtns = document.querySelectorAll('#group-num-grid .btn-num');
  numBtns.forEach(btn => {
    const n = parseInt(btn.dataset.num, 10);
    if (n === state.groupNum) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// --------------------------------------------------------------------------
// STEP 2 RENDERER (인원 및 이름 설정)
// --------------------------------------------------------------------------
function renderStep2() {
  // 인원 선택 버튼
  const countBtns = document.querySelectorAll('.btn-count');
  countBtns.forEach(btn => {
    const c = parseInt(btn.dataset.count, 10);
    if (c === state.peopleCount) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 이름 입력 폼
  const nameListContainer = document.getElementById('name-input-list');
  nameListContainer.innerHTML = '';

  const labels = APP_DATA.rotationRules[state.peopleCount].labels;
  labels.forEach((label, idx) => {
    const val = state.memberNames[idx] || '';
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
      <span class="input-label-badge">${label}</span>
      <input type="text" class="custom-input name-field" data-index="${idx}" value="${escapeHtml(val)}" placeholder="이름 (기본: ${label})" maxlength="10">
    `;
    nameListContainer.appendChild(row);
  });

  // 이름 입력 필드 이벤트 바인딩
  document.querySelectorAll('.name-field').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      state.memberNames[idx] = e.target.value.trim();
      updateShuffledMapping();
      saveState();
    });
  });

  renderShuffleResult();
}

function updateShuffledMapping() {
  const labels = APP_DATA.rotationRules[state.peopleCount].labels;
  labels.forEach((label, idx) => {
    const inputVal = state.memberNames[idx];
    state.shuffledMapping[label] = (inputVal && inputVal.length > 0) ? inputVal : label;
  });
}

function renderShuffleResult() {
  const card = document.getElementById('shuffle-result-card');
  const tagsContainer = document.getElementById('shuffled-names-list');
  tagsContainer.innerHTML = '';

  card.classList.remove('hidden');
  const labels = APP_DATA.rotationRules[state.peopleCount].labels;
  labels.forEach(label => {
    const realName = state.shuffledMapping[label] || label;
    const tag = document.createElement('div');
    tag.className = 'tag-item';
    tag.textContent = `${label}자리에 → ${realName}`;
    tagsContainer.appendChild(tag);
  });
}

// --------------------------------------------------------------------------
// STEP 3 RENDERER (전체 역할표 & 짝 표시)
// --------------------------------------------------------------------------
function renderStep3() {
  const rule = APP_DATA.rotationRules[state.peopleCount];
  const table = document.getElementById('role-matrix-table');
  const tbody = table.querySelector('tbody');
  const thead = table.querySelector('thead');

  // Header 렌더링
  let headHtml = `<tr><th>회차</th>`;
  rule.labels.forEach(label => {
    const name = state.shuffledMapping[label] || label;
    headHtml += `<th>${escapeHtml(name)} (${label})</th>`;
  });
  headHtml += `</tr>`;
  thead.innerHTML = headHtml;

  // Body 렌더링 (3회차)
  let bodyHtml = '';
  rule.rounds.forEach((roundData, rIdx) => {
    bodyHtml += `<tr><td>${rIdx + 1}회차</td>`;
    rule.labels.forEach(label => {
      const roleKey = roundData[label];
      const info = APP_DATA.roleInfo[roleKey];
      const cellClass = `cell-${roleKey}`;
      bodyHtml += `<td class="${cellClass}">${info.title}</td>`;
    });
    bodyHtml += `</tr>`;
  });
  tbody.innerHTML = bodyHtml;

  // 이번 1회차 짝 요약 표시
  renderPairChips(1);
}

function renderPairChips(roundNum) {
  const titleEl = document.getElementById('current-pairs-title');
  const listEl = document.getElementById('current-pairs-list');
  const rule = APP_DATA.rotationRules[state.peopleCount];
  const roundPairs = rule.pairs[roundNum - 1];
  const roundObserver = rule.observers[roundNum - 1];

  titleEl.textContent = `📍 ${roundNum}회차 실습 짝`;
  listEl.innerHTML = '';

  roundPairs.forEach(pair => {
    const jName = state.shuffledMapping[pair.junior] || pair.junior;
    const sName = state.shuffledMapping[pair.senior] || pair.senior;
    const chip = document.createElement('div');
    chip.className = 'pair-chip';
    chip.innerHTML = `
      <span>${jName}<small>(${pair.junior} · 아랫)</small></span>
      <span class="pair-arrow">↔</span>
      <span>${sName}<small>(${pair.senior} · 윗)</small></span>
    `;
    listEl.appendChild(chip);
  });

  if (roundObserver) {
    const obsName = state.shuffledMapping[roundObserver] || roundObserver;
    const chip = document.createElement('div');
    chip.className = 'pair-chip';
    chip.style.backgroundColor = 'var(--yellow-secondary)';
    chip.style.color = 'var(--yellow-text)';
    chip.innerHTML = `
      <span>👁️ 관찰자: ${obsName} (${roundObserver})</span>
      <small>피드백 담당</small>
    `;
    listEl.appendChild(chip);
  } else if (state.peopleCount === 4) {
    const chip = document.createElement('div');
    chip.className = 'pair-chip';
    chip.style.backgroundColor = 'var(--gray-btn-bg)';
    chip.innerHTML = `
      <span>💡 관찰자 없음</span>
      <small>짝끼리 서로 피드백</small>
    `;
    listEl.appendChild(chip);
  }
}

// --------------------------------------------------------------------------
// STEP 4~6 RENDERER (실습 회차 1, 2, 3 & 타이머)
// --------------------------------------------------------------------------
function renderPracticeStep(roundNum) {
  // 타이머 초기화 (필요시)
  const roundBadge = document.getElementById('round-indicator');
  roundBadge.textContent = `${roundNum}회차 실습`;

  if (!state.timer.isRunning) {
    resetPracticeTimer(90, 'action'); // 기본 1분 30초
  }

  const container = document.getElementById('practice-cards-container');
  container.innerHTML = '';

  const rule = APP_DATA.rotationRules[state.peopleCount];
  const roundPairs = rule.pairs[roundNum - 1];
  const roundObserver = rule.observers[roundNum - 1];

  // 짝 카드 생성
  roundPairs.forEach((pair, idx) => {
    const jKey = pair.junior;
    const sKey = pair.senior;
    const jName = state.shuffledMapping[jKey] || jKey;
    const sName = state.shuffledMapping[sKey] || sKey;

    const jInfo = APP_DATA.roleInfo.junior;
    const sInfo = APP_DATA.roleInfo.senior;

    // 아랫사람 카드
    const jCard = createRoleCardHTML(jName, jKey, jInfo);
    // 윗사람 카드
    const sCard = createRoleCardHTML(sName, sKey, sInfo);

    const pairWrapper = document.createElement('div');
    pairWrapper.className = 'pair-group';
    pairWrapper.innerHTML = `
      <div style="font-family:var(--font-title); font-size:15px; margin-bottom:8px; color:var(--peach-dark);">
        🤝 짝 ${idx + 1}: ${jName} (${jKey}) ↔ ${sName} (${sKey})
      </div>
      ${jCard}
      <div style="height:12px;"></div>
      ${sCard}
    `;
    container.appendChild(pairWrapper);
  });

  // 관찰자 카드 (또는 4인 상호 피드백 카드)
  if (roundObserver) {
    const obsName = state.shuffledMapping[roundObserver] || roundObserver;
    const obsInfo = APP_DATA.roleInfo.observer;
    const obsCard = createObserverCardHTML(obsName, roundObserver, obsInfo);
    container.appendChild(obsCard);
  } else if (state.peopleCount === 4) {
    const infoCard = document.createElement('div');
    infoCard.className = 'role-card role-observer';
    infoCard.innerHTML = `
      <div class="role-card-header">
        <span class="role-person-name">짝 피드백 (4인 모둠)</span>
        <span class="role-title-badge">상호 관찰</span>
      </div>
      <div class="role-card-body">
        <p class="situation-tag">💡 관찰자가 없으므로 짝끼리 서로 실습 모습을 챙겨줍니다.</p>
        <div class="feedback-banner">
          "잘한 것 1개, 바꿀 것 1개 말해주기"
        </div>
      </div>
    `;
    container.appendChild(infoCard);
  }

  // 체크박스 클릭 바인딩
  document.querySelectorAll('.check-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
    });
  });
}

function createRoleCardHTML(personName, letter, roleInfo) {
  let dialogueHtml = roleInfo.dialogues.map(d => `<p class="dialogue-large">${escapeHtml(d)}</p>`).join('');
  let actionHtml = roleInfo.actions.map((act, i) => `
    <li class="action-item">
      <span class="action-num">①②③`[i] + `</span>
      <span>${escapeHtml(act)}</span>
    </li>
  `).join('');

  let tipHtml = roleInfo.tip ? `<p class="tip-text">💡 ${escapeHtml(roleInfo.tip)}</p>` : '';

  return `
    <div class="role-card ${roleInfo.colorClass}">
      <div class="role-card-header">
        <span class="role-person-name">${escapeHtml(personName)} (${letter})</span>
        <span class="role-title-badge">${roleInfo.title}</span>
      </div>
      <div class="role-card-body">
        <span class="situation-tag">상황: ${escapeHtml(roleInfo.situation)}</span>
        
        <div class="dialogue-box">
          <span style="font-size:12px; color:var(--text-sub); display:block; margin-bottom:2px;">💬 할 말</span>
          ${dialogueHtml}
        </div>

        <ul class="action-list">
          ${actionHtml}
        </ul>

        ${tipHtml}
      </div>
    </div>
  `;
}

function createObserverCardHTML(personName, letter, obsInfo) {
  let checksHtml = obsInfo.checks.map(c => `
    <div class="check-item">
      <div class="check-box-icon"></div>
      <span style="font-family:var(--font-title); font-size:15px;">${escapeHtml(c)}</span>
    </div>
  `).join('');

  return `
    <div class="role-card ${obsInfo.colorClass}">
      <div class="role-card-header">
        <span class="role-person-name">${escapeHtml(personName)} (${letter})</span>
        <span class="role-title-badge">${obsInfo.title}</span>
      </div>
      <div class="role-card-body">
        <span class="section-label">👀 실습 체크리스트 (탭하여 체크)</span>
        <div class="observer-checks">
          ${checksHtml}
        </div>
        <div class="feedback-banner">
          💬 피드백: ${escapeHtml(obsInfo.feedbackGuide)}
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// TIMER ENGINE
// --------------------------------------------------------------------------
function updateTimerDisplay() {
  const clock = document.getElementById('timer-clock');
  const sub = document.getElementById('timer-sub-text');
  const phaseTag = document.getElementById('timer-phase-tag');
  const fgCircle = document.getElementById('timer-progress-circle');

  const m = Math.floor(state.timer.secondsLeft / 60);
  const s = state.timer.secondsLeft % 60;
  clock.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // Circular progress SVG calculation (r=44 => Circumference ~ 276.46)
  const circumference = 276.46;
  const ratio = state.timer.secondsLeft / state.timer.totalSeconds;
  const offset = circumference * (1 - ratio);
  fgCircle.style.strokeDashoffset = offset;

  if (state.timer.phase === 'action') {
    phaseTag.textContent = '수행 시간 (1분 30초)';
    phaseTag.className = 'phase-tag phase-action';
    sub.textContent = '모둠 실습 중';
    fgCircle.classList.remove('feedback-mode');
  } else {
    phaseTag.textContent = '피드백 시간 (30초)';
    phaseTag.className = 'phase-tag phase-feedback';
    sub.textContent = '피드백 공유 중';
    fgCircle.classList.add('feedback-mode');
  }
}

function startPracticeTimer() {
  if (state.timer.isRunning) return;
  initAudioContext();
  state.timer.isRunning = true;
  document.getElementById('timer-btn-text').textContent = '일시정지';

  state.timer.intervalId = setInterval(() => {
    if (state.timer.secondsLeft > 0) {
      state.timer.secondsLeft--;
      updateTimerDisplay();
    } else {
      // 타이머 완료 처리
      playBeepSound();
      triggerVibration();

      if (state.timer.phase === 'action') {
        // 수행 시간 종료 -> 자동으로 피드백 30초로 전환
        resetPracticeTimer(30, 'feedback');
        startPracticeTimer();
      } else {
        // 피드백 시간 종료 -> 일시정지 및 [다음 회차] 버튼 강하게 제안
        pausePracticeTimer();
        document.getElementById('btn-main-next').focus();
      }
    }
  }, 1000);
}

function pausePracticeTimer() {
  state.timer.isRunning = false;
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }
  document.getElementById('timer-btn-text').textContent = '다시 시작';
}

function resetPracticeTimer(seconds = 90, phase = 'action') {
  pausePracticeTimer();
  state.timer.secondsLeft = seconds;
  state.timer.totalSeconds = seconds;
  state.timer.phase = phase;
  document.getElementById('timer-btn-text').textContent = '시작하기';
  updateTimerDisplay();
}

// --------------------------------------------------------------------------
// STEP 7 RENDERER (거절 실습 & 3분 타이머)
// --------------------------------------------------------------------------
let refusalTimerId = null;
let refusalSecondsLeft = 180; // 3분

function renderStep7() {
  const container = document.getElementById('refusal-cards-container');
  container.innerHTML = '';

  const rule = APP_DATA.rotationRules[state.peopleCount];
  // 짝 정보
  const pairs = rule.pairs[0]; // 대표 짝 목록 사용

  pairs.forEach((pair, idx) => {
    const jName = state.shuffledMapping[pair.junior] || pair.junior;
    const sName = state.shuffledMapping[pair.senior] || pair.senior;
    const drawn = state.drawnCards[idx];

    const cardBox = document.createElement('div');
    cardBox.className = 'role-card';

    if (!drawn) {
      cardBox.innerHTML = `
        <div class="role-card-header" style="background-color:var(--peach-point); color:var(--peach-text);">
          <span class="role-person-name">짝 ${idx + 1}: ${jName} & ${sName}</span>
          <span class="role-title-badge">거절 상황</span>
        </div>
        <div class="draw-card-area">
          <p style="font-size:14px; margin-bottom:12px;">어떤 거절 상황인지 카드를 뽑아 확인하세요!</p>
          <button class="btn-secondary btn-draw-card" data-idx="${idx}">🎴 카드 뽑기</button>
        </div>
      `;
    } else {
      const cardInfo = APP_DATA.refusalCards.find(c => c.id === drawn);
      cardBox.innerHTML = `
        <div class="role-card-header" style="background-color:var(--peach-point); color:var(--peach-text);">
          <span class="role-person-name">짝 ${idx + 1}: ${jName} & ${sName}</span>
          <span class="role-title-badge">${cardInfo.id} 카드</span>
        </div>
        <div class="role-card-body drawn-content card-flip">
          <h4 class="card-tag">${escapeHtml(cardInfo.title)}</h4>
          <p class="situation-tag">상황: ${escapeHtml(cardInfo.situation)}</p>
          <div class="dialogue-box" style="border-left-color:var(--peach-dark);">
            <span style="font-size:12px; color:var(--text-sub); display:block; margin-bottom:2px;">💬 거절 예시 대사</span>
            <p class="dialogue-large">${escapeHtml(cardInfo.example)}</p>
          </div>
          <button class="btn-secondary btn-draw-card" data-idx="${idx}" style="height:38px; font-size:13px; margin-top:6px;">🔄 다시 뽑기</button>
        </div>
      `;
    }
    container.appendChild(cardBox);
  });

  // 카드 뽑기 버튼 이벤트 바인딩
  document.querySelectorAll('.btn-draw-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      // random A or B
      const randId = Math.random() > 0.5 ? 'A' : 'B';
      state.drawnCards[idx] = randId;
      saveState();
      renderStep7();
    });
  });

  initRefusalTimer();
}

function initRefusalTimer() {
  updateRefusalTimerDisplay();
}

function updateRefusalTimerDisplay() {
  const clock = document.getElementById('refusal-clock');
  const m = Math.floor(refusalSecondsLeft / 60);
  const s = refusalSecondsLeft % 60;
  clock.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // 구간 하이라이트 (180s total -> 180~150: P1, 150~60: P2, 60~0: P3)
  const p1 = document.getElementById('refusal-p1');
  const p2 = document.getElementById('refusal-p2');
  const p3 = document.getElementById('refusal-p3');

  [p1, p2, p3].forEach(p => p.classList.remove('active'));

  if (refusalSecondsLeft > 150) {
    p1.classList.add('active');
  } else if (refusalSecondsLeft > 60) {
    p2.classList.add('active');
  } else {
    p3.classList.add('active');
  }
}

// --------------------------------------------------------------------------
// STEP 8 RENDERER (정리 및 자기점검)
// --------------------------------------------------------------------------
function renderStep8() {
  const checkContainer = document.getElementById('self-check-list');
  checkContainer.innerHTML = '';

  APP_DATA.wrapupChecks.forEach((text, i) => {
    const checkCard = document.createElement('div');
    checkCard.className = 'self-check-card';
    checkCard.innerHTML = `
      <div class="self-check-icon"></div>
      <span class="self-check-text">${escapeHtml(text)}</span>
    `;

    checkCard.addEventListener('click', (e) => {
      checkCard.classList.toggle('checked');
      if (checkCard.classList.contains('checked')) {
        createHeartPopEffect(e, checkCard);
      }
    });

    checkContainer.appendChild(checkCard);
  });
}

function createHeartPopEffect(e, parentEl) {
  const heart = document.createElement('span');
  heart.className = 'heart-pop';
  heart.textContent = Math.random() > 0.5 ? '💚' : '⭐';
  heart.style.left = `${e.offsetX}px`;
  heart.style.top = `${e.offsetY}px`;
  parentEl.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 800);
}

// --------------------------------------------------------------------------
// MODAL & NAVIGATION EVENTS
// --------------------------------------------------------------------------
function setupEventListeners() {
  // 모둠 번호 버튼 선택 (Step 1)
  document.querySelectorAll('#group-num-grid .btn-num').forEach(btn => {
    btn.addEventListener('click', () => {
      state.groupNum = parseInt(btn.dataset.num, 10);
      renderStep1();
      saveState();
    });
  });

  // 인원 변경 선택 (Step 2)
  document.querySelectorAll('.btn-count').forEach(btn => {
    btn.addEventListener('click', () => {
      state.peopleCount = parseInt(btn.dataset.count, 10);
      // 멤버 배열 및 셔플 매핑 재설정
      const labels = APP_DATA.rotationRules[state.peopleCount].labels;
      state.memberNames = labels.map((l, i) => state.memberNames[i] || '');
      updateShuffledMapping();
      renderStep2();
      saveState();
    });
  });

  // 역할 섞기 (Fisher-Yates) (Step 2)
  document.getElementById('btn-shuffle').addEventListener('click', () => {
    const labels = APP_DATA.rotationRules[state.peopleCount].labels;
    // 현재 입력된 실제 이름 목록
    const currentRealNames = labels.map((l, i) => {
      const val = state.memberNames[i];
      return (val && val.length > 0) ? val : l;
    });

    // 셔플된 이름들
    const shuffled = shuffleArray(currentRealNames);
    labels.forEach((label, idx) => {
      state.shuffledMapping[label] = shuffled[idx];
    });

    // Flip 애니메이션
    const resultBox = document.getElementById('shuffle-result-card');
    resultBox.classList.remove('card-flip');
    void resultBox.offsetWidth; // trigger reflow
    resultBox.classList.add('card-flip');

    renderShuffleResult();
    saveState();
  });

  // 하단 메인 [다음/시작] 버튼
  document.getElementById('btn-main-next').addEventListener('click', () => {
    initAudioContext();

    if (state.step < 8) {
      state.step++;
      renderApp();
      window.scrollTo(0, 0);
    } else {
      // 8단계 -> 1단계로 리셋
      state.step = 1;
      renderApp();
      window.scrollTo(0, 0);
    }
  });

  // 상단 뒤로가기 버튼
  document.getElementById('btn-back').addEventListener('click', () => {
    if (state.step > 1) {
      state.step--;
      renderApp();
      window.scrollTo(0, 0);
    }
  });

  // 음소거 토글
  document.getElementById('btn-sound-toggle').addEventListener('click', () => {
    state.soundMuted = !state.soundMuted;
    updateHeaderAndProgress();
    saveState();
  });

  // 전체 역할표 모달 제어
  const modal = document.getElementById('modal-matrix');
  document.getElementById('btn-open-matrix').addEventListener('click', () => {
    openRoleMatrixModal();
  });
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  });

  // 타이머 제어 버튼들 (Step 4~6)
  document.getElementById('btn-timer-toggle').addEventListener('click', () => {
    if (state.timer.isRunning) {
      pausePracticeTimer();
    } else {
      startPracticeTimer();
    }
  });

  document.getElementById('btn-timer-add').addEventListener('click', () => {
    state.timer.secondsLeft += 30;
    state.timer.totalSeconds += 30;
    updateTimerDisplay();
  });

  document.getElementById('btn-timer-reset').addEventListener('click', () => {
    resetPracticeTimer(90, 'action');
  });

  // 거절 실습 타이머 제어 (Step 7)
  const btnRefusalToggle = document.getElementById('btn-refusal-toggle');
  btnRefusalToggle.addEventListener('click', () => {
    if (refusalTimerId) {
      clearInterval(refusalTimerId);
      refusalTimerId = null;
      btnRefusalToggle.textContent = '다시 시작';
    } else {
      btnRefusalToggle.textContent = '일시정지';
      refusalTimerId = setInterval(() => {
        if (refusalSecondsLeft > 0) {
          refusalSecondsLeft--;
          updateRefusalTimerDisplay();
        } else {
          clearInterval(refusalTimerId);
          refusalTimerId = null;
          playBeepSound();
          triggerVibration();
          btnRefusalToggle.textContent = '완료';
        }
      }, 1000);
    }
  });

  document.getElementById('btn-refusal-add').addEventListener('click', () => {
    refusalSecondsLeft += 30;
    updateRefusalTimerDisplay();
  });
}

function openRoleMatrixModal() {
  const modal = document.getElementById('modal-matrix');
  const container = document.getElementById('modal-matrix-content');
  const rule = APP_DATA.rotationRules[state.peopleCount];

  let headHtml = `<tr style="font-family:var(--font-title);"><th>회차</th>`;
  rule.labels.forEach(label => {
    const name = state.shuffledMapping[label] || label;
    headHtml += `<th>${escapeHtml(name)}</th>`;
  });
  headHtml += `</tr>`;

  let bodyHtml = '';
  rule.rounds.forEach((roundData, rIdx) => {
    bodyHtml += `<tr><td style="font-family:var(--font-title);">${rIdx + 1}회차</td>`;
    rule.labels.forEach(label => {
      const roleKey = roundData[label];
      const info = APP_DATA.roleInfo[roleKey];
      const cellClass = `cell-${roleKey}`;
      bodyHtml += `<td class="${cellClass}">${info.title}</td>`;
    });
    bodyHtml += `</tr>`;
  });

  container.innerHTML = `
    <p style="font-size:13px; color:var(--text-sub); margin-bottom:10px;">
      현재 설정된 ${state.peopleCount}명 순환 배정표입니다.
    </p>
    <table class="role-table" style="width:100%;">
      <thead>${headHtml}</thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  `;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

// HTML 특수문자 이스케이프
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --------------------------------------------------------------------------
// INITIALIZATION
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateShuffledMapping();
  setupEventListeners();
  renderApp();
});
