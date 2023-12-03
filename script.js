
document.addEventListener("DOMContentLoaded", function() {
    const addButton = document.getElementById('addTaskButton');
    const inputField = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');

    addButton.addEventListener('click', addTask);
    taskList.addEventListener('click', toggleTaskCompletion);

    function addTask() {
        const taskText = inputField.value.trim();
        if (taskText) {
            const listItem = document.createElement('li');
            listItem.textContent = taskText;
            taskList.appendChild(listItem);
            inputField.value = '';
            saveTasks();
        }
    }

    function toggleTaskCompletion(event) {
        if (event.target.tagName === 'LI') {
            event.target.classList.toggle('completed');
            saveTasks();
        }
    }

    function saveTasks() {
        const tasks = [];
        taskList.querySelectorAll('li').forEach(task => {
            tasks.push({ text: task.textContent, completed: task.classList.contains('completed') });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        savedTasks.forEach(task => {
            const listItem = document.createElement('li');
            listItem.textContent = task.text;
            if (task.completed) {
                listItem.classList.add('completed');
            }
            taskList.appendChild(listItem);
        });
    }

    loadTasks();
});
