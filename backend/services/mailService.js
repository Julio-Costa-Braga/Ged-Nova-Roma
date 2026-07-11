const https = require('https');
const config = require('../../config');

function parseMailFrom(raw) {
  if (!raw) return '';
  // Se estiver no formato Nome <email@dominio>, retorne exatamente como está
  if (/^.+<.+@.+>$/m.test(raw)) return raw;
  // Se contém email repetido, normalize para apenas um endereço com nome opcional
  const match = raw.match(/([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/);
  if (match) return match[0];
  return raw;
}

function sendViaResend({ from, to, subject, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from,
      to,
      subject,
      html
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${config.MAIL_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: data });
        } else {
          reject(new Error(`Resend API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

async function sendTestEmail(to) {
  const provider = (config.MAIL_PROVIDER || '').toLowerCase();
  const fromRaw = config.MAIL_FROM || '';
  const from = parseMailFrom(fromRaw) || (`no-reply@${(config.BASE_PATH || 'localhost').replace(/[^a-z0-9.-]/gi, '')}`);
  const subject = 'Teste de envio - GED Nova Roma';
  const html = `<p>Este é um e-mail de teste enviado pelo sistema GED Nova Roma para <strong>${to}</strong>.</p>`;

  if (provider === 'resend') {
    return sendViaResend({ from, to, subject, html });
  }

  // Caso não haja provider configurado, retornar erro amigável
  throw new Error('MAIL_PROVIDER não configurado ou não suportado');
}

module.exports = { sendTestEmail };
