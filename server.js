import express from "express";
import multer from "multer";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Stockage des fichiers reçus
const storage = multer.memoryStorage(); // stocke temporairement en mémoire
const upload = multer({ storage });

// Map pour suivre IP destinataire et fichiers
const filesMap = {}; // { filename: recipientIp }

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const recipientIp = req.body.recipient_ip;

  if (!file || !recipientIp) {
    return res.status(400).json({ error: "Fichier ou IP destinataire manquant" });
  }

  // Stocker le fichier dans mémoire (pour simplifier, tu peux adapter pour disque)
  filesMap[file.originalname] = { data: file.buffer, ip: recipientIp };

  console.log(`Fichier reçu: ${file.originalname} pour IP ${recipientIp}`);
  res.json({ message: "Fichier reçu", filename: file.originalname });
});

app.get("/files", (req, res) => {
  // Retourner uniquement le nom des fichiers
  res.json({ files: Object.keys(filesMap) });
});

app.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const ip = req.query.ip; // client doit envoyer son IP en query

  const fileEntry = filesMap[filename];
  if (!fileEntry) return res.status(404).json({ error: "Fichier non trouvé" });

  if (fileEntry.ip !== ip) {
    return res.status(403).json({ error: "Accès refusé à ce fichier" });
  }

  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.send(fileEntry.data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
