// Enhanced To-Do List Application with Water Physics and History
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentDay = 'today';
        this.isDarkMode = this.loadTheme();
        
        this.soundPlayer = new SoundPlayer();
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeWaterPhysics();
        this.updateUI();
        this.updateDate();
        this.updateStats();
        
        this.pomodoroTimer = new PomodoroTimer(this.soundPlayer);
        this.ambientPlayer = new AmbientPlayer(this.soundPlayer);
        
        this.checkDate();
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
        this.userNameEl = document.getElementById('userName');
        
        // Stats elements
        this.totalTasksElement = document.getElementById('totalTasks');
        this.completedTasksElement = document.getElementById('completedTasks');
        this.remainingTasksElement = document.getElementById('remainingTasks');
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
        
        // Editable username
        if (this.userNameEl) {
            const saved = localStorage.getItem('todoUserName');
            if (saved && saved.trim()) this.userNameEl.textContent = saved.trim();
            // FIXED: Removed the 'input' event listener that caused the cursor bug.
            this.userNameEl.addEventListener('blur', () => this.saveNameNow());
            this.userNameEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.userNameEl.blur(); }
            });
        }
        
        // Scroll and pointer events for water physics
        window.addEventListener('resize', () => this.updateWaterPhysics());
        this.initPointerInteractions();
    }

    saveNameNow() {
        if (!this.userNameEl) return;
        const name = this.userNameEl.textContent.replace(/\s+/g, ' ').trim();
        const sanitized = name.slice(0, 36);
        if (!sanitized) {
            this.userNameEl.textContent = 'Shayaan'; // Default name if empty
            localStorage.setItem('todoUserName', 'Shayaan');
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

        const now = new Date();
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            day: this.currentDay,
            createdAt: now.toISOString()
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

    editTask(taskId, newText) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.text = newText.trim();
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Day Management
    switchDay(day) {
        this.currentDay = day;
        this.updateDayDisplay();
        this.updatePillButtons();
        this.renderTasks();
        this.updateStats();
    }

    updateDayDisplay() {
        const dayNames = {
            'today': 'TODAY',
            'tomorrow': 'TOMORROW'
        };
        
        this.currentDayElement.textContent = dayNames[this.currentDay] || 'TODAY';
    }

    updatePillButtons() {
        this.pillButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.day === this.currentDay);
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
                <span class="task-text ${task.completed ? 'completed' : ''}" contenteditable="true" onblur="todoApp.editTask(${task.id}, this.textContent)">${this.escapeHtml(task.text)}</span>
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
        return this.tasks.filter(task => task.day === this.currentDay);
    }

    getDayDisplayName() {
        const names = {
            'today': 'Today',
            'tomorrow': 'Tomorrow'
        };
        return names[this.currentDay] || 'Today';
    }

    updateStats() {
        const todayTasks = this.tasks.filter(task => task.day === 'today');
        const tomorrowTasks = this.tasks.filter(task => task.day === 'tomorrow');
        const currentTasks = this.getCurrentDayTasks();
        
        // Update pill counts
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
        return saved ? JSON.parse(saved) : [];
    }
    
    checkDate() {
        const lastVisit = localStorage.getItem('lastVisit');
        const today = new Date().toDateString();
        
        if (lastVisit !== today) {
            this.tasks.forEach(task => {
                if (task.day === 'tomorrow') {
                    task.day = 'today';
                }
            });
            this.saveTasks();
        }
        
        localStorage.setItem('lastVisit', today);
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

        this.state = 'idle'; // idle, running, paused
        this.mode = 'focus'; // focus, shortBreak, longBreak
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
            if (this.state === 'running') {
                this.pause();
            } else {
                this.start();
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
            this.timeLeft = this.duration * 60;
            this.totalTime = this.timeLeft;
        }

        this.state = 'running';
        this.playPauseBtn.textContent = '⏸️';
        this.soundPlayer.play('timerStart');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            if (this.timeLeft <= 0) {
                this.nextMode();
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
        this.mode = 'focus';
        this.timeLeft = this.duration * 60;
        this.totalTime = this.timeLeft;
        this.pomodoros = 0;
        this.updateDisplay();
        this.playPauseBtn.textContent = '▶️';
    }
    
    nextMode() {
        clearInterval(this.timer);
        this.soundPlayer.play('timerStart');
        
        if (this.mode === 'focus') {
            this.pomodoros++;
            if (this.pomodoros % 4 === 0) {
                this.mode = 'longBreak';
                this.timeLeft = this.longBreak * 60;
            } else {
                this.mode = 'shortBreak';
                this.timeLeft = this.shortBreak * 60;
            }
        } else {
            this.mode = 'focus';
            this.timeLeft = this.duration * 60;
        }
        
        this.totalTime = this.timeLeft;
        this.state = 'idle';
        this.updateDisplay();
        this.start();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        const offset = this.circumference - (this.timeLeft / this.totalTime) * this.circumference;
        this.progressCircle.style.strokeDashoffset = isFinite(offset) ? offset : this.circumference;
    }
    
    toggleSettings() {
        this.settingsPanel.style.display = this.settingsPanel.style.display === 'block' ? 'none' : 'block';
    }
    
    togglePin() {
        this.container.classList.toggle('pinned');
        this.pinBtn.classList.toggle('pinned');
    }
    
    saveSettings() {
        this.duration = parseInt(this.durationInput.value) || 25;
        this.shortBreak = parseInt(this.shortBreakInput.value) || 5;
        this.longBreak = parseInt(this.longBreakInput.value) || 15;
        
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
        this.volumeSlider = document.getElementById('ambientVolume');
        this.soundBtns = document.querySelectorAll('.ambient-sound');
        this.pinBtn = document.getElementById('ambientPin');
        this.closeBtn = document.getElementById('ambientClose');

        // NEW: Use a Set to track multiple active sounds
        this.activeSounds = new Set();
        
        this.initEventListeners();
        this.makeDraggable();
    }

    initEventListeners() {
        this.volumeSlider.addEventListener('input', (e) => {
            this.soundPlayer.setVolume(e.target.value);
        });

        // REWRITTEN: New logic for multi-sound toggle
        this.soundBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const soundName = btn.dataset.sound;
                this.toggleSound(soundName, btn);
            });
        });

        this.pinBtn.addEventListener('click', () => this.togglePin());
        this.closeBtn.addEventListener('click', () => this.container.style.display = 'none');
    }

    toggleSound(soundName, btn) {
        if (this.activeSounds.has(soundName)) {
            // Sound is playing, so stop it
            this.soundPlayer.stop(soundName);
            this.activeSounds.delete(soundName);
            btn.classList.remove('active');
        } else {
            // Sound is not playing, so start it
            // The 'true' argument enables looping
            this.soundPlayer.play(soundName, null, true);
            this.activeSounds.add(soundName);
            btn.classList.add('active');
        }
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
            allTasksFinished: document.getElementById('allTasksFinishedSound'),
            timerStart: document.getElementById('timerStartSound'),
            bird: document.getElementById('birdSound'),
            rain: document.getElementById('rainSound'),
            rainThunder: document.getElementById('rainThunderSound'),
            crickets: document.getElementById('cricketsSound'),
            cafe: document.getElementById('cafeSound'),
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
        if (e.key >= '1' && e.key <= '2') {
            const dayMap = ['today', 'tomorrow'];
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