const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const enviarCodigoLogin = async (to, nombre, codigo) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Código de verificación - Cobranzas Perú",
    html: `
      <p>Hola ${nombre},</p>
      <p>Tu código de verificación para CyC Web es:</p>
      <h2>${codigo}</h2>
      <p>Este código vence en 5 minutos.</p>
    `,
  });
};

module.exports = { enviarCodigoLogin };
