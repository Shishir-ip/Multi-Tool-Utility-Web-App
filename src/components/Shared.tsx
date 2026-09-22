import React from 'react';

interface ToolHeaderProps {
  icon: string;
  title: string;
  description: string;
  color?: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ icon, title, description, color = 'var(--accent)' }) => (
  <div className="mb-4 sm:mb-6">
    <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
      <i className={`fas ${icon}`} style={{ color }}></i>
      {title}
    </h2>
    <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>{description}</p>
  </div>
);

interface DropZoneProps {
  onFiles: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  icon?: string;
  title?: string;
  subtitle?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFiles,
  accept = '*',
  multiple = false,
  icon = 'fa-cloud-upload-alt',
  title = 'Drop files here or click to upload',
  subtitle = 'Supported formats will be listed'
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    onFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`drop-zone ${dragActive ? 'active' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={e => {
          if (e.target.files) onFiles(e.target.files);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />
      <div className="drop-zone-content">
        <div className="drop-zone-icon">
          <i className={`fas ${icon}`}></i>
        </div>
        <p className="drop-zone-title">{title}</p>
        <p className="drop-zone-subtitle">{subtitle}</p>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <div className="stat-card">
    <i className={`fas ${icon} text-base sm:text-lg mb-1 sm:mb-2`} style={{ color }}></i>
    <div className="text-lg sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{value}</div>
    <div className="text-[10px] sm:text-xs mt-1 leading-tight" style={{ color: 'var(--text-muted)' }}>{label}</div>
  </div>
);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => (
  <div>
    {label && <label className="text-xs sm:text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
    <input {...props} className="input-field text-sm sm:text-base" />
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  icon?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', icon, children, ...props }) => (
  <button className={`btn-${variant} flex items-center justify-center gap-2 text-sm`} {...props}>
    {icon && <i className={`fas ${icon}`}></i>}
    {children}
  </button>
);
