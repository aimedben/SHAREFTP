import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Button, Alert, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Network from "expo-network";

const SERVER_URL = "https://tonserveur.com"; // <-- change à ton URL

export default function ReceiveFile({ goBack }: any) {
  const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState<string>("");

  // Récupérer IP locale
  useEffect(() => {
    const getIp = async () => {
      try {
        const ip = await Network.getIpAddressAsync();
        setIpAddress(ip);
      } catch (e) {
        console.log("Impossible de récupérer IP:", e);
      }
    };
    getIp();
  }, []);

  // Lister fichiers
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${SERVER_URL}/files?ip=${ipAddress}`);
      const data = await resp.json();
      setReceivedFiles(data.files || []);
      console.log("📁 Liste fichiers reçue:", data.files);
    } catch (e) {
      console.log("Erreur récupération fichiers:", e);
      Alert.alert("Erreur", "Impossible de récupérer les fichiers.");
    } finally {
      setLoading(false);
    }
  };

  // Télécharger fichier
  const downloadFile = async (filename: string) => {
    try {
      const localUri = FileSystem.documentDirectory + filename;
      const resp = await fetch(`${SERVER_URL}/download/${filename}`);
      const blob = await resp.blob();
      const buffer = await blob.arrayBuffer();
      await FileSystem.writeAsStringAsync(localUri, Buffer.from(buffer).toString("base64"), {
        encoding: FileSystem.EncodingType.Base64,
      });
      Alert.alert("✅ Fichier téléchargé", filename);
    } catch (e) {
      console.log("Erreur téléchargement:", e);
      Alert.alert("Erreur", "Impossible de télécharger le fichier.");
    }
  };

  useEffect(() => {
    if (ipAddress) fetchFiles();
  }, [ipAddress]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={goBack}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>📂 Fichiers disponibles</Text>
      <Text style={styles.ipText}>🌐 Votre IP : {ipAddress || "Récupération..."}</Text>
      <Button title={loading ? "Chargement..." : "Actualiser"} onPress={fetchFiles} disabled={loading} />

      <ScrollView style={styles.filesList}>
        {receivedFiles.map((f, i) => (
          <TouchableOpacity key={i} style={styles.fileItem} onPress={() => downloadFile(f.name)}>
            <Text style={styles.fileText}>{f.status}</Text>
          </TouchableOpacity>
        ))}
        {receivedFiles.length === 0 && !loading && <Text style={styles.emptyText}>Aucun fichier</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 20 },
  backBtn: { position: "absolute", top: 50, left: 20, backgroundColor: "#1e293b", padding: 8, borderRadius: 10 },
  backText: { color: "#fff", fontWeight: "bold" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  ipText: { color: "#a5b4fc", fontSize: 16, marginBottom: 10 },
  filesList: { marginTop: 10 },
  fileItem: { backgroundColor: "#1e293b", padding: 15, borderRadius: 10, marginBottom: 10 },
  fileText: { color: "#cbd5e1", fontSize: 16 },
  emptyText: { color: "#94a3b8", textAlign: "center", marginTop: 20 },
});
