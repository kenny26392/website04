const requestApi = async (url, options = {}) => {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
};

const displayNotice = (form, message, type = 'success') => {
  const notice = form.parentElement.querySelector('.notice');
  if (!notice) return;
  notice.textContent = message;
  notice.className = `notice show ${type}`;
};

document.querySelectorAll('.menu-toggle').forEach(button => button.addEventListener('click', () => {
  button.parentElement.querySelector('.site-nav').classList.toggle('open');
}));

document.querySelectorAll('.site-nav').forEach(nav => {
  if (!nav.querySelector('[href="account.html"]')) nav.insertAdjacentHTML('beforeend', '<a href="account.html">Account</a>');
});

document.querySelectorAll('.dashboard-tabs button').forEach(button => button.addEventListener('click', () => {
  const root = button.closest('.dashboard');
  root.querySelectorAll('.dashboard-tabs button,.tab-panel').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  root.querySelector(`#${button.dataset.tab}`).classList.add('selected');
}));

const signupForm = document.querySelector('form:has(#confirm-password)');
if (signupForm) signupForm.addEventListener('submit', async event => {
  event.preventDefault();
  const name = signupForm.querySelector('#name').value.trim();
  const email = signupForm.querySelector('#email').value.trim();
  const password = signupForm.querySelector('#password').value;
  if (password !== signupForm.querySelector('#confirm-password').value) return displayNotice(signupForm, 'Passwords do not match.', 'error');
  try {
    const data = await requestApi('/api/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    signupForm.reset(); displayNotice(signupForm, data.message);
  } catch (error) { displayNotice(signupForm, error.message, 'error'); }
});

const loginForm = document.querySelector('form:has(#login-password)');
if (loginForm) loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const data = await requestApi('/api/login', { method: 'POST', body: JSON.stringify({ email: loginForm.querySelector('#email').value.trim(), password: loginForm.querySelector('#login-password').value }) });
    window.location.href = data.user.role === 'admin' ? 'admin.html' : 'account.html';
  } catch (error) { displayNotice(loginForm, error.message, 'error'); }
});

const contactForm = document.querySelector('form:has(#message)');
if (contactForm) contactForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const data = await requestApi('/api/contact', { method: 'POST', body: JSON.stringify({ name: contactForm.querySelector('#name').value.trim(), email: contactForm.querySelector('#email').value.trim(), topic: contactForm.querySelector('#topic').value, message: contactForm.querySelector('#message').value.trim() }) });
    contactForm.reset(); displayNotice(contactForm, data.message);
  } catch (error) { displayNotice(contactForm, error.message, 'error'); }
});

const accountPage = document.querySelector('.dashboard-page .dashboard:not(.admin-dashboard)');
if (accountPage && !document.querySelector('.admin-note')) {
  requestApi('/api/me').then(({ user }) => {
    const name = document.querySelector('#full-name'), email = document.querySelector('#account-email');
    if (name) name.value = user.fullName;
    if (email) { email.value = user.email; email.disabled = true; }
    const reminder = document.querySelector('input[type="checkbox"]');
    if (reminder) reminder.checked = user.courseReminders;
    const announcement = document.querySelectorAll('input[type="checkbox"]')[1];
    if (announcement) announcement.checked = user.courseAnnouncements;
    const level = document.querySelector('#learning-level'); if (level) level.value = user.learningLevel;
    document.querySelectorAll('.account-summary p').forEach(item => item.textContent = user.role === 'admin' ? 'Administrator' : 'Future Cyber Defender');
  }).catch(() => { window.location.href = 'login.html'; });
  const profileButton = document.querySelector('[data-label="Save profile"]');
  if (profileButton) profileButton.addEventListener('click', async () => {
    try { await requestApi('/api/account/profile', { method: 'PATCH', body: JSON.stringify({ name: document.querySelector('#full-name').value }) }); profileButton.textContent = 'Saved ✓'; } catch (error) { alert(error.message); }
  });
  const preferencesButton = document.querySelector('[data-label="Save preferences"]');
  if (preferencesButton) preferencesButton.addEventListener('click', async () => {
    const boxes = document.querySelectorAll('input[type="checkbox"]');
    try { await requestApi('/api/account/preferences', { method: 'PATCH', body: JSON.stringify({ courseReminders: boxes[0].checked, courseAnnouncements: boxes[1].checked, learningLevel: document.querySelector('#learning-level').value }) }); preferencesButton.textContent = 'Saved ✓'; } catch (error) { alert(error.message); }
  });
  const passwordButton = document.querySelector('[data-label="Update password"]');
  if (passwordButton) passwordButton.addEventListener('click', async () => {
    try { await requestApi('/api/account/password', { method: 'PATCH', body: JSON.stringify({ currentPassword: document.querySelector('#current-password').value, newPassword: document.querySelector('#new-password').value }) }); passwordButton.textContent = 'Saved ✓'; } catch (error) { alert(error.message); }
  });
}

document.querySelectorAll('input[type="checkbox"]').forEach(box => { box.style.width = 'auto'; box.style.marginRight = '9px'; box.parentElement.style.display = 'flex'; box.parentElement.style.alignItems = 'center'; box.parentElement.style.marginBottom = '13px'; });

const adminTable = document.querySelector('.admin-note') && document.querySelector('.data-table tbody');
if (adminTable) {
  requestApi('/api/admin/users').then(({ users }) => {
    adminTable.innerHTML = users.map(user => `<tr><td>${user.fullName}</td><td>${user.email}</td><td><span class="role">${user.role}</span></td><td>${user.verified ? 'Yes' : 'No'}</td><td><span class="status">${user.active ? 'Active' : 'Disabled'}</span></td><td><button class="small-action user-toggle" data-id="${user.id}" data-active="${user.active}">${user.active ? 'Disable' : 'Enable'}</button></td></tr>`).join('');
    adminTable.querySelectorAll('.user-toggle').forEach(button => button.addEventListener('click', async () => {
      try {
        await requestApi(`/api/admin/users/${button.dataset.id}`, { method: 'PATCH', body: JSON.stringify({ active: button.dataset.active !== 'true' }) });
        window.location.reload();
      } catch (error) { alert(error.message); }
    }));
  }).catch(() => { window.location.href = 'login.html'; });
}

const uploadForm = document.querySelector('#learning-file-form');
if (uploadForm) uploadForm.addEventListener('submit', async event => {
  event.preventDefault();
  const notice = document.querySelector('#upload-notice');
  const response = await fetch('/api/admin/learning-files', {
    method: 'POST', body: new FormData(uploadForm),
  });
  const data = await response.json().catch(() => ({}));
  notice.textContent = data.message || data.error || 'Upload failed.';
  notice.className = `notice show ${response.ok ? '' : 'error'}`;
  if (response.ok) uploadForm.reset();
});
