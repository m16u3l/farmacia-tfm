import { NextResponse } from "next/server";

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  includePaymentLink?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EmailRequest;
    const { subject, message, includePaymentLink } = body;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2c5282;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 20px;
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            margin-top: 20px;
            color: #666;
          }
          .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          ${message.replace(/\n/g, '<br>')}
          ${includePaymentLink ? `
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/pagos" class="button">
                Realizar Pago
              </a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Saludos cordiales,<br><strong>Sistema de Cobranzas</strong></p>
        </div>
      </body>
      </html>
    `.trim();

    return NextResponse.json({ success: true , htmlContent});
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error al enviar el correo" },
      { status: 500 }
    );
  }
}
