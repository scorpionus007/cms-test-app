const logOnboarding = (event, data) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, event, ...data }));
};

module.exports = { logOnboarding };
