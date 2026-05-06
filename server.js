const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express(); // <--- ¡Esta es la línea que faltaba!
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Servir el archivo HTML al entrar a la URL principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// LOGIN Y REGISTRO INTELIGENTE
app.post('/registro', async (req, res) => {
    const { nombre, password, rol } = req.body;
    
    if (rol === 'admin' && password !== 'ponis_rositas') {
        return res.status(401).json({ error: "Clave maestra de admin incorrecta" });
    }

    try {
        // BUSCAR SI EL USUARIO YA EXISTE
        const existe = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);

        if (existe.rows.length > 0) {
            const user = existe.rows[0];
            if (user.password === password) {
                return res.json(user);
            } else {
                return res.status(401).json({ error: "Este usuario ya tiene una contraseña registrada." });
            }
        } else {
            // CREAR NUEVO REGISTRO
            const nuevo = await pool.query(
                'INSERT INTO usuarios (nombre, password, rol) VALUES ($1, $2, $3) RETURNING *',
                [nombre, password, rol]
            );
            return res.json(nuevo.rows[0]);
        }
    } catch (err) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// OBTENER DATOS (PLANTAS)
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

// ADMIN: Obtener lista de todos los estudiantes
app.get('/admin/estudiantes', async (req, res) => {
    try {
        const result = await pool.query("SELECT id, nombre, rol FROM usuarios WHERE rol = 'estudiante'");
        res.json(result.rows);
    } catch (err) { res.status(500).send(err); }
});

// ADMIN: Eliminar estudiante
app.delete('/admin/usuario/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// ELIMINAR PLANTA
app.delete('/eliminar/:id/:rol', async (req, res) => {
    if (req.params.rol !== 'admin') return res.status(403).send("No autorizado");
    await pool.query('DELETE FROM registros_banda WHERE id = $1', [req.params.id]);
    res.json({success: true});
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor corriendo en puerto " + (process.env.PORT || 3000));
});
