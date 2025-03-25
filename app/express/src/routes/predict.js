const express = require("express");
const AWS = require("aws-sdk");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const os = require("os");


const router = express.Router();
const s3 = new AWS.S3({ region: "us-east-1" });
const sagemaker = new AWS.SageMaker({ region: "us-east-1" });
//AWS.config.loadFromPath('/root/.aws/credentials');

router.get("/", async (req, res) => {
  const { lag_1, lag_2, lag_3 } = req.query;

  if (!lag_1 || !lag_2 || !lag_3) {
    return res.status(400).json({ error: "Missing lag parameters" });
  }

  const jobId = uuidv4();
  const localInputFile = path.join(os.tmpdir(), 'input-${jobId}.csv');
  console.log("📄 Writing temp CSV to:", localInputFile);
  const s3InputKey = 'batch-input/input-${jobId}.csv';
  const s3OutputPrefix = 'batch-output/output-${jobId}';

  // Write input CSV locally
  //fs.writeFileSync(localInputFile, 'lag_1,lag_2,lag_3\n${lag_1},${lag_2},${lag_3}');
  fs.writeFileSync(localInputFile, '${lag_1},${lag_2},${lag_3}');

  try {
    // Upload input file to S3
    await s3.upload({
      Bucket: "sierra-bucket-2025",
      Key: s3InputKey,
      Body: fs.createReadStream(localInputFile),
    }).promise();

    // Start batch transform job
    await sagemaker.createTransformJob({
      TransformJobName: 'esg-batch-${jobId}',
      ModelName: "esg-xgboost-model",
      MaxConcurrentTransforms: 1,
      MaxPayloadInMB: 6,
      BatchStrategy: "SingleRecord",
      TransformInput: {
        DataSource: {
          S3DataSource: {
            S3DataType: "S3Prefix",
            S3Uri: 's3://sierra-bucket-2025/${path.dirname(s3InputKey)}'
          }
        },
        ContentType: "text/csv"
      },
      TransformOutput: {
        S3OutputPath: 's3://sierra-bucket-2025/${s3OutputPrefix}'
      },
      TransformResources: {
        InstanceType: "ml.m5.large",
        InstanceCount: 1
      }
    }).promise();

    // Poll job until it's complete
    let jobStatus = "InProgress";
    while (jobStatus === "InProgress") {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const status = await sagemaker.describeTransformJob({
        TransformJobName: 'esg-batch-${jobId}'
      }).promise();
      jobStatus = status.TransformJobStatus;
    }

    if (jobStatus !== "Completed") {
      return res.status(500).json({ error: 'Transform job failed: ${jobStatus}' });
    }

    // Download result from S3
    //const outputKey = '${s3OutputPrefix}/input-${jobId}.csv.out';
    

    const outputFiles = await s3.listObjectsV2({
        Bucket: "sierra-bucket-2025",
        Prefix: s3OutputPrefix + "/"
      }).promise();
      
      const outputKey = outputFiles.Contents.find(obj => obj.Key.endsWith(".csv.out"))?.Key;
      console.log("🔎 Trying to download from S3:", outputKey);

      if (!outputKey) {
        return res.status(404).json({ error: "Output file not found yet in S3." });
      }
      
    const result = await s3.getObject({
      Bucket: "sierra-bucket-2025",
      Key: outputKey
    }).promise();

    const prediction = result.Body.toString().trim();
    res.json({ prediction: parseFloat(prediction) });

  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ error: "Failed to get prediction from batch transform" });
  /**} finally {
    // Cleanup (optional)
    try {
      fs.unlinkSync(localInputFile);
    } catch (e) {}*/
  }
});

module.exports = router;
