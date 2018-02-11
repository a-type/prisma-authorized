//@flow

const toFragment = (path: string): string => {
  const parts = path.split('.');
  if (parts[1]) {
    return `{ ${parts[0]}: ${toFragment(parts[1])} }`;
  } else {
    return `{ ${parts[0]} }`;
  }
};

export default toFragment;
