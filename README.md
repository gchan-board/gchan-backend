# Instalation

You will need to export the following environment variables:

- NODE_ENV: either 'development' or 'production';
- DATABASE_URL: the postgres database connection string. You can leave this as `postgresql://gchan:gchan@localhost:5432/gchan` in development.
- CORS_ORIGIN_URL: the frontend web app url. You can set this to `*` in development.
- RECAPTCHA3_KEY: Google's recaptcha v3 secret key. You can leave this empty in development.
- IMGUR_CLIENT_ID: imgur's API client id. You can leave this empty in development.