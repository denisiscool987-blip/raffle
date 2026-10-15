(() => {
  'use strict';

  // State
  let participants = [];
  let prizes = [];
  let winners = [];

  // DOM refs
  const participantInput = document.getElementById('participant-input');
  const prizeInput = document.getElementById('prize-input');
  const participantList = document.getElementById('participant-list');
  const prizeList = document.getElementById('prize-list');
  const participantCount = document.getElementById('participant-count');
  const prizeCount = document.getElementById('prize-count');
  const clearParticipantsBtn = document.getElementById('clear-participants');
  const clearPrizesBtn = document.getElementById('clear-prizes');
  const addParticipantBtn = document.getElementById('add-participant');
  const addPrizeBtn = document.getElementById('add-prize');
  const drawBtn = document.getElementById('draw-btn');
  const drawHint = document.getElementById('draw-hint');
  const resultsSection = document.getElementById('results-section');
  const winnersList = document.getElementById('winners-list');
  const resetDrawBtn = document.getElementById('reset-draw');
  const copyResultsBtn = document.getElementById('copy-results');
  const drawSpinner = document.getElementById('draw-spinner');
  const btnText = drawBtn.querySelector('.btn-text');

  // --- Helpers ---
  function normalizeName(str) {
    return str.trim().replace(/\s+/g, ' ');
  }

  function uniquePush(arr, value) {
    const lower = value.toLowerCase();
    if (arr.some((x) => x.toLowerCase() === lower)) return false;
    arr.push(value);
    return true;
  }

  function shuffle(array) {
    // Fisher-Yates
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function updateUI() {
    // Counts
    participantCount.textContent = participants.length;
    prizeCount.textContent = prizes.length;

    // Clear buttons
    clearParticipantsBtn.disabled = participants.length === 0;
    clearPrizesBtn.disabled = prizes.length === 0;

    // Draw button
    const canDraw = participants.length > 0 && prizes.length > 0;
    drawBtn.disabled = !canDraw;

    if (participants.length === 0 && prizes.length === 0) {
      drawHint.textContent = 'Add at least one participant and one prize to start';
    } else if (participants.length === 0) {
      drawHint.textContent = 'Add at least one participant';
    } else if (prizes.length === 0) {
      drawHint.textContent = 'Add at least one prize';
    } else if (prizes.length > participants.length) {
      drawHint.textContent = `Ready · ${prizes.length} prizes will go to ${participants.length} participants (some may win multiple)`;
    } else {
      drawHint.textContent = `Ready · ${Math.min(prizes.length, participants.length)} winner${prizes.length === 1 ? '' : 's'} will be drawn`;
    }

    renderList(participantList, participants, removeParticipant);
    renderList(prizeList, prizes, removePrize);
  }

  function renderList(ul, items, removeFn) {
    ul.innerHTML = '';
    if (items.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'Nothing here yet';
      ul.appendChild(empty);
      return;
    }
    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'list-item';
      const span = document.createElement('span');
      span.textContent = item;
      span.title = item;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'remove-btn';
      btn.setAttribute('aria-label', `Remove ${item}`);
      btn.textContent = '×';
      btn.addEventListener('click', () => removeFn(index));
      li.appendChild(span);
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  // --- Participants ---
  function addParticipantsFromText(text) {
    // Support comma, newline, or semicolon separated
    const parts = text
      .split(/[,;\n]+/)
      .map(normalizeName)
      .filter(Boolean);

    let added = 0;
    parts.forEach((name) => {
      if (uniquePush(participants, name)) added++;
    });
    if (added > 0) updateUI();
    return added;
  }

  function removeParticipant(index) {
    participants.splice(index, 1);
    updateUI();
  }

  function clearParticipants() {
    participants = [];
    updateUI();
  }

  // --- Prizes ---
  function addPrizesFromText(text) {
    const parts = text
      .split(/[,;\n]+/)
      .map(normalizeName)
      .filter(Boolean);

    let added = 0;
    parts.forEach((name) => {
      // Allow duplicate prize names (e.g. two of the same item)
      prizes.push(name);
      added++;
    });
    if (added > 0) updateUI();
    return added;
  }

  function removePrize(index) {
    prizes.splice(index, 1);
    updateUI();
  }

  function clearPrizes() {
    prizes = [];
    updateUI();
  }

  // --- Draw logic ---
  function performDraw() {
    if (participants.length === 0 || prizes.length === 0) return;

    // Shuffle participants and assign prizes in order
    // If more prizes than people, some people can win multiple prizes
    const shuffledPeople = shuffle(participants);
    const shuffledPrizes = shuffle(prizes);

    winners = [];
    const prizeCount = shuffledPrizes.length;
    const peopleCount = shuffledPeople.length;

    for (let i = 0; i < prizeCount; i++) {
      const person = shuffledPeople[i % peopleCount];
      const prize = shuffledPrizes[i];
      winners.push({ person, prize, rank: i + 1 });
    }

    // Group by person for nicer display if someone wins multiple
    // But keep simple list ordered by prize draw order
    renderWinners();
  }

  function renderWinners() {
    winnersList.innerHTML = '';
    winners.forEach((w, i) => {
      const card = document.createElement('div');
      card.className = 'winner-card';
      card.style.animationDelay = `${i * 0.08}s`;

      const rank = document.createElement('div');
      rank.className = 'winner-rank';
      rank.textContent = w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : w.rank === 3 ? '🥉' : `#${w.rank}`;

      const info = document.createElement('div');
      info.className = 'winner-info';

      const name = document.createElement('div');
      name.className = 'winner-name';
      name.textContent = w.person;

      const prize = document.createElement('div');
      prize.className = 'winner-prize';
      prize.textContent = w.prize;

      info.appendChild(name);
      info.appendChild(prize);
      card.appendChild(rank);
      card.appendChild(info);
      winnersList.appendChild(card);
    });

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resetDraw() {
    winners = [];
    resultsSection.classList.add('hidden');
    winnersList.innerHTML = '';
  }

  function copyResults() {
    if (winners.length === 0) return;
    const text = winners
      .map((w) => `${w.rank}. ${w.person} → ${w.prize}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      const original = copyResultsBtn.textContent;
      copyResultsBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyResultsBtn.textContent = original;
      }, 1500);
    }).catch(() => {
      // Fallback
      prompt('Copy these results:', text);
    });
  }

  // --- Event listeners ---
  addParticipantBtn.addEventListener('click', () => {
    const value = participantInput.value;
    if (addParticipantsFromText(value)) {
      participantInput.value = '';
      participantInput.focus();
    }
  });

  participantInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipantBtn.click();
    }
  });

  // Paste support for bulk add
  participantInput.addEventListener('paste', (e) => {
    // Let the paste happen, then process on next tick if multi-line
    setTimeout(() => {
      const val = participantInput.value;
      if (/[,;\n]/.test(val)) {
        addParticipantsFromText(val);
        participantInput.value = '';
      }
    }, 0);
  });

  addPrizeBtn.addEventListener('click', () => {
    const value = prizeInput.value;
    if (addPrizesFromText(value)) {
      prizeInput.value = '';
      prizeInput.focus();
    }
  });

  prizeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPrizeBtn.click();
    }
  });

  prizeInput.addEventListener('paste', (e) => {
    setTimeout(() => {
      const val = prizeInput.value;
      if (/[,;\n]/.test(val)) {
        addPrizesFromText(val);
        prizeInput.value = '';
      }
    }, 0);
  });

  clearParticipantsBtn.addEventListener('click', clearParticipants);
  clearPrizesBtn.addEventListener('click', clearPrizes);

  drawBtn.addEventListener('click', () => {
    if (drawBtn.disabled) return;

    // Short dramatic delay
    btnText.classList.add('hidden');
    drawSpinner.classList.remove('hidden');
    drawBtn.disabled = true;

    setTimeout(() => {
      performDraw();
      btnText.classList.remove('hidden');
      drawSpinner.classList.add('hidden');
      drawBtn.disabled = false;
      updateUI();
    }, 900);
  });

  resetDrawBtn.addEventListener('click', resetDraw);
  copyResultsBtn.addEventListener('click', copyResults);

  // Initial render
  updateUI();
})();
