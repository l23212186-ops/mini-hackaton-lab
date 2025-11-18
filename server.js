const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config(); // Carga las variables de .env

const app = express();

// Middleware
app.use(express.json()); // Para parsear JSON en las peticiones POST/PUT
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Poner en true si usas HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 día
    }
}));

// Conexión a la Base de Datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    timezone: '-08:00'
});

db.connect(err => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conexión exitosa a MySQL (laboratorio)');
});

app.post('/api/auth/register', async (req, res) => {
    const { nombre, correo, password, rol } = req.body;

    // Validación simple
    if (!nombre || !correo || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos.' });
    }

    try {
        // 1. Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insertar en la BDD (usamos el rol por defecto si no se provee)
        //
        const query = 'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)';
        
        // El ENUM 'ASISTENTE' es el default en la BDD
        const rolFinal = rol || 'ASISTENTE'; 
        
        db.query(query, [nombre, correo, hashedPassword, rolFinal], (err, result) => {
            if (err) {
                // Error de correo duplicado
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'El correo ya está registrado.' });
                }
                console.error(err);
                return res.status(500).json({ error: 'Error de base de datos.' });
            }
            res.status(201).json({ mensaje: 'Usuario registrado exitosamente.' });
        });

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});

// Ruta para INICIAR SESIÓN
app.post('/api/auth/login', (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
    }

    const query = 'SELECT * FROM usuarios WHERE correo = ?';
    db.query(query, [correo], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos.' });

        // 1. Verificar si el usuario existe
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = results[0];

        // 2. Comparar la contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta.' });
        }

        // 3. Guardar en la sesión
        req.session.user = {
            id: user.id,
            nombre: user.nombre,
            correo: user.correo,
            rol: user.rol // ¡Muy importante para el siguiente paso!
        };

        // 4. Enviar respuesta exitosa
        // El frontend recibirá este JSON
        res.status(200).json({
            mensaje: 'Login exitoso.',
            usuario: req.session.user
        });
    });
});

// Ruta para CERRAR SESIÓN
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'No se pudo cerrar la sesión.' });
        }
        // Limpia la cookie del lado del cliente
        res.clearCookie('connect.sid'); // 'connect.sid' es el nombre default de la cookie de sesión
        res.status(200).json({ mensaje: 'Logout exitoso.' });
    });
});

// Ruta de "Verificar Sesión" (Helper)
// Muy útil para el frontend, para saber si ya hay una sesión activa
app.get('/api/auth/check', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ logueado: true, usuario: req.session.user });
    } else {
        res.status(200).json({ logueado: false });
    }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});