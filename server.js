import express from "express";
import multer from "multer";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Stockage des fichiers reçus
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Map pour suivre IP destinataire et fichiers
// { filename: { data: Buffer, ip: "192.168.100.x" } }
const filesMap = {};

// Upload
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const recipientIp = req.body.recipient_ip;

  if (!file || !recipientIp) {
    return res.status(400).json({ error: "Fichier ou IP destinataire manquant" });
  }

  filesMap[file.originalname] = { data: file.buffer, ip: recipientIp };

  console.log(`Fichier reçu: ${file.originalname} pour IP ${recipientIp}`);
  res.json({ message: "Fichier reçu", filename: file.originalname });
});

// Lister fichiers avec IP destinataire
app.get("/files", (req, res) => {
  const filesList = Object.entries(filesMap).map(([filename, info]) => ({
    filename,
    recipient_ip: info.ip,
  }));
  res.json({ files: filesList });
});

// Télécharger fichier (vérifie IP)
app.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const ip = (req.query.ip || "").toString().trim();
if (fileEntry.ip.trim() !== ip) {
  return res.status(403).json({ error: "Accès refusé à ce fichier" });
}
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.send(fileEntry.data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
