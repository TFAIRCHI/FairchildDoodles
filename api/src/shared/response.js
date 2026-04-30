function json(body, init = {}) {
  return {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {})
    },
    jsonBody: body
  };
}

module.exports = {
  json
};
