export async function handler() {

  const info = {
    cwd: process.cwd(),
    hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
    hasPK: !!process.env.GOOGLE_PRIVATE_KEY,
    hasPKB64: !!process.env.GOOGLE_PRIVATE_KEY_B64,
    pkB64Len: (process.env.GOOGLE_PRIVATE_KEY_B64 || '').length
  };
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(info) };
};

