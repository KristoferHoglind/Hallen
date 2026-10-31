# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS frontend
WORKDIR /src/frontend
COPY frontend/hallen-app/package*.json ./
RUN npm ci
COPY frontend/hallen-app/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS backend
WORKDIR /src
COPY backend/ ./backend/
RUN dotnet restore backend/Hallen.Api/Hallen.Api.csproj
RUN dotnet publish backend/Hallen.Api/Hallen.Api.csproj -c Release --no-restore -o /out /p:UseAppHost=false
COPY --from=frontend /src/frontend/dist/ /out/wwwroot/

FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime
# Supabase's pooler uses a private CA not included in Debian's public CA bundle.
# Install the public trust anchor while preserving full hostname verification.
COPY deploy/certificates/supabase-root-2021.crt /usr/local/share/ca-certificates/supabase-root-2021.crt
RUN update-ca-certificates
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_HTTP_PORTS=10000
EXPOSE 10000
COPY --from=backend --chown=app:app /out/ ./
USER app
ENTRYPOINT ["dotnet", "Hallen.Api.dll"]
