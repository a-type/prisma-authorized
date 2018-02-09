//@flow
export const mapPromiseValues = async (promiseMap: {
  [any]: Promise<any>,
}): { [any]: any } =>
  Object.keys(promiseMap).reduce(
    async (otherValues, key) => ({
      ...(await otherValues),
      [key]: await promiseMap[key],
    }),
    {},
  );

export const toFragment = (path: string): string => {
  const parts = path.split('.');
  if (parts[1]) {
    return `{ ${parts[0]}: ${toFragment(parts[1])} }`;
  } else {
    return `{ ${parts[0]} }`;
  }
};
