const backendIndicator = document.getElementById('backend-indicator');
const dbIndicator = document.getElementById('db-indicator');
const appVersion = document.getElementById('app-version');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

async function checkHealth() {
    try {
        const response = await fetch('/health/ready');
        if (response.status === 200) {
            backendIndicator.className = 'status-indicator online';
            dbIndicator.className = 'status-indicator online';
        } else if (response.status === 503) {
            backendIndicator.className = 'status-indicator online';
            dbIndicator.className = 'status-indicator offline';
        } else {
            backendIndicator.className = 'status-indicator offline';
            dbIndicator.className = 'status-indicator offline';
        }
    } catch (error) {
        backendIndicator.className = 'status-indicator offline';
        dbIndicator.className = 'status-indicator offline';
    }
}

async function fetchVersion() {
    try {
        const response = await fetch('/api/version');
        if (response.ok) {
            const data = await response.json();
            appVersion.textContent = data.version || 'Unknown';
        } else {
            appVersion.textContent = 'Error';
        }
    } catch (error) {
        appVersion.textContent = 'Offline';
    }
}

async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
            const tasks = await response.json();
            taskList.innerHTML = '';
            if (tasks.length === 0) {
                const li = document.createElement('li');
                li.className = 'loading-item';
                li.textContent = 'No tasks found';
                taskList.appendChild(li);
                return;
            }
            tasks.forEach(task => {
                const li = document.createElement('li');
                const titleSpan = document.createElement('span');
                titleSpan.className = 'task-title';
                titleSpan.textContent = task.title;
                const timeSpan = document.createElement('span');
                timeSpan.className = 'task-time';
                if (task.created_at) {
                    const date = new Date(task.created_at);
                    timeSpan.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                li.appendChild(titleSpan);
                li.appendChild(timeSpan);
                taskList.appendChild(li);
            });
        } else {
            taskList.innerHTML = '<li class="loading-item">Error loading tasks</li>';
        }
    } catch (error) {
        taskList.innerHTML = '<li class="loading-item">Backend unavailable</li>';
    }
}

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title }),
        });
        if (response.ok) {
            taskInput.value = '';
            await fetchTasks();
        }
    } catch (error) {
        alert('Failed to create task');
    }
});

async function init() {
    await checkHealth();
    await fetchVersion();
    await fetchTasks();
    setInterval(checkHealth, 5000);
    setInterval(fetchTasks, 5000);
}

document.addEventListener('DOMContentLoaded', init);
