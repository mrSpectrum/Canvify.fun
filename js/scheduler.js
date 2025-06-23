/**
 * Event Scheduler for AI Canvas Projects
 * Allows users to create, manage, and track tasks with deadlines
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const schedulerButton = document.getElementById('scheduler-button');
    const schedulerModal = document.getElementById('scheduler-modal');
    const closeScheduler = document.getElementById('close-scheduler');
    const taskForm = document.getElementById('task-form');
    const tasksList = document.getElementById('tasks-list');
    const calendarView = document.getElementById('calendar-view');
    const viewToggle = document.getElementById('view-toggle');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeTaskModal = document.getElementById('close-task-modal');
    const saveTaskBtn = document.getElementById('save-task');
    const cancelTaskBtn = document.getElementById('cancel-task');

    // Task storage
    let tasks = JSON.parse(localStorage.getItem('aiCanvasTasks')) || [];
    let currentView = 'list'; // 'list' or 'calendar'
    let editingTaskId = null;

    // Initialize scheduler
    initScheduler();

    // Event listeners
    schedulerButton?.addEventListener('click', openScheduler);
    closeScheduler?.addEventListener('click', closeSchedulerModal);
    addTaskBtn?.addEventListener('click', openTaskModal);
    closeTaskModal?.addEventListener('click', closeTaskModalHandler);
    saveTaskBtn?.addEventListener('click', saveTask);
    cancelTaskBtn?.addEventListener('click', closeTaskModalHandler);
    viewToggle?.addEventListener('change', toggleView);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === schedulerModal) {
            closeSchedulerModal();
        }
        if (e.target === taskModal) {
            closeTaskModalHandler();
        }
    });

    /**
     * Initialize the scheduler
     */
    function initScheduler() {
        loadTasks();
        renderTasks();
        checkUpcomingDeadlines();
        
        // Check for upcoming deadlines every hour
        setInterval(checkUpcomingDeadlines, 3600000);
    }

    /**
     * Open scheduler modal
     */
    function openScheduler() {
        schedulerModal.style.display = 'flex';
        renderTasks();
    }

    /**
     * Close scheduler modal
     */
    function closeSchedulerModal() {
        schedulerModal.style.display = 'none';
    }

    /**
     * Open task creation/editing modal
     */
    function openTaskModal(taskId = null) {
        editingTaskId = taskId;
        const task = taskId ? tasks.find(t => t.id === taskId) : null;
        
        // Populate form if editing
        if (task) {
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-deadline').value = task.deadline;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-assignee').value = task.assignee;
            document.getElementById('task-status').value = task.status;
            document.querySelector('#task-modal h3').textContent = 'Edit Task';
        } else {
            // Clear form for new task
            document.getElementById('task-title').value = '';
            document.getElementById('task-description').value = '';
            document.getElementById('task-deadline').value = '';
            document.getElementById('task-priority').value = 'medium';
            document.getElementById('task-assignee').value = '';
            document.getElementById('task-status').value = 'pending';
            document.querySelector('#task-modal h3').textContent = 'Add New Task';
        }
        
        taskModal.style.display = 'flex';
        document.getElementById('task-title').focus();
    }

    /**
     * Close task modal
     */
    function closeTaskModalHandler() {
        taskModal.style.display = 'none';
        editingTaskId = null;
    }

    /**
     * Save task (create or update)
     */
    function saveTask() {
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const deadline = document.getElementById('task-deadline').value;
        const priority = document.getElementById('task-priority').value;
        const assignee = document.getElementById('task-assignee').value.trim();
        const status = document.getElementById('task-status').value;

        // Validation
        if (!title) {
            showNotification('Task title is required', true);
            return;
        }

        if (!deadline) {
            showNotification('Deadline is required', true);
            return;
        }

        const taskData = {
            title,
            description,
            deadline,
            priority,
            assignee,
            status,
            createdAt: editingTaskId ? tasks.find(t => t.id === editingTaskId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingTaskId) {
            // Update existing task
            const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
            tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
            showNotification('Task updated successfully!');
        } else {
            // Create new task
            const newTask = {
                id: generateTaskId(),
                ...taskData
            };
            tasks.push(newTask);
            showNotification('Task created successfully!');
        }

        saveTasks();
        renderTasks();
        closeTaskModalHandler();
    }

    /**
     * Delete task
     */
    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
            showNotification('Task deleted successfully!');
        }
    }

    /**
     * Toggle task completion
     */
    function toggleTaskStatus(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            task.updatedAt = new Date().toISOString();
            saveTasks();
            renderTasks();
            showNotification(`Task marked as ${task.status}!`);
        }
    }

    /**
     * Toggle between list and calendar view
     */
    function toggleView() {
        currentView = viewToggle.checked ? 'calendar' : 'list';
        renderTasks();
    }

    /**
     * Render tasks based on current view
     */
    function renderTasks() {
        if (currentView === 'list') {
            renderListView();
            tasksList.style.display = 'block';
            calendarView.style.display = 'none';
        } else {
            renderCalendarView();
            tasksList.style.display = 'none';
            calendarView.style.display = 'block';
        }
    }

    /**
     * Render list view
     */
    function renderListView() {
        if (!tasksList) return;

        // Sort tasks by deadline
        const sortedTasks = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        if (sortedTasks.length === 0) {
            tasksList.innerHTML = '<div class="no-tasks">No tasks scheduled. Click "Add Task" to get started!</div>';
            return;
        }

        tasksList.innerHTML = sortedTasks.map(task => {
            const deadlineDate = new Date(task.deadline);
            const isOverdue = deadlineDate < new Date() && task.status !== 'completed';
            const daysUntilDeadline = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="task-item ${task.status} ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
                    <div class="task-header">
                        <div class="task-title-section">
                            <button class="task-toggle" onclick="window.schedulerModule.toggleTaskStatus('${task.id}')" 
                                    title="${task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}">
                                ${task.status === 'completed' ? '✓' : '○'}
                            </button>
                            <h4 class="task-title ${task.status === 'completed' ? 'completed' : ''}">${task.title}</h4>
                        </div>
                        <div class="task-actions">
                            <span class="task-priority priority-${task.priority}">${task.priority}</span>
                            <button class="task-edit" onclick="window.schedulerModule.openTaskModal('${task.id}')" title="Edit task">✏️</button>
                            <button class="task-delete" onclick="window.schedulerModule.deleteTask('${task.id}')" title="Delete task">🗑️</button>
                        </div>
                    </div>
                    <div class="task-details">
                        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                        <div class="task-meta">
                            <span class="task-deadline ${isOverdue ? 'overdue' : ''}">
                                📅 ${deadlineDate.toLocaleDateString()} 
                                ${isOverdue ? '(Overdue)' : daysUntilDeadline === 0 ? '(Today)' : daysUntilDeadline === 1 ? '(Tomorrow)' : `(${daysUntilDeadline} days)`}
                            </span>
                            ${task.assignee ? `<span class="task-assignee">👤 ${task.assignee}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render calendar view
     */
    function renderCalendarView() {
        if (!calendarView) return;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Month names
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];

        let calendarHTML = `
            <div class="calendar-header">
                <h3>${monthNames[currentMonth]} ${currentYear}</h3>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-header">Sun</div>
                <div class="calendar-day-header">Mon</div>
                <div class="calendar-day-header">Tue</div>
                <div class="calendar-day-header">Wed</div>
                <div class="calendar-day-header">Thu</div>
                <div class="calendar-day-header">Fri</div>
                <div class="calendar-day-header">Sat</div>
        `;

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateString = date.toISOString().split('T')[0];
            const dayTasks = tasks.filter(task => task.deadline.startsWith(dateString));
            const isToday = date.toDateString() === now.toDateString();

            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateString}">
                    <div class="day-number">${day}</div>
                    <div class="day-tasks">
                        ${dayTasks.map(task => `
                            <div class="calendar-task priority-${task.priority} ${task.status}" 
                                 title="${task.title}${task.description ? ': ' + task.description : ''}"
                                 onclick="window.schedulerModule.openTaskModal('${task.id}')">
                                ${task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        calendarHTML += '</div>';
        calendarView.innerHTML = calendarHTML;
    }

    /**
     * Check for upcoming deadlines and show notifications
     */
    function checkUpcomingDeadlines() {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const upcomingTasks = tasks.filter(task => {
            if (task.status === 'completed') return false;
            const deadline = new Date(task.deadline);
            return deadline <= tomorrow && deadline >= now;
        });

        if (upcomingTasks.length > 0) {
            const message = `You have ${upcomingTasks.length} task(s) due soon: ${upcomingTasks.map(t => t.title).join(', ')}`;
            showNotification(message, false, 5000);
        }
    }

    /**
     * Generate unique task ID
     */
    function generateTaskId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Save tasks to localStorage
     */
    function saveTasks() {
        localStorage.setItem('aiCanvasTasks', JSON.stringify(tasks));
    }

    /**
     * Load tasks from localStorage
     */
    function loadTasks() {
        const savedTasks = localStorage.getItem('aiCanvasTasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
    }

    /**
     * Export tasks to JSON
     */
    function exportTasks() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'ai-canvas-tasks-' + new Date().toISOString().slice(0, 10) + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        showNotification('Tasks exported successfully!');
    }

    /**
     * Import tasks from JSON file
     */
    function importTasks() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) {
                document.body.removeChild(fileInput);
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedTasks = JSON.parse(e.target.result);
                    
                    if (Array.isArray(importedTasks)) {
                        if (confirm(`Import ${importedTasks.length} tasks? This will replace your current tasks.`)) {
                            tasks = importedTasks;
                            saveTasks();
                            renderTasks();
                            showNotification('Tasks imported successfully!');
                        }
                    } else {
                        showNotification('Invalid task file format', true);
                    }
                } catch (parseError) {
                    showNotification('Error parsing task file: ' + parseError.message, true);
                }
                document.body.removeChild(fileInput);
            };

            reader.onerror = function() {
                showNotification('Error reading file', true);
                document.body.removeChild(fileInput);
            };

            reader.readAsText(file);
        };

        fileInput.click();
    }

    // Expose functions to global scope for onclick handlers
    window.schedulerModule = {
        openTaskModal,
        deleteTask,
        toggleTaskStatus,
        exportTasks,
        importTasks
    };

    // Show notification function (reuse from main script)
    function showNotification(message, isError = false, duration = 3000) {
        const notificationDiv = document.getElementById('notification');
        if (notificationDiv) {
            notificationDiv.textContent = message;
            notificationDiv.className = `notification ${isError ? 'error' : 'success'} show`;
            
            setTimeout(() => {
                notificationDiv.className = 'notification';
            }, duration);
        }
    }
});