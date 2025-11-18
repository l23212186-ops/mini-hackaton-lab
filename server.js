const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });
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

// Middleware para verificar que el usuario ha iniciado sesión
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Acceso denegado. Debes iniciar sesión.' });
    }
    next(); // El usuario está logueado, continuar
}

// Middleware para verificar un rol específico (o varios)
// 'roles' será un array, ej: ['ADMIN', 'ASISTENTE']
function requireRole(roles) {
    return (req, res, next) => {
        // Primero, nos aseguramos de que esté logueado
        if (!req.session.user) {
            return res.status(401).json({ error: 'Acceso denegado. Debes iniciar sesión.' });
        }

        // Verificamos si el rol del usuario está en la lista de roles permitidos
        if (!roles.includes(req.session.user.rol)) {
            //
            return res.status(403).json({ error: 'Acceso prohibido. No tienes los permisos necesarios.' });
        }
        
        next(); // El usuario tiene el rol correcto, continuar
    };
}

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
app.get('/api/auth/check', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ logueado: true, usuario: req.session.user });
    } else {
        res.status(200).json({ logueado: false });
    }
});

app.get('/api/instrumentos', requireLogin, (req, res) => {
    const query = 'SELECT * FROM instrumentos';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos.' });
        res.status(200).json(results);
    });
});

// --- CREACIÓN (CREATE) ---
// Crear un NUEVO instrumento
// Permisos: Solo ADMIN
app.post('/api/instrumentos', requireLogin, requireRole(['ADMIN']), (req, res) => {
    const { nombre, categoria, estado, ubicacion } = req.body;

    if (!nombre || !categoria) {
        return res.status(400).json({ error: 'Nombre y categoría son requeridos.' });
    }

    const query = 'INSERT INTO instrumentos (nombre, categoria, estado, ubicacion) VALUES (?, ?, ?, ?)';
    //
    const estadoFinal = estado || 'DISPONIBLE'; 
    
    db.query(query, [nombre, categoria, estadoFinal, ubicacion], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos.' });
        res.status(201).json({ mensaje: 'Instrumento creado.', id: result.insertId });
    });
});

// --- ACTUALIZACIÓN (UPDATE) ---
// Editar un instrumento existente
// Permisos: ADMIN y ASISTENTE
app.put('/api/instrumentos/:id', requireLogin, requireRole(['ADMIN', 'ASISTENTE']), (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, estado, ubicacion } = req.body;

    if (!nombre || !categoria || !estado || !ubicacion) {
        return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    const query = 'UPDATE instrumentos SET nombre = ?, categoria = ?, estado = ?, ubicacion = ? WHERE id = ?';
    
    db.query(query, [nombre, categoria, estado, ubicacion, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos.' });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Instrumento no encontrado.' });
        }
        res.status(200).json({ mensaje: 'Instrumento actualizado.' });
    });
});

// --- ELIMINACIÓN (DELETE) ---
// Borrar un instrumento
// Permisos: Solo ADMIN
app.delete('/api/instrumentos/:id', requireLogin, requireRole(['ADMIN']), (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM instrumentos WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos.' });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Instrumento no encontrado.' });
        }
        res.status(200).json({ mensaje: 'Instrumento eliminado.' });
    });
});

// Buscar instrumentos por nombre o categoría
// GET /api/instrumentos/buscar?q=microscopio
app.get('/api/instrumentos/buscar', requireLogin, (req, res) => {
    const termino = req.query.q; // Obtiene lo que viene después de ?q=

    if (!termino) {
        return res.json([]); // Si no hay búsqueda, devuelve lista vacía
    }

    // Usamos LIKE para buscar coincidencias parciales en nombre O categoría
    const query = `
        SELECT * FROM instrumentos 
        WHERE nombre LIKE ? OR categoria LIKE ?
    `;
    
    const filtro = `%${termino}%`; // Los % permiten buscar texto en medio

    db.query(query, [filtro, filtro], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos.' });
        res.status(200).json(results);
    });
});

// 1. SUBIR (Importar) Excel
// Espera un archivo con campo 'fileExcel' y cabeceras: nombre, categoria, estado, ubicacion
app.post('/api/instrumentos/upload', requireLogin, requireRole(['ADMIN']), upload.single('fileExcel'), (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    try {
        // Leer el archivo subido
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Validar que el Excel no esté vacío
        if (data.length === 0) {
            return res.status(400).json({ error: 'El archivo Excel está vacío.' });
        }

        // Preparar los datos para inserción masiva
        // Mapeamos las columnas del Excel a las de la BDD
        const valores = data.map(row => [
            row.nombre,
            row.categoria,
            row.estado || 'DISPONIBLE',
            row.ubicacion
        ]);

        const query = 'INSERT INTO instrumentos (nombre, categoria, estado, ubicacion) VALUES ?';

        db.query(query, [valores], (err, result) => {
            // Borrar el archivo temporal después de usarlo
            fs.unlinkSync(req.file.path); 

            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al importar datos. Verifique el formato del Excel.' });
            }

            res.status(200).json({ 
                mensaje: 'Importación exitosa.', 
                registros: result.affectedRows 
            });
        });

    } catch (error) {
        res.status(500).json({ error: 'Error procesando el archivo.' });
    }
});

// 2. DESCARGAR (Exportar) Excel
app.get('/api/instrumentos/download', requireLogin, (req, res) => {
    const query = 'SELECT nombre, categoria, estado, ubicacion FROM instrumentos';
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos.' });

        // Convertir datos JSON a Hoja de Cálculo
        const worksheet = xlsx.utils.json_to_sheet(results);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Instrumentos');

        // Guardar temporalmente
        const fecha = new Date().toISOString().split('T')[0];
        const filename = `instrumentos_${fecha}.xlsx`;
        const filePath = path.join(__dirname, 'uploads', filename);
        
        xlsx.writeFile(workbook, filePath);

        // Enviar al cliente y luego borrar
        res.download(filePath, filename, (err) => {
            if (err) console.error('Error en descarga:', err);
            // fs.unlinkSync(filePath); // Opcional: borrar después de descargar
        });
    });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});