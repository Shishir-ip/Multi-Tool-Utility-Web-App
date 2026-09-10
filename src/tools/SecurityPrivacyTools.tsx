import React, { useState, useRef } from 'react';
import { ToolHeader, Button } from '../components/Shared';

// ── AES Encrypter/Decrypter ──
export const AesCipher: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [action, setAction] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const deriveKey = async (password: string, salt: Uint8Array) => {
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' } as any, false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt as any, iterations: 100000, hash: 'SHA-256' } as any,
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const encryptText = async () => {
    if (!password || !text) return;
    setProcessing(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);
      setResult(btoa(String.fromCharCode(...combined)));
    } catch (err) { alert('Encryption failed'); }
    setProcessing(false);
  };

  const decryptText = async () => {
    if (!password || !text) return;
    setProcessing(true);
    try {
      const data = Uint8Array.from(atob(text), c => c.charCodeAt(0));
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);
      const key = await deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
      setResult(new TextDecoder().decode(decrypted));
    } catch (err) { alert('Decryption failed. Wrong password or corrupted data.'); }
    setProcessing(false);
  };

  const encryptFile = async () => {
    if (!password || !file) return;
    setProcessing(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      const data = await file.arrayBuffer();
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);
      const blob = new Blob([combined], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${file.name}.enc`;
      a.click();
    } catch (err) { alert('Encryption failed'); }
    setProcessing(false);
  };

  const decryptFile = async () => {
    if (!password || !file) return;
    setProcessing(true);
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);
      const key = await deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
      const blob = new Blob([decrypted]);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name.replace('.enc', '');
      a.click();
    } catch (err) { alert('Decryption failed. Wrong password or corrupted file.'); }
    setProcessing(false);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-lock" title="AES Encrypter/Decrypter" description="Encrypt text and files with AES-256" color="#6366f1" />
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setMode('text')} className="px-4 py-2 rounded-lg text-sm" style={{ background: mode === 'text' ? 'var(--accent)' : 'var(--bg-tertiary)', color: mode === 'text' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Text</button>
        <button onClick={() => setMode('file')} className="px-4 py-2 rounded-lg text-sm" style={{ background: mode === 'file' ? 'var(--accent)' : 'var(--bg-tertiary)', color: mode === 'file' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>File</button>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setAction('encrypt')} className="px-4 py-2 rounded-lg text-sm" style={{ background: action === 'encrypt' ? '#10b981' : 'var(--bg-tertiary)', color: action === 'encrypt' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Encrypt</button>
        <button onClick={() => setAction('decrypt')} className="px-4 py-2 rounded-lg text-sm" style={{ background: action === 'decrypt' ? '#ef4444' : 'var(--bg-tertiary)', color: action === 'decrypt' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Decrypt</button>
      </div>
      <div className="mb-4">
        <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Password</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
      </div>
      {mode === 'text' ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{action === 'encrypt' ? 'Plain Text' : 'Encrypted Text (Base64)'}</label>
            <textarea value={text} onChange={e => setText(e.target.value)} className="input-field" style={{ minHeight: '150px', resize: 'vertical' }} />
          </div>
          {result && (
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{action === 'encrypt' ? 'Encrypted Output' : 'Decrypted Output'}</label>
              <textarea value={result} readOnly className="input-field" style={{ minHeight: '150px', resize: 'vertical' }} />
              <Button onClick={() => navigator.clipboard.writeText(result)} icon="fa-copy" variant="secondary">Copy</Button>
            </div>
          )}
          <Button onClick={action === 'encrypt' ? encryptText : decryptText} icon={processing ? 'fa-spinner fa-spin' : action === 'encrypt' ? 'fa-lock' : 'fa-unlock'} disabled={processing}>
            {processing ? 'Processing...' : action === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{action === 'encrypt' ? 'File to Encrypt' : 'Encrypted File (.enc)'}</label>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="input-field" />
          </div>
          <Button onClick={action === 'encrypt' ? encryptFile : decryptFile} icon={processing ? 'fa-spinner fa-spin' : action === 'encrypt' ? 'fa-lock' : 'fa-unlock'} disabled={processing}>
            {processing ? 'Processing...' : action === 'encrypt' ? 'Encrypt & Download' : 'Decrypt & Download'}
          </Button>
        </div>
      )}
    </div>
  );
};

// ── Image Steganography ──
export const Steganography: React.FC = () => {
  const [tab, setTab] = useState<'hide' | 'extract'>('hide');
  const [image, setImage] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [passkey, setPasskey] = useState('');
  const [extracted, setExtracted] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = e => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const hideMessage = () => {
    if (!image || !message || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let msg = message;
      if (passkey) {
        msg = Array.from(message).map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ passkey.charCodeAt(i % passkey.length))).join('');
      }

      const msgBytes = new TextEncoder().encode(msg);
      const length = msgBytes.length;
      const lengthBits = length.toString(2).padStart(32, '0');
      const msgBits = Array.from(msgBytes).map(b => b.toString(2).padStart(8, '0')).join('');
      const bits = lengthBits + msgBits;

      if (bits.length > data.length / 4) {
        alert('Message too long for this image');
        return;
      }

      for (let i = 0; i < bits.length; i++) {
        const pixelIndex = i * 4;
        data[pixelIndex] = (data[pixelIndex] & 0xFE) | parseInt(bits[i]);
      }

      ctx.putImageData(imageData, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'stego.png';
      a.click();
    };
    img.src = image;
  };

  const extractMessage = () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let lengthBits = '';
      for (let i = 0; i < 32; i++) {
        lengthBits += (data[i * 4] & 1).toString();
      }
      const length = parseInt(lengthBits, 2);

      let msgBits = '';
      for (let i = 0; i < length * 8; i++) {
        const pixelIndex = (32 + i) * 4;
        msgBits += (data[pixelIndex] & 1).toString();
      }

      const msgBytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        msgBytes[i] = parseInt(msgBits.slice(i * 8, (i + 1) * 8), 2);
      }

      let msg = new TextDecoder().decode(msgBytes);
      if (passkey) {
        msg = Array.from(msg).map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ passkey.charCodeAt(i % passkey.length))).join('');
      }

      setExtracted(msg);
    };
    img.src = image;
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-eye-slash" title="Image Steganography" description="Hide text inside images" color="#6366f1" />
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('hide')} className="px-4 py-2 rounded-lg text-sm" style={{ background: tab === 'hide' ? 'var(--accent)' : 'var(--bg-tertiary)', color: tab === 'hide' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Hide Message</button>
        <button onClick={() => setTab('extract')} className="px-4 py-2 rounded-lg text-sm" style={{ background: tab === 'extract' ? 'var(--accent)' : 'var(--bg-tertiary)', color: tab === 'extract' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Extract Message</button>
      </div>
      <div className="mb-4">
        <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{tab === 'hide' ? 'Upload Image' : 'Upload Stego Image'}</label>
        <input type="file" accept="image/*" onChange={e => handleFile(e.target.files!)} className="input-field" />
      </div>
      {image && (
        <div className="space-y-4">
          <img src={image} alt="" className="max-w-full max-h-64 rounded-lg border mx-auto" style={{ borderColor: 'var(--border-color)' }} />
          {tab === 'hide' ? (
            <>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Secret Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} className="input-field" style={{ minHeight: '100px', resize: 'vertical' }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Passkey (Optional)</label>
                <input type="password" value={passkey} onChange={e => setPasskey(e.target.value)} className="input-field" />
              </div>
              <Button onClick={hideMessage} icon="fa-eye-slash">Hide & Download</Button>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Passkey (if used)</label>
                <input type="password" value={passkey} onChange={e => setPasskey(e.target.value)} className="input-field" />
              </div>
              <Button onClick={extractMessage} icon="fa-eye">Extract Message</Button>
              {extracted && (
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Extracted Message:</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{extracted}</p>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};
