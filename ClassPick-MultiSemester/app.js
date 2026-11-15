
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase Configuration
const SUPABASE_URL = 'https://uljairhbdtwytnjqfgdk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_99X5X-r2y0PzzILziOGIJg_8m5LsbSG';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SEMESTERS = [
  'BS-IT 1st Semester',
  'BS-IT 2nd Semester',
  'BS-IT 3rd Semester',
  'BS-IT 4th Semester',
  'BS-IT 5th Semester',
  'BS-IT 6th Semester',
  'BS-IT 7th Semester',
  'BS-IT 8th Semester'
];

const $ = (id) => document.getElementById(id);

let currentSemester = null;
let students = [];
let pickedIds = new Set();

function showMessage(message, type = 'success') {
  const el = $('statusMessage');
  el.textContent = message;
  el.className = `status ${type}`;

  if (message) {
    setTimeout(() => {
      if (el.textContent === message) el.textContent = '';
    }, 3500);
  }
}

async function requireAdmin() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    window.location.replace('login.html');
    return false;
  }

  $('welcomeUser').textContent = session.user.email || 'Admin';
  return true;
}

function sortStudents(list) {
  return [...list].sort((a, b) =>
    String(a.roll).localeCompare(
      String(b.roll),
      undefined,
      { numeric: true }
    )
  );
}

async function openSemester(semester) {
  if (!SEMESTERS.includes(semester)) return;

  currentSemester = semester;

  // Save selected semester for page refresh
  localStorage.setItem('selectedSemester', semester);

  pickedIds.clear();

  $('classTitle').textContent = semester;
  $('workspace').classList.remove('hidden');
  $('semesterGrid').classList.add('hidden');

  $('result').textContent = 'READY';
  $('studentName').textContent = 'Choose a student';
  $('studentRoll').textContent = 'Your result will appear here';
  $('statusMessage').textContent = '';

  await loadStudents();
}

async function loadStudents() {
  $('studentList').innerHTML =
    '<div class="empty-state">Loading students...</div>';

  const { data, error } = await supabase
    .from('students')
    .select('id,name,roll,class_name,created_at')
    .eq('class_name', currentSemester)
    .order('roll');

  if (error) {
    showMessage(error.message, 'error');
    $('studentList').innerHTML =
      '<div class="empty-state">Could not load students.</div>';
    return;
  }

  students = sortStudents(data || []);

  renderStudents();
  updateRoundInfo();
}

function renderStudents() {
  const query = $('searchInput').value.trim().toLowerCase();

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(query) ||
    String(s.roll).toLowerCase().includes(query)
  );

  $('studentCount').textContent = students.length;

  $('listCount').textContent =
    `${students.length} record${students.length === 1 ? '' : 's'}`;

  // No student limit
  $('addButton').disabled = false;

  $('studentList').innerHTML = '';

  if (!filtered.length) {
    $('studentList').innerHTML = `
      <div class="empty-state">
        ${students.length
          ? 'No matching student found.'
          : 'No students added to this semester yet.'}
      </div>
    `;
    return;
  }

  filtered.forEach((student, index) => {
    const item = document.createElement('div');
    item.className = 'student-item';

    const details = document.createElement('div');
    details.className = 'student-details';

    const roll = document.createElement('span');
    roll.className = 'student-item-roll';
    roll.textContent = student.roll;

    const name = document.createElement('strong');
    name.textContent = student.name;

    details.append(roll, name);

    const remove = document.createElement('button');
    remove.className = 'remove-button';
    remove.type = 'button';
    remove.textContent = '×';
    remove.title = 'Remove student';

    remove.addEventListener('click', () => removeStudent(student));

    item.append(details, remove);
    $('studentList').append(item);
  });
}

async function addStudent(event) {
  event.preventDefault();

  if (!currentSemester) return;

  const name = $('nameInput').value.trim();
  const roll = $('rollInput').value.trim();

  if (!name || !roll) {
    return showMessage(
      'Please enter both name and roll number.',
      'error'
    );
  }

  const duplicate = students.some(s =>
    String(s.roll).toLowerCase() === roll.toLowerCase()
  );

  if (duplicate) {
    return showMessage(
      'This roll number already exists in this semester.',
      'error'
    );
  }

  $('addButton').disabled = true;

  const { error } = await supabase
    .from('students')
    .insert({
      name,
      roll,
      class_name: currentSemester
    });

  $('addButton').disabled = false;

  if (error) {
    return showMessage(error.message, 'error');
  }

  $('studentForm').reset();

  showMessage('Student added successfully!');

  await loadStudents();
}

async function removeStudent(student) {
  if (!confirm(
    `Remove ${student.name} (${student.roll}) from ${currentSemester}?`
  )) return;

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', student.id)
    .eq('class_name', currentSemester);

  if (error) {
    return showMessage(error.message, 'error');
  }

  pickedIds.delete(student.id);

  showMessage('Student removed.');

  await loadStudents();
}

async function clearStudents() {
  if (!students.length) {
    return showMessage('This semester has no students.', 'error');
  }

  if (!confirm(
    `Delete all ${students.length} students from ${currentSemester}? Other semesters will not be affected.`
  )) return;

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('class_name', currentSemester);

  if (error) {
    return showMessage(error.message, 'error');
  }

  pickedIds.clear();

  showMessage('This semester has been cleared.');

  $('result').textContent = 'READY';
  $('studentName').textContent = 'Choose a student';
  $('studentRoll').textContent = 'Your result will appear here';

  await loadStudents();
}

function fitResultText() {
  const el = $('result');

  el.style.fontSize =
    String(el.textContent).length > 8
      ? 'clamp(1.35rem, 5vw, 2.4rem)'
      : '';
}

function animateSelection() {
  ['result', 'studentName', 'studentRoll'].forEach(id => {
    const el = $(id);

    el.classList.remove('selection-animation');

    void el.offsetWidth;

    el.classList.add('selection-animation');
  });
}

function launchConfetti() {
  const symbols = ['✦', '●', '◆', '✧'];

  for (let i = 0; i < 38; i++) {
    const piece = document.createElement('span');

    piece.className = 'confetti';

    piece.textContent =
      symbols[Math.floor(Math.random() * symbols.length)];

    piece.style.left = `${Math.random() * 100}vw`;

    piece.style.animationDuration =
      `${1.4 + Math.random() * 1.5}s`;

    piece.style.animationDelay =
      `${Math.random() * 0.25}s`;

    document.body.appendChild(piece);

    setTimeout(() => piece.remove(), 3400);
  }
}

function showGenderMessage(student) {
  const roll = Number(student.roll);

  let message = '';

  if (roll >= 241901 && roll <= 241926) {
    message = `Muhtarma ${student.name}, a jain! 😂`;
  } else if (roll >= 241927 && roll <= 241950) {
    message = `Kar har Medaan fateh, ${student.name}! 🔥`;
  } else {
    return;
  }

  document.getElementById('genderMessage')?.remove();

  const popup = document.createElement('div');

  popup.id = 'genderMessage';
  popup.className = 'gender-popup';
  popup.textContent = message;

  popup.setAttribute('role', 'status');

  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 3000);
}

function updateRoundInfo() {
  $('roundInfo').textContent =
    `${pickedIds.size} of ${students.length} students selected this round`;

  $('pickButton').disabled =
    students.length === 0 || pickedIds.size >= students.length;

  if (students.length && pickedIds.size >= students.length) {
    $('pickButton').textContent = '✓ Round completed';
  } else {
    $('pickButton').textContent = '✦ Pick Random Student';
  }
}

function pickStudent() {
  const available = students.filter(s => !pickedIds.has(s.id));

  if (!available.length) return updateRoundInfo();

  const selected =
    available[Math.floor(Math.random() * available.length)];

  pickedIds.add(selected.id);

  $('result').textContent = selected.roll;

  fitResultText();

  $('studentName').textContent = selected.name;

  $('studentRoll').textContent =
    `Roll Number: ${selected.roll}`;

  animateSelection();
  launchConfetti();
  showGenderMessage(selected);

  updateRoundInfo();
}

function resetRound() {
  pickedIds.clear();

  $('result').textContent = 'READY';
  $('studentName').textContent = 'Choose a student';
  $('studentRoll').textContent = 'Your result will appear here';

  fitResultText();

  updateRoundInfo();

  showMessage('Round has been reset.');
}

async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return showMessage(error.message, 'error');
  }

  localStorage.removeItem('selectedSemester');

  window.location.replace('login.html');
}

function goBack() {
  currentSemester = null;
  students = [];
  pickedIds.clear();

  // Clear saved semester when going back to main page
  localStorage.removeItem('selectedSemester');

  $('workspace').classList.add('hidden');
  $('semesterGrid').classList.remove('hidden');

  $('searchInput').value = '';
}

async function initialize() {
  if (!await requireAdmin()) return;

  document.querySelectorAll('.semester-card').forEach(card => {
    card.addEventListener('click', () => {
      openSemester(card.dataset.semester);
    });
  });

  $('studentForm').addEventListener('submit', addStudent);

  $('searchInput').addEventListener('input', renderStudents);

  $('pickButton').addEventListener('click', pickStudent);

  $('resetButton').addEventListener('click', resetRound);

  $('clearButton').addEventListener('click', clearStudents);

  $('logoutButton').addEventListener('click', logout);

  $('backButton').addEventListener('click', goBack);

  // Restore last selected semester after refresh
  const savedSemester = localStorage.getItem('selectedSemester');

  if (savedSemester && SEMESTERS.includes(savedSemester)) {
    await openSemester(savedSemester);
  } else {
    localStorage.removeItem('selectedSemester');
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      window.location.replace('login.html');
    }
  });
}

initialize();
