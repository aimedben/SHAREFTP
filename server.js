const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

let filesDB = []; // { name, path, recipient, recipient_ip, key }

app.post("/upload", upload.single("file"), (req, res) => {
  const { recipient, recipient_ip, key } = req.body;
  if (!recipient_ip) return res.status(400).send("IP destinataire manquante");

  filesDB.push({
    name: req.file.originalname,
    path: req.file.path,
    recipient,
    recipient_ip,
    key,
  });
  res.send("Fichier enregistré");
});

// Lister fichiers pour un appareil donné
app.get("/files", (req, res) => {
  const ip = req.query.ip;
  if (!ip) return res.status(400).send("IP requête manquante");

  const filesForDevice = filesDB.map(f => ({
    name: f.name,
    ip: f.recipient_ip === ip ? f.recipient_ip : null
  }));
  res.json({ files: filesForDevice });
});

app.listen(3000, () => console.log("Server running on port 3000"));
