const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));

// 데이터 파일 초기화
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

function readTodos() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeTodos(todos) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

// GET - 전체 할 일 목록
app.get('/api/todos', (req, res) => {
  res.json(readTodos());
});

// POST - 할 일 추가
app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: '할 일 내용을 입력해주세요.' });
  }

  const todos = readTodos();
  const todo = {
    id: Date.now().toString(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  todos.push(todo);
  writeTodos(todos);
  res.status(201).json(todo);
});

// PATCH - 할 일 수정 (텍스트 변경, 완료 토글)
app.patch('/api/todos/:id', (req, res) => {
  const todos = readTodos();
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '할 일을 찾을 수 없습니다.' });

  const { text, completed } = req.body;
  if (text !== undefined) todos[index].text = text.trim();
  if (completed !== undefined) todos[index].completed = completed;

  writeTodos(todos);
  res.json(todos[index]);
});

// DELETE - 할 일 삭제
app.delete('/api/todos/:id', (req, res) => {
  const todos = readTodos();
  const filtered = todos.filter(t => t.id !== req.params.id);
  if (filtered.length === todos.length) {
    return res.status(404).json({ error: '할 일을 찾을 수 없습니다.' });
  }
  writeTodos(filtered);
  res.status(204).end();
});

// DELETE - 완료된 할 일 전체 삭제
app.delete('/api/todos', (req, res) => {
  const todos = readTodos();
  const active = todos.filter(t => !t.completed);
  writeTodos(active);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Todo 앱이 http://localhost:${PORT} 에서 실행 중입니다.`);
});
