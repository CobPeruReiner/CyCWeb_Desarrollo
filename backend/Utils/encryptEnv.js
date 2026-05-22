const fs = require("fs");
const crypto = require("crypto");

const key = Buffer.from(process.env.ENV_ENC_KEY, "hex");

if (!process.env.ENV_ENC_KEY) {
  console.error("ENV_ENC_KEY no definida");
  process.exit(1);
}

const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

const data = fs.readFileSync("./.env");

let encrypted = cipher.update(data);
encrypted = Buffer.concat([encrypted, cipher.final()]);

fs.writeFileSync("./.env.enc", Buffer.concat([iv, encrypted]));

console.log(".env.enc creado correctamente");
