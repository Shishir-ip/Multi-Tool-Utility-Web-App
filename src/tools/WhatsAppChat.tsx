import React, { useState, useMemo } from 'react';
import { ToolHeader, Button } from '../components/Shared';

// Country codes with flags
const COUNTRIES = [
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
];

export const WhatsAppChat: React.FC = () => {
  const [countryCode, setCountryCode] = useState('+880');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode);

  // Filter countries by search
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    const q = searchQuery.toLowerCase();
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.code.includes(q)
    );
  }, [searchQuery]);

  // Sanitize phone number according to rules
  const sanitizedNumber = useMemo(() => {
    if (!phoneNumber.trim()) return '';

    // Step 1: Strip all non-numeric characters
    let cleaned = phoneNumber.replace(/[^\d]/g, '');

    // Step 2: Get the country code without the '+' sign
    const countryCodeDigits = countryCode.replace('+', '');

    // Step 3: Check if the number already starts with the country code
    if (cleaned.startsWith(countryCodeDigits)) {
      // Already has country code, use as-is
      return cleaned;
    }

    // Step 4: Check if number starts with another country code (common ones)
    const commonCodes = ['1', '44', '61', '86', '81', '82', '49', '33', '39', '34', '7', '55', '52', '62', '60', '65', '66', '63', '92', '94', '971', '966', '20', '234', '27', '90', '48', '31', '880', '91'];
    for (const code of commonCodes) {
      if (cleaned.startsWith(code) && cleaned.length > code.length + 5) {
        // Number already has a country code, use as-is
        return cleaned;
      }
    }

    // Step 5: Strip leading zero if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Step 6: Prepend the selected country code
    return countryCodeDigits + cleaned;
  }, [phoneNumber, countryCode]);

  // Generate WhatsApp URL
  const whatsappUrl = useMemo(() => {
    if (!sanitizedNumber || sanitizedNumber.length < 7) return '';
    return `https://wa.me/${sanitizedNumber}`;
  }, [sanitizedNumber]);

  // Validate number
  const isValidNumber = sanitizedNumber.length >= 7 && sanitizedNumber.length <= 15;

  const openChat = () => {
    if (!isValidNumber) {
      setError('Please enter a valid phone number (7-15 digits)');
      return;
    }
    setError(null);
    window.open(whatsappUrl, '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      openChat();
    }
  };

  return (
    <div className="tool-container">
      <ToolHeader 
        icon="fa-brands fa-whatsapp" 
        title="WhatsApp Direct Chat" 
        description="Start a chat with any number without saving it" 
        color="#25D366" 
      />

      <div className="space-y-4">
        {/* Country Code Selector */}
        <div className="relative">
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
            Country Code
          </label>
          <div 
            className="input-field flex items-center justify-between cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedCountry?.flag}</span>
              <span style={{ color: 'var(--text-primary)' }}>{selectedCountry?.name}</span>
              <span className="font-mono" style={{ color: 'var(--text-muted)' }}>({countryCode})</span>
            </div>
            <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)' }}></i>
          </div>

          {showDropdown && (
            <div 
              className="absolute z-10 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
              style={{ 
                background: 'var(--card-bg)', 
                border: '1px solid var(--border-color)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              <div className="p-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  placeholder="Search country..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-field text-sm"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              {filteredCountries.map(country => (
                <div
                  key={country.code}
                  className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                  style={{ 
                    background: countryCode === country.code ? 'var(--bg-tertiary)' : 'transparent',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                  onClick={() => {
                    setCountryCode(country.code);
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={e => {
                    if (countryCode !== country.code) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{country.name}</span>
                  <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>{country.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
            Phone Number
          </label>
          <div className="flex gap-2">
            <div 
              className="flex items-center gap-2 px-4 rounded-lg flex-shrink-0"
              style={{ 
                background: 'var(--bg-tertiary)', 
                border: '1px solid var(--border-color)',
                minWidth: '120px'
              }}
            >
              <span className="text-lg">{selectedCountry?.flag}</span>
              <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{countryCode}</span>
            </div>
            <input
              type="tel"
              placeholder="Enter phone number (e.g., 01676330876)"
              value={phoneNumber}
              onChange={e => {
                setPhoneNumber(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              className="input-field flex-1"
            />
          </div>
        </div>

        {/* Live Preview */}
        {phoneNumber && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>WhatsApp Link Preview:</p>
            <p className="font-mono text-sm break-all" style={{ color: isValidNumber ? '#25D366' : '#ef4444' }}>
              {whatsappUrl || 'Invalid number'}
            </p>
            {sanitizedNumber && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Cleaned: +{sanitizedNumber}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
            <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }}></i>
            <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={openChat} 
          icon="fa-brands fa-whatsapp"
          disabled={!isValidNumber}
        >
          Start WhatsApp Chat
        </Button>

        {/* Help Text */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            <i className="fas fa-info-circle mr-1"></i>
            Supported Input Formats:
          </p>
          <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
            <li>• With leading zero: <code>01676330876</code></li>
            <li>• With country code: <code>+8801676330876</code></li>
            <li>• With spaces: <code>01676 330 876</code></li>
            <li>• With hyphens: <code>01676-330-876</code></li>
            <li>• Mixed formatting: <code>+880 1676-330876</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
