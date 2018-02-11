const mapPromiseValues = async (promiseMap: {
  [any]: Promise<any>,
}): { [any]: any } =>
  Object.keys(promiseMap).reduce(
    async (otherValues, key) => ({
      ...(await otherValues),
      [key]: await promiseMap[key],
    }),
    {},
  );

export default mapPromiseValues;
