import express from "express";
import multer from "multer";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Stockage des fichiers en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Structure pour suivre fichiers et destinataires
// { filename: { data: Buffer, recipient_ip: "192.168.xxx.xxx" } }
const filesMap = {};

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const recipientIp = (req.body.recipient_ip || "").trim();

  if (!file || !recipientIp) {
    return res.status(400).json({ error: "Fichier ou IP destinataire manquant" });
  }

  filesMap[file.originalname] = { data: file.buffer, recipient_ip: recipientIp };
  console.log(`Fichier reçu: ${file.originalname} pour IP ${recipientIp}`);
  res.json({ message: "Fichier reçu", filename: file.originalname });
});

// Liste fichiers avec statut selon IP
app.get("/files", (req, res) => {
  const clientIp = (req.query.ip || "").toString().trim();

  const files = Object.keys(filesMap).map((filename) => {
    const entry = filesMap[filename];
    return {
      name: filename,
      status: entry.recipient_ip === clientIp ? "Ouvert" : "Verrouillé",
    };
  });

  res.json({ files });
});

// Téléchargement fichier uniquement pour destinataire
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const clientIp = (req.query.ip || "").toString().trim();

  const fileEntry = filesMap[filename];
  if (!fileEntry) return res.status(404).json({ error: "Fichier non trouvé" });
  if (fileEntry.recipient_ip !== clientIp) {
    return res.status(403).json({ error: "Accès refusé" });
  }

  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.send(fileEntry.data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
