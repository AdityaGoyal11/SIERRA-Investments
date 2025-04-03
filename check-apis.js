const fetch = require('node-fetch');

const endpointsEnv = process.env.ENDPOINTS;

if (!endpointsEnv) {
  console.error("No ENDPOINTS environment variable provided.");
  process.exit(1);
}

const endpoints = endpointsEnv.split(',').map((url) => url.trim());

(async () => {
  console.log("Checking API endpoints...\n");

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      const status = res.status;

      if (status === 200) {
        console.log('${url} responded with status 200.');
      } else {
        console.error('${url} responded with status ${status}.');
        process.exit(1);
      }
    } catch (err) {
      console.error('Error reaching ${url}: ${err.message}');
      process.exit(1);
    }
  }

  console.log("\n All API endpoints are healthy. Proceeding to deploy.");
})();
