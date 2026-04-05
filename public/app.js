const API = '/api/todos';
const todoList = document.getElementById('todo-list');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const footer = document.getElementById('footer');
const countEl = document.getElementById('count');
const clearBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

let todos = [];
let currentFilter = 'all';

// API 호출
async function fetchTodos() {
  const res = await fetch(API);
  todos = await res.json();
  render();
}

async function addTodo(text) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (res.ok) {
    todos.push(await res.json());
    render();
  }
}

async function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: !todo.completed })
  });
  if (res.ok) {
    todo.completed = !todo.completed;
    render();
  }
}

async function updateTodoText(id, text) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (res.ok) {
    const todo = todos.find(t => t.id === id);
    todo.text = text;
    render();
  }
}

async function deleteTodo(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (res.ok) {
    todos = todos.filter(t => t.id !== id);
    render();
  }
}

async function clearCompleted() {
  const res = await fetch(API, { method: 'DELETE' });
  if (res.ok) {
    todos = todos.filter(t => !t.completed);
    render();
  }
}

// 렌더링
function render() {
  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  if (todos.length === 0) {
    todoList.innerHTML = '<li class="empty-state">할 일이 없습니다. 위에서 추가해보세요!</li>';
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'flex';

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.length - activeCount;
  countEl.textContent = `남은 할 일: ${activeCount}개`;
  clearBtn.style.display = completedCount > 0 ? 'block' : 'none';

  if (filtered.length === 0) {
    todoList.innerHTML = '<li class="empty-state">해당 항목이 없습니다.</li>';
    return;
  }

  todoList.innerHTML = filtered.map(todo => `
    <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
      <div class="todo-checkbox" onclick="toggleTodo('${todo.id}')"></div>
      <span class="todo-text" ondblclick="startEdit('${todo.id}')">${escapeHtml(todo.text)}</span>
      <button class="todo-delete" onclick="deleteTodo('${todo.id}')">&times;</button>
    </li>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 인라인 수정
function startEdit(id) {
  const todo = todos.find(t => t.id === id);
  const item = document.querySelector(`[data-id="${id}"]`);
  const textEl = item.querySelector('.todo-text');

  const input = document.createElement('input');
  input.className = 'todo-edit-input';
  input.value = todo.text;
  textEl.replaceWith(input);
  input.focus();
  input.select();

  function finishEdit() {
    const newText = input.value.trim();
    if (newText && newText !== todo.text) {
      updateTodoText(id, newText);
    } else {
      render();
    }
  }

  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = todo.text; input.blur(); }
  });
}

// 이벤트
todoForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text) {
    addTodo(text);
    todoInput.value = '';
  }
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

clearBtn.addEventListener('click', clearCompleted);

// 초기 로드
fetchTodos();
