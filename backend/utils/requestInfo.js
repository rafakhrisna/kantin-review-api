// Mengambil ip_address & user_agent dari HTTP request (bukan dari body/client)

function getClientInfo(req) {
  const userAgent = req.get('user-agent');
  return {
    ip_address: req.ip || (req.socket && req.socket.remoteAddress) || null,
    user_agent: userAgent ? userAgent.slice(0, 255) : null,
  };
}

module.exports = { getClientInfo };