const { Resend } = require('resend');

const resend = new Resend(process.env.MAIL_API_KEY);

async function enviarEmailAssinatura({ destinatario, nomeDocumento, linkAssinatura }) {
  if (!process.env.MAIL_API_KEY || process.env.MAIL_API_KEY === 'sua-chave-api-aqui') {
    console.warn('[email] MAIL_API_KEY não configurada. Simulando envio.');
    return { simulated: true, to: destinatario };
  }

  const { data, error } = await resend.emails.send({
    from: process.env.MAIL_FROM || 'noreply@novaroma.com.br',
    to: destinatario,
    subject: `Documento para assinatura: ${nomeDocumento}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #164e63; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #fff; margin: 0;">Faculdade Nova Roma — GED</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 8px 8px;">
          <p>Olá,</p>
          <p>Você recebeu um documento para assinar: <strong>${nomeDocumento}</strong></p>
          <p>Clique no botão abaixo para acessar e assinar o documento:</p>
          <a href="${linkAssinatura}" 
             style="display: inline-block; background: #164e63; color: #fff; 
                    padding: 12px 24px; border-radius: 8px; text-decoration: none;
                    font-weight: bold; margin: 16px 0;">
            Acessar Documento
          </a>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">
            Este é um e-mail automático do sistema GED. Se você não solicitou este envio, ignore esta mensagem.
          </p>
        </div>
      </div>
    `
  });

  if (error) throw error;
  return data;
}

module.exports = { enviarEmailAssinatura };
