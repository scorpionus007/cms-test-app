/**
 * Get client IP without using req.ip (avoids proxy-addr "trust argument is required" when trust proxy is not set).
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const first = forwarded.split(',')[0];
    if (first && first.trim()) return first.trim();
  }
  const socket = req.socket;
  if (socket && socket.remoteAddress) return socket.remoteAddress;
  return null;
}

module.exports = getClientIp;
