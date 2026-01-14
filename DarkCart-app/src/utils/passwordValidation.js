// Strong password validation regex and utilities
export const passwordRegex = {
  // Main strong password regex: 8+ chars, 1 lowercase, 1 uppercase, 1 number, 1 special char
  strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Individual criteria regex patterns
  minLength: /.{8,}/,
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  number: /\d/,
  specialChar: /[@$!%*?&]/
};

export const passwordCriteria = [
  {
    id: 'minLength',
    label: 'At least 8 characters',
    regex: passwordRegex.minLength,

  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    regex: passwordRegex.lowercase,
  
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    regex: passwordRegex.uppercase,
   
  },
  {
    id: 'number',
    label: 'One number',
    regex: passwordRegex.number,
   
  },
  {
    id: 'specialChar',
    label: 'One special character (@$!%*?&)',
    regex: passwordRegex.specialChar,
   
  }
];

export const validatePassword = (password) => {
  const results = passwordCriteria.map(criterion => ({
    ...criterion,
    met: criterion.regex.test(password)
  }));
  
  const allMet = results.every(result => result.met);
  const score = results.filter(result => result.met).length;
  
  return {
    isValid: allMet,
    score,
    maxScore: passwordCriteria.length,
    criteria: results,
    strength: getPasswordStrength(score)
  };
};

export const getPasswordStrength = (score) => {
  if (score === 0) return { level: 'none', label: 'No Password', color: '#gray-400' };
  if (score <= 2) return { level: 'weak', label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { level: 'fair', label: 'Fair', color: '#f59e0b' };
  if (score <= 4) return { level: 'good', label: 'Good', color: '#10b981' };
  return { level: 'strong', label: 'Strong', color: '#059669' };
};

export const getPasswordColor = (strength) => {
  const colors = {
    none: 'bg-gray-200',
    weak: 'bg-red-500',
    fair: 'bg-yellow-500',
    good: 'bg-blue-500', 
    strong: 'bg-green-500'
  };
  return colors[strength] || 'bg-gray-200';
};
