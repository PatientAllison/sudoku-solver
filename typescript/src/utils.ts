export const isSquarePositiveInteger = (value: number) => {
  if (value <= 0) {
    return false;
  } else if (!Number.isInteger(value)) {
    return false;
  } else if (!Number.isInteger(Math.sqrt(value))) {
    return false;
  }
  return true;
};
