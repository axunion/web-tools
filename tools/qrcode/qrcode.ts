import './qrcode.css';
import QRCode from 'qrcode';

const generateQRCode = async (): Promise<void> => {
  const inputTextElement: HTMLTextAreaElement = document.getElementById(
    'inputText',
  ) as HTMLTextAreaElement;
  const qrcodeContainer: HTMLDivElement = document.getElementById(
    'qrcodeContainer',
  ) as HTMLDivElement;

  qrcodeContainer.innerHTML = '';

  try {
    const inputText: string = inputTextElement.value;
    const qrCodeDataUrl: string = await QRCode.toDataURL(inputText);
    const qrCodeImage: HTMLImageElement = document.createElement('img');
    qrCodeImage.src = qrCodeDataUrl;
    qrCodeImage.alt = 'QR Code';
    qrcodeContainer.appendChild(qrCodeImage);
  } catch (error) {
    console.error('An error occurred while generating the QR code:', error);
  }
};

const generateButton: HTMLButtonElement = document.getElementById(
  'generateButton',
) as HTMLButtonElement;

generateButton.addEventListener('click', generateQRCode);
