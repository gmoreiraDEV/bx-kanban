const RESEND_API_URL = 'https://api.resend.com/emails';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getResendApiKey = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY não está configurada.');
  }
  return apiKey;
};

const getFromEmail = () =>
  process.env.RESEND_FROM_EMAIL?.trim() || 'Forge <onboarding@resend.dev>';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const sendWithResend = async (input: SendEmailInput) => {
  const apiKey = getResendApiKey();
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFromEmail(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    const message = payload.message || payload.error || 'Falha no envio de e-mail pelo Resend.';
    throw new Error(message);
  }
};

type SendSpaceInviteEmailInput = {
  to: string;
  spaceName: string;
  inviterName?: string;
  inviterEmail?: string;
  appUrl: string;
};

export const sendSpaceInviteEmail = async (input: SendSpaceInviteEmailInput) => {
  const safeSpaceName = escapeHtml(input.spaceName);
  const inviterLabel = escapeHtml(
    input.inviterName || input.inviterEmail || 'Um membro da equipe'
  );
  const loginUrl = `${input.appUrl.replace(/\/+$/, '')}/login`;

  const subject = `Você foi convidado para o espaço "${input.spaceName}"`;
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="font-size: 20px; margin-bottom: 12px;">Convite para o Forge</h2>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 10px;">
        ${inviterLabel} convidou você para o espaço <strong>${safeSpaceName}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 18px;">
        Para entrar, abra o app e faça login com este e-mail.
      </p>
      <a
        href="${loginUrl}"
        style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600; font-size: 14px;"
      >
        Abrir Forge
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 18px;">
        Se você não esperava este convite, pode ignorar este e-mail.
      </p>
    </div>
  `;
  const text = [
    'Convite para o Forge',
    '',
    `${input.inviterName || input.inviterEmail || 'Um membro da equipe'} convidou você para o espaço "${input.spaceName}".`,
    'Para entrar, abra o app e faça login com este e-mail.',
    `Acesse: ${loginUrl}`,
  ].join('\n');

  await sendWithResend({
    to: input.to,
    subject,
    html,
    text,
  });
};
