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

const enviarCodigoRecuperacion = async (to, nombre, codigo) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Recuperación de contraseña - Cobranzas Perú",
    html: `
      <p>Hola ${nombre},</p>
      <p>Solicitaste recuperar tu contraseña.</p>
      <p>Tu código de recuperación es:</p>
      <h2>${codigo}</h2>
      <p>Este código vence en 10 minutos.</p>
    `,
  });
};

module.exports = { enviarCodigoRecuperacion };
