export const getUpdatedFields = (
  original: Record<string, any>,
  updated: Record<string, any>
): Record<string, any> => {
  const isObject = (obj: unknown): obj is Record<string, any> =>
    obj !== null && typeof obj === "object" && !Array.isArray(obj);

  const isArray = (obj: unknown): obj is any[] => Array.isArray(obj);

  const isEqual = (a: unknown, b: unknown): boolean => {
    // Treat null and "" as equivalent
    if ((a === null && b === "") || (a === "" && b === null)) return true;
    if (a === b) return true;

    // Arrays
    if (isArray(a) && isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => isEqual(val, b[i]));
    }

    // Objects
    if (isObject(a) && isObject(b)) {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;

      for (const key of aKeys) {
        const aVal = (a as Record<string, any>)[key];
        const bVal = (b as Record<string, any>)[key];
        if (!isEqual(aVal, bVal)) return false;
      }
      return true;
    }

    return false;
  };

  const diff = (orig: unknown, upd: unknown): any => {
    if (isEqual(orig, upd)) return undefined;

    // ✅ Skip null → "" or "" → null
    if ((orig === null && upd === "") || (orig === "" && upd === null)) {
      return undefined;
    }

    // Primitives or type changed
    if (!isObject(orig) || !isObject(upd)) {
      return upd;
    }

    // Arrays
    if (isArray(orig) && isArray(upd)) {
      return !isEqual(orig, upd) ? upd : undefined;
    }

    // Objects
    const result: Record<string, any> = {};
    const allKeys = new Set([...Object.keys(orig), ...Object.keys(upd)]);
    for (const key of allKeys) {
      const origVal = (orig as Record<string, any>)[key];
      const updVal = (upd as Record<string, any>)[key];
      const subDiff = diff(origVal, updVal);
      if (subDiff !== undefined) {
        result[key] = subDiff;
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  };

  return diff(original, updated) || {};
};
