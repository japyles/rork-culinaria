export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  console.log('Deep link received:', path, 'initial:', initial);
  
  // Handle recipe deep links: /recipe/[id]
  if (path.startsWith('/recipe/')) {
    return path;
  }
  
  // Handle other deep link patterns here
  
  return path || '/';
}