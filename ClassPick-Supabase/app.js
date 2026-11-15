import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
``
// Supabase configuration
const SUPABASE_URL = 'https://uljairhbdtwytnjqfgdk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_99X5X-r2y0PzzILziOGIJg_8m5LsbSG';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


let students = [];
let pickedIds = new Set();

const $ = id => document.getElementById(id);

// Check admin login
async function requireAdmin() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    window.location.replace('login.html');
    return false;
  }

  $('welcomeUser').textContent =
    data.session.user.email || 'Administrator';

  return true;
}

// Show messages
function showMessage(text, isError = false) {
  $('statusMessage').textContent = text;
  $('statusMessage').className =
    isError ? 'message error' : 'message success';
}

// Sort roll numbers
function sortStudents() {
  students.sort((a, b) => {
    const aNum = Number(a.roll);
    const bNum = Number(b.roll);

    if (
      Number.isFinite(aNum) &&
      Number.isFinite(bNum) &&
      a.roll.trim() !== '' &&
      b.roll.trim() !== ''
    ) {
      return aNum - bNum;
    }

    return String(a.roll).localeCompare(
      String(b.roll),
      undefined,
      { numeric: true }
    );
  });
}

// Load students from Supabase
async function loadStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, roll');

  if (error) {
    showMessage(error.message, true);
    return;
  }

  students = data || [];
  sortStudents();

  // Remove IDs of students that no longer exist
  const existingIds = new Set(students.map(s => s.id));

  pickedIds = new Set(
    [...pickedIds].filter(id => existingIds.has(id))
  );

  renderStudents($('searchInput').value);
  updateRoundInfo();
}

// Render student table
function renderStudents(search = '') {
  const tbody = $('studentList');
  tbody.replaceChildren();

  const query = search.toLowerCase();

  const filtered = students.filter(student =>
    student.name.toLowerCase().includes(query) ||
    String(student.roll).toLowerCase().includes(query)
  );

  if (!filtered.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');

    cell.colSpan = 4;
    cell.textContent = students.length
      ? 'No matching students found.'
      : 'No students added yet.';

    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  filtered.forEach(student => {
    const row = document.createElement('tr');

    const serial = students.findIndex(
      item => item.id === student.id
    ) + 1;

    [serial, student.name, student.roll].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    const action = document.createElement('td');
    const removeButton = document.createElement('button');

    removeButton.className = 'danger small';
    removeButton.textContent = 'Remove';

    removeButton.addEventListener('click', () => {
      removeStudent(student.id);
    });

    action.appendChild(removeButton);
    row.appendChild(action);

    tbody.appendChild(row);
  });
}

// Update student count and round information
function updateRoundInfo() {
  $('roundInfo').textContent =
    `${pickedIds.size} of ${students.length} students selected this round.`;

  $('studentCount').textContent =
    `${students.length} Students`;

  $('addButton').disabled = false;
}

// Add student
async function addStudent(event) {
  event.preventDefault();

  const name = $('nameInput').value.trim();
  const roll = $('rollInput').value.trim();

  if (!name || !roll) {
    return showMessage(
      'Enter both student name and roll number.',
      true
    );
  }
  if (students.some(s => s.roll === roll)) {
    return showMessage(
      'This roll number already exists.',
      true
    );
  }

  $('addButton').disabled = true;

  const { error } = await supabase
    .from('students')
    .insert([{ name, roll }]);

  if (error) {
    showMessage(error.message, true);
  } else {
    $('studentForm').reset();

    await loadStudents();

    showMessage('Student added successfully.');
    $('nameInput').focus();
  }

  updateRoundInfo();
}

// Remove one student
async function removeStudent(id) {
  if (!confirm('Are you sure you want to remove this student?')) {
    return;
  }

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    return showMessage(error.message, true);
  }

  pickedIds.delete(id);

  await loadStudents();

  showMessage('Student removed successfully.');
}

// Responsive roll number sizing
function fitResultText() {
  const result = $('result');

  if (!result) return;

  const circle = result.closest('.picker-circle');

  if (!circle) return;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  const availableWidth = circle.clientWidth * 0.78;
  const text = result.textContent;

  const fontFamily =
    getComputedStyle(result).fontFamily || 'Arial';

  let fontSize = Math.min(
    44,
    circle.clientWidth * 0.18
  );

  while (fontSize > 12) {
    context.font = `800 ${fontSize}px ${fontFamily}`;

    if (
      context.measureText(text).width <= availableWidth
    ) {
      break;
    }

    fontSize--;
  }

  result.style.fontSize = `${fontSize}px`;
}

function showGenderMessage(student) {
  const roll = Number(student.roll);

  let message = '';

  if (roll >= 241901 && roll <= 241926) {
    message = `Muhtarma \"${student.name}"\, a jain! 😂`;
  }
  else if (roll >= 241927 && roll <= 241950) {
    message = `Kar har Medaan fateh, \"${student.name}"\ 🔥`;
  }
  else {
    return;
  }

  // Remove previous popup
  document.getElementById('genderMessage')?.remove();

  const popup = document.createElement('div');

  popup.id = 'genderMessage';
  popup.className = 'gender-popup';
  popup.textContent = message;
  popup.setAttribute('role', 'status');

  document.body.appendChild(popup);

  // Remove popup after 3 seconds
  setTimeout(() => {
    popup.remove();
  }, 3000);
}


// Confetti celebration animation
function launchConfetti() {
  const colors = [
    '#00f5c8',
    '#388bff',
    '#ff5475',
    '#ffd700',
    '#a855f7',
    '#ffffff'
  ];

  for (let i = 0; i < 55; i++) {
    const particle = document.createElement('span');

    particle.className = 'confetti-particle';

    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];

    particle.style.animationDuration =
      (2 + Math.random() * 2) + 's';

    particle.style.animationDelay =
      Math.random() * 0.5 + 's';

    particle.style.setProperty(
      '--drift',
      (Math.random() * 200 - 100) + 'px'
    );

    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 5000);
  }
}

// Animate selected student details
function animateSelection() {
  const result = $('result');
  const name = $('studentName');
  const roll = $('studentRoll');

  [result, name, roll].forEach(element => {
    element.classList.remove('selection-animation');

    void element.offsetWidth;

    element.classList.add('selection-animation');
  });
}


// Pick random student
function pickStudent() {
  if (!students.length) {
    return showMessage('Add students first.', true);
  }

  let available = students.filter(
    student => !pickedIds.has(student.id)
  );

  if (!available.length) {
    alert(
      'Everyone has been selected! Starting a new round.'
    );

    pickedIds.clear();
    available = [...students];
  }

  const selected = available[
    Math.floor(Math.random() * available.length)
  ];

  pickedIds.add(selected.id);

  $('result').textContent = selected.roll;
  fitResultText();

  $('studentName').textContent = selected.name;

  $('studentRoll').textContent =
    `Roll Number: ${selected.roll}`;

  // Animation effects
  animateSelection();
  launchConfetti();

  // Funny message
  showGenderMessage(selected);

  updateRoundInfo();
}


// Reset picker round
function resetRound() {
  pickedIds.clear();

  $('result').textContent = '?';
  $('studentName').textContent = 'Ready to Pick!';
  $('studentRoll').textContent = 'Roll Number: --';

  fitResultText();

  updateRoundInfo();
}

// Clear all students
async function clearStudents() {
  if (!students.length) {
    return showMessage(
      'There are no students to delete.',
      true
    );
  }

  if (
    !confirm(
      'Are you sure you want to permanently delete all students?'
    )
  ) {
    return;
  }

  const { error } = await supabase
    .from('students')
    .delete()
    .not('id', 'is', null);

  if (error) {
    return showMessage(error.message, true);
  }

  pickedIds.clear();

  resetRound();

  await loadStudents();

  showMessage('All student records deleted.');
}

// Logout
async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return showMessage(error.message, true);
  }

  window.location.replace('login.html');
}

// Initialize website
async function initialize() {
  const authenticated = await requireAdmin();

  if (!authenticated) return;

  $('studentForm').addEventListener(
    'submit',
    addStudent
  );

  $('searchInput').addEventListener(
    'input',
    event => renderStudents(event.target.value)
  );

  $('pickButton').addEventListener(
    'click',
    pickStudent
  );

  $('resetButton').addEventListener(
    'click',
    resetRound
  );

  $('clearButton').addEventListener(
    'click',
    clearStudents
  );

  $('logoutButton').addEventListener(
    'click',
    logout
  );

  await loadStudents();

  fitResultText();

  // Adjust number when screen changes
  window.addEventListener('resize', fitResultText);

  // Adjust number when picker circle changes size
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(fitResultText);

    observer.observe($('result').closest('.picker-circle'));
  }
}

initialize();
