# Logzio Shipper

We developed this to _ship_ logs from Amazon Cloudwatch to the [Logzio](https://logz.io/)
ELK stack. How does this work? It's actually quite simple ...

## Getting Started

1. Ensure you have the Serverless Framework installed (or upgrade to latest):

   ```sh
   # yarn
   yarn global add serverless
   # npm
   npm install -g serverless
   ```

2. Go to your serverless repo's root directory
3. Install Logzio Shipper:

   ```sh
   # yarn
   yarn add logzio-shipper
   # npm
   npm install --save logzio-shipper
   ```
