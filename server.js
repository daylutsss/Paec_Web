const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- IMPORTANTE: ESTO FALTA PARA QUE SE VEA LA PÁGINA ---
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Ruta de Registro
app.post('/registro', async (req, res) => {
    const { nombre, password, rol } = req.body;
    if (rol === 'admin' && password !== 'ponis_rositas') return res.status(401).json({error: "Clave admin incorrecta"});
    
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, password, rol) VALUES ($1, $2, $3) RETURNING id, nombre, rol',
            [nombre, password, rol]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({error: "Usuario ya existe"});
    }
});

// Ruta para obtener datos
app.get('/datos/:userId/:rol', async (req, res) => {
    const { userId, rol } = req.params;
    try {
        let query = (rol === 'admin') 
            ? 'SELECT * FROM registros_banda' 
            : 'SELECT * FROM registros_banda WHERE usuario_id = $1';
        let params = (rol === 'admin') ? [] : [userId];
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) { res.status(500).send(err); }
});

// Ruta para eliminar
app.delete('/eliminar/:id/:rol', async (req, res) => {
    if (req.params.rol !== 'admin') return res.status(403).send("No autorizado");
    await pool.query('DELETE FROM registros_banda WHERE id = $1', [req.params.id]);
    res.json({success: true});
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor listo en el puerto " + (process.env.PORT || 3000));
});
