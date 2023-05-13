import crypto from 'crypto';

export default function id() {
  return crypto.randomUUID().split('-').join('').slice(-24);
}
