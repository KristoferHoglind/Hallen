FROM postgres:17-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends age && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["bash"]
