# Real-Time Traffic Anomaly Detection

This project detects anomalies in HTTP traffic data in real-time. It consists of two parts:
1.  **Data Generator**: Simulates a production system writing logs to Elasticsearch.
2.  **Anomaly Detector**: Reads from Elasticsearch, detects anomalies using Isolation Forest, and visualizes results.

## Features

- **Real-Time Detection**: Reads live data from Elasticsearch.
- **Adaptive Learning**: Retrains the model periodically to adapt to changing trends.
- **Visualization**: Generates `anomaly_detection_results.png` showing traffic patterns and anomalies.

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Start Elasticsearch**:
    ```bash
    docker-compose up -d
    ```

## Usage

You will need two terminal windows.

**Terminal 1: Start the Data Generator**
This script simulates traffic and writes it to Elasticsearch index `traffic-logs`.
```bash
python generate_es_data.py
```

**Terminal 2: Start the Anomaly Detector**
This script reads from `traffic-logs`, detects anomalies, and prints them.
```bash
python realtime_anomaly_detection.py
```

## How it Works

1.  `generate_es_data.py` generates synthetic hourly data (requests, latency, errors) and indexes it into Elasticsearch.
2.  `realtime_anomaly_detection.py` polls Elasticsearch for new data points.
3.  The detector uses a sliding window to train an Isolation Forest model.
4.  Anomalies are flagged in the console and saved to a plot image.

## Key Concepts

- **Elasticsearch as Buffer**: Decouples the data source from the analysis engine.
- **Sliding Window**: Keeps the model relevant to current trends.