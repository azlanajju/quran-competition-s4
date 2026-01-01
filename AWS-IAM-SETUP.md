# AWS IAM Permissions Setup

## Problem

The IAM user `qirat-storage-user` doesn't have permission to upload files to S3 bucket `qirat-media-bucket`.

## Solution: Add IAM Policy

You need to attach a policy to your IAM user that allows S3 operations.

### Step 1: Go to AWS IAM Console

1. Log in to AWS Console
2. Navigate to **IAM** → **Users**
3. Find and click on `qirat-storage-user`

### Step 2: Attach Policy

**Option A: Use AWS Managed Policy (Easiest)**

1. Click **Add permissions** → **Attach policies directly**
2. Search for `AmazonS3FullAccess`
3. Select it and click **Add permissions**

**Option B: Create Custom Policy (Recommended for Security)**

1. Click **Add permissions** → **Create inline policy**
2. Click **JSON** tab
3. Paste the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::qirat-media-bucket", "arn:aws:s3:::qirat-media-bucket/*"]
    }
  ]
}
```

4. Click **Next**
5. Name the policy: `qirat-media-bucket-access`
6. Click **Create policy**

### Step 3: Verify Permissions

The policy should allow:

- `s3:PutObject` - Upload files
- `s3:GetObject` - Download/read files
- `s3:DeleteObject` - Delete files (optional)
- `s3:ListBucket` - List bucket contents (optional)

### Step 4: Test

After adding the policy, try uploading a file again. The error should be resolved.

## Alternative: Bucket Policy

If you prefer to use a bucket policy instead of IAM user policy:

1. Go to **S3** → Select `qirat-media-bucket`
2. Go to **Permissions** tab
3. Scroll to **Bucket policy**
4. Add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPutObject",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::637703784751:user/qirat-storage-user"
      },
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::qirat-media-bucket/*"
    },
    {
      "Sid": "AllowListBucket",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::637703784751:user/qirat-storage-user"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::qirat-media-bucket"
    }
  ]
}
```

## Security Best Practices

For production, use the custom policy (Option B) with only the permissions you need:

- Remove `s3:DeleteObject` if you don't need deletion
- Remove `s3:ListBucket` if you don't need listing
- Consider restricting to specific prefixes (folders) if needed

Example restricted policy (only allow uploads to specific folders):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": ["arn:aws:s3:::qirat-media-bucket/student-id-cards/*", "arn:aws:s3:::qirat-media-bucket/student-videos/*"]
    }
  ]
}
```
