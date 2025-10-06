// Enhanced To-Do List Application with Water Physics and History
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentDay = 'today';
        this.isDarkMode = this.loadTheme();
        this.historyPeriod = 'week';
        
        this.soundPlayer = new SoundPlayer();
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeWaterPhysics();
        this.updateUI();
        this.updateDate();
        this.updateStats();
        
        this.pomodoroTimer = new PomodoroTimer(this.soundPlayer);
        this.ambientPlayer = new AmbientPlayer(this.soundPlayer);
        
        this.soundPlayer.play('websiteOpen', 20);
    }

    initializeElements() {
        this.themeToggle = document.getElementById('themeToggle');
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.editingAnimation = document.getElementById('editingAnimation');
        this.currentDayElement = document.getElementById('currentDay');
        this.currentDateElement = document.getElementById('currentDate');
        this.pillButtons = document.querySelectorAll('.pill-btn');
        this.historySection = document.getElementById('historySection');
        this.currentDaySection = document.getElementById('currentDaySection');
        this.historyContent = document.getElementById('historyContent');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.userNameEl = document.getElementById('userName');
        
        // Stats elements
        this.totalTasksElement = document.getElementById('totalTasks');
        this.completedTasksElement = document.getElementById('completedTasks');
        this.remainingTasksElement = document.getElementById('remainingTasks');
        this.yesterdayCountElement = document.getElementById('yesterdayCount');
        this.todayCountElement = document.getElementById('todayCount');
        this.tomorrowCountElement = document.getElementById('tomorrowCount');
    }

    initializeEventListeners() {
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Add task
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Task input focus
        this.taskInput.addEventListener('focus', () => this.showEditingAnimation());
        this.taskInput.addEventListener('blur', () => this.hideEditingAnimation());
        
        // Pill navigation
        this.pillButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = e.target.closest('.pill-btn').dataset.day;
                this.switchDay(day);
            });
        });
        
        // History filters
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.switchHistoryPeriod(period);
            });
        });
        // Editable username
        if (this.userNameEl) {
            const saved = localStorage.getItem('todoUserName');
            if (saved && saved.trim()) this.userNameEl.textContent = saved.trim();
            this.userNameEl.addEventListener('input', () => this.queueNameSave());
            this.userNameEl.addEventListener('blur', () => this.saveNameNow());
            this.userNameEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.userNameEl.blur(); }
            });
        }
        
        // Scroll and pointer events for water physics
        window.addEventListener('resize', () => this.updateWaterPhysics());
        this.initPointerInteractions();
    }

    // Debounced saving of the editable name
    queueNameSave() {
        clearTimeout(this._nameTimer);
        this._nameTimer = setTimeout(() => this.saveNameNow(), 400);
    }

    saveNameNow() {
        if (!this.userNameEl) return;
        const name = this.userNameEl.textContent.replace(/\s+/g, ' ').trim();
        const sanitized = name.slice(0, 36);
        if (!sanitized) {
            this.userNameEl.textContent = ' ';
            localStorage.setItem('todoUserName', ' ');
            return;
        }
        this.userNameEl.textContent = sanitized;
        localStorage.setItem('todoUserName', sanitized);
    }

    initializeWaterPhysics() {
        this.waterGlow = document.getElementById('waterGlow');
        this.waterOrb = document.querySelector('.water-orb');
    }

    updateWaterPhysics() {
        // No longer needed as the bubble is anchored
    }

    initPointerInteractions() {
        if (!this.waterGlow) return;
        this.waterGlow.addEventListener('mouseenter', () => {
            if (this.waterOrb) {
                this.waterOrb.style.transform = 'scale(1.1)';
                this.createRipple();
            }
        });
        this.waterGlow.addEventListener('mouseleave', () => {
            if (this.waterOrb) this.waterOrb.style.transform = 'scale(1)';
        });
    }

    createRipple() {
        const ripple = document.createElement('div');
        ripple.className = 'water-ripple';
        this.waterOrb.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    // Theme Management
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        this.themeToggle.classList.toggle('active', this.isDarkMode);
        this.saveTheme();
    }

    loadTheme() {
        const saved = localStorage.getItem('todoTheme');
        return saved === 'dark';
    }

    saveTheme() {
        localStorage.setItem('todoTheme', this.isDarkMode ? 'dark' : 'light');
    }

    // Task Management
    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        this.soundPlayer.play('taskAdd');
        const now = new Date();
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            day: this.currentDay,
            createdAt: now.toISOString(),
            completedAt: null,
            timeAdded: now.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            })
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.taskInput.value = '';
        this.hideEditingAnimation();
        
        // Add animation effect
        this.animateTaskAddition();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();

            const allTasksCompleted = this.getCurrentDayTasks().every(t => t.completed);
            if (allTasksCompleted) {
                this.soundPlayer.play('allTasksFinished');
            } else {
                this.soundPlayer.stop('allTasksFinished');
            }
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
    }

    // Day Management
    switchDay(day) {
        this.currentDay = day;
        this.updateDayDisplay();
        this.updatePillButtons();
        
        if (day === 'history') {
            this.showHistory();
        } else {
            this.showCurrentDay();
            this.renderTasks();
        }
        
        this.updateStats();
    }

    updateDayDisplay() {
        const dayNames = {
            'yesterday': 'YESTERDAY',
            'today': 'TODAY',
            'tomorrow': 'TOMORROW',
            'history': 'HISTORY'
        };
        
        this.currentDayElement.textContent = dayNames[this.currentDay] || 'TODAY';
    }

    updatePillButtons() {
        this.pillButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.day === this.currentDay);
        });
    }

    showHistory() {
        this.currentDaySection.style.display = 'none';
        this.historySection.style.display = 'block';
        this.renderHistory();
    }

    showCurrentDay() {
        this.currentDaySection.style.display = 'block';
        this.historySection.style.display = 'none';
    }

    // History Management
    switchHistoryPeriod(period) {
        this.historyPeriod = period;
        this.updateFilterButtons();
        this.renderHistory();
    }

    updateFilterButtons() {
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === this.historyPeriod);
        });
    }

    renderHistory() {
        const historyData = this.getHistoryData();
        
        if (historyData.length === 0) {
            this.historyContent.innerHTML = `
                <div class="empty-state">
                    <p>No history available for this period</p>
                    <p class="empty-hint">Complete some tasks to see your progress!</p>
                </div>
            `;
            return;
        }

        this.historyContent.innerHTML = historyData.map(dayData => `
            <div class="history-day">
                <div class="history-day-header">
                    <h3 class="history-day-name">${dayData.dayName}</h3>
                    <div class="history-day-stats">
                        <span>${dayData.total} total</span>
                        <span>${dayData.completed} completed</span>
                        <span>${dayData.remaining} remaining</span>
                    </div>
                </div>
                <div class="history-tasks">
                    ${dayData.tasks.map(task => `
                        <div class="history-task ${task.completed ? 'completed' : ''}">
                            <span class="history-task-text">${this.escapeHtml(task.text)}</span>
                            <span class="history-task-time">${task.timeAdded}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    getHistoryData() {
        const now = new Date();
        const days = [];
        
        let startDate, endDate;
        
        switch (this.historyPeriod) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                endDate = now;
                break;
            case 'all':
                startDate = new Date(0);
                endDate = now;
                break;
        }
        
        // Group tasks by day
        const tasksByDay = {};
        
        this.tasks.forEach(task => {
            const taskDate = new Date(task.createdAt);
            if (taskDate >= startDate && taskDate <= endDate) {
                const dayKey = taskDate.toDateString();
                if (!tasksByDay[dayKey]) {
                    tasksByDay[dayKey] = [];
                }
                tasksByDay[dayKey].push(task);
            }
        });
        
        // Convert to array and sort
        return Object.keys(tasksByDay)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(dayKey => {
                const dayTasks = tasksByDay[dayKey];
                const dayDate = new Date(dayKey);
                const dayName = dayDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                return {
                    dayName,
                    tasks: dayTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
                    total: dayTasks.length,
                    completed: dayTasks.filter(t => t.completed).length,
                    remaining: dayTasks.filter(t => !t.completed).length
                };
        });
    }

    // UI Updates
    renderTasks() {
        const currentDayTasks = this.getCurrentDayTasks();
        
        if (currentDayTasks.length === 0) {
            this.taskList.innerHTML = `
                <div class="empty-state">
                    <p>No tasks for ${this.getDayDisplayName()}</p>
                    <p class="empty-hint">Add a task above to get started!</p>
                </div>
            `;
            return;
        }

        this.taskList.innerHTML = currentDayTasks.map(task => `
            <div class="task-item" data-task-id="${task.id}" draggable="true">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="todoApp.toggleTask(${task.id})"></div>
                <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</span>
                <span class="task-time">${task.timeAdded}</span>
                <button class="task-delete" onclick="todoApp.deleteTask(${task.id})" aria-label="Delete">Delete</button>
            </div>
        `).join('');

        // Enable drag & drop reordering
        this.enableDragAndDrop();
    }

    enableDragAndDrop() {
        const items = this.taskList.querySelectorAll('.task-item');
        let dragSrcEl = null;
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                dragSrcEl = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.dataset.taskId);
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.persistOrder();
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const dragging = this.taskList.querySelector('.dragging');
                if (!dragging || dragging === item) return;
                const rect = item.getBoundingClientRect();
                const offset = e.clientY - rect.top;
                const insertBefore = offset < rect.height / 2;
                if (insertBefore) {
                    this.taskList.insertBefore(dragging, item);
                } else {
                    this.taskList.insertBefore(dragging, item.nextSibling);
                }
            });
        });
    }

    persistOrder() {
        const idsInDom = Array.from(this.taskList.querySelectorAll('.task-item')).map(el => parseInt(el.dataset.taskId, 10));
        const currentTasks = this.getCurrentDayTasks();
        const otherTasks = this.tasks.filter(t => !currentTasks.includes(t));
        const idToTask = new Map(currentTasks.map(t => [t.id, t]));
        const reordered = idsInDom.map(id => idToTask.get(id)).filter(Boolean);
        this.tasks = [...otherTasks, ...reordered];
        this.saveTasks();
        this.updateStats();
    }

    getCurrentDayTasks() {
        if (this.currentDay === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return this.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate.toDateString() === yesterday.toDateString();
            });
        } else if (this.currentDay === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate.toDateString() === tomorrow.toDateString();
            });
        } else {
            const today = new Date();
            return this.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate.toDateString() === today.toDateString();
            });
        }
    }

    getDayDisplayName() {
        const names = {
            'yesterday': 'Yesterday',
            'today': 'Today',
            'tomorrow': 'Tomorrow'
        };
        return names[this.currentDay] || 'Today';
    }

    updateStats() {
        const yesterdayTasks = this.getTasksForDay('yesterday');
        const todayTasks = this.getTasksForDay('today');
        const tomorrowTasks = this.getTasksForDay('tomorrow');
        const currentTasks = this.getCurrentDayTasks();
        
        // Update pill counts
        this.yesterdayCountElement.textContent = yesterdayTasks.length;
        this.todayCountElement.textContent = todayTasks.length;
        this.tomorrowCountElement.textContent = tomorrowTasks.length;
        
        // Update current day stats
        const total = currentTasks.length;
        const completed = currentTasks.filter(t => t.completed).length;
        const remaining = total - completed;
        
        this.totalTasksElement.textContent = total;
        this.completedTasksElement.textContent = completed;
        this.remainingTasksElement.textContent = remaining;
    }

    getTasksForDay(day) {
        if (day === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return this.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate.toDateString() === yesterday.toDateString();
            });
        } else if (day === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate.toDateString() === tomorrow.toDateString();
            });
        } else {
            const today = new Date();
            return this.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate.toDateString() === today.toDateString();
            });
        }
    }

    showEditingAnimation() {
        this.editingAnimation.classList.add('active');
    }

    hideEditingAnimation() {
        setTimeout(() => {
            this.editingAnimation.classList.remove('active');
        }, 1000);
    }

    animateTaskAddition() {
        const taskItems = this.taskList.querySelectorAll('.task-item');
        const lastTask = taskItems[taskItems.length - 1];
        if (lastTask) {
            lastTask.style.transform = 'scale(0.8)';
            lastTask.style.opacity = '0';
            setTimeout(() => {
                lastTask.style.transition = 'all 0.3s ease';
                lastTask.style.transform = 'scale(1)';
                lastTask.style.opacity = '1';
            }, 50);
        }
    }

    updateUI() {
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        this.themeToggle.classList.toggle('active', this.isDarkMode);
        this.updateDayDisplay();
        this.updatePillButtons();
        this.updateFilterButtons();
        this.renderTasks();
        this.updateStats();
    }

    updateDate() {
        const now = new Date();
        const options = { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        const dateString = now.toLocaleDateString('en-US', options);
        this.currentDateElement.textContent = dateString;
    }

    // Data Persistence
    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        if (saved) {
            return JSON.parse(saved);
        } else {
            return this.getDefaultTasks();
        }
    }

    getDefaultTasks() {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return [
            {
                id: 1,
                text: '5km run',
                completed: true,
                day: 'today',
                createdAt: now.toISOString(),
                completedAt: now.toISOString(),
                timeAdded: now.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                })
            },
            {
                id: 2,
                text: 'Read 10 pages',
                completed: false,
                day: 'today',
                createdAt: now.toISOString(),
                completedAt: null,
                timeAdded: now.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                })
            },
            {
                id: 3,
                text: 'Walk the dog',
                completed: false,
                day: 'today',
                createdAt: now.toISOString(),
                completedAt: null,
                timeAdded: now.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                })
            },
            {
                id: 4,
                text: 'Get groceries',
                completed: false,
                day: 'today',
                createdAt: now.toISOString(),
                completedAt: null,
                timeAdded: now.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                })
            },
            {
                id: 5,
                text: 'Design a to-do app',
                completed: false,
                day: 'today',
                createdAt: now.toISOString(),
                completedAt: null,
                timeAdded: now.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                })
            }
        ];
    }

    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

class PomodoroTimer {
    constructor(soundPlayer) {
        this.soundPlayer = soundPlayer;
        this.container = document.getElementById('pomodoroContainer');
        this.header = document.getElementById('pomodoroHeader');
        this.timeDisplay = document.getElementById('pomodoroTime');
        this.playPauseBtn = document.getElementById('pomodoroPlayPause');
        this.resetBtn = document.getElementById('pomodoroReset');
        this.settingsBtn = document.getElementById('pomodoroSettings');
        this.settingsPanel = document.getElementById('pomodoroSettingsPanel');
        this.pinBtn = document.getElementById('pomodoroPin');
        this.closeBtn = document.getElementById('pomodoroClose');
        
        this.durationInput = document.getElementById('pomodoroDuration');
        this.shortBreakInput = document.getElementById('shortBreakDuration');
        this.longBreakInput = document.getElementById('longBreakDuration');
        
        this.progressCircle = document.querySelector('.pomodoro-progress');
        this.radius = this.progressCircle.r.baseVal.value;
        this.circumference = this.radius * 2 * Math.PI;
        this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;

        this.state = 'idle'; // idle, focus, shortBreak, longBreak
        this.timer = null;
        this.timeLeft = 0;
        this.totalTime = 0;
        this.pomodoros = 0;
        
        this.loadSettings();
        this.reset();
        this.initEventListeners();
    }

    initEventListeners() {
        this.playPauseBtn.addEventListener('click', () => {
            if (this.state === 'idle' || this.state === 'paused') {
                this.start();
            } else {
                this.pause();
            }
        });
        
        this.resetBtn.addEventListener('click', () => this.reset());
        this.settingsBtn.addEventListener('click', () => this.toggleSettings());
        this.pinBtn.addEventListener('click', () => this.togglePin());
        this.closeBtn.addEventListener('click', () => this.container.style.display = 'none');
        
        this.durationInput.addEventListener('change', () => this.saveSettings());
        this.shortBreakInput.addEventListener('change', () => this.saveSettings());
        this.longBreakInput.addEventListener('change', () => this.saveSettings());
        
        this.makeDraggable();
    }
    
    start() {
        if (this.state === 'idle') {
            this.state = 'focus';
            this.timeLeft = this.duration * 60;
            this.totalTime = this.timeLeft;
            this.soundPlayer.play('timerStart', 5);
        }
        
        this.playPauseBtn.textContent = '⏸️';
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            if (this.timeLeft <= 0) {
                this.nextState();
            }
        }, 1000);
    }
    
    pause() {
        clearInterval(this.timer);
        this.state = 'paused';
        this.playPauseBtn.textContent = '▶️';
    }
    
    reset() {
        clearInterval(this.timer);
        this.state = 'idle';
        this.timeLeft = this.duration * 60;
        this.totalTime = this.timeLeft;
        this.pomodoros = 0;
        this.updateDisplay();
        this.playPauseBtn.textContent = '▶️';
    }
    
    nextState() {
        clearInterval(this.timer);
        
        if (this.state === 'focus') {
            this.pomodoros++;
            this.soundPlayer.play('timerStart', 5);
            if (this.pomodoros % 4 === 0) {
                this.state = 'longBreak';
                this.timeLeft = this.longBreak * 60;
            } else {
                this.state = 'shortBreak';
                this.timeLeft = this.shortBreak * 60;
            }
            this.soundPlayer.play('timerStart', 5);
        } else {
            this.state = 'focus';
            this.timeLeft = this.duration * 60;
            this.soundPlayer.play('timerStart', 5);
        }
        
        this.totalTime = this.timeLeft;
        this.updateDisplay();
        this.start();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        const offset = this.circumference - (this.timeLeft / this.totalTime) * this.circumference;
        this.progressCircle.style.strokeDashoffset = offset;
    }
    
    toggleSettings() {
        this.settingsPanel.style.display = this.settingsPanel.style.display === 'block' ? 'none' : 'block';
    }
    
    togglePin() {
        this.container.classList.toggle('pinned');
        this.pinBtn.classList.toggle('pinned');
    }
    
    saveSettings() {
        this.duration = parseInt(this.durationInput.value);
        this.shortBreak = parseInt(this.shortBreakInput.value);
        this.longBreak = parseInt(this.longBreakInput.value);
        
        localStorage.setItem('pomodoroSettings', JSON.stringify({
            duration: this.duration,
            shortBreak: this.shortBreak,
            longBreak: this.longBreak
        }));
        
        this.reset();
    }
    
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('pomodoroSettings'));
        
        this.duration = settings?.duration || 25;
        this.shortBreak = settings?.shortBreak || 5;
        this.longBreak = settings?.longBreak || 15;
        
        this.durationInput.value = this.duration;
        this.shortBreakInput.value = this.shortBreak;
        this.longBreakInput.value = this.longBreak;
    }
    
    makeDraggable() {
        let isDragging = false;
        let offsetX, offsetY;

        const onMouseMove = (e) => {
            if (!isDragging) return;
            this.container.style.left = `${e.clientX - offsetX}px`;
            this.container.style.top = `${e.clientY - offsetY}px`;
        };
        
        const onMouseUp = () => {
            isDragging = false;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        this.header.addEventListener('mousedown', (e) => {
            if (this.container.classList.contains('pinned')) return;
            isDragging = true;
            offsetX = e.clientX - this.container.offsetLeft;
            offsetY = e.clientY - this.container.offsetTop;
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
}

class AmbientPlayer {
    constructor(soundPlayer) {
        this.soundPlayer = soundPlayer;
        this.container = document.getElementById('ambientContainer');
        this.header = document.getElementById('ambientHeader');
        this.playPauseBtn = document.getElementById('ambientPlayPause');
        this.volumeSlider = document.getElementById('ambientVolume');
        this.soundBtns = document.querySelectorAll('.ambient-sound');
        this.pinBtn = document.getElementById('ambientPin');
        this.closeBtn = document.getElementById('ambientClose');

        this.currentSound = null;
        this.isPlaying = false;
        
        this.initEventListeners();
        this.makeDraggable();
    }

    initEventListeners() {
        this.playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        });

        this.volumeSlider.addEventListener('input', (e) => {
            this.soundPlayer.setVolume(e.target.value);
        });

        this.soundBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setSound(btn.dataset.sound);
                this.soundBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        this.pinBtn.addEventListener('click', () => this.togglePin());
        this.closeBtn.addEventListener('click', () => this.container.style.display = 'none');
    }

    play() {
        if (this.currentSound) {
            this.soundPlayer.play(this.currentSound, null, true);
            this.isPlaying = true;
            this.playPauseBtn.textContent = '⏸️';
        }
    }

    pause() {
        if (this.currentSound) {
            this.soundPlayer.stop(this.currentSound);
            this.isPlaying = false;
            this.playPauseBtn.textContent = '▶️';
        }
    }

    setSound(soundName) {
        if (this.currentSound) {
            this.pause();
        }
        this.currentSound = soundName;
        this.play();
    }
    
    togglePin() {
        this.container.classList.toggle('pinned');
        this.pinBtn.classList.toggle('pinned');
    }

    makeDraggable() {
        let isDragging = false;
        let offsetX, offsetY;

        const onMouseMove = (e) => {
            if (!isDragging) return;
            this.container.style.left = `${e.clientX - offsetX}px`;
            this.container.style.top = `${e.clientY - offsetY}px`;
        };

        const onMouseUp = () => {
            isDragging = false;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        this.header.addEventListener('mousedown', (e) => {
            if (this.container.classList.contains('pinned')) return;
            
            isDragging = true;
            offsetX = e.clientX - this.container.offsetLeft;
            offsetY = e.clientY - this.container.offsetTop;
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
}

class SoundPlayer {
    constructor() {
        this.sounds = {
            websiteOpen: document.getElementById('websiteOpenSound'),
            taskAdd: document.getElementById('taskAddSound'),
            allTasksFinished: document.getElementById('allTasksFinishedSound'),
            timerStart: document.getElementById('timerStartSound'),
            bird: document.getElementById('birdSound'),
            rain: document.getElementById('rainSound'),
            rainThunder: document.getElementById('rainThunderSound'),
            crickets: document.getElementById('cricketsSound'),
        };
        this.activeSounds = {};
    }

    play(soundName, duration = null, loop = false) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.loop = loop;
            const playPromise = sound.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log(`Autoplay for ${soundName} was prevented by the browser.`);
                    document.body.addEventListener('click', () => sound.play(), { once: true });
                });
            }

            if (duration) {
                if (this.activeSounds[soundName]) {
                    clearTimeout(this.activeSounds[soundName]);
                }
                this.activeSounds[soundName] = setTimeout(() => {
                    sound.pause();
                }, duration * 1000);
            }
        }
    }

    stop(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
            if (this.activeSounds[soundName]) {
                clearTimeout(this.activeSounds[soundName]);
                delete this.activeSounds[soundName];
            }
        }
    }
    
    setVolume(volume) {
        for (const sound in this.sounds) {
            this.sounds[sound].volume = volume;
        }
    }
}


// Initialize the application
let todoApp;

document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
    
    // Update time every minute
    setInterval(() => {
        todoApp.updateDate();
    }, 60000);
    
    // Add some interactive effects
    addInteractiveEffects();
});

// Additional interactive effects
function addInteractiveEffects() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + D to toggle dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            todoApp.toggleTheme();
        }
        
        // Escape to clear input
        if (e.key === 'Escape') {
            todoApp.taskInput.value = '';
            todoApp.taskInput.blur();
        }
        
        // Number keys for quick navigation
        if (e.key >= '1' && e.key <= '4') {
            const dayMap = ['yesterday', 'today', 'tomorrow', 'history'];
            const day = dayMap[parseInt(e.key) - 1];
            if (day) {
                todoApp.switchDay(day);
            }
        }
    });

    // Add smooth scrolling for pill navigation
    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// Add CSS for water ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes rippleExpand {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
        }
    }
    
    .water-ripple {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        border: 2px solid var(--droplet-ripple);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        animation: rippleExpand 0.6s ease-out forwards;
        pointer-events: none;
    }
`;
document.head.appendChild(style);