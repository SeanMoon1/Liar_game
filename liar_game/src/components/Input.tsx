import React from 'react';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'password' | 'email';
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder = '',
  maxLength,
  type = 'text',
  className = '',
  onKeyPress,
  disabled = false
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      onKeyPress={onKeyPress}
      disabled={disabled}
      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
      } ${className}`}
    />
  );
};

export default Input; 