const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure key and IV
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// Encrypt function
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt function
function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Encrypt .env file
function encryptEnv() {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const encrypted = encrypt(envContent);
  
  // Save encrypted content to .env.enc
  fs.writeFileSync(path.join(__dirname, '.env.enc'), encrypted);
  
  // Save key and IV to separate file
  fs.writeFileSync(path.join(__dirname, '.env.key'), JSON.stringify({
    key: key.toString('hex'),
    iv: iv.toString('hex')
  }));
  
  console.log('Environment variables encrypted successfully');
}

// Decrypt .env file
function decryptEnv() {
  const encryptedPath = path.join(__dirname, '.env.enc');
  const keyPath = path.join(__dirname, '.env.key');
  
  const encrypted = fs.readFileSync(encryptedPath, 'utf8');
  const { key: keyHex, iv: ivHex } = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decrypted = decrypt(encrypted);
  fs.writeFileSync(path.join(__dirname, '.env'), decrypted);
  
  console.log('Environment variables decrypted successfully');
}

// Handle command line arguments
const command = process.argv[2];
if (command === 'encrypt') {
  encryptEnv();
} else if (command === 'decrypt') {
  decryptEnv();
} else {
  console.log('Usage: node encrypt-env.js [encrypt|decrypt]');
}