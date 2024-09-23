import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();
const port = 3000;

const hardcodedEmail = 'admin@admin.com';
const hashedPassword = '$2b$10$cGUmxdnoJg/DUDpG1UZq9uxyphLq/MoDhc7Cel2R7yqj4EQ/wQppC';
const plaintextPassword = 'Password123';


app.use(express.json());
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}));

let db = new sqlite3.Database('./coiffeurs.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connecté à la base de données.');
    }
});

app.get('/coiffeurs', (req, res) => {
    const page = req.query.page || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const search = req.query.search || '';

    const query = `SELECT * FROM Coiffeurs 
                    WHERE nom LIKE ? OR
                          num LIKE ? OR
                          voie LIKE ? OR
                          codepostal LIKE ? OR
                          ville LIKE ?
                    ORDER BY 
                    CASE 
                        WHEN nom LIKE '@%' THEN 1 
                        ELSE 2 
                    END,
                    nom LIMIT ${pageSize} OFFSET ${offset}`;

    const params = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];

    const countQuery = `SELECT COUNT(*) as totalCount FROM Coiffeurs 
                        WHERE nom LIKE ? OR
                              num LIKE ? OR
                              voie LIKE ? OR
                              codepostal LIKE ? OR
                              ville LIKE ?`;

    db.get(countQuery, params, (err, row) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }

        const totalCount = row.totalCount;

        db.all(query, params, (err, rows) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }

            res.json({ coiffeurs: rows, totalCount });
        });
    });
});

app.get('/coiffeurs/:id', (req, res) => {
    const coiffeurid = req.params.id;

    const query = `SELECT * FROM Coiffeurs WHERE coiffeurid = ?`;

    db.get(query, [coiffeurid], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }

        res.json(row);
    });
});

app.put('/coiffeurs/:id', (req, res) => {
    console.log('Début de la route de mise à jour');

    const coiffeurid = req.params.id;
    const {
        nom,
        lat,
        long,
        num,
        voie,
        ville,
        codepostal
    } = req.body;

    console.log('Valeurs reçues :', nom, num, voie, codepostal, ville, lat, long);

    const updateQuery = `UPDATE Coiffeurs
                         SET nom = ?,
                             lat = ?,
                             long = ?,
                             num = ?,
                             voie = ?,
                             ville = ?,
                             codepostal = ?
                         WHERE coiffeurid = ?`;

    const params = [nom, lat, long, num, voie, ville, codepostal, coiffeurid];

    db.run(updateQuery, params, (err) => {
        console.log('Après la mise à jour dans la base de données');

        if (err) {
            console.error('Erreur lors de la mise à jour dans la base de données :', err);
            res.status(500).send(err.message);
            return;
        }
        const jsonResponse = { coiffeurid, nom, lat, long, num, voie, ville, codepostal };
        res.json(jsonResponse);
        console.log('Réponse du serveur après res.json :', jsonResponse);
        console.log('Mise à jour réussie dans la base de données');
    });
    console.log('Fin de la route de mise à jour');
});

app.post('/coiffeurs', (req, res) => {
    const {
        nom,
        lat,
        long,
        num,
        voie,
        ville,
        codepostal
    } = req.body;

    const insertQuery = `INSERT INTO Coiffeurs (nom, lat, long, num, voie, ville, codepostal)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const params = [nom, lat, long, num, voie, ville, codepostal];

    db.run(insertQuery, params, function (err) {
        if (err) {
            console.error('Erreur lors de l\'insertion dans la base de données :', err);
            res.status(500).send(err.message);
            return;
        }

        const jsonResponse = { coiffeurid: this.lastID, nom, lat, long, num, voie, ville, codepostal };
        res.json(jsonResponse);
        console.log('Réponse du serveur après res.json :', jsonResponse);
        console.log('Mise à jour réussie dans la base de données');
    });
    console.log('Fin de la route de mise à jour');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Vérifier les informations d'identification
    const passwordMatches = await bcrypt.compare(password, hashedPassword);

    if (email === hardcodedEmail && passwordMatches) {
        const token = jwt.sign({ email }, 'secretKey', { expiresIn: '1h' });

        res.json({ token });
    } else {
        res.status(401).json({ error: 'Identifiants incorrects' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});