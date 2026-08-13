# Authentication security configuration

The API now fails startup unless all of these values are present:

- `JWT_ACCESS_SECRET`: at least 32 characters
- `JWT_REFRESH_SECRET`: at least 32 characters and different from the access secret
- `JWT_ISSUER`: expected JWT issuer
- `JWT_AUDIENCE`: expected JWT audience
- `OTP_PEPPER`: at least 32 characters, used to HMAC OTP values before Redis storage

Only `ACTIVE` users can obtain or refresh sessions. Registration creates the
schema-default `PENDING` account and does not return tokens.

OTP delivery is intentionally unavailable by default. A production SMS adapter
must implement `OtpDeliveryProvider` and replace `OTP_DELIVERY_PROVIDER`; the API
does not return or log development OTP codes.

## Refresh replay limitation

The current schema has no refresh-token family identifier. Reuse of a known,
revoked refresh token therefore revokes every active refresh token belonging to
that user. A token that is absent from the database cannot be attributed to a
user and cannot trigger user-wide revocation. Token-family-specific containment
would require an approved Prisma schema change.

## Throttling limitation

Authentication routes use active Nest throttler guards with route-specific
limits. The configured throttler storage is process-local, so deployments with
multiple API replicas must add a shared throttler storage adapter to enforce one
aggregate IP limit across replicas. OTP cooldowns and attempts are Redis-backed.
