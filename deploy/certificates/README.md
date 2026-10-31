# Supabase pooler CA

`supabase-root-2021.crt` is Supabase's **public root CA certificate**. It is not a
private key, client certificate, or credential. It is deliberately allowed by
`.gitignore` and `.dockerignore`; other certificate and private-key files remain
excluded.

Source (retrieved over HTTPS):
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

SHA-256 certificate fingerprint:

```text
80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA
```

The Docker runtime installs this CA into Debian's trust store using
`update-ca-certificates`. Npgsql keeps `SSL Mode=VerifyFull`, so both the certificate
chain and pooler hostname must match. No certificate-validation callback is bypassed.

Reference: [Supabase SSL enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement).
If Supabase rotates its root CA, obtain the replacement from the Supabase dashboard
or authenticated official download channel and verify its fingerprint before
replacing this file and rebuilding the image. Do not trust a CA solely because an
unverified database server presented it.

A credential-free live TLS check can be run after building the Docker image:

```bash
docker run --rm --entrypoint openssl hallen:demo s_client \
  -starttls postgres \
  -connect aws-0-eu-west-1.pooler.supabase.com:5432 \
  -servername aws-0-eu-west-1.pooler.supabase.com \
  -verify_hostname aws-0-eu-west-1.pooler.supabase.com \
  -verify_return_error </dev/null
```

Expected: `Verify return code: 0 (ok)`. A wrong hostname must still fail.
