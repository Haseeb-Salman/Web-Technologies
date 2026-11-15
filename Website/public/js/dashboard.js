const app = {
  sections: ['dashboard', 'students', 'courses', 'teachers'],
  currentSection: 'dashboard',
  editMode: { type: null, id: null },

  init: async () => {
    app.updateDate();
    setInterval(app.updateDate, 1000);
    await app.checkAuth();
    app.bindNav();
    app.bindModals();
    app.bindSearch();
    await app.loadStats();
    await app.loadDashboardTable();
  },

  updateDate: () => {
    const el = document.getElementById('topbarDate');
    if (el) el.textContent = new Date().toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  },

  checkAuth: async () => {
    try {
      const data = await fetchJson('/me');
      const user = data.user;
      if (data.csrfToken) { window.csrfToken = data.csrfToken; const meta = document.querySelector('meta[name="csrf-token"]'); if (meta) meta.content = data.csrfToken; }
      document.getElementById('sidebarUser').innerHTML = '<div style="padding:12px;font-size:13px;color:var(--neon-cyan);text-shadow:0 0 6px var(--neon-cyan);">' + user.username + '</div><div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;">' + user.role + '</div>';
      document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
    } catch (err) {
      window.location.href = 'login.html';
    }
  },

  bindNav: () => {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        if (item.id === 'navLogout') { e.preventDefault(); await app.logout(); return; }
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('nav-active'));
        item.classList.add('nav-active');
        const section = item.dataset.section;
        await app.switchSection(section);
      });
    });
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });
  },

  switchSection: async (section) => {
    app.currentSection = section;
    app.sections.forEach(s => {
      const el = document.getElementById('sec' + s.charAt(0).toUpperCase() + s.slice(1));
      if (el) el.classList.toggle('section-active', s === section);
    });
    const titleMap = { dashboard: 'Dashboard', students: 'Students', courses: 'Courses', teachers: 'Teachers' };
    document.getElementById('pageTitle').textContent = titleMap[section] || section;
    document.getElementById('pageSub').textContent = 'Manage your ' + section + ' records';
    if (section === 'dashboard') { await app.loadStats(); await app.loadDashboardTable(); }
    else if (section === 'students') { await app.loadStudents(); }
    else if (section === 'courses') { await app.loadCourses(); }
    else if (section === 'teachers') { await app.loadTeachers(); }
  },

  logout: async () => {
    try { await fetchJson('/logout', { method: 'POST' }); } catch (e) {}
    window.location.href = 'login.html';
  },

  loadStats: async () => {
    try {
      const data = await fetchJson('/dashboard/stats');
      const s = data.stats;
      document.getElementById('statStudents').textContent = s.totalStudents;
      document.getElementById('statCourses').textContent = s.totalCourses;
      document.getElementById('statTeachers').textContent = s.totalTeachers;
      document.getElementById('statUsers').textContent = s.totalUsers;
    } catch (err) { console.error(err); }
  },

  loadDashboardTable: async () => {
    try {
      const data = await fetchJson('/students');
      const tbody = document.getElementById('recentStudentsBody');
      tbody.innerHTML = data.data.slice(0, 5).map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + s.name + '</td><td>' + s.course + '</td><td>' + s.year + '</td><td>' + s.gpa + '</td><td><span class="status-online">' + s.status + '</span></td><td></td></tr>').join('');
    } catch (err) { console.error(err); }
  },

  loadStudents: async () => {
    try {
      const data = await fetchJson('/students');
      const tbody = document.getElementById('studentsBody');
      tbody.innerHTML = data.data.map(s => '<tr><td>' + s.id + '</td><td>' + s.name + '</td><td>' + s.email + '</td><td>' + s.course + '</td><td>' + s.year + '</td><td>' + s.gpa + '</td><td><span class="status-online">' + s.status + '</span></td><td><button class="btn btn-outline btn-sm" onclick="app.editItem(\'student\',\'' + s.id + '\')">Edit</button> <button class="btn btn-outline btn-sm" style="border-color:var(--neon-red);color:var(--neon-red)" onclick="app.deleteItem(\'student\',\'' + s.id + '\')">Delete</button></td></tr>').join('');
    } catch (err) { console.error(err); }
  },
  loadCourses: async () => {
    try {
      const data = await fetchJson('/courses');
      const tbody = document.getElementById('coursesBody');
      tbody.innerHTML = data.data.map(c => '<tr><td>' + c.id + '</td><td>' + c.code + '</td><td>' + c.name + '</td><td>' + c.credits + '</td><td>' + c.teacher + '</td><td>' + c.capacity + '</td><td>' + c.enrolled + '</td><td><button class="btn btn-outline btn-sm" onclick="app.editItem(\'course\',\'' + c.id + '\')">Edit</button> <button class="btn btn-outline btn-sm" style="border-color:var(--neon-red);color:var(--neon-red)" onclick="app.deleteItem(\'course\',\'' + c.id + '\')">Delete</button></td></tr>').join('');
    } catch (err) { console.error(err); }
  },

  loadTeachers: async () => {
    try {
      const data = await fetchJson('/teachers');
      const tbody = document.getElementById('teachersBody');
      tbody.innerHTML = data.data.map(t => '<tr><td>' + t.id + '</td><td>' + t.name + '</td><td>' + t.email + '</td><td>' + t.subject + '</td><td>' + t.experience + '</td><td>' + t.department + '</td><td><button class="btn btn-outline btn-sm" onclick="app.editItem(\'teacher\',\'' + t.id + '\')">Edit</button> <button class="btn btn-outline btn-sm" style="border-color:var(--neon-red);color:var(--neon-red)" onclick="app.deleteItem(\'teacher\',\'' + t.id + '\')">Delete</button></td></tr>').join('');
    } catch (err) { console.error(err); }
  },

  bindSearch: () => {
    ['student', 'course', 'teacher'].forEach(type => {
      const input = document.getElementById(type + 'Search');
      if (!input) return;
      input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#' + type + 'sBody tr');
        rows.forEach(row => { row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none'; });
      });
    });
  },

  bindModals: () => {
    ['studentForm', 'courseForm', 'teacherForm'].forEach(id => {
      const form = document.getElementById(id);
      if (form) form.addEventListener('submit', (e) => app.handleFormSubmit(e, id));
    });
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalOverlay')) app.closeModal(e);
    });
  },

  openModal: (id) => {
    const modal = document.getElementById(id);
    const overlay = document.getElementById('modalOverlay');
    if (modal) { modal.style.display = 'flex'; modal.classList.add('show'); }
    if (overlay) overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    if (id === 'studentModal') document.getElementById('sName').focus();
    if (id === 'courseModal') document.getElementById('cCode').focus();
    if (id === 'teacherModal') document.getElementById('tName').focus();
  },

  closeModal: (e) => {
    if (e && e.target && e.target.classList && e.target.classList.contains('modal-overlay')) return;
    document.querySelectorAll('.dashboard-modal').forEach(m => { m.style.display = 'none'; m.classList.remove('show'); });
    document.getElementById('modalOverlay').style.display = 'none';
    document.body.style.overflow = '';
    ['studentForm','courseForm','teacherForm'].forEach(id => { const f = document.getElementById(id); if (f) f.reset(); });
    document.getElementById('sId').value = '';
    document.getElementById('cId').value = '';
    document.getElementById('tId').value = '';
    app.editMode = { type: null, id: null };
  },

  editItem: async (type, id) => {
    try {
      let endpoint;
      if (type === 'student') endpoint = '/students';
      else if (type === 'course') endpoint = '/courses';
      else if (type === 'teacher') endpoint = '/teachers';
      const data = await fetchJson(endpoint);
      const item = data.data.find(x => x.id === id);
      if (!item) return;
      app.editMode = { type, id };
      const modalId = type + 'Modal';
      document.getElementById(modalId).querySelector('.modal-title').textContent = 'Edit ' + type.charAt(0).toUpperCase() + type.slice(1);
      if (type === 'student') {
        document.getElementById('sId').value = item.id;
        document.getElementById('sName').value = item.name;
        document.getElementById('sEmail').value = item.email;
        document.getElementById('sCourse').value = item.course;
        document.getElementById('sYear').value = item.year;
        document.getElementById('sGpa').value = item.gpa;
        document.getElementById('sStatus').value = item.status;
      } else if (type === 'course') {
        document.getElementById('cId').value = item.id;
        document.getElementById('cCode').value = item.code;
        document.getElementById('cName').value = item.name;
        document.getElementById('cCredits').value = item.credits;
        document.getElementById('cTeacher').value = item.teacher;
        document.getElementById('cCapacity').value = item.capacity;
        document.getElementById('cEnrolled').value = item.enrolled;
      } else if (type === 'teacher') {
        document.getElementById('tId').value = item.id;
        document.getElementById('tName').value = item.name;
        document.getElementById('tEmail').value = item.email;
        document.getElementById('tSubject').value = item.subject;
        document.getElementById('tExperience').value = item.experience;
        document.getElementById('tDepartment').value = item.department;
      }
      app.openModal(modalId);
    } catch (err) { showToast('Failed to load item', 'error'); }
  },

  deleteItem: async (type, id) => {
    if (!confirm('Delete this item?')) return;
    try {
      let endpoint;
      if (type === 'student') endpoint = '/students';
      else if (type === 'course') endpoint = '/courses';
      else if (type === 'teacher') endpoint = '/teachers';
      await fetchJson(endpoint + '/' + id, { method: 'DELETE' });
      showToast(type + ' deleted', 'success');
      if (app.currentSection === type + 's') app.switchSection(type + 's');
      else if (app.currentSection === 'dashboard') { await app.loadStats(); await app.loadDashboardTable(); }
    } catch (err) { showToast('Delete failed', 'error'); }
  },

  handleFormSubmit: async (e, formId) => {
    e.preventDefault();
    const form = document.getElementById(formId);
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    let type, endpoint, body;
    if (formId === 'studentForm') { type = 'student'; endpoint = '/students'; body = { name: data.sName, email: data.sEmail, course: data.sCourse, year: data.sYear, gpa: data.sGpa, status: data.sStatus }; }
    else if (formId === 'courseForm') { type = 'course'; endpoint = '/courses'; body = { code: data.cCode, name: data.cName, credits: data.cCredits, teacher: data.cTeacher, capacity: data.cCapacity, enrolled: data.cEnrolled }; }
    else if (formId === 'teacherForm') { type = 'teacher'; endpoint = '/teachers'; body = { name: data.tName, email: data.tEmail, subject: data.tSubject, experience: data.tExperience, department: data.tDepartment }; }
    const isEdit = app.editMode.type === type && app.editMode.id;
    try {
      if (isEdit) {
        await fetchJson(endpoint + '/' + app.editMode.id, { method: 'PUT', body: JSON.stringify(body) });
        showToast(type + ' updated', 'success');
      } else {
        await fetchJson(endpoint, { method: 'POST', body: JSON.stringify(body) });
        showToast(type + ' added', 'success');
      }
      app.closeModal();
      if (app.currentSection === type + 's') app.switchSection(type + 's');
      else if (app.currentSection === 'dashboard') { await app.loadStats(); await app.loadDashboardTable(); }
    } catch (err) { showToast(err.message || 'Save failed', 'error'); }
  }
};

document.addEventListener('DOMContentLoaded', app.init);
