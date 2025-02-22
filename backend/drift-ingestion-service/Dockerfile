FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
# COPY app/translink/ app/translink/
# COPY main.py .

# CMD ["python", "main.py"]
CMD ["watchfiles", "--filter-ignore=__pycache__", "python main.py"]