FROM python:3.12-slim AS builder

ARG USER_ID=1000
ARG GROUP_ID=1000

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libssl-dev \
    jq \
    curl \
    unzip \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    addgroup --gid $GROUP_ID appgroup && \
    adduser --uid $USER_ID --gid $GROUP_ID --disabled-password --gecos "" appuser

USER appuser
WORKDIR /app

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/appuser/.bun/bin:${PATH}"

COPY --chown=appuser:appgroup . .

RUN bun install && \
    pip install --no-cache-dir --disable-pip-version-check --no-warn-script-location \
    -r tools/scraper/requirements.txt && \
    ./scripts/install.sh

FROM python:3.12-slim AS runtime

COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group  /etc/group
COPY --from=builder /home/appuser /home/appuser

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    libgomp1 \
    libstdc++6 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin/pip /usr/local/bin/pip
COPY --from=builder /usr/local/bin/python /usr/local/bin/python
COPY --from=builder /home/appuser/.bun/bin/bun /usr/local/bin/bun
COPY --chown=appuser:appgroup --from=builder /app .

USER appuser

ENV PATH="/usr/local/bin:${PATH}" \
    PYTHONUNBUFFERED=1

ENTRYPOINT ["tail", "-f", "/dev/null"]
