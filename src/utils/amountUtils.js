export const cleanAmount = (value) => {
  // Handle empty values
  if (!value) return "";
  
  // Remove all non-digit and non-decimal characters
  const cleaned = value.replace(/[^\d.]/g, "");
  
  // Handle multiple decimal points - keep only first one
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    return parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return cleaned;
};

export const formatAmount = (value, allowDecimals = true) => {
  if (!value && value !== 0) return "";
  
  let stringValue = value.toString();
  
  // Remove any existing formatting
  stringValue = stringValue.replace(/,/g, "");
  
  // Handle decimal places
  if (allowDecimals) {
    // Ensure proper decimal format
    const parts = stringValue.split('.');
    let integerPart = parts[0];
    let decimalPart = parts[1] || "";
    
    // Format integer part with commas
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // Handle decimal part
    if (decimalPart) {
      decimalPart = decimalPart.length > 2 ? decimalPart.substring(0, 2) : decimalPart;
      return `${integerPart}.${decimalPart}`;
    }
    
    return integerPart;
  } else {
    // Format without decimals
    return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
};

export const removeAmountFormatting = (value) => {
  return value.replace(/,/g, "");
};

export const formatAmountAsTyping = (value) => {
  if (!value) return "";
  
  let cleanValue = cleanAmount(value);
  
  // Don't format if it's just a decimal point
  if (cleanValue === ".") return ".";
  
  // Format with commas
  const parts = cleanValue.split('.');
  let integerPart = parts[0];
  let decimalPart = parts[1] || "";
  
  // Format integer part with commas
  if (integerPart) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  // Combine with decimal part
  if (decimalPart) {
    return `${integerPart}.${decimalPart}`;
  }
  
  return integerPart;
};

export const parseAmountToNumber = (formattedValue) => {
  if (!formattedValue) return 0;
  const numericString = formattedValue.replace(/,/g, "");
  return parseFloat(numericString) || 0;
};