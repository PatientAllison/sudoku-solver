export const isPositiveInteger = (value: number) => {
  if (value <= 0) {
    return false;
  } else if (!Number.isInteger(value)) {
    return false;
  }
  return true;
};

export const isSquarePositiveInteger = (value: number) => {
  if (!isPositiveInteger(value)) {
    return false;
  } else if (!Number.isInteger(Math.sqrt(value))) {
    return false;
  }
  return true;
};
