const fs = require("fs");
const crypto = require("crypto");

module.exports = function loadEncryptedEnv() {
  let keyHex = process.env.ENV_ENC_KEY;

  if (!keyHex && process.env.ENV_ENC_KEY_FILE) {
    try {
      keyHex = fs.readFileSync(process.env.ENV_ENC_KEY_FILE, "utf8").trim();
    } catch (err) {
      console.error("No se pudo leer ENV_ENC_KEY_FILE:", err.message);
      process.exit(1);
    }
  }

  if (!keyHex) {
    console.error("ENV_ENC_KEY no definida");
    process.exit(1);
  }

  const key = Buffer.from(keyHex, "hex");

  const file = fs.readFileSync("./.env.enc");

  const iv = file.subarray(0, 16);
  const encrypted = file.subarray(16);

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  const env = decrypted.toString();

  env.split("\n").forEach((line) => {
    if (!line || line.startsWith("#")) return;

    const index = line.indexOf("=");
    if (index === -1) return;

    const name = line.substring(0, index).trim();
    const value = line.substring(index + 1).trim();

    process.env[name] = value;
  });
};
