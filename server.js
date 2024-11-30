import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import session from 'express-session'; // Для управления сессиями

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Настройка сессий
app.use(session({
  secret: 'your-secret-key', // Секретный ключ для шифрования сессий (замени на свой!)
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // В продакшене используй secure: true для HTTPS
}));

// Отдаем статические файлы из текущей директории
app.use(express.static(path.join(__dirname, '.')));

// Примерный роут для получения данных сессии (когда ты реализуешь логику)
app.get('/api/session', (req, res) => {
  if (!req.session.circles) {
    req.session.circles = []; // Инициализируем данные сессии, если их нет
  }
  res.json({ circles: req.session.circles });
});

// Примерный роут для обновления данных сессии (когда ты реализуешь логику)
app.post('/api/session/update', express.json(), (req, res) => {
  if (!req.session.circles) {
    req.session.circles = [];
  }
  // Здесь ты будешь обновлять данные сессии на основе запроса от клиента
  // req.session.circles = ...
  console.log("Received update:", req.body);
  res.json({ message: 'Session updated' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
