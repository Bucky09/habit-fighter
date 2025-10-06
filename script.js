// Task Manager App
class TaskManager {
  constructor() {
    this.tasks = this.loadTasks();
    this.currentFilter = 'all';
    this.editingTaskId = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderTasks();
    this.renderManageTasks();
    this.checkReminders();
    setInterval(() => this.checkReminders(), 60000);
  }

  setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.filterTasks(e.target.dataset.filter));
    });

    document.getElementById('add-task-btn').addEventListener('click', () => this.showTaskForm());

    document.getElementById('task-form-element').addEventListener('submit', (e) => this.handleFormSubmit(e));

    document.getElementById('cancel-btn').addEventListener('click', () => this.hideTaskForm());

    document.getElementById('task-reminder').addEventListener('change', (e) => {
      document.getElementById('reminder-time-group').classList.toggle('hidden', !e.target.checked);
    });
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabName);
    });
  }

  filterTasks(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    this.renderTasks();
  }

  showTaskForm(task = null) {
    const form = document.getElementById('task-form');
    const formTitle = document.getElementById('form-title');

    form.classList.remove('hidden');

    if (task) {
      this.editingTaskId = task.id;
      formTitle.textContent = 'Edit Task';
      document.getElementById('task-id').value = task.id;
      document.getElementById('task-title').value = task.title;
      document.getElementById('task-description').value = task.description || '';
      document.getElementById('task-category').value = task.category;
      document.getElementById('task-reminder').checked = task.reminder;

      if (task.reminder && task.reminderTime) {
        document.getElementById('reminder-time-group').classList.remove('hidden');
        document.getElementById('task-reminder-time').value = task.reminderTime;
      }
    } else {
      this.editingTaskId = null;
      formTitle.textContent = 'Add New Task';
      document.getElementById('task-form-element').reset();
      document.getElementById('reminder-time-group').classList.add('hidden');
    }

    form.scrollIntoView({ behavior: 'smooth' });
  }

  hideTaskForm() {
    document.getElementById('task-form').classList.add('hidden');
    document.getElementById('task-form-element').reset();
    this.editingTaskId = null;
  }

  handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const category = document.getElementById('task-category').value;
    const reminder = document.getElementById('task-reminder').checked;
    const reminderTime = reminder ? document.getElementById('task-reminder-time').value : null;

    if (!title || !category) {
      alert('Please fill in all required fields!');
      return;
    }

    const task = {
      id: this.editingTaskId || Date.now().toString(),
      title,
      description,
      category,
      reminder,
      reminderTime,
      completed: false,
      createdAt: this.editingTaskId
        ? this.tasks.find(t => t.id === this.editingTaskId).createdAt
        : new Date().toISOString()
    };

    if (this.editingTaskId) {
      const index = this.tasks.findIndex(t => t.id === this.editingTaskId);
      this.tasks[index] = task;
    } else {
      this.tasks.push(task);
    }

    this.saveTasks();
    this.renderTasks();
    this.renderManageTasks();
    this.hideTaskForm();

    alert(this.editingTaskId ? 'Task updated successfully!' : 'Task added successfully!');
  }

  deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.saveTasks();
      this.renderTasks();
      this.renderManageTasks();
    }
  }

  toggleComplete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.renderManageTasks();
    }
  }

  renderTasks() {
    const container = document.getElementById('tasks-container');
    const emptyState = document.getElementById('empty-state');

    let filteredTasks = this.tasks;

    if (this.currentFilter !== 'all') {
      filteredTasks = this.tasks.filter(t => t.category === this.currentFilter);
    }

    if (filteredTasks.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = filteredTasks.map(task => `
      <div class="task-card ${task.category} ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <span class="task-category-badge">${this.getCategoryLabel(task.category)}</span>
        <h3>${this.escapeHtml(task.title)}</h3>
        ${task.description ? `<p>${this.escapeHtml(task.description)}</p>` : ''}
        ${task.reminder && task.reminderTime ? `
          <div class="task-reminder">
            ⏰ ${this.formatReminderTime(task.reminderTime)}
          </div>
        ` : ''}
        <div class="task-actions">
          <button class="btn-complete ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            ${task.completed ? '✓ Completed' : '✓ Complete'}
          </button>
        </div>
      </div>
    `).join('');

    // Attach listeners to complete buttons
    document.querySelectorAll('.btn-complete').forEach(btn => {
      const taskId = btn.dataset.taskId;
      const handler = () => this.toggleComplete(taskId);
      btn.addEventListener('click', handler);
      btn.addEventListener('touchstart', handler, { passive: true });
    });
  }

  renderManageTasks() {
    const container = document.getElementById('manage-tasks-container');
    const emptyState = document.getElementById('manage-empty-state');

    if (this.tasks.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = this.tasks.map(task => `
      <div class="manage-task-item ${task.category}">
        <div class="manage-task-info">
          <h4>${this.escapeHtml(task.title)} ${task.completed ? '✓' : ''}</h4>
          ${task.description ? `<p>${this.escapeHtml(task.description)}</p>` : ''}
          <div class="manage-task-meta">
            <span class="meta-item">📁 ${this.getCategoryLabel(task.category)}</span>
            ${task.reminder ? '<span class="meta-item">⏰ Reminder Set</span>' : ''}
            ${task.completed ? '<span class="meta-item">✓ Completed</span>' : ''}
          </div>
        </div>
        <div class="manage-task-actions">
          <button class="btn-edit" data-action="edit" data-task-id="${task.id}">✏️ Edit</button>
          <button class="btn-delete" data-action="delete" data-task-id="${task.id}">🗑️ Delete</button>
        </div>
      </div>
    `).join('');

    // Attach listeners to edit/delete buttons
    document.querySelectorAll('.manage-task-actions button').forEach(btn => {
      const taskId = btn.dataset.taskId;
      const action = btn.dataset.action;

      const handler = () => {
        if (action === 'edit') {
          this.editTask(taskId);
        } else if (action === 'delete') {
          this.deleteTask(taskId);
        }
      };

      btn.addEventListener('click', handler);
      btn.addEventListener('touchstart', handler, { passive: true });
    });
  }

  editTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      this.switchTab('manage');
      setTimeout(() => this.showTaskForm(task), 100);
    }
  }

  checkReminders() {
    const now = new Date();

    this.tasks.forEach(task => {
      if (task.reminder && task.reminderTime && !task.completed) {
        const reminderDate = new Date(task.reminderTime);
        const timeDiff = reminderDate - now;

        if (timeDiff > 0 && timeDiff < 60000) {
          this.showNotification(task);
        }
      }
    });
  }

  showNotification(task) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Habit Fighter Reminder', {
          body: `Time for: ${task.title}`,
          icon: '💪'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Habit Fighter Reminder', {
              body: `Time for: ${task.title}`,
              icon: '💪'
            });
          }
        });
      }
    }

    alert(`⏰ Reminder: ${task.title}`);
  }

  getCategoryLabel(category) {
    const labels = {
      'today': 'Today',
      'this-week': 'This Week',
      'this-month': 'This Month',
      'important': 'Important',
      'general': 'General'
    };
    return labels[category] || category;
  }

  formatReminderTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  saveTasks() {
    localStorage.setItem('habitFighterTasks', JSON.stringify(this.tasks));
  }

  loadTasks() {
    const saved = localStorage.getItem('habitFighterTasks');
    return saved ? JSON.parse(saved) : [];
  }
}

// Initialize the app
const taskManager = new TaskManager();

// Ask for notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
