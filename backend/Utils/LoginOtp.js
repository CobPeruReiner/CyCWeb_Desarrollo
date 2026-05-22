const crypto = require("crypto");

const otpByDoc = new Map();

const TTL = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function generarOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function guardarOtp(doc, otp) {
  const hash = crypto.createHash("sha256").update(otp).digest("hex");

  otpByDoc.set(doc, {
    hash,
    expires: Date.now() + TTL,
    attempts: 0,
  });
}

function verificarOtp(doc, otp) {
  const data = otpByDoc.get(doc);

  if (!data) return false;

  if (Date.now() > data.expires) {
    otpByDoc.delete(doc);
    return false;
  }

  data.attempts++;

  if (data.attempts > MAX_OTP_ATTEMPTS) {
    otpByDoc.delete(doc);
    return false;
  }

  const hash = crypto.createHash("sha256").update(otp).digest("hex");

  if (hash !== data.hash) return false;

  otpByDoc.delete(doc);
  return true;
}

module.exports = {
  generarOtp,
  guardarOtp,
  verificarOtp,
};
