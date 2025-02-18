FROM --platform=linux/amd64 python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY app/translink/ app/translink/
COPY main.py .

CMD ["python", "main.py"]
