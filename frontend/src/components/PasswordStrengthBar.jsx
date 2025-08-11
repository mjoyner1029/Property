import React from 'react';

const getStrengthInfo = (password) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let strength = 'Too Weak';
  let color = 'bg-red-500';

  if (score === 2) {
    strength = 'Medium';
    color = 'bg-yellow-500';
  } else if (score >= 3) {
    strength = 'Strong';
    color = 'bg-green-500';
  }

  return { strength, color, score };
};

const PasswordStrengthBar = ({ password }) => {
  const { strength, color, score } = getStrengthInfo(password);

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-200 h-2 rounded">
        <div
          className={`h-2 rounded transition-all ${color}`}
          style={{ width: `${(score / 4) * 100}%` }}
        />
      </div>
      <p className="text-sm mt-1 text-gray-700">Strength: {strength}</p>
    </div>
  );
};

export default PasswordStrengthBar;
