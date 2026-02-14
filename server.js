const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Stockage Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// ---------------------------------
// POST /upload
// body: form-data { file, key, recipientIp }
// ---------------------------------
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const recipientIp = req.body.recipientIp;
    if (!recipientIp) return res.status(400).send("IP destinataire manquante");

    const meta = {
      filename: req.file.filename,
      recipientIp,
      encryptedKey: req.body.key,
      createdAt: new Date()
    };

    // Sauvegarde meta JSON
    const metaFile = path.join(UPLOAD_DIR, req.file.filename + ".json");
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));

    console.log(`✅ Fichier ${req.file.filename} reçu pour ${recipientIp}`);
    res.send("Fichier reçu et stocké !");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

// ---------------------------------
// GET /files
// Retourne liste fichiers avec statut "ouvert"/"verrouillé"
// ---------------------------------
app.get("/files", (req, res) => {
  const clientIp = req.ip.replace("::ffff:", ""); // corrige IPv4 sur IPv6
  const files = fs.readdirSync(UPLOAD_DIR)
    .filter(f => !f.endsWith(".json"))
    .map(f => {
      const metaFile = path.join(UPLOAD_DIR, f + ".json");
      if (!fs.existsSync(metaFile)) return null;

      const meta = JSON.parse(fs.readFileSync(metaFile));
      return {
        filename: f,
        status: meta.recipientIp === clientIp ? "ouvert" : "verrouillé"
      };
    })
    .filter(f => f !== null);

  res.json({ files });
});

// ---------------------------------
// GET /download/:filename
// Renvoie le fichier si IP correspond sinon erreur
// ---------------------------------
app.get("/download/:filename", (req, res) => {
  const clientIp = req.ip.replace("::ffff:", "");
  const filename = req.params.filename;

  const filePath = path.join(UPLOAD_DIR, filename);
  const metaFile = filePath + ".json";
  if (!fs.existsSync(filePath) || !fs.existsSync(metaFile))
    return res.status(404).send("Fichier introuvable");

  const meta = JSON.parse(fs.readFileSync(metaFile));
  if (meta.recipientIp !== clientIp)
    return res.status(403).send("Vous n’êtes pas autorisé à télécharger ce fichier");

  res.download(filePath);
});

// ---------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur port ${PORT}`));
