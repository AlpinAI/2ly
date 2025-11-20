import os from 'os';

export const getHostIP = () => {
  try {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      for (const addr of addresses ?? []) {
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
    return '127.0.0.1';
  } catch {
    // Silently fallback to localhost if network interfaces can't be enumerated
    return '127.0.0.1';
  }
};
