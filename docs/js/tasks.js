/* ============================================================
   TASKS PAGE JS — Full CRUD for tasks
   ============================================================ */

let tasks = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function () {
    tasks = loadTasks();

    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('task-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') addTask();
    });
    document.getElementById('clear-completed-btn').addEventListener('click', clearCompletedTasks);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    renderTasks();
});

function addTask() {
    const input = document.getElementById('task-input');
    const name = input.value.trim();
    if (!name) return;

    tasks.push({
        id: generateId(),
        name: name,
        completed: false,
        createdAt: Date.now()
    });

    input.value = '';
    saveTasks(tasks);
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks(tasks);
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);
        renderTasks();

        // Kuromi celebration when completing a task
        if (task.completed) {
            const allDone = tasks.every(t => t.completed);
            if (allDone && tasks.length > 0) {
                const q = getQuoteByMood('encourage');
                Swal.fire({
                    title: '<i class="fa-solid fa-heart"></i> All tasks done!',
                    html: `<p>Kuromi is SO proud of you!</p>
                           <p style="font-style:italic; color:#c56cf0; font-size:14px; margin-top:10px">${q.text}</p>`,
                    icon: 'success',
                    confirmButtonColor: '#9b30ff',
                    confirmButtonText: 'Yay! <i class="fa-solid fa-heart" style="color:#cc88ff;"></i>'
                });
            }
        }
    }
}

function startEditTask(id) {
    renderTasks(id);
}

function saveEditTask(id, newName) {
    const task = tasks.find(t => t.id === id);
    if (task && newName.trim()) {
        task.name = newName.trim();
        saveTasks(tasks);
    }
    renderTasks();
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;

    Swal.fire({
        title: 'Clear completed tasks?',
        text: `This will remove ${completedCount} completed task${completedCount > 1 ? 's' : ''}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, clear them!',
        cancelButtonText: 'Cancel'
    }).then(result => {
        if (result.isConfirmed) {
            tasks = tasks.filter(t => !t.completed);
            saveTasks(tasks);
            renderTasks();
        }
    });
}

function renderTasks(editingId) {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    let filtered = tasks;
    if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
    else if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);

    if (filtered.length === 0) {
        list.innerHTML = `<li class="task-empty"><span class="empty-icon"><i class="fa-solid fa-clipboard"></i></span>No tasks yet — add one above!</li>`;
    } else {
        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item' + (task.completed ? ' completed' : '');

            if (editingId === task.id) {
                li.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <input type="text" class="task-edit-input" value="${escapeHtml(task.name)}" maxlength="100">
                    <div class="task-actions">
                        <button class="task-action-btn save-btn" title="Save"><i class="fa-solid fa-floppy-disk"></i></button>
                        <button class="task-action-btn cancel-btn" title="Cancel"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `;
                const editInput = li.querySelector('.task-edit-input');
                li.querySelector('.save-btn').addEventListener('click', () => saveEditTask(task.id, editInput.value));
                li.querySelector('.cancel-btn').addEventListener('click', () => renderTasks());
                editInput.addEventListener('keydown', e => {
                    if (e.key === 'Enter') saveEditTask(task.id, editInput.value);
                    if (e.key === 'Escape') renderTasks();
                });
                li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
                setTimeout(() => { editInput.focus(); editInput.select(); }, 0);
            } else {
                li.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-name">${escapeHtml(task.name)}</span>
                    <div class="task-actions">
                        <button class="task-action-btn edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="task-action-btn delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
                li.querySelector('.edit-btn').addEventListener('click', () => startEditTask(task.id));
                li.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));
            }

            list.appendChild(li);
        });
    }

    const activeCount = tasks.filter(t => !t.completed).length;
    document.getElementById('task-count').textContent =
        `${activeCount} active / ${tasks.length} total`;
}
