// ... (mismo inicio de cors, express y pool)

app.post('/registro', async (req, res) => {
    const { nombre, password, rol } = req.body;
    
    if (rol === 'admin' && password !== 'ponis_rositas') {
        return res.status(401).json({ error: "Clave maestra de admin incorrecta" });
    }

    try {
        // 1. BUSCAR SI EL USUARIO YA EXISTE
        const existe = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);

        if (existe.rows.length > 0) {
            // EL USUARIO YA EXISTE -> INTENTAR LOGIN
            const user = existe.rows[0];
            if (user.password === password) {
                // Contraseña correcta
                return res.json(user);
            } else {
                // Contraseña incorrecta
                return res.status(401).json({ error: "Este nombre de usuario ya está registrado con otra contraseña." });
            }
        } else {
            // EL USUARIO NO EXISTE -> CREAR NUEVO REGISTRO
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

// NUEVA RUTA: Obtener lista de todos los estudiantes (Solo para el Admin)
app.get('/admin/estudiantes', async (req, res) => {
    try {
        const result = await pool.query("SELECT id, nombre, rol FROM usuarios WHERE rol = 'estudiante'");
        res.json(result.rows);
    } catch (err) { res.status(500).send(err); }
});

// NUEVA RUTA: Eliminar estudiante (Elimina al usuario y sus plantas por el ON DELETE CASCADE)
app.delete('/admin/usuario/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ success: true });
});

// ... (mantener rutas de datos y eliminar plantas)
