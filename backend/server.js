const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function initDb(retries = 10, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Database initialized successfully');
            return;
        } catch (err) {
            console.error(`Database initialization attempt ${i + 1} failed: ${err.message}`);
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
}

initDb();

app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'live' });
});

app.get('/health/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ready', database: 'connected' });
    } catch (err) {
        res.status(503).json({ status: 'unready', database: 'disconnected', error: err.message });
    }
});

app.get('/api/version', (req, res) => {
    res.status(200).json({ version: process.env.APP_VERSION || '1.0.0' });
});

app.get('/api/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
            [title]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
