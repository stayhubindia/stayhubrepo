// Test script to verify HMAC signature generation
const crypto = require('crypto');

const APP_SECRET = 'bcd422800fd93e96eb598d7544999810ac073c33492f4bb1ce3b7760fc6ed576ef89968c7668aea8b20ea6d7f5a21993ece697c41f8021e33df30620f2182f6d';

// Simulate client-side signing (browser Web Crypto API)
async function clientSign(method, path) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}:${method.toUpperCase()}:${path}`;
  
  console.log('Client Side:');
  console.log('  Timestamp:', timestamp);
  console.log('  Message:', message);
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );
  
  const hexSignature = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  console.log('  Signature:', hexSignature);
  console.log('  Header:', `${timestamp}.${hexSignature}`);
  
  return { timestamp, hexSignature, header: `${timestamp}.${hexSignature}` };
}

// Simulate server-side verification (Node.js crypto)
function serverVerify(method, path, timestamp, receivedHex) {
  const message = `${timestamp}:${method.toUpperCase()}:${path}`;
  
  console.log('\nServer Side:');
  console.log('  Timestamp:', timestamp);
  console.log('  Message:', message);
  
  const hmac = crypto.createHmac('sha256', APP_SECRET);
  hmac.update(message);
  const expectedHex = hmac.digest('hex');
  
  console.log('  Expected Signature:', expectedHex);
  console.log('  Received Signature:', receivedHex);
  console.log('  Match:', expectedHex === receivedHex);
  
  return expectedHex === receivedHex;
}

// Test
(async () => {
  console.log('=== Testing HMAC Signature ===\n');
  
  const method = 'GET';
  const path = '/api/v1/users/me';
  
  const { timestamp, hexSignature } = await clientSign(method, path);
  const isValid = serverVerify(method, path, timestamp, hexSignature);
  
  console.log('\n=== Result ===');
  console.log('Signature Valid:', isValid);
})();
