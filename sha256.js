// Computes the SHA-256 digest of a string with Web Crypto
// Source: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest

export async function sha256(str) {
  if (crypto && crypto.subtle && crypto.subtle.digest) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } else {
    return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
  }
}

export function hex(buffer) {
  var digest = '';
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    var value = view.getUint32(i);
    var stringValue = value.toString(16);
    var padding = '00000000';
    var paddedValue = (padding + stringValue).slice(-padding.length);
    digest += paddedValue;
  }
  return digest;
}

// Should output "c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2"
// We can check the result with:
// python -c 'from hashlib import sha256;print sha256("foobar").hexdigest()'
sha256("foobar").then(function (digest) {
  console.log(digest);
});