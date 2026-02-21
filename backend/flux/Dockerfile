FROM python:3.12-slim

WORKDIR /usr/src/flux

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y netcat-openbsd

COPY requirements.txt .
RUN pip install --default-timeout=100 --retries=5 -r requirements.txt

COPY ./entrypoint.sh .
RUN sed -i 's/\r$//g' /usr/src/flux/entrypoint.sh
RUN chmod +x /usr/src/flux/entrypoint.sh

COPY . .

ENTRYPOINT ["/usr/src/flux/entrypoint.sh"]