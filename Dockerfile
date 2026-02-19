FROM python:3.11-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libssl-dev \
    make \
    curl && \
    rm -rf /var/lib/apt/lists/*

ARG USER_ID=1000
ARG GROUP_ID=1000
RUN addgroup --gid $GROUP_ID appgroup && \
      adduser --uid $USER_ID --gid $GROUP_ID --disabled-password --gecos "" appuser

WORKDIR /app
COPY tools/scraper/requirements.txt .
RUN pip install --no-cache-dir --disable-pip-version-check -r requirements.txt

FROM python:3.11-slim AS runtime

COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group  /etc/group
COPY --from=builder /home/appuser /home/appuser

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    libgomp1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/pip /usr/local/bin/pip
COPY --from=builder /usr/local/bin/python /usr/local/bin/python
COPY . .

USER appuser

ENV CONFIG_FILE=config.yaml \
    JOBS_DIR=jobs \
    PYTHONUNBUFFERED=1

ENTRYPOINT ["tail", "-f", "/dev/null"]
